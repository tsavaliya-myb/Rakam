import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseCategoryDto {
  @ApiProperty({ description: 'Category name (max 80 chars)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;
}
