import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GstPct, Unit } from '@prisma/client';

export class CreateCreditNoteItemDto {
  @ApiPropertyOptional({ description: 'Product ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  productId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hsnCode?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  qty!: number;

  @ApiProperty({ enum: Unit })
  @IsEnum(Unit)
  unit!: Unit;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rate!: number;

  @ApiPropertyOptional({ enum: GstPct })
  @IsOptional()
  @IsEnum(GstPct)
  gstPct?: GstPct;
}

export class CreateCreditNoteDto {
  @ApiPropertyOptional({ description: 'Credit note date; defaults to today' })
  @IsOptional()
  @IsDateString()
  noteDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ type: [CreateCreditNoteItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCreditNoteItemDto)
  items!: CreateCreditNoteItemDto[];
}
