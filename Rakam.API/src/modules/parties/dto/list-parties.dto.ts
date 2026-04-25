import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListPartiesDto {
  @ApiPropertyOptional({ description: 'Records per page', minimum: 10, maximum: 100, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Keyset cursor: last party name (for alphabetical pagination)' })
  @IsOptional()
  @IsString()
  afterName?: string;

  @ApiPropertyOptional({ description: 'Keyset cursor: last party id' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  afterId?: number;

  @ApiPropertyOptional({ description: 'Search by party name or GST number' })
  @IsOptional()
  @IsString()
  search?: string;
}
