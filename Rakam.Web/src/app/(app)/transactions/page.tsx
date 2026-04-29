"use client";

import { useState } from "react";
import { Plus, Download, Filter, ArrowLeftRight, TrendingUp, TrendingDown } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionListTable } from "@/components/transactions/TransactionListTable";
import { TransactionFilterDrawer } from "@/components/transactions/TransactionFilterDrawer";
import { AddPaymentModal } from "@/components/transactions/AddPaymentModal";
import { cn, formatCurrency } from "@/lib/utils";
import type { TransactionFilterValues } from "@/lib/schemas/transaction.schema";
import { toast } from "sonner";
import { useTransactions, useDeleteTransaction } from "@/hooks/api/use-transactions";

export default function TransactionsPage() {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters]       = useState<Partial<TransactionFilterValues>>({});
  const [filterActive, setFilterActive]         = useState(false);
  const [addModalOpen, setAddModalOpen]         = useState(false);

  const apiFilters = {
    transactionType: activeFilters.transactionType && activeFilters.transactionType !== "ALL"
      ? (activeFilters.transactionType as "CREDIT" | "DEBIT")
      : undefined,
    mode: activeFilters.mode && activeFilters.mode !== "ALL"
      ? (activeFilters.mode as "CASH" | "CHEQUE" | "ONLINE" | "OTHER")
      : undefined,
    partyId: activeFilters.partyId || undefined,
    fromDate: activeFilters.fromDate || undefined,
    toDate: activeFilters.toDate || undefined,
  };

  const { data, isLoading, isError, refetch } = useTransactions(apiFilters);
  const deleteTransaction = useDeleteTransaction();

  const transactions = data?.data ?? [];

  const totalCredit = transactions
    .filter((t) => t.transactionType === "CREDIT")
    .reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions
    .filter((t) => t.transactionType === "DEBIT")
    .reduce((s, t) => s + t.amount, 0);
  const netBalance = totalCredit - totalDebit;

  function handleApplyFilters(filters: TransactionFilterValues) {
    setActiveFilters(filters);
    setFilterActive(
      (!!filters.transactionType && filters.transactionType !== "ALL") ||
      (!!filters.mode && filters.mode !== "ALL") ||
      !!filters.partyId ||
      !!filters.fromDate ||
      !!filters.toDate
    );
  }

  return (
    <div className="p-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all payment transactions.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => toast.info("Exporting to Excel…")}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-border text-foreground bg-white hover:bg-secondary transition-colors"
          >
            <Download size={14} strokeWidth={1.8} /> Export
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors shadow-sm"
          >
            <Plus size={15} /> Add New Payment
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Total Records</p>
          <p className="text-xl font-bold text-foreground">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 p-4">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={12} className="text-green-600" />
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Total Credit</p>
          </div>
          <p className="text-xl font-bold text-green-700">{formatCurrency(totalCredit)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-4">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown size={12} className="text-red-500" />
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Total Debit</p>
          </div>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalDebit)}</p>
        </div>
        <div className={cn(
          "bg-white rounded-2xl border p-4",
          netBalance >= 0 ? "border-brand-100" : "border-orange-100"
        )}>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Net Balance</p>
          <p className={cn("text-xl font-bold", netBalance >= 0 ? "text-brand-900" : "text-orange-600")}>
            {formatCurrency(Math.abs(netBalance))}
            <span className="text-xs font-medium ml-1">{netBalance >= 0 ? "Receivable" : "Payable"}</span>
          </p>
        </div>
      </div>

      {/* ── Controls row ── */}
      <div className="flex items-center justify-end gap-3 mb-5">
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors relative",
            filterActive
              ? "border-brand-300 text-brand-700 bg-brand-50"
              : "border-border text-foreground bg-white hover:bg-secondary"
          )}
        >
          <Filter size={14} strokeWidth={1.8} /> Filter
          {filterActive && (
            <span className="w-2 h-2 rounded-full bg-green-500 absolute -top-0.5 -right-0.5" />
          )}
        </button>
      </div>

      {/* ── Table / Loading / Empty ── */}
      {isLoading ? (
        <TableSkeleton cols={6} />
      ) : isError ? (
        <ErrorState message="Failed to load transactions." onRetry={() => refetch()} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight size={28} strokeWidth={1.5} />}
          label="No transactions recorded yet."
          addLabel="Add New Payment"
          onAdd={() => setAddModalOpen(true)}
        />
      ) : (
        <TransactionListTable
          data={transactions}
          onEdit={(t) => toast.info(`Edit ${t.refNumber} — coming soon`)}
          onDelete={(t) => deleteTransaction.mutate(t.id)}
          onPrint={(t) => toast.info(`Printing ${t.refNumber}…`)}
          onDownload={(t) => toast.info(`Downloading ${t.refNumber}…`)}
        />
      )}

      {/* ── Filter Drawer ── */}
      <TransactionFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={handleApplyFilters}
        defaultValues={activeFilters}
      />

      {/* ── Add Payment Modal ── */}
      {addModalOpen && (
        <AddPaymentModal onClose={() => setAddModalOpen(false)} />
      )}
    </div>
  );
}
