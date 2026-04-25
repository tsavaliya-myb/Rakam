import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Shared DTO for expense/income categories, suppliers, and expense items. */
export class UpsertMasterItemDto {
  @ApiProperty({ description: 'Item name', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
