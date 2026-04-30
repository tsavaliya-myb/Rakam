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
  getSalesBills: (filters?: ListSalesBillsDto): Promise<ApiPaginatedResponse<SalesBill>> =>
    apiRequest(`/sales-bills${toQuery(filters as Record<string, unknown>)}`),

  getSalesBill: (id: string): Promise<SalesBill> =>
    apiRequest(`/sales-bills/${id}`),

  getNextBillNo: (billType?: string): Promise<{ billNo: string }> =>
    apiRequest(`/sales-bills/next-bill-no${toQuery(billType ? { billType } : undefined)}`),

  getUnbilledChallans: (partyId?: string): Promise<DeliveryChallan[]> =>
    apiRequest(`/sales-bills/unbilled-dc${toQuery(partyId ? { partyId } : undefined)}`),

  createSalesBill: (dto: CreateSalesBillDto): Promise<SalesBill> =>
    apiRequest(`/sales-bills`, {
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
