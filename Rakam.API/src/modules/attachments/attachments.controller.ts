import { Controller } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}
  // TODO: presigned upload URL, finalize, delete; entities: purchase bill, expense, firm assets
}
