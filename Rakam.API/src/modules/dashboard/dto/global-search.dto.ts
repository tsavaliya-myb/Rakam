import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GlobalSearchDto {
  @ApiProperty({ description: 'Search term (min 2 chars)', minLength: 2 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  q!: string;

  @ApiPropertyOptional({ description: 'Max results per category', default: 5 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit?: number;
}
