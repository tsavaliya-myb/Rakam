"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

/* ── Shared tooltip style ── */
const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e8f0e9",
  borderRadius: 12,
  fontSize: 12,
  fontFamily: "var(--font-plus-jakarta, sans-serif)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  padding: "8px 12px",
};

const axisStyle = {
  fontSize: 11,
  fill: "#94a3b8",
  fontFamily: "var(--font-plus-jakarta, sans-serif)",
};

/* ── Currency formatter ── */
function fmtK(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
  return `₹${v}`;
}

/* ─────────────────────────────────────────────
   Sales Bill Party-wise Bar Chart
───────────────────────────────────────────── */
export interface SalesBarData {
  label: string;
  total: number;
  received: number;
  pending: number;
}

export function SalesBarChart({ data }: { data: SalesBarData[] }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-border">
      <h3 className="font-semibold text-foreground text-sm">
        Sales Bill — Party Wise
      </h3>
      <p className="text-[11px] text-muted-foreground mt-0.5 mb-4">
        Total Turnover · Received · Pending
      </p>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          barCategoryGap="30%"
          barGap={3}
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="label"
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtK}
          />
          <Tooltip
            formatter={(v: number) => fmtK(v)}
            contentStyle={tooltipStyle}
            cursor={{ fill: "#f0faf3", radius: 6 }}
          />
          <Bar dataKey="total"    name="Total Turnover" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="received" name="Received"       fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending"  name="Pending"        fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-4 mt-3">
        {[
          { color: "#3b82f6", label: "Total Turnover" },
          { color: "#22c55e", label: "Received" },
          { color: "#f87171", label: "Pending" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: color }}
            />
            <span className="text-[10px] text-muted-foreground font-medium">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Purchase Bill Party-wise Bar Chart
───────────────────────────────────────────── */
export interface PurchaseBarData {
  label: string;
  total: number;
  paid: number;
  pending: number;
}

export function PurchaseBarChart({ data }: { data: PurchaseBarData[] }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-border">
      <h3 className="font-semibold text-foreground text-sm">
        Purchase Bill — Party Wise
      </h3>
      <p className="text-[11px] text-muted-foreground mt-0.5 mb-4">
        Total Turnover · Paid · Pending
      </p>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          barCategoryGap="30%"
          barGap={3}
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="label"
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtK}
          />
          <Tooltip
            formatter={(v: number) => fmtK(v)}
            contentStyle={tooltipStyle}
            cursor={{ fill: "#f5f3ff", radius: 6 }}
          />
          <Bar dataKey="total"   name="Total Turnover" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="paid"    name="Paid"           fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending" name="Pending"        fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-4 mt-3">
        {[
          { color: "#3b82f6", label: "Total Turnover" },
          { color: "#f59e0b", label: "Paid" },
          { color: "#f87171", label: "Pending" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: color }}
            />
            <span className="text-[10px] text-muted-foreground font-medium">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GST Donut Chart (Sales or Purchase)
───────────────────────────────────────────── */
export interface DonutChartProps {
  title: string;
  total: string;
  withGst: number;
  withoutGst: number;
  colors: [string, string];
}

export function GstDonutChart({
  title,
  total,
  withGst,
  withoutGst,
  colors,
}: DonutChartProps) {
  const data = [
    { name: "With GST",    value: withGst },
    { name: "Without GST", value: withoutGst },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-border">
      <h3 className="font-semibold text-foreground text-sm mb-4">
        {title} Distribution
      </h3>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="flex-shrink-0">
          <PieChart width={114} height={114}>
            <Pie
              data={data}
              cx={52}
              cy={52}
              innerRadius={32}
              outerRadius={48}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Pie>
          </PieChart>
        </div>

        {/* Legend */}
        <div className="flex-1">
          <p className="text-2xl font-bold text-foreground tabular-nums mb-3">
            {total}
          </p>
          <div className="space-y-2.5">
            {data.map((seg, i) => (
              <div key={seg.name} className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded flex-shrink-0"
                  style={{ background: colors[i] }}
                />
                <span className="text-xs text-muted-foreground flex-1">
                  {seg.name}
                </span>
                <span className="text-xs font-bold text-foreground tabular-nums">
                  {fmtK(seg.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
