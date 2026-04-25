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
import { DeliveryChallansService } from './delivery-challans.service';
import { PdfService } from '../pdf/pdf.service';
import { CreateDeliveryChallanDto } from './dto/create-delivery-challan.dto';
import { UpdateDeliveryChallanDto } from './dto/update-delivery-challan.dto';
import { ListDeliveryChallansDto } from './dto/list-delivery-challans.dto';

@ApiTags('Delivery Challans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('delivery-challans')
export class DeliveryChallansController {
  constructor(
    private readonly dc: DeliveryChallansService,
    private readonly pdf: PdfService,
  ) {}

  // ── List ─────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List delivery challans',
    description:
      'Paginated list ordered by DC date DESC. Filter by party, converted status, date range, or free-text search on DC number / party name.',
  })
  @ApiResponse({ status: 200, description: 'Paginated DC list with salesBillCreated flag and salesBillNo' })
  list(@Tenant() tenant: TenantContext, @Query() dto: ListDeliveryChallansDto) {
    return this.dc.list(tenant, dto);
  }

  // ── Create ───────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Create a delivery challan',
    description:
      'DC number is auto-incremented per firm/FY. Accepts party challan reference and product line items. Net amount and total qty are computed server-side.',
  })
  @ApiResponse({ status: 201, description: 'Created delivery challan with full details' })
  create(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDeliveryChallanDto,
  ) {
    return this.dc.create(tenant, user.userId, dto);
  }

  // ── Next DC number ───────────────────────────────────────────────────────

  @Get('next-dc-no')
  @ApiOperation({ summary: 'Get next auto-incremented DC number for this firm/FY' })
  @ApiResponse({ status: 200, description: '{ nextSeq: number, display: string }' })
  getNextDcNo(@Tenant() tenant: TenantContext) {
    return this.dc.getNextDcNo(tenant);
  }

  // ── Get one ──────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a delivery challan by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Full delivery challan with party, items, and linked sales bill info' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.dc.findOne(tenant, BigInt(id));
  }

  // ── Update ───────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a delivery challan',
    description: 'Blocked if the DC has already been converted to a sales bill.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Updated delivery challan' })
  @ApiResponse({ status: 400, description: 'Cannot edit a converted DC' })
  update(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeliveryChallanDto,
  ) {
    return this.dc.update(tenant, BigInt(id), dto);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete a delivery challan',
    description: 'Blocked if the DC has already been converted to a sales bill.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 400, description: 'Cannot delete a converted DC' })
  remove(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.dc.remove(tenant, BigInt(id));
  }

  // ── PDF generation ───────────────────────────────────────────────────────

  @Post(':id/pdf')
  @ApiOperation({
    summary: 'Enqueue PDF generation for a delivery challan',
    description: 'Async: returns a job ID. Poll /pdf/jobs/:jobId for status and download URL.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 202, description: '{ jobId: string }' })
  @HttpCode(HttpStatus.ACCEPTED)
  async enqueuePdf(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.dc.verifyExists(tenant.firmId, BigInt(id));
    return this.pdf.enqueueDeliveryChallanPdf(BigInt(id), tenant.firmId);
  }
}
