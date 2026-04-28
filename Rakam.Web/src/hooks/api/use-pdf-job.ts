"use client";

import { useQuery } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import { pdfService } from "@/services/pdf";
import type { PdfJob } from "@/types";

export function usePdfJob(jobId: string | null) {
  return useQuery({
    queryKey: QK.pdfJob(jobId!),
    queryFn: () => pdfService.getPdfJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data as PdfJob | undefined;
      if (!data) return 2000;
      return data.status === "done" || data.status === "failed" ? false : 2000;
    },
  });
}
