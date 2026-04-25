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
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { AuthenticatedUser } from '../../common/interfaces/tenant-context.interface';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ListExpensesDto } from './dto/list-expenses.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { CreateExpenseSupplierDto } from './dto/create-expense-supplier.dto';
import { CreateExpenseItemDto } from './dto/create-expense-item.dto';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  // ── Categories ───────────────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'List expense categories (lazy-seeds 8 defaults on first access)' })
  @ApiResponse({ status: 200, description: 'Array of categories' })
  listCategories(@Tenant() tenant: TenantContext) {
    return this.expenses.listCategories(tenant);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a custom expense category' })
  @ApiResponse({ status: 201, description: 'Created category' })
  @ApiResponse({ status: 409, description: 'Duplicate category name' })
  createCategory(@Tenant() tenant: TenantContext, @Body() dto: CreateExpenseCategoryDto) {
    return this.expenses.createCategory(tenant, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a custom expense category' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 400, description: 'Default category or in use' })
  deleteCategory(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expenses.deleteCategory(tenant, BigInt(id));
  }

  // ── Suppliers ────────────────────────────────────────────────────────────

  @Get('suppliers')
  @ApiOperation({ summary: 'List expense suppliers' })
  @ApiResponse({ status: 200, description: 'Array of suppliers' })
  listSuppliers(@Tenant() tenant: TenantContext) {
    return this.expenses.listSuppliers(tenant);
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Create an expense supplier' })
  @ApiResponse({ status: 201, description: 'Created supplier' })
  @ApiResponse({ status: 409, description: 'Duplicate supplier name' })
  createSupplier(@Tenant() tenant: TenantContext, @Body() dto: CreateExpenseSupplierDto) {
    return this.expenses.createSupplier(tenant, dto);
  }

  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an expense supplier' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 400, description: 'Supplier is in use' })
  deleteSupplier(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expenses.deleteSupplier(tenant, BigInt(id));
  }

  // ── Items ────────────────────────────────────────────────────────────────

  @Get('items')
  @ApiOperation({ summary: 'List expense items (for ITEM mode line-item picker)' })
  @ApiResponse({ status: 200, description: 'Array of items' })
  listItems(@Tenant() tenant: TenantContext) {
    return this.expenses.listItems(tenant);
  }

  @Post('items')
  @ApiOperation({ summary: 'Create an expense item' })
  @ApiResponse({ status: 201, description: 'Created item' })
  @ApiResponse({ status: 409, description: 'Duplicate item name' })
  createItem(@Tenant() tenant: TenantContext, @Body() dto: CreateExpenseItemDto) {
    return this.expenses.createItem(tenant, dto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an expense item' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 400, description: 'Item is in use' })
  deleteItem(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expenses.deleteItem(tenant, BigInt(id));
  }

  // ── Expenses ─────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List expenses',
    description: 'Date-descending keyset paginated list. Filter by category, supplier, or date range.',
  })
  @ApiResponse({ status: 200, description: 'Paginated expense list' })
  list(@Tenant() tenant: TenantContext, @Query() dto: ListExpensesDto) {
    return this.expenses.list(tenant, dto);
  }

  @Post()
  @ApiOperation({
    summary: 'Create an expense',
    description:
      'Supports AMOUNT mode (single amount field) and ITEM mode (line-item breakdown). ' +
      'Optional inline payment creates a DEBIT transaction in the same DB transaction.',
  })
  @ApiResponse({ status: 201, description: 'Created expense' })
  create(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expenses.create(tenant, user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expense by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Full expense record with line items' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expenses.findOne(tenant, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an expense',
    description: 'For ITEM mode, providing `items` replaces all existing line items.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Updated expense' })
  update(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenses.update(tenant, BigInt(id), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete an expense' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  remove(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expenses.remove(tenant, BigInt(id));
  }
}
