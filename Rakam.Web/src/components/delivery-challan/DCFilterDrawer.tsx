"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Filter, RotateCcw } from "lucide-react";
import { dcFilterSchema, type DCFilterValues } from "@/lib/schemas/delivery-challan.schema";
import { cn } from "@/lib/utils";

interface DCFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: DCFilterValues) => void;
  defaultValues?: Partial<DCFilterValues>;
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

export function DCFilterDrawer({ open, onClose, onApply, defaultValues }: DCFilterDrawerProps) {
  const { register, handleSubmit, reset } = useForm<DCFilterValues>({
    resolver: zodResolver(dcFilterSchema),
    defaultValues: { salesBillCreated: "ALL", ...defaultValues },
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col border-l border-border">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-teal-700" />
            <h2 className="font-semibold text-foreground text-sm">Filter Challans</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Bill Created */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Sales Bill Created
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["ALL", "YES", "NO"] as const).map((v) => (
                <label key={v} className="cursor-pointer">
                  <input type="radio" value={v} {...register("salesBillCreated")} className="sr-only peer" />
                  <div className={cn(
                    "flex items-center justify-center py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all",
                    "border-border bg-secondary text-muted-foreground",
                    "peer-checked:bg-teal-50 peer-checked:border-teal-300 peer-checked:text-teal-700"
                  )}>
                    {v === "ALL" ? "All" : v === "YES" ? "✓ Yes" : "✗ No"}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Party */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Party</label>
            <select {...register("partyId")}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-700/10 transition-all">
              <option value="">All Parties</option>
              {MOCK_PARTIES.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
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
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-700/10 transition-all" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">To</p>
                <input type="date" {...register("toDate")}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-700/10 transition-all" />
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
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
