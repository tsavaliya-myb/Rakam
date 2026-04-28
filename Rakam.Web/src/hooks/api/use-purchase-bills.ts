"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QK } from "@/lib/query-keys";
import { purchaseBillsService } from "@/services/purchase-bills";
import { useAppStore } from "@/store/useAppStore";
import type {
  CreatePurchaseBillDto,
  ListPurchaseBillsDto,
  PurchaseBill,
  RecordPaymentDto,
  UpdatePurchaseBillDto,
} from "@/types";

export function usePurchaseBills(filters?: ListPurchaseBillsDto) {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.purchaseBills(firmId!, filters),
    queryFn: () => purchaseBillsService.getPurchaseBills(firmId!, filters),
    enabled: !!firmId,
    placeholderData: (prev) => prev,
  });
}

export function usePurchaseBill(id: string) {
  return useQuery({
    queryKey: QK.purchaseBill(id),
    queryFn: () => purchaseBillsService.getPurchaseBill(id),
    enabled: !!id,
  });
}

export function useCreatePurchaseBill() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: CreatePurchaseBillDto) =>
      purchaseBillsService.createPurchaseBill(firmId!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.purchaseBills(firmId!) });
      toast.success("Purchase bill created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePurchaseBill() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePurchaseBillDto }) =>
      purchaseBillsService.updatePurchaseBill(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.purchaseBills(firmId!) });
      qc.invalidateQueries({ queryKey: QK.purchaseBill(id) });
      toast.success("Purchase bill updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePurchaseBill() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (id: string) => purchaseBillsService.deletePurchaseBill(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.purchaseBills(firmId!) });
      const prev = qc.getQueryData(QK.purchaseBills(firmId!));
      qc.setQueryData(QK.purchaseBills(firmId!), (old: any) =>
        old ? { ...old, data: old.data.filter((b: PurchaseBill) => b.id !== id) } : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      qc.setQueryData(QK.purchaseBills(firmId!), ctx?.prev);
      toast.error("Failed to delete purchase bill");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QK.purchaseBills(firmId!) }),
  });
}

export function useRecordPurchasePayment() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RecordPaymentDto }) =>
      purchaseBillsService.recordPayment(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.purchaseBill(id) });
      qc.invalidateQueries({ queryKey: QK.purchaseBills(firmId!) });
      toast.success("Payment recorded");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
