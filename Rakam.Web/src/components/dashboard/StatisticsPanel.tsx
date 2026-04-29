"use client";

import { FileText, ShoppingCart, Receipt, TrendingUp } from "lucide-react";
import { KpiTile } from "./KpiTile";
import { SalesBarChart, PurchaseBarChart, GstDonutChart } from "./Charts";
import { ErrorState } from "@/components/ui/error-state";
import type { DashboardStats } from "@/types";

function fmtINR(v: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
}

function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-xl ${className ?? ""}`} />;
}

interface StatisticsPanelProps {
  stats: DashboardStats | null;
  isLoading: boolean;
  isError: boolean;
  financialYear: string;
}

export function StatisticsPanel({ stats, isLoading, isError, financialYear }: StatisticsPanelProps) {
  if (isError) {
    return (
      <ErrorState
        message="Failed to load statistics. Please try again."
        className="py-20"
      />
    );
  }

  const fyLabel = `01/04/${financialYear.slice(0, 4)} ~ 31/03/${financialYear.slice(5)}`;
  const salesData = stats?.salesPartyData ?? [];
  const purchaseData = (stats?.purchasePartyData ?? []).map((d) => ({
    ...d,
    paid: d.paid ?? 0,
  }));

  return (
    <div className="space-y-5">

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl px-5 py-4 flex flex-wrap items-center gap-3 border border-border">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          Filters
        </span>
        <select className="px-3 py-2 rounded-xl text-xs font-medium outline-none border border-border bg-secondary text-foreground focus:border-brand-300 transition-colors">
          <option>All Parties</option>
        </select>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground border border-border bg-secondary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
          </svg>
          {fyLabel}
        </div>
        <button className="text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors">
          Reset
        </button>
      </div>

      {/* ── KPI Tiles ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonBox key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiTile
            label="Total Sales"
            value={fmtINR(stats?.totalSales ?? 0)}
            change={stats?.salesChange ?? 0}
            accent="#16532d"
            accentBg="#f0faf3"
            icon={<FileText size={17} strokeWidth={1.8} />}
          />
          <KpiTile
            label="Total Purchase"
            value={fmtINR(stats?.totalPurchase ?? 0)}
            change={stats?.purchaseChange ?? 0}
            accent="#7c3aed"
            accentBg="#faf5ff"
            icon={<ShoppingCart size={17} strokeWidth={1.8} />}
          />
          <KpiTile
            label="Total Expense"
            value={fmtINR(stats?.totalExpense ?? 0)}
            change={stats?.expenseChange ?? 0}
            accent="#dc2626"
            accentBg="#fef2f2"
            icon={<Receipt size={17} strokeWidth={1.8} />}
          />
          <KpiTile
            label="Net Income"
            value={fmtINR(stats?.netIncome ?? 0)}
            change={stats?.incomeChange ?? 0}
            accent="#0369a1"
            accentBg="#f0f9ff"
            icon={<TrendingUp size={17} strokeWidth={1.8} />}
          />
        </div>
      )}

      {/* ── Bar Charts ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkeletonBox className="h-64" />
          <SkeletonBox className="h-64" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SalesBarChart data={salesData as any} />
          <PurchaseBarChart data={purchaseData} />
        </div>
      )}

      {/* ── Donut Charts ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkeletonBox className="h-64" />
          <SkeletonBox className="h-64" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GstDonutChart
            title="Total Sales"
            total={fmtINR(stats?.totalSales ?? 0)}
            withGst={0}
            withoutGst={0}
            colors={["#3b82f6", "#22c55e"]}
          />
          <GstDonutChart
            title="Total Purchase"
            total={fmtINR(stats?.totalPurchase ?? 0)}
            withGst={0}
            withoutGst={0}
            colors={["#8b5cf6", "#f59e0b"]}
          />
        </div>
      )}
    </div>
  );
}
