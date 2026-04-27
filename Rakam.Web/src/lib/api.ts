import { useAuthStore } from "@/store/useAuthStore";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function rawRequest<T>(
  endpoint: string,
  options: RequestInit & { token?: string }
): Promise<T> {
  const { token, headers: extraHeaders, ...init } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new ApiError(res.status, body?.message ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Auth endpoints — no JWT, no refresh loop */
export const authApi = {
  sendOtp: (mobile: string) =>
    rawRequest<{ reqId: string }>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ mobile }),
    }),

  retryOtp: (reqId: string, retryType: "text" | "voice" = "text") =>
    rawRequest<void>("/auth/otp/retry", {
      method: "POST",
      body: JSON.stringify({ reqId, retryType }),
    }),

  verifyOtp: (reqId: string, otp: string) =>
    rawRequest<{ accessToken: string; refreshToken: string }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ reqId, otp }),
    }),

  refresh: (refreshToken: string) =>
    rawRequest<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  logout: (refreshToken: string) =>
    rawRequest<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};

/**
 * Authenticated API request — attaches Bearer token and handles 401 by
 * attempting one silent refresh before clearing session and redirecting.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const { accessToken, refreshToken, setAuth, clearAuth } = useAuthStore.getState();

  try {
    return await rawRequest<T>(endpoint, { ...options, token: accessToken ?? undefined });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && retry && refreshToken) {
      try {
        const tokens = await authApi.refresh(refreshToken);
        setAuth(tokens);
        return apiRequest<T>(endpoint, options, false);
      } catch {
        clearAuth();
        window.location.href = "/login";
        throw err;
      }
    }
    throw err;
  }
}

export const subscriptionApi = {
  getMySubscription: () => apiRequest<import("@/types").Subscription>("/subscriptions/me"),
};
