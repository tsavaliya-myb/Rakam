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
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsDto } from './dto/list-products.dto';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // ── List ─────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List products',
    description:
      'Alphabetically paginated list for the active firm. Supports free-text search on name, item code, and HSN code.',
  })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  list(@Tenant() tenant: TenantContext, @Query() dto: ListProductsDto) {
    return this.products.list(tenant, dto);
  }

  // ── Dropdown ─────────────────────────────────────────────────────────────

  @Get('dropdown')
  @ApiOperation({
    summary: 'Minimal product list for bill / challan form product pickers',
    description:
      'Returns id, name, rate, unit, gstPct, itemCode, hsnCode. Selecting a product in a bill form auto-fills these fields. Redis-cached per firm.',
  })
  @ApiResponse({ status: 200, description: 'Array of lightweight product objects' })
  dropdown(@Tenant() tenant: TenantContext) {
    return this.products.dropdown(tenant);
  }

  // ── Create ───────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse({ status: 201, description: 'Created product' })
  @ApiResponse({ status: 409, description: 'Duplicate product name in this firm' })
  create(@Tenant() tenant: TenantContext, @Body() dto: CreateProductDto) {
    return this.products.create(tenant, dto);
  }

  // ── Get one ──────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Full product record' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.products.findOne(tenant, BigInt(id));
  }

  // ── Update ───────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Updated product' })
  @ApiResponse({ status: 409, description: 'Duplicate product name' })
  update(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(tenant, BigInt(id), dto);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete a product',
    description: 'Blocked if the product has been used in any sales bill, purchase bill, or delivery challan.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 400, description: 'Product is in use' })
  remove(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.products.remove(tenant, BigInt(id));
  }
}
