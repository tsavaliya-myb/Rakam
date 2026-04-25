"use client";

import { useState, useMemo } from "react";
import { Plus, Download, Filter, Search } from "lucide-react";
import { BillListTable } from "@/components/bill/BillListTable";
import { BillFilterDrawer } from "@/components/bill/BillFilterDrawer";
import { RecordPaymentModal } from "@/components/bill/RecordPaymentModal";
import { ChooseBillTypeModal } from "@/components/bill/ChooseBillTypeModal";
import { MOCK_BILLS } from "@/lib/mock/bills";
import { cn } from "@/lib/utils";
import type { Bill } from "@/types";
import type { BillFilterValues } from "@/lib/schemas/bill.schema";
import { toast } from "sonner";

type TabId = "ALL" | "TAX_INVOICE" | "JOB_CHALLAN";

const TABS: { id: TabId; label: string }[] = [
  { id: "ALL",          label: "All" },
  { id: "TAX_INVOICE",  label: "Tax Invoice" },
  { id: "JOB_CHALLAN",  label: "Job Challan" },
];

export default function BillListPage() {
  const [activeTab, setActiveTab]           = useState<TabId>("ALL");
  const [searchQuery, setSearchQuery]       = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters]   = useState<Partial<BillFilterValues>>({});
  const [chooseTypeOpen, setChooseTypeOpen] = useState(false);
  const [paymentBill, setPaymentBill]       = useState<Bill | null>(null);
  const [filterActive, setFilterActive]     = useState(false);

  // Derived filtered data
  const filteredBills = useMemo(() => {
    let bills = [...MOCK_BILLS];

    // Tab filter
    if (activeTab !== "ALL") {
      bills = bills.filter((b) => b.billType === activeTab);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      bills = bills.filter(
        (b) =>
          b.billNo.toLowerCase().includes(q) ||
          b.partyName.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (activeFilters.status && activeFilters.status !== "ALL") {
      bills = bills.filter((b) => b.status === activeFilters.status);
    }

    // Party filter
    if (activeFilters.partyId) {
      bills = bills.filter((b) => b.partyId === activeFilters.partyId);
    }

    // Date range
    if (activeFilters.fromDate) {
      bills = bills.filter((b) => b.billDate >= activeFilters.fromDate!);
    }
    if (activeFilters.toDate) {
      bills = bills.filter((b) => b.billDate <= activeFilters.toDate!);
    }

    return bills;
  }, [activeTab, searchQuery, activeFilters]);

  function handleApplyFilters(filters: BillFilterValues) {
    setActiveFilters(filters);
    const hasActiveFilter =
      filters.status !== "ALL" ||
      !!filters.partyId ||
      !!filters.fromDate ||
      !!filters.toDate ||
      filters.billType !== "ALL";
    setFilterActive(hasActiveFilter);
  }

  function handleRecordPayment(bill: Bill) {
    setPaymentBill(bill);
  }

  function handlePaymentSubmit() {
    toast.success(`Payment recorded for ${paymentBill?.billNo}`);
    setPaymentBill(null);
  }

  function handleEdit(bill: Bill) {
    toast.info(`Edit ${bill.billNo} — coming soon`);
  }

  function handleDelete(bill: Bill) {
    toast.error(`Delete ${bill.billNo} — coming soon`);
  }

  function handleDuplicate(bill: Bill) {
    toast.success(`Duplicated ${bill.billNo}`);
  }

  function handleCreditNote(bill: Bill) {
    toast.info(`Credit Note for ${bill.billNo} — coming soon`);
  }

  function handleCreateEway(bill: Bill) {
    toast.info(`E-Way Bill for ${bill.billNo} — coming soon`);
  }

  function handlePrint(bill: Bill) {
    toast.info(`Printing ${bill.billNo}…`);
  }

  function handleDownload(bill: Bill) {
    toast.info(`Downloading ${bill.billNo}…`);
  }

  return (
    <div className="p-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            Sales Bills
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your sales invoices and job challans.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Export */}
          <button
            onClick={() => toast.info("Exporting to Excel…")}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-border text-foreground bg-white hover:bg-secondary transition-colors"
          >
            <Download size={14} strokeWidth={1.8} />
            Export
          </button>

          {/* Add Bill */}
          <button
            onClick={() => setChooseTypeOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors shadow-sm"
          >
            <Plus size={15} />
            Add Bill
          </button>
        </div>
      </div>

      {/* ── Tabs + Search + Filter row ── */}
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
                  ? "bg-brand-900 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search bill no., party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-white text-foreground",
              "outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-900/10 transition-all",
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
              ? "border-brand-300 text-brand-700 bg-brand-50"
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
      <BillListTable
        data={filteredBills}
        onRecordPayment={handleRecordPayment}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onCreditNote={handleCreditNote}
        onCreateEway={handleCreateEway}
        onPrint={handlePrint}
        onDownload={handleDownload}
      />

      {/* ── Filter Drawer ── */}
      <BillFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={handleApplyFilters}
        defaultValues={activeFilters}
      />

      {/* ── Record Payment Modal ── */}
      {paymentBill && (
        <RecordPaymentModal
          bill={paymentBill}
          onClose={() => setPaymentBill(null)}
          onSubmit={handlePaymentSubmit}
        />
      )}

      {/* ── Choose Bill Type Modal ── */}
      {chooseTypeOpen && (
        <ChooseBillTypeModal onClose={() => setChooseTypeOpen(false)} />
      )}
    </div>
  );
}
