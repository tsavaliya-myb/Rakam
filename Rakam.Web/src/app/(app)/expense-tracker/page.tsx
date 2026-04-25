"use client";

import { useState, useMemo } from "react";
import { Plus, Download, Filter, Receipt } from "lucide-react";
import { ExpenseListTable } from "@/components/expense/ExpenseListTable";
import { ExpenseFilterDrawer, type ExpenseFilterValues } from "@/components/expense/ExpenseFilterDrawer";
import { AddExpenseModal } from "@/components/expense/AddExpenseModal";
import { MOCK_EXPENSES } from "@/lib/mock/expenses";
import { cn, formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types";
import type { AddExpenseFormValues } from "@/lib/schemas/expense.schema";
import { toast } from "sonner";

export default function ExpenseTrackerPage() {
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Partial<ExpenseFilterValues>>({});
  const [filterActive, setFilterActive] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const filteredExpenses = useMemo(() => {
    let list = [...expenses];
    if (activeFilters.category) list = list.filter((e) => e.category === activeFilters.category);
    if (activeFilters.supplierName) list = list.filter((e) => e.supplierName === activeFilters.supplierName);
    if (activeFilters.mode && activeFilters.mode !== "ALL") list = list.filter((e) => e.mode === activeFilters.mode);
    if (activeFilters.fromDate) list = list.filter((e) => e.date >= activeFilters.fromDate!);
    if (activeFilters.toDate)   list = list.filter((e) => e.date <= activeFilters.toDate!);
    return list;
  }, [expenses, activeFilters]);

  const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  function handleApplyFilters(filters: ExpenseFilterValues) {
    setActiveFilters(filters);
    const active =
      !!filters.category ||
      !!filters.supplierName ||
      (filters.mode && filters.mode !== "ALL") ||
      !!filters.fromDate ||
      !!filters.toDate;
    setFilterActive(!!active);
  }

  function handleAdd(data: AddExpenseFormValues) {
    const newExpense: Expense = {
      id: `exp${Date.now()}`,
      date: data.date,
      category: data.category,
      supplierName: data.supplierName || undefined,
      amount: data.amount,
      note: data.note,
      mode: data.mode,
      expenseItem: data.expenseItem,
      qty: data.qty,
      rate: data.rate,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    setAddModalOpen(false);
    toast.success("Expense added successfully");
  }

  function handleEdit(expense: Expense) {
    setEditExpense(expense);
    setAddModalOpen(true);
  }

  function handleEditSubmit(data: AddExpenseFormValues) {
    if (!editExpense) return;
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === editExpense.id
          ? { ...e, ...data, supplierName: data.supplierName || undefined }
          : e
      )
    );
    setEditExpense(null);
    setAddModalOpen(false);
    toast.success("Expense updated");
  }

  function handleDelete(expense: Expense) {
    setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
    toast.error(`Expense deleted`);
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
          { label: "Total Expenses", value: formatCurrency(expenses.reduce((s, e) => s + e.amount, 0)), color: "text-red-600" },
          { label: "This Month",     value: formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0)), color: "text-orange-600" },
          { label: "No. of Records", value: String(expenses.length), color: "text-foreground" },
          { label: "Filtered Total", value: formatCurrency(totalExpense), color: "text-brand-900" },
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

      {/* ── Table or Empty ── */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
            <Receipt size={28} strokeWidth={1.5} className="text-brand-400" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">No, Any expenses recorded yet.</p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors"
          >
            <Plus size={15} /> Add Expense
          </button>
        </div>
      ) : (
        <ExpenseListTable
          data={filteredExpenses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPrint={(e) => toast.info(`Printing expense…`)}
          onDownload={(e) => toast.info(`Downloading expense…`)}
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
          onSubmit={editExpense ? handleEditSubmit : handleAdd}
        />
      )}
    </div>
  );
}
