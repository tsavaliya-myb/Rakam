"use client";

import { useState, useCallback } from "react";
import { Plus, Download, Filter, Search, AlertCircle } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useRouter } from "next/navigation";
import { BillListTable } from "@/components/bill/BillListTable";
import { BillFilterDrawer } from "@/components/bill/BillFilterDrawer";
import { RecordPaymentModal } from "@/components/bill/RecordPaymentModal";
import { ChooseBillTypeModal } from "@/components/bill/ChooseBillTypeModal";
import {
  useSalesBills,
  useDeleteSalesBill,
  useDuplicateBill,
  useRecordPayment,
  useGeneratePdf,
} from "@/hooks/api/use-sales-bills";
import { usePdfJob } from "@/hooks/api/use-pdf-job";
import { cn } from "@/lib/utils";
import type { Bill, BillStatus, BillType } from "@/types";
import type { BillFilterValues } from "@/lib/schemas/bill.schema";
import type { RecordPaymentFormValues } from "@/lib/schemas/bill.schema";
import { toast } from "sonner";

type TabId = "ALL" | "TAX_INVOICE" | "JOB_CHALLAN";

const TABS: { id: TabId; label: string }[] = [
  { id: "ALL",         label: "All" },
  { id: "TAX_INVOICE", label: "Tax Invoice" },
  { id: "JOB_CHALLAN", label: "Job Challan" },
];


export default function BillListPage() {
  const router = useRouter();

  const [activeTab, setActiveTab]           = useState<TabId>("ALL");
  const [searchQuery, setSearchQuery]       = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters]   = useState<Partial<BillFilterValues>>({});
  const [chooseTypeOpen, setChooseTypeOpen] = useState(false);
  const [paymentBill, setPaymentBill]       = useState<Bill | null>(null);
  const [filterActive, setFilterActive]     = useState(false);
  const [pdfJobId, setPdfJobId]             = useState<string | null>(null);

  // Build API filter object from all UI controls
  const apiFilters = {
    search: searchQuery.trim() || undefined,
    billType: activeTab !== "ALL" ? (activeTab as BillType) : undefined,
    status: (activeFilters.status && activeFilters.status !== "ALL")
      ? (activeFilters.status as BillStatus)
      : undefined,
    partyId: activeFilters.partyId || undefined,
    fromDate: activeFilters.fromDate || undefined,
    toDate: activeFilters.toDate || undefined,
  };

  const { data, isLoading, isError, refetch } = useSalesBills(apiFilters);
  const bills = data?.data ?? [];

  const deleteMutation    = useDeleteSalesBill();
  const duplicateMutation = useDuplicateBill();
  const recordPayment     = useRecordPayment();
  const generatePdf       = useGeneratePdf();

  // PDF polling — opens URL when job finishes
  const { data: pdfJob } = usePdfJob(pdfJobId);
  if (pdfJob?.status === "done" && pdfJob.url) {
    window.open(pdfJob.url, "_blank");
    setPdfJobId(null);
  }

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

  function handlePaymentSubmit(formData: RecordPaymentFormValues) {
    if (!paymentBill) return;
    recordPayment.mutate(
      {
        id: paymentBill.id,
        dto: {
          date: formData.paymentDate,
          amount: formData.transactionAmount,
          mode: formData.paymentMode.toUpperCase() as any,
          note: formData.note,
        },
      },
      { onSuccess: () => setPaymentBill(null) }
    );
  }

  const handleEdit = useCallback((bill: Bill) => {
    router.push(`/bill/${bill.id}/edit`);
  }, [router]);

  const handleDelete = useCallback((bill: Bill) => {
    if (!confirm(`Delete bill ${bill.billNo}? This cannot be undone.`)) return;
    deleteMutation.mutate(bill.id);
  }, [deleteMutation]);

  const handleDuplicate = useCallback((bill: Bill) => {
    duplicateMutation.mutate(bill.id);
  }, [duplicateMutation]);

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
    generatePdf.mutate(bill.id, {
      onSuccess: ({ jobId }) => {
        setPdfJobId(jobId);
        toast.info("Generating PDF, please wait…");
      },
    });
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
          <button
            onClick={() => toast.info("Exporting to Excel…")}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-border text-foreground bg-white hover:bg-secondary transition-colors"
          >
            <Download size={14} strokeWidth={1.8} />
            Export
          </button>

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

      {/* ── Content ── */}
      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState message="Failed to load bills." onRetry={() => refetch()} />
      ) : (
        <BillListTable
          data={bills}
          onRecordPayment={handleRecordPayment}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onCreditNote={handleCreditNote}
          onCreateEway={handleCreateEway}
          onPrint={handlePrint}
          onDownload={handleDownload}
        />
      )}

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
