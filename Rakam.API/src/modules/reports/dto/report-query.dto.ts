import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  PAYMENT                    = 'PAYMENT',
  TRANSACTION                = 'TRANSACTION',
  PRODUCT                    = 'PRODUCT',
  EXPENSE                    = 'EXPENSE',
  INCOME                     = 'INCOME',
  PURCHASE_BILL_WITH_GST     = 'PURCHASE_BILL_WITH_GST',
  PURCHASE_BILL_WITHOUT_GST  = 'PURCHASE_BILL_WITHOUT_GST',
  SALES_BILL_WITH_GST        = 'SALES_BILL_WITH_GST',
  SALES_BILL_WITHOUT_GST     = 'SALES_BILL_WITHOUT_GST',
  TDS_PAYABLE                = 'TDS_PAYABLE',
  TDS_RECEIVABLE             = 'TDS_RECEIVABLE',
  TCS_PAYABLE                = 'TCS_PAYABLE',
  TCS_RECEIVABLE             = 'TCS_RECEIVABLE',
  SALES_BILL_ITEMS_GST       = 'SALES_BILL_ITEMS_GST',
  SALES_BILL_ITEMS_WITHOUT_GST = 'SALES_BILL_ITEMS_WITHOUT_GST',
  PURCHASE_BILL_ITEMS_GST    = 'PURCHASE_BILL_ITEMS_GST',
  PURCHASE_BILL_ITEMS_WITHOUT_GST = 'PURCHASE_BILL_ITEMS_WITHOUT_GST',
  SALES_OUTSTANDING          = 'SALES_OUTSTANDING',
  PURCHASE_OUTSTANDING       = 'PURCHASE_OUTSTANDING',
  DELIVERY_CHALLAN           = 'DELIVERY_CHALLAN',
  CREDIT_NOTE                = 'CREDIT_NOTE',
  PROFIT_AND_LOSS            = 'PROFIT_AND_LOSS',
}

export class ReportQueryDto {
  @ApiProperty({ enum: ReportType, description: 'Which of the 22 report types to generate' })
  @IsEnum(ReportType)
  type!: ReportType;

  @ApiPropertyOptional({ description: 'Filter by party ID (numeric string)' })
  @IsOptional()
  @IsString()
  partyId?: string;

  @ApiPropertyOptional({ description: 'Start date ISO string (defaults to FY start)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date ISO string (defaults to FY end)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
