"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Package, ExternalLink } from "lucide-react";
import { productSchema, type ProductFormValues } from "@/lib/schemas/party-product.schema";
import { UNIT_OPTIONS, GST_OPTIONS } from "@/config/constants";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductModalProps {
  product?: Product;
  onClose: () => void;
  onSubmit: (data: ProductFormValues) => void | Promise<void>;
}

const inp = cn(
  "w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none",
  "focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-900/10 transition-all placeholder:text-muted-foreground/60"
);
const lbl = "block text-xs font-semibold text-foreground mb-1.5";

export function ProductModal({ product, onClose, onSubmit }: ProductModalProps) {
  const isEdit = !!product;
  const [charCount, setCharCount] = useState(product?.description?.length ?? 0);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ProductFormValues>({
      resolver: zodResolver(productSchema),
      defaultValues: product
        ? { ...product, gst: product.gst?.toString() }
        : { unit: "Pcs", gst: "0", rate: 0 },
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#faf5ff] flex items-center justify-center">
              <Package size={16} strokeWidth={1.8} className="text-violet-700" />
            </div>
            <h2 className="font-semibold text-foreground text-sm">
              {isEdit ? `Edit Product — ${product.name}` : "Add New Product"}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Product Name */}
            <div>
              <label className={lbl}>
                Product Name <span className="text-destructive">*</span>
              </label>
              <input {...register("name")} placeholder="e.g. Cotton Fabric"
                className={cn(inp, errors.name && "border-destructive")} />
              {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name.message}</p>}
            </div>

            {/* Rate + Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Rate (₹)</label>
                <input type="number" step="0.01" min="0" {...register("rate")}
                  placeholder="0.00" className={cn(inp, "tabular-nums")} />
              </div>
              <div>
                <label className={lbl}>
                  Unit <span className="text-destructive">*</span>
                </label>
                <select {...register("unit")} className={cn(inp, errors.unit && "border-destructive")}>
                  {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                {errors.unit && <p className="text-[11px] text-destructive mt-1">{errors.unit.message}</p>}
              </div>
            </div>

            {/* GST */}
            <div>
              <label className={lbl}>GST (%)</label>
              <select {...register("gst")} className={inp}>
                <option value="">Select GST</option>
                {GST_OPTIONS.map((g) => <option key={g} value={g}>GST {g}</option>)}
              </select>
            </div>

            {/* Item Code + HSN Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Item Code</label>
                <input {...register("itemCode")} placeholder="e.g. CTN-001" className={inp} />
              </div>
              <div>
                <label className={lbl}>HSN Code</label>
                <div className="relative">
                  <input {...register("hsnCode")} placeholder="e.g. 5208" className={cn(inp, "pr-20")} />
                  <button type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-semibold text-brand-700 hover:text-brand-900 transition-colors">
                    <ExternalLink size={10} />
                    Find Code
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={lbl}>
                <span className="flex items-center justify-between">
                  Description
                  <span className="text-muted-foreground font-normal">{charCount}/250</span>
                </span>
              </label>
              <textarea rows={3} maxLength={250}
                {...register("description", {
                  onChange: (e) => setCharCount(e.target.value.length),
                })}
                placeholder="Optional product description..."
                className={cn(inp, "resize-none")} />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button type="submit" form="product-form" disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 transition-colors disabled:opacity-60">
            {isSubmitting ? "Saving…" : isEdit ? "Update Product" : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
