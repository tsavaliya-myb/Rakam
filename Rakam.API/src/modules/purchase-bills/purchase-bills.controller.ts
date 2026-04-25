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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantContext, AuthenticatedUser } from '../../common/interfaces/tenant-context.interface';
import { PurchaseBillsService } from './purchase-bills.service';
import { PdfService } from '../pdf/pdf.service';
import { CreatePurchaseBillDto } from './dto/create-purchase-bill.dto';
import { UpdatePurchaseBillDto } from './dto/update-purchase-bill.dto';
import { ListPurchaseBillsDto } from './dto/list-purchase-bills.dto';
import { RecordPurchasePaymentDto } from './dto/record-payment.dto';

@ApiTags('Purchase Bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('purchase-bills')
export class PurchaseBillsController {
  constructor(
    private readonly bills: PurchaseBillsService,
    private readonly pdf: PdfService,
  ) {}

  // ── List ─────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List purchase bills',
    description:
      'Paginated list with optional tab filter (All / With Tax / Without Tax), keyset pagination, party/status/date filters and text search.',
  })
  @ApiResponse({ status: 200, description: 'Paginated bill list with footer totals' })
  list(@Tenant() tenant: TenantContext, @Query() dto: ListPurchaseBillsDto) {
    return this.bills.list(tenant, dto);
  }

  // ── Create ───────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Create a purchase bill',
    description:
      'Creates a purchase bill with line items. Bill number is supplied manually (as received from supplier). GST and discount totals are computed server-side.',
  })
  @ApiResponse({ status: 201, description: 'Created purchase bill with full details' })
  create(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePurchaseBillDto,
  ) {
    return this.bills.create(tenant, user.userId, dto);
  }

  // ── Get one ──────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a purchase bill by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Full purchase bill with items and attachments' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bills.findOne(tenant, BigInt(id));
  }

  // ── Update ───────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update a purchase bill' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Updated bill' })
  update(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseBillDto,
  ) {
    return this.bills.update(tenant, BigInt(id), dto);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a purchase bill (only if UNPAID)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  remove(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bills.remove(tenant, BigInt(id));
  }

  // ── Record payment ───────────────────────────────────────────────────────

  @Post(':id/payment')
  @ApiOperation({
    summary: 'Record a payment against a purchase bill',
    description:
      'Creates a DEBIT transaction, allocates payment to the bill, and updates paid/pending amounts and status.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 201, description: 'Updated bill after payment' })
  recordPayment(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPurchasePaymentDto,
  ) {
    return this.bills.recordPayment(tenant, user.userId, BigInt(id), dto);
  }

  // ── PDF generation ───────────────────────────────────────────────────────

  @Post(':id/pdf')
  @ApiOperation({
    summary: 'Enqueue PDF generation for a purchase bill',
    description: 'Async: returns a job ID. Poll /pdf/jobs/:jobId for status and download URL.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 202, description: '{ jobId: string }' })
  @HttpCode(HttpStatus.ACCEPTED)
  async enqueuePdf(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.bills.verifyExists(tenant.firmId, BigInt(id));
    return this.pdf.enqueuePurchaseBillPdf(BigInt(id), tenant.firmId);
  }
}
