import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOtherSettingsDto {
  @ApiPropertyOptional({ description: 'Enable inventory / stock management' })
  @IsOptional()
  @IsBoolean()
  enableInventory?: boolean;

  @ApiPropertyOptional({ description: 'Allow sales even when stock is zero' })
  @IsOptional()
  @IsBoolean()
  allowSalesWithoutStock?: boolean;

  @ApiPropertyOptional({ description: 'Enable keyboard shortcuts' })
  @IsOptional()
  @IsBoolean()
  enableShortcuts?: boolean;

  @ApiPropertyOptional({ description: 'Allow decimal values in qty/rate' })
  @IsOptional()
  @IsBoolean()
  enableDecimalValues?: boolean;

  @ApiPropertyOptional({ description: 'Enable per-party custom product rates' })
  @IsOptional()
  @IsBoolean()
  enablePartyWiseProductRate?: boolean;

  @ApiPropertyOptional({ description: 'Enable per-party shipment address' })
  @IsOptional()
  @IsBoolean()
  enableShipmentAddress?: boolean;
}
