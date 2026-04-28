import { apiRequest } from "@/lib/api";
import type { PdfJob } from "@/types";

export const pdfService = {
  getPdfJobStatus: (jobId: string): Promise<PdfJob> =>
    apiRequest(`/pdf/jobs/${jobId}`),
};
