import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type Decimal = Prisma.Decimal;
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';
import { GlobalSearchDto } from './dto/global-search.dto';
import { CacheTTL, DashboardKeys } from '../../common/cache-keys';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(dec: Decimal | null | undefined): number {
  return dec ? dec.toNumber() : 0;
}

/** Indian FY: fy=2026 → 01 Apr 2026 – 31 Mar 2027 */
function fyDateRange(fy: number): { start: Date; end: Date } {
  return {
    start: new Date(`${fy}-04-01T00:00:00.000Z`),
    end:   new Date(`${fy + 1}-03-31T23:59:59.999Z`),
  };
}

/** Compact discriminator for per-filter cache keys. */
function filterKey(dto: DashboardFiltersDto): string {
  return `${dto.partyId ?? ''}|${dto.startDate ?? ''}|${dto.endDate ?? ''}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── KPI tiles ─────────────────────────────────────────────────────────────
  // Returns: sales{total,count}, purchase{total,count},
  //          expense{total,count}, income{total,count}

  async kpi(tenant: TenantContext, dto: DashboardFiltersDto) {
    const { firmId, fy } = tenant;
    const cacheKey = `${DashboardKeys.kpi(firmId, fy)}:${filterKey(dto)}`;

    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const { start, end } = this.resolveDates(dto, fy);
    const partyId = dto.partyId ? BigInt(dto.partyId) : undefined;
    const dateFilter = { gte: start, lte: end };

    const [salesAgg, purchaseAgg, expenseAgg, incomeAgg] = await Promise.all([
      this.prisma.salesBill.aggregate({
        where: {
          firmId, fy, deletedAt: null,
          ...(partyId && { partyId }),
          billDate: dateFilter,
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.purchaseBill.aggregate({
        where: {
          firmId, fy, deletedAt: null,
          ...(partyId && { partyId }),
          billDate: dateFilter,
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.expense.aggregate({
        where: { firmId, fy, deletedAt: null, expenseDate: dateFilter },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.income.aggregate({
        where: { firmId, fy, deletedAt: null, incomeDate: dateFilter },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const result = {
      sales:    { total: toNum(salesAgg._sum.totalAmount),   count: salesAgg._count.id },
      purchase: { total: toNum(purchaseAgg._sum.totalAmount), count: purchaseAgg._count.id },
      expense:  { total: toNum(expenseAgg._sum.amount),      count: expenseAgg._count.id },
      income:   { total: toNum(incomeAgg._sum.amount),       count: incomeAgg._count.id },
    };

    await this.redis.set(cacheKey, result, CacheTTL.DASHBOARD);
    return result;
  }

  // ── Sales bar chart (party-wise) ─────────────────────────────────────────
  // Columns: partyName | totalTurnOver | receivedAmount | pendingAmount

  async salesChart(tenant: TenantContext, dto: DashboardFiltersDto) {
    const { firmId, fy } = tenant;
    const cacheKey = `${DashboardKeys.salesChart(firmId, fy)}:${filterKey(dto)}`;

    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const { start, end } = this.resolveDates(dto, fy);
    const partyId = dto.partyId ? BigInt(dto.partyId) : undefined;

    const grouped = await this.prisma.salesBill.groupBy({
      by: ['partyId'],
      where: {
        firmId, fy, deletedAt: null,
        ...(partyId && { partyId }),
        billDate: { gte: start, lte: end },
      },
      _sum: { totalAmount: true, paidAmount: true, pendingAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 50,
    });

    const partyNames = await this.resolvePartyNames(grouped.map((r) => r.partyId));

    const data = grouped.map((r) => ({
      partyId:        r.partyId.toString(),
      partyName:      partyNames.get(r.partyId.toString()) ?? 'Unknown',
      totalTurnOver:  toNum(r._sum.totalAmount),
      receivedAmount: toNum(r._sum.paidAmount),
      pendingAmount:  toNum(r._sum.pendingAmount),
    }));

    await this.redis.set(cacheKey, data, CacheTTL.DASHBOARD);
    return data;
  }

  // ── Purchase bar chart (party-wise) ──────────────────────────────────────
  // Columns: partyName | totalTurnOver | paidAmount | pendingAmount

  async purchaseChart(tenant: TenantContext, dto: DashboardFiltersDto) {
    const { firmId, fy } = tenant;
    const cacheKey = `${DashboardKeys.purchaseChart(firmId, fy)}:${filterKey(dto)}`;

    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const { start, end } = this.resolveDates(dto, fy);
    const partyId = dto.partyId ? BigInt(dto.partyId) : undefined;

    const grouped = await this.prisma.purchaseBill.groupBy({
      by: ['partyId'],
      where: {
        firmId, fy, deletedAt: null,
        ...(partyId && { partyId }),
        billDate: { gte: start, lte: end },
      },
      _sum: { totalAmount: true, paidAmount: true, pendingAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 50,
    });

    const partyNames = await this.resolvePartyNames(grouped.map((r) => r.partyId));

    const data = grouped.map((r) => ({
      partyId:       r.partyId.toString(),
      partyName:     partyNames.get(r.partyId.toString()) ?? 'Unknown',
      totalTurnOver: toNum(r._sum.totalAmount),
      paidAmount:    toNum(r._sum.paidAmount),
      pendingAmount: toNum(r._sum.pendingAmount),
    }));

    await this.redis.set(cacheKey, data, CacheTTL.DASHBOARD);
    return data;
  }

  // ── Sales donut (GST breakdown) ───────────────────────────────────────────
  // Segments: withGst (applyGst=true) | withoutGst (applyGst=false)

  async salesDonut(tenant: TenantContext, dto: DashboardFiltersDto) {
    const { firmId, fy } = tenant;
    const cacheKey = `${DashboardKeys.salesDonut(firmId, fy)}:${filterKey(dto)}`;

    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const { start, end } = this.resolveDates(dto, fy);
    const partyId = dto.partyId ? BigInt(dto.partyId) : undefined;

    const baseWhere: Prisma.SalesBillWhereInput = {
      firmId, fy, deletedAt: null,
      ...(partyId && { partyId }),
      billDate: { gte: start, lte: end },
    };

    const [withGstAgg, withoutGstAgg] = await Promise.all([
      this.prisma.salesBill.aggregate({
        where: { ...baseWhere, applyGst: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.salesBill.aggregate({
        where: { ...baseWhere, applyGst: false },
        _sum: { totalAmount: true },
      }),
    ]);

    const withGst    = toNum(withGstAgg._sum.totalAmount);
    const withoutGst = toNum(withoutGstAgg._sum.totalAmount);

    const result = { totalSales: withGst + withoutGst, withGst, withoutGst };

    await this.redis.set(cacheKey, result, CacheTTL.DASHBOARD);
    return result;
  }

  // ── Purchase donut (GST breakdown) ────────────────────────────────────────

  async purchaseDonut(tenant: TenantContext, dto: DashboardFiltersDto) {
    const { firmId, fy } = tenant;
    const cacheKey = `${DashboardKeys.purchaseDonut(firmId, fy)}:${filterKey(dto)}`;

    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const { start, end } = this.resolveDates(dto, fy);
    const partyId = dto.partyId ? BigInt(dto.partyId) : undefined;

    const baseWhere: Prisma.PurchaseBillWhereInput = {
      firmId, fy, deletedAt: null,
      ...(partyId && { partyId }),
      billDate: { gte: start, lte: end },
    };

    const [withGstAgg, withoutGstAgg] = await Promise.all([
      this.prisma.purchaseBill.aggregate({
        where: { ...baseWhere, applyGst: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.purchaseBill.aggregate({
        where: { ...baseWhere, applyGst: false },
        _sum: { totalAmount: true },
      }),
    ]);

    const withGst    = toNum(withGstAgg._sum.totalAmount);
    const withoutGst = toNum(withoutGstAgg._sum.totalAmount);

    const result = { totalPurchase: withGst + withoutGst, withGst, withoutGst };

    await this.redis.set(cacheKey, result, CacheTTL.DASHBOARD);
    return result;
  }

  // ── Global search ─────────────────────────────────────────────────────────
  // Searches: sales bills (by bill no / party name), purchase bills, parties, products.
  // Not cached — live search per query.

  async search(tenant: TenantContext, dto: GlobalSearchDto) {
    const { firmId, fy } = tenant;
    const q = dto.q.trim();
    const limit = dto.limit ?? 5;

    const [salesBills, purchaseBills, parties, products] = await Promise.all([
      this.prisma.salesBill.findMany({
        where: {
          firmId, fy, deletedAt: null,
          OR: [
            { billNoDisplay: { contains: q, mode: 'insensitive' } },
            { party: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        orderBy: { billDate: 'desc' },
        take: limit,
        select: {
          id: true, billNoDisplay: true, billType: true,
          billDate: true, totalAmount: true, pendingAmount: true, status: true,
          party: { select: { name: true } },
        },
      }),

      this.prisma.purchaseBill.findMany({
        where: {
          firmId, fy, deletedAt: null,
          OR: [
            { billNo: { contains: q, mode: 'insensitive' } },
            { party: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        orderBy: { billDate: 'desc' },
        take: limit,
        select: {
          id: true, billNo: true, billDate: true,
          totalAmount: true, pendingAmount: true, status: true,
          party: { select: { name: true } },
        },
      }),

      this.prisma.party.findMany({
        where: {
          firmId, deletedAt: null,
          OR: [
            { name:  { contains: q, mode: 'insensitive' } },
            { gstNo: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
        take: limit,
        select: { id: true, name: true, gstNo: true, contactNumber: true },
      }),

      this.prisma.product.findMany({
        where: {
          firmId, deletedAt: null,
          OR: [
            { name:     { contains: q, mode: 'insensitive' } },
            { itemCode: { contains: q, mode: 'insensitive' } },
            { hsnCode:  { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
        take: limit,
        select: { id: true, name: true, itemCode: true, hsnCode: true, rate: true, unit: true },
      }),
    ]);

    return {
      salesBills: salesBills.map((b) => ({
        id:            b.id.toString(),
        billNoDisplay: b.billNoDisplay,
        billType:      b.billType,
        billDate:      b.billDate.toISOString(),
        totalAmount:   toNum(b.totalAmount),
        pendingAmount: toNum(b.pendingAmount),
        status:        b.status,
        partyName:     b.party.name,
      })),
      purchaseBills: purchaseBills.map((b) => ({
        id:            b.id.toString(),
        billNo:        b.billNo,
        billDate:      b.billDate.toISOString(),
        totalAmount:   toNum(b.totalAmount),
        pendingAmount: toNum(b.pendingAmount),
        status:        b.status,
        partyName:     b.party.name,
      })),
      parties: parties.map((p) => ({
        id:            p.id.toString(),
        name:          p.name,
        gstNo:         p.gstNo,
        contactNumber: p.contactNumber,
      })),
      products: products.map((p) => ({
        id:       p.id.toString(),
        name:     p.name,
        itemCode: p.itemCode,
        hsnCode:  p.hsnCode,
        rate:     toNum(p.rate),
        unit:     p.unit,
      })),
    };
  }

  // ── private helpers ───────────────────────────────────────────────────────

  private resolveDates(dto: DashboardFiltersDto, fy: number): { start: Date; end: Date } {
    const { start: fyStart, end: fyEnd } = fyDateRange(fy);
    return {
      start: dto.startDate ? new Date(dto.startDate) : fyStart,
      end:   dto.endDate   ? new Date(dto.endDate)   : fyEnd,
    };
  }

  private async resolvePartyNames(partyIds: bigint[]): Promise<Map<string, string>> {
    if (partyIds.length === 0) return new Map();
    const parties = await this.prisma.party.findMany({
      where: { id: { in: partyIds } },
      select: { id: true, name: true },
    });
    return new Map(parties.map((p) => [p.id.toString(), p.name]));
  }
}
