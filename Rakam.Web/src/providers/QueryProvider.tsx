"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { isApiError } from "@/lib/api-error";

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (!isApiError(error)) {
          toast.error("Something went wrong. Please try again.");
          return;
        }
        const { status, message } = error;
        if (status >= 500) {
          toast.error("Server error. Please try again.");
        } else if (status === 403) {
          toast.error("You do not have permission to perform this action.");
        } else if (status === 429) {
          toast.error("Too many requests. Please slow down.");
        } else if (status === 404) {
          // 404s are handled inline per component — no global toast
        } else if (status !== 401) {
          // 401 is handled by the API client (token refresh / redirect)
          toast.error(message ?? "Request failed.");
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Never retry on 4xx — they won't change without a different request
          if (isApiError(error) && error.status < 500) return false;
          return failureCount < 1;
        },
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
