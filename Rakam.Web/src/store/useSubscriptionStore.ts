import { create } from "zustand";
import type { Subscription } from "@/types";

interface SubscriptionStore {
  subscription: Subscription | null;
  isLoading: boolean;
  hasFetched: boolean;
  fetchSubscription: () => Promise<void>;
  clear: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  isLoading: false,
  hasFetched: false,

  fetchSubscription: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const { subscriptionsService } = await import("@/services/subscriptions");
      const data = await subscriptionsService.getMySubscription();
      set({ subscription: data, isLoading: false, hasFetched: true });
    } catch {
      set({ isLoading: false, hasFetched: true });
    }
  },

  clear: () => set({ subscription: null, isLoading: false, hasFetched: false }),
}));
