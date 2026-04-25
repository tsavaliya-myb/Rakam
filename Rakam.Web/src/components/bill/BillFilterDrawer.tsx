"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Filter, RotateCcw } from "lucide-react";
import {
  billFilterSchema,
  type BillFilterValues,
} from "@/lib/schemas/bill.schema";
import { cn } from "@/lib/utils";

interface BillFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: BillFilterValues) => void;
  defaultValues?: Partial<BillFilterValues>;
}

const MOCK_PARTIES = [
  { id: "p1", name: "Mehta Co." },
  { id: "p2", name: "Patel Enterprises" },
  { id: "p3", name: "Sharma Traders" },
  { id: "p4", name: "Joshi Limited" },
  { id: "p5", name: "Gupta & Co." },
  { id: "p6", name: "Desai Manufacturing" },
  { id: "p7", name: "Reddy Brothers" },
];

export function BillFilterDrawer({
  open,
  onClose,
  onApply,
  defaultValues,
}: BillFilterDrawerProps) {
  const { register, handleSubmit, reset } = useForm<BillFilterValues>({
    resolver: zodResolver(billFilterSchema),
    defaultValues: {
      status: "ALL",
      billType: "ALL",
      ...defaultValues,
    },
  });

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right border-l border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-brand-700" />
            <h2 className="font-semibold text-foreground text-sm">
              Filter Bills
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit((data) => { onApply(data); onClose(); })}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Payment Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["ALL", "PAID", "UNPAID", "PARTIAL"] as const).map((s) => (
                <label key={s} className="cursor-pointer">
                  <input
                    type="radio"
                    value={s}
                    {...register("status")}
                    className="sr-only peer"
                  />
                  <div
                    className={cn(
                      "flex items-center justify-center py-2 rounded-xl text-xs font-semibold border",
                      "border-border bg-secondary text-muted-foreground",
                      "peer-checked:bg-brand-50 peer-checked:border-brand-300 peer-checked:text-brand-700",
                      "transition-all cursor-pointer"
                    )}
                  >
                    {s}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Bill Type */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Bill Type
            </label>
            <div className="space-y-2">
              {(["ALL", "TAX_INVOICE", "JOB_CHALLAN"] as const).map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="radio"
                    value={t}
                    {...register("billType")}
                    className="w-4 h-4 accent-brand-700"
                  />
                  <span className="text-sm text-foreground group-hover:text-brand-700 transition-colors">
                    {t === "ALL"
                      ? "All"
                      : t === "TAX_INVOICE"
                      ? "Tax Invoice"
                      : "Job Challan"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Party */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Party
            </label>
            <select
              {...register("partyId")}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-900/10 transition-all"
            >
              <option value="">All Parties</option>
              {MOCK_PARTIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Date Range
            </label>
            <div className="space-y-2">
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">From</p>
                <input
                  type="date"
                  {...register("fromDate")}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-900/10 transition-all"
                />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">To</p>
                <input
                  type="date"
                  {...register("toDate")}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-900/10 transition-all"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
          >
            <RotateCcw size={13} />
            Reset
          </button>
          <button
            onClick={handleSubmit((data) => { onApply(data); onClose(); })}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
