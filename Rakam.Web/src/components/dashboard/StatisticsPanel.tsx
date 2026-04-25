"use client";

import { FileText, ShoppingCart, Receipt, TrendingUp } from "lucide-react";
import { KpiTile } from "./KpiTile";
import { SalesBarChart, PurchaseBarChart, GstDonutChart } from "./Charts";
import type { DashboardStats, PartyBarData } from "@/types";

const SALES_DATA: PartyBarData[] = [
  { label: "Mehta Co.",   total: 85000,  received: 62000, pending: 23000 },
  { label: "Patel Ent.",  total: 120000, received: 90000, pending: 30000 },
  { label: "Sharma T.",   total: 45000,  received: 45000, pending: 0 },
  { label: "Joshi Ltd.",  total: 67000,  received: 40000, pending: 27000 },
  { label: "Gupta & Co.", total: 95000,  received: 72000, pending: 23000 },
  { label: "Desai Mfg.",  total: 55000,  received: 30000, pending: 25000 },
];

const PURCHASE_DATA = [
  { label: "RK Mills",    total: 55000, paid: 55000, pending: 0 },
  { label: "Agarwal S.", total: 88000, paid: 60000, pending: 28000 },
  { label: "VK Traders", total: 42000, paid: 30000, pending: 12000 },
  { label: "Suresh T.",  total: 70000, paid: 50000, pending: 20000 },
  { label: "Modi Corp.", total: 38000, paid: 25000, pending: 13000 },
];

interface StatisticsPanelProps {
  stats: DashboardStats;
  financialYear: string;
}

export function StatisticsPanel({ stats, financialYear }: StatisticsPanelProps) {
  return (
    <div className="space-y-5">

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl px-5 py-4 flex flex-wrap items-center gap-3 border border-border">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          Filters
        </span>
        <select className="px-3 py-2 rounded-xl text-xs font-medium outline-none border border-border bg-secondary text-foreground focus:border-brand-300 transition-colors">
          <option>All Parties</option>
          <option>Mehta Co.</option>
          <option>Patel Enterprises</option>
          <option>Sharma Traders</option>
        </select>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground border border-border bg-secondary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
          </svg>
          01/04/2026 ~ 31/03/2027
        </div>
        <button className="text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors">
          Reset
        </button>
      </div>

      {/* ── KPI Tiles ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Total Sales"
          value="₹4,12,000"
          change={stats.salesChange}
          accent="#16532d"
          accentBg="#f0faf3"
          icon={<FileText size={17} strokeWidth={1.8} />}
        />
        <KpiTile
          label="Total Purchase"
          value="₹2,55,000"
          change={stats.purchaseChange}
          accent="#7c3aed"
          accentBg="#faf5ff"
          icon={<ShoppingCart size={17} strokeWidth={1.8} />}
        />
        <KpiTile
          label="Total Expense"
          value="₹38,500"
          change={stats.expenseChange}
          accent="#dc2626"
          accentBg="#fef2f2"
          icon={<Receipt size={17} strokeWidth={1.8} />}
        />
        <KpiTile
          label="Net Income"
          value="₹1,18,500"
          change={stats.incomeChange}
          accent="#0369a1"
          accentBg="#f0f9ff"
          icon={<TrendingUp size={17} strokeWidth={1.8} />}
        />
      </div>

      {/* ── Bar Charts ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesBarChart data={SALES_DATA as any} />
        <PurchaseBarChart data={PURCHASE_DATA} />
      </div>

      {/* ── Donut Charts ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GstDonutChart
          title="Total Sales"
          total="₹4,12,000"
          withGst={285000}
          withoutGst={127000}
          colors={["#3b82f6", "#22c55e"]}
        />
        <GstDonutChart
          title="Total Purchase"
          total="₹2,55,000"
          withGst={180000}
          withoutGst={75000}
          colors={["#8b5cf6", "#f59e0b"]}
        />
      </div>
    </div>
  );
}
