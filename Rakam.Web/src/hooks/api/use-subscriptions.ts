"use client";

import { useQuery } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import { subscriptionsService } from "@/services/subscriptions";

export function useMySubscription() {
  return useQuery({
    queryKey: QK.subscription(),
    queryFn: () => subscriptionsService.getMySubscription(),
  });
}
