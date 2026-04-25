import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GstPct, Unit } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ description: 'Default selling / purchase rate (₹)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rate?: number;

  @ApiProperty({ enum: Unit, description: 'Unit of measurement' })
  @IsEnum(Unit)
  unit!: Unit;

  @ApiPropertyOptional({ enum: GstPct, description: 'Default GST % for this product' })
  @IsOptional()
  @IsEnum(GstPct)
  gstPct?: GstPct;

  @ApiPropertyOptional({ description: 'Internal item / SKU code' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  itemCode?: string;

  @ApiPropertyOptional({ description: 'HSN code (Harmonised System of Nomenclature)' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  hsnCode?: string;

  @ApiPropertyOptional({ description: 'Product description (max 250 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string;
}
