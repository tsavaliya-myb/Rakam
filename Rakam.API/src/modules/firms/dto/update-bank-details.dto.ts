import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBankDetailsDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankName?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  branchName?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  accountHolderName?: string;

  @ApiPropertyOptional({ maxLength: 40, description: 'e.g. Current / Savings' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  accountType?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  accountNo?: string;

  @ApiPropertyOptional({ maxLength: 11, description: 'IFSC code' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  ifscCode?: string;
}
