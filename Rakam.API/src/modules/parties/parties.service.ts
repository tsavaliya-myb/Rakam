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
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { ListPartiesDto } from './dto/list-parties.dto';
import { CacheTTL, PartyKeys } from '../../common/cache-keys';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
export class PartiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── list ─────────────────────────────────────────────────────────────────

  async list(tenant: TenantContext, dto: ListPartiesDto) {
    const { firmId } = tenant;
    const limit = dto.limit ?? 20;

    const where: Prisma.PartyWhereInput = { firmId, deletedAt: null };

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { gstNo: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    // Alphabetical keyset pagination: after (name, id)
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

    const rows = await this.prisma.party.findMany({
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        gstNo: true,
        panNo: true,
        contactNumber: true,
        state: true,
        city: true,
        balanceCached: true,
        defaultDiscountPct: true,
        defaultDueDays: true,
      },
    });

    const data = rows.map((p) => ({
      id: p.id.toString(),
      name: p.name,
      gstNo: p.gstNo,
      panNo: p.panNo,
      contactNumber: p.contactNumber,
      state: p.state,
      city: p.city,
      balance: toNum(p.balanceCached),
      defaultDiscountPct: toNum(p.defaultDiscountPct),
      defaultDueDays: p.defaultDueDays,
    }));

    return { data, hasMore: rows.length === limit };
  }

  // ── dropdown ─────────────────────────────────────────────────────────────
  // Minimal projection for bill/challan/payment form dropdowns.

  async dropdown(tenant: TenantContext) {
    const { firmId } = tenant;
    const cacheKey = PartyKeys.dropdown(firmId);
    const cached = await this.redis.get<unknown[]>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.party.findMany({
      where: { firmId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        gstNo: true,
        state: true,
        defaultDiscountPct: true,
        defaultDueDays: true,
        brokerName: true,
        brokerMobile: true,
      },
    });

    const result = rows.map((p) => ({
      id: p.id.toString(),
      name: p.name,
      gstNo: p.gstNo,
      state: p.state,
      defaultDiscountPct: toNum(p.defaultDiscountPct),
      defaultDueDays: p.defaultDueDays,
      brokerName: p.brokerName,
      brokerMobile: p.brokerMobile,
    }));

    await this.redis.set(cacheKey, result, CacheTTL.PARTY_SEARCH);
    return result;
  }

  // ── create ───────────────────────────────────────────────────────────────

  async create(tenant: TenantContext, dto: CreatePartyDto) {
    const { accountId, firmId } = tenant;

    const existing = await this.prisma.party.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' }, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Party "${dto.name}" already exists in this firm`);
    }

    const party = await this.prisma.party.create({
      data: {
        accountId,
        firmId,
        name: dto.name,
        ownerName: dto.ownerName ?? null,
        gstNo: dto.gstNo ?? null,
        panNo: dto.panNo ?? null,
        address: dto.address ?? null,
        state: dto.state ?? null,
        city: dto.city ?? null,
        pincode: dto.pincode ?? null,
        contactNumber: dto.contactNumber ?? null,
        defaultDiscountPct: dto.defaultDiscountPct ?? 0,
        defaultDueDays: dto.defaultDueDays ?? 45,
        brokerName: dto.brokerName ?? null,
        brokerMobile: dto.brokerMobile ?? null,
      },
    });

    await this.invalidateCaches(firmId, party.id);
    return serialise(await this.findOne(tenant, party.id));
  }

  // ── findOne ──────────────────────────────────────────────────────────────

  async findOne(tenant: TenantContext, id: bigint) {
    const cacheKey = PartyKeys.detail(id);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const party = await this.prisma.party.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
    });
    if (!party) throw new NotFoundException('Party not found');

    const result = serialise(party);
    await this.redis.set(cacheKey, result, CacheTTL.PARTY_SEARCH);
    return result;
  }

  // ── update ───────────────────────────────────────────────────────────────

  async update(tenant: TenantContext, id: bigint, dto: UpdatePartyDto) {
    const party = await this.prisma.party.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
      select: { id: true },
    });
    if (!party) throw new NotFoundException('Party not found');

    if (dto.name) {
      const dup = await this.prisma.party.findFirst({
        where: {
          firmId: tenant.firmId,
          name: { equals: dto.name, mode: 'insensitive' },
          deletedAt: null,
          NOT: { id },
        },
        select: { id: true },
      });
      if (dup) throw new ConflictException(`Party "${dto.name}" already exists in this firm`);
    }

    const updated = await this.prisma.party.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.ownerName !== undefined && { ownerName: dto.ownerName }),
        ...(dto.gstNo !== undefined && { gstNo: dto.gstNo || null }),
        ...(dto.panNo !== undefined && { panNo: dto.panNo || null }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode }),
        ...(dto.contactNumber !== undefined && { contactNumber: dto.contactNumber }),
        ...(dto.defaultDiscountPct !== undefined && { defaultDiscountPct: dto.defaultDiscountPct }),
        ...(dto.defaultDueDays !== undefined && { defaultDueDays: dto.defaultDueDays }),
        ...(dto.brokerName !== undefined && { brokerName: dto.brokerName }),
        ...(dto.brokerMobile !== undefined && { brokerMobile: dto.brokerMobile }),
      },
    });

    await this.invalidateCaches(tenant.firmId, id);
    return serialise(updated);
  }

  // ── remove ───────────────────────────────────────────────────────────────

  async remove(tenant: TenantContext, id: bigint) {
    const party = await this.prisma.party.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
      select: { id: true },
    });
    if (!party) throw new NotFoundException('Party not found');

    // Block deletion if any bills exist (paid or unpaid)
    const [salesCount, purchaseCount] = await Promise.all([
      this.prisma.salesBill.count({ where: { partyId: id, deletedAt: null } }),
      this.prisma.purchaseBill.count({ where: { partyId: id, deletedAt: null } }),
    ]);
    if (salesCount > 0 || purchaseCount > 0) {
      throw new BadRequestException(
        'Cannot delete a party that has bills associated with it',
      );
    }

    await this.prisma.party.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.invalidateCaches(tenant.firmId, id);
    return { success: true };
  }

  // ── getBalance ────────────────────────────────────────────────────────────
  // Computes the current outstanding balance for a party from live data,
  // updates balanceCached, and returns the result.

  async getBalance(tenant: TenantContext, id: bigint) {
    const { firmId, fy } = tenant;

    const party = await this.prisma.party.findFirst({
      where: { id, firmId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!party) throw new NotFoundException('Party not found');

    const [salesAgg, purchaseAgg] = await Promise.all([
      this.prisma.salesBill.aggregate({
        where: { partyId: id, firmId, fy, deletedAt: null },
        _sum: { pendingAmount: true },
      }),
      this.prisma.purchaseBill.aggregate({
        where: { partyId: id, firmId, fy, deletedAt: null },
        _sum: { pendingAmount: true },
      }),
    ]);

    const salesPending = salesAgg._sum.pendingAmount?.toNumber() ?? 0;
    const purchasePending = purchaseAgg._sum.pendingAmount?.toNumber() ?? 0;

    // Positive = we receive (sales outstanding > purchase outstanding)
    // Negative = we pay
    const balance = salesPending - purchasePending;

    // Update cached balance on the party row
    await this.prisma.party.update({
      where: { id },
      data: { balanceCached: new Prisma.Decimal(balance) },
    });

    await this.redis.del(
      PartyKeys.detail(id),
      PartyKeys.outstanding(firmId, id),
      PartyKeys.dropdown(firmId),
    );

    return {
      partyId: id.toString(),
      name: party.name,
      salesPending,
      purchasePending,
      balance,
      direction: balance >= 0 ? 'RECEIVE' : 'PAY',
    };
  }

  // ── cache invalidation ────────────────────────────────────────────────────

  private async invalidateCaches(firmId: bigint, partyId: bigint) {
    await this.redis.del(
      PartyKeys.detail(partyId),
      PartyKeys.list(firmId),
      PartyKeys.dropdown(firmId),
      PartyKeys.outstanding(firmId, partyId),
    );
  }
}
