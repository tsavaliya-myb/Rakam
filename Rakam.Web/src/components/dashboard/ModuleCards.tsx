"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText, ShoppingCart, Truck, ArrowLeftRight,
  Receipt, BarChart3, Plus, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  FileText, ShoppingCart, Truck, ArrowLeftRight, Receipt, BarChart3,
};

export interface ModuleCardData {
  id: string;
  label: string;
  description: string;
  icon: string;
  accent: string;
  bg: string;
  href: string;
  newHref?: string;
  newLabel: string;
}

export const MODULE_CARDS: ModuleCardData[] = [
  {
    id: "bill",
    label: "Sales Bill",
    description: "Create and manage Sales Bills",
    icon: "FileText",
    accent: "#16532d",
    bg: "#f0faf3",
    href: "/bill",
    newHref: "/bill/add",
    newLabel: "+ New",
  },
  {
    id: "challan",
    label: "Delivery Challan",
    description: "Create and manage Delivery Challans",
    icon: "Truck",
    accent: "#0369a1",
    bg: "#f0f9ff",
    href: "/delivery-challan",
    newHref: "/delivery-challan/add",
    newLabel: "+ New",
  },
  {
    id: "purchase",
    label: "Purchase Bill",
    description: "Create and manage Purchase Bills",
    icon: "ShoppingCart",
    accent: "#7c3aed",
    bg: "#faf5ff",
    href: "/purchase-bill",
    newHref: "/purchase-bill/add",
    newLabel: "+ New",
  },
  {
    id: "payment",
    label: "Payment",
    description: "Manage Payments & Transactions",
    icon: "ArrowLeftRight",
    accent: "#b45309",
    bg: "#fffbeb",
    href: "/transactions",
    newLabel: "+ New",
  },
  {
    id: "expense",
    label: "Expense",
    description: "Track and manage Expenses",
    icon: "Receipt",
    accent: "#dc2626",
    bg: "#fef2f2",
    href: "/expense-tracker",
    newHref: "/expense-tracker/add",
    newLabel: "+ New",
  },
  {
    id: "reports",
    label: "Reports",
    description: "View Reports and analytics",
    icon: "BarChart3",
    accent: "#0f766e",
    bg: "#f0fdfa",
    href: "/reports",
    newLabel: "Create New",
  },
];

function ModuleCard({ card }: { card: ModuleCardData }) {
  const [hovered, setHovered] = useState(false);
  const Icon = ICON_MAP[card.icon];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "bg-white rounded-2xl p-5 flex flex-col gap-4 border border-border",
        "transition-all duration-200",
        hovered && "shadow-lg -translate-y-0.5"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: card.bg }}
        >
          {Icon && (
            <Icon size={20} strokeWidth={1.8} style={{ color: card.accent }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
            MANAGE
          </p>
          <h3 className="font-semibold text-foreground text-sm">{card.label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed text-pretty">
            {card.description}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={card.href}
          className="flex-1 py-2 rounded-xl text-xs font-semibold text-center transition-all hover:opacity-90 flex items-center justify-center gap-1"
          style={{
            border: `1.5px solid ${card.accent}30`,
            color: card.accent,
            background: card.bg,
          }}
        >
          <ExternalLink size={12} />
          Open
        </Link>
        <Link
          href={card.newHref ?? card.href}
          className="flex-1 py-2 rounded-xl text-xs font-semibold text-white text-center transition-all hover:opacity-90 flex items-center justify-center gap-1"
          style={{ background: card.accent }}
        >
          <Plus size={12} />
          {card.newLabel}
        </Link>
      </div>
    </div>
  );
}

export function ModuleCards() {
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Quick Access
      </p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {MODULE_CARDS.map((card) => (
          <ModuleCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
