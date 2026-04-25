import { Controller } from '@nestjs/common';
import { EwayBillsService } from './eway-bills.service';

@Controller('eway-bills')
export class EwayBillsController {
  constructor(private readonly eway: EwayBillsService) {}
  // TODO: create E-Way bill from sales bill id, list, cancel, GSP credentials save
}
