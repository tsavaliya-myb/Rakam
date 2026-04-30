import { apiRequest } from "@/lib/api";
import type {
  UserProfile,
  SalesBillSettingsResponse,
  PurchaseBillSettingsResponse,
  DCSettingsResponse,
  OtherSettingsResponse,
  GspCredentials,
  IncomeCategory,
  IncomeSupplier,
} from "@/types";

export const settingsService = {
  // ── Profile ───────────────────────────────────────────────────────────────
  getProfile: (): Promise<UserProfile> =>
    apiRequest("/settings/profile"),

  updateProfile: (dto: Record<string, unknown>): Promise<UserProfile> =>
    apiRequest("/settings/profile", {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  // ── Sales Bill ────────────────────────────────────────────────────────────
  getSalesBillSettings: (): Promise<SalesBillSettingsResponse> =>
    apiRequest("/settings/sales-bill"),

  saveSalesBillSettings: (dto: Record<string, unknown>): Promise<SalesBillSettingsResponse> =>
    apiRequest("/settings/sales-bill", {
      method: "PUT",
      body: JSON.stringify(dto),
    }),

  // ── Purchase Bill ─────────────────────────────────────────────────────────
  getPurchaseBillSettings: (): Promise<PurchaseBillSettingsResponse> =>
    apiRequest("/settings/purchase-bill"),

  savePurchaseBillSettings: (dto: Record<string, unknown>): Promise<PurchaseBillSettingsResponse> =>
    apiRequest("/settings/purchase-bill", {
      method: "PUT",
      body: JSON.stringify(dto),
    }),

  // ── Delivery Challan ──────────────────────────────────────────────────────
  getDCSettings: (): Promise<DCSettingsResponse> =>
    apiRequest("/settings/delivery-challan"),

  saveDCSettings: (dto: Record<string, unknown>): Promise<DCSettingsResponse> =>
    apiRequest("/settings/delivery-challan", {
      method: "PUT",
      body: JSON.stringify(dto),
    }),

  // ── Other Settings ────────────────────────────────────────────────────────
  getOtherSettings: (): Promise<OtherSettingsResponse> =>
    apiRequest("/settings/other"),

  saveOtherSettings: (dto: Record<string, unknown>): Promise<OtherSettingsResponse> =>
    apiRequest("/settings/other", {
      method: "PUT",
      body: JSON.stringify(dto),
    }),

  // ── Income Categories ─────────────────────────────────────────────────────
  getIncomeCategories: (): Promise<IncomeCategory[]> =>
    apiRequest("/settings/income/categories"),

  createIncomeCategory: (name: string): Promise<IncomeCategory> =>
    apiRequest("/settings/income/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  updateIncomeCategory: (id: string, name: string): Promise<IncomeCategory> =>
    apiRequest(`/settings/income/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  deleteIncomeCategory: (id: string): Promise<void> =>
    apiRequest(`/settings/income/categories/${id}`, { method: "DELETE" }),

  // ── Income Suppliers ──────────────────────────────────────────────────────
  getIncomeSuppliers: (): Promise<IncomeSupplier[]> =>
    apiRequest("/settings/income/suppliers"),

  createIncomeSupplier: (name: string): Promise<IncomeSupplier> =>
    apiRequest("/settings/income/suppliers", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  updateIncomeSupplier: (id: string, name: string): Promise<IncomeSupplier> =>
    apiRequest(`/settings/income/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  deleteIncomeSupplier: (id: string): Promise<void> =>
    apiRequest(`/settings/income/suppliers/${id}`, { method: "DELETE" }),

  // ── E-way GSP Credentials ─────────────────────────────────────────────────
  getGspCredentials: (): Promise<GspCredentials | null> =>
    apiRequest("/settings/eway-gsp"),

  saveGspCredentials: (dto: { gspUsername: string; gspPassword: string }): Promise<GspCredentials> =>
    apiRequest("/settings/eway-gsp", {
      method: "PUT",
      body: JSON.stringify(dto),
    }),
};
