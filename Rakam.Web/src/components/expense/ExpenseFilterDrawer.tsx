"use client";

import { useForm } from "react-hook-form";
import { X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_EXPENSE_CATEGORIES, MOCK_EXPENSE_SUPPLIERS } from "@/lib/mock/expenses";

export interface ExpenseFilterValues {
  category: string;
  supplierName: string;
  mode: "ALL" | "AMOUNT" | "ITEM";
  fromDate: string;
  toDate: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (v: ExpenseFilterValues) => void;
  defaultValues?: Partial<ExpenseFilterValues>;
}

const DEFAULT: ExpenseFilterValues = {
  category: "",
  supplierName: "",
  mode: "ALL",
  fromDate: "",
  toDate: "",
};

export function ExpenseFilterDrawer({ open, onClose, onApply, defaultValues }: Props) {
  const { register, handleSubmit, reset } = useForm<ExpenseFilterValues>({
    defaultValues: { ...DEFAULT, ...defaultValues },
  });

  function handleReset() {
    reset(DEFAULT);
    onApply(DEFAULT);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed right-0 top-0 h-full z-50 w-80 bg-white shadow-2xl border-l border-border",
          "flex flex-col transition-transform duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-sm text-foreground">Filter Expenses</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit((v) => { onApply(v); onClose(); })}
          className="flex-1 overflow-y-auto px-5 py-5 space-y-5"
        >
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Category</label>
            <select
              {...register("category")}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-900/10"
            >
              <option value="">All Categories</option>
              {MOCK_EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Supplier</label>
            <select
              {...register("supplierName")}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-900/10"
            >
              <option value="">All Suppliers</option>
              {MOCK_EXPENSE_SUPPLIERS.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Type</label>
            <div className="flex gap-2">
              {(["ALL", "AMOUNT", "ITEM"] as const).map((m) => (
                <label key={m} className="flex-1">
                  <input type="radio" value={m} {...register("mode")} className="sr-only peer" />
                  <span className={cn(
                    "block text-center text-xs font-semibold py-2 rounded-xl border cursor-pointer transition-colors",
                    "peer-checked:bg-brand-900 peer-checked:text-white peer-checked:border-brand-900",
                    "border-border text-muted-foreground hover:bg-secondary"
                  )}>
                    {m === "ALL" ? "All" : m === "AMOUNT" ? "Amount" : "Item"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Date Range</label>
            <div className="space-y-2">
              <input
                type="date"
                {...register("fromDate")}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground outline-none focus:border-brand-300"
              />
              <input
                type="date"
                {...register("toDate")}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground outline-none focus:border-brand-300"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
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
