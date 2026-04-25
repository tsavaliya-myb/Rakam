"use client";

import { useState, useMemo } from "react";
import { Plus, Download, Filter, ArrowLeftRight, TrendingUp, TrendingDown } from "lucide-react";
import { TransactionListTable } from "@/components/transactions/TransactionListTable";
import { TransactionFilterDrawer } from "@/components/transactions/TransactionFilterDrawer";
import { AddPaymentModal } from "@/components/transactions/AddPaymentModal";
import { MOCK_TRANSACTIONS } from "@/lib/mock/transactions";
import { MOCK_PARTIES } from "@/lib/mock/parties";
import { cn, formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types";
import type { AddPaymentFormValues, TransactionFilterValues } from "@/lib/schemas/transaction.schema";
import { toast } from "sonner";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Partial<TransactionFilterValues>>({});
  const [filterActive, setFilterActive] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (activeFilters.transactionType && activeFilters.transactionType !== "ALL") {
      list = list.filter((t) => t.transactionType === activeFilters.transactionType);
    }
    if (activeFilters.mode && activeFilters.mode !== "ALL") {
      list = list.filter((t) => t.mode === activeFilters.mode);
    }
    if (activeFilters.partyId) {
      list = list.filter((t) => t.partyId === activeFilters.partyId);
    }
    if (activeFilters.fromDate) list = list.filter((t) => t.date >= activeFilters.fromDate!);
    if (activeFilters.toDate)   list = list.filter((t) => t.date <= activeFilters.toDate!);
    return list;
  }, [transactions, activeFilters]);

  const totalCredit = filteredTransactions
    .filter((t) => t.transactionType === "CREDIT")
    .reduce((s, t) => s + t.amount, 0);
  const totalDebit = filteredTransactions
    .filter((t) => t.transactionType === "DEBIT")
    .reduce((s, t) => s + t.amount, 0);
  const netBalance = totalCredit - totalDebit;

  function handleApplyFilters(filters: TransactionFilterValues) {
    setActiveFilters(filters);
    const active =
      (filters.transactionType && filters.transactionType !== "ALL") ||
      (filters.mode && filters.mode !== "ALL") ||
      !!filters.partyId ||
      !!filters.fromDate ||
      !!filters.toDate;
    setFilterActive(!!active);
  }

  function handleAdd(data: AddPaymentFormValues) {
    const newTxn: Transaction = {
      id: `txn${Date.now()}`,
      date: data.paymentDate,
      refNumber: `TXN-${String(transactions.length + 1).padStart(3, "0")}`,
      partyId: data.partyId || undefined,
      partyName: data.partyId
        ? (MOCK_PARTIES.find((p) => p.id === data.partyId)?.name ?? "")
        : undefined,
      amount: data.paymentAmount,
      transactionType: data.transactionFor === "SALES" ? "CREDIT" : "DEBIT",
      transactionFor: data.transactionFor === "SALES" ? "Sale/Manual" : "Purchase/Manual",
      mode: data.paymentMode,
      note: data.notes,
    };
    setTransactions((prev) => [newTxn, ...prev]);
    setAddModalOpen(false);
    toast.success("Payment recorded successfully");
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

      {/* ── Table ── */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
            <ArrowLeftRight size={28} strokeWidth={1.5} className="text-brand-400" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">No transactions recorded yet.</p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors"
          >
            <Plus size={15} /> Add New Payment
          </button>
        </div>
      ) : (
        <TransactionListTable
          data={filteredTransactions}
          onEdit={(t) => toast.info(`Edit ${t.refNumber} — coming soon`)}
          onDelete={(t) => {
            setTransactions((prev) => prev.filter((x) => x.id !== t.id));
            toast.error("Transaction deleted");
          }}
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
        <AddPaymentModal
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
}
