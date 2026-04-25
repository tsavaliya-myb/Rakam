import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveGspCredentialsDto {
  @ApiProperty({ description: 'GSP portal username', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  gspUsername!: string;

  @ApiProperty({ description: 'GSP portal password (stored encrypted)' })
  @IsString()
  @IsNotEmpty()
  gspPassword!: string;
}
