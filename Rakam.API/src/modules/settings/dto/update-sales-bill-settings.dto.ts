import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountScope, PdfTemplate, PrintType } from '@prisma/client';

export class UpdateSalesBillSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showDueDetailsInInvoice?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showGstInJobChallan?: boolean;

  @ApiPropertyOptional({ enum: PrintType })
  @IsOptional()
  @IsEnum(PrintType)
  defaultPrintType?: PrintType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showChallanSection?: boolean;

  @ApiPropertyOptional({ maxLength: 20, description: 'Label for bill number field' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  billNoLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showLossProductOption?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showDeliveryToSalesOption?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showWithholdingTax?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enableDirectPayment?: boolean;

  @ApiPropertyOptional({ enum: DiscountScope })
  @IsOptional()
  @IsEnum(DiscountScope)
  discountScope?: DiscountScope;

  @ApiPropertyOptional({ enum: DiscountScope })
  @IsOptional()
  @IsEnum(DiscountScope)
  gstScope?: DiscountScope;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  billPrefix?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  jobChallanTitle?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxInvoiceTitle?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  pdfCustomHeading?: string;

  @ApiPropertyOptional({ enum: PdfTemplate })
  @IsOptional()
  @IsEnum(PdfTemplate)
  pdfTemplate?: PdfTemplate;
}
