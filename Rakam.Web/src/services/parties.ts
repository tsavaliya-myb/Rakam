import { apiRequest } from "@/lib/api";
import type {
  Party,
  PartyBalance,
  PartyDropdownItem,
  ListPartiesDto,
  CreatePartyDto,
  UpdatePartyDto,
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

export const partiesService = {
  getParties: (filters?: ListPartiesDto): Promise<ApiPaginatedResponse<Party>> =>
    apiRequest(`/parties${toQuery(filters as Record<string, unknown>)}`),

  getPartiesDropdown: (): Promise<PartyDropdownItem[]> =>
    apiRequest(`/parties/dropdown`),

  getParty: (id: string): Promise<Party> =>
    apiRequest(`/parties/${id}`),

  createParty: (dto: CreatePartyDto): Promise<Party> =>
    apiRequest(`/parties`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updateParty: (id: string, dto: UpdatePartyDto): Promise<Party> =>
    apiRequest(`/parties/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  deleteParty: (id: string): Promise<void> =>
    apiRequest(`/parties/${id}`, { method: "DELETE" }),

  getPartyBalance: (partyId: string): Promise<PartyBalance> =>
    apiRequest(`/parties/${partyId}/balance`),
};
