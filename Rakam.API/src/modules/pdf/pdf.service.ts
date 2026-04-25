import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../../common/constants';

@Injectable()
export class PdfService {
  constructor(@InjectQueue(QUEUES.PDF) private readonly pdfQueue: Queue) {}

  async enqueueSalesBillPdf(billId: bigint, firmId: bigint): Promise<{ jobId: string }> {
    const job = await this.pdfQueue.add('sales-bill', {
      kind: 'sales-bill',
      id: billId.toString(),
      firmId: firmId.toString(),
    });
    return { jobId: job.id! };
  }

  async enqueuePurchaseBillPdf(billId: bigint, firmId: bigint): Promise<{ jobId: string }> {
    const job = await this.pdfQueue.add('purchase-bill', {
      kind: 'purchase-bill',
      id: billId.toString(),
      firmId: firmId.toString(),
    });
    return { jobId: job.id! };
  }

  async enqueueDeliveryChallanPdf(dcId: bigint, firmId: bigint): Promise<{ jobId: string }> {
    const job = await this.pdfQueue.add('delivery-challan', {
      kind: 'delivery-challan',
      id: dcId.toString(),
      firmId: firmId.toString(),
    });
    return { jobId: job.id! };
  }
}
