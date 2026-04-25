import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantContext, AuthenticatedUser } from '../../common/interfaces/tenant-context.interface';
import { SettingsService } from './settings.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSalesBillSettingsDto } from './dto/update-sales-bill-settings.dto';
import { UpdatePurchaseBillSettingsDto } from './dto/update-purchase-bill-settings.dto';
import { UpdateDeliveryChallanSettingsDto } from './dto/update-delivery-challan-settings.dto';
import { UpdateOtherSettingsDto } from './dto/update-other-settings.dto';
import { UpsertMasterItemDto } from './dto/upsert-master-item.dto';
import { SaveGspCredentialsDto } from './dto/save-gsp-credentials.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Profile (per-user, no firm context needed)
// ─────────────────────────────────────────────────────────────────────────────

@ApiTags('Settings — Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings/profile')
export class ProfileController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile with business types' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.settings.getProfile(user.userId);
  }

  @Patch()
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates firstName, lastName, email, profilePhotoKey, and/or businessTypes. ' +
      'businessTypes is stored on the Account model.',
  })
  @ApiResponse({ status: 200, description: 'Updated profile' })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.settings.updateProfile(user.userId, dto);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Firm settings (all require x-firm-id + x-fy headers via TenantGuard)
// ─────────────────────────────────────────────────────────────────────────────

@ApiTags('Settings — Firm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  // ── Sales Bill Settings ─────────────────────────────────────────────────

  @Get('sales-bill')
  @ApiOperation({ summary: 'Get Sales Bill settings for the active firm' })
  @ApiResponse({ status: 200, description: 'FirmSalesBillSettings (defaults if not yet saved)' })
  getSalesBillSettings(@Tenant() tenant: TenantContext) {
    return this.settings.getSalesBillSettings(tenant.firmId);
  }

  @Put('sales-bill')
  @ApiOperation({
    summary: 'Save Sales Bill settings',
    description: 'Upserts the settings row. Partial fields allowed — omitted fields keep current values.',
  })
  @ApiResponse({ status: 200, description: 'Updated FirmSalesBillSettings' })
  saveSalesBillSettings(@Tenant() tenant: TenantContext, @Body() dto: UpdateSalesBillSettingsDto) {
    return this.settings.saveSalesBillSettings(tenant.firmId, dto);
  }

  // ── Purchase Bill Settings ──────────────────────────────────────────────

  @Get('purchase-bill')
  @ApiOperation({ summary: 'Get Purchase Bill settings for the active firm' })
  @ApiResponse({ status: 200, description: 'FirmPurchaseBillSettings' })
  getPurchaseBillSettings(@Tenant() tenant: TenantContext) {
    return this.settings.getPurchaseBillSettings(tenant.firmId);
  }

  @Put('purchase-bill')
  @ApiOperation({ summary: 'Save Purchase Bill settings' })
  @ApiResponse({ status: 200, description: 'Updated FirmPurchaseBillSettings' })
  savePurchaseBillSettings(@Tenant() tenant: TenantContext, @Body() dto: UpdatePurchaseBillSettingsDto) {
    return this.settings.savePurchaseBillSettings(tenant.firmId, dto);
  }

  // ── Delivery Challan Settings ───────────────────────────────────────────

  @Get('delivery-challan')
  @ApiOperation({ summary: 'Get Delivery Challan settings for the active firm' })
  @ApiResponse({ status: 200, description: 'FirmDeliveryChallanSettings' })
  getDeliveryChallanSettings(@Tenant() tenant: TenantContext) {
    return this.settings.getDeliveryChallanSettings(tenant.firmId);
  }

  @Put('delivery-challan')
  @ApiOperation({ summary: 'Save Delivery Challan settings' })
  @ApiResponse({ status: 200, description: 'Updated FirmDeliveryChallanSettings' })
  saveDeliveryChallanSettings(@Tenant() tenant: TenantContext, @Body() dto: UpdateDeliveryChallanSettingsDto) {
    return this.settings.saveDeliveryChallanSettings(tenant.firmId, dto);
  }

  // ── Other Settings ──────────────────────────────────────────────────────

  @Get('other')
  @ApiOperation({
    summary: 'Get other / misc settings for the active firm',
    description: 'Covers inventory toggle, allow-sales-without-stock, shortcuts, decimal values, ' +
      'party-wise product rate, and shipment address toggles.',
  })
  @ApiResponse({ status: 200, description: 'FirmOtherSettings' })
  getOtherSettings(@Tenant() tenant: TenantContext) {
    return this.settings.getOtherSettings(tenant.firmId);
  }

  @Put('other')
  @ApiOperation({ summary: 'Save other / misc settings' })
  @ApiResponse({ status: 200, description: 'Updated FirmOtherSettings' })
  saveOtherSettings(@Tenant() tenant: TenantContext, @Body() dto: UpdateOtherSettingsDto) {
    return this.settings.saveOtherSettings(tenant.firmId, dto);
  }

  // ── Expense — Categories ─────────────────────────────────────────────────

  @Get('expense/categories')
  @ApiOperation({ summary: 'List expense categories' })
  listExpenseCategories(@Tenant() tenant: TenantContext) {
    return this.settings.listExpenseCategories(tenant.firmId);
  }

  @Post('expense/categories')
  @ApiOperation({ summary: 'Add an expense category' })
  @ApiResponse({ status: 201, description: 'Created category' })
  @ApiResponse({ status: 409, description: 'Duplicate name' })
  createExpenseCategory(@Tenant() tenant: TenantContext, @Body() dto: UpsertMasterItemDto) {
    return this.settings.createExpenseCategory(tenant.firmId, dto);
  }

  @Patch('expense/categories/:id')
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOperation({ summary: 'Rename an expense category' })
  updateExpenseCategory(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertMasterItemDto,
  ) {
    return this.settings.updateExpenseCategory(tenant.firmId, BigInt(id), dto);
  }

  @Delete('expense/categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOperation({ summary: 'Delete an expense category', description: 'Blocked for default categories.' })
  deleteExpenseCategory(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.settings.deleteExpenseCategory(tenant.firmId, BigInt(id));
  }

  // ── Expense — Suppliers ──────────────────────────────────────────────────

  @Get('expense/suppliers')
  @ApiOperation({ summary: 'List expense suppliers' })
  listExpenseSuppliers(@Tenant() tenant: TenantContext) {
    return this.settings.listExpenseSuppliers(tenant.firmId);
  }

  @Post('expense/suppliers')
  @ApiOperation({ summary: 'Add an expense supplier' })
  createExpenseSupplier(@Tenant() tenant: TenantContext, @Body() dto: UpsertMasterItemDto) {
    return this.settings.createExpenseSupplier(tenant.firmId, dto);
  }

  @Patch('expense/suppliers/:id')
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOperation({ summary: 'Rename an expense supplier' })
  updateExpenseSupplier(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertMasterItemDto,
  ) {
    return this.settings.updateExpenseSupplier(tenant.firmId, BigInt(id), dto);
  }

  @Delete('expense/suppliers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOperation({ summary: 'Delete an expense supplier' })
  deleteExpenseSupplier(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.settings.deleteExpenseSupplier(tenant.firmId, BigInt(id));
  }

  // ── Expense — Items ──────────────────────────────────────────────────────

  @Get('expense/items')
  @ApiOperation({ summary: 'List expense items' })
  listExpenseItems(@Tenant() tenant: TenantContext) {
    return this.settings.listExpenseItems(tenant.firmId);
  }

  @Post('expense/items')
  @ApiOperation({ summary: 'Add an expense item' })
  createExpenseItem(@Tenant() tenant: TenantContext, @Body() dto: UpsertMasterItemDto) {
    return this.settings.createExpenseItem(tenant.firmId, dto);
  }

  @Patch('expense/items/:id')
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOperation({ summary: 'Rename an expense item' })
  updateExpenseItem(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertMasterItemDto,
  ) {
    return this.settings.updateExpenseItem(tenant.firmId, BigInt(id), dto);
  }

  @Delete('expense/items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOperation({ summary: 'Delete an expense item' })
  deleteExpenseItem(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.settings.deleteExpenseItem(tenant.firmId, BigInt(id));
  }

  // ── Income — Categories ──────────────────────────────────────────────────

  @Get('income/categories')
  @ApiOperation({ summary: 'List income categories' })
  listIncomeCategories(@Tenant() tenant: TenantContext) {
    return this.settings.listIncomeCategories(tenant.firmId);
  }

  @Post('income/categories')
  @ApiOperation({ summary: 'Add an income category' })
  createIncomeCategory(@Tenant() tenant: TenantContext, @Body() dto: UpsertMasterItemDto) {
    return this.settings.createIncomeCategory(tenant.firmId, dto);
  }

  @Patch('income/categories/:id')
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOperation({ summary: 'Rename an income category' })
  updateIncomeCategory(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertMasterItemDto,
  ) {
    return this.settings.updateIncomeCategory(tenant.firmId, BigInt(id), dto);
  }

  @Delete('income/categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOperation({ summary: 'Delete an income category', description: 'Blocked for default categories.' })
  deleteIncomeCategory(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.settings.deleteIncomeCategory(tenant.firmId, BigInt(id));
  }

  // ── Income — Suppliers ───────────────────────────────────────────────────

  @Get('income/suppliers')
  @ApiOperation({ summary: 'List income suppliers' })
  listIncomeSuppliers(@Tenant() tenant: TenantContext) {
    return this.settings.listIncomeSuppliers(tenant.firmId);
  }

  @Post('income/suppliers')
  @ApiOperation({ summary: 'Add an income supplier' })
  createIncomeSupplier(@Tenant() tenant: TenantContext, @Body() dto: UpsertMasterItemDto) {
    return this.settings.createIncomeSupplier(tenant.firmId, dto);
  }

  @Patch('income/suppliers/:id')
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOperation({ summary: 'Rename an income supplier' })
  updateIncomeSupplier(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertMasterItemDto,
  ) {
    return this.settings.updateIncomeSupplier(tenant.firmId, BigInt(id), dto);
  }

  @Delete('income/suppliers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  @ApiOperation({ summary: 'Delete an income supplier' })
  deleteIncomeSupplier(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.settings.deleteIncomeSupplier(tenant.firmId, BigInt(id));
  }

  // ── E-Way Bill GSP Credentials ───────────────────────────────────────────

  @Get('eway-gsp')
  @ApiOperation({
    summary: 'Get E-way Bill GSP credentials (username only, password not returned)',
    description: 'Returns gspUsername and registeredAt. The encrypted password is never returned.',
  })
  @ApiResponse({ status: 200, description: '{ firmId, gspUsername, registeredAt } or null' })
  getGspCredentials(@Tenant() tenant: TenantContext) {
    return this.settings.getGspCredentials(tenant.firmId);
  }

  @Put('eway-gsp')
  @ApiOperation({
    summary: 'Save or update GSP credentials',
    description: 'Upserts GSP username and password. Password is base64-encoded before storage ' +
      '(swap for KMS/libsodium in production).',
  })
  @ApiResponse({ status: 200, description: '{ firmId, gspUsername, registeredAt }' })
  saveGspCredentials(@Tenant() tenant: TenantContext, @Body() dto: SaveGspCredentialsDto) {
    return this.settings.saveGspCredentials(tenant.firmId, dto);
  }
}
