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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantContext, AuthenticatedUser } from '../../common/interfaces/tenant-context.interface';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txn: TransactionsService) {}

  // ── List ──────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List transactions',
    description:
      'Date-descending paginated list of all transactions for the active firm/FY. ' +
      'Supports filtering by party, txnType (DEBIT/CREDIT), txnFor (SALES/PURCHASE/…), ' +
      'paymentMode, and date range. The amount column in the UI shows amount + settlementAmount ' +
      'for SALES transactions per the tooltip specification.',
  })
  @ApiResponse({ status: 200, description: 'Paginated transaction list' })
  list(@Tenant() tenant: TenantContext, @Query() dto: ListTransactionsDto) {
    return this.txn.list(tenant, dto);
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  @Get('summary')
  @ApiOperation({
    summary: 'Total credit and debit summary for the active FY',
    description: 'Returns { totalCredit, totalDebit } aggregated across all transactions in the FY. Redis-cached (5 min).',
  })
  @ApiResponse({ status: 200, description: '{ totalCredit, totalDebit }' })
  summary(@Tenant() tenant: TenantContext) {
    return this.txn.summary(tenant);
  }

  // ── By Bill ───────────────────────────────────────────────────────────────

  @Get('by-bill/:billTable/:billId')
  @ApiOperation({
    summary: 'Transactions linked to a specific bill',
    description:
      'Returns all non-deleted transactions recorded against a given sales_bills or purchase_bills row. ' +
      'Used by bill detail views and PDF print headers.',
  })
  @ApiParam({ name: 'billTable', enum: ['sales_bills', 'purchase_bills'] })
  @ApiParam({ name: 'billId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Array of transaction summaries' })
  byBill(
    @Tenant() tenant: TenantContext,
    @Param('billTable') billTable: 'sales_bills' | 'purchase_bills',
    @Param('billId', ParseIntPipe) billId: number,
  ) {
    return this.txn.byBill(tenant, billTable, BigInt(billId));
  }

  // ── Create (Add New Payment) ──────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Add a new standalone payment',
    description:
      'Creates a new transaction entry not linked to a specific bill. ' +
      'txnFor=SALES → CREDIT (money received); txnFor=PURCHASE → DEBIT (money paid). ' +
      'Matches the "ADD NEW PAYMENT" modal on the /transactions page.',
  })
  @ApiResponse({ status: 201, description: 'Created transaction' })
  @ApiResponse({ status: 404, description: 'Party not found' })
  create(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.txn.create(tenant, user.userId, dto);
  }

  // ── Get one ───────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Full transaction record with allocations' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.txn.findOne(tenant, BigInt(id));
  }

  // ── Update ────────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({
    summary: 'Edit a transaction',
    description:
      'Updates paymentDate, paymentMode, amount, settlementAmount, or note. ' +
      'If the transaction has bill allocations, changing the amount automatically ' +
      'recalculates the linked bill\'s paidAmount, pendingAmount, and status.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Updated transaction' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.txn.update(tenant, BigInt(id), dto);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete a transaction',
    description:
      'Marks the transaction as deleted and reverses any bill payment allocations: ' +
      'the linked bill\'s paidAmount is reduced and its status reverts to UNPAID or PARTIAL.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.txn.remove(tenant, BigInt(id));
  }
}
