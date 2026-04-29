"use client";

import { useState } from "react";
import { Plus, Download, Filter, Receipt } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpenseListTable } from "@/components/expense/ExpenseListTable";
import { ExpenseFilterDrawer, type ExpenseFilterValues } from "@/components/expense/ExpenseFilterDrawer";
import { AddExpenseModal } from "@/components/expense/AddExpenseModal";
import { cn, formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types";
import { toast } from "sonner";
import { useExpenses, useDeleteExpense } from "@/hooks/api/use-expenses";

export default function ExpenseTrackerPage() {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters]       = useState<Partial<ExpenseFilterValues>>({});
  const [filterActive, setFilterActive]         = useState(false);
  const [addModalOpen, setAddModalOpen]         = useState(false);
  const [editExpense, setEditExpense]           = useState<Expense | null>(null);

  const apiFilters = {
    categoryId: activeFilters.categoryId || undefined,
    supplierId: activeFilters.supplierId || undefined,
  };

  const { data, isLoading, isError, refetch } = useExpenses(apiFilters);
  const deleteExpense = useDeleteExpense();

  const allExpenses = data?.data ?? [];

  // Client-side filter for mode and date range (not sent to API)
  const filteredExpenses = allExpenses.filter((e) => {
    if (activeFilters.mode && activeFilters.mode !== "ALL" && e.mode !== activeFilters.mode) return false;
    if (activeFilters.fromDate && e.date < activeFilters.fromDate) return false;
    if (activeFilters.toDate   && e.date > activeFilters.toDate)   return false;
    return true;
  });

  const totalAll      = allExpenses.reduce((s, e) => s + e.amount, 0);
  const totalFiltered = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  function handleApplyFilters(filters: ExpenseFilterValues) {
    setActiveFilters(filters);
    setFilterActive(
      !!filters.categoryId ||
      !!filters.supplierId ||
      (filters.mode && filters.mode !== "ALL") ||
      !!filters.fromDate ||
      !!filters.toDate
    );
  }

  function handleEdit(expense: Expense) {
    setEditExpense(expense);
    setAddModalOpen(true);
  }

  function handleCloseModal() {
    setAddModalOpen(false);
    setEditExpense(null);
  }

  return (
    <div className="p-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            Expense Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record and manage all your business expenses.
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
            onClick={() => { setEditExpense(null); setAddModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors shadow-sm"
          >
            <Plus size={15} />
            Add Expense
          </button>
        </div>
      </div>

      {/* ── Summary KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Expenses",  value: formatCurrency(totalAll),                       color: "text-red-600" },
          { label: "Filtered Total",  value: formatCurrency(totalFiltered),                  color: "text-orange-600" },
          { label: "No. of Records",  value: String(allExpenses.length),                     color: "text-foreground" },
          { label: "Filtered Records",value: String(filteredExpenses.length),                color: "text-brand-900" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-border p-4">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">{kpi.label}</p>
            <p className={cn("text-xl font-bold", kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Controls row ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 ml-auto">
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
      </div>

      {/* ── Table / Loading / Empty ── */}
      {isLoading ? (
        <TableSkeleton cols={6} />
      ) : isError ? (
        <ErrorState message="Failed to load expenses." onRetry={() => refetch()} />
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon={<Receipt size={28} strokeWidth={1.5} />}
          label="No expenses recorded yet."
          addLabel="Add Expense"
          onAdd={() => setAddModalOpen(true)}
        />
      ) : (
        <ExpenseListTable
          data={filteredExpenses}
          onEdit={handleEdit}
          onDelete={(e) => deleteExpense.mutate(e.id)}
          onPrint={() => toast.info("Printing expense…")}
          onDownload={() => toast.info("Downloading expense…")}
        />
      )}

      {/* ── Filter Drawer ── */}
      <ExpenseFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={handleApplyFilters}
        defaultValues={activeFilters}
      />

      {/* ── Add / Edit Modal ── */}
      {addModalOpen && (
        <AddExpenseModal
          expense={editExpense}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
