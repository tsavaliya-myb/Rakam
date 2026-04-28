import { apiRequest } from "@/lib/api";
import type { Subscription } from "@/types";

export const subscriptionsService = {
  getMySubscription: (): Promise<Subscription> =>
    apiRequest("/subscriptions/me"),
};
