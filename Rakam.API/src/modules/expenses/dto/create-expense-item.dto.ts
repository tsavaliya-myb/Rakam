import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseItemDto {
  @ApiProperty({ description: 'Expense item name (max 120 chars)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
