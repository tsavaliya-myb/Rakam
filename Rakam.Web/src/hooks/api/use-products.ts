"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QK } from "@/lib/query-keys";
import { productsService } from "@/services/products";
import { useAppStore } from "@/store/useAppStore";
import type { CreateProductDto, ListProductsDto, Product, UpdateProductDto } from "@/types";

export function useProducts(filters?: ListProductsDto) {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.products(firmId!, filters),
    queryFn: () => productsService.getProducts(firmId!, filters),
    enabled: !!firmId,
    placeholderData: (prev) => prev,
  });
}

export function useProductsDropdown() {
  const firmId = useAppStore((s) => s.activeFirmId);
  return useQuery({
    queryKey: QK.productsDropdown(firmId!),
    queryFn: () => productsService.getProductsDropdown(firmId!),
    enabled: !!firmId,
    staleTime: Infinity,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: QK.product(id),
    queryFn: () => productsService.getProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (dto: CreateProductDto) => productsService.createProduct(firmId!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.products(firmId!) });
      qc.invalidateQueries({ queryKey: QK.productsDropdown(firmId!) });
      toast.success("Product created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductDto }) =>
      productsService.updateProduct(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QK.products(firmId!) });
      qc.invalidateQueries({ queryKey: QK.product(id) });
      qc.invalidateQueries({ queryKey: QK.productsDropdown(firmId!) });
      toast.success("Product updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  const firmId = useAppStore((s) => s.activeFirmId);
  return useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.products(firmId!) });
      const prev = qc.getQueryData(QK.products(firmId!));
      qc.setQueryData(QK.products(firmId!), (old: any) =>
        old ? { ...old, data: old.data.filter((p: Product) => p.id !== id) } : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      qc.setQueryData(QK.products(firmId!), ctx?.prev);
      toast.error("Failed to delete product");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QK.products(firmId!) });
      qc.invalidateQueries({ queryKey: QK.productsDropdown(firmId!) });
    },
  });
}
