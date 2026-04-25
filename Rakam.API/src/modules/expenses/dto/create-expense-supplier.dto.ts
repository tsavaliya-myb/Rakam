import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseSupplierDto {
  @ApiProperty({ description: 'Supplier name (max 120 chars)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
