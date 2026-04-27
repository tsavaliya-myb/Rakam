import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

type Decimal = Prisma.Decimal;
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AuthenticatedUser } from '../../common/interfaces/tenant-context.interface';
import { CreateFirmDto } from './dto/create-firm.dto';
import { UpdateFirmDto } from './dto/update-firm.dto';
import { TogglePdfOptionsDto } from './dto/toggle-pdf-options.dto';
import { UpdateBankDetailsDto } from './dto/update-bank-details.dto';
import { CreateDispatchAddressDto } from './dto/create-dispatch-address.dto';
import { UpdateDispatchAddressDto } from './dto/update-dispatch-address.dto';
import { FirmKeys, SettingsKeys } from '../../common/cache-keys';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

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
export class FirmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  // ── list ─────────────────────────────────────────────────────────────────

  async list(user: AuthenticatedUser) {
    const { accountId } = user;

    const firms = await this.prisma.firm.findMany({
      where: { accountId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        ownerName: true,
        gstNo: true,
        panNo: true,
        state: true,
        city: true,
        isDefault: true,
        showWatermark: true,
        showLogo: true,
        showSignature: true,
        logoKey: true,
        createdAt: true,
      },
    });

    const planLimit = await this.subscriptions.getFirmLimit(accountId);

    return {
      data: serialise(firms),
      stats: {
        total: firms.length,
        active: firms.length,
        planLimit,
      },
    };
  }

  // ── create ───────────────────────────────────────────────────────────────

  async create(user: AuthenticatedUser, dto: CreateFirmDto) {
    const { accountId } = user;

    const existingCount = await this.prisma.firm.count({
      where: { accountId, deletedAt: null },
    });

    const limit = await this.subscriptions.getFirmLimit(accountId);
    if (existingCount >= limit) {
      throw new ForbiddenException(
        `Your plan allows up to ${limit} firm(s). Please upgrade to add more.`,
      );
    }

    const duplicate = await this.prisma.firm.findFirst({
      where: { accountId, name: { equals: dto.name, mode: 'insensitive' }, deletedAt: null },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException(`A firm named "${dto.name}" already exists`);

    const isFirst = existingCount === 0;

    const firm = await this.prisma.firm.create({
      data: {
        accountId,
        name: dto.name,
        ownerName: dto.ownerName ?? null,
        gstNo: dto.gstNo ?? null,
        panNo: dto.panNo ?? null,
        msmeNo: dto.msmeNo ?? null,
        defaultGstPct: dto.defaultGstPct ?? null,
        mobilePrimary: dto.mobilePrimary ?? null,
        mobileSecondary: dto.mobileSecondary ?? null,
        address: dto.address ?? null,
        state: dto.state ?? null,
        city: dto.city ?? null,
        pincode: dto.pincode ?? null,
        isDefault: isFirst,
      },
    });

    if (isFirst) {
      await this.prisma.account.update({
        where: { id: accountId },
        data: { defaultFirmId: firm.id },
      });
    }

    await this.redis.del(FirmKeys.list(accountId));
    await this.subscriptions.invalidateCache(accountId);
    return serialise(await this.findOne(user, firm.id));
  }

  // ── findOne ───────────────────────────────────────────────────────────────

  async findOne(user: AuthenticatedUser, id: bigint) {
    const cacheKey = FirmKeys.detail(id);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    const firm = await this.prisma.firm.findFirst({
      where: { id, accountId: user.accountId, deletedAt: null },
      include: {
        bankDetails: true,
        dispatchAddresses: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!firm) throw new NotFoundException('Firm not found');

    const result = serialise(firm);
    await this.redis.set(cacheKey, result, 60 * 60);
    return result;
  }

  // ── update ────────────────────────────────────────────────────────────────

  async update(user: AuthenticatedUser, id: bigint, dto: UpdateFirmDto) {
    const firm = await this.prisma.firm.findFirst({
      where: { id, accountId: user.accountId, deletedAt: null },
      select: { id: true },
    });
    if (!firm) throw new NotFoundException('Firm not found');

    if (dto.name) {
      const dup = await this.prisma.firm.findFirst({
        where: {
          accountId: user.accountId,
          name: { equals: dto.name, mode: 'insensitive' },
          deletedAt: null,
          NOT: { id },
        },
        select: { id: true },
      });
      if (dup) throw new ConflictException(`A firm named "${dto.name}" already exists`);
    }

    await this.prisma.firm.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.ownerName !== undefined && { ownerName: dto.ownerName || null }),
        ...(dto.gstNo !== undefined && { gstNo: dto.gstNo || null }),
        ...(dto.panNo !== undefined && { panNo: dto.panNo || null }),
        ...(dto.msmeNo !== undefined && { msmeNo: dto.msmeNo || null }),
        ...(dto.defaultGstPct !== undefined && { defaultGstPct: dto.defaultGstPct }),
        ...(dto.mobilePrimary !== undefined && { mobilePrimary: dto.mobilePrimary || null }),
        ...(dto.mobileSecondary !== undefined && { mobileSecondary: dto.mobileSecondary || null }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode || null }),
        ...(dto.logoKey !== undefined && { logoKey: dto.logoKey || null }),
        ...(dto.watermarkKey !== undefined && { watermarkKey: dto.watermarkKey || null }),
        ...(dto.signatureKey !== undefined && { signatureKey: dto.signatureKey || null }),
        ...(dto.udhyamCertKey !== undefined && { udhyamCertKey: dto.udhyamCertKey || null }),
      },
    });

    await this.invalidateFirmCaches(user.accountId, id);
    return serialise(await this.findOne(user, id));
  }

  // ── remove ────────────────────────────────────────────────────────────────

  async remove(user: AuthenticatedUser, id: bigint) {
    const firm = await this.prisma.firm.findFirst({
      where: { id, accountId: user.accountId, deletedAt: null },
      select: { id: true, isDefault: true },
    });
    if (!firm) throw new NotFoundException('Firm not found');
    if (firm.isDefault) {
      throw new BadRequestException('Cannot delete the default firm. Set another firm as default first.');
    }

    await this.prisma.firm.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.invalidateFirmCaches(user.accountId, id);
    await this.subscriptions.invalidateCache(user.accountId);
    return { success: true };
  }

  // ── setDefault ────────────────────────────────────────────────────────────

  async setDefault(user: AuthenticatedUser, id: bigint) {
    const firm = await this.prisma.firm.findFirst({
      where: { id, accountId: user.accountId, deletedAt: null },
      select: { id: true },
    });
    if (!firm) throw new NotFoundException('Firm not found');

    await this.prisma.$transaction([
      this.prisma.firm.updateMany({
        where: { accountId: user.accountId },
        data: { isDefault: false },
      }),
      this.prisma.firm.update({
        where: { id },
        data: { isDefault: true },
      }),
      this.prisma.account.update({
        where: { id: user.accountId },
        data: { defaultFirmId: id },
      }),
    ]);

    await this.redis.del(FirmKeys.list(user.accountId), FirmKeys.active(user.userId));
    return { success: true, defaultFirmId: id.toString() };
  }

  // ── togglePdfOptions ──────────────────────────────────────────────────────

  async togglePdfOptions(user: AuthenticatedUser, id: bigint, dto: TogglePdfOptionsDto) {
    const firm = await this.prisma.firm.findFirst({
      where: { id, accountId: user.accountId, deletedAt: null },
      select: { id: true },
    });
    if (!firm) throw new NotFoundException('Firm not found');

    await this.prisma.firm.update({
      where: { id },
      data: {
        ...(dto.showWatermark !== undefined && { showWatermark: dto.showWatermark }),
        ...(dto.showLogo !== undefined && { showLogo: dto.showLogo }),
        ...(dto.showSignature !== undefined && { showSignature: dto.showSignature }),
      },
    });

    await this.invalidateFirmCaches(user.accountId, id);
    return { success: true };
  }

  // ── getBankDetails ────────────────────────────────────────────────────────

  async getBankDetails(user: AuthenticatedUser, firmId: bigint) {
    const cacheKey = FirmKeys.bankDetails(firmId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    await this.assertFirmOwner(user.accountId, firmId);

    const details = await this.prisma.firmBankDetails.findUnique({ where: { firmId } });
    const result = serialise(details ?? { firmId: firmId.toString() });
    await this.redis.set(cacheKey, result, 60 * 60);
    return result;
  }

  // ── saveBankDetails ───────────────────────────────────────────────────────

  async saveBankDetails(user: AuthenticatedUser, firmId: bigint, dto: UpdateBankDetailsDto) {
    await this.assertFirmOwner(user.accountId, firmId);

    await this.prisma.firmBankDetails.upsert({
      where: { firmId },
      create: {
        firmId,
        bankName: dto.bankName ?? null,
        branchName: dto.branchName ?? null,
        accountHolderName: dto.accountHolderName ?? null,
        accountType: dto.accountType ?? null,
        accountNo: dto.accountNo ?? null,
        ifscCode: dto.ifscCode ?? null,
      },
      update: {
        ...(dto.bankName !== undefined && { bankName: dto.bankName || null }),
        ...(dto.branchName !== undefined && { branchName: dto.branchName || null }),
        ...(dto.accountHolderName !== undefined && { accountHolderName: dto.accountHolderName || null }),
        ...(dto.accountType !== undefined && { accountType: dto.accountType || null }),
        ...(dto.accountNo !== undefined && { accountNo: dto.accountNo || null }),
        ...(dto.ifscCode !== undefined && { ifscCode: dto.ifscCode || null }),
      },
    });

    await this.redis.del(FirmKeys.bankDetails(firmId), FirmKeys.detail(firmId));
    return serialise(await this.prisma.firmBankDetails.findUnique({ where: { firmId } }));
  }

  // ── getDispatchAddresses ──────────────────────────────────────────────────

  async getDispatchAddresses(user: AuthenticatedUser, firmId: bigint) {
    const cacheKey = FirmKeys.dispatchAddresses(firmId);
    const cached = await this.redis.get<unknown>(cacheKey);
    if (cached) return cached;

    await this.assertFirmOwner(user.accountId, firmId);

    const rows = await this.prisma.dispatchAddress.findMany({
      where: { firmId },
      orderBy: { createdAt: 'asc' },
    });

    const result = serialise(rows);
    await this.redis.set(cacheKey, result, 60 * 60);
    return result;
  }

  // ── addDispatchAddress ────────────────────────────────────────────────────

  async addDispatchAddress(user: AuthenticatedUser, firmId: bigint, dto: CreateDispatchAddressDto) {
    await this.assertFirmOwner(user.accountId, firmId);

    const row = await this.prisma.dispatchAddress.create({
      data: {
        firmId,
        dispatchName: dto.dispatchName,
        address: dto.address,
        city: dto.city ?? null,
        state: dto.state,
        pincode: dto.pincode ?? null,
      },
    });

    await this.redis.del(FirmKeys.dispatchAddresses(firmId), FirmKeys.detail(firmId));
    return serialise(row);
  }

  // ── updateDispatchAddress ─────────────────────────────────────────────────

  async updateDispatchAddress(
    user: AuthenticatedUser,
    firmId: bigint,
    addrId: bigint,
    dto: UpdateDispatchAddressDto,
  ) {
    await this.assertFirmOwner(user.accountId, firmId);

    const addr = await this.prisma.dispatchAddress.findFirst({
      where: { id: addrId, firmId },
      select: { id: true },
    });
    if (!addr) throw new NotFoundException('Dispatch address not found');

    const updated = await this.prisma.dispatchAddress.update({
      where: { id: addrId },
      data: {
        ...(dto.dispatchName !== undefined && { dispatchName: dto.dispatchName }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city || null }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode || null }),
      },
    });

    await this.redis.del(FirmKeys.dispatchAddresses(firmId), FirmKeys.detail(firmId));
    return serialise(updated);
  }

  // ── removeDispatchAddress ─────────────────────────────────────────────────

  async removeDispatchAddress(user: AuthenticatedUser, firmId: bigint, addrId: bigint) {
    await this.assertFirmOwner(user.accountId, firmId);

    const addr = await this.prisma.dispatchAddress.findFirst({
      where: { id: addrId, firmId },
      select: { id: true },
    });
    if (!addr) throw new NotFoundException('Dispatch address not found');

    await this.prisma.dispatchAddress.delete({ where: { id: addrId } });

    await this.redis.del(FirmKeys.dispatchAddresses(firmId), FirmKeys.detail(firmId));
    return { success: true };
  }

  // ── private helpers ───────────────────────────────────────────────────────

  private async assertFirmOwner(accountId: bigint, firmId: bigint): Promise<void> {
    const firm = await this.prisma.firm.findFirst({
      where: { id: firmId, accountId, deletedAt: null },
      select: { id: true },
    });
    if (!firm) throw new NotFoundException('Firm not found');
  }

  private async invalidateFirmCaches(accountId: bigint, firmId: bigint) {
    await this.redis.del(
      FirmKeys.detail(firmId),
      FirmKeys.list(accountId),
      FirmKeys.bankDetails(firmId),
      FirmKeys.dispatchAddresses(firmId),
      SettingsKeys.salesBill(firmId),
      SettingsKeys.purchaseBill(firmId),
      SettingsKeys.deliveryChallan(firmId),
      SettingsKeys.other(firmId),
    );
  }
}
