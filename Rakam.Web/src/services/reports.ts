import { apiRequest } from "@/lib/api";
import type { ReportData, ReportFiltersDto } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export const reportsService = {
  getReport: (type: string, filters?: ReportFiltersDto): Promise<ReportData> =>
    apiRequest(`/reports${toQuery({ type, ...filters })}`),

  exportReport: async (
    type: string,
    format: "pdf" | "excel",
    filters?: ReportFiltersDto
  ): Promise<Blob> => {
    const { useAuthStore } = await import("@/store/useAuthStore");
    const { accessToken } = useAuthStore.getState();
    const { useAppStore } = await import("@/store/useAppStore");
    const { activeFirmId } = useAppStore.getState();

    const qs = toQuery({ type, format, ...filters });
    const res = await fetch(`${BASE_URL}/reports/export${qs}`, {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(activeFirmId ? { "x-firm-id": activeFirmId } : {}),
      },
    });

    if (!res.ok) throw new Error("Export failed");
    return res.blob();
  },
};
