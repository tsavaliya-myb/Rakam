"use client";

import { useState } from "react";
import { Plus, Zap, Loader2, ChevronDown, X } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useEwayBills, useCreateEwayBill } from "@/hooks/api/use-eway-bills";
import { usePartiesDropdown } from "@/hooks/api/use-parties";
import type { EwayBill, CreateEwayBillDto } from "@/types";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:    "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
  EXPIRED:   "bg-orange-50 text-orange-700 border-orange-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
      STATUS_BADGE[status] ?? "bg-secondary text-foreground border-border"
    )}>
      {status}
    </span>
  );
}

/* ── Create E-Way Bill Modal ── */
function CreateEwayBillModal({ onClose }: { onClose: () => void }) {
  const { data: parties } = usePartiesDropdown();
  const createMutation = useCreateEwayBill();

  const [form, setForm] = useState<CreateEwayBillDto>({
    partyId: "",
    salesBillId: "",
    vehicleNo: "",
    distance: undefined,
    transporterName: "",
    transporterId: "",
  });

  const inp = cn(
    "w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none",
    "focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-900/10 transition-all"
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.partyId) {
      toast.error("Please select a party");
      return;
    }
    const dto: CreateEwayBillDto = {
      partyId: form.partyId,
      salesBillId: form.salesBillId || undefined,
      vehicleNo: form.vehicleNo || undefined,
      distance: form.distance || undefined,
      transporterName: form.transporterName || undefined,
      transporterId: form.transporterId || undefined,
    };
    createMutation.mutate(dto, { onSuccess: onClose });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Create E-Way Bill</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Party */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Party <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.partyId}
                onChange={(e) => setForm((p) => ({ ...p, partyId: e.target.value }))}
                className={cn(inp, "pr-8 appearance-none", !form.partyId && "text-muted-foreground")}
              >
                <option value="">Select party</option>
                {(parties ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Sales Bill ID */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Sales Bill ID <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              value={form.salesBillId ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, salesBillId: e.target.value }))}
              placeholder="Link to a sales bill..."
              className={inp}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Vehicle No */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Vehicle No.</label>
              <input
                value={form.vehicleNo ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, vehicleNo: e.target.value }))}
                placeholder="GJ01AB1234"
                className={inp}
              />
            </div>
            {/* Distance */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Distance (km)</label>
              <input
                type="number"
                min={0}
                value={form.distance ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, distance: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="0"
                className={inp}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Transporter Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Transporter Name</label>
              <input
                value={form.transporterName ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, transporterName: e.target.value }))}
                placeholder="ABC Logistics"
                className={inp}
              />
            </div>
            {/* Transporter ID */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Transporter ID</label>
              <input
                value={form.transporterId ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, transporterId: e.target.value }))}
                placeholder="GSTIN..."
                className={inp}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Create E-Way Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── E-Way Bill List Table ── */
function EwayBillTable({ data }: { data: EwayBill[] }) {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              {["EWB No.", "Date", "Party", "Vehicle No.", "Distance", "Transporter", "Value", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((bill, i) => (
              <tr
                key={bill.id}
                className={cn(
                  "border-b border-border last:border-0 hover:bg-secondary/40 transition-colors",
                  i % 2 === 1 && "bg-secondary/20"
                )}
              >
                <td className="px-4 py-3 text-xs font-semibold text-brand-700">{bill.ewbNo}</td>
                <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">{formatDate(bill.ewbDate)}</td>
                <td className="px-4 py-3 text-xs text-foreground font-medium">{bill.partyName}</td>
                <td className="px-4 py-3 text-xs text-foreground">{bill.vehicleNo ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-foreground">{bill.distance ? `${bill.distance} km` : "—"}</td>
                <td className="px-4 py-3 text-xs text-foreground">{bill.transporterName ?? "—"}</td>
                <td className="px-4 py-3 text-xs font-semibold text-foreground whitespace-nowrap">{formatCurrency(bill.totalValue)}</td>
                <td className="px-4 py-3"><StatusBadge status={bill.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function EwayBillPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useEwayBills();
  const bills = data?.data ?? [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">E-Way Bills</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage electronic way bills for goods transport.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors shadow-sm flex-shrink-0"
        >
          <Plus size={15} /> Create E-Way Bill
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Total Bills</p>
          <p className="text-xl font-bold text-foreground">{bills.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 p-4">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Active</p>
          <p className="text-xl font-bold text-green-700">{bills.filter((b) => b.status === "ACTIVE").length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-4">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Cancelled</p>
          <p className="text-xl font-bold text-red-600">{bills.filter((b) => b.status === "CANCELLED").length}</p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton
          headers={["EWB No.", "Date", "Party", "Vehicle No.", "Distance", "Transporter", "Value", "Status"]}
        />
      ) : isError ? (
        <ErrorState message="Failed to load e-way bills." onRetry={() => refetch()} />
      ) : bills.length === 0 ? (
        <EmptyState
          icon={<Zap size={28} strokeWidth={1.5} />}
          label="No e-way bills yet"
          description="Create your first e-way bill for a goods transport."
          addLabel="Create E-Way Bill"
          onAdd={() => setCreateOpen(true)}
        />
      ) : (
        <EwayBillTable data={bills} />
      )}

      {createOpen && <CreateEwayBillModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
