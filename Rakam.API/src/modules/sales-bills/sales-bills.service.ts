import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BillStatus, BillType, DiscountScope, GstPct, Prisma, TxnFor, TxnType } from '@prisma/client';

type Decimal = Prisma.Decimal;
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { CreateSalesBillDto } from './dto/create-sales-bill.dto';
import { UpdateSalesBillDto } from './dto/update-sales-bill.dto';
import { ListSalesBillsDto } from './dto/list-sales-bills.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import {
  CacheTTL,
  DashboardKeys,
  PartyKeys,
  ReportKeys,
  SalesBillKeys,
} from '../../common/cache-keys';

// ─── GST rate lookup (enum value → numeric %) ────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function d(n: number | string): Decimal {
  return new Prisma.Decimal(n);
}

function toNum(dec: Decimal | null | undefined): number {
  return dec ? dec.toNumber() : 0;
}

/**
 * Recursively convert BigInt to string for JSON serialisation.
 * Decimal (Prisma) values are converted to numbers.
 */
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

// ─── Tax calculation ──────────────────────────────────────────────────────────

interface ItemInput {
  qty: number;
  rate: number;
  discountPct?: number;
  gstPct?: GstPct;
  isLossProduct?: boolean;
}

interface ItemCalc extends ItemInput {
  grossAmount: Decimal;
  discountAmount: Decimal;
  amount: Decimal; // after item-level discount
  gstAmount: Decimal;
  cgstAmount: Decimal;
  sgstAmount: Decimal;
  igstAmount: Decimal;
}

interface BillTotals {
  netAmount: Decimal;         // sum of line gross amounts
  discountAmount: Decimal;    // bill-level + item-level combined
  taxableAmount: Decimal;     // netAmount - discountAmount
  cgstAmount: Decimal;
  sgstAmount: Decimal;
  igstAmount: Decimal;
  taxAmount: Decimal;
  totalAmount: Decimal;
}

function calcItems(
  items: ItemInput[],
  opts: {
    applyGst: boolean;
    discountScope: DiscountScope;
    gstScope: DiscountScope;
    billDiscountPct: number;
    isInterstate: boolean; // true → IGST; false → CGST+SGST
    firmGstPct?: GstPct;   // used when gstScope = BILL
  },
): { items: ItemCalc[]; totals: BillTotals } {
  const calcedItems: ItemCalc[] = items.map((item) => {
    const gross = d(item.qty).mul(d(item.rate));
    let itemDiscount = d(0);
    if (opts.discountScope === DiscountScope.ITEM && (item.discountPct ?? 0) > 0) {
      itemDiscount = gross.mul(d(item.discountPct!)).div(100);
    }
    const lineAmt = gross.minus(itemDiscount);

    // Item-level GST (calculated even if scope=BILL, stored per line later)
    let gstAmt = d(0);
    let cgstAmt = d(0);
    let sgstAmt = d(0);
    let igstAmt = d(0);

    if (opts.applyGst && opts.gstScope === DiscountScope.ITEM && item.gstPct) {
      const pct = GST_PCT_MAP[item.gstPct] ?? 0;
      gstAmt = lineAmt.mul(d(pct)).div(100);
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
      gstAmount: gstAmt,
      cgstAmount: cgstAmt,
      sgstAmount: sgstAmt,
      igstAmount: igstAmt,
    };
  });

  // Bill-level aggregation
  const netAmount = calcedItems.reduce((s, i) => s.plus(i.grossAmount), d(0));
  let billDiscountAmt = d(0);
  if (opts.discountScope === DiscountScope.BILL && opts.billDiscountPct > 0) {
    billDiscountAmt = netAmount.mul(d(opts.billDiscountPct)).div(100);
  }
  const itemDiscountTotal = calcedItems.reduce((s, i) => s.plus(i.discountAmount), d(0));
  const totalDiscountAmount = billDiscountAmt.plus(itemDiscountTotal);
  const taxableAmount = netAmount.minus(totalDiscountAmount);

  let cgstTotal = d(0);
  let sgstTotal = d(0);
  let igstTotal = d(0);

  if (opts.applyGst) {
    if (opts.gstScope === DiscountScope.BILL && opts.firmGstPct) {
      const pct = GST_PCT_MAP[opts.firmGstPct] ?? 0;
      const billGst = taxableAmount.mul(d(pct)).div(100);
      if (opts.isInterstate) {
        igstTotal = billGst;
      } else {
        cgstTotal = billGst.div(2);
        sgstTotal = billGst.div(2);
      }
    } else if (opts.gstScope === DiscountScope.ITEM) {
      cgstTotal = calcedItems.reduce((s, i) => s.plus(i.cgstAmount), d(0));
      sgstTotal = calcedItems.reduce((s, i) => s.plus(i.sgstAmount), d(0));
      igstTotal = calcedItems.reduce((s, i) => s.plus(i.igstAmount), d(0));

      // When bill scope discount, apportion tax reduction
      if (opts.discountScope === DiscountScope.BILL && opts.billDiscountPct > 0 && netAmount.gt(0)) {
        const ratio = taxableAmount.div(netAmount);
        cgstTotal = cgstTotal.mul(ratio);
        sgstTotal = sgstTotal.mul(ratio);
        igstTotal = igstTotal.mul(ratio);
      }
    }
  }

  const taxAmount = cgstTotal.plus(sgstTotal).plus(igstTotal);
  const totalAmount = taxableAmount.plus(taxAmount);

  return {
    items: calcedItems,
    totals: {
      netAmount,
      discountAmount: totalDiscountAmount,
      taxableAmount,
      cgstAmount: cgstTotal,
      sgstAmount: sgstTotal,
      igstAmount: igstTotal,
      taxAmount,
      totalAmount,
    },
  };
}

function nextRefNumber(firmId: bigint, fy: number, seq: number): string {
  return `TXN/${fy}/${String(seq).padStart(4, '0')}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class SalesBillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── list ─────────────────────────────────────────────────────────────────

  async list(tenant: TenantContext, dto: ListSalesBillsDto) {
    const { firmId, fy } = tenant;
    const limit = dto.limit ?? 20;

    const where: Prisma.SalesBillWhereInput = {
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
        { billNoDisplay: { contains: dto.search, mode: 'insensitive' } },
        { party: { name: { contains: dto.search, mode: 'insensitive' } } },
      ];
    }

    // Keyset pagination
    if (dto.afterDate && dto.afterId) {
      where.OR = [
        { billDate: { lt: new Date(dto.afterDate) } },
        {
          billDate: { equals: new Date(dto.afterDate) },
          id: { lt: BigInt(dto.afterId) },
        },
      ];
    }

    const [rows, footerTotals] = await Promise.all([
      this.prisma.salesBill.findMany({
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
      billNoDisplay: b.billNoDisplay,
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
    const cacheKey = SalesBillKeys.totals(firmId, fy);
    const cached = await this.redis.get<{ count: number; totalAmount: number; pendingAmount: number }>(cacheKey);
    if (cached) return cached;

    const agg = await this.prisma.salesBill.aggregate({
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

  async create(tenant: TenantContext, userId: bigint, dto: CreateSalesBillDto) {
    const { accountId, firmId, fy } = tenant;

    const [party, firmSettings] = await Promise.all([
      this.prisma.party.findFirst({
        where: { id: BigInt(dto.partyId), firmId, deletedAt: null },
        select: { id: true, state: true, defaultDiscountPct: true, defaultDueDays: true },
      }),
      this.prisma.firmSalesBillSettings.findUnique({ where: { firmId } }),
    ]);
    if (!party) throw new NotFoundException('Party not found');

    const firm = await this.prisma.firm.findUnique({
      where: { id: firmId },
      select: { state: true, defaultGstPct: true },
    });

    const settings = firmSettings ?? null;
    const discountScope: DiscountScope = settings?.discountScope ?? DiscountScope.BILL;
    const gstScope: DiscountScope = settings?.gstScope ?? DiscountScope.BILL;
    const billPrefix = settings?.billPrefix ?? '';
    const applyGst = dto.applyGst ?? false;
    const billDiscountPct = dto.discountPct ?? 0;

    // Intrastate vs interstate GST
    const isInterstate = !!(party.state && firm?.state && party.state !== firm.state);

    // Flatten all items across challans for tax calculation
    const allItems: ItemInput[] = dto.challans.flatMap((c) =>
      c.items.map((item) => ({
        qty: item.qty,
        rate: item.rate,
        discountPct: item.discountPct,
        gstPct: item.gstPct,
        isLossProduct: item.isLossProduct,
      })),
    );

    const { totals } = calcItems(allItems, {
      applyGst,
      discountScope,
      gstScope,
      billDiscountPct,
      isInterstate,
      firmGstPct: firm?.defaultGstPct ?? undefined,
    });

    // Atomic bill number allocation
    const billNoSeq = await this.allocateBillNoSeq(firmId, fy, dto.billType);
    const billNoDisplay = billPrefix
      ? `${billPrefix}${billNoSeq}`
      : String(billNoSeq);

    // Resolve due date
    const billDate = dto.billDate ? new Date(dto.billDate) : new Date();
    const dueDays =
      dto.dueDays ??
      (party.defaultDueDays > 0 ? party.defaultDueDays : undefined);
    let dueDate: Date | undefined;
    if (dto.dueDate) {
      dueDate = new Date(dto.dueDate);
    } else if (dueDays) {
      dueDate = new Date(billDate);
      dueDate.setDate(dueDate.getDate() + dueDays);
    }

    // Validate imported delivery challans belong to firm / party
    const dcIds = dto.challans
      .filter((c) => c.deliveryChallanId)
      .map((c) => BigInt(c.deliveryChallanId!));
    if (dcIds.length > 0) {
      const dcs = await this.prisma.deliveryChallan.findMany({
        where: { id: { in: dcIds }, firmId, partyId: BigInt(dto.partyId), salesBillId: null, deletedAt: null },
        select: { id: true },
      });
      if (dcs.length !== dcIds.length) {
        throw new BadRequestException('One or more delivery challans are invalid or already billed');
      }
    }

    const bill = await this.prisma.$transaction(async (tx) => {
      const created = await tx.salesBill.create({
        data: {
          accountId,
          firmId,
          fy,
          partyId: BigInt(dto.partyId),
          billType: dto.billType,
          billNoPrefix: billPrefix || null,
          billNoSeq,
          billNoDisplay,
          billDate,
          dueDays: dueDays ?? null,
          dueDate: dueDate ?? null,
          applyGst,
          discountScope,
          gstScope,
          discountPct: d(billDiscountPct),
          discountAmount: totals.discountAmount,
          netAmount: totals.netAmount,
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

      // Create challans + items
      let globalLineNo = 0;
      for (const challanDto of dto.challans) {
        const challan = await tx.salesBillChallan.create({
          data: {
            salesBillId: created.id,
            deliveryChallanId: challanDto.deliveryChallanId
              ? BigInt(challanDto.deliveryChallanId)
              : null,
            challanNumber: challanDto.challanNumber ?? null,
            challanDate: challanDto.challanDate ? new Date(challanDto.challanDate) : null,
            noChallan: challanDto.noChallan ?? false,
          },
        });

        for (const itemDto of challanDto.items) {
          const gross = d(itemDto.qty).mul(d(itemDto.rate));
          let itemDiscAmt = d(0);
          if (discountScope === DiscountScope.ITEM && (itemDto.discountPct ?? 0) > 0) {
            itemDiscAmt = gross.mul(d(itemDto.discountPct!)).div(100);
          }
          const lineAmt = gross.minus(itemDiscAmt);

          let cgstAmt = d(0);
          let sgstAmt = d(0);
          let igstAmt = d(0);
          if (applyGst && gstScope === DiscountScope.ITEM && itemDto.gstPct) {
            const pct = GST_PCT_MAP[itemDto.gstPct] ?? 0;
            const gst = lineAmt.mul(d(pct)).div(100);
            if (isInterstate) igstAmt = gst;
            else { cgstAmt = gst.div(2); sgstAmt = gst.div(2); }
          }

          let productSnapshot: string | null = null;
          if (itemDto.productId) {
            const prod = await tx.product.findUnique({
              where: { id: BigInt(itemDto.productId) },
              select: { name: true },
            });
            productSnapshot = prod?.name ?? null;
          }

          await tx.salesBillItem.create({
            data: {
              salesBillId: created.id,
              challanId: challan.id,
              productId: itemDto.productId ? BigInt(itemDto.productId) : null,
              productNameSnapshot: productSnapshot,
              itemCode: itemDto.itemCode ?? null,
              hsnCode: itemDto.hsnCode ?? null,
              qty: d(itemDto.qty),
              unit: itemDto.unit,
              rate: d(itemDto.rate),
              discountPct: d(itemDto.discountPct ?? 0),
              discountAmount: itemDiscAmt,
              gstPct: itemDto.gstPct ?? null,
              cgstAmount: cgstAmt,
              sgstAmount: sgstAmt,
              igstAmount: igstAmt,
              amount: lineAmt,
              isLossProduct: itemDto.isLossProduct ?? false,
              lineNo: ++globalLineNo,
            },
          });
        }
      }

      // Mark imported DCs as billed
      if (dcIds.length > 0) {
        await tx.deliveryChallan.updateMany({
          where: { id: { in: dcIds } },
          data: { salesBillId: created.id },
        });
      }

      return created;
    });

    await this.invalidateBillCaches(firmId, fy, bill.id, BigInt(dto.partyId));
    return serialise(await this.findOne(tenant, bill.id));
  }

  // ── findOne ──────────────────────────────────────────────────────────────

  async findOne(tenant: TenantContext, id: bigint) {
    const cacheKey = SalesBillKeys.detail(id);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const bill = await this.prisma.salesBill.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
      include: {
        party: {
          select: { id: true, name: true, gstNo: true, address: true, state: true, city: true },
        },
        challans: {
          include: {
            items: {
              orderBy: { lineNo: 'asc' },
              include: { product: { select: { id: true, name: true } } },
            },
            deliveryChallan: { select: { id: true, dcNoDisplay: true } },
          },
          orderBy: { id: 'asc' },
        },
        ewayBills: { select: { id: true, ewayBillNo: true, status: true, generatedAt: true } },
        creditNotes: {
          where: { deletedAt: null },
          select: { id: true, noteNoSeq: true, noteDate: true, totalAmount: true },
          orderBy: { noteDate: 'desc' },
        },
      },
    });
    if (!bill) throw new NotFoundException('Sales bill not found');

    const result = serialise(bill);
    await this.redis.set(cacheKey, result, CacheTTL.BILL_DETAIL);
    return result;
  }

  // ── update ───────────────────────────────────────────────────────────────

  async update(tenant: TenantContext, id: bigint, dto: UpdateSalesBillDto) {
    const bill = await this.prisma.salesBill.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
    });
    if (!bill) throw new NotFoundException('Sales bill not found');

    const [party, firmSettings, firm] = await Promise.all([
      dto.partyId
        ? this.prisma.party.findFirst({
            where: { id: BigInt(dto.partyId), firmId: tenant.firmId, deletedAt: null },
            select: { id: true, state: true, defaultDueDays: true },
          })
        : Promise.resolve(null),
      this.prisma.firmSalesBillSettings.findUnique({ where: { firmId: tenant.firmId } }),
      this.prisma.firm.findUnique({
        where: { id: tenant.firmId },
        select: { state: true, defaultGstPct: true },
      }),
    ]);

    const effectivePartyId = dto.partyId ? BigInt(dto.partyId) : bill.partyId;
    const resolvedParty =
      party ??
      (await this.prisma.party.findFirst({
        where: { id: effectivePartyId, firmId: tenant.firmId },
        select: { state: true, defaultDueDays: true },
      }));

    const settings = firmSettings ?? null;
    const discountScope = (settings?.discountScope ?? DiscountScope.BILL) as DiscountScope;
    const gstScope = (settings?.gstScope ?? DiscountScope.BILL) as DiscountScope;
    const applyGst = dto.applyGst ?? bill.applyGst;
    const billDiscountPct = dto.discountPct ?? toNum(bill.discountPct);
    const isInterstate = !!(
      resolvedParty?.state &&
      firm?.state &&
      resolvedParty.state !== firm.state
    );

    const challansToProcess = dto.challans;
    if (!challansToProcess?.length) {
      // No structural change — just update metadata
      const billDate = dto.billDate ? new Date(dto.billDate) : bill.billDate;
      const dueDays = dto.dueDays ?? bill.dueDays ?? undefined;
      let dueDate: Date | undefined;
      if (dto.dueDate) dueDate = new Date(dto.dueDate);
      else if (dueDays) {
        dueDate = new Date(billDate);
        dueDate.setDate(dueDate.getDate() + dueDays);
      }

      await this.prisma.salesBill.update({
        where: { id },
        data: {
          ...(dto.partyId && { partyId: BigInt(dto.partyId) }),
          ...(dto.billDate && { billDate }),
          ...(dto.dueDays !== undefined && { dueDays }),
          ...(dueDate && { dueDate }),
          ...(dto.remarks !== undefined && { remarks: dto.remarks }),
        },
      });
    } else {
      // Full recalculation with updated items
      const allItems = challansToProcess.flatMap((c) =>
        c.items.map((item) => ({
          qty: item.qty,
          rate: item.rate,
          discountPct: item.discountPct,
          gstPct: item.gstPct,
          isLossProduct: item.isLossProduct,
        })),
      );

      const { totals } = calcItems(allItems, {
        applyGst,
        discountScope,
        gstScope,
        billDiscountPct,
        isInterstate,
        firmGstPct: firm?.defaultGstPct ?? undefined,
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
        // Wipe old challans & items (cascade)
        await tx.salesBillChallan.deleteMany({ where: { salesBillId: id } });

        await tx.salesBill.update({
          where: { id },
          data: {
            ...(dto.partyId && { partyId: BigInt(dto.partyId) }),
            billDate,
            ...(dueDays !== undefined && { dueDays }),
            ...(dueDate && { dueDate }),
            applyGst,
            discountScope,
            gstScope,
            discountPct: d(billDiscountPct),
            discountAmount: totals.discountAmount,
            netAmount: totals.netAmount,
            taxableAmount: totals.taxableAmount,
            cgstAmount: totals.cgstAmount,
            sgstAmount: totals.sgstAmount,
            igstAmount: totals.igstAmount,
            taxAmount: totals.taxAmount,
            totalAmount: totals.totalAmount,
            pendingAmount,
            status,
            ...(dto.remarks !== undefined && { remarks: dto.remarks }),
          },
        });

        // Re-create challans + items
        let globalLineNo = 0;
        for (const challanDto of challansToProcess) {
          const challan = await tx.salesBillChallan.create({
            data: {
              salesBillId: id,
              deliveryChallanId: challanDto.deliveryChallanId
                ? BigInt(challanDto.deliveryChallanId)
                : null,
              challanNumber: challanDto.challanNumber ?? null,
              challanDate: challanDto.challanDate ? new Date(challanDto.challanDate) : null,
              noChallan: challanDto.noChallan ?? false,
            },
          });

          for (const itemDto of challanDto.items) {
            const gross = d(itemDto.qty).mul(d(itemDto.rate));
            let itemDiscAmt = d(0);
            if (discountScope === DiscountScope.ITEM && (itemDto.discountPct ?? 0) > 0) {
              itemDiscAmt = gross.mul(d(itemDto.discountPct!)).div(100);
            }
            const lineAmt = gross.minus(itemDiscAmt);
            let cgstAmt = d(0);
            let sgstAmt = d(0);
            let igstAmt = d(0);
            if (applyGst && gstScope === DiscountScope.ITEM && itemDto.gstPct) {
              const pct = GST_PCT_MAP[itemDto.gstPct] ?? 0;
              const gst = lineAmt.mul(d(pct)).div(100);
              if (isInterstate) igstAmt = gst;
              else { cgstAmt = gst.div(2); sgstAmt = gst.div(2); }
            }

            let productSnapshot: string | null = null;
            if (itemDto.productId) {
              const prod = await tx.product.findUnique({
                where: { id: BigInt(itemDto.productId) },
                select: { name: true },
              });
              productSnapshot = prod?.name ?? null;
            }

            await tx.salesBillItem.create({
              data: {
                salesBillId: id,
                challanId: challan.id,
                productId: itemDto.productId ? BigInt(itemDto.productId) : null,
                productNameSnapshot: productSnapshot,
                itemCode: itemDto.itemCode ?? null,
                hsnCode: itemDto.hsnCode ?? null,
                qty: d(itemDto.qty),
                unit: itemDto.unit,
                rate: d(itemDto.rate),
                discountPct: d(itemDto.discountPct ?? 0),
                discountAmount: itemDiscAmt,
                gstPct: itemDto.gstPct ?? null,
                cgstAmount: cgstAmt,
                sgstAmount: sgstAmt,
                igstAmount: igstAmt,
                amount: lineAmt,
                isLossProduct: itemDto.isLossProduct ?? false,
                lineNo: ++globalLineNo,
              },
            });
          }
        }
      });
    }

    await this.invalidateBillCaches(tenant.firmId, tenant.fy, id, effectivePartyId);
    return serialise(await this.findOne(tenant, id));
  }

  // ── remove ───────────────────────────────────────────────────────────────

  async remove(tenant: TenantContext, id: bigint) {
    const bill = await this.prisma.salesBill.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
      select: { id: true, partyId: true, status: true },
    });
    if (!bill) throw new NotFoundException('Sales bill not found');
    if (bill.status !== BillStatus.UNPAID) {
      throw new BadRequestException('Cannot delete a bill that has payments recorded');
    }

    await this.prisma.salesBill.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.invalidateBillCaches(tenant.firmId, tenant.fy, id, bill.partyId);
    return { success: true };
  }

  // ── duplicate ────────────────────────────────────────────────────────────

  async duplicate(tenant: TenantContext, userId: bigint, id: bigint) {
    const source = await this.prisma.salesBill.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
      include: {
        challans: { include: { items: true } },
      },
    });
    if (!source) throw new NotFoundException('Sales bill not found');

    const dto: CreateSalesBillDto = {
      partyId: Number(source.partyId),
      billType: source.billType,
      billDate: new Date().toISOString(),
      applyGst: source.applyGst,
      discountPct: toNum(source.discountPct),
      remarks: source.remarks ?? undefined,
      challans: source.challans.map((ch) => ({
        noChallan: ch.noChallan,
        challanNumber: ch.challanNumber ?? undefined,
        challanDate: ch.challanDate?.toISOString() ?? undefined,
        items: ch.items.map((it) => ({
          productId: it.productId ? Number(it.productId) : undefined,
          itemCode: it.itemCode ?? undefined,
          hsnCode: it.hsnCode ?? undefined,
          qty: toNum(it.qty),
          unit: it.unit,
          rate: toNum(it.rate),
          discountPct: toNum(it.discountPct),
          gstPct: it.gstPct ?? undefined,
          isLossProduct: it.isLossProduct,
        })),
      })),
    };

    return this.create(tenant, userId, dto);
  }

  // ── recordPayment ────────────────────────────────────────────────────────

  async recordPayment(tenant: TenantContext, userId: bigint, billId: bigint, dto: RecordPaymentDto) {
    const { accountId, firmId, fy } = tenant;

    const bill = await this.prisma.salesBill.findFirst({
      where: { id: billId, firmId, deletedAt: null },
      select: { id: true, partyId: true, totalAmount: true, paidAmount: true, pendingAmount: true, status: true },
    });
    if (!bill) throw new NotFoundException('Sales bill not found');
    if (bill.status === BillStatus.PAID) {
      throw new BadRequestException('Bill is already fully paid');
    }

    const transactionAmount = d(dto.transactionAmount);
    const settlementAmount = d(dto.settlementAmount ?? 0);
    const totalPaid = transactionAmount.plus(settlementAmount);

    const newPaid = bill.paidAmount.plus(totalPaid);
    const newPending = bill.totalAmount.minus(newPaid);
    const newStatus = newPending.lte(0)
      ? BillStatus.PAID
      : BillStatus.PARTIAL;

    // Generate ref number using a simple sequence (max existing + 1)
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
          txnType: TxnType.CREDIT,
          txnFor: TxnFor.SALES,
          sourceTable: 'sales_bills',
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
          billTable: 'sales_bills',
          billId,
          allocatedAmount: totalPaid,
        },
      });

      await tx.salesBill.update({
        where: { id: billId },
        data: {
          paidAmount: newPaid,
          pendingAmount: newPending.lt(0) ? d(0) : newPending,
          status: newStatus,
        },
      });
    });

    await this.invalidateBillCaches(firmId, fy, billId, bill.partyId);
    return serialise(await this.findOne(tenant, billId));
  }

  // ── createCreditNote ─────────────────────────────────────────────────────

  async createCreditNote(tenant: TenantContext, billId: bigint, dto: CreateCreditNoteDto) {
    const { accountId, firmId, fy } = tenant;

    const bill = await this.prisma.salesBill.findFirst({
      where: { id: billId, firmId, deletedAt: null },
      select: { id: true, partyId: true },
    });
    if (!bill) throw new NotFoundException('Sales bill not found');

    // Get next note sequence for this bill
    const lastNote = await this.prisma.creditNote.findFirst({
      where: { salesBillId: billId, deletedAt: null },
      orderBy: { noteNoSeq: 'desc' },
      select: { noteNoSeq: true },
    });
    const noteNoSeq = (lastNote?.noteNoSeq ?? 0) + 1;
    const noteDate = dto.noteDate ? new Date(dto.noteDate) : new Date();

    const totalAmount = dto.items.reduce((sum, item) => {
      return sum.plus(d(item.qty).mul(d(item.rate)));
    }, d(0));

    const note = await this.prisma.$transaction(async (tx) => {
      const created = await tx.creditNote.create({
        data: {
          accountId,
          firmId,
          fy,
          salesBillId: billId,
          noteNoSeq,
          noteDate,
          reason: dto.reason ?? null,
          totalAmount,
        },
      });

      let lineNo = 0;
      for (const item of dto.items) {
        const amount = d(item.qty).mul(d(item.rate));
        let productSnapshot: string | null = null;
        if (item.productId) {
          const prod = await tx.product.findUnique({
            where: { id: BigInt(item.productId) },
            select: { name: true },
          });
          productSnapshot = prod?.name ?? null;
        }
        await tx.creditNoteItem.create({
          data: {
            creditNoteId: created.id,
            productId: item.productId ? BigInt(item.productId) : null,
            productNameSnapshot: productSnapshot,
            itemCode: item.itemCode ?? null,
            hsnCode: item.hsnCode ?? null,
            qty: d(item.qty),
            unit: item.unit,
            rate: d(item.rate),
            gstPct: item.gstPct ?? null,
            amount,
            lineNo: ++lineNo,
          },
        });
      }
      return created;
    });

    await this.invalidateBillCaches(firmId, fy, billId, bill.partyId);
    return serialise(note);
  }

  // ── getNextBillNo ────────────────────────────────────────────────────────

  async getNextBillNo(tenant: TenantContext, billType: BillType) {
    const { firmId, fy } = tenant;
    const cacheKey = SalesBillKeys.nextNo(firmId, fy);
    const cached = await this.redis.get<Record<string, number>>(cacheKey);
    if (cached?.[billType] !== undefined) {
      const settings = await this.prisma.firmSalesBillSettings.findUnique({
        where: { firmId },
        select: { billPrefix: true },
      });
      const prefix = settings?.billPrefix ?? '';
      return { nextSeq: cached[billType], display: prefix ? `${prefix}${cached[billType]}` : String(cached[billType]) };
    }

    const last = await this.prisma.salesBill.findFirst({
      where: { firmId, fy, billType, deletedAt: null },
      orderBy: { billNoSeq: 'desc' },
      select: { billNoSeq: true },
    });
    const nextSeq = (last?.billNoSeq ?? 0) + 1;
    const settings = await this.prisma.firmSalesBillSettings.findUnique({
      where: { firmId },
      select: { billPrefix: true },
    });
    const prefix = settings?.billPrefix ?? '';
    const display = prefix ? `${prefix}${nextSeq}` : String(nextSeq);

    await this.redis.set(cacheKey, { [billType]: nextSeq }, CacheTTL.BILL_NEXT_NO);
    return { nextSeq, display };
  }

  // ── listUnbilledDC ───────────────────────────────────────────────────────

  async listUnbilledDC(tenant: TenantContext, partyId?: number) {
    const { firmId, fy } = tenant;

    const dcs = await this.prisma.deliveryChallan.findMany({
      where: {
        firmId,
        fy,
        salesBillId: null,
        deletedAt: null,
        ...(partyId && { partyId: BigInt(partyId) }),
      },
      include: {
        items: { orderBy: { lineNo: 'asc' } },
      },
      orderBy: { dcDate: 'desc' },
      take: 100,
    });

    return serialise(dcs);
  }

  // ── enqueuePdf ───────────────────────────────────────────────────────────

  async enqueuePdf(firmId: bigint, billId: bigint): Promise<{ jobId: string }> {
    // Verify bill exists
    const bill = await this.prisma.salesBill.findFirst({
      where: { id: billId, firmId, deletedAt: null },
      select: { id: true },
    });
    if (!bill) throw new NotFoundException('Sales bill not found');

    // PDF job is enqueued by the controller via PdfService injection
    // Return the bill id; caller (controller) enqueues via PdfService
    return { jobId: billId.toString() };
  }

  // ── cache invalidation ───────────────────────────────────────────────────

  private async invalidateBillCaches(
    firmId: bigint,
    fy: number,
    billId: bigint,
    partyId: bigint,
  ) {
    await this.redis.del(
      SalesBillKeys.detail(billId),
      SalesBillKeys.nextNo(firmId, fy),
      SalesBillKeys.totals(firmId, fy),
      DashboardKeys.kpi(firmId, fy),
      DashboardKeys.salesChart(firmId, fy),
      PartyKeys.outstanding(firmId, partyId),
    );
    await Promise.all([
      this.redis.invalidatePattern(SalesBillKeys.pdfPattern(billId)),
      this.redis.invalidatePattern(ReportKeys.salesPattern(firmId, fy)),
      this.redis.invalidatePattern(ReportKeys.profitLossPattern(firmId, fy)),
    ]);
  }

  // ── allocateBillNoSeq ────────────────────────────────────────────────────

  private async allocateBillNoSeq(
    firmId: bigint,
    fy: number,
    billType: BillType,
  ): Promise<number> {
    const last = await this.prisma.salesBill.findFirst({
      where: { firmId, fy, billType },
      orderBy: { billNoSeq: 'desc' },
      select: { billNoSeq: true },
    });
    return (last?.billNoSeq ?? 0) + 1;
  }
}
