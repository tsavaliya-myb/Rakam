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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/tenant-context.interface';
import { FirmsService } from './firms.service';
import { CreateFirmDto } from './dto/create-firm.dto';
import { UpdateFirmDto } from './dto/update-firm.dto';
import { TogglePdfOptionsDto } from './dto/toggle-pdf-options.dto';
import { UpdateBankDetailsDto } from './dto/update-bank-details.dto';
import { CreateDispatchAddressDto } from './dto/create-dispatch-address.dto';
import { UpdateDispatchAddressDto } from './dto/update-dispatch-address.dto';

@ApiTags('Firms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('firms')
export class FirmsController {
  constructor(private readonly firms: FirmsService) {}

  // ── List ──────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List all firms for the account',
    description:
      'Returns all non-deleted firms owned by the authenticated account, ordered ' +
      'default-first. Includes stats: total, active, planLimit.',
  })
  @ApiResponse({ status: 200, description: '{ data: Firm[], stats: { total, active, planLimit } }' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.firms.list(user);
  }

  // ── Create ────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Create a new firm',
    description:
      'Creates a firm under the authenticated account. Blocked when the account has reached ' +
      'its plan firm-limit (returns 403 with upgrade message).',
  })
  @ApiResponse({ status: 201, description: 'Created firm' })
  @ApiResponse({ status: 403, description: 'Plan firm-limit reached' })
  @ApiResponse({ status: 409, description: 'Duplicate firm name' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFirmDto) {
    return this.firms.create(user, dto);
  }

  // ── Get one ───────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({
    summary: 'Get firm details',
    description: 'Returns the firm with embedded bankDetails and dispatchAddresses.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Firm with bank details and dispatch addresses' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.firms.findOne(user, BigInt(id));
  }

  // ── Update ────────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({
    summary: 'Update firm details',
    description:
      'Updates any combination of firm fields including name, address, GST, assets S3 keys. ' +
      'Partial update — omitted fields are unchanged.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Updated firm' })
  @ApiResponse({ status: 409, description: 'Duplicate firm name' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFirmDto,
  ) {
    return this.firms.update(user, BigInt(id), dto);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete a firm',
    description: 'Blocked if the firm is the account default. Set another firm as default first.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 400, description: 'Cannot delete the default firm' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.firms.remove(user, BigInt(id));
  }

  // ── Set Default ───────────────────────────────────────────────────────────

  @Patch(':id/set-default')
  @ApiOperation({
    summary: 'Set a firm as the account default',
    description: 'Clears isDefault on all other firms and sets it on this one.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true, defaultFirmId }' })
  setDefault(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.firms.setDefault(user, BigInt(id));
  }

  // ── PDF Options ───────────────────────────────────────────────────────────

  @Patch(':id/pdf-options')
  @ApiOperation({
    summary: 'Toggle watermark / logo / signature on PDFs',
    description:
      'Updates the showWatermark, showLogo, showSignature toggles visible on the Manage Firm card.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  togglePdfOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TogglePdfOptionsDto,
  ) {
    return this.firms.togglePdfOptions(user, BigInt(id), dto);
  }

  // ── Bank Details ──────────────────────────────────────────────────────────

  @Get(':id/bank-details')
  @ApiOperation({ summary: 'Get bank details for a firm' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'FirmBankDetails record (may have null fields)' })
  getBankDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.firms.getBankDetails(user, BigInt(id));
  }

  @Put(':id/bank-details')
  @ApiOperation({
    summary: 'Create or update bank details',
    description: 'Upsert — creates the row if missing, otherwise updates it.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Updated FirmBankDetails' })
  saveBankDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBankDetailsDto,
  ) {
    return this.firms.saveBankDetails(user, BigInt(id), dto);
  }

  // ── Dispatch Addresses ────────────────────────────────────────────────────

  @Get(':id/dispatch-addresses')
  @ApiOperation({ summary: 'List dispatch addresses for a firm' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Array of DispatchAddress records' })
  getDispatchAddresses(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.firms.getDispatchAddresses(user, BigInt(id));
  }

  @Post(':id/dispatch-addresses')
  @ApiOperation({ summary: 'Add a dispatch address to a firm' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 201, description: 'Created DispatchAddress' })
  addDispatchAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateDispatchAddressDto,
  ) {
    return this.firms.addDispatchAddress(user, BigInt(id), dto);
  }

  @Patch(':id/dispatch-addresses/:addrId')
  @ApiOperation({ summary: 'Update a dispatch address' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'addrId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Updated DispatchAddress' })
  updateDispatchAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('addrId', ParseIntPipe) addrId: number,
    @Body() dto: UpdateDispatchAddressDto,
  ) {
    return this.firms.updateDispatchAddress(user, BigInt(id), BigInt(addrId), dto);
  }

  @Delete(':id/dispatch-addresses/:addrId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a dispatch address' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'addrId', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  removeDispatchAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('addrId', ParseIntPipe) addrId: number,
  ) {
    return this.firms.removeDispatchAddress(user, BigInt(id), BigInt(addrId));
  }
}
