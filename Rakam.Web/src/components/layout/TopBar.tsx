"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell, Globe, ChevronDown, LogOut, LayoutGrid, Search, FileText, Package, Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/auth";
import { useGlobalSearch } from "@/hooks/api/use-dashboard";
import { useProfile } from "@/hooks/api/use-settings";
import { cn } from "@/lib/utils";

const FY_OPTIONS = ["2024-25", "2025-26", "2026-27", "2027-28"];

function getInitials(firstName?: string | null, lastName?: string | null, mobile?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (mobile) return mobile.slice(-2);
  return "Me";
}

export function TopBar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { financialYear, setFinancialYear } = useAppStore();
  const { refreshToken, clearAuth } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: profile } = useProfile();

  const initials = getInitials(profile?.firstName, profile?.lastName, profile?.mobile);
  const displayName = profile?.firstName || profile?.lastName
    ? `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()
    : profile?.mobile ?? "";
  const displayEmail = profile?.email ?? profile?.mobile ?? "";

  async function handleLogout() {
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // proceed with local logout even if API call fails
    } finally {
      clearAuth();
      queryClient.clear();
      router.replace("/login");
    }
  }
  const [fyOpen, setFyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isFetching: searchFetching } = useGlobalSearch(searchQuery);

  const hasResults = searchResults && (
    searchResults.parties.length > 0 ||
    searchResults.products.length > 0 ||
    searchResults.salesBills.length > 0 ||
    searchResults.purchaseBills.length > 0
  );

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ⌘K / Ctrl+K to focus search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = searchRef.current?.querySelector("input");
        input?.focus();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="h-[62px] flex-shrink-0 bg-white border-b border-border flex items-center px-6 gap-4 z-10 relative">

      {/* ── Global Search ── */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
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

        {/* Search results dropdown */}
        {searchOpen && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-border py-2 z-50 max-h-80 overflow-y-auto animate-fade-in">
            {searchFetching && (
              <p className="px-4 py-3 text-xs text-muted-foreground">Searching…</p>
            )}

            {!searchFetching && !hasResults && (
              <p className="px-4 py-3 text-xs text-muted-foreground">No results found.</p>
            )}

            {!searchFetching && searchResults && searchResults.parties.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Parties
                </p>
                {searchResults.parties.map((p) => (
                  <button
                    key={p.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-50 transition-colors"
                    onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                  >
                    <Users size={13} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground font-medium truncate">{p.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground capitalize">{p.type.toLowerCase()}</span>
                  </button>
                ))}
              </div>
            )}

            {!searchFetching && searchResults && searchResults.products.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Products
                </p>
                {searchResults.products.map((p) => (
                  <button
                    key={p.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-50 transition-colors"
                    onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                  >
                    <Package size={13} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground font-medium truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}

            {!searchFetching && searchResults && searchResults.salesBills.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Sales Bills
                </p>
                {searchResults.salesBills.map((b) => (
                  <button
                    key={b.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-50 transition-colors"
                    onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                  >
                    <FileText size={13} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground font-medium">{b.billNo}</span>
                    <span className="text-xs text-muted-foreground truncate ml-1">— {b.partyName}</span>
                  </button>
                ))}
              </div>
            )}

            {!searchFetching && searchResults && searchResults.purchaseBills.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Purchase Bills
                </p>
                {searchResults.purchaseBills.map((b) => (
                  <button
                    key={b.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-50 transition-colors"
                    onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                  >
                    <FileText size={13} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground font-medium">{b.billNo}</span>
                    <span className="text-xs text-muted-foreground truncate ml-1">— {b.partyName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
              <span className="text-white text-xs font-bold select-none">{initials}</span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {displayName || "My Account"}
              </p>
              <p className="text-[10px] text-muted-foreground">Admin</p>
            </div>
            <ChevronDown size={13} className="text-muted-foreground" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-border py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-border mb-1">
                <p className="text-xs font-semibold text-foreground truncate">{displayName || "My Account"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{displayEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
              >
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
