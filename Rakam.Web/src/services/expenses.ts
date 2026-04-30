import { apiRequest } from "@/lib/api";
import type {
  Expense,
  ExpenseCategory,
  ExpenseSupplier,
  ListExpensesDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  CreateSupplierDto,
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

export const expensesService = {
  getExpenses: (filters?: ListExpensesDto): Promise<ApiPaginatedResponse<Expense>> =>
    apiRequest(`/expenses${toQuery(filters as Record<string, unknown>)}`),

  getExpense: (id: string): Promise<Expense> =>
    apiRequest(`/expenses/${id}`),

  createExpense: (dto: CreateExpenseDto): Promise<Expense> =>
    apiRequest(`/expenses`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updateExpense: (id: string, dto: UpdateExpenseDto): Promise<Expense> =>
    apiRequest(`/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  deleteExpense: (id: string): Promise<void> =>
    apiRequest(`/expenses/${id}`, { method: "DELETE" }),

  getCategories: (): Promise<ExpenseCategory[]> =>
    apiRequest(`/expenses/categories`),

  createCategory: (name: string): Promise<ExpenseCategory> =>
    apiRequest(`/expenses/categories`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getSuppliers: (): Promise<ExpenseSupplier[]> =>
    apiRequest(`/expenses/suppliers`),

  createSupplier: (dto: CreateSupplierDto): Promise<ExpenseSupplier> =>
    apiRequest(`/expenses/suppliers`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),
};
