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
import { BillType, GstPct, Unit } from '@prisma/client';

export class CreateBillItemDto {
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

  @ApiPropertyOptional({ description: 'Mark as loss/adjustment product' })
  @IsOptional()
  @IsBoolean()
  isLossProduct?: boolean;
}

export class CreateBillChallanDto {
  @ApiPropertyOptional({ description: 'When true, party challan fields are hidden' })
  @IsOptional()
  @IsBoolean()
  noChallan?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  challanNumber?: string;

  @ApiPropertyOptional({ description: 'ISO date string (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  challanDate?: string;

  @ApiPropertyOptional({ description: 'Link to existing Delivery Challan ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  deliveryChallanId?: number;

  @ApiProperty({ type: [CreateBillItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBillItemDto)
  items!: CreateBillItemDto[];
}

export class CreateSalesBillDto {
  @ApiProperty({ description: 'Party ID (customer)' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  partyId!: number;

  @ApiProperty({ enum: BillType })
  @IsEnum(BillType)
  billType!: BillType;

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

  @ApiPropertyOptional({ description: 'Bill-level discount %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountPct?: number;

  @ApiPropertyOptional({ description: 'Remarks / notes' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ type: [CreateBillChallanDto], description: 'At least one challan with items required' })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateBillChallanDto)
  challans!: CreateBillChallanDto[];
}
