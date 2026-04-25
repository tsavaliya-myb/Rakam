import { Module } from '@nestjs/common';
import { PurchaseBillsController } from './purchase-bills.controller';
import { PurchaseBillsService } from './purchase-bills.service';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  controllers: [PurchaseBillsController],
  providers: [PurchaseBillsService],
  exports: [PurchaseBillsService],
})
export class PurchaseBillsModule {}
