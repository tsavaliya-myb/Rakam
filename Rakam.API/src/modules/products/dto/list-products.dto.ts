import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListProductsDto {
  @ApiPropertyOptional({ description: 'Records per page', minimum: 10, maximum: 100, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Keyset cursor: last product name (alphabetical pagination)' })
  @IsOptional()
  @IsString()
  afterName?: string;

  @ApiPropertyOptional({ description: 'Keyset cursor: last product id' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  afterId?: number;

  @ApiPropertyOptional({ description: 'Search by name, item code, or HSN code' })
  @IsOptional()
  @IsString()
  search?: string;
}
