import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NavItemId } from "@/types";

interface AppState {
  // ── Sidebar ─────────────────────────────────
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  // ── Active Firm ──────────────────────────────
  activeFirmId: string;
  activeFirmName: string;
  setActiveFirm: (id: string, name: string) => void;

  // ── Financial Year ───────────────────────────
  financialYear: string;
  setFinancialYear: (fy: string) => void;

  // ── Dashboard ────────────────────────────────
  showStatistics: boolean;
  toggleStatistics: () => void;
  setShowStatistics: (v: boolean) => void;

  // ── Active Nav (for non-Next routing contexts) ──
  activeNav: NavItemId;
  setActiveNav: (id: NavItemId) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      // Firm
      activeFirmId: "firm-1",
      activeFirmName: "Shreeji Traders",
      setActiveFirm: (id, name) =>
        set({ activeFirmId: id, activeFirmName: name }),

      // FY
      financialYear: "2026-27",
      setFinancialYear: (fy) => set({ financialYear: fy }),

      // Dashboard
      showStatistics: false,
      toggleStatistics: () =>
        set((s) => ({ showStatistics: !s.showStatistics })),
      setShowStatistics: (v) => set({ showStatistics: v }),

      // Active nav
      activeNav: "dashboard",
      setActiveNav: (id) => set({ activeNav: id }),
    }),
    {
      name: "rakam-app-store",
      // Only persist UI prefs, not ephemeral state
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        activeFirmId: s.activeFirmId,
        activeFirmName: s.activeFirmName,
        financialYear: s.financialYear,
        showStatistics: s.showStatistics,
      }),
    }
  )
);
