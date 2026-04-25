"use client";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { ReportRow } from "@/types";

interface Props {
  columns: { key: string; label: string }[];
  data: ReportRow[];
  reportType: string;
}

const CURRENCY_KEYS = new Set([
  "amount", "total", "taxable", "gst", "pending",
  "received", "paid", "outstanding", "totalBilled",
  "rate",
]);
const DATE_KEYS   = new Set(["date"]);
const STATUS_KEYS = new Set(["status", "type"]);

function CellValue({ colKey, value }: { colKey: string; value: unknown }) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }

  if (STATUS_KEYS.has(colKey)) {
    const v = String(value);
    if (v === "PAID" || v === "Credit") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
          {v}
        </span>
      );
    }
    if (v === "UNPAID" || v === "Debit") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
          {v}
        </span>
      );
    }
    return <span className="text-xs text-foreground">{v}</span>;
  }

  if (DATE_KEYS.has(colKey)) {
    return <span className="text-xs text-foreground whitespace-nowrap">{formatDate(String(value))}</span>;
  }

  if (CURRENCY_KEYS.has(colKey)) {
    const num = typeof value === "number" ? value : Number(value);
    return (
      <span className="text-xs font-semibold text-foreground whitespace-nowrap">
        {formatCurrency(num)}
      </span>
    );
  }

  return <span className="text-xs text-foreground">{String(value)}</span>;
}

export function ReportTable({ columns, data, reportType }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border py-16 text-center text-sm text-muted-foreground">
        No data available for this report.
      </div>
    );
  }

  const isPnL = reportType === "Profit & Loss Report";

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={cn(
                  "border-b border-border last:border-0 hover:bg-secondary/40 transition-colors",
                  i % 2 === 1 && "bg-secondary/20",
                  isPnL && (row.label === "Net Profit" || row.label === "Gross Profit")
                    ? "bg-green-50/60 font-semibold"
                    : ""
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <CellValue colKey={col.key} value={row[col.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {/* Footer sum row for amount columns */}
          {!isPnL && (() => {
            const amountCols = columns.filter((c) => CURRENCY_KEYS.has(c.key));
            if (amountCols.length === 0) return null;
            return (
              <tfoot>
                <tr className="bg-brand-50/60 border-t-2 border-brand-100">
                  {columns.map((col, idx) => {
                    if (idx === 0) {
                      return (
                        <td key={col.key} className="px-4 py-3 text-xs font-semibold text-foreground">
                          Total ({data.length})
                        </td>
                      );
                    }
                    if (CURRENCY_KEYS.has(col.key)) {
                      const sum = data.reduce((s, r) => s + (Number(r[col.key]) || 0), 0);
                      return (
                        <td key={col.key} className="px-4 py-3 text-xs font-bold text-brand-900 whitespace-nowrap">
                          {formatCurrency(sum)}
                        </td>
                      );
                    }
                    return <td key={col.key} className="px-4 py-3" />;
                  })}
                </tr>
              </tfoot>
            );
          })()}
        </table>
      </div>
    </div>
  );
}
