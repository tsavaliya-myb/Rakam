import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types";

export type { AuthUser };

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user?: AuthUser) => void;
  clearAuth: () => void;
}

const SESSION_COOKIE = "rakam_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setAuth: ({ accessToken, refreshToken }, user) => {
        setSessionCookie();
        set({ accessToken, refreshToken, user: user ?? null });
      },

      clearAuth: () => {
        clearSessionCookie();
        set({ accessToken: null, refreshToken: null, user: null });
      },
    }),
    {
      name: "rakam-auth",
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
    }
  )
);
