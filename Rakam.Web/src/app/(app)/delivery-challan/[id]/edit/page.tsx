"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { DCForm } from "@/components/delivery-challan/DCForm";
import { useDeliveryChallan } from "@/hooks/api/use-delivery-challans";

export default function EditDeliveryChallanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: dc, isLoading, isError } = useDeliveryChallan(id);

  return (
    <div className="p-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/delivery-challan"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-teal-700 transition-colors"
        >
          <ChevronLeft size={14} />
          Delivery Challans
        </Link>
        <span className="text-muted-foreground/40 text-xs">/</span>
        <span className="text-xs font-semibold text-foreground">
          {dc ? `Edit ${dc.dcNo}` : "Edit Challan"}
        </span>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          {dc ? `Edit ${dc.dcNo}` : "Edit Delivery Challan"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update delivery challan details below.
        </p>
      </div>

      {isLoading && <TableSkeleton cols={5} rows={4} />}

      {isError && (
        <ErrorState message="Failed to load delivery challan." />
      )}

      {dc && <DCForm dc={dc} />}
    </div>
  );
}
