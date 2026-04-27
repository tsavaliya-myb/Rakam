"use client";

import { useEffect } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
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
  const { subscription, hasFetched, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    if (!hasFetched) fetchSubscription();
  }, [hasFetched, fetchSubscription]);

  const showBanner =
    subscription !== null &&
    subscription.isActive &&
    (subscription.planType === "trial" || subscription.remainingDays <= 30);

  return (
    <div className="p-6">

      {showBanner && (
        <SubscriptionBanner
          remainingDays={subscription!.remainingDays}
          planName={subscription!.planName}
          planType={subscription!.planType}
        />
      )}

      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back. Here&apos;s your business overview for FY {financialYear}.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
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

          <Link
            href="/bill/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap bg-gradient-to-r from-brand-900 to-brand-600"
          >
            <Plus size={16} />
            New Bill
          </Link>
        </div>
      </div>

      {!showStatistics && (
        <>
          <ModuleCards />
          <QuickStats />
        </>
      )}

      {showStatistics && (
        <StatisticsPanel stats={MOCK_STATS} financialYear={financialYear} />
      )}
    </div>
  );
}
