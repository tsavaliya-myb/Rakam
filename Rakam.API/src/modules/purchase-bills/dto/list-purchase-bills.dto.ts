import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillStatus, PurchaseBillType } from '@prisma/client';

export class ListPurchaseBillsDto {
  @ApiPropertyOptional({
    description: 'Filter by bill type tab',
    enum: ['all', 'WITH_TAX', 'WITHOUT_TAX'],
  })
  @IsOptional()
  @IsEnum(['all', 'WITH_TAX', 'WITHOUT_TAX'])
  tab?: 'all' | PurchaseBillType;

  @ApiPropertyOptional({ description: 'Records per page', minimum: 10, maximum: 100, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Keyset cursor: last bill_date for next page (ISO string)' })
  @IsOptional()
  @IsString()
  afterDate?: string;

  @ApiPropertyOptional({ description: 'Keyset cursor: last bill id for next page' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  afterId?: number;

  @ApiPropertyOptional({ description: 'Filter by party ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  partyId?: number;

  @ApiPropertyOptional({ description: 'Filter by payment status', enum: BillStatus })
  @IsOptional()
  @IsEnum(BillStatus)
  status?: BillStatus;

  @ApiPropertyOptional({ description: 'From date filter (ISO date)' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date filter (ISO date)' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Search by bill number or party name' })
  @IsOptional()
  @IsString()
  search?: string;
}
