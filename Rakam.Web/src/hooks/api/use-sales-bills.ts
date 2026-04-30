"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QK } from "@/lib/query-keys";
import { salesBillsService } from "@/services/sales-bills";
import { useAppStore } from "@/store/useAppStore";
import type {
  CreateCreditNoteDto,
  CreateSalesBillDto,
  ListSalesBillsDto,
  RecordPaymentDto,
  SalesBill,
  UpdateSalesBillDto,
} from "@/types";

export function useSalesBills(filters?: ListSalesBillsDto) {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.salesBills(firmId!, filters),
    queryFn: () => salesBillsService.getSalesBills(filters),
    enabled: !!firmId,
    placeholderData: (prev) => prev,
  });
}

export function useSalesBill(id: string) {
  return useQuery({
    queryKey: QK.salesBill(id),
    queryFn: () => salesBillsService.getSalesBill(id),
    enabled: !!id,
  });
}

export function useNextBillNo() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.nextBillNo(firmId!),
    queryFn: () => salesBillsService.getNextBillNo(),
    enabled: !!firmId,
    staleTime: 0,
  });
}

export function useUnbilledChallans() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.unbilledDCs(firmId!),
    queryFn: () => salesBillsService.getUnbilledChallans(),
    enabled: !!firmId,
  });
}

export function useCreateSalesBill() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: CreateSalesBillDto) => salesBillsService.createSalesBill(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.salesBills(firmId!) });
      qc.invalidateQueries({ queryKey: QK.nextBillNo(firmId!) });
      toast.success("Bill created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSalesBill() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSalesBillDto }) =>
      salesBillsService.updateSalesBill(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.salesBills(firmId!) });
      qc.invalidateQueries({ queryKey: QK.salesBill(id) });
      toast.success("Bill updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteSalesBill() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (id: string) => salesBillsService.deleteSalesBill(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.salesBills(firmId!) });
      const prev = qc.getQueryData(QK.salesBills(firmId!));
      qc.setQueryData(QK.salesBills(firmId!), (old: any) =>
        old ? { ...old, data: old.data.filter((b: SalesBill) => b.id !== id) } : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      qc.setQueryData(QK.salesBills(firmId!), ctx?.prev);
      toast.error("Failed to delete bill");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QK.salesBills(firmId!) }),
  });
}

export function useDuplicateBill() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (id: string) => salesBillsService.duplicateBill(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.salesBills(firmId!) });
      qc.invalidateQueries({ queryKey: QK.nextBillNo(firmId!) });
      toast.success("Bill duplicated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RecordPaymentDto }) =>
      salesBillsService.recordPayment(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.salesBill(id) });
      qc.invalidateQueries({ queryKey: QK.salesBills(firmId!) });
      toast.success("Payment recorded");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateCreditNote() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateCreditNoteDto }) =>
      salesBillsService.createCreditNote(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.salesBill(id) });
      qc.invalidateQueries({ queryKey: QK.salesBills(firmId!) });
      toast.success("Credit note created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGeneratePdf() {
  return useMutation({
    mutationFn: (id: string) => salesBillsService.generatePdf(id),
    onError: (err: Error) => toast.error(err.message),
  });
}
