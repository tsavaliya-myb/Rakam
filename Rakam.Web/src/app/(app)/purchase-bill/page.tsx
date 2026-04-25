"use client";

import { useState, useMemo } from "react";
import { Plus, Download, Filter, Search } from "lucide-react";
import { PurchaseBillTable } from "@/components/purchase-bill/PurchaseBillTable";
import { PurchaseBillFilterDrawer } from "@/components/purchase-bill/PurchaseBillFilterDrawer";
import { PurchasePaymentModal } from "@/components/purchase-bill/PurchasePaymentModal";
import { MOCK_PURCHASE_BILLS } from "@/lib/mock/purchase-bills";
import { cn } from "@/lib/utils";
import type { PurchaseBill } from "@/types";
import type { PurchaseBillFilterValues } from "@/lib/schemas/purchase-bill.schema";
import { toast } from "sonner";
import Link from "next/link";

type TabId = "ALL" | "WITH_TAX" | "WITHOUT_TAX";

const TABS: { id: TabId; label: string }[] = [
  { id: "ALL",          label: "All" },
  { id: "WITH_TAX",     label: "With Tax" },
  { id: "WITHOUT_TAX",  label: "Without Tax" },
];

export default function PurchaseBillListPage() {
  const [activeTab, setActiveTab]               = useState<TabId>("ALL");
  const [searchQuery, setSearchQuery]           = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters]       = useState<Partial<PurchaseBillFilterValues>>({});
  const [paymentBill, setPaymentBill]           = useState<PurchaseBill | null>(null);
  const [filterActive, setFilterActive]         = useState(false);

  const filteredBills = useMemo(() => {
    let bills = [...MOCK_PURCHASE_BILLS];

    if (activeTab !== "ALL") {
      bills = bills.filter((b) => b.billType === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      bills = bills.filter(
        (b) =>
          b.billNo.toLowerCase().includes(q) ||
          b.partyName.toLowerCase().includes(q)
      );
    }

    if (activeFilters.status && activeFilters.status !== "ALL") {
      bills = bills.filter((b) => b.status === activeFilters.status);
    }
    if (activeFilters.partyId) {
      bills = bills.filter((b) => b.partyId === activeFilters.partyId);
    }
    if (activeFilters.fromDate) {
      bills = bills.filter((b) => b.billDate >= activeFilters.fromDate!);
    }
    if (activeFilters.toDate) {
      bills = bills.filter((b) => b.billDate <= activeFilters.toDate!);
    }

    return bills;
  }, [activeTab, searchQuery, activeFilters]);

  function handleApplyFilters(filters: PurchaseBillFilterValues) {
    setActiveFilters(filters);
    setFilterActive(
      filters.status !== "ALL" ||
      !!filters.partyId ||
      !!filters.fromDate ||
      !!filters.toDate ||
      filters.billType !== "ALL"
    );
  }

  return (
    <div className="p-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            Purchase Bills
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your supplier invoices and purchase records.
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
            href="/purchase-bill/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 transition-colors shadow-sm"
          >
            <Plus size={15} />
            Add Purchase Bill
          </Link>
        </div>
      </div>

      {/* ── Tabs + Search + Filter ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">

        {/* Tabs */}
        <div className="flex items-center bg-white rounded-xl border border-border p-1 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeTab === tab.id
                  ? "bg-violet-700 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search bill no., supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-white text-foreground",
              "outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-700/10 transition-all",
              "placeholder:text-muted-foreground/60"
            )}
          />
        </div>

        {/* Filter */}
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors relative",
            filterActive
              ? "border-violet-300 text-violet-700 bg-violet-50"
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
      <PurchaseBillTable
        data={filteredBills}
        onRecordPayment={(bill) => setPaymentBill(bill)}
        onView={(bill) => toast.info(`Viewing ${bill.billNo}`)}
        onEdit={(bill) => toast.info(`Edit ${bill.billNo} — coming soon`)}
        onDelete={(bill) => toast.error(`Delete ${bill.billNo} — coming soon`)}
        onPrint={(bill) => toast.info(`Printing ${bill.billNo}…`)}
        onDownload={(bill) => toast.info(`Downloading ${bill.billNo}…`)}
      />

      {/* ── Filter Drawer ── */}
      <PurchaseBillFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={handleApplyFilters}
        defaultValues={activeFilters}
      />

      {/* ── Payment Modal ── */}
      {paymentBill && (
        <PurchasePaymentModal
          bill={paymentBill}
          onClose={() => setPaymentBill(null)}
          onSubmit={() => {
            toast.success(`Payment recorded for ${paymentBill.billNo}`);
            setPaymentBill(null);
          }}
        />
      )}
    </div>
  );
}
