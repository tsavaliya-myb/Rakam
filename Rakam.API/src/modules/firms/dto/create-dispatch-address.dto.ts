import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDispatchAddressDto {
  @ApiProperty({ description: 'Dispatch point name / label', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  dispatchName!: string;

  @ApiProperty({ description: 'Full address' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiProperty({ maxLength: 60 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  state!: string;

  @ApiPropertyOptional({ maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pincode?: string;
}
