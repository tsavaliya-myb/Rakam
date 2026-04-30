"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QK } from "@/lib/query-keys";
import { transactionsService } from "@/services/transactions";
import { useAppStore } from "@/store/useAppStore";
import type {
  CreateTransactionDto,
  ListTransactionsDto,
  Transaction,
  UpdateTransactionDto,
} from "@/types";

export function useTransactions(filters?: ListTransactionsDto) {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.transactions(firmId!, filters),
    queryFn: () => transactionsService.getTransactions(filters),
    enabled: !!firmId,
    placeholderData: (prev) => prev,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: QK.transaction(id),
    queryFn: () => transactionsService.getTransaction(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: CreateTransactionDto) =>
      transactionsService.createTransaction(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.transactions(firmId!) });
      toast.success("Transaction created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransactionDto }) =>
      transactionsService.updateTransaction(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.transactions(firmId!) });
      qc.invalidateQueries({ queryKey: QK.transaction(id) });
      toast.success("Transaction updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (id: string) => transactionsService.deleteTransaction(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.transactions(firmId!) });
      const prev = qc.getQueryData(QK.transactions(firmId!));
      qc.setQueryData(QK.transactions(firmId!), (old: any) =>
        old ? { ...old, data: old.data.filter((t: Transaction) => t.id !== id) } : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      qc.setQueryData(QK.transactions(firmId!), ctx?.prev);
      toast.error("Failed to delete transaction");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QK.transactions(firmId!) }),
  });
}
