"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QK } from "@/lib/query-keys";
import { deliveryChallansService } from "@/services/delivery-challans";
import { useAppStore } from "@/store/useAppStore";
import type { CreateDCDto, DeliveryChallan, ListDCDto, UpdateDCDto } from "@/types";

export function useDeliveryChallans(filters?: ListDCDto) {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.deliveryChallans(firmId!, filters),
    queryFn: () => deliveryChallansService.getDeliveryChallans(firmId!, filters),
    enabled: !!firmId,
    placeholderData: (prev) => prev,
  });
}

export function useDeliveryChallan(id: string) {
  return useQuery({
    queryKey: QK.deliveryChallan(id),
    queryFn: () => deliveryChallansService.getDeliveryChallan(id),
    enabled: !!id,
  });
}

export function useCreateDC() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: CreateDCDto) => deliveryChallansService.createDeliveryChallan(firmId!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.deliveryChallans(firmId!) });
      toast.success("Delivery challan created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateDC() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDCDto }) =>
      deliveryChallansService.updateDeliveryChallan(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.deliveryChallans(firmId!) });
      qc.invalidateQueries({ queryKey: QK.deliveryChallan(id) });
      toast.success("Delivery challan updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDC() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (id: string) => deliveryChallansService.deleteDeliveryChallan(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.deliveryChallans(firmId!) });
      const prev = qc.getQueryData(QK.deliveryChallans(firmId!));
      qc.setQueryData(QK.deliveryChallans(firmId!), (old: any) =>
        old ? { ...old, data: old.data.filter((dc: DeliveryChallan) => dc.id !== id) } : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      qc.setQueryData(QK.deliveryChallans(firmId!), ctx?.prev);
      toast.error("Failed to delete delivery challan");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QK.deliveryChallans(firmId!) }),
  });
}

export function useConvertToInvoice() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (id: string) => deliveryChallansService.convertToInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.deliveryChallans(firmId!) });
      qc.invalidateQueries({ queryKey: QK.salesBills(firmId!) });
      qc.invalidateQueries({ queryKey: QK.nextBillNo(firmId!) });
      toast.success("Converted to invoice");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
