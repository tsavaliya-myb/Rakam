import { apiRequest } from "@/lib/api";
import type {
  SalesBill,
  DeliveryChallan,
  ListSalesBillsDto,
  CreateSalesBillDto,
  UpdateSalesBillDto,
  RecordPaymentDto,
  CreateCreditNoteDto,
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

export const salesBillsService = {
  getSalesBills: (firmId: string, filters?: ListSalesBillsDto): Promise<ApiPaginatedResponse<SalesBill>> =>
    apiRequest(`/sales-bills${toQuery({ firmId, ...filters })}`),

  getSalesBill: (id: string): Promise<SalesBill> =>
    apiRequest(`/sales-bills/${id}`),

  getNextBillNo: (firmId: string): Promise<{ billNo: string }> =>
    apiRequest(`/sales-bills/next-bill-no${toQuery({ firmId })}`),

  getUnbilledChallans: (firmId: string): Promise<DeliveryChallan[]> =>
    apiRequest(`/sales-bills/unbilled-dc${toQuery({ firmId })}`),

  createSalesBill: (firmId: string, dto: CreateSalesBillDto): Promise<SalesBill> =>
    apiRequest(`/sales-bills${toQuery({ firmId })}`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updateSalesBill: (id: string, dto: UpdateSalesBillDto): Promise<SalesBill> =>
    apiRequest(`/sales-bills/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  deleteSalesBill: (id: string): Promise<void> =>
    apiRequest(`/sales-bills/${id}`, { method: "DELETE" }),

  duplicateBill: (id: string): Promise<SalesBill> =>
    apiRequest(`/sales-bills/${id}/duplicate`, { method: "POST" }),

  recordPayment: (id: string, dto: RecordPaymentDto): Promise<void> =>
    apiRequest(`/sales-bills/${id}/payment`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  createCreditNote: (id: string, dto: CreateCreditNoteDto): Promise<void> =>
    apiRequest(`/sales-bills/${id}/credit-note`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  generatePdf: (id: string): Promise<{ jobId: string }> =>
    apiRequest(`/sales-bills/${id}/pdf`, { method: "POST" }),
};
