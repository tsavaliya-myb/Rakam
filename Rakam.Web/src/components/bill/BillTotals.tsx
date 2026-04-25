"use client";

import { useWatch, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { BillFormValues } from "@/lib/schemas/bill.schema";

interface BillTotalsProps {
  applyGst: boolean;
  gstPercent?: number;
}

export function BillTotals({ applyGst, gstPercent = 18 }: BillTotalsProps) {
  const { register, control } = useFormContext<BillFormValues>();

  const lineItems = useWatch({ control, name: "lineItems" }) ?? [];
  const discountPercent = useWatch({ control, name: "discountPercent" }) ?? 0;

  // Calculations
  const netAmount = lineItems.reduce((sum, item) => {
    const qty = Number(item?.qty) || 0;
    const rate = Number(item?.rate) || 0;
    return sum + qty * rate;
  }, 0);

  const itemDiscounts = lineItems.reduce((sum, item) => {
    const qty = Number(item?.qty) || 0;
    const rate = Number(item?.rate) || 0;
    const disc = Number(item?.discount) || 0;
    return sum + (qty * rate * disc) / 100;
  }, 0);

  const billDiscount = (netAmount * Number(discountPercent)) / 100;
  const totalDiscount = itemDiscounts + billDiscount;
  const taxableAmount = netAmount - totalDiscount;
  const taxAmount = applyGst ? (taxableAmount * gstPercent) / 100 : 0;
  const totalAmount = taxableAmount + taxAmount;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const rowCls = "flex items-center justify-between py-2";
  const labelCls = "text-xs text-muted-foreground";
  const valueCls = "text-xs font-semibold text-foreground tabular-nums";

  return (
    <div className="bg-white rounded-2xl border border-border p-5 min-w-[280px]">
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
        Bill Summary
      </h3>

      <div className="space-y-0 divide-y divide-border">
        <div className={rowCls}>
          <span className={labelCls}>Net Amount</span>
          <span className={valueCls}>₹ {fmt(netAmount)}</span>
        </div>

        <div className={rowCls}>
          <span className={labelCls}>Discount Amount</span>
          <span className={cn(valueCls, totalDiscount > 0 && "text-red-600")}>
            − ₹ {fmt(totalDiscount)}
          </span>
        </div>

        {applyGst && (
          <>
            <div className={rowCls}>
              <span className={labelCls}>Taxable Amount</span>
              <span className={valueCls}>₹ {fmt(taxableAmount)}</span>
            </div>
            <div className={rowCls}>
              <span className={labelCls}>Tax Amount ({gstPercent}%)</span>
              <span className={cn(valueCls, "text-blue-600")}>
                + ₹ {fmt(taxAmount)}
              </span>
            </div>
          </>
        )}

        <div className="pt-3 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Total Amount</span>
            <span className="text-lg font-bold text-brand-900 tabular-nums">
              ₹ {fmt(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Bill-wise Discount input */}
      <div className="mt-4 pt-4 border-t border-border">
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          Bill Discount (%)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="0.00"
          {...register("discountPercent")}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none tabular-nums",
            "focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-900/10 transition-all"
          )}
        />
      </div>
    </div>
  );
}
