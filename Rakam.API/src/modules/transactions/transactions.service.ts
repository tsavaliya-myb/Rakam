import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BillStatus, Prisma, TxnFor, TxnType } from '@prisma/client';

type Decimal = Prisma.Decimal;
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import {
  CacheTTL,
  DashboardKeys,
  PartyKeys,
  ReportKeys,
  SalesBillKeys,
  PurchaseBillKeys,
  TransactionKeys,
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

// txnFor → txnType mapping
// SALES payment = CREDIT (we received money); PURCHASE payment = DEBIT (we paid money)
// INCOME = CREDIT; EXPENSE = DEBIT; OTHER = DEBIT
function inferTxnType(txnFor: TxnFor): TxnType {
  return txnFor === TxnFor.SALES || txnFor === TxnFor.INCOME
    ? TxnType.CREDIT
    : TxnType.DEBIT;
}

function nextRefNumber(firmId: bigint, fy: number, seq: number): string {
  return `TXN/${fy}/${String(seq).padStart(4, '0')}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── list ─────────────────────────────────────────────────────────────────

  async list(tenant: TenantContext, dto: ListTransactionsDto) {
    const { firmId, fy } = tenant;
    const limit = dto.limit ?? 20;

    const where: Prisma.TransactionWhereInput = { firmId, fy, deletedAt: null };

    if (dto.partyId) where.partyId = BigInt(dto.partyId);
    if (dto.txnType) where.txnType = dto.txnType;
    if (dto.txnFor) where.txnFor = dto.txnFor;
    if (dto.paymentMode) where.paymentMode = dto.paymentMode;

    if (dto.startDate || dto.endDate) {
      where.txnDate = {};
      if (dto.startDate) where.txnDate.gte = new Date(dto.startDate);
      if (dto.endDate) where.txnDate.lte = new Date(dto.endDate);
    }

    if (dto.afterId) {
      where.id = { lt: BigInt(dto.afterId) };
    }

    const rows = await this.prisma.transaction.findMany({
      where,
      orderBy: [{ txnDate: 'desc' }, { id: 'desc' }],
      take: limit,
      include: {
        party: { select: { name: true } },
        allocations: {
          select: {
            billTable: true,
            billId: true,
            allocatedAmount: true,
          },
        },
      },
    });

    const data = rows.map((t) => ({
      id: t.id.toString(),
      refNumber: t.refNumber,
      txnDate: t.txnDate.toISOString(),
      partyId: t.partyId?.toString() ?? null,
      partyName: t.party?.name ?? null,
      txnType: t.txnType,
      txnFor: t.txnFor,
      sourceTable: t.sourceTable,
      sourceId: t.sourceId?.toString() ?? null,
      paymentMode: t.paymentMode,
      amount: toNum(t.amount),
      settlementAmount: toNum(t.settlementAmount),
      totalAmount: toNum(t.amount) + toNum(t.settlementAmount),
      note: t.note,
      allocations: t.allocations.map((a) => ({
        billTable: a.billTable,
        billId: a.billId.toString(),
        allocatedAmount: toNum(a.allocatedAmount),
      })),
      createdAt: t.createdAt.toISOString(),
    }));

    return { data, hasMore: rows.length === limit };
  }

  // ── create ────────────────────────────────────────────────────────────────

  async create(tenant: TenantContext, userId: bigint, dto: CreateTransactionDto) {
    const { accountId, firmId, fy } = tenant;

    const partyId = dto.partyId ? BigInt(dto.partyId) : null;

    if (partyId) {
      const party = await this.prisma.party.findFirst({
        where: { id: partyId, firmId, deletedAt: null },
        select: { id: true },
      });
      if (!party) throw new NotFoundException('Party not found');
    }

    const txnType = inferTxnType(dto.txnFor);

    const lastTxn = await this.prisma.transaction.findFirst({
      where: { firmId, fy },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const seq = lastTxn ? Number(lastTxn.id) + 1 : 1;
    const refNumber = nextRefNumber(firmId, fy, seq);

    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    const txn = await this.prisma.transaction.create({
      data: {
        accountId,
        firmId,
        fy,
        refNumber,
        txnDate: paymentDate,
        partyId,
        txnType,
        txnFor: dto.txnFor,
        sourceTable: null,
        sourceId: null,
        paymentMode: dto.paymentMode,
        amount: d(dto.amount),
        settlementAmount: d(0),
        note: dto.note ?? null,
        createdBy: userId,
      },
    });

    await this.invalidateCaches(firmId, fy, txn.id, partyId);
    return serialise(await this.findOne(tenant, txn.id));
  }

  // ── findOne ───────────────────────────────────────────────────────────────

  async findOne(tenant: TenantContext, id: bigint) {
    const cacheKey = TransactionKeys.detail(id);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const txn = await this.prisma.transaction.findFirst({
      where: { id, firmId: tenant.firmId, deletedAt: null },
      include: {
        party: { select: { name: true } },
        allocations: {
          select: {
            billTable: true,
            billId: true,
            allocatedAmount: true,
          },
        },
      },
    });
    if (!txn) throw new NotFoundException('Transaction not found');

    const result = {
      id: txn.id.toString(),
      refNumber: txn.refNumber,
      txnDate: txn.txnDate.toISOString(),
      partyId: txn.partyId?.toString() ?? null,
      partyName: txn.party?.name ?? null,
      txnType: txn.txnType,
      txnFor: txn.txnFor,
      sourceTable: txn.sourceTable,
      sourceId: txn.sourceId?.toString() ?? null,
      paymentMode: txn.paymentMode,
      amount: toNum(txn.amount),
      settlementAmount: toNum(txn.settlementAmount),
      totalAmount: toNum(txn.amount) + toNum(txn.settlementAmount),
      note: txn.note,
      allocations: txn.allocations.map((a) => ({
        billTable: a.billTable,
        billId: a.billId.toString(),
        allocatedAmount: toNum(a.allocatedAmount),
      })),
      createdAt: txn.createdAt.toISOString(),
      updatedAt: txn.updatedAt.toISOString(),
    };

    await this.redis.set(cacheKey, result, CacheTTL.TRANSACTION_DETAIL);
    return result;
  }

  // ── update ────────────────────────────────────────────────────────────────

  async update(tenant: TenantContext, id: bigint, dto: UpdateTransactionDto) {
    const { firmId, fy } = tenant;

    const txn = await this.prisma.transaction.findFirst({
      where: { id, firmId, deletedAt: null },
      include: {
        allocations: {
          select: {
            id: true,
            billTable: true,
            billId: true,
            allocatedAmount: true,
          },
        },
      },
    });
    if (!txn) throw new NotFoundException('Transaction not found');

    const newAmount = dto.amount !== undefined ? d(dto.amount) : txn.amount;
    const newSettlement = dto.settlementAmount !== undefined
      ? d(dto.settlementAmount)
      : txn.settlementAmount;

    const amountChanged =
      dto.amount !== undefined && !d(dto.amount).equals(txn.amount);
    const settlementChanged =
      dto.settlementAmount !== undefined &&
      !d(dto.settlementAmount).equals(txn.settlementAmount);

    // If amount changed and there are bill allocations, recalculate bill statuses
    if ((amountChanged || settlementChanged) && txn.allocations.length > 0) {
      const oldTotal = txn.amount.plus(txn.settlementAmount);
      const newTotal = newAmount.plus(newSettlement);
      const delta = newTotal.minus(oldTotal); // positive = paid more, negative = paid less

      await this.prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id },
          data: {
            ...(dto.paymentDate !== undefined && { txnDate: new Date(dto.paymentDate) }),
            ...(dto.paymentMode !== undefined && { paymentMode: dto.paymentMode }),
            amount: newAmount,
            settlementAmount: newSettlement,
            ...(dto.note !== undefined && { note: dto.note }),
          },
        });

        for (const alloc of txn.allocations) {
          const newAllocated = alloc.allocatedAmount.plus(delta);

          await tx.billPaymentAllocation.update({
            where: { id: alloc.id },
            data: { allocatedAmount: newAllocated.lt(0) ? d(0) : newAllocated },
          });

          await this.recalcBillStatus(tx, alloc.billTable, alloc.billId);
        }
      });
    } else {
      await this.prisma.transaction.update({
        where: { id },
        data: {
          ...(dto.paymentDate !== undefined && { txnDate: new Date(dto.paymentDate) }),
          ...(dto.paymentMode !== undefined && { paymentMode: dto.paymentMode }),
          ...(dto.amount !== undefined && { amount: newAmount }),
          ...(dto.settlementAmount !== undefined && { settlementAmount: newSettlement }),
          ...(dto.note !== undefined && { note: dto.note }),
        },
      });
    }

    // Invalidate affected bill caches
    for (const alloc of txn.allocations) {
      if (alloc.billTable === 'sales_bills') {
        await this.redis.del(SalesBillKeys.detail(alloc.billId));
      } else {
        await this.redis.del(PurchaseBillKeys.detail(alloc.billId));
      }
    }

    await this.invalidateCaches(firmId, fy, id, txn.partyId);
    return serialise(await this.findOne(tenant, id));
  }

  // ── remove ────────────────────────────────────────────────────────────────

  async remove(tenant: TenantContext, id: bigint) {
    const { firmId, fy } = tenant;

    const txn = await this.prisma.transaction.findFirst({
      where: { id, firmId, deletedAt: null },
      include: {
        allocations: {
          select: {
            id: true,
            billTable: true,
            billId: true,
            allocatedAmount: true,
          },
        },
      },
    });
    if (!txn) throw new NotFoundException('Transaction not found');

    await this.prisma.$transaction(async (tx) => {
      // Reverse bill payment allocations
      for (const alloc of txn.allocations) {
        if (alloc.billTable === 'sales_bills') {
          const bill = await tx.salesBill.findUnique({
            where: { id: alloc.billId },
            select: { paidAmount: true, totalAmount: true },
          });
          if (bill) {
            const newPaid = bill.paidAmount.minus(alloc.allocatedAmount);
            const safePaid = newPaid.lt(0) ? d(0) : newPaid;
            const newPending = bill.totalAmount.minus(safePaid);
            await tx.salesBill.update({
              where: { id: alloc.billId },
              data: {
                paidAmount: safePaid,
                pendingAmount: newPending.lt(0) ? d(0) : newPending,
                status:
                  safePaid.lte(0)
                    ? BillStatus.UNPAID
                    : newPending.lte(0)
                    ? BillStatus.PAID
                    : BillStatus.PARTIAL,
              },
            });
          }
        } else if (alloc.billTable === 'purchase_bills') {
          const bill = await tx.purchaseBill.findUnique({
            where: { id: alloc.billId },
            select: { paidAmount: true, totalAmount: true },
          });
          if (bill) {
            const newPaid = bill.paidAmount.minus(alloc.allocatedAmount);
            const safePaid = newPaid.lt(0) ? d(0) : newPaid;
            const newPending = bill.totalAmount.minus(safePaid);
            await tx.purchaseBill.update({
              where: { id: alloc.billId },
              data: {
                paidAmount: safePaid,
                pendingAmount: newPending.lt(0) ? d(0) : newPending,
                status:
                  safePaid.lte(0)
                    ? BillStatus.UNPAID
                    : newPending.lte(0)
                    ? BillStatus.PAID
                    : BillStatus.PARTIAL,
              },
            });
          }
        }
      }

      await tx.transaction.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });

    // Invalidate affected bill caches
    for (const alloc of txn.allocations) {
      if (alloc.billTable === 'sales_bills') {
        await this.redis.del(SalesBillKeys.detail(alloc.billId));
      } else {
        await this.redis.del(PurchaseBillKeys.detail(alloc.billId));
      }
    }

    await this.invalidateCaches(firmId, fy, id, txn.partyId);
    return { success: true };
  }

  // ── summary ───────────────────────────────────────────────────────────────
  // Totals card shown at the bottom of the transactions list.

  async summary(tenant: TenantContext) {
    const { firmId, fy } = tenant;
    const cacheKey = TransactionKeys.summary(firmId, fy);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const [creditAgg, debitAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { firmId, fy, txnType: TxnType.CREDIT, deletedAt: null },
        _sum: { amount: true, settlementAmount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { firmId, fy, txnType: TxnType.DEBIT, deletedAt: null },
        _sum: { amount: true, settlementAmount: true },
      }),
    ]);

    const result = {
      totalCredit:
        toNum(creditAgg._sum.amount) + toNum(creditAgg._sum.settlementAmount),
      totalDebit:
        toNum(debitAgg._sum.amount) + toNum(debitAgg._sum.settlementAmount),
    };

    await this.redis.set(cacheKey, result, CacheTTL.TRANSACTION_SUMMARY);
    return result;
  }

  // ── byBill ────────────────────────────────────────────────────────────────
  // All transactions linked to a given bill (used by bill detail / print views).

  async byBill(
    tenant: TenantContext,
    billTable: 'sales_bills' | 'purchase_bills',
    billId: bigint,
  ) {
    const cacheKey = TransactionKeys.byBill(billId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.transaction.findMany({
      where: {
        firmId: tenant.firmId,
        sourceTable: billTable,
        sourceId: billId,
        deletedAt: null,
      },
      orderBy: { txnDate: 'asc' },
      select: {
        id: true,
        refNumber: true,
        txnDate: true,
        txnType: true,
        paymentMode: true,
        amount: true,
        settlementAmount: true,
        note: true,
      },
    });

    const result = rows.map((t) => ({
      id: t.id.toString(),
      refNumber: t.refNumber,
      txnDate: t.txnDate.toISOString(),
      txnType: t.txnType,
      paymentMode: t.paymentMode,
      amount: toNum(t.amount),
      settlementAmount: toNum(t.settlementAmount),
      totalAmount: toNum(t.amount) + toNum(t.settlementAmount),
      note: t.note,
    }));

    await this.redis.set(cacheKey, result, CacheTTL.TRANSACTION_DETAIL);
    return result;
  }

  // ── private: recalcBillStatus ─────────────────────────────────────────────

  private async recalcBillStatus(
    tx: Prisma.TransactionClient,
    billTable: string,
    billId: bigint,
  ): Promise<void> {
    if (billTable === 'sales_bills') {
      const agg = await tx.billPaymentAllocation.aggregate({
        where: { billTable: 'sales_bills', billId },
        _sum: { allocatedAmount: true },
      });
      const totalPaid = agg._sum.allocatedAmount ?? d(0);
      const bill = await tx.salesBill.findUnique({
        where: { id: billId },
        select: { totalAmount: true },
      });
      if (!bill) return;
      const pending = bill.totalAmount.minus(totalPaid);
      await tx.salesBill.update({
        where: { id: billId },
        data: {
          paidAmount: totalPaid,
          pendingAmount: pending.lt(0) ? d(0) : pending,
          status: totalPaid.lte(0)
            ? BillStatus.UNPAID
            : pending.lte(0)
            ? BillStatus.PAID
            : BillStatus.PARTIAL,
        },
      });
    } else if (billTable === 'purchase_bills') {
      const agg = await tx.billPaymentAllocation.aggregate({
        where: { billTable: 'purchase_bills', billId },
        _sum: { allocatedAmount: true },
      });
      const totalPaid = agg._sum.allocatedAmount ?? d(0);
      const bill = await tx.purchaseBill.findUnique({
        where: { id: billId },
        select: { totalAmount: true },
      });
      if (!bill) return;
      const pending = bill.totalAmount.minus(totalPaid);
      await tx.purchaseBill.update({
        where: { id: billId },
        data: {
          paidAmount: totalPaid,
          pendingAmount: pending.lt(0) ? d(0) : pending,
          status: totalPaid.lte(0)
            ? BillStatus.UNPAID
            : pending.lte(0)
            ? BillStatus.PAID
            : BillStatus.PARTIAL,
        },
      });
    }
  }

  // ── private: invalidateCaches ─────────────────────────────────────────────

  private async invalidateCaches(
    firmId: bigint,
    fy: number,
    txnId: bigint,
    partyId: bigint | null,
  ) {
    const keys = [
      TransactionKeys.detail(txnId),
      TransactionKeys.summary(firmId, fy),
      DashboardKeys.kpi(firmId, fy),
      ReportKeys.transaction(firmId, fy, '*'),
      ReportKeys.payment(firmId, fy, '*'),
    ];

    if (partyId) {
      keys.push(
        PartyKeys.detail(partyId),
        PartyKeys.outstanding(firmId, partyId),
      );
    }

    await this.redis.del(...keys);
  }
}
