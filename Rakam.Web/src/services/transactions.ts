import { apiRequest } from "@/lib/api";
import type {
  Transaction,
  ListTransactionsDto,
  CreateTransactionDto,
  UpdateTransactionDto,
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

export const transactionsService = {
  getTransactions: (firmId: string, filters?: ListTransactionsDto): Promise<ApiPaginatedResponse<Transaction>> =>
    apiRequest(`/transactions${toQuery({ firmId, ...filters })}`),

  getTransaction: (id: string): Promise<Transaction> =>
    apiRequest(`/transactions/${id}`),

  createTransaction: (firmId: string, dto: CreateTransactionDto): Promise<Transaction> =>
    apiRequest(`/transactions${toQuery({ firmId })}`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updateTransaction: (id: string, dto: UpdateTransactionDto): Promise<Transaction> =>
    apiRequest(`/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  deleteTransaction: (id: string): Promise<void> =>
    apiRequest(`/transactions/${id}`, { method: "DELETE" }),
};
