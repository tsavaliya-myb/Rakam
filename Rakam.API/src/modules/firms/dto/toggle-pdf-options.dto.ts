import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TogglePdfOptionsDto {
  @ApiPropertyOptional({ description: 'Show watermark on PDFs' })
  @IsOptional()
  @IsBoolean()
  showWatermark?: boolean;

  @ApiPropertyOptional({ description: 'Show logo on PDFs' })
  @IsOptional()
  @IsBoolean()
  showLogo?: boolean;

  @ApiPropertyOptional({ description: 'Show signature on PDFs' })
  @IsOptional()
  @IsBoolean()
  showSignature?: boolean;
}
