"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNIT_OPTIONS } from "@/config/constants";
import type { BillFormValues } from "@/lib/schemas/bill.schema";

const MOCK_PRODUCTS = [
  { id: "pr1", name: "Cotton Fabric", itemCode: "CTN-001", hsnCode: "5208", rate: 250, unit: "Mtr" },
  { id: "pr2", name: "Polyester Thread", itemCode: "PLY-002", hsnCode: "5402", rate: 45, unit: "KG" },
  { id: "pr3", name: "Dye Chemical A", itemCode: "DYE-003", hsnCode: "3204", rate: 820, unit: "KG" },
  { id: "pr4", name: "Packing Bag", itemCode: "PKG-004", hsnCode: "3923", rate: 12, unit: "Pcs" },
];

interface LineItemsTableProps {
  applyGst: boolean;
}

export function LineItemsTable({ applyGst }: LineItemsTableProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<BillFormValues>();

  const { fields, append, remove } = useFieldArray<BillFormValues>({
    name: "lineItems",
  });

  function addRow() {
    append({
      id: crypto.randomUUID(),
      productName: "",
      itemCode: "",
      hsnCode: "",
      qty: 1,
      unit: "Pcs",
      rate: 0,
      discount: 0,
      amount: 0,
    });
  }

  function addLossRow() {
    append({
      id: crypto.randomUUID(),
      productName: "Loss / Adjustment",
      itemCode: "",
      hsnCode: "",
      qty: 1,
      unit: "Pcs",
      rate: 0,
      discount: 0,
      amount: 0,
    });
  }

  function handleProductSelect(index: number, productId: string) {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product) return;
    setValue(`lineItems.${index}.productId`, product.id);
    setValue(`lineItems.${index}.productName`, product.name);
    setValue(`lineItems.${index}.itemCode`, product.itemCode);
    setValue(`lineItems.${index}.hsnCode`, product.hsnCode);
    setValue(`lineItems.${index}.rate`, product.rate);
    setValue(`lineItems.${index}.unit`, product.unit);
    recalcAmount(index);
  }

  function recalcAmount(index: number) {
    const qty = watch(`lineItems.${index}.qty`) || 0;
    const rate = watch(`lineItems.${index}.rate`) || 0;
    const disc = watch(`lineItems.${index}.discount`) || 0;
    const base = qty * rate;
    const amount = base - (base * disc) / 100;
    setValue(`lineItems.${index}.amount`, parseFloat(amount.toFixed(2)));
  }

  const inputCls = cn(
    "w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-white text-foreground outline-none",
    "focus:border-brand-300 focus:ring-1 focus:ring-brand-900/10 transition-all"
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Products
        </h3>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              {[
                "Product", "Item Code", "HSN Code",
                "Qty", "Unit", "Rate (₹)",
                ...(applyGst ? [] : []),
                "Discount (%)", "Amount (₹)", "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {fields.map((field, index) => (
              <tr
                key={field.id}
                className="border-b border-border last:border-0 hover:bg-brand-50/30 transition-colors"
              >
                {/* Product */}
                <td className="px-3 py-2 min-w-[160px]">
                  <select
                    className={inputCls}
                    onChange={(e) => handleProductSelect(index, e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Select product</option>
                    {MOCK_PRODUCTS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {errors.lineItems?.[index]?.productName && (
                    <p className="text-[10px] text-destructive mt-0.5">Required</p>
                  )}
                </td>

                {/* Item Code */}
                <td className="px-3 py-2 min-w-[90px]">
                  <input
                    {...register(`lineItems.${index}.itemCode`)}
                    placeholder="Auto"
                    className={inputCls}
                  />
                </td>

                {/* HSN Code */}
                <td className="px-3 py-2 min-w-[90px]">
                  <input
                    {...register(`lineItems.${index}.hsnCode`)}
                    placeholder="Auto"
                    className={inputCls}
                  />
                </td>

                {/* Qty */}
                <td className="px-3 py-2 min-w-[70px]">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`lineItems.${index}.qty`)}
                    onChange={(e) => {
                      register(`lineItems.${index}.qty`).onChange(e);
                      setTimeout(() => recalcAmount(index), 0);
                    }}
                    className={cn(inputCls, "tabular-nums")}
                  />
                </td>

                {/* Unit */}
                <td className="px-3 py-2 min-w-[80px]">
                  <select
                    {...register(`lineItems.${index}.unit`)}
                    className={inputCls}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </td>

                {/* Rate */}
                <td className="px-3 py-2 min-w-[90px]">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`lineItems.${index}.rate`)}
                    onChange={(e) => {
                      register(`lineItems.${index}.rate`).onChange(e);
                      setTimeout(() => recalcAmount(index), 0);
                    }}
                    className={cn(inputCls, "tabular-nums")}
                  />
                </td>

                {/* Discount */}
                <td className="px-3 py-2 min-w-[80px]">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register(`lineItems.${index}.discount`)}
                    onChange={(e) => {
                      register(`lineItems.${index}.discount`).onChange(e);
                      setTimeout(() => recalcAmount(index), 0);
                    }}
                    className={cn(inputCls, "tabular-nums")}
                  />
                </td>

                {/* Amount */}
                <td className="px-3 py-2 min-w-[100px]">
                  <input
                    readOnly
                    {...register(`lineItems.${index}.amount`)}
                    className={cn(
                      inputCls,
                      "bg-secondary cursor-default font-semibold tabular-nums"
                    )}
                  />
                </td>

                {/* Remove */}
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-colors"
        >
          <Plus size={13} />
          Add Product
        </button>
        <button
          type="button"
          onClick={addLossRow}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          <Plus size={13} />
          Add Loss Product
        </button>
      </div>

      {errors.lineItems?.root && (
        <p className="text-xs text-destructive mt-2">
          {errors.lineItems.root.message}
        </p>
      )}
    </div>
  );
}
