"use client";

import { useWatch, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { PurchaseBillFormValues } from "@/lib/schemas/purchase-bill.schema";

interface PurchaseBillTotalsProps {
  applyGst: boolean;
  gstPercent?: number;
}

export function PurchaseBillTotals({ applyGst, gstPercent = 18 }: PurchaseBillTotalsProps) {
  const { control } = useFormContext<PurchaseBillFormValues>();
  const lineItems = useWatch({ control, name: "lineItems" }) ?? [];

  const totalQty = lineItems.reduce((s, i) => s + (Number(i?.qty) || 0), 0);

  const netAmount = lineItems.reduce((s, i) => {
    return s + (Number(i?.qty) || 0) * (Number(i?.rate) || 0);
  }, 0);

  const discountAmount = lineItems.reduce((s, i) => {
    const base = (Number(i?.qty) || 0) * (Number(i?.rate) || 0);
    return s + (base * (Number(i?.discount) || 0)) / 100;
  }, 0);

  const taxableAmount = netAmount - discountAmount;
  const taxAmount     = applyGst ? (taxableAmount * gstPercent) / 100 : 0;
  const totalAmount   = taxableAmount + taxAmount;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const row = "flex items-center justify-between py-2";
  const lbl = "text-xs text-muted-foreground";
  const val = "text-xs font-semibold text-foreground tabular-nums";

  return (
    <div className="bg-white rounded-2xl border border-border p-5 min-w-[280px]">
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
        Bill Summary
      </h3>

      <div className="divide-y divide-border">
        <div className={row}>
          <span className={lbl}>Total Qty</span>
          <span className={cn(val, "tabular-nums")}>{fmt(totalQty)}</span>
        </div>
        <div className={row}>
          <span className={lbl}>Net Amount</span>
          <span className={val}>₹ {fmt(netAmount)}</span>
        </div>
        <div className={row}>
          <span className={lbl}>Discount Amount</span>
          <span className={cn(val, discountAmount > 0 && "text-red-600")}>
            − ₹ {fmt(discountAmount)}
          </span>
        </div>
        {applyGst && (
          <>
            <div className={row}>
              <span className={lbl}>Taxable Amount</span>
              <span className={val}>₹ {fmt(taxableAmount)}</span>
            </div>
            <div className={row}>
              <span className={lbl}>Tax Amount ({gstPercent}%)</span>
              <span className={cn(val, "text-blue-600")}>+ ₹ {fmt(taxAmount)}</span>
            </div>
          </>
        )}
        <div className="pt-3 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Total Amount</span>
            <span className="text-lg font-bold text-violet-700 tabular-nums">₹ {fmt(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
