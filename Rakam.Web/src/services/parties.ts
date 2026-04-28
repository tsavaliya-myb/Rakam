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
  getParties: (firmId: string, filters?: ListPartiesDto): Promise<ApiPaginatedResponse<Party>> =>
    apiRequest(`/parties${toQuery({ firmId, ...filters })}`),

  getPartiesDropdown: (firmId: string): Promise<PartyDropdownItem[]> =>
    apiRequest(`/parties/dropdown${toQuery({ firmId })}`),

  getParty: (id: string): Promise<Party> =>
    apiRequest(`/parties/${id}`),

  createParty: (firmId: string, dto: CreatePartyDto): Promise<Party> =>
    apiRequest(`/parties${toQuery({ firmId })}`, {
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
