"use client";

import { useWatch, useFormContext } from "react-hook-form";
import type { DCFormValues } from "@/lib/schemas/delivery-challan.schema";

export function DCTotals() {
  const { control } = useFormContext<DCFormValues>();
  const lineItems = useWatch({ control, name: "lineItems" }) ?? [];

  const totalQty    = lineItems.reduce((s, i) => s + (Number(i?.qty)  || 0), 0);
  const netAmount   = lineItems.reduce((s, i) => s + (Number(i?.qty) || 0) * (Number(i?.rate) || 0), 0);
  const totalAmount = netAmount; // DC has no bill-level discount

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const row = "flex items-center justify-between py-2";
  const lbl = "text-xs text-muted-foreground";
  const val = "text-xs font-semibold text-foreground tabular-nums";

  return (
    <div className="bg-white rounded-2xl border border-border p-5 min-w-[260px]">
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
        Summary
      </h3>
      <div className="divide-y divide-border">
        <div className={row}>
          <span className={lbl}>Total Qty</span>
          <span className={val}>{fmt(totalQty)}</span>
        </div>
        <div className={row}>
          <span className={lbl}>Net Amount</span>
          <span className={val}>₹ {fmt(netAmount)}</span>
        </div>
        <div className="pt-3 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Total Amount</span>
            <span className="text-lg font-bold text-teal-700 tabular-nums">₹ {fmt(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
