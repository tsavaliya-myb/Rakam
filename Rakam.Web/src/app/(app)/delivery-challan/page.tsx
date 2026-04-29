"use client";

import { useState } from "react";
import { Plus, Download, Filter, Search } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DCListTable } from "@/components/delivery-challan/DCListTable";
import { DCFilterDrawer } from "@/components/delivery-challan/DCFilterDrawer";
import { cn } from "@/lib/utils";
import type { DeliveryChallan } from "@/types";
import type { DCFilterValues } from "@/lib/schemas/delivery-challan.schema";
import { toast } from "sonner";
import { useDeliveryChallans, useDeleteDC, useConvertToInvoice } from "@/hooks/api/use-delivery-challans";

type BilledFilter = "ALL" | "YES" | "NO";

export default function DeliveryChallanPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery]           = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters]       = useState<Partial<DCFilterValues>>({});
  const [filterActive, setFilterActive]         = useState(false);
  const [billedFilter, setBilledFilter]         = useState<BilledFilter>("ALL");

  const apiFilters = {
    partyId: activeFilters.partyId || undefined,
    billed: billedFilter === "ALL" ? undefined : billedFilter === "YES",
  };

  const { data, isLoading, isError, refetch } = useDeliveryChallans(apiFilters);
  const deleteDC      = useDeleteDC();
  const convertToInvoice = useConvertToInvoice();

  const allChallans = data?.data ?? [];

  const filteredData = allChallans.filter((d) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !d.dcNo.toLowerCase().includes(q) &&
        !d.partyName.toLowerCase().includes(q) &&
        !(d.partyChallanNo?.toLowerCase().includes(q) ?? false)
      ) return false;
    }
    if (activeFilters.fromDate && d.dcDate < activeFilters.fromDate) return false;
    if (activeFilters.toDate   && d.dcDate > activeFilters.toDate)   return false;
    return true;
  });

  function handleApplyFilters(filters: DCFilterValues) {
    setActiveFilters(filters);
    setBilledFilter(filters.salesBillCreated ?? "ALL");
    setFilterActive(
      filters.salesBillCreated !== "ALL" || !!filters.partyId || !!filters.fromDate || !!filters.toDate
    );
  }

  function handleCreateSalesBill(dc: DeliveryChallan) {
    if (dc.salesBillCreated) {
      toast.info(`Sales bill already created for ${dc.dcNo}`);
      return;
    }
    convertToInvoice.mutate(dc.id);
  }

  return (
    <div className="p-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            Delivery Challans
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage outward delivery challans and convert them to sales bills.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => toast.info("Exporting to Excel…")}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-border text-foreground bg-white hover:bg-secondary transition-colors"
          >
            <Download size={14} strokeWidth={1.8} />
            Export
          </button>

          <Link
            href="/delivery-challan/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm"
          >
            <Plus size={15} />
            Add Delivery Challan
          </Link>
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search challan no., party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-white text-foreground",
              "outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-700/10 transition-all",
              "placeholder:text-muted-foreground/60"
            )}
          />
        </div>

        {/* Bill created quick filters */}
        <div className="flex items-center bg-white rounded-xl border border-border p-1 gap-1">
          {([
            { label: "All",       value: "ALL" },
            { label: "✓ Billed",  value: "YES" },
            { label: "✗ Pending", value: "NO"  },
          ] as { label: string; value: BilledFilter }[]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBilledFilter(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                billedFilter === opt.value
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filter */}
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors relative",
            filterActive
              ? "border-teal-300 text-teal-700 bg-teal-50"
              : "border-border text-foreground bg-white hover:bg-secondary"
          )}
        >
          <Filter size={14} strokeWidth={1.8} />
          Filter
          {filterActive && (
            <span className="w-2 h-2 rounded-full bg-green-500 absolute -top-0.5 -right-0.5" />
          )}
        </button>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <TableSkeleton headers={["Date", "DC No.", "Party", "Challan No.", "Amount", "Billed", "Action"]} />
      ) : isError ? (
        <ErrorState message="Failed to load delivery challans." onRetry={() => refetch()} />
      ) : (
        <DCListTable
          data={filteredData}
          onCreateSalesBill={handleCreateSalesBill}
          onView={(dc) => toast.info(`Viewing ${dc.dcNo}`)}
          onPrint={(dc) => toast.info(`Printing ${dc.dcNo}…`)}
          onDownload={(dc) => toast.info(`Downloading ${dc.dcNo}…`)}
          onEdit={(dc) => router.push(`/delivery-challan/${dc.id}/edit`)}
          onDelete={(dc) => deleteDC.mutate(dc.id)}
        />
      )}

      {/* ── Filter Drawer ── */}
      <DCFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={handleApplyFilters}
        defaultValues={activeFilters}
      />
    </div>
  );
}
