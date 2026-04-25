import { FileText, Users, Package, Clock } from "lucide-react";

const QUICK_STATS = [
  {
    label: "Total Bills This Month",
    value: "48",
    sub: "Sales + Purchase",
    icon: FileText,
    accent: "#16532d",
    bg: "#f0faf3",
  },
  {
    label: "Pending Payments",
    value: "₹1,42,000",
    sub: "12 bills unpaid",
    icon: Clock,
    accent: "#b45309",
    bg: "#fffbeb",
  },
  {
    label: "Active Parties",
    value: "24",
    sub: "Customers & Suppliers",
    icon: Users,
    accent: "#0369a1",
    bg: "#f0f9ff",
  },
  {
    label: "Products in Master",
    value: "137",
    sub: "Across all categories",
    icon: Package,
    accent: "#7c3aed",
    bg: "#faf5ff",
  },
];

export function QuickStats() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {QUICK_STATS.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="bg-white rounded-2xl px-5 py-4 border border-border flex items-start gap-3"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: s.bg }}
            >
              <Icon size={16} strokeWidth={1.8} style={{ color: s.accent }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
                {s.label}
              </p>
              <p className="text-xl font-bold text-foreground mt-1 tabular-nums">
                {s.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
