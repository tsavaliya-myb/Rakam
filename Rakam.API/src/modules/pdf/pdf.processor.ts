import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUES } from '../../common/constants';

@Processor(QUEUES.PDF)
export class PdfProcessor extends WorkerHost {
  async process(job: Job): Promise<unknown> {
    // TODO: render HTML template (Standard/Modern) → Puppeteer → upload to S3 → return key
    return { jobId: job.id };
  }
}
