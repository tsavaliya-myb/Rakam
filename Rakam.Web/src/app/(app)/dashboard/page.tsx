"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import { ModuleCards } from "@/components/dashboard/ModuleCards";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { StatisticsPanel } from "@/components/dashboard/StatisticsPanel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const MOCK_STATS = {
  totalSales: 412000,
  totalPurchase: 255000,
  totalExpense: 38500,
  netIncome: 118500,
  salesChange: 12.4,
  purchaseChange: -3.2,
  expenseChange: 5.8,
  incomeChange: 18.6,
};

export default function DashboardPage() {
  const { showStatistics, toggleStatistics, financialYear } = useAppStore();

  return (
    <div className="p-6">

      {/* Subscription alert */}
      <SubscriptionBanner
        remainingDays={5}
        planName="Trial Plan"
        planType="trial"
      />

      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, Arun. Here&apos;s your business overview for FY {financialYear}.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Statistics toggle */}
          <div className="flex items-center gap-2.5 bg-white rounded-xl px-4 py-2.5 border border-border">
            <Switch
              id="show-stats"
              checked={showStatistics}
              onCheckedChange={toggleStatistics}
            />
            <Label
              htmlFor="show-stats"
              className="text-xs font-semibold text-muted-foreground cursor-pointer whitespace-nowrap select-none"
            >
              Show Statistics
            </Label>
          </div>

          {/* New Bill CTA */}
          <Link
            href="/bill/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap bg-gradient-to-r from-brand-900 to-brand-600"
          >
            <Plus size={16} />
            New Bill
          </Link>
        </div>
      </div>

      {/* ── Module Cards View (stats OFF) ── */}
      {!showStatistics && (
        <>
          <ModuleCards />
          <QuickStats />
        </>
      )}

      {/* ── Statistics View (stats ON) ── */}
      {showStatistics && (
        <StatisticsPanel stats={MOCK_STATS} financialYear={financialYear} />
      )}
    </div>
  );
}
