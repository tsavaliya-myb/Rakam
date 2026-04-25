"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PurchaseBillForm } from "@/components/purchase-bill/PurchaseBillForm";

export default function AddPurchaseBillPage() {
  return (
    <div className="p-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/purchase-bill"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-violet-700 transition-colors"
        >
          <ChevronLeft size={14} />
          Purchase Bills
        </Link>
        <span className="text-muted-foreground/40 text-xs">/</span>
        <span className="text-xs font-semibold text-foreground">
          New Purchase Bill
        </span>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          New Purchase Bill
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your supplier's invoice details below.
        </p>
      </div>

      {/* Form */}
      <PurchaseBillForm />
    </div>
  );
}
