import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseMode, Prisma, TxnFor, TxnType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { CacheTTL, ExpenseKeys } from '../../common/cache-keys';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ListExpensesDto } from './dto/list-expenses.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { CreateExpenseSupplierDto } from './dto/create-expense-supplier.dto';
import { CreateExpenseItemDto } from './dto/create-expense-item.dto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Decimal = Prisma.Decimal;

function d(v: number | string): Decimal {
  return new Prisma.Decimal(v);
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

function nextRefNumber(fy: number, seq: number): string {
  return `TXN/${fy}/${String(seq).padStart(4, '0')}`;
}

const DEFAULT_CATEGORIES = [
  'Office Supplies',
  'Travel & Transport',
  'Utilities',
  'Rent',
  'Salaries & Wages',
  'Repairs & Maintenance',
  'Marketing & Advertising',
  'Miscellaneous',
];

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── Categories ───────────────────────────────────────────────────────────

  async listCategories(tenant: TenantContext) {
    const { firmId } = tenant;
    const cacheKey = ExpenseKeys.categories(firmId);
    const cached = await this.redis.get<unknown[]>(cacheKey);
    if (cached) return cached;

    let rows = await this.prisma.expenseCategory.findMany({
      where: { firmId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true, isDefault: true },
    });

    // Lazy-seed defaults on first access
    if (rows.length === 0) {
      await this.prisma.expenseCategory.createMany({
        data: DEFAULT_CATEGORIES.map((name) => ({ firmId, name, isDefault: true })),
        skipDuplicates: true,
      });
      rows = await this.prisma.expenseCategory.findMany({
        where: { firmId },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        select: { id: true, name: true, isDefault: true },
      });
    }

    const result = rows.map((r) => ({ ...r, id: r.id.toString() }));
    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async createCategory(tenant: TenantContext, dto: CreateExpenseCategoryDto) {
    const { firmId } = tenant;
    const existing = await this.prisma.expenseCategory.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) throw new ConflictException(`Category "${dto.name}" already exists`);

    const cat = await this.prisma.expenseCategory.create({
      data: { firmId, name: dto.name, isDefault: false },
    });
    await this.redis.del(ExpenseKeys.categories(firmId));
    return { id: cat.id.toString(), name: cat.name, isDefault: cat.isDefault };
  }

  async deleteCategory(tenant: TenantContext, id: bigint) {
    const { firmId } = tenant;
    const cat = await this.prisma.expenseCategory.findFirst({
      where: { id, firmId },
      select: { id: true, isDefault: true },
    });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat.isDefault) throw new BadRequestException('Cannot delete a default category');

    const inUse = await this.prisma.expense.count({ where: { categoryId: id, deletedAt: null } });
    if (inUse > 0) throw new BadRequestException('Category is in use by expenses');

    await this.prisma.expenseCategory.delete({ where: { id } });
    await this.redis.del(ExpenseKeys.categories(firmId));
    return { success: true };
  }

  // ── Suppliers ────────────────────────────────────────────────────────────

  async listSuppliers(tenant: TenantContext) {
    const { firmId } = tenant;
    const cacheKey = ExpenseKeys.suppliers(firmId);
    const cached = await this.redis.get<unknown[]>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.expenseSupplier.findMany({
      where: { firmId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    const result = rows.map((r) => ({ ...r, id: r.id.toString() }));
    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async createSupplier(tenant: TenantContext, dto: CreateExpenseSupplierDto) {
    const { firmId } = tenant;
    const existing = await this.prisma.expenseSupplier.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) throw new ConflictException(`Supplier "${dto.name}" already exists`);

    const sup = await this.prisma.expenseSupplier.create({ data: { firmId, name: dto.name } });
    await this.redis.del(ExpenseKeys.suppliers(firmId));
    return { id: sup.id.toString(), name: sup.name };
  }

  async deleteSupplier(tenant: TenantContext, id: bigint) {
    const { firmId } = tenant;
    const sup = await this.prisma.expenseSupplier.findFirst({
      where: { id, firmId },
      select: { id: true },
    });
    if (!sup) throw new NotFoundException('Supplier not found');

    const inUse = await this.prisma.expense.count({ where: { supplierId: id, deletedAt: null } });
    if (inUse > 0) throw new BadRequestException('Supplier is in use by expenses');

    await this.prisma.expenseSupplier.delete({ where: { id } });
    await this.redis.del(ExpenseKeys.suppliers(firmId));
    return { success: true };
  }

  // ── Items (master) ───────────────────────────────────────────────────────

  async listItems(tenant: TenantContext) {
    const { firmId } = tenant;
    const cacheKey = ExpenseKeys.items(firmId);
    const cached = await this.redis.get<unknown[]>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.expenseItem.findMany({
      where: { firmId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    const result = rows.map((r) => ({ ...r, id: r.id.toString() }));
    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async createItem(tenant: TenantContext, dto: CreateExpenseItemDto) {
    const { firmId } = tenant;
    const existing = await this.prisma.expenseItem.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) throw new ConflictException(`Item "${dto.name}" already exists`);

    const item = await this.prisma.expenseItem.create({ data: { firmId, name: dto.name } });
    await this.redis.del(ExpenseKeys.items(firmId));
    return { id: item.id.toString(), name: item.name };
  }

  async deleteItem(tenant: TenantContext, id: bigint) {
    const { firmId } = tenant;
    const item = await this.prisma.expenseItem.findFirst({
      where: { id, firmId },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Item not found');

    const inUse = await this.prisma.expenseLineItem.count({ where: { itemId: id } });
    if (inUse > 0) throw new BadRequestException('Item is in use by expenses');

    await this.prisma.expenseItem.delete({ where: { id } });
    await this.redis.del(ExpenseKeys.items(firmId));
    return { success: true };
  }

  // ── Expenses ─────────────────────────────────────────────────────────────

  async list(tenant: TenantContext, dto: ListExpensesDto) {
    const { firmId, fy } = tenant;
    const limit = dto.limit ?? 20;

    const where: Prisma.ExpenseWhereInput = { firmId, fy, deletedAt: null };

    if (dto.categoryId) where.categoryId = BigInt(dto.categoryId);
    if (dto.supplierId) where.supplierId = BigInt(dto.supplierId);
    if (dto.fromDate || dto.toDate) {
      where.expenseDate = {
        ...(dto.fromDate && { gte: new Date(dto.fromDate) }),
        ...(dto.toDate && { lte: new Date(dto.toDate) }),
      };
    }

    // Keyset pagination: (expenseDate DESC, id DESC)
    if (dto.afterDate && dto.afterId) {
      where.AND = [
        {
          OR: [
            { expenseDate: { lt: new Date(dto.afterDate) } },
            {
              expenseDate: { equals: new Date(dto.afterDate) },
              id: { lt: BigInt(dto.afterId) },
            },
          ],
        },
      ];
    }

    const rows = await this.prisma.expense.findMany({
      where,
      orderBy: [{ expenseDate: 'desc' }, { id: 'desc' }],
      take: limit,
      select: {
        id: true,
        mode: true,
        expenseDate: true,
        amount: true,
        paidAmount: true,
        note: true,
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    const data = rows.map((e) => ({
      id: e.id.toString(),
      mode: e.mode,
      expenseDate: e.expenseDate.toISOString().slice(0, 10),
      amount: e.amount.toNumber(),
      paidAmount: e.paidAmount.toNumber(),
      pendingAmount: e.amount.minus(e.paidAmount).toNumber(),
      note: e.note,
      category: e.category ? { id: e.category.id.toString(), name: e.category.name } : null,
      supplier: e.supplier ? { id: e.supplier.id.toString(), name: e.supplier.name } : null,
    }));

    return { data, hasMore: rows.length === limit };
  }

  async create(tenant: TenantContext, userId: bigint, dto: CreateExpenseDto) {
    const { accountId, firmId, fy } = tenant;

    // Validate category belongs to this firm
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id: BigInt(dto.categoryId), firmId },
      select: { id: true },
    });
    if (!category) throw new NotFoundException('Expense category not found');

    if (dto.supplierId) {
      const sup = await this.prisma.expenseSupplier.findFirst({
        where: { id: BigInt(dto.supplierId), firmId },
        select: { id: true },
      });
      if (!sup) throw new NotFoundException('Expense supplier not found');
    }

    let totalAmount: Decimal;
    let lineItemsData: Array<{ itemId: bigint; qty: Decimal; rate: Decimal; amount: Decimal }> = [];

    if (dto.mode === ExpenseMode.ITEM) {
      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException('Line items are required for ITEM mode');
      }
      // Validate all item IDs belong to this firm
      const itemIds = dto.items.map((i) => BigInt(i.itemId));
      const foundItems = await this.prisma.expenseItem.findMany({
        where: { id: { in: itemIds }, firmId },
        select: { id: true },
      });
      if (foundItems.length !== itemIds.length) {
        throw new NotFoundException('One or more expense items not found');
      }

      lineItemsData = dto.items.map((i) => {
        const qty = d(i.qty);
        const rate = d(i.rate);
        return { itemId: BigInt(i.itemId), qty, rate, amount: qty.mul(rate) };
      });
      totalAmount = lineItemsData.reduce((sum, li) => sum.plus(li.amount), d(0));
    } else {
      if (dto.amount == null) {
        throw new BadRequestException('Amount is required for AMOUNT mode');
      }
      totalAmount = d(dto.amount);
    }

    const expenseDate = dto.expenseDate ? new Date(dto.expenseDate) : new Date();

    const expense = await this.prisma.$transaction(async (tx) => {
      const exp = await tx.expense.create({
        data: {
          accountId,
          firmId,
          fy,
          mode: dto.mode,
          expenseDate,
          categoryId: BigInt(dto.categoryId),
          supplierId: dto.supplierId ? BigInt(dto.supplierId) : null,
          amount: totalAmount,
          note: dto.note ?? null,
          attachmentKey: dto.attachmentKey ?? null,
          createdBy: userId,
          ...(lineItemsData.length > 0 && {
            lineItems: {
              create: lineItemsData,
            },
          }),
        },
        include: {
          lineItems: { include: { item: { select: { id: true, name: true } } } },
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
      });

      if (dto.payment) {
        const payAmt = d(dto.payment.amount);
        const paymentDate = dto.payment.paymentDate ? new Date(dto.payment.paymentDate) : new Date();

        const lastTxn = await tx.transaction.findFirst({
          where: { firmId, fy },
          orderBy: { id: 'desc' },
          select: { id: true },
        });
        const seq = lastTxn ? Number(lastTxn.id) + 1 : 1;

        await tx.transaction.create({
          data: {
            accountId,
            firmId,
            fy,
            refNumber: nextRefNumber(fy, seq),
            txnDate: paymentDate,
            txnType: TxnType.DEBIT,
            txnFor: TxnFor.EXPENSE,
            sourceTable: 'expenses',
            sourceId: exp.id,
            paymentMode: dto.payment.paymentMode,
            amount: payAmt,
            settlementAmount: payAmt,
            note: dto.payment.note ?? null,
            createdBy: userId,
          },
        });

        await tx.expense.update({
          where: { id: exp.id },
          data: { paidAmount: payAmt },
        });

        return { ...exp, paidAmount: payAmt };
      }

      return exp;
    });

    await this.invalidateCaches(firmId, fy);
    return serialise(expense);
  }

  async findOne(tenant: TenantContext, id: bigint) {
    const cacheKey = ExpenseKeys.detail(id);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const expense = await this.prisma.expense.findFirst({
      where: { id, firmId: tenant.firmId, fy: tenant.fy, deletedAt: null },
      include: {
        lineItems: { include: { item: { select: { id: true, name: true } } } },
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    const result = serialise(expense);
    await this.redis.set(cacheKey, result, CacheTTL.EXPENSE_DETAIL);
    return result;
  }

  async update(tenant: TenantContext, id: bigint, dto: UpdateExpenseDto) {
    const { firmId, fy } = tenant;

    const expense = await this.prisma.expense.findFirst({
      where: { id, firmId, fy, deletedAt: null },
      select: { id: true, mode: true },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    if (dto.categoryId) {
      const cat = await this.prisma.expenseCategory.findFirst({
        where: { id: BigInt(dto.categoryId), firmId },
        select: { id: true },
      });
      if (!cat) throw new NotFoundException('Expense category not found');
    }

    if (dto.supplierId) {
      const sup = await this.prisma.expenseSupplier.findFirst({
        where: { id: BigInt(dto.supplierId), firmId },
        select: { id: true },
      });
      if (!sup) throw new NotFoundException('Expense supplier not found');
    }

    let newAmount: Decimal | undefined;
    let newLineItems: Array<{ itemId: bigint; qty: Decimal; rate: Decimal; amount: Decimal }> | undefined;

    if (dto.items !== undefined) {
      if (expense.mode !== ExpenseMode.ITEM) {
        throw new BadRequestException('Cannot set line items on an AMOUNT mode expense');
      }
      if (dto.items.length === 0) {
        throw new BadRequestException('At least one line item is required for ITEM mode');
      }
      const itemIds = dto.items.map((i) => BigInt(i.itemId));
      const foundItems = await this.prisma.expenseItem.findMany({
        where: { id: { in: itemIds }, firmId },
        select: { id: true },
      });
      if (foundItems.length !== itemIds.length) {
        throw new NotFoundException('One or more expense items not found');
      }
      newLineItems = dto.items.map((i) => {
        const qty = d(i.qty);
        const rate = d(i.rate);
        return { itemId: BigInt(i.itemId), qty, rate, amount: qty.mul(rate) };
      });
      newAmount = newLineItems.reduce((sum, li) => sum.plus(li.amount), d(0));
    }

    if (dto.amount !== undefined && expense.mode === ExpenseMode.AMOUNT) {
      newAmount = d(dto.amount);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (newLineItems !== undefined) {
        await tx.expenseLineItem.deleteMany({ where: { expenseId: id } });
        await tx.expenseLineItem.createMany({
          data: newLineItems.map((li) => ({ expenseId: id, ...li })),
        });
      }

      return tx.expense.update({
        where: { id },
        data: {
          ...(dto.expenseDate && { expenseDate: new Date(dto.expenseDate) }),
          ...(dto.categoryId !== undefined && { categoryId: BigInt(dto.categoryId) }),
          ...(dto.supplierId !== undefined && {
            supplierId: dto.supplierId ? BigInt(dto.supplierId) : null,
          }),
          ...(newAmount !== undefined && { amount: newAmount }),
          ...(dto.note !== undefined && { note: dto.note }),
          ...(dto.attachmentKey !== undefined && { attachmentKey: dto.attachmentKey }),
        },
        include: {
          lineItems: { include: { item: { select: { id: true, name: true } } } },
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
      });
    });

    await this.invalidateCaches(firmId, fy, id);
    return serialise(updated);
  }

  async remove(tenant: TenantContext, id: bigint) {
    const { firmId, fy } = tenant;
    const expense = await this.prisma.expense.findFirst({
      where: { id, firmId, fy, deletedAt: null },
      select: { id: true },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    await this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.invalidateCaches(firmId, fy, id);
    return { success: true };
  }

  // ── Cache invalidation ────────────────────────────────────────────────────

  private async invalidateCaches(firmId: bigint, fy: number, expenseId?: bigint) {
    const keys: string[] = [ExpenseKeys.totals(firmId, fy)];
    if (expenseId) keys.push(ExpenseKeys.detail(expenseId));
    await this.redis.del(...keys);
  }
}
