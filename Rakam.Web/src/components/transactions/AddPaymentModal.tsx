"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ArrowLeftRight } from "lucide-react";
import { addPaymentSchema, type AddPaymentFormValues } from "@/lib/schemas/transaction.schema";
import { MOCK_PARTIES } from "@/lib/mock/parties";
import { cn } from "@/lib/utils";

interface Props {
  onClose: () => void;
  onSubmit: (data: AddPaymentFormValues) => void;
}

const today = new Date().toISOString().split("T")[0];

const inputCls = cn(
  "w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground",
  "outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-900/10 transition-all",
  "placeholder:text-muted-foreground/60"
);

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-foreground block mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-500 mt-0.5">{message}</p>;
}

export function AddPaymentModal({ onClose, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddPaymentFormValues>({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: {
      paymentDate: today,
      transactionFor: "SALES",
      partyId: "",
      paymentMode: "CASH",
      paymentAmount: 0,
      notes: "",
    },
  });

  const notesVal = watch("notes") ?? "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
              <ArrowLeftRight size={16} strokeWidth={1.8} className="text-brand-700" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">Add New Payment</h2>
              <p className="text-[11px] text-muted-foreground">Record a manual payment transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">

          {/* Payment Date */}
          <div>
            <Label>Payment Date</Label>
            <input type="date" {...register("paymentDate")} className={inputCls} />
          </div>

          {/* Transaction For */}
          <div>
            <Label>Transaction For</Label>
            <div className="flex gap-3 mt-1">
              {(["SALES", "PURCHASE"] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={opt}
                    {...register("transactionFor")}
                    className="w-4 h-4 accent-brand-900"
                  />
                  <span className="text-sm text-foreground font-medium">
                    {opt === "SALES" ? "Sales" : "Purchase"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Select Party */}
          <div>
            <Label>Select Party</Label>
            <select {...register("partyId")} className={inputCls}>
              <option value="">Select party</option>
              {MOCK_PARTIES.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Mode */}
          <div>
            <Label>Select Payment Mode</Label>
            <div className="grid grid-cols-4 gap-2">
              {(["CASH", "CHEQUE", "ONLINE", "OTHER"] as const).map((m) => (
                <label key={m}>
                  <input type="radio" value={m} {...register("paymentMode")} className="sr-only peer" />
                  <span className={cn(
                    "block text-center text-xs font-semibold py-2 rounded-xl border cursor-pointer transition-colors",
                    "peer-checked:bg-brand-900 peer-checked:text-white peer-checked:border-brand-900",
                    "border-border text-muted-foreground hover:bg-secondary"
                  )}>
                    {m === "CASH" ? "Cash" : m === "CHEQUE" ? "Cheque" : m === "ONLINE" ? "Online" : "Other"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <Label required>Payment Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("paymentAmount")}
                className={cn(inputCls, "pl-7")}
              />
            </div>
            <FieldError message={errors.paymentAmount?.message} />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <textarea
              {...register("notes")}
              placeholder="e.g. Chq#0478596 or Online Ref#BZ4859WH"
              rows={3}
              maxLength={250}
              className={cn(inputCls, "resize-none")}
            />
            <p className="text-[11px] text-muted-foreground text-right mt-0.5">
              {notesVal.length}/250
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-brand-900 text-white hover:bg-brand-800 disabled:opacity-60 transition-colors"
            >
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
