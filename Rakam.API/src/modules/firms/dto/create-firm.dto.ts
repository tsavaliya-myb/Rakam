import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GstPct } from '@prisma/client';

export class CreateFirmDto {
  @ApiProperty({ description: 'Firm name', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ description: 'Owner / proprietor name', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ownerName?: string;

  @ApiPropertyOptional({ description: '15-char GSTIN' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9A-Z]{15}$/, { message: 'gstNo must be a valid 15-character GSTIN' })
  gstNo?: string;

  @ApiPropertyOptional({ description: '10-char PAN' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, { message: 'panNo must be a valid PAN' })
  panNo?: string;

  @ApiPropertyOptional({ description: 'MSME registration number', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  msmeNo?: string;

  @ApiPropertyOptional({ enum: GstPct, description: 'Default GST percentage for the firm' })
  @IsOptional()
  @IsEnum(GstPct)
  defaultGstPct?: GstPct;

  @ApiPropertyOptional({ description: 'Primary mobile number', maxLength: 15 })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  mobilePrimary?: string;

  @ApiPropertyOptional({ description: 'Secondary mobile number', maxLength: 15 })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  mobileSecondary?: string;

  @ApiPropertyOptional({ description: 'Full business address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'State name', maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  state?: string;

  @ApiPropertyOptional({ description: 'City name', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ description: 'Pincode', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pincode?: string;
}
