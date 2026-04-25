"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BillForm } from "@/components/bill/BillForm";

export default function AddBillPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "manual";

  return (
    <div className="p-6">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/bill"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-brand-700 transition-colors"
        >
          <ChevronLeft size={14} />
          Sales Bills
        </Link>
        <span className="text-muted-foreground/40 text-xs">/</span>
        <span className="text-xs font-semibold text-foreground">
          {type === "import" ? "Import Delivery Challan" : "New Sales Bill"}
        </span>
      </div>

      {/* ── Page Title ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          {type === "import" ? "Import Delivery Challan" : "New Sales Bill"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {type === "import"
            ? "Select a delivery challan to auto-populate the bill."
            : "Fill in the details below to create a new sales bill."}
        </p>
      </div>

      {/* ── Form ── */}
      <BillForm />
    </div>
  );
}
