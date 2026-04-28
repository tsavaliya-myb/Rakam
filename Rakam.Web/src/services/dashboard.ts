import { apiRequest } from "@/lib/api";
import type { DashboardStats, DashboardFiltersDto, GlobalSearchResult } from "@/types";

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export const dashboardService = {
  getDashboardStats: (firmId: string, filters?: DashboardFiltersDto): Promise<DashboardStats> =>
    apiRequest(`/dashboard/stats${toQuery({ firmId, ...filters })}`),

  globalSearch: (firmId: string, query: string): Promise<GlobalSearchResult> =>
    apiRequest(`/dashboard/search${toQuery({ firmId, q: query })}`),
};
