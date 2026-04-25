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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BillType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantContext, AuthenticatedUser } from '../../common/interfaces/tenant-context.interface';
import { SalesBillsService } from './sales-bills.service';
import { PdfService } from '../pdf/pdf.service';
import { CreateSalesBillDto } from './dto/create-sales-bill.dto';
import { UpdateSalesBillDto } from './dto/update-sales-bill.dto';
import { ListSalesBillsDto } from './dto/list-sales-bills.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';

@ApiTags('Sales Bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('sales-bills')
export class SalesBillsController {
  constructor(
    private readonly bills: SalesBillsService,
    private readonly pdf: PdfService,
  ) {}

  // ── List ─────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List sales bills',
    description: 'Paginated list with optional tab filter (All / Tax Invoice / Job Challan), keyset pagination, party/status/date filters and text search.',
  })
  @ApiResponse({ status: 200, description: 'Paginated bill list with footer totals' })
  list(@Tenant() tenant: TenantContext, @Query() dto: ListSalesBillsDto) {
    return this.bills.list(tenant, dto);
  }

  // ── Create ───────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Create a sales bill',
    description: 'Creates a Manual Challan bill. Accepts one or more challans each with product line items. Bill number is auto-incremented per firm/FY/bill-type. GST, discount, and tax totals are computed server-side.',
  })
  @ApiResponse({ status: 201, description: 'Created sales bill with full details' })
  create(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSalesBillDto,
  ) {
    return this.bills.create(tenant, user.userId, dto);
  }

  // ── Next bill number ─────────────────────────────────────────────────────

  @Get('next-bill-no')
  @ApiOperation({ summary: 'Get next auto-incremented bill number for a given bill type' })
  @ApiResponse({ status: 200, description: '{ nextSeq: number, display: string }' })
  getNextBillNo(
    @Tenant() tenant: TenantContext,
    @Query('billType') billType: BillType = BillType.TAX_INVOICE,
  ) {
    return this.bills.getNextBillNo(tenant, billType);
  }

  // ── Unbilled delivery challans (for "Import DC" modal) ───────────────────

  @Get('unbilled-dc')
  @ApiOperation({
    summary: 'List delivery challans not yet converted to a sales bill',
    description: 'Used to populate the "Import Delivery Challan" picker. Optionally filtered by partyId.',
  })
  @ApiResponse({ status: 200, description: 'Array of unbilled delivery challans with items' })
  listUnbilledDC(
    @Tenant() tenant: TenantContext,
    @Query('partyId') partyId?: string,
  ) {
    return this.bills.listUnbilledDC(tenant, partyId ? parseInt(partyId, 10) : undefined);
  }

  // ── Get one ──────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a sales bill by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Full sales bill with challans, items, e-way bills and credit notes' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bills.findOne(tenant, BigInt(id));
  }

  // ── Update ───────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sales bill' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Updated bill' })
  update(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalesBillDto,
  ) {
    return this.bills.update(tenant, BigInt(id), dto);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a sales bill (only if UNPAID)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  remove(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bills.remove(tenant, BigInt(id));
  }

  // ── Duplicate ────────────────────────────────────────────────────────────

  @Post(':id/duplicate')
  @ApiOperation({
    summary: 'Duplicate a sales bill',
    description: 'Copies the bill as a new bill dated today with a fresh bill number. DC links are not carried over.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 201, description: 'Newly created duplicate bill' })
  duplicate(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bills.duplicate(tenant, user.userId, BigInt(id));
  }

  // ── Record payment ───────────────────────────────────────────────────────

  @Post(':id/payment')
  @ApiOperation({
    summary: 'Record a payment against a sales bill',
    description: 'Creates a CREDIT transaction, allocates payment to the bill, and updates paid/pending amounts and status.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 201, description: 'Updated bill after payment' })
  recordPayment(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.bills.recordPayment(tenant, user.userId, BigInt(id), dto);
  }

  // ── Credit note ──────────────────────────────────────────────────────────

  @Post(':id/credit-note')
  @ApiOperation({ summary: 'Create a credit note against a sales bill' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 201, description: 'Created credit note' })
  createCreditNote(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCreditNoteDto,
  ) {
    return this.bills.createCreditNote(tenant, BigInt(id), dto);
  }

  // ── PDF generation ───────────────────────────────────────────────────────

  @Post(':id/pdf')
  @ApiOperation({
    summary: 'Enqueue PDF generation for a sales bill',
    description: 'Async: returns a job ID. Poll /pdf/jobs/:jobId for status and download URL.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 202, description: '{ jobId: string }' })
  @HttpCode(HttpStatus.ACCEPTED)
  async enqueuePdf(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.bills.enqueuePdf(tenant.firmId, BigInt(id));
    const job = await this.pdf.enqueueSalesBillPdf(BigInt(id), tenant.firmId);
    return job;
  }
}
