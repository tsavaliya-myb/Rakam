import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseMode, PaymentMode } from '@prisma/client';

export class CreateExpenseLineItemDto {
  @ApiProperty({ description: 'Expense item ID (from ExpenseItems master)' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  itemId!: number;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  qty!: number;

  @ApiProperty({ description: 'Rate per unit (₹)' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rate!: number;
}

export class InlinePaymentDto {
  @ApiPropertyOptional({ description: 'Payment date ISO string; defaults to today' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({ description: 'Amount paid (₹)' })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount!: number;

  @ApiProperty({ enum: PaymentMode })
  @IsEnum(PaymentMode)
  paymentMode!: PaymentMode;

  @ApiPropertyOptional({ description: 'Note e.g. cheque number, UPI ref' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  note?: string;
}

export class CreateExpenseDto {
  @ApiProperty({ enum: ExpenseMode, description: 'AMOUNT for a lump-sum expense, ITEM for line-item breakdown' })
  @IsEnum(ExpenseMode)
  mode!: ExpenseMode;

  @ApiProperty({ description: 'Expense date (ISO string); defaults to today' })
  @IsDateString()
  expenseDate!: string;

  @ApiProperty({ description: 'Expense category ID' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  categoryId!: number;

  @ApiPropertyOptional({ description: 'Supplier ID (optional)' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  supplierId?: number;

  @ApiPropertyOptional({ description: 'Total amount (₹) — required for AMOUNT mode; auto-computed for ITEM mode' })
  @ValidateIf((o: CreateExpenseDto) => o.mode === ExpenseMode.AMOUNT)
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ description: 'Note (max 200 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;

  @ApiPropertyOptional({ description: 'S3 key of uploaded attachment (Image / PDF)' })
  @IsOptional()
  @IsString()
  attachmentKey?: string;

  @ApiPropertyOptional({
    type: [CreateExpenseLineItemDto],
    description: 'Line items — required for ITEM mode',
  })
  @ValidateIf((o: CreateExpenseDto) => o.mode === ExpenseMode.ITEM)
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseLineItemDto)
  items?: CreateExpenseLineItemDto[];

  @ApiPropertyOptional({ description: 'Optional inline payment recorded at the same time as the expense' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InlinePaymentDto)
  payment?: InlinePaymentDto;
}
