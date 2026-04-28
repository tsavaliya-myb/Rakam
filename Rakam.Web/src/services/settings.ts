import { apiRequest } from "@/lib/api";
import type { FirmSettings, UpdateSettingsDto } from "@/types";

export const settingsService = {
  getSettings: (firmId: string): Promise<FirmSettings> =>
    apiRequest(`/settings?firmId=${firmId}`),

  updateSettings: (firmId: string, section: string, dto: UpdateSettingsDto): Promise<FirmSettings> =>
    apiRequest(`/settings/${section}?firmId=${firmId}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),
};
