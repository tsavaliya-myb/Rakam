import { apiRequest, uploadFile } from "@/lib/api";
import type { Attachment } from "@/types";

export const attachmentsService = {
  uploadFile: (firmId: string, file: File, entityType: string, entityId: string): Promise<Attachment> =>
    uploadFile<Attachment>("/attachments", file, { firmId, entityType, entityId }),

  deleteFile: (id: string): Promise<void> =>
    apiRequest(`/attachments/${id}`, { method: "DELETE" }),
};
