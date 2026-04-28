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
  getEwayBills: (firmId: string, filters?: ListEwayBillsDto): Promise<ApiPaginatedResponse<EwayBill>> =>
    apiRequest(`/eway-bills${toQuery({ firmId, ...filters })}`),

  getEwayBill: (id: string): Promise<EwayBill> =>
    apiRequest(`/eway-bills/${id}`),

  createEwayBill: (firmId: string, dto: CreateEwayBillDto): Promise<EwayBill> =>
    apiRequest(`/eway-bills${toQuery({ firmId })}`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updateEwayBill: (id: string, dto: UpdateEwayBillDto): Promise<EwayBill> =>
    apiRequest(`/eway-bills/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),
};
