import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

type Decimal = Prisma.Decimal;
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { CacheTTL, ProductKeys } from '../../common/cache-keys';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(dec: Decimal | null | undefined): number | null {
  return dec != null ? dec.toNumber() : null;
}

function serialise(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Prisma.Decimal.isDecimal(obj)) return (obj as Decimal).toNumber();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serialise);
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, serialise(v)]),
    );
  }
  return obj;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── list ─────────────────────────────────────────────────────────────────

  async list(tenant: TenantContext, dto: ListProductsDto) {
    const { firmId } = tenant;
    const limit = dto.limit ?? 20;

    const where: Prisma.ProductWhereInput = { firmId, deletedAt: null };

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { itemCode: { contains: dto.search, mode: 'insensitive' } },
        { hsnCode: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    // Alphabetical keyset pagination
    if (dto.afterName && dto.afterId) {
      where.AND = [
        {
          OR: [
            { name: { gt: dto.afterName } },
            { name: { equals: dto.afterName }, id: { gt: BigInt(dto.afterId) } },
          ],
        },
      ];
    }

    const rows = await this.prisma.product.findMany({
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        rate: true,
        unit: true,
        gstPct: true,
        itemCode: true,
        hsnCode: true,
        description: true,
      },
    });

    const data = rows.map((p) => ({
      id: p.id.toString(),
      name: p.name,
      rate: toNum(p.rate),
      unit: p.unit,
      gstPct: p.gstPct,
      itemCode: p.itemCode,
      hsnCode: p.hsnCode,
      description: p.description,
    }));

    return { data, hasMore: rows.length === limit };
  }

  // ── dropdown ─────────────────────────────────────────────────────────────
  // Minimal projection used by bill / challan form product pickers.
  // Auto-fills: rate, unit, gstPct, itemCode, hsnCode on product selection.

  async dropdown(tenant: TenantContext) {
    const { firmId } = tenant;
    const cacheKey = ProductKeys.dropdown(firmId);
    const cached = await this.redis.get<unknown[]>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.product.findMany({
      where: { firmId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        rate: true,
        unit: true,
        gstPct: true,
        itemCode: true,
        hsnCode: true,
      },
    });

    const result = rows.map((p) => ({
      id: p.id.toString(),
      name: p.name,
      rate: toNum(p.rate),
      unit: p.unit,
      gstPct: p.gstPct,
      itemCode: p.itemCode,
      hsnCode: p.hsnCode,
    }));

    await this.redis.set(cacheKey, result, CacheTTL.PRODUCT_SEARCH);
    return result;
  }

  // ── create ───────────────────────────────────────────────────────────────

  async create(tenant: TenantContext, dto: CreateProductDto) {
    const { accountId, firmId } = tenant;

    const existing = await this.prisma.product.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' }, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Product "${dto.name}" already exists in this firm`);
    }

    const product = await this.prisma.product.create({
      data: {
        accountId,
        firmId,
        name: dto.name,
        rate: dto.rate != null ? new Prisma.Decimal(dto.rate) : null,
        unit: dto.unit,
        gstPct: dto.gstPct ?? null,
        itemCode: dto.itemCode ?? null,
        hsnCode: dto.hsnCode ?? null,
        description: dto.description ?? null,
      },
    });

    await this.invalidateCaches(firmId, product.id);
    return serialise(product);
  }

  // ── findOne ──────────────────────────────────────────────────────────────

  async findOne(tenant: TenantContext, id: bigint) {
    const cacheKey = ProductKeys.detail(id);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

    const result = serialise(product);
    await this.redis.set(cacheKey, result, CacheTTL.PRODUCT_SEARCH);
    return result;
  }

  // ── update ───────────────────────────────────────────────────────────────

  async update(tenant: TenantContext, id: bigint, dto: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.name) {
      const dup = await this.prisma.product.findFirst({
        where: {
          firmId: tenant.firmId,
          name: { equals: dto.name, mode: 'insensitive' },
          deletedAt: null,
          NOT: { id },
        },
        select: { id: true },
      });
      if (dup) throw new ConflictException(`Product "${dto.name}" already exists in this firm`);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.rate !== undefined && {
          rate: dto.rate != null ? new Prisma.Decimal(dto.rate) : null,
        }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.gstPct !== undefined && { gstPct: dto.gstPct ?? null }),
        ...(dto.itemCode !== undefined && { itemCode: dto.itemCode ?? null }),
        ...(dto.hsnCode !== undefined && { hsnCode: dto.hsnCode ?? null }),
        ...(dto.description !== undefined && { description: dto.description ?? null }),
      },
    });

    await this.invalidateCaches(tenant.firmId, id);
    return serialise(updated);
  }

  // ── remove ───────────────────────────────────────────────────────────────

  async remove(tenant: TenantContext, id: bigint) {
    const product = await this.prisma.product.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Block deletion if the product appears on any bill or challan
    const [salesCount, purchaseCount, dcCount] = await Promise.all([
      this.prisma.salesBillItem.count({ where: { productId: id } }),
      this.prisma.purchaseBillItem.count({ where: { productId: id } }),
      this.prisma.deliveryChallanItem.count({ where: { productId: id } }),
    ]);
    if (salesCount > 0 || purchaseCount > 0 || dcCount > 0) {
      throw new BadRequestException(
        'Cannot delete a product that has been used in bills or challans',
      );
    }

    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.invalidateCaches(tenant.firmId, id);
    return { success: true };
  }

  // ── cache invalidation ────────────────────────────────────────────────────

  private async invalidateCaches(firmId: bigint, productId: bigint) {
    await this.redis.del(
      ProductKeys.detail(productId),
      ProductKeys.list(firmId),
      ProductKeys.dropdown(firmId),
    );
  }
}
