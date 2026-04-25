import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListDeliveryChallansDto {
  @ApiPropertyOptional({ description: 'Records per page', minimum: 10, maximum: 100, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Keyset cursor: last dc_date for next page (ISO string)' })
  @IsOptional()
  @IsString()
  afterDate?: string;

  @ApiPropertyOptional({ description: 'Keyset cursor: last dc id for next page' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  afterId?: number;

  @ApiPropertyOptional({ description: 'Filter by party ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  partyId?: number;

  @ApiPropertyOptional({ description: 'Filter by converted status: true = converted, false = not yet converted' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  converted?: boolean;

  @ApiPropertyOptional({ description: 'From date filter (ISO date)' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date filter (ISO date)' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Search by DC number or party name' })
  @IsOptional()
  @IsString()
  search?: string;
}
