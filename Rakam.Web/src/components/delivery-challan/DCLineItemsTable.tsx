"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNIT_OPTIONS } from "@/config/constants";
import type { DCFormValues } from "@/lib/schemas/delivery-challan.schema";
import { useProductsDropdown } from "@/hooks/api/use-products";

export function DCLineItemsTable() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<DCFormValues>();
  const { fields, append, remove } = useFieldArray<DCFormValues>({ name: "lineItems" });
  const { data: products = [] } = useProductsDropdown();

  function addRow() {
    append({ id: crypto.randomUUID(), productName: "", itemCode: "", hsnCode: "", qty: 1, unit: "Pcs", rate: 0, amount: 0 });
  }

  function handleProductSelect(index: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setValue(`lineItems.${index}.productId`, p.id);
    setValue(`lineItems.${index}.productName`, p.name);
    setValue(`lineItems.${index}.itemCode`, p.itemCode);
    setValue(`lineItems.${index}.hsnCode`, p.hsnCode);
    setValue(`lineItems.${index}.rate`, p.rate ?? 0);
    setValue(`lineItems.${index}.unit`, p.unit);
    recalc(index);
  }

  function recalc(index: number) {
    const qty  = watch(`lineItems.${index}.qty`)  || 0;
    const rate = watch(`lineItems.${index}.rate`) || 0;
    setValue(`lineItems.${index}.amount`, parseFloat((qty * rate).toFixed(2)));
  }

  const cell = cn(
    "w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-white text-foreground outline-none",
    "focus:border-teal-300 focus:ring-1 focus:ring-teal-700/10 transition-all"
  );

  return (
    <div>
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Products</h3>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              {["Product", "Item Code", "HSN Code", "Qty", "Unit", "Rate (₹)", "Amt (₹)", ""].map((h) => (
                <th key={h} className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b border-border last:border-0 hover:bg-teal-50/20 transition-colors">

                {/* Product */}
                <td className="px-3 py-2 min-w-[160px]">
                  <select className={cell} onChange={(e) => handleProductSelect(index, e.target.value)} defaultValue="">
                    <option value="" disabled>Select product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {errors.lineItems?.[index]?.productName && (
                    <p className="text-[10px] text-destructive mt-0.5">Required</p>
                  )}
                </td>

                {/* Item Code */}
                <td className="px-3 py-2 min-w-[90px]">
                  <input {...register(`lineItems.${index}.itemCode`)} placeholder="Auto" className={cell} />
                </td>

                {/* HSN */}
                <td className="px-3 py-2 min-w-[90px]">
                  <input {...register(`lineItems.${index}.hsnCode`)} placeholder="Auto" className={cell} />
                </td>

                {/* Qty */}
                <td className="px-3 py-2 min-w-[70px]">
                  <input type="number" step="0.01" min="0"
                    {...register(`lineItems.${index}.qty`)}
                    onChange={(e) => { register(`lineItems.${index}.qty`).onChange(e); setTimeout(() => recalc(index), 0); }}
                    className={cn(cell, "tabular-nums")} />
                </td>

                {/* Unit */}
                <td className="px-3 py-2 min-w-[80px]">
                  <select {...register(`lineItems.${index}.unit`)} className={cell}>
                    {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>

                {/* Rate */}
                <td className="px-3 py-2 min-w-[90px]">
                  <input type="number" step="0.01" min="0"
                    {...register(`lineItems.${index}.rate`)}
                    onChange={(e) => { register(`lineItems.${index}.rate`).onChange(e); setTimeout(() => recalc(index), 0); }}
                    className={cn(cell, "tabular-nums")} />
                </td>

                {/* Amount */}
                <td className="px-3 py-2 min-w-[100px]">
                  <input readOnly {...register(`lineItems.${index}.amount`)}
                    className={cn(cell, "bg-secondary cursor-default font-semibold tabular-nums")} />
                </td>

                {/* Remove */}
                <td className="px-3 py-2">
                  <button type="button" onClick={() => remove(index)} disabled={fields.length === 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={addRow}
        className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-colors">
        <Plus size={13} /> Add Product
      </button>
    </div>
  );
}
