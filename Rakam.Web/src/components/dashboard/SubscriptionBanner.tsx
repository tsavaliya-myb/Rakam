"use client";

import { useState } from "react";
import { X, AlertCircle, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanType } from "@/types";

interface SubscriptionBannerProps {
  remainingDays: number;
  planName: string;
  planType: PlanType;
}

export function SubscriptionBanner({
  remainingDays,
  planName,
  planType,
}: SubscriptionBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const isTrial = planType === "trial";
  const isUrgent = remainingDays <= 7;
  const isExpired = remainingDays === 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-3.5 rounded-2xl border mb-5 animate-fade-in",
        isUrgent
          ? "bg-amber-50 border-amber-200"
          : "bg-blue-50 border-blue-200"
      )}
    >
      <AlertCircle
        size={18}
        className={cn(
          "flex-shrink-0",
          isUrgent ? "text-amber-500" : "text-blue-500"
        )}
      />
      <p
        className={cn(
          "text-sm flex-1 font-medium",
          isUrgent ? "text-amber-800" : "text-blue-800"
        )}
      >
        {isExpired ? (
          <>
            Your <strong>{planName}</strong> has <strong>expired</strong>. Upgrade now to restore access.
          </>
        ) : isTrial ? (
          <>
            Your <strong>{planName}</strong> expires in{" "}
            <strong>{remainingDays} day{remainingDays !== 1 ? "s" : ""}</strong>. Upgrade now to retain all features.
          </>
        ) : (
          <>
            Your <strong>{planName}</strong> plan renews in{" "}
            <strong>{remainingDays} day{remainingDays !== 1 ? "s" : ""}</strong>.
          </>
        )}
      </p>
      <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors flex-shrink-0">
        <Rocket size={12} />
        {isTrial ? "Upgrade Plan" : "Renew Plan"}
      </button>
      <button
        onClick={() => setVisible(false)}
        className={cn(
          "flex-shrink-0 transition-colors ml-1",
          isUrgent
            ? "text-amber-400 hover:text-amber-600"
            : "text-blue-400 hover:text-blue-600"
        )}
      >
        <X size={16} />
      </button>
    </div>
  );
}
