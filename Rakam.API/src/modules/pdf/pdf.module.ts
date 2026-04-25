import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { PdfProcessor } from './pdf.processor';
import { QueueModule } from '../../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [PdfController],
  providers: [PdfService, PdfProcessor],
  exports: [PdfService],
})
export class PdfModule {}
