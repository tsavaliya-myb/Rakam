import { PartialType } from '@nestjs/swagger';
import { CreateSalesBillDto } from './create-sales-bill.dto';

export class UpdateSalesBillDto extends PartialType(CreateSalesBillDto) {}
