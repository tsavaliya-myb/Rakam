"use client";

import { cn } from "@/lib/utils";
import type { BillStatus } from "@/types";

interface StatusBadgeProps {
  status: BillStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  BillStatus,
  { label: string; className: string }
> = {
  PAID: {
    label: "PAID",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  UNPAID: {
    label: "UNPAID",
    className: "bg-red-100 text-red-600 border-red-200",
  },
  PARTIAL: {
    label: "PARTIAL",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-wide",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
