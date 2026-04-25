"use client";

import { useForm } from "react-hook-form";
import { X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_PARTIES } from "@/lib/mock/parties";
import type { TransactionFilterValues } from "@/lib/schemas/transaction.schema";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (v: TransactionFilterValues) => void;
  defaultValues?: Partial<TransactionFilterValues>;
}

const DEFAULT: TransactionFilterValues = {
  transactionType: "ALL",
  mode: "ALL",
  partyId: "",
  fromDate: "",
  toDate: "",
};

export function TransactionFilterDrawer({ open, onClose, onApply, defaultValues }: Props) {
  const { register, handleSubmit, reset } = useForm<TransactionFilterValues>({
    defaultValues: { ...DEFAULT, ...defaultValues },
  });

  function handleReset() {
    reset(DEFAULT);
    onApply(DEFAULT);
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed right-0 top-0 h-full z-50 w-80 bg-white shadow-2xl border-l border-border",
          "flex flex-col transition-transform duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-sm text-foreground">Filter Transactions</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((v) => { onApply(v); onClose(); })}
          className="flex-1 overflow-y-auto px-5 py-5 space-y-5"
        >
          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Transaction Type</label>
            <div className="flex gap-2">
              {(["ALL", "CREDIT", "DEBIT"] as const).map((t) => (
                <label key={t} className="flex-1">
                  <input type="radio" value={t} {...register("transactionType")} className="sr-only peer" />
                  <span className={cn(
                    "block text-center text-xs font-semibold py-2 rounded-xl border cursor-pointer transition-colors",
                    "peer-checked:bg-brand-900 peer-checked:text-white peer-checked:border-brand-900",
                    "border-border text-muted-foreground hover:bg-secondary"
                  )}>
                    {t === "ALL" ? "All" : t === "CREDIT" ? "Credit" : "Debit"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Payment Mode</label>
            <select
              {...register("mode")}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground outline-none focus:border-brand-300"
            >
              <option value="ALL">All Modes</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="ONLINE">Online</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Party */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Party</label>
            <select
              {...register("partyId")}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground outline-none focus:border-brand-300"
            >
              <option value="">All Parties</option>
              {MOCK_PARTIES.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Date Range</label>
            <div className="space-y-2">
              <input type="date" {...register("fromDate")}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground outline-none focus:border-brand-300" />
              <input type="date" {...register("toDate")}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground outline-none focus:border-brand-300" />
            </div>
          </div>
        </form>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={handleSubmit((v) => { onApply(v); onClose(); })}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-brand-900 text-white hover:bg-brand-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </aside>
    </>
  );
}
