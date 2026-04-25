import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PdfTemplate, PrintType } from '@prisma/client';

export class UpdateDeliveryChallanSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showRate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showGstNo?: boolean;

  @ApiPropertyOptional({ enum: PrintType })
  @IsOptional()
  @IsEnum(PrintType)
  defaultPrintType?: PrintType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showChallanSection?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

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
