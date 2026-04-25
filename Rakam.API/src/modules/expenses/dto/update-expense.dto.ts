import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseMode } from '@prisma/client';
import { CreateExpenseLineItemDto } from './create-expense.dto';

export class UpdateExpenseDto {
  @ApiPropertyOptional({ description: 'Expense date (ISO string)' })
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @ApiPropertyOptional({ description: 'Expense category ID' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  supplierId?: number;

  @ApiPropertyOptional({ description: 'Total amount (₹) — only for AMOUNT mode' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ description: 'Note (max 200 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;

  @ApiPropertyOptional({ description: 'S3 key of uploaded attachment' })
  @IsOptional()
  @IsString()
  attachmentKey?: string;

  @ApiPropertyOptional({
    type: [CreateExpenseLineItemDto],
    description: 'Replacement line items — only for ITEM mode; replaces all existing items',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseLineItemDto)
  items?: CreateExpenseLineItemDto[];
}
