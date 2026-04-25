import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],   // exported so SalesBillsModule / PurchaseBillsModule can inject it if needed
})
export class TransactionsModule {}
