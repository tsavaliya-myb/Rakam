import { IsDateString, IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListExpensesDto {
  @ApiPropertyOptional({ description: 'Records per page', minimum: 10, maximum: 100, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Keyset cursor: last expense date (ISO)' })
  @IsOptional()
  @IsDateString()
  afterDate?: string;

  @ApiPropertyOptional({ description: 'Keyset cursor: last expense ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  afterId?: number;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Filter by supplier ID' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  supplierId?: number;

  @ApiPropertyOptional({ description: 'Start date filter (ISO string, inclusive)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (ISO string, inclusive)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
