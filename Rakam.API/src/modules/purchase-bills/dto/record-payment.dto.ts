import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMode } from '@prisma/client';

export class RecordPurchasePaymentDto {
  @ApiPropertyOptional({ description: 'Payment date ISO string; defaults to today' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({ description: 'Amount being paid (₹)' })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  transactionAmount!: number;

  @ApiProperty({ enum: PaymentMode, description: 'Mode of payment' })
  @IsEnum(PaymentMode)
  paymentMode!: PaymentMode;

  @ApiPropertyOptional({ description: 'Optional settlement/adjustment amount (₹)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  settlementAmount?: number;

  @ApiPropertyOptional({ description: 'Note e.g. cheque number, UPI ref' })
  @IsOptional()
  @IsString()
  note?: string;
}
