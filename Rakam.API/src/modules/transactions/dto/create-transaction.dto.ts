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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMode, TxnFor } from '@prisma/client';

export class CreateTransactionDto {
  @ApiPropertyOptional({ description: 'Payment date ISO string; defaults to today' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({
    enum: [TxnFor.SALES, TxnFor.PURCHASE],
    description: 'Transaction category: SALES (credit) or PURCHASE (debit)',
  })
  @IsEnum(TxnFor)
  txnFor!: TxnFor;

  @ApiPropertyOptional({ description: 'Party ID (numeric string)' })
  @IsOptional()
  @IsString()
  partyId?: string;

  @ApiProperty({ enum: PaymentMode, description: 'Mode of payment' })
  @IsEnum(PaymentMode)
  paymentMode!: PaymentMode;

  @ApiProperty({ description: 'Payment amount (₹)', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({ description: 'Optional notes (max 250 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  note?: string;
}
