"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Building2, Lock } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { FirmCard } from "@/components/firm/FirmCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFirms, useDeleteFirm, useTogglePdfOptions } from "@/hooks/api/use-firms";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import type { Firm, TogglePdfOptionsDto } from "@/types";

export default function ManageFirmPage() {
  const router = useRouter();
  const [search, setSearch]       = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const { data: firms = [], isLoading, isError, refetch } = useFirms();
  const deleteFirm = useDeleteFirm();
  const togglePdfOptions = useTogglePdfOptions();
  const subscription = useSubscriptionStore((s) => s.subscription);

  const planLimit   = subscription?.firmLimit ?? 1;
  const activeFirms = firms.filter((f) => f.isDefault !== undefined).length;

  const filteredFirms = firms.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.gstNo ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleToggle(firmId: string, dto: TogglePdfOptionsDto) {
    togglePdfOptions.mutate({ id: firmId, dto });
  }

  function handleDelete(firm: Firm) {
    if (firm.isDefault) {
      toast.error("Cannot delete the default firm");
      return;
    }
    deleteFirm.mutate(firm.id);
  }

  function handleAddFirm() {
    if (firms.length >= planLimit) {
      setUpgradeOpen(true);
    } else {
      toast.info("Add firm — coming soon");
    }
  }

  return (
    <div className="p-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">Manage Firm</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your business firms, bank details, and PDF assets.
          </p>
        </div>
        <button
          onClick={handleAddFirm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Firm
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Firms",  value: firms.length },
          { label: "Active Firms", value: activeFirms },
          { label: "Plan Limit",   value: `${firms.length}/${planLimit}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-border p-4 text-center">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">
              {stat.label}
            </p>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm mb-6">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search by firm name or GST..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            "w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-white text-foreground",
            "outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-900/10 transition-all",
            "placeholder:text-muted-foreground/60"
          )}
        />
      </div>

      {/* ── Firm cards grid ── */}
      {isLoading ? (
        <TableSkeleton cols={3} rows={4} />
      ) : isError ? (
        <ErrorState message="Failed to load firms." onRetry={() => refetch()} />
      ) : filteredFirms.length === 0 ? (
        <EmptyState
          icon={<Building2 size={24} strokeWidth={1.5} />}
          label={search ? "No firms match your search." : "No firms found."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredFirms.map((firm) => (
            <FirmCard
              key={firm.id}
              firm={firm}
              onEdit={(f) => router.push(`/manage-firm/edit/${f.id}`)}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* ── Upgrade Modal ── */}
      {upgradeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setUpgradeOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Lock size={24} strokeWidth={1.5} className="text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">Plan Limit Reached</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Your current plan allows {planLimit} firm{planLimit > 1 ? "s" : ""}.
              Upgrade to add more firms.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setUpgradeOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setUpgradeOpen(false); toast.info("Redirecting to upgrade…"); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
