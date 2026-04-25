import { Module } from '@nestjs/common';
import { EwayBillsController } from './eway-bills.controller';
import { EwayBillsService } from './eway-bills.service';
import { GspAdapter } from './gsp.adapter';

@Module({
  controllers: [EwayBillsController],
  providers: [EwayBillsService, GspAdapter],
  exports: [EwayBillsService],
})
export class EwayBillsModule {}
