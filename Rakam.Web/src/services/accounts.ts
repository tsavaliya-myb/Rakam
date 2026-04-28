import { apiRequest } from "@/lib/api";
import type { Account } from "@/types";

export const accountsService = {
  getMe: (): Promise<Account> =>
    apiRequest("/accounts/me"),
};
