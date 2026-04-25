import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { $Enums, Prisma } from '@prisma/client';

type Decimal = Prisma.Decimal;
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AuthenticatedUser } from '../../common/interfaces/tenant-context.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSalesBillSettingsDto } from './dto/update-sales-bill-settings.dto';
import { UpdatePurchaseBillSettingsDto } from './dto/update-purchase-bill-settings.dto';
import { UpdateDeliveryChallanSettingsDto } from './dto/update-delivery-challan-settings.dto';
import { UpdateOtherSettingsDto } from './dto/update-other-settings.dto';
import { UpsertMasterItemDto } from './dto/upsert-master-item.dto';
import { SaveGspCredentialsDto } from './dto/save-gsp-credentials.dto';
import {
  CacheTTL,
  IncomeKeys,
  ExpenseKeys,
  SettingsKeys,
} from '../../common/cache-keys';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── Profile ───────────────────────────────────────────────────────────────

  async getProfile(userId: bigint) {
    const cacheKey = SettingsKeys.profile(userId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mobile: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePhotoKey: true,
        account: { select: { businessTypes: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const result = {
      id: user.id.toString(),
      mobile: user.mobile,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePhotoKey: user.profilePhotoKey,
      businessTypes: user.account.businessTypes,
    };

    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async updateProfile(userId: bigint, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, accountId: true },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName || null }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName || null }),
          ...(dto.email !== undefined && { email: dto.email || null }),
          ...(dto.profilePhotoKey !== undefined && { profilePhotoKey: dto.profilePhotoKey || null }),
        },
      }),
      ...(dto.businessTypes !== undefined
        ? [this.prisma.account.update({
            where: { id: user.accountId },
            data: { businessTypes: dto.businessTypes },
          })]
        : []),
    ]);

    await this.redis.del(SettingsKeys.profile(userId));
    return this.getProfile(userId);
  }

  // ── Sales Bill Settings ───────────────────────────────────────────────────

  async getSalesBillSettings(firmId: bigint) {
    const cacheKey = SettingsKeys.salesBill(firmId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const settings = await this.prisma.firmSalesBillSettings.findUnique({ where: { firmId } });
    const result = serialise(settings ?? this.defaultSalesBillSettings(firmId));
    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async saveSalesBillSettings(firmId: bigint, dto: UpdateSalesBillSettingsDto) {
    const defaults = this.defaultSalesBillSettings(firmId);

    await this.prisma.firmSalesBillSettings.upsert({
      where: { firmId },
      create: {
        firmId,
        showDueDetailsInInvoice: dto.showDueDetailsInInvoice ?? defaults.showDueDetailsInInvoice,
        showGstInJobChallan: dto.showGstInJobChallan ?? defaults.showGstInJobChallan,
        defaultPrintType: dto.defaultPrintType ?? defaults.defaultPrintType,
        showChallanSection: dto.showChallanSection ?? defaults.showChallanSection,
        billNoLabel: dto.billNoLabel ?? defaults.billNoLabel,
        showLossProductOption: dto.showLossProductOption ?? defaults.showLossProductOption,
        showDeliveryToSalesOption: dto.showDeliveryToSalesOption ?? defaults.showDeliveryToSalesOption,
        showWithholdingTax: dto.showWithholdingTax ?? defaults.showWithholdingTax,
        enableDirectPayment: dto.enableDirectPayment ?? defaults.enableDirectPayment,
        discountScope: dto.discountScope ?? defaults.discountScope,
        gstScope: dto.gstScope ?? defaults.gstScope,
        billPrefix: dto.billPrefix ?? null,
        termsAndConditions: dto.termsAndConditions ?? null,
        jobChallanTitle: dto.jobChallanTitle ?? null,
        taxInvoiceTitle: dto.taxInvoiceTitle ?? null,
        pdfCustomHeading: dto.pdfCustomHeading ?? null,
        pdfTemplate: dto.pdfTemplate ?? defaults.pdfTemplate,
      },
      update: {
        ...(dto.showDueDetailsInInvoice !== undefined && { showDueDetailsInInvoice: dto.showDueDetailsInInvoice }),
        ...(dto.showGstInJobChallan !== undefined && { showGstInJobChallan: dto.showGstInJobChallan }),
        ...(dto.defaultPrintType !== undefined && { defaultPrintType: dto.defaultPrintType }),
        ...(dto.showChallanSection !== undefined && { showChallanSection: dto.showChallanSection }),
        ...(dto.billNoLabel !== undefined && { billNoLabel: dto.billNoLabel }),
        ...(dto.showLossProductOption !== undefined && { showLossProductOption: dto.showLossProductOption }),
        ...(dto.showDeliveryToSalesOption !== undefined && { showDeliveryToSalesOption: dto.showDeliveryToSalesOption }),
        ...(dto.showWithholdingTax !== undefined && { showWithholdingTax: dto.showWithholdingTax }),
        ...(dto.enableDirectPayment !== undefined && { enableDirectPayment: dto.enableDirectPayment }),
        ...(dto.discountScope !== undefined && { discountScope: dto.discountScope }),
        ...(dto.gstScope !== undefined && { gstScope: dto.gstScope }),
        ...(dto.billPrefix !== undefined && { billPrefix: dto.billPrefix || null }),
        ...(dto.termsAndConditions !== undefined && { termsAndConditions: dto.termsAndConditions || null }),
        ...(dto.jobChallanTitle !== undefined && { jobChallanTitle: dto.jobChallanTitle || null }),
        ...(dto.taxInvoiceTitle !== undefined && { taxInvoiceTitle: dto.taxInvoiceTitle || null }),
        ...(dto.pdfCustomHeading !== undefined && { pdfCustomHeading: dto.pdfCustomHeading || null }),
        ...(dto.pdfTemplate !== undefined && { pdfTemplate: dto.pdfTemplate }),
      },
    });

    await this.redis.del(SettingsKeys.salesBill(firmId));
    return this.getSalesBillSettings(firmId);
  }

  // ── Purchase Bill Settings ────────────────────────────────────────────────

  async getPurchaseBillSettings(firmId: bigint) {
    const cacheKey = SettingsKeys.purchaseBill(firmId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const settings = await this.prisma.firmPurchaseBillSettings.findUnique({ where: { firmId } });
    const result = serialise(settings ?? { firmId: firmId.toString(), showWithholdingTax: false, pdfTemplate: 'STANDARD' });
    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async savePurchaseBillSettings(firmId: bigint, dto: UpdatePurchaseBillSettingsDto) {
    await this.prisma.firmPurchaseBillSettings.upsert({
      where: { firmId },
      create: {
        firmId,
        showWithholdingTax: dto.showWithholdingTax ?? false,
        pdfTemplate: dto.pdfTemplate ?? 'STANDARD',
      },
      update: {
        ...(dto.showWithholdingTax !== undefined && { showWithholdingTax: dto.showWithholdingTax }),
        ...(dto.pdfTemplate !== undefined && { pdfTemplate: dto.pdfTemplate }),
      },
    });

    await this.redis.del(SettingsKeys.purchaseBill(firmId));
    return this.getPurchaseBillSettings(firmId);
  }

  // ── Delivery Challan Settings ─────────────────────────────────────────────

  async getDeliveryChallanSettings(firmId: bigint) {
    const cacheKey = SettingsKeys.deliveryChallan(firmId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const settings = await this.prisma.firmDeliveryChallanSettings.findUnique({ where: { firmId } });
    const result = serialise(settings ?? {
      firmId: firmId.toString(),
      showRate: true,
      showGstNo: true,
      defaultPrintType: 'DUPLICATE',
      showChallanSection: true,
      termsAndConditions: null,
      pdfCustomHeading: null,
      pdfTemplate: 'STANDARD',
    });
    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async saveDeliveryChallanSettings(firmId: bigint, dto: UpdateDeliveryChallanSettingsDto) {
    await this.prisma.firmDeliveryChallanSettings.upsert({
      where: { firmId },
      create: {
        firmId,
        showRate: dto.showRate ?? true,
        showGstNo: dto.showGstNo ?? true,
        defaultPrintType: dto.defaultPrintType ?? 'DUPLICATE',
        showChallanSection: dto.showChallanSection ?? true,
        termsAndConditions: dto.termsAndConditions ?? null,
        pdfCustomHeading: dto.pdfCustomHeading ?? null,
        pdfTemplate: dto.pdfTemplate ?? 'STANDARD',
      },
      update: {
        ...(dto.showRate !== undefined && { showRate: dto.showRate }),
        ...(dto.showGstNo !== undefined && { showGstNo: dto.showGstNo }),
        ...(dto.defaultPrintType !== undefined && { defaultPrintType: dto.defaultPrintType }),
        ...(dto.showChallanSection !== undefined && { showChallanSection: dto.showChallanSection }),
        ...(dto.termsAndConditions !== undefined && { termsAndConditions: dto.termsAndConditions || null }),
        ...(dto.pdfCustomHeading !== undefined && { pdfCustomHeading: dto.pdfCustomHeading || null }),
        ...(dto.pdfTemplate !== undefined && { pdfTemplate: dto.pdfTemplate }),
      },
    });

    await this.redis.del(SettingsKeys.deliveryChallan(firmId));
    return this.getDeliveryChallanSettings(firmId);
  }

  // ── Other Settings ────────────────────────────────────────────────────────

  async getOtherSettings(firmId: bigint) {
    const cacheKey = SettingsKeys.other(firmId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const settings = await this.prisma.firmOtherSettings.findUnique({ where: { firmId } });
    const result = serialise(settings ?? {
      firmId: firmId.toString(),
      enableInventory: false,
      allowSalesWithoutStock: false,
      enableShortcuts: true,
      enableDecimalValues: true,
      enablePartyWiseProductRate: false,
      enableShipmentAddress: false,
    });
    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async saveOtherSettings(firmId: bigint, dto: UpdateOtherSettingsDto) {
    await this.prisma.firmOtherSettings.upsert({
      where: { firmId },
      create: {
        firmId,
        enableInventory: dto.enableInventory ?? false,
        allowSalesWithoutStock: dto.allowSalesWithoutStock ?? false,
        enableShortcuts: dto.enableShortcuts ?? true,
        enableDecimalValues: dto.enableDecimalValues ?? true,
        enablePartyWiseProductRate: dto.enablePartyWiseProductRate ?? false,
        enableShipmentAddress: dto.enableShipmentAddress ?? false,
      },
      update: {
        ...(dto.enableInventory !== undefined && { enableInventory: dto.enableInventory }),
        ...(dto.allowSalesWithoutStock !== undefined && { allowSalesWithoutStock: dto.allowSalesWithoutStock }),
        ...(dto.enableShortcuts !== undefined && { enableShortcuts: dto.enableShortcuts }),
        ...(dto.enableDecimalValues !== undefined && { enableDecimalValues: dto.enableDecimalValues }),
        ...(dto.enablePartyWiseProductRate !== undefined && { enablePartyWiseProductRate: dto.enablePartyWiseProductRate }),
        ...(dto.enableShipmentAddress !== undefined && { enableShipmentAddress: dto.enableShipmentAddress }),
      },
    });

    await this.redis.del(SettingsKeys.other(firmId), SettingsKeys.inventory(firmId));
    return this.getOtherSettings(firmId);
  }

  // ── Expense Categories ────────────────────────────────────────────────────

  async listExpenseCategories(firmId: bigint) {
    const cacheKey = ExpenseKeys.categories(firmId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.expenseCategory.findMany({
      where: { firmId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, isDefault: true },
    });
    const result = serialise(rows);
    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async createExpenseCategory(firmId: bigint, dto: UpsertMasterItemDto) {
    const dup = await this.prisma.expenseCategory.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (dup) throw new ConflictException(`Category "${dto.name}" already exists`);

    const row = await this.prisma.expenseCategory.create({
      data: { firmId, name: dto.name },
    });
    await this.redis.del(ExpenseKeys.categories(firmId));
    return serialise(row);
  }

  async updateExpenseCategory(firmId: bigint, id: bigint, dto: UpsertMasterItemDto) {
    const row = await this.prisma.expenseCategory.findFirst({ where: { id, firmId }, select: { id: true } });
    if (!row) throw new NotFoundException('Expense category not found');

    const dup = await this.prisma.expenseCategory.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } },
      select: { id: true },
    });
    if (dup) throw new ConflictException(`Category "${dto.name}" already exists`);

    const updated = await this.prisma.expenseCategory.update({ where: { id }, data: { name: dto.name } });
    await this.redis.del(ExpenseKeys.categories(firmId));
    return serialise(updated);
  }

  async deleteExpenseCategory(firmId: bigint, id: bigint) {
    const row = await this.prisma.expenseCategory.findFirst({ where: { id, firmId }, select: { id: true, isDefault: true } });
    if (!row) throw new NotFoundException('Expense category not found');
    if (row.isDefault) throw new ConflictException('Cannot delete a default expense category');

    await this.prisma.expenseCategory.delete({ where: { id } });
    await this.redis.del(ExpenseKeys.categories(firmId));
    return { success: true };
  }

  // ── Expense Suppliers ─────────────────────────────────────────────────────

  async listExpenseSuppliers(firmId: bigint) {
    const cacheKey = ExpenseKeys.suppliers(firmId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.expenseSupplier.findMany({
      where: { firmId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    const result = serialise(rows);
    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async createExpenseSupplier(firmId: bigint, dto: UpsertMasterItemDto) {
    const dup = await this.prisma.expenseSupplier.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (dup) throw new ConflictException(`Supplier "${dto.name}" already exists`);

    const row = await this.prisma.expenseSupplier.create({ data: { firmId, name: dto.name } });
    await this.redis.del(ExpenseKeys.suppliers(firmId));
    return serialise(row);
  }

  async updateExpenseSupplier(firmId: bigint, id: bigint, dto: UpsertMasterItemDto) {
    const row = await this.prisma.expenseSupplier.findFirst({ where: { id, firmId }, select: { id: true } });
    if (!row) throw new NotFoundException('Expense supplier not found');

    const dup = await this.prisma.expenseSupplier.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } },
      select: { id: true },
    });
    if (dup) throw new ConflictException(`Supplier "${dto.name}" already exists`);

    const updated = await this.prisma.expenseSupplier.update({ where: { id }, data: { name: dto.name } });
    await this.redis.del(ExpenseKeys.suppliers(firmId));
    return serialise(updated);
  }

  async deleteExpenseSupplier(firmId: bigint, id: bigint) {
    const row = await this.prisma.expenseSupplier.findFirst({ where: { id, firmId }, select: { id: true } });
    if (!row) throw new NotFoundException('Expense supplier not found');

    await this.prisma.expenseSupplier.delete({ where: { id } });
    await this.redis.del(ExpenseKeys.suppliers(firmId));
    return { success: true };
  }

  // ── Expense Items ─────────────────────────────────────────────────────────

  async listExpenseItems(firmId: bigint) {
    const cacheKey = ExpenseKeys.items(firmId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.expenseItem.findMany({
      where: { firmId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    const result = serialise(rows);
    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async createExpenseItem(firmId: bigint, dto: UpsertMasterItemDto) {
    const dup = await this.prisma.expenseItem.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (dup) throw new ConflictException(`Expense item "${dto.name}" already exists`);

    const row = await this.prisma.expenseItem.create({ data: { firmId, name: dto.name } });
    await this.redis.del(ExpenseKeys.items(firmId));
    return serialise(row);
  }

  async updateExpenseItem(firmId: bigint, id: bigint, dto: UpsertMasterItemDto) {
    const row = await this.prisma.expenseItem.findFirst({ where: { id, firmId }, select: { id: true } });
    if (!row) throw new NotFoundException('Expense item not found');

    const dup = await this.prisma.expenseItem.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } },
      select: { id: true },
    });
    if (dup) throw new ConflictException(`Expense item "${dto.name}" already exists`);

    const updated = await this.prisma.expenseItem.update({ where: { id }, data: { name: dto.name } });
    await this.redis.del(ExpenseKeys.items(firmId));
    return serialise(updated);
  }

  async deleteExpenseItem(firmId: bigint, id: bigint) {
    const row = await this.prisma.expenseItem.findFirst({ where: { id, firmId }, select: { id: true } });
    if (!row) throw new NotFoundException('Expense item not found');

    await this.prisma.expenseItem.delete({ where: { id } });
    await this.redis.del(ExpenseKeys.items(firmId));
    return { success: true };
  }

  // ── Income Categories ─────────────────────────────────────────────────────

  async listIncomeCategories(firmId: bigint) {
    const cacheKey = IncomeKeys.categories(firmId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.incomeCategory.findMany({
      where: { firmId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, isDefault: true },
    });
    const result = serialise(rows);
    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async createIncomeCategory(firmId: bigint, dto: UpsertMasterItemDto) {
    const dup = await this.prisma.incomeCategory.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (dup) throw new ConflictException(`Income category "${dto.name}" already exists`);

    const row = await this.prisma.incomeCategory.create({ data: { firmId, name: dto.name } });
    await this.redis.del(IncomeKeys.categories(firmId));
    return serialise(row);
  }

  async updateIncomeCategory(firmId: bigint, id: bigint, dto: UpsertMasterItemDto) {
    const row = await this.prisma.incomeCategory.findFirst({ where: { id, firmId }, select: { id: true } });
    if (!row) throw new NotFoundException('Income category not found');

    const dup = await this.prisma.incomeCategory.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } },
      select: { id: true },
    });
    if (dup) throw new ConflictException(`Income category "${dto.name}" already exists`);

    const updated = await this.prisma.incomeCategory.update({ where: { id }, data: { name: dto.name } });
    await this.redis.del(IncomeKeys.categories(firmId));
    return serialise(updated);
  }

  async deleteIncomeCategory(firmId: bigint, id: bigint) {
    const row = await this.prisma.incomeCategory.findFirst({ where: { id, firmId }, select: { id: true, isDefault: true } });
    if (!row) throw new NotFoundException('Income category not found');
    if (row.isDefault) throw new ConflictException('Cannot delete a default income category');

    await this.prisma.incomeCategory.delete({ where: { id } });
    await this.redis.del(IncomeKeys.categories(firmId));
    return { success: true };
  }

  // ── Income Suppliers ──────────────────────────────────────────────────────

  async listIncomeSuppliers(firmId: bigint) {
    const cacheKey = IncomeKeys.suppliers(firmId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.incomeSupplier.findMany({
      where: { firmId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    const result = serialise(rows);
    await this.redis.set(cacheKey, result, CacheTTL.LONG);
    return result;
  }

  async createIncomeSupplier(firmId: bigint, dto: UpsertMasterItemDto) {
    const dup = await this.prisma.incomeSupplier.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (dup) throw new ConflictException(`Income supplier "${dto.name}" already exists`);

    const row = await this.prisma.incomeSupplier.create({ data: { firmId, name: dto.name } });
    await this.redis.del(IncomeKeys.suppliers(firmId));
    return serialise(row);
  }

  async updateIncomeSupplier(firmId: bigint, id: bigint, dto: UpsertMasterItemDto) {
    const row = await this.prisma.incomeSupplier.findFirst({ where: { id, firmId }, select: { id: true } });
    if (!row) throw new NotFoundException('Income supplier not found');

    const dup = await this.prisma.incomeSupplier.findFirst({
      where: { firmId, name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } },
      select: { id: true },
    });
    if (dup) throw new ConflictException(`Income supplier "${dto.name}" already exists`);

    const updated = await this.prisma.incomeSupplier.update({ where: { id }, data: { name: dto.name } });
    await this.redis.del(IncomeKeys.suppliers(firmId));
    return serialise(updated);
  }

  async deleteIncomeSupplier(firmId: bigint, id: bigint) {
    const row = await this.prisma.incomeSupplier.findFirst({ where: { id, firmId }, select: { id: true } });
    if (!row) throw new NotFoundException('Income supplier not found');

    await this.prisma.incomeSupplier.delete({ where: { id } });
    await this.redis.del(IncomeKeys.suppliers(firmId));
    return { success: true };
  }

  // ── E-way GSP Credentials ─────────────────────────────────────────────────

  async getGspCredentials(firmId: bigint) {
    const cacheKey = SettingsKeys.ewayGsp(firmId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const creds = await this.prisma.ewayGspCredentials.findUnique({ where: { firmId } });
    const result = creds
      ? { firmId: firmId.toString(), gspUsername: creds.gspUsername, registeredAt: creds.registeredAt.toISOString() }
      : null;

    if (result) await this.redis.set(cacheKey, result, CacheTTL.EWAY_GSP_TOKEN);
    return result;
  }

  async saveGspCredentials(firmId: bigint, dto: SaveGspCredentialsDto) {
    // NOTE: In production, encrypt dto.gspPassword with KMS/libsodium before storing.
    const encryptedPassword = Buffer.from(dto.gspPassword).toString('base64');

    await this.prisma.ewayGspCredentials.upsert({
      where: { firmId },
      create: {
        firmId,
        gspUsername: dto.gspUsername,
        gspPasswordEnc: encryptedPassword,
      },
      update: {
        gspUsername: dto.gspUsername,
        gspPasswordEnc: encryptedPassword,
        registeredAt: new Date(),
      },
    });

    await this.redis.del(SettingsKeys.ewayGsp(firmId));
    return this.getGspCredentials(firmId);
  }

  // ── private: default settings objects ────────────────────────────────────

  private defaultSalesBillSettings(firmId: bigint) {
    return {
      firmId: firmId.toString(),
      showDueDetailsInInvoice: false,
      showGstInJobChallan: true,
      defaultPrintType: $Enums.PrintType.ORIGINAL,
      showChallanSection: true,
      billNoLabel: 'Bill No.',
      showLossProductOption: false,
      showDeliveryToSalesOption: false,
      showWithholdingTax: false,
      enableDirectPayment: false,
      discountScope: $Enums.DiscountScope.BILL,
      gstScope: $Enums.DiscountScope.BILL,
      billPrefix: null,
      termsAndConditions: null,
      jobChallanTitle: null,
      taxInvoiceTitle: null,
      pdfCustomHeading: null,
      pdfTemplate: $Enums.PdfTemplate.STANDARD,
    };
  }
}
