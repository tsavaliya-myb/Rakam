import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePartyDto {
  @ApiProperty({ description: 'Party / company name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ description: 'Owner / contact person name' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  ownerName?: string;

  @ApiPropertyOptional({ description: '15-character GSTIN' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Matches(/^[0-9A-Z]{15}$/, { message: 'GST number must be a valid 15-character GSTIN' })
  gstNo?: string;

  @ApiPropertyOptional({ description: '10-character PAN' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, { message: 'PAN must be a valid 10-character PAN' })
  panNo?: string;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'State name' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  state?: string;

  @ApiPropertyOptional({ description: 'City name' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ description: 'Pincode' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pincode?: string;

  @ApiPropertyOptional({ description: 'Mobile / contact number' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  contactNumber?: string;

  @ApiPropertyOptional({ description: 'Default discount % applied to bills for this party', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  defaultDiscountPct?: number;

  @ApiPropertyOptional({ description: 'Default payment due days', default: 45 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  defaultDueDays?: number;

  @ApiPropertyOptional({ description: 'Broker name' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brokerName?: string;

  @ApiPropertyOptional({ description: 'Broker mobile number' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  brokerMobile?: string;
}
