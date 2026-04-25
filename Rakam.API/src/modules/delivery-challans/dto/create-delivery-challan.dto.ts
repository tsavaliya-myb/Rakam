import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Unit } from '@prisma/client';

export class CreateDcItemDto {
  @ApiPropertyOptional({ description: 'Product ID from Product Master' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  productId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hsnCode?: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  qty!: number;

  @ApiProperty({ enum: Unit })
  @IsEnum(Unit)
  unit!: Unit;

  @ApiProperty({ description: 'Rate per unit (₹)' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rate!: number;
}

export class CreateDeliveryChallanDto {
  @ApiProperty({ description: 'Party ID' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  partyId!: number;

  @ApiPropertyOptional({ description: 'D. Ch. date ISO string; defaults to today' })
  @IsOptional()
  @IsDateString()
  dcDate?: string;

  @ApiPropertyOptional({ description: 'When true, party challan reference fields are hidden/skipped' })
  @IsOptional()
  @IsBoolean()
  noChallan?: boolean;

  @ApiPropertyOptional({ description: 'Customer\'s own challan number' })
  @IsOptional()
  @IsString()
  partyChallanNo?: string;

  @ApiPropertyOptional({ description: 'Customer\'s challan date ISO string' })
  @IsOptional()
  @IsDateString()
  partyChallanDate?: string;

  @ApiPropertyOptional({ description: 'Remarks (max 200 chars)' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ type: [CreateDcItemDto], description: 'At least one line item required' })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateDcItemDto)
  items!: CreateDcItemDto[];
}
