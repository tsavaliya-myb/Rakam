import { Module } from '@nestjs/common';
import { SalesBillsController } from './sales-bills.controller';
import { SalesBillsService } from './sales-bills.service';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  controllers: [SalesBillsController],
  providers: [SalesBillsService],
  exports: [SalesBillsService],
})
export class SalesBillsModule {}
