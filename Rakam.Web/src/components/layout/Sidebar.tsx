"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, ShoppingCart, Truck, Zap,
  Building2, Users, Package, Receipt, ArrowLeftRight,
  BarChart3, Settings, PanelLeftClose, PanelLeftOpen,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { NAV_ITEMS } from "@/config/constants";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, FileText, ShoppingCart, Truck, Zap,
  Building2, Users, Package, Receipt, ArrowLeftRight,
  BarChart3, Settings,
};

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, activeFirmName, financialYear } =
    useAppStore();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-white border-r border-border",
        "transition-[width] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]",
        "flex-shrink-0 overflow-hidden z-20",
        sidebarCollapsed ? "w-16" : "w-[228px]"
      )}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 h-[62px] border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-brand-900 to-brand-500 shadow-sm">
          <span className="text-white font-extrabold text-sm select-none">R</span>
        </div>
        {!sidebarCollapsed && (
          <span className="font-extrabold text-[15px] tracking-tight text-brand-900 select-none truncate">
            Rakam
          </span>
        )}
      </div>

      {/* ── Firm Chip ── */}
      {!sidebarCollapsed && (
        <div className="mx-3 mt-3 mb-1 flex-shrink-0">
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-colors text-left group">
            <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-xs text-brand-900">
                {activeFirmName.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {activeFirmName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                FY {financialYear}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 group-hover:text-brand-700 transition-colors" />
          </button>
        </div>
      )}

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.id}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition-colors duration-150 group",
                sidebarCollapsed
                  ? "justify-center px-0 py-[10px]"
                  : "gap-2.5 px-3 py-[9px]",
                isActive
                  ? "bg-brand-50 text-brand-900 font-semibold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              {Icon && (
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={cn(
                    "flex-shrink-0 transition-colors",
                    isActive
                      ? "text-brand-700"
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
              )}
              {!sidebarCollapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {!sidebarCollapsed && isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Collapse Toggle ── */}
      <div className="p-2 border-t border-border flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-muted-foreground hover:text-slate-700 hover:bg-slate-50 transition-colors text-xs font-medium"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={17} strokeWidth={1.8} />
          ) : (
            <>
              <PanelLeftClose size={17} strokeWidth={1.8} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
