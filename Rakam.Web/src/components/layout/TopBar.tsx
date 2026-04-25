"use client";

import { useState } from "react";
import {
  Bell, Globe, ChevronDown, LogOut, LayoutGrid, Search,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const FY_OPTIONS = ["2024-25", "2025-26", "2026-27", "2027-28"];

export function TopBar() {
  const { financialYear, setFinancialYear } = useAppStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [fyOpen, setFyOpen] = useState(false);

  return (
    <header className="h-[62px] flex-shrink-0 bg-white border-b border-border flex items-center px-6 gap-4 z-10 relative">

      {/* ── Global Search ── */}
      <div className="flex-1 max-w-md relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search modules, bills, products..."
          className={cn(
            "w-full pl-9 pr-12 py-2 text-sm rounded-xl outline-none transition-all",
            "bg-secondary border border-border text-foreground placeholder:text-muted-foreground",
            "focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-900/10"
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground/50 select-none hidden md:block">
          ⌘K
        </span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">

        {/* View Demo */}
        <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-colors">
          <LayoutGrid size={13} strokeWidth={1.8} />
          View Demo
        </button>

        {/* Financial Year */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setFyOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-foreground bg-secondary border border-border hover:bg-muted transition-colors"
          >
            FY {financialYear}
            <ChevronDown size={12} />
          </button>
          {fyOpen && (
            <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-lg border border-border py-1 z-50 animate-fade-in">
              {FY_OPTIONS.map((fy) => (
                <button
                  key={fy}
                  onClick={() => { setFinancialYear(fy); setFyOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-brand-50",
                    financialYear === fy
                      ? "text-brand-700 bg-brand-50"
                      : "text-foreground"
                  )}
                >
                  FY {fy}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language */}
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors">
          <Globe size={17} strokeWidth={1.8} />
        </button>

        {/* Notifications */}
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors relative">
          <Bell size={17} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Profile */}
        <div className="relative ml-1">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl border border-border hover:bg-secondary transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-900 to-brand-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold select-none">AS</span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-foreground leading-tight">
                Arun Sharma
              </p>
              <p className="text-[10px] text-muted-foreground">Admin</p>
            </div>
            <ChevronDown size={13} className="text-muted-foreground" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-border py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-border mb-1">
                <p className="text-xs font-semibold text-foreground">Arun Sharma</p>
                <p className="text-[10px] text-muted-foreground">arun@shreeji.com</p>
              </div>
              <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdowns */}
      {(profileOpen || fyOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setProfileOpen(false); setFyOpen(false); }}
        />
      )}
    </header>
  );
}
