"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { PurchaseBillForm } from "@/components/purchase-bill/PurchaseBillForm";
import { usePurchaseBill } from "@/hooks/api/use-purchase-bills";

export default function EditPurchaseBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: bill, isLoading, isError } = usePurchaseBill(id);

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
          {bill ? `Edit ${bill.billNo}` : "Edit Bill"}
        </span>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          {bill ? `Edit ${bill.billNo}` : "Edit Purchase Bill"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your supplier's invoice details below.
        </p>
      </div>

      {/* States */}
      {isLoading && <TableSkeleton cols={5} rows={4} />}

      {isError && (
        <ErrorState message="Failed to load purchase bill." />
      )}

      {bill && <PurchaseBillForm bill={bill} />}
    </div>
  );
}
