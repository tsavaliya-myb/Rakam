"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DCForm } from "@/components/delivery-challan/DCForm";

export default function AddDeliveryChallanPage() {
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
          New Delivery Challan
        </span>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          New Delivery Challan
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a delivery challan that can later be converted to a Sales Bill.
        </p>
      </div>

      {/* Form */}
      <DCForm />
    </div>
  );
}
