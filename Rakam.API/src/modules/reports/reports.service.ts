import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';

type Decimal = Prisma.Decimal;
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { CacheTTL, ReportKeys } from '../../common/cache-keys';
import { ReportQueryDto, ReportType } from './dto/report-query.dto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function n(dec: Decimal | null | undefined): number {
  return dec ? dec.toNumber() : 0;
}

function serialise(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Prisma.Decimal.isDecimal(obj)) return (obj as Decimal).toNumber();
  if (obj instanceof Date) return obj.toISOString().slice(0, 10);
  if (Array.isArray(obj)) return obj.map(serialise);
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, serialise(v)]),
    );
  }
  return obj;
}

/** Indian FY: fy=2026 → 01 Apr 2026 – 31 Mar 2027 */
function fyRange(fy: number) {
  return {
    start: new Date(`${fy}-04-01T00:00:00.000Z`),
    end:   new Date(`${fy + 1}-03-31T23:59:59.999Z`),
  };
}

function filterHash(dto: ReportQueryDto): string {
  const raw = `${dto.partyId ?? ''}|${dto.startDate ?? ''}|${dto.endDate ?? ''}`;
  return crypto.createHash('md5').update(raw).digest('hex').slice(0, 8);
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async generate(tenant: TenantContext, dto: ReportQueryDto) {
    const { firmId, fy } = tenant;
    const { start, end } = this.resolveDates(dto, fy);
    const partyId = dto.partyId ? BigInt(dto.partyId) : undefined;

    switch (dto.type) {
      case ReportType.PAYMENT:
        return this.paymentReport(firmId, fy, start, end, partyId);
      case ReportType.TRANSACTION:
        return this.transactionReport(firmId, fy, start, end, partyId);
      case ReportType.PRODUCT:
        return this.productReport(firmId, fy, start, end, partyId);
      case ReportType.EXPENSE:
        return this.expenseReport(firmId, fy, start, end);
      case ReportType.INCOME:
        return this.incomeReport(firmId, fy, start, end);
      case ReportType.PURCHASE_BILL_WITH_GST:
        return this.purchaseBillReport(firmId, fy, start, end, partyId, true);
      case ReportType.PURCHASE_BILL_WITHOUT_GST:
        return this.purchaseBillReport(firmId, fy, start, end, partyId, false);
      case ReportType.SALES_BILL_WITH_GST:
        return this.salesBillReport(firmId, fy, start, end, partyId, true);
      case ReportType.SALES_BILL_WITHOUT_GST:
        return this.salesBillReport(firmId, fy, start, end, partyId, false);
      case ReportType.TDS_PAYABLE:
        return this.tdsReport(firmId, fy, start, end, 'payable');
      case ReportType.TDS_RECEIVABLE:
        return this.tdsReport(firmId, fy, start, end, 'receivable');
      case ReportType.TCS_PAYABLE:
        return this.tcsReport(firmId, fy, start, end, 'payable');
      case ReportType.TCS_RECEIVABLE:
        return this.tcsReport(firmId, fy, start, end, 'receivable');
      case ReportType.SALES_BILL_ITEMS_GST:
        return this.salesBillItemsReport(firmId, fy, start, end, partyId, true);
      case ReportType.SALES_BILL_ITEMS_WITHOUT_GST:
        return this.salesBillItemsReport(firmId, fy, start, end, partyId, false);
      case ReportType.PURCHASE_BILL_ITEMS_GST:
        return this.purchaseBillItemsReport(firmId, fy, start, end, partyId, true);
      case ReportType.PURCHASE_BILL_ITEMS_WITHOUT_GST:
        return this.purchaseBillItemsReport(firmId, fy, start, end, partyId, false);
      case ReportType.SALES_OUTSTANDING:
        return this.salesOutstandingReport(firmId, fy);
      case ReportType.PURCHASE_OUTSTANDING:
        return this.purchaseOutstandingReport(firmId, fy);
      case ReportType.DELIVERY_CHALLAN:
        return this.deliveryChallanReport(firmId, fy, start, end, partyId);
      case ReportType.CREDIT_NOTE:
        return this.creditNoteReport(firmId, fy, start, end, partyId);
      case ReportType.PROFIT_AND_LOSS:
        return this.profitLossReport(firmId, fy, start, end);
    }
  }

  // ── 1. Payment report ──────────────────────────────────────────────────────

  private async paymentReport(
    firmId: bigint, fy: number, start: Date, end: Date, partyId?: bigint,
  ) {
    const hash = filterHash({ type: ReportType.PAYMENT, partyId: partyId?.toString(), startDate: start.toISOString(), endDate: end.toISOString() });
    const key  = ReportKeys.payment(firmId, fy, hash);
    const hit  = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const rows = await this.prisma.transaction.findMany({
      where: {
        firmId, fy, deletedAt: null,
        txnDate: { gte: start, lte: end },
        ...(partyId && { partyId }),
        txnFor: { in: ['SALES', 'PURCHASE'] as any },
      },
      orderBy: { txnDate: 'desc' },
      select: {
        id: true, refNumber: true, txnDate: true,
        txnType: true, txnFor: true, paymentMode: true,
        amount: true, settlementAmount: true, note: true,
        party: { select: { id: true, name: true } },
      },
    });

    const data = rows.map((r) => ({
      id:               r.id.toString(),
      refNumber:        r.refNumber,
      txnDate:          r.txnDate,
      txnType:          r.txnType,
      txnFor:           r.txnFor,
      paymentMode:      r.paymentMode,
      amount:           n(r.amount),
      settlementAmount: n(r.settlementAmount),
      note:             r.note,
      party:            r.party ? { id: r.party.id.toString(), name: r.party.name } : null,
    }));

    const result = { type: ReportType.PAYMENT, count: data.length, rows: serialise(data) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 2. Transaction report ──────────────────────────────────────────────────

  private async transactionReport(
    firmId: bigint, fy: number, start: Date, end: Date, partyId?: bigint,
  ) {
    const hash = filterHash({ type: ReportType.TRANSACTION, partyId: partyId?.toString(), startDate: start.toISOString(), endDate: end.toISOString() });
    const key  = ReportKeys.transaction(firmId, fy, hash);
    const hit  = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const rows = await this.prisma.transaction.findMany({
      where: {
        firmId, fy, deletedAt: null,
        txnDate: { gte: start, lte: end },
        ...(partyId && { partyId }),
      },
      orderBy: { txnDate: 'desc' },
      select: {
        id: true, refNumber: true, txnDate: true,
        txnType: true, txnFor: true, sourceTable: true, sourceId: true,
        paymentMode: true, amount: true, settlementAmount: true, note: true,
        party: { select: { id: true, name: true } },
      },
    });

    const data = rows.map((r) => ({
      id:               r.id.toString(),
      refNumber:        r.refNumber,
      txnDate:          r.txnDate,
      txnType:          r.txnType,
      txnFor:           r.txnFor,
      sourceTable:      r.sourceTable,
      sourceId:         r.sourceId?.toString() ?? null,
      paymentMode:      r.paymentMode,
      amount:           n(r.amount),
      settlementAmount: n(r.settlementAmount),
      note:             r.note,
      party:            r.party ? { id: r.party.id.toString(), name: r.party.name } : null,
    }));

    const result = { type: ReportType.TRANSACTION, count: data.length, rows: serialise(data) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 3. Product report ──────────────────────────────────────────────────────

  private async productReport(
    firmId: bigint, fy: number, start: Date, end: Date, partyId?: bigint,
  ) {
    const hash = filterHash({ type: ReportType.PRODUCT, partyId: partyId?.toString(), startDate: start.toISOString(), endDate: end.toISOString() });
    const key  = ReportKeys.product(firmId, fy, hash);
    const hit  = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const salesItems = await this.prisma.salesBillItem.findMany({
      where: {
        salesBill: {
          firmId, fy, deletedAt: null,
          billDate: { gte: start, lte: end },
          ...(partyId && { partyId }),
        },
      },
      select: {
        productId: true, productNameSnapshot: true,
        itemCode: true, hsnCode: true, unit: true,
        qty: true, rate: true, amount: true,
        product: { select: { name: true } },
      },
    });

    const productMap = new Map<string, {
      productId: string | null; name: string;
      itemCode: string | null; hsnCode: string | null; unit: string;
      salesQty: number; salesAmount: number;
    }>();

    for (const item of salesItems) {
      const mapKey = item.productId?.toString() ?? item.productNameSnapshot ?? 'unknown';
      const existing = productMap.get(mapKey);
      if (existing) {
        existing.salesQty    += n(item.qty);
        existing.salesAmount += n(item.amount);
      } else {
        productMap.set(mapKey, {
          productId:   item.productId?.toString() ?? null,
          name:        item.product?.name ?? item.productNameSnapshot ?? 'Unknown',
          itemCode:    item.itemCode,
          hsnCode:     item.hsnCode,
          unit:        item.unit,
          salesQty:    n(item.qty),
          salesAmount: n(item.amount),
        });
      }
    }

    const data = Array.from(productMap.values());
    const result = { type: ReportType.PRODUCT, count: data.length, rows: data };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 4. Expense report ──────────────────────────────────────────────────────

  private async expenseReport(firmId: bigint, fy: number, start: Date, end: Date) {
    const hash = filterHash({ type: ReportType.EXPENSE, startDate: start.toISOString(), endDate: end.toISOString() });
    const key  = ReportKeys.expense(firmId, fy, hash);
    const hit  = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const rows = await this.prisma.expense.findMany({
      where: { firmId, fy, deletedAt: null, expenseDate: { gte: start, lte: end } },
      orderBy: { expenseDate: 'desc' },
      select: {
        id: true, mode: true, expenseDate: true, amount: true, paidAmount: true, note: true,
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    const totalAmount = rows.reduce((s, r) => s + n(r.amount), 0);
    const data = rows.map((r) => ({
      id:            r.id.toString(),
      mode:          r.mode,
      expenseDate:   r.expenseDate,
      amount:        n(r.amount),
      paidAmount:    n(r.paidAmount),
      pendingAmount: n(r.amount) - n(r.paidAmount),
      note:          r.note,
      category:      r.category ? { id: r.category.id.toString(), name: r.category.name } : null,
      supplier:      r.supplier ? { id: r.supplier.id.toString(), name: r.supplier.name } : null,
    }));

    const result = { type: ReportType.EXPENSE, count: data.length, totalAmount, rows: serialise(data) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 5. Income report ───────────────────────────────────────────────────────

  private async incomeReport(firmId: bigint, fy: number, start: Date, end: Date) {
    const hash = filterHash({ type: ReportType.INCOME, startDate: start.toISOString(), endDate: end.toISOString() });
    const key  = ReportKeys.income(firmId, fy, hash);
    const hit  = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const rows = await this.prisma.income.findMany({
      where: { firmId, fy, deletedAt: null, incomeDate: { gte: start, lte: end } },
      orderBy: { incomeDate: 'desc' },
      select: {
        id: true, incomeDate: true, amount: true, note: true,
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    const totalAmount = rows.reduce((s, r) => s + n(r.amount), 0);
    const data = rows.map((r) => ({
      id:         r.id.toString(),
      incomeDate: r.incomeDate,
      amount:     n(r.amount),
      note:       r.note,
      category:   { id: r.category.id.toString(), name: r.category.name },
      supplier:   r.supplier ? { id: r.supplier.id.toString(), name: r.supplier.name } : null,
    }));

    const result = { type: ReportType.INCOME, count: data.length, totalAmount, rows: serialise(data) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 6 & 7. Purchase Bill (With/Without GST) ────────────────────────────────

  private async purchaseBillReport(
    firmId: bigint, fy: number, start: Date, end: Date,
    partyId: bigint | undefined, withGst: boolean,
  ) {
    const reportType = withGst ? ReportType.PURCHASE_BILL_WITH_GST : ReportType.PURCHASE_BILL_WITHOUT_GST;
    const hash = filterHash({ type: reportType, partyId: partyId?.toString(), startDate: start.toISOString(), endDate: end.toISOString() });
    const key  = withGst ? ReportKeys.purchaseGst(firmId, fy, hash) : ReportKeys.purchaseWoGst(firmId, fy, hash);
    const hit  = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const rows = await this.prisma.purchaseBill.findMany({
      where: {
        firmId, fy, deletedAt: null,
        applyGst: withGst,
        billDate: { gte: start, lte: end },
        ...(partyId && { partyId }),
      },
      orderBy: { billDate: 'desc' },
      select: {
        id: true, billNo: true, billDate: true, billType: true,
        netAmount: true, discountAmount: true, taxableAmount: true,
        cgstAmount: true, sgstAmount: true, igstAmount: true, taxAmount: true,
        tdsAmount: true, tcsAmount: true, totalAmount: true,
        paidAmount: true, pendingAmount: true, status: true, remarks: true,
        party: { select: { id: true, name: true, gstNo: true } },
      },
    });

    const totals = rows.reduce(
      (acc, r) => ({
        netAmount:     acc.netAmount     + n(r.netAmount),
        taxAmount:     acc.taxAmount     + n(r.taxAmount),
        totalAmount:   acc.totalAmount   + n(r.totalAmount),
        paidAmount:    acc.paidAmount    + n(r.paidAmount),
        pendingAmount: acc.pendingAmount + n(r.pendingAmount),
      }),
      { netAmount: 0, taxAmount: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 },
    );

    const data = rows.map((r) => ({
      id:             r.id.toString(),
      billNo:         r.billNo,
      billDate:       r.billDate,
      billType:       r.billType,
      netAmount:      n(r.netAmount),
      discountAmount: n(r.discountAmount),
      taxableAmount:  n(r.taxableAmount),
      cgstAmount:     n(r.cgstAmount),
      sgstAmount:     n(r.sgstAmount),
      igstAmount:     n(r.igstAmount),
      taxAmount:      n(r.taxAmount),
      tdsAmount:      n(r.tdsAmount),
      tcsAmount:      n(r.tcsAmount),
      totalAmount:    n(r.totalAmount),
      paidAmount:     n(r.paidAmount),
      pendingAmount:  n(r.pendingAmount),
      status:         r.status,
      remarks:        r.remarks,
      party:          { id: r.party.id.toString(), name: r.party.name, gstNo: r.party.gstNo },
    }));

    const result = { type: reportType, count: data.length, totals, rows: serialise(data) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 8 & 9. Sales Bill (With/Without GST) ──────────────────────────────────

  private async salesBillReport(
    firmId: bigint, fy: number, start: Date, end: Date,
    partyId: bigint | undefined, withGst: boolean,
  ) {
    const reportType = withGst ? ReportType.SALES_BILL_WITH_GST : ReportType.SALES_BILL_WITHOUT_GST;
    const hash = filterHash({ type: reportType, partyId: partyId?.toString(), startDate: start.toISOString(), endDate: end.toISOString() });
    const key  = withGst ? ReportKeys.salesGst(firmId, fy, hash) : ReportKeys.salesWoGst(firmId, fy, hash);
    const hit  = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const rows = await this.prisma.salesBill.findMany({
      where: {
        firmId, fy, deletedAt: null,
        applyGst: withGst,
        billDate: { gte: start, lte: end },
        ...(partyId && { partyId }),
      },
      orderBy: { billDate: 'desc' },
      select: {
        id: true, billNoDisplay: true, billDate: true, billType: true,
        netAmount: true, discountAmount: true, taxableAmount: true,
        cgstAmount: true, sgstAmount: true, igstAmount: true, taxAmount: true,
        tdsAmount: true, tcsAmount: true, totalAmount: true,
        paidAmount: true, pendingAmount: true, status: true, dueDate: true, remarks: true,
        party: { select: { id: true, name: true, gstNo: true } },
      },
    });

    const totals = rows.reduce(
      (acc, r) => ({
        netAmount:     acc.netAmount     + n(r.netAmount),
        taxAmount:     acc.taxAmount     + n(r.taxAmount),
        totalAmount:   acc.totalAmount   + n(r.totalAmount),
        paidAmount:    acc.paidAmount    + n(r.paidAmount),
        pendingAmount: acc.pendingAmount + n(r.pendingAmount),
      }),
      { netAmount: 0, taxAmount: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 },
    );

    const data = rows.map((r) => ({
      id:             r.id.toString(),
      billNoDisplay:  r.billNoDisplay,
      billDate:       r.billDate,
      billType:       r.billType,
      dueDate:        r.dueDate,
      netAmount:      n(r.netAmount),
      discountAmount: n(r.discountAmount),
      taxableAmount:  n(r.taxableAmount),
      cgstAmount:     n(r.cgstAmount),
      sgstAmount:     n(r.sgstAmount),
      igstAmount:     n(r.igstAmount),
      taxAmount:      n(r.taxAmount),
      tdsAmount:      n(r.tdsAmount),
      tcsAmount:      n(r.tcsAmount),
      totalAmount:    n(r.totalAmount),
      paidAmount:     n(r.paidAmount),
      pendingAmount:  n(r.pendingAmount),
      status:         r.status,
      remarks:        r.remarks,
      party:          { id: r.party.id.toString(), name: r.party.name, gstNo: r.party.gstNo },
    }));

    const result = { type: reportType, count: data.length, totals, rows: serialise(data) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 10 & 11. TDS Payable / Receivable ─────────────────────────────────────
  // Payable = purchase bills (we deduct TDS before paying supplier)
  // Receivable = sales bills (customer deducts TDS before paying us)

  private async tdsReport(
    firmId: bigint, fy: number, start: Date, end: Date,
    direction: 'payable' | 'receivable',
  ) {
    const reportType = direction === 'payable' ? ReportType.TDS_PAYABLE : ReportType.TDS_RECEIVABLE;
    const key = direction === 'payable'
      ? ReportKeys.tdsPayable(firmId, fy)
      : ReportKeys.tdsReceivable(firmId, fy);
    const hit = await this.redis.get<unknown>(key);
    if (hit) return hit;

    let rows: unknown[];
    let totalTds = 0;

    if (direction === 'payable') {
      const bills = await this.prisma.purchaseBill.findMany({
        where: { firmId, fy, deletedAt: null, tdsAmount: { gt: 0 }, billDate: { gte: start, lte: end } },
        orderBy: { billDate: 'desc' },
        select: {
          id: true, billNo: true, billDate: true,
          totalAmount: true, tdsAmount: true, status: true,
          party: { select: { id: true, name: true, gstNo: true } },
        },
      });
      totalTds = bills.reduce((s, r) => s + n(r.tdsAmount), 0);
      rows = bills.map((r) => ({
        id: r.id.toString(), billNo: r.billNo, billDate: r.billDate,
        totalAmount: n(r.totalAmount), tdsAmount: n(r.tdsAmount), status: r.status,
        party: { id: r.party.id.toString(), name: r.party.name, gstNo: r.party.gstNo },
      }));
    } else {
      const bills = await this.prisma.salesBill.findMany({
        where: { firmId, fy, deletedAt: null, tdsAmount: { gt: 0 }, billDate: { gte: start, lte: end } },
        orderBy: { billDate: 'desc' },
        select: {
          id: true, billNoDisplay: true, billDate: true,
          totalAmount: true, tdsAmount: true, status: true,
          party: { select: { id: true, name: true, gstNo: true } },
        },
      });
      totalTds = bills.reduce((s, r) => s + n(r.tdsAmount), 0);
      rows = bills.map((r) => ({
        id: r.id.toString(), billNoDisplay: r.billNoDisplay, billDate: r.billDate,
        totalAmount: n(r.totalAmount), tdsAmount: n(r.tdsAmount), status: r.status,
        party: { id: r.party.id.toString(), name: r.party.name, gstNo: r.party.gstNo },
      }));
    }

    const result = { type: reportType, count: rows.length, totalTds, rows: serialise(rows) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 12 & 13. TCS Payable / Receivable ─────────────────────────────────────

  private async tcsReport(
    firmId: bigint, fy: number, start: Date, end: Date,
    direction: 'payable' | 'receivable',
  ) {
    const reportType = direction === 'payable' ? ReportType.TCS_PAYABLE : ReportType.TCS_RECEIVABLE;
    const key = direction === 'payable'
      ? ReportKeys.tcsPayable(firmId, fy)
      : ReportKeys.tcsReceivable(firmId, fy);
    const hit = await this.redis.get<unknown>(key);
    if (hit) return hit;

    let rows: unknown[];
    let totalTcs = 0;

    if (direction === 'payable') {
      const bills = await this.prisma.purchaseBill.findMany({
        where: { firmId, fy, deletedAt: null, tcsAmount: { gt: 0 }, billDate: { gte: start, lte: end } },
        orderBy: { billDate: 'desc' },
        select: {
          id: true, billNo: true, billDate: true,
          totalAmount: true, tcsAmount: true, status: true,
          party: { select: { id: true, name: true, gstNo: true } },
        },
      });
      totalTcs = bills.reduce((s, r) => s + n(r.tcsAmount), 0);
      rows = bills.map((r) => ({
        id: r.id.toString(), billNo: r.billNo, billDate: r.billDate,
        totalAmount: n(r.totalAmount), tcsAmount: n(r.tcsAmount), status: r.status,
        party: { id: r.party.id.toString(), name: r.party.name, gstNo: r.party.gstNo },
      }));
    } else {
      const bills = await this.prisma.salesBill.findMany({
        where: { firmId, fy, deletedAt: null, tcsAmount: { gt: 0 }, billDate: { gte: start, lte: end } },
        orderBy: { billDate: 'desc' },
        select: {
          id: true, billNoDisplay: true, billDate: true,
          totalAmount: true, tcsAmount: true, status: true,
          party: { select: { id: true, name: true, gstNo: true } },
        },
      });
      totalTcs = bills.reduce((s, r) => s + n(r.tcsAmount), 0);
      rows = bills.map((r) => ({
        id: r.id.toString(), billNoDisplay: r.billNoDisplay, billDate: r.billDate,
        totalAmount: n(r.totalAmount), tcsAmount: n(r.tcsAmount), status: r.status,
        party: { id: r.party.id.toString(), name: r.party.name, gstNo: r.party.gstNo },
      }));
    }

    const result = { type: reportType, count: rows.length, totalTcs, rows: serialise(rows) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 14 & 15. Sales Bill Items (With/Without GST) ───────────────────────────

  private async salesBillItemsReport(
    firmId: bigint, fy: number, start: Date, end: Date,
    partyId: bigint | undefined, withGst: boolean,
  ) {
    const reportType = withGst ? ReportType.SALES_BILL_ITEMS_GST : ReportType.SALES_BILL_ITEMS_WITHOUT_GST;
    const key = withGst
      ? ReportKeys.salesBillItemsGst(firmId, fy)
      : ReportKeys.salesBillItemsWoGst(firmId, fy);
    const hit = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const bills = await this.prisma.salesBill.findMany({
      where: {
        firmId, fy, deletedAt: null,
        applyGst: withGst,
        billDate: { gte: start, lte: end },
        ...(partyId && { partyId }),
      },
      orderBy: { billDate: 'desc' },
      select: {
        id: true, billNoDisplay: true, billDate: true,
        party: { select: { id: true, name: true, gstNo: true } },
        items: {
          orderBy: { lineNo: 'asc' },
          select: {
            id: true, productNameSnapshot: true, itemCode: true, hsnCode: true,
            qty: true, unit: true, rate: true, discountAmount: true,
            gstPct: true, cgstAmount: true, sgstAmount: true, igstAmount: true, amount: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    const data = bills.map((b) => ({
      id:            b.id.toString(),
      billNoDisplay: b.billNoDisplay,
      billDate:      b.billDate,
      party:         { id: b.party.id.toString(), name: b.party.name, gstNo: b.party.gstNo },
      items:         b.items.map((i) => ({
        id:             i.id.toString(),
        name:           i.product?.name ?? i.productNameSnapshot ?? 'Unknown',
        itemCode:       i.itemCode,
        hsnCode:        i.hsnCode,
        qty:            n(i.qty),
        unit:           i.unit,
        rate:           n(i.rate),
        discountAmount: n(i.discountAmount),
        gstPct:         i.gstPct,
        cgstAmount:     n(i.cgstAmount),
        sgstAmount:     n(i.sgstAmount),
        igstAmount:     n(i.igstAmount),
        amount:         n(i.amount),
      })),
    }));

    const result = { type: reportType, count: data.length, rows: serialise(data) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 16 & 17. Purchase Bill Items (With/Without GST) ───────────────────────

  private async purchaseBillItemsReport(
    firmId: bigint, fy: number, start: Date, end: Date,
    partyId: bigint | undefined, withGst: boolean,
  ) {
    const reportType = withGst ? ReportType.PURCHASE_BILL_ITEMS_GST : ReportType.PURCHASE_BILL_ITEMS_WITHOUT_GST;
    const key = withGst
      ? ReportKeys.purchaseBillItemsGst(firmId, fy)
      : ReportKeys.purchaseBillItemsWoGst(firmId, fy);
    const hit = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const bills = await this.prisma.purchaseBill.findMany({
      where: {
        firmId, fy, deletedAt: null,
        applyGst: withGst,
        billDate: { gte: start, lte: end },
        ...(partyId && { partyId }),
      },
      orderBy: { billDate: 'desc' },
      select: {
        id: true, billNo: true, billDate: true,
        party: { select: { id: true, name: true, gstNo: true } },
        items: {
          orderBy: { lineNo: 'asc' },
          select: {
            id: true, productNameSnapshot: true, itemCode: true, hsnCode: true,
            qty: true, unit: true, rate: true, discountAmount: true,
            gstPct: true, cgstAmount: true, sgstAmount: true, igstAmount: true, amount: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    const data = bills.map((b) => ({
      id:     b.id.toString(),
      billNo: b.billNo,
      billDate: b.billDate,
      party:  { id: b.party.id.toString(), name: b.party.name, gstNo: b.party.gstNo },
      items:  b.items.map((i) => ({
        id:             i.id.toString(),
        name:           i.product?.name ?? i.productNameSnapshot ?? 'Unknown',
        itemCode:       i.itemCode,
        hsnCode:        i.hsnCode,
        qty:            n(i.qty),
        unit:           i.unit,
        rate:           n(i.rate),
        discountAmount: n(i.discountAmount),
        gstPct:         i.gstPct,
        cgstAmount:     n(i.cgstAmount),
        sgstAmount:     n(i.sgstAmount),
        igstAmount:     n(i.igstAmount),
        amount:         n(i.amount),
      })),
    }));

    const result = { type: reportType, count: data.length, rows: serialise(data) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 18. Sales Outstanding ──────────────────────────────────────────────────

  private async salesOutstandingReport(firmId: bigint, fy: number) {
    const key = ReportKeys.salesOutstanding(firmId);
    const hit = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const rows = await this.prisma.salesBill.findMany({
      where: { firmId, fy, deletedAt: null, pendingAmount: { gt: 0 } },
      orderBy: [{ dueDate: 'asc' }, { billDate: 'asc' }],
      select: {
        id: true, billNoDisplay: true, billDate: true, dueDate: true,
        totalAmount: true, paidAmount: true, pendingAmount: true, status: true,
        party: { select: { id: true, name: true, gstNo: true, contactNumber: true } },
      },
    });

    const totalOutstanding = rows.reduce((s, r) => s + n(r.pendingAmount), 0);
    const today = new Date();

    const data = rows.map((r) => {
      const due = r.dueDate ? new Date(r.dueDate) : null;
      return {
        id:            r.id.toString(),
        billNoDisplay: r.billNoDisplay,
        billDate:      r.billDate,
        dueDate:       r.dueDate,
        totalAmount:   n(r.totalAmount),
        paidAmount:    n(r.paidAmount),
        pendingAmount: n(r.pendingAmount),
        status:        r.status,
        overdueDays:   due && due < today ? Math.floor((today.getTime() - due.getTime()) / 86400000) : 0,
        party:         { id: r.party.id.toString(), name: r.party.name, gstNo: r.party.gstNo, contactNumber: r.party.contactNumber },
      };
    });

    const result = { type: ReportType.SALES_OUTSTANDING, count: data.length, totalOutstanding, rows: serialise(data) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 19. Purchase Outstanding ───────────────────────────────────────────────

  private async purchaseOutstandingReport(firmId: bigint, fy: number) {
    const key = ReportKeys.purchaseOutstanding(firmId);
    const hit = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const rows = await this.prisma.purchaseBill.findMany({
      where: { firmId, fy, deletedAt: null, pendingAmount: { gt: 0 } },
      orderBy: [{ dueDate: 'asc' }, { billDate: 'asc' }],
      select: {
        id: true, billNo: true, billDate: true, dueDate: true,
        totalAmount: true, paidAmount: true, pendingAmount: true, status: true,
        party: { select: { id: true, name: true, gstNo: true, contactNumber: true } },
      },
    });

    const totalOutstanding = rows.reduce((s, r) => s + n(r.pendingAmount), 0);
    const today = new Date();

    const data = rows.map((r) => {
      const due = r.dueDate ? new Date(r.dueDate) : null;
      return {
        id:            r.id.toString(),
        billNo:        r.billNo,
        billDate:      r.billDate,
        dueDate:       r.dueDate,
        totalAmount:   n(r.totalAmount),
        paidAmount:    n(r.paidAmount),
        pendingAmount: n(r.pendingAmount),
        status:        r.status,
        overdueDays:   due && due < today ? Math.floor((today.getTime() - due.getTime()) / 86400000) : 0,
        party:         { id: r.party.id.toString(), name: r.party.name, gstNo: r.party.gstNo, contactNumber: r.party.contactNumber },
      };
    });

    const result = { type: ReportType.PURCHASE_OUTSTANDING, count: data.length, totalOutstanding, rows: serialise(data) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 20. Delivery Challan Report ────────────────────────────────────────────

  private async deliveryChallanReport(
    firmId: bigint, fy: number, start: Date, end: Date, partyId?: bigint,
  ) {
    const key = ReportKeys.deliveryChallan(firmId, fy);
    const hit = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const rows = await this.prisma.deliveryChallan.findMany({
      where: {
        firmId, fy, deletedAt: null,
        dcDate: { gte: start, lte: end },
        ...(partyId && { partyId }),
      },
      orderBy: { dcDate: 'desc' },
      select: {
        id: true, dcNoDisplay: true, dcDate: true,
        totalQty: true, netAmount: true, salesBillId: true,
        salesBill: { select: { billNoDisplay: true } },
        party: { select: { id: true, name: true } },
      },
    });

    const totalNetAmount = rows.reduce((s, r) => s + n(r.netAmount), 0);
    const data = rows.map((r) => ({
      id:          r.id.toString(),
      dcNoDisplay: r.dcNoDisplay,
      dcDate:      r.dcDate,
      totalQty:    n(r.totalQty),
      netAmount:   n(r.netAmount),
      converted:   r.salesBillId !== null,
      salesBillNo: r.salesBill?.billNoDisplay ?? null,
      party:       { id: r.party.id.toString(), name: r.party.name },
    }));

    const result = { type: ReportType.DELIVERY_CHALLAN, count: data.length, totalNetAmount, rows: serialise(data) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 21. Credit Note Report ─────────────────────────────────────────────────

  private async creditNoteReport(
    firmId: bigint, fy: number, start: Date, end: Date, partyId?: bigint,
  ) {
    const key = ReportKeys.creditNote(firmId, fy);
    const hit = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const rows = await this.prisma.creditNote.findMany({
      where: {
        firmId, fy, deletedAt: null,
        noteDate: { gte: start, lte: end },
        ...(partyId && { salesBill: { partyId } }),
      },
      orderBy: { noteDate: 'desc' },
      select: {
        id: true, noteNoSeq: true, noteDate: true, totalAmount: true, reason: true,
        salesBill: {
          select: {
            id: true, billNoDisplay: true,
            party: { select: { id: true, name: true, gstNo: true } },
          },
        },
      },
    });

    const totalAmount = rows.reduce((s, r) => s + n(r.totalAmount), 0);
    const data = rows.map((r) => ({
      id:            r.id.toString(),
      noteNoSeq:     r.noteNoSeq,
      noteDate:      r.noteDate,
      totalAmount:   n(r.totalAmount),
      reason:        r.reason,
      salesBillId:   r.salesBill.id.toString(),
      billNoDisplay: r.salesBill.billNoDisplay,
      party:         { id: r.salesBill.party.id.toString(), name: r.salesBill.party.name, gstNo: r.salesBill.party.gstNo },
    }));

    const result = { type: ReportType.CREDIT_NOTE, count: data.length, totalAmount, rows: serialise(data) };
    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── 22. Profit & Loss ──────────────────────────────────────────────────────

  private async profitLossReport(firmId: bigint, fy: number, start: Date, end: Date) {
    const key = ReportKeys.profitLoss(firmId, fy);
    const hit = await this.redis.get<unknown>(key);
    if (hit) return hit;

    const dateFilter = { gte: start, lte: end };

    const [salesAgg, purchaseAgg, expenseAgg, incomeAgg, creditNoteAgg] = await Promise.all([
      this.prisma.salesBill.aggregate({
        where: { firmId, fy, deletedAt: null, billDate: dateFilter },
        _sum: { netAmount: true, taxAmount: true, totalAmount: true },
      }),
      this.prisma.purchaseBill.aggregate({
        where: { firmId, fy, deletedAt: null, billDate: dateFilter },
        _sum: { netAmount: true, taxAmount: true, totalAmount: true },
      }),
      this.prisma.expense.aggregate({
        where: { firmId, fy, deletedAt: null, expenseDate: dateFilter },
        _sum: { amount: true },
      }),
      this.prisma.income.aggregate({
        where: { firmId, fy, deletedAt: null, incomeDate: dateFilter },
        _sum: { amount: true },
      }),
      this.prisma.creditNote.aggregate({
        where: { firmId, fy, deletedAt: null, noteDate: dateFilter },
        _sum: { totalAmount: true },
      }),
    ]);

    const salesNet     = n(salesAgg._sum.netAmount);
    const salesGst     = n(salesAgg._sum.taxAmount);
    const salesTotal   = n(salesAgg._sum.totalAmount);
    const purchaseNet  = n(purchaseAgg._sum.netAmount);
    const purchaseGst  = n(purchaseAgg._sum.taxAmount);
    const expenseTotal = n(expenseAgg._sum.amount);
    const incomeTotal  = n(incomeAgg._sum.amount);
    const creditNotes  = n(creditNoteAgg._sum.totalAmount);

    const grossProfit  = salesNet - purchaseNet;
    const netProfit    = grossProfit + incomeTotal - expenseTotal - creditNotes;

    const result = {
      type: ReportType.PROFIT_AND_LOSS,
      period: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
      income: {
        salesNet, salesGst, salesTotal,
        otherIncome: incomeTotal,
        totalIncome: salesNet + incomeTotal,
      },
      expenses: {
        purchaseNet, purchaseGst,
        operatingExpenses: expenseTotal,
        creditNotesIssued: creditNotes,
        totalExpenses: purchaseNet + expenseTotal + creditNotes,
      },
      grossProfit,
      netProfit,
    };

    await this.redis.set(key, result, CacheTTL.REPORTS);
    return result;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private resolveDates(dto: ReportQueryDto, fy: number): { start: Date; end: Date } {
    const { start: fyStart, end: fyEnd } = fyRange(fy);
    return {
      start: dto.startDate ? new Date(dto.startDate) : fyStart,
      end:   dto.endDate   ? new Date(dto.endDate)   : fyEnd,
    };
  }
}
