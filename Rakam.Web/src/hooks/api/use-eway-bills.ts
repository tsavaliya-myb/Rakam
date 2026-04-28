"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QK } from "@/lib/query-keys";
import { ewayBillsService } from "@/services/eway-bills";
import { useAppStore } from "@/store/useAppStore";
import type { CreateEwayBillDto, ListEwayBillsDto, UpdateEwayBillDto } from "@/types";

export function useEwayBills(filters?: ListEwayBillsDto) {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.ewayBills(firmId!, filters),
    queryFn: () => ewayBillsService.getEwayBills(firmId!, filters),
    enabled: !!firmId,
    placeholderData: (prev) => prev,
  });
}

export function useEwayBill(id: string) {
  return useQuery({
    queryKey: QK.ewayBill(id),
    queryFn: () => ewayBillsService.getEwayBill(id),
    enabled: !!id,
  });
}

export function useCreateEwayBill() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: CreateEwayBillDto) => ewayBillsService.createEwayBill(firmId!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.ewayBills(firmId!) });
      toast.success("E-Way bill created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateEwayBill() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateEwayBillDto }) =>
      ewayBillsService.updateEwayBill(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.ewayBills(firmId!) });
      qc.invalidateQueries({ queryKey: QK.ewayBill(id) });
      toast.success("E-Way bill updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
