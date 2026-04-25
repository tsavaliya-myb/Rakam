"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNIT_OPTIONS } from "@/config/constants";
import type { PurchaseBillFormValues } from "@/lib/schemas/purchase-bill.schema";

const MOCK_PRODUCTS = [
  { id: "pr1", name: "Raw Cotton",       itemCode: "RC-001",  hsnCode: "5201", rate: 180,  unit: "KG"  },
  { id: "pr2", name: "Polyester Yarn",   itemCode: "PY-002",  hsnCode: "5402", rate: 320,  unit: "KG"  },
  { id: "pr3", name: "Dye Chemical",     itemCode: "DC-003",  hsnCode: "3204", rate: 750,  unit: "KG"  },
  { id: "pr4", name: "Packing Material", itemCode: "PM-004",  hsnCode: "3923", rate: 15,   unit: "Pcs" },
  { id: "pr5", name: "Greige Fabric",    itemCode: "GF-005",  hsnCode: "5208", rate: 95,   unit: "Mtr" },
];

interface PurchaseLineItemsTableProps {
  applyGst: boolean;
}

export function PurchaseLineItemsTable({ applyGst }: PurchaseLineItemsTableProps) {
  const { register, watch, setValue, formState: { errors } } =
    useFormContext<PurchaseBillFormValues>();

  const { fields, append, remove } = useFieldArray<PurchaseBillFormValues>({
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

  function handleProductSelect(index: number, productId: string) {
    const p = MOCK_PRODUCTS.find((x) => x.id === productId);
    if (!p) return;
    setValue(`lineItems.${index}.productId`, p.id);
    setValue(`lineItems.${index}.productName`, p.name);
    setValue(`lineItems.${index}.itemCode`, p.itemCode);
    setValue(`lineItems.${index}.hsnCode`, p.hsnCode);
    setValue(`lineItems.${index}.rate`, p.rate);
    setValue(`lineItems.${index}.unit`, p.unit);
    recalc(index);
  }

  function recalc(index: number) {
    const qty  = watch(`lineItems.${index}.qty`)      || 0;
    const rate = watch(`lineItems.${index}.rate`)     || 0;
    const disc = watch(`lineItems.${index}.discount`) || 0;
    const base = qty * rate;
    setValue(`lineItems.${index}.amount`, parseFloat((base - (base * disc) / 100).toFixed(2)));
  }

  const cell = cn(
    "w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-white text-foreground outline-none",
    "focus:border-violet-300 focus:ring-1 focus:ring-violet-700/10 transition-all"
  );

  return (
    <div>
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
        Products
      </h3>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              {["Product", "Item Code", "HSN Code", "Qty", "Unit", "Rate (₹)", "Discount (%)", "Amount (₹)", ""].map((h) => (
                <th key={h} className="px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b border-border last:border-0 hover:bg-violet-50/20 transition-colors">

                {/* Product */}
                <td className="px-3 py-2 min-w-[160px]">
                  <select className={cell} onChange={(e) => handleProductSelect(index, e.target.value)} defaultValue="">
                    <option value="" disabled>Select product</option>
                    {MOCK_PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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

                {/* Discount */}
                <td className="px-3 py-2 min-w-[80px]">
                  <input type="number" step="0.01" min="0" max="100"
                    {...register(`lineItems.${index}.discount`)}
                    onChange={(e) => { register(`lineItems.${index}.discount`).onChange(e); setTimeout(() => recalc(index), 0); }}
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
        className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-colors">
        <Plus size={13} /> Add Product
      </button>

      {errors.lineItems?.root && (
        <p className="text-xs text-destructive mt-2">{errors.lineItems.root.message}</p>
      )}
    </div>
  );
}
