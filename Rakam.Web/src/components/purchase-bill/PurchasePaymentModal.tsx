"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, CreditCard, Calendar, StickyNote } from "lucide-react";
import {
  purchasePaymentSchema,
  type PurchasePaymentFormValues,
} from "@/lib/schemas/purchase-bill.schema";
import { cn, formatCurrency } from "@/lib/utils";
import type { PurchaseBill } from "@/types";

interface PurchasePaymentModalProps {
  bill: PurchaseBill;
  onClose: () => void;
  onSubmit: (data: PurchasePaymentFormValues) => void;
}

const PAYMENT_MODES = ["Cash", "Cheque", "Online", "Other"] as const;

export function PurchasePaymentModal({ bill, onClose, onSubmit }: PurchasePaymentModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<PurchasePaymentFormValues>({
      resolver: zodResolver(purchasePaymentSchema),
      defaultValues: {
        billNo: bill.billNo,
        paymentDate: today,
        transactionAmount: bill.pendingAmount,
        paymentMode: "Cash",
        settlementAmount: 0,
        note: "",
      },
    });

  const inputCls = cn(
    "w-full px-3 py-2 text-sm rounded-xl border bg-secondary text-foreground outline-none transition-all",
    "focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-700/10"
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <CreditCard size={16} strokeWidth={1.8} className="text-violet-700" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">Record Payment</h2>
              <p className="text-[11px] text-muted-foreground">{bill.billNo} · {bill.partyName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Summary */}
        <div className="mx-6 mt-4 p-4 rounded-xl bg-secondary border border-border grid grid-cols-2 gap-3">
          {[
            { label: "Bill No.", value: bill.billNo },
            { label: "Supplier", value: bill.partyName },
            { label: "Net Amount", value: formatCurrency(bill.netAmount) },
            { label: "Total Amount", value: formatCurrency(bill.totalAmount) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">{value}</p>
            </div>
          ))}
          <div className="col-span-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Pending Amount</p>
            <p className="text-base font-bold text-violet-700 mt-0.5 tabular-nums">
              {formatCurrency(bill.pendingAmount)}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 pt-4 space-y-4">

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Payment Date <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input type="date" {...register("paymentDate")}
                className={cn(inputCls, "pl-8", errors.paymentDate ? "border-destructive" : "border-border")} />
            </div>
          </div>

          {/* Transaction Amount */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Transaction Amount (₹) <span className="text-destructive">*</span>
            </label>
            <input type="number" step="0.01" {...register("transactionAmount")}
              className={cn(inputCls, "tabular-nums", errors.transactionAmount ? "border-destructive" : "border-border")} />
            {errors.transactionAmount && (
              <p className="text-[11px] text-destructive mt-1">{errors.transactionAmount.message}</p>
            )}
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Payment Mode <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_MODES.map((mode) => (
                <label key={mode} className="relative cursor-pointer">
                  <input type="radio" value={mode} {...register("paymentMode")} className="sr-only peer" />
                  <div className="flex items-center justify-center py-2 rounded-xl text-xs font-semibold border border-border bg-secondary text-muted-foreground peer-checked:bg-violet-50 peer-checked:border-violet-300 peer-checked:text-violet-700 transition-all cursor-pointer">
                    {mode}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Settlement */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Settlement Amount (₹)
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </label>
            <input type="number" step="0.01" {...register("settlementAmount")}
              className={cn(inputCls, "border-border tabular-nums")} />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              <span className="flex items-center gap-1"><StickyNote size={12} /> Note</span>
            </label>
            <textarea rows={2} placeholder="e.g. Chq#0478596 or NEFT Ref#XYZ123"
              {...register("note")}
              className={cn(inputCls, "border-border resize-none placeholder:text-muted-foreground/60")} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 transition-colors disabled:opacity-60">
              {isSubmitting ? "Saving…" : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
