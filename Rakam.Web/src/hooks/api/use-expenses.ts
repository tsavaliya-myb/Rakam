"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QK } from "@/lib/query-keys";
import { expensesService } from "@/services/expenses";
import { useAppStore } from "@/store/useAppStore";
import type {
  CreateExpenseDto,
  CreateSupplierDto,
  Expense,
  ListExpensesDto,
  UpdateExpenseDto,
} from "@/types";

export function useExpenses(filters?: ListExpensesDto) {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.expenses(firmId!, filters),
    queryFn: () => expensesService.getExpenses(firmId!, filters),
    enabled: !!firmId,
    placeholderData: (prev) => prev,
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: QK.expense(id),
    queryFn: () => expensesService.getExpense(id),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: CreateExpenseDto) => expensesService.createExpense(firmId!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.expenses(firmId!) });
      toast.success("Expense created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExpenseDto }) =>
      expensesService.updateExpense(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.expenses(firmId!) });
      qc.invalidateQueries({ queryKey: QK.expense(id) });
      toast.success("Expense updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (id: string) => expensesService.deleteExpense(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.expenses(firmId!) });
      const prev = qc.getQueryData(QK.expenses(firmId!));
      qc.setQueryData(QK.expenses(firmId!), (old: any) =>
        old ? { ...old, data: old.data.filter((e: Expense) => e.id !== id) } : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      qc.setQueryData(QK.expenses(firmId!), ctx?.prev);
      toast.error("Failed to delete expense");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QK.expenses(firmId!) }),
  });
}

export function useExpenseCategories() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.expenseCategories(firmId!),
    queryFn: () => expensesService.getCategories(firmId!),
    enabled: !!firmId,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (name: string) => expensesService.createCategory(firmId!, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.expenseCategories(firmId!) });
      toast.success("Category created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useExpenseSuppliers() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.expenseSuppliers(firmId!),
    queryFn: () => expensesService.getSuppliers(firmId!),
    enabled: !!firmId,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: CreateSupplierDto) => expensesService.createSupplier(firmId!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.expenseSuppliers(firmId!) });
      toast.success("Supplier created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
