import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PdfTemplate } from '@prisma/client';

export class UpdatePurchaseBillSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showWithholdingTax?: boolean;

  @ApiPropertyOptional({ enum: PdfTemplate })
  @IsOptional()
  @IsEnum(PdfTemplate)
  pdfTemplate?: PdfTemplate;
}
