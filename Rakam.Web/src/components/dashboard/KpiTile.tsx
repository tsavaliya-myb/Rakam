"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiTileProps {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  accent: string;
  accentBg: string;
}

export function KpiTile({ label, value, change, icon, accent, accentBg }: KpiTileProps) {
  const isUp = change >= 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-border">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground leading-tight text-pretty max-w-[70%]">
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: accentBg }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
      </div>

      <p className="text-2xl font-bold text-foreground tabular-nums">
        {value}
      </p>

      <div className="mt-2 flex items-center gap-1.5">
        <span
          className={cn(
            "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
            isUp
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          )}
        >
          {isUp ? (
            <TrendingUp size={11} />
          ) : (
            <TrendingDown size={11} />
          )}
          {Math.abs(change)}%
        </span>
        <span className="text-[11px] text-muted-foreground">vs last month</span>
      </div>
    </div>
  );
}
