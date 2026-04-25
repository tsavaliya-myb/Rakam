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
import { PartiesService } from './parties.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { ListPartiesDto } from './dto/list-parties.dto';

@ApiTags('Parties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('parties')
export class PartiesController {
  constructor(private readonly parties: PartiesService) {}

  // ── List ─────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List parties',
    description:
      'Alphabetically paginated list of parties for the active firm. Supports free-text search on name and GST number. Each row includes the cached balance (positive = we receive, negative = we pay).',
  })
  @ApiResponse({ status: 200, description: 'Paginated party list with balance column' })
  list(@Tenant() tenant: TenantContext, @Query() dto: ListPartiesDto) {
    return this.parties.list(tenant, dto);
  }

  // ── Dropdown ─────────────────────────────────────────────────────────────

  @Get('dropdown')
  @ApiOperation({
    summary: 'Minimal party list for bill / challan / payment form dropdowns',
    description: 'Returns id, name, gstNo, state, defaultDiscountPct, defaultDueDays, brokerName, brokerMobile. Redis-cached per firm.',
  })
  @ApiResponse({ status: 200, description: 'Array of lightweight party objects' })
  dropdown(@Tenant() tenant: TenantContext) {
    return this.parties.dropdown(tenant);
  }

  // ── Create ───────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a party (customer or supplier)' })
  @ApiResponse({ status: 201, description: 'Created party' })
  @ApiResponse({ status: 409, description: 'Duplicate party name in this firm' })
  create(@Tenant() tenant: TenantContext, @Body() dto: CreatePartyDto) {
    return this.parties.create(tenant, dto);
  }

  // ── Get one ──────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a party by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Full party record' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.parties.findOne(tenant, BigInt(id));
  }

  // ── Update ───────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update a party' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Updated party' })
  @ApiResponse({ status: 409, description: 'Duplicate party name' })
  update(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePartyDto,
  ) {
    return this.parties.update(tenant, BigInt(id), dto);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete a party',
    description: 'Blocked if any sales or purchase bills exist for this party.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 400, description: 'Party has associated bills' })
  remove(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.parties.remove(tenant, BigInt(id));
  }

  // ── Balance ───────────────────────────────────────────────────────────────

  @Get(':id/balance')
  @ApiOperation({
    summary: 'Get live outstanding balance for a party',
    description:
      'Computes sales pending minus purchase pending for the active FY, updates balanceCached on the party row, and returns the breakdown. Positive = we receive, negative = we pay.',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: '{ partyId, name, salesPending, purchasePending, balance, direction }' })
  getBalance(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.parties.getBalance(tenant, BigInt(id));
  }
}
