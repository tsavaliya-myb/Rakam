import { PartialType } from '@nestjs/swagger';
import { CreateFirmDto } from './create-firm.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFirmDto extends PartialType(CreateFirmDto) {
  @ApiPropertyOptional({ description: 'S3 key for firm logo' })
  @IsOptional()
  @IsString()
  logoKey?: string;

  @ApiPropertyOptional({ description: 'S3 key for watermark image' })
  @IsOptional()
  @IsString()
  watermarkKey?: string;

  @ApiPropertyOptional({ description: 'S3 key for signature image' })
  @IsOptional()
  @IsString()
  signatureKey?: string;

  @ApiPropertyOptional({ description: 'S3 key for Udhyam certificate' })
  @IsOptional()
  @IsString()
  udhyamCertKey?: string;
}
