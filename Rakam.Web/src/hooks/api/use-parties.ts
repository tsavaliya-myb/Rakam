"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QK } from "@/lib/query-keys";
import { partiesService } from "@/services/parties";
import { useAppStore } from "@/store/useAppStore";
import type { CreatePartyDto, ListPartiesDto, Party, UpdatePartyDto } from "@/types";

export function useParties(filters?: ListPartiesDto) {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.parties(firmId!, filters),
    queryFn: () => partiesService.getParties(filters),
    enabled: !!firmId,
    placeholderData: (prev) => prev,
  });
}

export function usePartiesDropdown() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.partiesDropdown(firmId!),
    queryFn: () => partiesService.getPartiesDropdown(),
    enabled: !!firmId,
    staleTime: Infinity,
  });
}

export function useParty(id: string) {
  return useQuery({
    queryKey: QK.party(id),
    queryFn: () => partiesService.getParty(id),
    enabled: !!id,
  });
}

export function usePartyBalance(partyId: string) {
  return useQuery({
    queryKey: QK.partyBalance(partyId),
    queryFn: () => partiesService.getPartyBalance(partyId),
    enabled: !!partyId,
  });
}

export function useCreateParty() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: CreatePartyDto) => partiesService.createParty(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.parties(firmId!) });
      qc.invalidateQueries({ queryKey: QK.partiesDropdown(firmId!) });
      toast.success("Party created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateParty() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePartyDto }) =>
      partiesService.updateParty(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.parties(firmId!) });
      qc.invalidateQueries({ queryKey: QK.party(id) });
      qc.invalidateQueries({ queryKey: QK.partiesDropdown(firmId!) });
      toast.success("Party updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteParty() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (id: string) => partiesService.deleteParty(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.parties(firmId!) });
      const prev = qc.getQueryData(QK.parties(firmId!));
      qc.setQueryData(QK.parties(firmId!), (old: any) =>
        old ? { ...old, data: old.data.filter((p: Party) => p.id !== id) } : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      qc.setQueryData(QK.parties(firmId!), ctx?.prev);
      toast.error("Failed to delete party");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QK.parties(firmId!) });
      qc.invalidateQueries({ queryKey: QK.partiesDropdown(firmId!) });
    },
  });
}
