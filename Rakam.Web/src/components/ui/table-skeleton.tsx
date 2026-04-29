import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  /** Number of skeleton body rows to render. Default: 8 */
  rows?: number;
  /** Number of skeleton columns to render. Default: 5 */
  cols?: number;
  /** Optional column header labels. When supplied, `cols` is ignored. */
  headers?: string[];
  className?: string;
}

/**
 * Drop-in animated skeleton for any data table.
 * Renders a table shell with pulsing placeholder cells.
 */
export function TableSkeleton({
  rows = 8,
  cols,
  headers,
  className,
}: TableSkeletonProps) {
  const colCount = headers ? headers.length : (cols ?? 5);

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-border bg-white",
        className
      )}
    >
      <table className="w-full">
        {headers && (
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {Array.from({ length: colCount }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <div
                    className="h-4 bg-muted animate-pulse rounded-lg"
                    style={{ width: `${55 + ((i + j) % 3) * 15}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
