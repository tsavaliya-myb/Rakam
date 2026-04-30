import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

// ── Error ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Internal raw fetch ───────────────────────────────────────────────────────

interface RawRequestOptions extends RequestInit {
  token?: string;
  firmId?: string;
  fy?: string;
}

async function rawRequest<T>(endpoint: string, options: RawRequestOptions): Promise<T> {
  const { token, firmId, fy, headers: extraHeaders, ...init } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (firmId) headers["x-firm-id"] = firmId;
  if (fy) headers["x-fy"] = fy.split("-")[0];

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as {
      message?: string;
      code?: string;
      errors?: Record<string, string[]>;
    };
    throw new ApiError(
      res.status,
      body?.code ?? "UNKNOWN_ERROR",
      body?.message ?? "Request failed",
      body?.errors
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth endpoints (no JWT, no refresh loop) ─────────────────────────────────

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
    rawRequest<{ accessToken: string; refreshToken: string; isNewUser: boolean; user: import("@/types").AuthUser }>("/auth/otp/verify", {
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

// ── Authenticated request ─────────────────────────────────────────────────────
// Attaches Bearer token + x-firm-id header; handles 401 with one silent refresh.

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const { accessToken, refreshToken, setAuth, clearAuth } = useAuthStore.getState();
  const { activeFirmId, financialYear } = useAppStore.getState();

  try {
    return await rawRequest<T>(endpoint, {
      ...options,
      token: accessToken ?? undefined,
      firmId: activeFirmId ?? undefined,
      fy: financialYear,
    });
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

// ── createApiRequest factory ──────────────────────────────────────────────────
// Creates a scoped requester with an explicit firmId instead of reading from store.
// Use in service functions that receive firmId as a parameter.

export function createApiRequest(firmId: string) {
  return function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { accessToken, refreshToken, setAuth, clearAuth } = useAuthStore.getState();
    const { financialYear } = useAppStore.getState();

    async function attempt(isRetry: boolean): Promise<T> {
      try {
        return await rawRequest<T>(endpoint, {
          ...options,
          token: accessToken ?? undefined,
          firmId,
          fy: financialYear,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401 && !isRetry && refreshToken) {
          try {
            const tokens = await authApi.refresh(refreshToken);
            setAuth(tokens);
            return attempt(true);
          } catch {
            clearAuth();
            window.location.href = "/login";
            throw err;
          }
        }
        throw err;
      }
    }

    return attempt(false);
  };
}

// ── File upload helper ────────────────────────────────────────────────────────

export async function uploadFile<T>(
  endpoint: string,
  file: File,
  extraFields?: Record<string, string>
): Promise<T> {
  const { accessToken, refreshToken, setAuth, clearAuth } = useAuthStore.getState();
  const { activeFirmId, financialYear } = useAppStore.getState();

  const formData = new FormData();
  formData.append("file", file);
  if (extraFields) {
    Object.entries(extraFields).forEach(([key, value]) => formData.append(key, value));
  }

  async function attempt(token: string | null, isRetry: boolean): Promise<T> {
    const headers: Record<string, string> = {};
    // Do NOT set Content-Type — browser sets it with the multipart boundary
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (activeFirmId) headers["x-firm-id"] = activeFirmId;
    if (financialYear) headers["x-fy"] = financialYear.split("-")[0];

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string; code?: string };

      if (res.status === 401 && !isRetry && refreshToken) {
        try {
          const tokens = await authApi.refresh(refreshToken);
          setAuth(tokens);
          return attempt(tokens.accessToken, true);
        } catch {
          clearAuth();
          window.location.href = "/login";
        }
      }

      throw new ApiError(res.status, body?.code ?? "UPLOAD_FAILED", body?.message ?? "Upload failed");
    }

    return res.json() as Promise<T>;
  }

  return attempt(accessToken, false);
}

// ── Subscription (kept here until services/subscriptions.ts is created) ───────

export const subscriptionApi = {
  getMySubscription: () => apiRequest<import("@/types").Subscription>("/subscriptions/me"),
};
