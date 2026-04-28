"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QK } from "@/lib/query-keys";
import { firmsService } from "@/services/firms";
import { useAppStore } from "@/store/useAppStore";
import type {
  CreateDispatchAddressDto,
  CreateFirmDto,
  Firm,
  TogglePdfOptionsDto,
  UpdateBankDetailsDto,
  UpdateDispatchAddressDto,
  UpdateFirmDto,
} from "@/types";

export function useFirms() {
  return useQuery({
    queryKey: QK.firms("me"),
    queryFn: () => firmsService.getFirms(),
  });
}

export function useFirm(id: string) {
  return useQuery({
    queryKey: QK.firm(id),
    queryFn: () => firmsService.getFirm(id),
    enabled: !!id,
  });
}

export function useCreateFirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFirmDto) => firmsService.createFirm(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.firms("me") });
      toast.success("Firm created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateFirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFirmDto }) =>
      firmsService.updateFirm(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.firms("me") });
      qc.invalidateQueries({ queryKey: QK.firm(id) });
      toast.success("Firm updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteFirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => firmsService.deleteFirm(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.firms("me") });
      toast.success("Firm deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSetDefaultFirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => firmsService.setDefaultFirm(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.firms("me") });
      toast.success("Default firm updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useTogglePdfOptions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: TogglePdfOptionsDto }) =>
      firmsService.togglePdfOptions(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.firm(id) });
      toast.success("PDF options updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useFirmBankDetails(firmId: string) {
  return useQuery({
    queryKey: QK.firmBankDetails(firmId),
    queryFn: () => firmsService.getBankDetails(firmId),
    enabled: !!firmId,
  });
}

export function useUpdateBankDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ firmId, dto }: { firmId: string; dto: UpdateBankDetailsDto }) =>
      firmsService.updateBankDetails(firmId, dto),
    onSuccess: (_data, { firmId }) => {
      qc.invalidateQueries({ queryKey: QK.firmBankDetails(firmId) });
      toast.success("Bank details updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDispatchAddresses(firmId: string) {
  return useQuery({
    queryKey: QK.firmDispatchAddresses(firmId),
    queryFn: () => firmsService.getDispatchAddresses(firmId),
    enabled: !!firmId,
  });
}

export function useCreateDispatchAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ firmId, dto }: { firmId: string; dto: CreateDispatchAddressDto }) =>
      firmsService.createDispatchAddress(firmId, dto),
    onSuccess: (_data, { firmId }) => {
      qc.invalidateQueries({ queryKey: QK.firmDispatchAddresses(firmId) });
      toast.success("Dispatch address added");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateDispatchAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      firmId,
      addressId,
      dto,
    }: {
      firmId: string;
      addressId: string;
      dto: UpdateDispatchAddressDto;
    }) => firmsService.updateDispatchAddress(firmId, addressId, dto),
    onSuccess: (_data, { firmId }) => {
      qc.invalidateQueries({ queryKey: QK.firmDispatchAddresses(firmId) });
      toast.success("Dispatch address updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDispatchAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ firmId, addressId }: { firmId: string; addressId: string }) =>
      firmsService.deleteDispatchAddress(firmId, addressId),
    onSuccess: (_data, { firmId }) => {
      qc.invalidateQueries({ queryKey: QK.firmDispatchAddresses(firmId) });
      toast.success("Dispatch address deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
