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
  getExpenses: (firmId: string, filters?: ListExpensesDto): Promise<ApiPaginatedResponse<Expense>> =>
    apiRequest(`/expenses${toQuery({ firmId, ...filters })}`),

  getExpense: (id: string): Promise<Expense> =>
    apiRequest(`/expenses/${id}`),

  createExpense: (firmId: string, dto: CreateExpenseDto): Promise<Expense> =>
    apiRequest(`/expenses${toQuery({ firmId })}`, {
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

  getCategories: (firmId: string): Promise<ExpenseCategory[]> =>
    apiRequest(`/expenses/categories${toQuery({ firmId })}`),

  createCategory: (firmId: string, name: string): Promise<ExpenseCategory> =>
    apiRequest(`/expenses/categories${toQuery({ firmId })}`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getSuppliers: (firmId: string): Promise<ExpenseSupplier[]> =>
    apiRequest(`/expenses/suppliers${toQuery({ firmId })}`),

  createSupplier: (firmId: string, dto: CreateSupplierDto): Promise<ExpenseSupplier> =>
    apiRequest(`/expenses/suppliers${toQuery({ firmId })}`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),
};
