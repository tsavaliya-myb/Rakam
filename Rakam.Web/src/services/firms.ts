import { apiRequest } from "@/lib/api";
import type {
  Firm,
  FirmBankDetails,
  DispatchAddress,
  CreateFirmDto,
  UpdateFirmDto,
  TogglePdfOptionsDto,
  UpdateBankDetailsDto,
  CreateDispatchAddressDto,
  UpdateDispatchAddressDto,
} from "@/types";

export const firmsService = {
  getFirms: (): Promise<Firm[]> =>
    apiRequest("/firms"),

  getFirm: (id: string): Promise<Firm> =>
    apiRequest(`/firms/${id}`),

  createFirm: (dto: CreateFirmDto): Promise<Firm> =>
    apiRequest("/firms", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updateFirm: (id: string, dto: UpdateFirmDto): Promise<Firm> =>
    apiRequest(`/firms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  deleteFirm: (id: string): Promise<void> =>
    apiRequest(`/firms/${id}`, { method: "DELETE" }),

  setDefaultFirm: (id: string): Promise<void> =>
    apiRequest(`/firms/${id}/set-default`, { method: "PATCH" }),

  togglePdfOptions: (id: string, dto: TogglePdfOptionsDto): Promise<void> =>
    apiRequest(`/firms/${id}/pdf-options`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  getBankDetails: (firmId: string): Promise<FirmBankDetails> =>
    apiRequest(`/firms/${firmId}/bank-details`),

  updateBankDetails: (firmId: string, dto: UpdateBankDetailsDto): Promise<FirmBankDetails> =>
    apiRequest(`/firms/${firmId}/bank-details`, {
      method: "PUT",
      body: JSON.stringify(dto),
    }),

  getDispatchAddresses: (firmId: string): Promise<DispatchAddress[]> =>
    apiRequest(`/firms/${firmId}/dispatch-addresses`),

  createDispatchAddress: (firmId: string, dto: CreateDispatchAddressDto): Promise<DispatchAddress> =>
    apiRequest(`/firms/${firmId}/dispatch-addresses`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updateDispatchAddress: (firmId: string, addressId: string, dto: UpdateDispatchAddressDto): Promise<DispatchAddress> =>
    apiRequest(`/firms/${firmId}/dispatch-addresses/${addressId}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  deleteDispatchAddress: (firmId: string, addressId: string): Promise<void> =>
    apiRequest(`/firms/${firmId}/dispatch-addresses/${addressId}`, { method: "DELETE" }),
};
