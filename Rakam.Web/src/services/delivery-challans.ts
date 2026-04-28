import { apiRequest } from "@/lib/api";
import type {
  DeliveryChallan,
  SalesBill,
  ListDCDto,
  CreateDCDto,
  UpdateDCDto,
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

export const deliveryChallansService = {
  getDeliveryChallans: (firmId: string, filters?: ListDCDto): Promise<ApiPaginatedResponse<DeliveryChallan>> =>
    apiRequest(`/delivery-challans${toQuery({ firmId, ...filters })}`),

  getDeliveryChallan: (id: string): Promise<DeliveryChallan> =>
    apiRequest(`/delivery-challans/${id}`),

  createDeliveryChallan: (firmId: string, dto: CreateDCDto): Promise<DeliveryChallan> =>
    apiRequest(`/delivery-challans${toQuery({ firmId })}`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updateDeliveryChallan: (id: string, dto: UpdateDCDto): Promise<DeliveryChallan> =>
    apiRequest(`/delivery-challans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  deleteDeliveryChallan: (id: string): Promise<void> =>
    apiRequest(`/delivery-challans/${id}`, { method: "DELETE" }),

  convertToInvoice: (id: string): Promise<SalesBill> =>
    apiRequest(`/delivery-challans/${id}/convert`, { method: "POST" }),
};
