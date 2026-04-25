import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMode, TxnFor, TxnType } from '@prisma/client';

export class ListTransactionsDto {
  @ApiPropertyOptional({ description: 'Number of records per page', default: 20 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Keyset cursor: last seen transaction ID' })
  @IsOptional()
  @IsString()
  afterId?: string;

  @ApiPropertyOptional({ description: 'Filter by party ID' })
  @IsOptional()
  @IsString()
  partyId?: string;

  @ApiPropertyOptional({ enum: TxnType, description: 'Filter by DEBIT or CREDIT' })
  @IsOptional()
  @IsEnum(TxnType)
  txnType?: TxnType;

  @ApiPropertyOptional({ enum: TxnFor, description: 'Filter by transaction category' })
  @IsOptional()
  @IsEnum(TxnFor)
  txnFor?: TxnFor;

  @ApiPropertyOptional({ enum: PaymentMode, description: 'Filter by payment mode' })
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @ApiPropertyOptional({ description: 'Filter from date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
