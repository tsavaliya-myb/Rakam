import { apiRequest } from "@/lib/api";
import type {
  EwayBill,
  ListEwayBillsDto,
  CreateEwayBillDto,
  UpdateEwayBillDto,
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

export const ewayBillsService = {
  getEwayBills: (filters?: ListEwayBillsDto): Promise<ApiPaginatedResponse<EwayBill>> =>
    apiRequest(`/eway-bills${toQuery(filters as Record<string, unknown>)}`),

  getEwayBill: (id: string): Promise<EwayBill> =>
    apiRequest(`/eway-bills/${id}`),

  createEwayBill: (dto: CreateEwayBillDto): Promise<EwayBill> =>
    apiRequest(`/eway-bills`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updateEwayBill: (id: string, dto: UpdateEwayBillDto): Promise<EwayBill> =>
    apiRequest(`/eway-bills/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),
};
