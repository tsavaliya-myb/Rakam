"use client";

import { useState } from "react";
import {
  User, FileText, ShoppingCart, Truck, Receipt,
  TrendingUp, Settings2, LayoutTemplate, Package,
  CreditCard, Zap, ChevronRight,
} from "lucide-react";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SalesBillSettings } from "@/components/settings/SalesBillSettings";
import { PurchaseBillSettings, DCSettings } from "@/components/settings/BillDCSettings";
import { ExpenseSettings, IncomeSettings } from "@/components/settings/ExpenseIncomeSettings";
import {
  PDFTemplateSettings, InventorySettings,
  OtherSettings, SubscriptionSettings, EwayGSPSettings,
} from "@/components/settings/MoreSettings";
import { cn } from "@/lib/utils";

type SectionId =
  | "profile"
  | "sales-bill"
  | "purchase-bill"
  | "dc"
  | "expense"
  | "income"
  | "pdf-template"
  | "inventory"
  | "other"
  | "subscription"
  | "eway-gsp";

interface NavSection {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  group?: string;
}

const NAV_SECTIONS: NavSection[] = [
  { id: "profile",       label: "Profile Details",        icon: User,          group: "Account" },
  { id: "sales-bill",    label: "Sales Bill Settings",    icon: FileText,      group: "Modules" },
  { id: "purchase-bill", label: "Purchase Bill Settings", icon: ShoppingCart,  group: "Modules" },
  { id: "dc",            label: "Delivery Ch. Settings",  icon: Truck,         group: "Modules" },
  { id: "expense",       label: "Expense Settings",       icon: Receipt,       group: "Modules" },
  { id: "income",        label: "Income Settings",        icon: TrendingUp,    group: "Modules" },
  { id: "pdf-template",  label: "PDF Template",           icon: LayoutTemplate, group: "More Settings" },
  { id: "inventory",     label: "Inventory Management",   icon: Package,       group: "More Settings" },
  { id: "other",         label: "Other Settings",         icon: Settings2,     group: "More Settings" },
  { id: "subscription",  label: "My Subscriptions",       icon: CreditCard,    group: "More Settings" },
  { id: "eway-gsp",      label: "E-way Bill GSP",         icon: Zap,           group: "More Settings" },
];

const SECTION_TITLES: Record<SectionId, { title: string; description: string }> = {
  "profile":       { title: "Profile Details",         description: "Manage your personal info and business type." },
  "sales-bill":    { title: "Sales Bill Settings",     description: "Configure PDF, labels, GST, and discount behaviour for Sales Bills." },
  "purchase-bill": { title: "Purchase Bill Settings",  description: "Configure withholding tax for Purchase Bills." },
  "dc":            { title: "Delivery Challan Settings", description: "Configure PDF, rate visibility and challan defaults." },
  "expense":       { title: "Expense Settings",        description: "Manage categories, suppliers, and expense items." },
  "income":        { title: "Income Settings",         description: "Manage income categories and suppliers." },
  "pdf-template":  { title: "PDF Template",            description: "Choose Standard or Modern template for bill PDFs." },
  "inventory":     { title: "Inventory Management",    description: "Enable stock tracking and configure inventory rules." },
  "other":         { title: "Other Settings",          description: "Shortcuts, decimals, party-wise rates, and shipment address." },
  "subscription":  { title: "My Subscriptions",        description: "View your current plan and upgrade options." },
  "eway-gsp":      { title: "E-way Bill GSP",          description: "Register your GSP credentials for E-way Bill generation." },
};

function renderSection(id: SectionId) {
  switch (id) {
    case "profile":       return <ProfileSettings />;
    case "sales-bill":    return <SalesBillSettings />;
    case "purchase-bill": return <PurchaseBillSettings />;
    case "dc":            return <DCSettings />;
    case "expense":       return <ExpenseSettings />;
    case "income":        return <IncomeSettings />;
    case "pdf-template":  return <PDFTemplateSettings />;
    case "inventory":     return <InventorySettings />;
    case "other":         return <OtherSettings />;
    case "subscription":  return <SubscriptionSettings />;
    case "eway-gsp":      return <EwayGSPSettings />;
  }
}

export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>("profile");

  const groups = [...new Set(NAV_SECTIONS.map((s) => s.group))];
  const { title, description } = SECTION_TITLES[active];

  return (
    <div className="flex h-full min-h-0">

      {/* ── Settings Sidebar ── */}
      <aside className="w-60 flex-shrink-0 border-r border-border bg-white overflow-y-auto">
        <div className="px-4 pt-6 pb-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-2">
            Settings
          </p>
        </div>

        {groups.map((group) => (
          <div key={group} className="mb-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-5 py-2">
              {group}
            </p>
            <div className="px-2 space-y-0.5">
              {NAV_SECTIONS.filter((s) => s.group === group).map((section) => {
                const Icon = section.icon;
                const isActive = active === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActive(section.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left group",
                      isActive
                        ? "bg-brand-50 text-brand-900 font-semibold"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    <Icon
                      size={15}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className={cn(
                        "flex-shrink-0 transition-colors",
                        isActive ? "text-brand-700" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span className="flex-1 truncate">{section.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-3xl">

          {/* Section header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>

          {/* Section content */}
          <div className="animate-fade-in" key={active}>
            {renderSection(active)}
          </div>
        </div>
      </div>
    </div>
  );
}
