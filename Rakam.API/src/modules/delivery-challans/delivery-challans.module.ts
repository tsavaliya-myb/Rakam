import { Module } from '@nestjs/common';
import { DeliveryChallansController } from './delivery-challans.controller';
import { DeliveryChallansService } from './delivery-challans.service';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  controllers: [DeliveryChallansController],
  providers: [DeliveryChallansService],
  exports: [DeliveryChallansService],
})
export class DeliveryChallansModule {}
