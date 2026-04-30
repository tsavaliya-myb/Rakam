import { apiRequest } from "@/lib/api";
import type {
  PurchaseBill,
  ListPurchaseBillsDto,
  CreatePurchaseBillDto,
  UpdatePurchaseBillDto,
  RecordPaymentDto,
  ApiPaginatedResponse,
} from "@/types";

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export const purchaseBillsService = {
  getPurchaseBills: (filters?: ListPurchaseBillsDto): Promise<ApiPaginatedResponse<PurchaseBill>> =>
    apiRequest(`/purchase-bills${toQuery(filters as Record<string, unknown>)}`),

  getPurchaseBill: (id: string): Promise<PurchaseBill> =>
    apiRequest(`/purchase-bills/${id}`),

  createPurchaseBill: (dto: CreatePurchaseBillDto): Promise<PurchaseBill> =>
    apiRequest(`/purchase-bills`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updatePurchaseBill: (id: string, dto: UpdatePurchaseBillDto): Promise<PurchaseBill> =>
    apiRequest(`/purchase-bills/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  deletePurchaseBill: (id: string): Promise<void> =>
    apiRequest(`/purchase-bills/${id}`, { method: "DELETE" }),

  recordPayment: (id: string, dto: RecordPaymentDto): Promise<void> =>
    apiRequest(`/purchase-bills/${id}/payment`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),
};
