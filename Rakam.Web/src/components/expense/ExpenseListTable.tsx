"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Printer, Download, MoreHorizontal,
  ChevronUp, ChevronDown, ChevronsUpDown,
  Pencil, Trash2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/types";

interface Props {
  data: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onPrint: (expense: Expense) => void;
  onDownload: (expense: Expense) => void;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc")  return <ChevronUp size={13} className="text-brand-700" />;
  if (sorted === "desc") return <ChevronDown size={13} className="text-brand-700" />;
  return <ChevronsUpDown size={13} className="text-muted-foreground/50" />;
}

function ModeBadge({ mode }: { mode: "AMOUNT" | "ITEM" }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
      mode === "ITEM"
        ? "bg-purple-50 text-purple-700 border border-purple-200"
        : "bg-slate-50 text-slate-600 border border-slate-200"
    )}>
      {mode === "ITEM" ? "Item" : "Amount"}
    </span>
  );
}

function ActionMenu({ expense, onEdit, onDelete, onPrint, onDownload }: {
  expense: Expense;
} & Omit<Props, "data">) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPrint(expense)}
        title="Print"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-secondary transition-colors"
      >
        <Printer size={14} strokeWidth={1.8} />
      </button>
      <button
        onClick={() => onDownload(expense)}
        title="Download"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-secondary transition-colors"
      >
        <Download size={14} strokeWidth={1.8} />
      </button>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-secondary transition-colors"
        >
          <MoreHorizontal size={14} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-border py-1 z-50">
              <button
                onClick={() => { onEdit(expense); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                onClick={() => { onDelete(expense); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

export function ExpenseListTable({ data, onEdit, onDelete, onPrint, onDownload }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = useState(20);

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => (
        <span className="text-xs text-foreground font-medium">
          {formatDate(getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ getValue }) => (
        <span className="text-xs font-semibold text-foreground">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "supplierName",
      header: "Supplier",
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">{getValue<string>() ?? "—"}</span>
      ),
    },
    {
      accessorKey: "mode",
      header: "Type",
      cell: ({ getValue }) => <ModeBadge mode={getValue<"AMOUNT" | "ITEM">()} />,
    },
    {
      accessorKey: "expenseItem",
      header: "Item",
      cell: ({ row }) =>
        row.original.mode === "ITEM" ? (
          <span className="text-xs text-foreground">
            {row.original.expenseItem ?? "—"}
            {row.original.qty != null && (
              <span className="text-muted-foreground ml-1">
                × {row.original.qty}
              </span>
            )}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "amount",
      header: "Amount (₹)",
      cell: ({ getValue }) => (
        <span className="text-xs font-semibold text-foreground">
          {formatCurrency(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground truncate max-w-[180px] block">
          {getValue<string>() || "—"}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      enableSorting: false,
      cell: ({ row }) => (
        <ActionMenu
          expense={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
          onPrint={onPrint}
          onDownload={onDownload}
        />
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const totalAmount = data.reduce((s, e) => s + e.amount, 0);
  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Records per page */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="text-xs text-muted-foreground">Show</span>
        <select
          value={pageSize}
          onChange={(e) => {
            const val = Number(e.target.value);
            setPageSize(val);
            table.setPageSize(val);
          }}
          className="text-xs border border-border rounded-lg px-2 py-1 bg-white text-foreground outline-none focus:border-brand-300"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">records per page</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-secondary/60 border-b border-border">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground select-none",
                      header.column.getCanSort() && "cursor-pointer hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <SortIcon sorted={header.column.getIsSorted()} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-sm text-muted-foreground">
                  No expenses recorded yet.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-secondary/40 transition-colors",
                    i % 2 === 1 && "bg-secondary/20"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {/* Footer totals */}
          {data.length > 0 && (
            <tfoot>
              <tr className="bg-brand-50/60 border-t-2 border-brand-100">
                <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-foreground">
                  Total ({data.length} records)
                </td>
                <td className="px-4 py-3 text-xs font-bold text-brand-900">
                  {formatCurrency(totalAmount)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Page {pageIndex + 1} of {pageCount}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i).slice(
              Math.max(0, pageIndex - 2),
              Math.min(pageCount, pageIndex + 3)
            ).map((i) => (
              <button
                key={i}
                onClick={() => table.setPageIndex(i)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-semibold border transition-colors",
                  i === pageIndex
                    ? "bg-brand-900 text-white border-brand-900"
                    : "border-border text-foreground hover:bg-secondary"
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
