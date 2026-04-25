import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMode } from '@prisma/client';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ description: 'Payment date ISO string' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ enum: PaymentMode })
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @ApiPropertyOptional({ description: 'Updated payment amount (₹)', minimum: 0.01 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ description: 'Settlement / adjustment amount (₹)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  settlementAmount?: number;

  @ApiPropertyOptional({ description: 'Notes (max 250 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  note?: string;
}
