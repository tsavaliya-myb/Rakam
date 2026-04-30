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
  getDashboardStats: (filters?: DashboardFiltersDto): Promise<DashboardStats> =>
    apiRequest(`/dashboard/stats${toQuery(filters as Record<string, unknown>)}`),

  globalSearch: (query: string): Promise<GlobalSearchResult> =>
    apiRequest(`/dashboard/search${toQuery({ q: query })}`),
};
