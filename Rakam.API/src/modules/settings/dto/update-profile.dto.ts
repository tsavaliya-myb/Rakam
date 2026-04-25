import { IsArray, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Contact mobile number', maxLength: 15 })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Business type tags (multi-select)', isArray: true, type: String })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  businessTypes?: string[];

  @ApiPropertyOptional({ description: 'S3 key for profile photo' })
  @IsOptional()
  @IsString()
  profilePhotoKey?: string;
}
