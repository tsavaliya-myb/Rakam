"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  CreditCard, Printer, Download, Eye,
  MoreHorizontal, ChevronUp, ChevronDown,
  ChevronsUpDown, Pencil, Trash2,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/bill/StatusBadge";
import type { PurchaseBill } from "@/types";

interface PurchaseBillTableProps {
  data: PurchaseBill[];
  onRecordPayment: (bill: PurchaseBill) => void;
  onView: (bill: PurchaseBill) => void;
  onEdit: (bill: PurchaseBill) => void;
  onDelete: (bill: PurchaseBill) => void;
  onPrint: (bill: PurchaseBill) => void;
  onDownload: (bill: PurchaseBill) => void;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc")  return <ChevronUp size={13} className="text-brand-700" />;
  if (sorted === "desc") return <ChevronDown size={13} className="text-brand-700" />;
  return <ChevronsUpDown size={13} className="text-muted-foreground/50" />;
}

function ActionMenu({
  bill, onRecordPayment, onView, onEdit, onDelete, onPrint, onDownload,
}: { bill: PurchaseBill } & Omit<PurchaseBillTableProps, "data">) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      {/* Record Payment */}
      <button
        onClick={() => onRecordPayment(bill)}
        title={bill.status === "PAID" ? "Already Paid" : "Record Payment"}
        disabled={bill.status === "PAID"}
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
          bill.status === "PAID"
            ? "text-muted-foreground/30 cursor-not-allowed"
            : "text-brand-700 hover:bg-brand-50"
        )}
      >
        <CreditCard size={14} strokeWidth={1.8} />
      </button>

      {/* Print */}
      <button onClick={() => onPrint(bill)} title="Print"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-secondary transition-colors">
        <Printer size={14} strokeWidth={1.8} />
      </button>

      {/* Download */}
      <button onClick={() => onDownload(bill)} title="Download PDF"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-secondary transition-colors">
        <Download size={14} strokeWidth={1.8} />
      </button>

      {/* View */}
      <button onClick={() => onView(bill)} title="View"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-secondary transition-colors">
        <Eye size={14} strokeWidth={1.8} />
      </button>

      {/* More ⋮ */}
      <div className="relative">
        <button
          onClick={() => setMoreOpen((o) => !o)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-secondary transition-colors"
        >
          <MoreHorizontal size={14} />
        </button>
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-border py-1 z-50 animate-fade-in">
              <button
                onClick={() => { onEdit(bill); setMoreOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                onClick={() => { onDelete(bill); setMoreOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-destructive hover:bg-red-50 transition-colors"
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

const RECORDS_OPTIONS = [10, 20, 30, 40, 50, 100];

export function PurchaseBillTable({
  data,
  onRecordPayment,
  onView,
  onEdit,
  onDelete,
  onPrint,
  onDownload,
}: PurchaseBillTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<PurchaseBill>[]>(
    () => [
      {
        accessorKey: "billDate",
        header: "Bill Date",
        cell: ({ getValue }) => (
          <span className="text-xs text-foreground tabular-nums whitespace-nowrap">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: "billNo",
        header: "Bill No.",
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-violet-700 whitespace-nowrap">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "partyName",
        header: "Party Name",
        cell: ({ getValue }) => (
          <span className="text-xs font-medium text-foreground">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "billType",
        header: "Bill Type",
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return (
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border",
              v === "WITH_TAX"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-50 text-slate-600 border-slate-200"
            )}>
              {v === "WITH_TAX" ? "With Tax" : "Without Tax"}
            </span>
          );
        },
      },
      {
        accessorKey: "totalQty",
        header: "Total Qty",
        cell: ({ getValue }) => (
          <span className="text-xs text-foreground tabular-nums">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total Amount",
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-foreground tabular-nums whitespace-nowrap">
            {formatCurrency(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: "pendingAmount",
        header: "Pending Amount",
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return (
            <span className={cn(
              "text-xs font-semibold tabular-nums whitespace-nowrap",
              v > 0 ? "text-red-600" : "text-green-600"
            )}>
              {formatCurrency(v)}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <StatusBadge status={getValue<"PAID" | "UNPAID" | "PARTIAL">()} />
        ),
      },
      {
        accessorKey: "dueDays",
        header: "Due Days",
        cell: ({ getValue, row }) => {
          const days = getValue<number>();
          if (row.original.status === "PAID")
            return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <span className={cn(
              "text-xs font-medium tabular-nums",
              days > 0 ? "text-amber-600" : "text-red-600"
            )}>
              {days > 0 ? `${days}d` : "Overdue"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <ActionMenu
            bill={row.original}
            onRecordPayment={onRecordPayment}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onPrint={onPrint}
            onDownload={onDownload}
          />
        ),
      },
    ],
    [onRecordPayment, onView, onEdit, onDelete, onPrint, onDownload]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const totalAmount  = data.reduce((s, b) => s + b.totalAmount, 0);
  const totalPending = data.reduce((s, b) => s + b.pendingAmount, 0);

  return (
    <div className="flex flex-col gap-0">
      {/* Records per page */}
      <div className="flex items-center gap-2 px-1 mb-3">
        <span className="text-xs text-muted-foreground">Show</span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="px-2 py-1 text-xs rounded-lg border border-border bg-white text-foreground outline-none"
        >
          {RECORDS_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">records per page</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border bg-secondary/60">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      "px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap select-none",
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
                <td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No purchase bills found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-violet-50/30 transition-colors"
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

          {/* Footer */}
          <tfoot>
            <tr className="border-t-2 border-border bg-secondary/80">
              <td colSpan={4} className="px-4 py-3 text-xs font-bold text-foreground">
                Total ({data.length})
              </td>
              <td />
              <td className="px-4 py-3 text-xs font-bold text-foreground tabular-nums whitespace-nowrap">
                {formatCurrency(totalAmount)}
              </td>
              <td className="px-4 py-3 text-xs font-bold text-red-600 tabular-nums whitespace-nowrap">
                {formatCurrency(totalPending)}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-1">
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </span>{" "}
          –{" "}
          <span className="font-semibold text-foreground">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              data.length
            )}
          </span>{" "}
          of <span className="font-semibold text-foreground">{data.length}</span> records
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => i).map((i) => (
            <button
              key={i}
              onClick={() => table.setPageIndex(i)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-semibold transition-colors",
                table.getState().pagination.pageIndex === i
                  ? "bg-violet-700 text-white"
                  : "border border-border text-foreground hover:bg-secondary"
              )}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
