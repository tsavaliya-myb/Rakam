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
import { GstPct, PurchaseBillType, Unit } from '@prisma/client';

export class CreatePurchaseBillItemDto {
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

  @ApiPropertyOptional({ description: 'Item-level discount %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountPct?: number;

  @ApiPropertyOptional({ enum: GstPct, description: 'Item-level GST %' })
  @IsOptional()
  @IsEnum(GstPct)
  gstPct?: GstPct;
}

export class CreatePurchaseBillDto {
  @ApiProperty({ description: 'Party ID (supplier)' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  partyId!: number;

  @ApiProperty({ enum: PurchaseBillType, description: 'WITH_TAX or WITHOUT_TAX' })
  @IsEnum(PurchaseBillType)
  billType!: PurchaseBillType;

  @ApiProperty({ description: 'Supplier bill number (manual)' })
  @IsString()
  @IsNotEmpty()
  billNo!: string;

  @ApiPropertyOptional({ description: 'Bill date ISO string; defaults to today' })
  @IsOptional()
  @IsDateString()
  billDate?: string;

  @ApiPropertyOptional({ description: 'Days until payment due' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  dueDays?: number;

  @ApiPropertyOptional({ description: 'Override due date ISO string' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Apply GST to this bill' })
  @IsOptional()
  @IsBoolean()
  applyGst?: boolean;

  @ApiPropertyOptional({ description: 'Remarks (max 200 chars)' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ type: [CreatePurchaseBillItemDto], description: 'At least one line item required' })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseBillItemDto)
  items!: CreatePurchaseBillItemDto[];
}
