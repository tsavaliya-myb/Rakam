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
  Info,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, PaymentMode } from "@/types";

interface Props {
  data: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  onPrint: (t: Transaction) => void;
  onDownload: (t: Transaction) => void;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc")  return <ChevronUp size={13} className="text-brand-700" />;
  if (sorted === "desc") return <ChevronDown size={13} className="text-brand-700" />;
  return <ChevronsUpDown size={13} className="text-muted-foreground/50" />;
}

function TypeBadge({ type }: { type: "DEBIT" | "CREDIT" }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
      type === "CREDIT"
        ? "bg-green-50 text-green-700 border border-green-200"
        : "bg-red-50 text-red-600 border border-red-200"
    )}>
      {type}
    </span>
  );
}

const MODE_LABEL: Record<PaymentMode, string> = {
  CASH: "Cash",
  CHEQUE: "Cheque",
  ONLINE: "Online",
  OTHER: "Other",
};

function ActionMenu({ t, onEdit, onDelete, onPrint, onDownload }: {
  t: Transaction;
} & Omit<Props, "data">) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPrint(t)} title="Print"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-secondary transition-colors">
        <Printer size={14} strokeWidth={1.8} />
      </button>
      <button onClick={() => onDownload(t)} title="Download"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-secondary transition-colors">
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
                onClick={() => { onEdit(t); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                onClick={() => { onDelete(t); setOpen(false); }}
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

export function TransactionListTable({ data, onEdit, onDelete, onPrint, onDownload }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = useState(20);

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => (
        <span className="text-xs text-foreground font-medium whitespace-nowrap">
          {formatDate(getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: "refNumber",
      header: "Ref. Number",
      cell: ({ getValue }) => (
        <span className="text-xs font-semibold text-foreground">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "partyName",
      header: "Party Name",
      cell: ({ getValue }) => (
        <span className="text-xs text-foreground">{getValue<string>() ?? "—"}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: () => (
        <div className="flex items-center gap-1">
          Amount (₹)
          <div className="group relative">
            <Info size={12} className="text-muted-foreground/60 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-foreground text-background text-[10px] rounded-lg px-2 py-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              In the case of Sales Transactions, The Amount is the sum of transaction amount & settlement amount
            </div>
          </div>
        </div>
      ),
      cell: ({ getValue }) => (
        <span className="text-xs font-semibold text-foreground whitespace-nowrap">
          {formatCurrency(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: "transactionType",
      header: "Type",
      cell: ({ getValue }) => <TypeBadge type={getValue<"DEBIT" | "CREDIT">()} />,
    },
    {
      accessorKey: "transactionFor",
      header: "For",
      cell: ({ getValue }) => (
        <button className="text-xs text-brand-700 font-semibold hover:underline">
          {getValue<string>()}
        </button>
      ),
    },
    {
      accessorKey: "mode",
      header: "Mode",
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {MODE_LABEL[getValue<PaymentMode>()]}
        </span>
      ),
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground truncate max-w-[160px] block">
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
          t={row.original}
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

  const totalCredit = data.filter((t) => t.transactionType === "CREDIT").reduce((s, t) => s + t.amount, 0);
  const totalDebit  = data.filter((t) => t.transactionType === "DEBIT").reduce((s, t) => s + t.amount, 0);
  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Records per page */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="text-xs text-muted-foreground">Show</span>
        <select
          value={pageSize}
          onChange={(e) => { const v = Number(e.target.value); setPageSize(v); table.setPageSize(v); }}
          className="text-xs border border-border rounded-lg px-2 py-1 bg-white text-foreground outline-none focus:border-brand-300"
        >
          {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
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
                      "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground select-none whitespace-nowrap",
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
                  No transactions found.
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
          {data.length > 0 && (
            <tfoot>
              <tr className="bg-brand-50/60 border-t-2 border-brand-100">
                <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-foreground">
                  Total ({data.length} records)
                </td>
                <td colSpan={2} className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-green-700 font-semibold">
                      Credit: {formatCurrency(totalCredit)}
                    </span>
                    <span className="text-[10px] text-red-600 font-semibold">
                      Debit: {formatCurrency(totalDebit)}
                    </span>
                  </div>
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Page {pageIndex + 1} of {pageCount}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i)
              .slice(Math.max(0, pageIndex - 2), Math.min(pageCount, pageIndex + 3))
              .map((i) => (
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
