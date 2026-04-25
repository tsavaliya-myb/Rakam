import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BillStatus, GstPct, Prisma, TxnFor, TxnType } from '@prisma/client';

type Decimal = Prisma.Decimal;
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { CreatePurchaseBillDto } from './dto/create-purchase-bill.dto';
import { UpdatePurchaseBillDto } from './dto/update-purchase-bill.dto';
import { ListPurchaseBillsDto } from './dto/list-purchase-bills.dto';
import { RecordPurchasePaymentDto } from './dto/record-payment.dto';
import {
  CacheTTL,
  DashboardKeys,
  PartyKeys,
  PurchaseBillKeys,
  ReportKeys,
} from '../../common/cache-keys';

// ─── GST rate lookup ──────────────────────────────────────────────────────────

const GST_PCT_MAP: Record<GstPct, number> = {
  PCT_0: 0,
  PCT_025: 0.25,
  PCT_1: 1,
  PCT_15: 1.5,
  PCT_3: 3,
  PCT_5: 5,
  PCT_6: 6,
  PCT_75: 7.5,
  PCT_12: 12,
  PCT_18: 18,
  PCT_28: 28,
};

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

// ─── Tax calculation for purchase bills ──────────────────────────────────────

interface PurchaseItemInput {
  qty: number;
  rate: number;
  discountPct?: number;
  gstPct?: GstPct;
}

interface PurchaseItemCalc extends PurchaseItemInput {
  grossAmount: Decimal;
  discountAmount: Decimal;
  amount: Decimal;
  cgstAmount: Decimal;
  sgstAmount: Decimal;
  igstAmount: Decimal;
}

interface PurchaseBillTotals {
  netAmount: Decimal;
  discountAmount: Decimal;
  taxableAmount: Decimal;
  cgstAmount: Decimal;
  sgstAmount: Decimal;
  igstAmount: Decimal;
  taxAmount: Decimal;
  totalAmount: Decimal;
  totalQty: Decimal;
}

function calcPurchaseItems(
  items: PurchaseItemInput[],
  opts: { applyGst: boolean; isInterstate: boolean },
): { items: PurchaseItemCalc[]; totals: PurchaseBillTotals } {
  const calcedItems: PurchaseItemCalc[] = items.map((item) => {
    const gross = d(item.qty).mul(d(item.rate));
    const itemDiscount =
      (item.discountPct ?? 0) > 0
        ? gross.mul(d(item.discountPct!)).div(100)
        : d(0);
    const lineAmt = gross.minus(itemDiscount);

    let cgstAmt = d(0);
    let sgstAmt = d(0);
    let igstAmt = d(0);

    if (opts.applyGst && item.gstPct) {
      const pct = GST_PCT_MAP[item.gstPct] ?? 0;
      const gstAmt = lineAmt.mul(d(pct)).div(100);
      if (opts.isInterstate) {
        igstAmt = gstAmt;
      } else {
        cgstAmt = gstAmt.div(2);
        sgstAmt = gstAmt.div(2);
      }
    }

    return {
      ...item,
      grossAmount: gross,
      discountAmount: itemDiscount,
      amount: lineAmt,
      cgstAmount: cgstAmt,
      sgstAmount: sgstAmt,
      igstAmount: igstAmt,
    };
  });

  const netAmount = calcedItems.reduce((s, i) => s.plus(i.grossAmount), d(0));
  const discountAmount = calcedItems.reduce((s, i) => s.plus(i.discountAmount), d(0));
  const taxableAmount = netAmount.minus(discountAmount);
  const cgstAmount = calcedItems.reduce((s, i) => s.plus(i.cgstAmount), d(0));
  const sgstAmount = calcedItems.reduce((s, i) => s.plus(i.sgstAmount), d(0));
  const igstAmount = calcedItems.reduce((s, i) => s.plus(i.igstAmount), d(0));
  const taxAmount = cgstAmount.plus(sgstAmount).plus(igstAmount);
  const totalAmount = taxableAmount.plus(taxAmount);
  const totalQty = calcedItems.reduce((s, i) => s.plus(d(i.qty)), d(0));

  return {
    items: calcedItems,
    totals: {
      netAmount,
      discountAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      taxAmount,
      totalAmount,
      totalQty,
    },
  };
}

function nextRefNumber(firmId: bigint, fy: number, seq: number): string {
  return `TXN/${fy}/${String(seq).padStart(4, '0')}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PurchaseBillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── list ─────────────────────────────────────────────────────────────────

  async list(tenant: TenantContext, dto: ListPurchaseBillsDto) {
    const { firmId, fy } = tenant;
    const limit = dto.limit ?? 20;

    const where: Prisma.PurchaseBillWhereInput = {
      firmId,
      fy,
      deletedAt: null,
    };

    if (dto.tab && dto.tab !== 'all') where.billType = dto.tab;
    if (dto.partyId) where.partyId = BigInt(dto.partyId);
    if (dto.status) where.status = dto.status;
    if (dto.fromDate || dto.toDate) {
      where.billDate = {
        ...(dto.fromDate && { gte: new Date(dto.fromDate) }),
        ...(dto.toDate && { lte: new Date(dto.toDate) }),
      };
    }
    if (dto.search) {
      where.OR = [
        { billNo: { contains: dto.search, mode: 'insensitive' } },
        { party: { name: { contains: dto.search, mode: 'insensitive' } } },
      ];
    }

    if (dto.afterDate && dto.afterId) {
      where.AND = [
        {
          OR: [
            { billDate: { lt: new Date(dto.afterDate) } },
            {
              billDate: { equals: new Date(dto.afterDate) },
              id: { lt: BigInt(dto.afterId) },
            },
          ],
        },
      ];
    }

    const [rows, footerTotals] = await Promise.all([
      this.prisma.purchaseBill.findMany({
        where,
        orderBy: [{ billDate: 'desc' }, { id: 'desc' }],
        take: limit,
        include: {
          party: { select: { id: true, name: true } },
        },
      }),
      this.getListTotals(firmId, fy),
    ]);

    const data = rows.map((b) => ({
      id: b.id.toString(),
      billDate: b.billDate,
      billNo: b.billNo,
      billType: b.billType,
      party: { id: b.party.id.toString(), name: b.party.name },
      totalAmount: toNum(b.totalAmount),
      pendingAmount: toNum(b.pendingAmount),
      paidAmount: toNum(b.paidAmount),
      status: b.status,
      dueDate: b.dueDate,
      dueDays: b.dueDays,
    }));

    return { data, totals: footerTotals, hasMore: rows.length === limit };
  }

  private async getListTotals(firmId: bigint, fy: number) {
    const cacheKey = PurchaseBillKeys.totals(firmId, fy);
    const cached = await this.redis.get<{ count: number; totalAmount: number; pendingAmount: number }>(cacheKey);
    if (cached) return cached;

    const agg = await this.prisma.purchaseBill.aggregate({
      where: { firmId, fy, deletedAt: null },
      _count: { id: true },
      _sum: { totalAmount: true, pendingAmount: true },
    });

    const result = {
      count: agg._count.id,
      totalAmount: toNum(agg._sum.totalAmount),
      pendingAmount: toNum(agg._sum.pendingAmount),
    };
    await this.redis.set(cacheKey, result, CacheTTL.BILL_TOTALS);
    return result;
  }

  // ── create ───────────────────────────────────────────────────────────────

  async create(tenant: TenantContext, userId: bigint, dto: CreatePurchaseBillDto) {
    const { accountId, firmId, fy } = tenant;

    const [party, firm] = await Promise.all([
      this.prisma.party.findFirst({
        where: { id: BigInt(dto.partyId), firmId, deletedAt: null },
        select: { id: true, state: true, defaultDueDays: true },
      }),
      this.prisma.firm.findUnique({
        where: { id: firmId },
        select: { state: true },
      }),
    ]);
    if (!party) throw new NotFoundException('Party not found');

    // Check for duplicate supplier bill number in this FY
    const existing = await this.prisma.purchaseBill.findFirst({
      where: {
        firmId,
        fy,
        partyId: BigInt(dto.partyId),
        billNo: dto.billNo,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Bill number "${dto.billNo}" already exists for this party in the current financial year`,
      );
    }

    const applyGst = dto.applyGst ?? false;
    const isInterstate = !!(party.state && firm?.state && party.state !== firm.state);

    const itemInputs = dto.items.map((item) => ({
      qty: item.qty,
      rate: item.rate,
      discountPct: item.discountPct,
      gstPct: item.gstPct,
    }));

    const { items: calcedItems, totals } = calcPurchaseItems(itemInputs, {
      applyGst,
      isInterstate,
    });

    const billDate = dto.billDate ? new Date(dto.billDate) : new Date();
    const dueDays = dto.dueDays ?? (party.defaultDueDays > 0 ? party.defaultDueDays : undefined);
    let dueDate: Date | undefined;
    if (dto.dueDate) {
      dueDate = new Date(dto.dueDate);
    } else if (dueDays) {
      dueDate = new Date(billDate);
      dueDate.setDate(dueDate.getDate() + dueDays);
    }

    const bill = await this.prisma.$transaction(async (tx) => {
      const created = await tx.purchaseBill.create({
        data: {
          accountId,
          firmId,
          fy,
          partyId: BigInt(dto.partyId),
          billType: dto.billType,
          billNo: dto.billNo,
          billDate,
          dueDays: dueDays ?? null,
          dueDate: dueDate ?? null,
          applyGst,
          netAmount: totals.netAmount,
          discountAmount: totals.discountAmount,
          taxableAmount: totals.taxableAmount,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          igstAmount: totals.igstAmount,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          pendingAmount: totals.totalAmount,
          status: BillStatus.UNPAID,
          remarks: dto.remarks ?? null,
          createdBy: userId,
        },
      });

      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        const calc = calcedItems[i];

        let productSnapshot: string | null = null;
        if (itemDto.productId) {
          const prod = await tx.product.findUnique({
            where: { id: BigInt(itemDto.productId) },
            select: { name: true },
          });
          productSnapshot = prod?.name ?? null;
        }

        await tx.purchaseBillItem.create({
          data: {
            purchaseBillId: created.id,
            productId: itemDto.productId ? BigInt(itemDto.productId) : null,
            productNameSnapshot: productSnapshot,
            itemCode: itemDto.itemCode ?? null,
            hsnCode: itemDto.hsnCode ?? null,
            qty: d(itemDto.qty),
            unit: itemDto.unit,
            rate: d(itemDto.rate),
            discountPct: d(itemDto.discountPct ?? 0),
            discountAmount: calc.discountAmount,
            gstPct: itemDto.gstPct ?? null,
            cgstAmount: calc.cgstAmount,
            sgstAmount: calc.sgstAmount,
            igstAmount: calc.igstAmount,
            amount: calc.amount,
            lineNo: i + 1,
          },
        });
      }

      return created;
    });

    await this.invalidateCaches(firmId, fy, bill.id, BigInt(dto.partyId));
    return serialise(await this.findOne(tenant, bill.id));
  }

  // ── findOne ──────────────────────────────────────────────────────────────

  async findOne(tenant: TenantContext, id: bigint) {
    const cacheKey = PurchaseBillKeys.detail(id);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const bill = await this.prisma.purchaseBill.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
      include: {
        party: {
          select: { id: true, name: true, gstNo: true, address: true, state: true, city: true },
        },
        items: {
          orderBy: { lineNo: 'asc' },
          include: { product: { select: { id: true, name: true } } },
        },
        attachments: {
          select: { id: true, s3Key: true, mimeType: true, sizeBytes: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!bill) throw new NotFoundException('Purchase bill not found');

    const result = serialise(bill);
    await this.redis.set(cacheKey, result, CacheTTL.BILL_DETAIL);
    return result;
  }

  // ── update ───────────────────────────────────────────────────────────────

  async update(tenant: TenantContext, id: bigint, dto: UpdatePurchaseBillDto) {
    const bill = await this.prisma.purchaseBill.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
    });
    if (!bill) throw new NotFoundException('Purchase bill not found');

    // If billNo changes, check for duplicates
    const newBillNo = dto.billNo ?? bill.billNo;
    const newPartyId = dto.partyId ? BigInt(dto.partyId) : bill.partyId;

    if (dto.billNo && dto.billNo !== bill.billNo) {
      const dup = await this.prisma.purchaseBill.findFirst({
        where: {
          firmId: tenant.firmId,
          fy: tenant.fy,
          partyId: newPartyId,
          billNo: dto.billNo,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (dup) {
        throw new BadRequestException(
          `Bill number "${dto.billNo}" already exists for this party in the current financial year`,
        );
      }
    }

    const itemsToProcess = dto.items;
    if (!itemsToProcess?.length) {
      // Metadata-only update
      const billDate = dto.billDate ? new Date(dto.billDate) : bill.billDate;
      const dueDays = dto.dueDays ?? bill.dueDays ?? undefined;
      let dueDate: Date | undefined;
      if (dto.dueDate) dueDate = new Date(dto.dueDate);
      else if (dueDays) {
        dueDate = new Date(billDate);
        dueDate.setDate(dueDate.getDate() + dueDays);
      }

      await this.prisma.purchaseBill.update({
        where: { id },
        data: {
          ...(dto.partyId && { partyId: newPartyId }),
          ...(dto.billNo && { billNo: newBillNo }),
          ...(dto.billType && { billType: dto.billType }),
          ...(dto.billDate && { billDate }),
          ...(dto.dueDays !== undefined && { dueDays }),
          ...(dueDate && { dueDate }),
          ...(dto.applyGst !== undefined && { applyGst: dto.applyGst }),
          ...(dto.remarks !== undefined && { remarks: dto.remarks }),
        },
      });
    } else {
      const [party, firm] = await Promise.all([
        this.prisma.party.findFirst({
          where: { id: newPartyId, firmId: tenant.firmId, deletedAt: null },
          select: { state: true, defaultDueDays: true },
        }),
        this.prisma.firm.findUnique({
          where: { id: tenant.firmId },
          select: { state: true },
        }),
      ]);

      const applyGst = dto.applyGst ?? bill.applyGst;
      const isInterstate = !!(party?.state && firm?.state && party.state !== firm.state);

      const itemInputs = itemsToProcess.map((item) => ({
        qty: item.qty!,
        rate: item.rate!,
        discountPct: item.discountPct,
        gstPct: item.gstPct,
      }));

      const { items: calcedItems, totals } = calcPurchaseItems(itemInputs, {
        applyGst,
        isInterstate,
      });

      const billDate = dto.billDate ? new Date(dto.billDate) : bill.billDate;
      const dueDays = dto.dueDays ?? bill.dueDays ?? undefined;
      let dueDate: Date | undefined;
      if (dto.dueDate) dueDate = new Date(dto.dueDate);
      else if (dueDays) {
        dueDate = new Date(billDate);
        dueDate.setDate(dueDate.getDate() + dueDays);
      }

      const paidAmount = bill.paidAmount;
      const pendingAmount = totals.totalAmount.minus(paidAmount);
      const status = pendingAmount.lte(0)
        ? BillStatus.PAID
        : paidAmount.gt(0)
          ? BillStatus.PARTIAL
          : BillStatus.UNPAID;

      await this.prisma.$transaction(async (tx) => {
        // Wipe old items (cascade)
        await tx.purchaseBillItem.deleteMany({ where: { purchaseBillId: id } });

        await tx.purchaseBill.update({
          where: { id },
          data: {
            ...(dto.partyId && { partyId: newPartyId }),
            ...(dto.billNo && { billNo: newBillNo }),
            ...(dto.billType && { billType: dto.billType }),
            billDate,
            ...(dueDays !== undefined && { dueDays }),
            ...(dueDate && { dueDate }),
            applyGst,
            netAmount: totals.netAmount,
            discountAmount: totals.discountAmount,
            taxableAmount: totals.taxableAmount,
            cgstAmount: totals.cgstAmount,
            sgstAmount: totals.sgstAmount,
            igstAmount: totals.igstAmount,
            taxAmount: totals.taxAmount,
            totalAmount: totals.totalAmount,
            pendingAmount: pendingAmount.lt(0) ? d(0) : pendingAmount,
            status,
            ...(dto.remarks !== undefined && { remarks: dto.remarks }),
          },
        });

        for (let i = 0; i < itemsToProcess.length; i++) {
          const itemDto = itemsToProcess[i];
          const calc = calcedItems[i];

          let productSnapshot: string | null = null;
          if (itemDto.productId) {
            const prod = await tx.product.findUnique({
              where: { id: BigInt(itemDto.productId) },
              select: { name: true },
            });
            productSnapshot = prod?.name ?? null;
          }

          await tx.purchaseBillItem.create({
            data: {
              purchaseBillId: id,
              productId: itemDto.productId ? BigInt(itemDto.productId) : null,
              productNameSnapshot: productSnapshot,
              itemCode: itemDto.itemCode ?? null,
              hsnCode: itemDto.hsnCode ?? null,
              qty: d(itemDto.qty!),
              unit: itemDto.unit!,
              rate: d(itemDto.rate!),
              discountPct: d(itemDto.discountPct ?? 0),
              discountAmount: calc.discountAmount,
              gstPct: itemDto.gstPct ?? null,
              cgstAmount: calc.cgstAmount,
              sgstAmount: calc.sgstAmount,
              igstAmount: calc.igstAmount,
              amount: calc.amount,
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
    const bill = await this.prisma.purchaseBill.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
      select: { id: true, partyId: true, status: true },
    });
    if (!bill) throw new NotFoundException('Purchase bill not found');
    if (bill.status !== BillStatus.UNPAID) {
      throw new BadRequestException('Cannot delete a bill that has payments recorded');
    }

    await this.prisma.purchaseBill.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.invalidateCaches(tenant.firmId, tenant.fy, id, bill.partyId);
    return { success: true };
  }

  // ── recordPayment ────────────────────────────────────────────────────────

  async recordPayment(
    tenant: TenantContext,
    userId: bigint,
    billId: bigint,
    dto: RecordPurchasePaymentDto,
  ) {
    const { accountId, firmId, fy } = tenant;

    const bill = await this.prisma.purchaseBill.findFirst({
      where: { id: billId, firmId, deletedAt: null },
      select: {
        id: true,
        partyId: true,
        totalAmount: true,
        paidAmount: true,
        pendingAmount: true,
        status: true,
      },
    });
    if (!bill) throw new NotFoundException('Purchase bill not found');
    if (bill.status === BillStatus.PAID) {
      throw new BadRequestException('Bill is already fully paid');
    }

    const transactionAmount = d(dto.transactionAmount);
    const settlementAmount = d(dto.settlementAmount ?? 0);
    const totalPaid = transactionAmount.plus(settlementAmount);

    const newPaid = bill.paidAmount.plus(totalPaid);
    const newPending = bill.totalAmount.minus(newPaid);
    const newStatus = newPending.lte(0) ? BillStatus.PAID : BillStatus.PARTIAL;

    const lastTxn = await this.prisma.transaction.findFirst({
      where: { firmId, fy },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const seq = lastTxn ? Number(lastTxn.id) + 1 : 1;
    const refNumber = nextRefNumber(firmId, fy, seq);

    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    await this.prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          accountId,
          firmId,
          fy,
          refNumber,
          txnDate: paymentDate,
          partyId: bill.partyId,
          txnType: TxnType.DEBIT,
          txnFor: TxnFor.PURCHASE,
          sourceTable: 'purchase_bills',
          sourceId: billId,
          paymentMode: dto.paymentMode,
          amount: transactionAmount,
          settlementAmount,
          note: dto.note ?? null,
          createdBy: userId,
        },
      });

      await tx.billPaymentAllocation.create({
        data: {
          transactionId: txn.id,
          billTable: 'purchase_bills',
          billId,
          allocatedAmount: totalPaid,
        },
      });

      await tx.purchaseBill.update({
        where: { id: billId },
        data: {
          paidAmount: newPaid,
          pendingAmount: newPending.lt(0) ? d(0) : newPending,
          status: newStatus,
        },
      });
    });

    await this.invalidateCaches(firmId, fy, billId, bill.partyId);
    return serialise(await this.findOne(tenant, billId));
  }

  // ── enqueuePdf ───────────────────────────────────────────────────────────

  async verifyExists(firmId: bigint, billId: bigint): Promise<void> {
    const bill = await this.prisma.purchaseBill.findFirst({
      where: { id: billId, firmId, deletedAt: null },
      select: { id: true },
    });
    if (!bill) throw new NotFoundException('Purchase bill not found');
  }

  // ── cache invalidation ───────────────────────────────────────────────────

  private async invalidateCaches(
    firmId: bigint,
    fy: number,
    billId: bigint,
    partyId: bigint,
  ) {
    await this.redis.del(
      PurchaseBillKeys.detail(billId),
      PurchaseBillKeys.totals(firmId, fy),
      DashboardKeys.kpi(firmId, fy),
      DashboardKeys.purchaseChart(firmId, fy),
      PartyKeys.outstanding(firmId, partyId),
    );
    await Promise.all([
      this.redis.invalidatePattern(PurchaseBillKeys.pdfPattern(billId)),
      this.redis.invalidatePattern(ReportKeys.purchasePattern(firmId, fy)),
      this.redis.invalidatePattern(ReportKeys.profitLossPattern(firmId, fy)),
    ]);
  }
}
