import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

type Decimal = Prisma.Decimal;
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { CreateDeliveryChallanDto } from './dto/create-delivery-challan.dto';
import { UpdateDeliveryChallanDto } from './dto/update-delivery-challan.dto';
import { ListDeliveryChallansDto } from './dto/list-delivery-challans.dto';
import {
  CacheTTL,
  DashboardKeys,
  DeliveryChallanKeys,
  ReportKeys,
  SalesBillKeys,
} from '../../common/cache-keys';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function d(n: number | string): Decimal {
  return new Prisma.Decimal(n);
}

function toNum(dec: Decimal | null | undefined): number {
  return dec ? dec.toNumber() : 0;
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
export class DeliveryChallansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── list ─────────────────────────────────────────────────────────────────

  async list(tenant: TenantContext, dto: ListDeliveryChallansDto) {
    const { firmId, fy } = tenant;
    const limit = dto.limit ?? 20;

    const where: Prisma.DeliveryChallanWhereInput = {
      firmId,
      fy,
      deletedAt: null,
    };

    if (dto.partyId) where.partyId = BigInt(dto.partyId);
    if (dto.converted === true) where.salesBillId = { not: null };
    if (dto.converted === false) where.salesBillId = null;
    if (dto.fromDate || dto.toDate) {
      where.dcDate = {
        ...(dto.fromDate && { gte: new Date(dto.fromDate) }),
        ...(dto.toDate && { lte: new Date(dto.toDate) }),
      };
    }
    if (dto.search) {
      where.OR = [
        { dcNoDisplay: { contains: dto.search, mode: 'insensitive' } },
        { party: { name: { contains: dto.search, mode: 'insensitive' } } },
      ];
    }

    if (dto.afterDate && dto.afterId) {
      where.AND = [
        {
          OR: [
            { dcDate: { lt: new Date(dto.afterDate) } },
            {
              dcDate: { equals: new Date(dto.afterDate) },
              id: { lt: BigInt(dto.afterId) },
            },
          ],
        },
      ];
    }

    const rows = await this.prisma.deliveryChallan.findMany({
      where,
      orderBy: [{ dcDate: 'desc' }, { id: 'desc' }],
      take: limit,
      include: {
        party: { select: { id: true, name: true } },
        salesBill: { select: { id: true, billNoDisplay: true } },
      },
    });

    const data = rows.map((dc) => ({
      id: dc.id.toString(),
      dcDate: dc.dcDate,
      dcNoDisplay: dc.dcNoDisplay,
      party: { id: dc.party.id.toString(), name: dc.party.name },
      salesBillCreated: dc.salesBillId !== null,
      salesBillNo: dc.salesBill?.billNoDisplay ?? null,
      salesBillId: dc.salesBillId?.toString() ?? null,
      totalQty: toNum(dc.totalQty),
    }));

    return { data, hasMore: rows.length === limit };
  }

  // ── create ───────────────────────────────────────────────────────────────

  async create(tenant: TenantContext, userId: bigint, dto: CreateDeliveryChallanDto) {
    const { accountId, firmId, fy } = tenant;

    const party = await this.prisma.party.findFirst({
      where: { id: BigInt(dto.partyId), firmId, deletedAt: null },
      select: { id: true },
    });
    if (!party) throw new NotFoundException('Party not found');

    const dcNoSeq = await this.allocateDcNoSeq(firmId, fy);
    const dcNoDisplay = String(dcNoSeq);

    const dcDate = dto.dcDate ? new Date(dto.dcDate) : new Date();

    // Compute totals
    const totalQty = dto.items.reduce((s, i) => s.plus(d(i.qty)), d(0));
    const netAmount = dto.items.reduce((s, i) => s.plus(d(i.qty).mul(d(i.rate))), d(0));

    const dc = await this.prisma.$transaction(async (tx) => {
      const created = await tx.deliveryChallan.create({
        data: {
          accountId,
          firmId,
          fy,
          partyId: BigInt(dto.partyId),
          dcNoSeq,
          dcNoDisplay,
          dcDate,
          noChallan: dto.noChallan ?? false,
          partyChallanNo: dto.partyChallanNo ?? null,
          partyChallanDate: dto.partyChallanDate ? new Date(dto.partyChallanDate) : null,
          remarks: dto.remarks ?? null,
          totalQty,
          netAmount,
          totalAmount: netAmount,
          createdBy: userId,
        },
      });

      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        const amount = d(itemDto.qty).mul(d(itemDto.rate));

        let productSnapshot: string | null = null;
        if (itemDto.productId) {
          const prod = await tx.product.findUnique({
            where: { id: BigInt(itemDto.productId) },
            select: { name: true },
          });
          productSnapshot = prod?.name ?? null;
        }

        await tx.deliveryChallanItem.create({
          data: {
            deliveryChallanId: created.id,
            productId: itemDto.productId ? BigInt(itemDto.productId) : null,
            productNameSnapshot: productSnapshot,
            itemCode: itemDto.itemCode ?? null,
            hsnCode: itemDto.hsnCode ?? null,
            qty: d(itemDto.qty),
            unit: itemDto.unit,
            rate: d(itemDto.rate),
            amount,
            lineNo: i + 1,
          },
        });
      }

      return created;
    });

    await this.invalidateCaches(firmId, fy, dc.id, BigInt(dto.partyId));
    return serialise(await this.findOne(tenant, dc.id));
  }

  // ── findOne ──────────────────────────────────────────────────────────────

  async findOne(tenant: TenantContext, id: bigint) {
    const cacheKey = DeliveryChallanKeys.detail(id);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const dc = await this.prisma.deliveryChallan.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
      include: {
        party: {
          select: { id: true, name: true, address: true, state: true, city: true },
        },
        items: {
          orderBy: { lineNo: 'asc' },
          include: { product: { select: { id: true, name: true } } },
        },
        salesBill: { select: { id: true, billNoDisplay: true } },
      },
    });
    if (!dc) throw new NotFoundException('Delivery challan not found');

    const result = serialise(dc);
    await this.redis.set(cacheKey, result, CacheTTL.BILL_DETAIL);
    return result;
  }

  // ── update ───────────────────────────────────────────────────────────────

  async update(tenant: TenantContext, id: bigint, dto: UpdateDeliveryChallanDto) {
    const dc = await this.prisma.deliveryChallan.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
    });
    if (!dc) throw new NotFoundException('Delivery challan not found');
    if (dc.salesBillId !== null) {
      throw new BadRequestException(
        'Cannot edit a delivery challan that has been converted to a sales bill',
      );
    }

    const newPartyId = dto.partyId ? BigInt(dto.partyId) : dc.partyId;

    const itemsToProcess = dto.items;
    if (!itemsToProcess?.length) {
      // Metadata-only update
      const dcDate = dto.dcDate ? new Date(dto.dcDate) : dc.dcDate;
      await this.prisma.deliveryChallan.update({
        where: { id },
        data: {
          ...(dto.partyId && { partyId: newPartyId }),
          ...(dto.dcDate && { dcDate }),
          ...(dto.noChallan !== undefined && { noChallan: dto.noChallan }),
          ...(dto.partyChallanNo !== undefined && { partyChallanNo: dto.partyChallanNo }),
          ...(dto.partyChallanDate !== undefined && {
            partyChallanDate: dto.partyChallanDate ? new Date(dto.partyChallanDate) : null,
          }),
          ...(dto.remarks !== undefined && { remarks: dto.remarks }),
        },
      });
    } else {
      const totalQty = itemsToProcess.reduce((s, i) => s.plus(d(i.qty!)), d(0));
      const netAmount = itemsToProcess.reduce(
        (s, i) => s.plus(d(i.qty!).mul(d(i.rate!))),
        d(0),
      );
      const dcDate = dto.dcDate ? new Date(dto.dcDate) : dc.dcDate;

      await this.prisma.$transaction(async (tx) => {
        await tx.deliveryChallanItem.deleteMany({ where: { deliveryChallanId: id } });

        await tx.deliveryChallan.update({
          where: { id },
          data: {
            ...(dto.partyId && { partyId: newPartyId }),
            ...(dto.dcDate && { dcDate }),
            ...(dto.noChallan !== undefined && { noChallan: dto.noChallan }),
            ...(dto.partyChallanNo !== undefined && { partyChallanNo: dto.partyChallanNo }),
            ...(dto.partyChallanDate !== undefined && {
              partyChallanDate: dto.partyChallanDate ? new Date(dto.partyChallanDate) : null,
            }),
            ...(dto.remarks !== undefined && { remarks: dto.remarks }),
            totalQty,
            netAmount,
            totalAmount: netAmount,
          },
        });

        for (let i = 0; i < itemsToProcess.length; i++) {
          const itemDto = itemsToProcess[i];
          const amount = d(itemDto.qty!).mul(d(itemDto.rate!));

          let productSnapshot: string | null = null;
          if (itemDto.productId) {
            const prod = await tx.product.findUnique({
              where: { id: BigInt(itemDto.productId) },
              select: { name: true },
            });
            productSnapshot = prod?.name ?? null;
          }

          await tx.deliveryChallanItem.create({
            data: {
              deliveryChallanId: id,
              productId: itemDto.productId ? BigInt(itemDto.productId) : null,
              productNameSnapshot: productSnapshot,
              itemCode: itemDto.itemCode ?? null,
              hsnCode: itemDto.hsnCode ?? null,
              qty: d(itemDto.qty!),
              unit: itemDto.unit!,
              rate: d(itemDto.rate!),
              amount,
              lineNo: i + 1,
            },
          });
        }
      });
    }

    await this.invalidateCaches(tenant.firmId, tenant.fy, id, newPartyId);
    return serialise(await this.findOne(tenant, id));
  }

  // ── remove ───────────────────────────────────────────────────────────────

  async remove(tenant: TenantContext, id: bigint) {
    const dc = await this.prisma.deliveryChallan.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
      select: { id: true, partyId: true, salesBillId: true },
    });
    if (!dc) throw new NotFoundException('Delivery challan not found');
    if (dc.salesBillId !== null) {
      throw new BadRequestException(
        'Cannot delete a delivery challan that has been converted to a sales bill',
      );
    }

    await this.prisma.deliveryChallan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.invalidateCaches(tenant.firmId, tenant.fy, id, dc.partyId);
    return { success: true };
  }

  // ── getNextDcNo ──────────────────────────────────────────────────────────

  async getNextDcNo(tenant: TenantContext) {
    const { firmId, fy } = tenant;
    const cacheKey = DeliveryChallanKeys.nextNo(firmId, fy);
    const cached = await this.redis.get<number>(cacheKey);
    if (cached !== null) return { nextSeq: cached, display: String(cached) };

    const last = await this.prisma.deliveryChallan.findFirst({
      where: { firmId, fy, deletedAt: null },
      orderBy: { dcNoSeq: 'desc' },
      select: { dcNoSeq: true },
    });
    const nextSeq = (last?.dcNoSeq ?? 0) + 1;
    await this.redis.set(cacheKey, nextSeq, CacheTTL.BILL_NEXT_NO);
    return { nextSeq, display: String(nextSeq) };
  }

  // ── verifyExists (for PDF enqueue) ────────────────────────────────────────

  async verifyExists(firmId: bigint, id: bigint): Promise<void> {
    const dc = await this.prisma.deliveryChallan.findFirst({
      where: { id, firmId, deletedAt: null },
      select: { id: true },
    });
    if (!dc) throw new NotFoundException('Delivery challan not found');
  }

  // ── allocateDcNoSeq ──────────────────────────────────────────────────────

  private async allocateDcNoSeq(firmId: bigint, fy: number): Promise<number> {
    const last = await this.prisma.deliveryChallan.findFirst({
      where: { firmId, fy },
      orderBy: { dcNoSeq: 'desc' },
      select: { dcNoSeq: true },
    });
    return (last?.dcNoSeq ?? 0) + 1;
  }

  // ── cache invalidation ───────────────────────────────────────────────────

  private async invalidateCaches(
    firmId: bigint,
    fy: number,
    dcId: bigint,
    _partyId: bigint,
  ) {
    await this.redis.del(
      DeliveryChallanKeys.detail(dcId),
      DeliveryChallanKeys.nextNo(firmId, fy),
      DeliveryChallanKeys.unbilled(firmId),
      DashboardKeys.kpi(firmId, fy),
      SalesBillKeys.totals(firmId, fy),
      ReportKeys.deliveryChallan(firmId, fy),
    );
    await Promise.all([
      this.redis.invalidatePattern(DeliveryChallanKeys.pdfPattern(dcId)),
      this.redis.invalidatePattern(ReportKeys.salesPattern(firmId, fy)),
    ]);
  }
}
