import { Controller } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdf: PdfService) {}
  // TODO: GET /pdf/jobs/:id → status + download URL for async generated PDFs
}
