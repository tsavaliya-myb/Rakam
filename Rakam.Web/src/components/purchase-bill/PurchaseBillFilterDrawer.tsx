"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Filter, RotateCcw } from "lucide-react";
import {
  purchaseBillFilterSchema,
  type PurchaseBillFilterValues,
} from "@/lib/schemas/purchase-bill.schema";
import { cn } from "@/lib/utils";
import { usePartiesDropdown } from "@/hooks/api/use-parties";

interface PurchaseBillFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: PurchaseBillFilterValues) => void;
  defaultValues?: Partial<PurchaseBillFilterValues>;
}

export function PurchaseBillFilterDrawer({
  open,
  onClose,
  onApply,
  defaultValues,
}: PurchaseBillFilterDrawerProps) {
  const { data: parties = [] } = usePartiesDropdown();
  const { register, handleSubmit, reset } = useForm<PurchaseBillFilterValues>({
    resolver: zodResolver(purchaseBillFilterSchema),
    defaultValues: { status: "ALL", billType: "ALL", ...defaultValues },
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col border-l border-border animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-violet-700" />
            <h2 className="font-semibold text-foreground text-sm">Filter Purchase Bills</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Payment Status</label>
            <div className="grid grid-cols-2 gap-2">
              {(["ALL", "PAID", "UNPAID", "PARTIAL"] as const).map((s) => (
                <label key={s} className="cursor-pointer">
                  <input type="radio" value={s} {...register("status")} className="sr-only peer" />
                  <div className={cn(
                    "flex items-center justify-center py-2 rounded-xl text-xs font-semibold border",
                    "border-border bg-secondary text-muted-foreground cursor-pointer transition-all",
                    "peer-checked:bg-violet-50 peer-checked:border-violet-300 peer-checked:text-violet-700"
                  )}>
                    {s}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Bill Type */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Bill Type</label>
            <div className="space-y-2">
              {(["ALL", "WITH_TAX", "WITHOUT_TAX"] as const).map((t) => (
                <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" value={t} {...register("billType")} className="w-4 h-4 accent-violet-700" />
                  <span className="text-sm text-foreground group-hover:text-violet-700 transition-colors">
                    {t === "ALL" ? "All" : t === "WITH_TAX" ? "With Tax" : "Without Tax"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Supplier / Party</label>
            <select
              {...register("partyId")}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-700/10 transition-all"
            >
              <option value="">All Suppliers</option>
              {parties.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Date Range</label>
            <div className="space-y-2">
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">From</p>
                <input type="date" {...register("fromDate")}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-700/10 transition-all" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">To</p>
                <input type="date" {...register("toDate")}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-700/10 transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0">
          <button type="button" onClick={() => reset()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-secondary transition-colors">
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={handleSubmit((data) => { onApply(data); onClose(); })}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
