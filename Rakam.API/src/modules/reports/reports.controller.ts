import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { TenantContext } from '../../common/interfaces/tenant-context.interface';
import { ReportsService } from './reports.service';
import { ReportQueryDto, ReportType } from './dto/report-query.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'Generate a report',
    description:
      'Runs one of the 22 report types for the current firm/FY. ' +
      'Results are cached in Redis for 10 minutes per filter combination. ' +
      '\n\n**Report types:** ' + Object.values(ReportType).join(', '),
  })
  @ApiResponse({
    status: 200,
    description:
      'Report payload. Shape varies by type: most return { type, count, rows[] }. ' +
      'PROFIT_AND_LOSS returns a summary object. Outstanding reports add overdueDays per row.',
  })
  generate(@Tenant() tenant: TenantContext, @Query() dto: ReportQueryDto) {
    return this.reports.generate(tenant, dto);
  }
}
