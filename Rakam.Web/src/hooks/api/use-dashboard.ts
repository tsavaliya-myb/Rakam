"use client";

import { useQuery } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import { dashboardService } from "@/services/dashboard";
import { useAppStore } from "@/store/useAppStore";
import type { DashboardFiltersDto } from "@/types";

export function useDashboardStats(filters?: DashboardFiltersDto) {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.dashboard(firmId!, filters),
    queryFn: () => dashboardService.getDashboardStats(firmId!, filters),
    enabled: !!firmId,
    staleTime: 60_000,
  });
}

export function useGlobalSearch(query: string) {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: ["dashboard", firmId, "search", query],
    queryFn: () => dashboardService.globalSearch(firmId!, query),
    enabled: !!firmId && query.length >= 2,
    staleTime: 0,
  });
}
