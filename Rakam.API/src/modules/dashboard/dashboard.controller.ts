import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { DashboardService } from './dashboard.service';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';
import { GlobalSearchDto } from './dto/global-search.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  // ── KPI tiles ─────────────────────────────────────────────────────────────

  @Get('kpi')
  @ApiOperation({
    summary: 'KPI summary tiles',
    description:
      'Returns four aggregated totals for the Statistics Panel: ' +
      'sales (total + count), purchase (total + count), expense (total + count), income (total + count). ' +
      'Defaults to full FY when no date range is provided. Redis-cached 60 s per filter combination.',
  })
  @ApiResponse({
    status: 200,
    description:
      '{ sales: { total, count }, purchase: { total, count }, expense: { total, count }, income: { total, count } }',
  })
  kpi(@Tenant() tenant: TenantContext, @Query() dto: DashboardFiltersDto) {
    return this.dashboard.kpi(tenant, dto);
  }

  // ── Sales bar chart ───────────────────────────────────────────────────────

  @Get('sales-chart')
  @ApiOperation({
    summary: 'Party-wise sales bar chart data',
    description:
      'Returns up to 50 parties sorted by totalTurnOver descending. ' +
      'Each row: { partyId, partyName, totalTurnOver, receivedAmount, pendingAmount }. ' +
      'Maps to the blue / green / red bar chart on the Statistics Panel.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of { partyId, partyName, totalTurnOver, receivedAmount, pendingAmount }',
  })
  salesChart(@Tenant() tenant: TenantContext, @Query() dto: DashboardFiltersDto) {
    return this.dashboard.salesChart(tenant, dto);
  }

  // ── Purchase bar chart ────────────────────────────────────────────────────

  @Get('purchase-chart')
  @ApiOperation({
    summary: 'Party-wise purchase bar chart data',
    description:
      'Returns up to 50 suppliers sorted by totalTurnOver descending. ' +
      'Each row: { partyId, partyName, totalTurnOver, paidAmount, pendingAmount }. ' +
      'Maps to the blue / yellow / red bar chart on the Statistics Panel.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of { partyId, partyName, totalTurnOver, paidAmount, pendingAmount }',
  })
  purchaseChart(@Tenant() tenant: TenantContext, @Query() dto: DashboardFiltersDto) {
    return this.dashboard.purchaseChart(tenant, dto);
  }

  // ── Sales donut ───────────────────────────────────────────────────────────

  @Get('sales-donut')
  @ApiOperation({
    summary: 'Total Sales GST breakdown (donut chart)',
    description:
      'Returns { totalSales, withGst, withoutGst } for the Sales Donut chart. ' +
      'withGst = bills where applyGst=true; withoutGst = bills where applyGst=false.',
  })
  @ApiResponse({
    status: 200,
    description: '{ totalSales, withGst, withoutGst }',
  })
  salesDonut(@Tenant() tenant: TenantContext, @Query() dto: DashboardFiltersDto) {
    return this.dashboard.salesDonut(tenant, dto);
  }

  // ── Purchase donut ────────────────────────────────────────────────────────

  @Get('purchase-donut')
  @ApiOperation({
    summary: 'Total Purchase GST breakdown (donut chart)',
    description:
      'Returns { totalPurchase, withGst, withoutGst } for the Purchase Donut chart.',
  })
  @ApiResponse({
    status: 200,
    description: '{ totalPurchase, withGst, withoutGst }',
  })
  purchaseDonut(@Tenant() tenant: TenantContext, @Query() dto: DashboardFiltersDto) {
    return this.dashboard.purchaseDonut(tenant, dto);
  }

  // ── Global search ─────────────────────────────────────────────────────────

  @Get('search')
  @ApiOperation({
    summary: 'Global search across bills, parties and products',
    description:
      'Searches sales bills (by bill number or party name), purchase bills, ' +
      'parties (by name or GST number), and products (by name, item code or HSN code). ' +
      'Returns up to `limit` (default 5) hits per category. Not cached.',
  })
  @ApiResponse({
    status: 200,
    description: '{ salesBills[], purchaseBills[], parties[], products[] }',
  })
  search(@Tenant() tenant: TenantContext, @Query() dto: GlobalSearchDto) {
    return this.dashboard.search(tenant, dto);
  }
}
