"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QK } from "@/lib/query-keys";
import { settingsService } from "@/services/settings";
import { useAppStore } from "@/store/useAppStore";
import type { UpdateSettingsDto } from "@/types";

export function useSettings() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.settings(firmId!),
    queryFn: () => settingsService.getSettings(firmId!),
    enabled: !!firmId,
    staleTime: 300_000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({ section, dto }: { section: string; dto: UpdateSettingsDto }) =>
      settingsService.updateSettings(firmId!, section, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.settings(firmId!) });
      toast.success("Settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
