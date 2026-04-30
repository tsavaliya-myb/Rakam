"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { QK } from "@/lib/query-keys";
import { reportsService } from "@/services/reports";
import { useAppStore } from "@/store/useAppStore";
import type { ReportFiltersDto } from "@/types";

export function useReport(type: string, filters?: ReportFiltersDto) {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.reports(firmId!, type, filters),
    queryFn: () => reportsService.getReport(type, filters),
    enabled: !!firmId && !!type,
  });
}

export function useExportReport() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({
      type,
      format,
      filters,
    }: {
      type: string;
      format: "pdf" | "excel";
      filters?: ReportFiltersDto;
    }) => reportsService.exportReport(type, format, filters),
    onSuccess: (blob, { type, format }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report.${format === "excel" ? "xlsx" : "pdf"}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
