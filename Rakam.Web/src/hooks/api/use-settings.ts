"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QK } from "@/lib/query-keys";
import { settingsService } from "@/services/settings";
import { useAppStore } from "@/store/useAppStore";

// ── Profile ───────────────────────────────────────────────────────────────────

export function useProfile() {
  return useQuery({
    queryKey: QK.profile(),
    queryFn: () => settingsService.getProfile(),
    staleTime: 300_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Record<string, unknown>) => settingsService.updateProfile(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.profile() });
      toast.success("Profile updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Sales Bill Settings ───────────────────────────────────────────────────────

export function useSalesBillSettings() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.salesBillSettings(firmId!),
    queryFn: () => settingsService.getSalesBillSettings(),
    enabled: !!firmId,
    staleTime: 300_000,
  });
}

export function useSaveSalesBillSettings() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: Record<string, unknown>) => settingsService.saveSalesBillSettings(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.salesBillSettings(firmId!) });
      toast.success("Settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Purchase Bill Settings ────────────────────────────────────────────────────

export function usePurchaseBillSettings() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.purchaseBillSettings(firmId!),
    queryFn: () => settingsService.getPurchaseBillSettings(),
    enabled: !!firmId,
    staleTime: 300_000,
  });
}

export function useSavePurchaseBillSettings() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: Record<string, unknown>) => settingsService.savePurchaseBillSettings(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.purchaseBillSettings(firmId!) });
      toast.success("Settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Delivery Challan Settings ─────────────────────────────────────────────────

export function useDCSettings() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.dcSettings(firmId!),
    queryFn: () => settingsService.getDCSettings(),
    enabled: !!firmId,
    staleTime: 300_000,
  });
}

export function useSaveDCSettings() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: Record<string, unknown>) => settingsService.saveDCSettings(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.dcSettings(firmId!) });
      toast.success("Settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Other / Inventory Settings ────────────────────────────────────────────────

export function useOtherSettings() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.otherSettings(firmId!),
    queryFn: () => settingsService.getOtherSettings(),
    enabled: !!firmId,
    staleTime: 300_000,
  });
}

export function useSaveOtherSettings() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: Record<string, unknown>) => settingsService.saveOtherSettings(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.otherSettings(firmId!) });
      toast.success("Settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Income Categories ─────────────────────────────────────────────────────────

export function useIncomeCategories() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.incomeCategories(firmId!),
    queryFn: () => settingsService.getIncomeCategories(),
    enabled: !!firmId,
  });
}

export function useCreateIncomeCategory() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (name: string) => settingsService.createIncomeCategory(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.incomeCategories(firmId!) });
      toast.success("Category created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteIncomeCategory() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteIncomeCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.incomeCategories(firmId!) });
      toast.success("Category deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Income Suppliers ──────────────────────────────────────────────────────────

export function useIncomeSuppliers() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.incomeSuppliers(firmId!),
    queryFn: () => settingsService.getIncomeSuppliers(),
    enabled: !!firmId,
  });
}

export function useCreateIncomeSupplier() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (name: string) => settingsService.createIncomeSupplier(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.incomeSuppliers(firmId!) });
      toast.success("Supplier created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteIncomeSupplier() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteIncomeSupplier(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.incomeSuppliers(firmId!) });
      toast.success("Supplier deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── E-way GSP Credentials ─────────────────────────────────────────────────────

export function useGspCredentials() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.ewayGsp(firmId!),
    queryFn: () => settingsService.getGspCredentials(),
    enabled: !!firmId,
    staleTime: 300_000,
  });
}

export function useSaveGspCredentials() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: { gspUsername: string; gspPassword: string }) =>
      settingsService.saveGspCredentials(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.ewayGsp(firmId!) });
      toast.success("GSP credentials saved & registered");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
