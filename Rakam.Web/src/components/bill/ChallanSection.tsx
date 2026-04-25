"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BillFormValues } from "@/lib/schemas/bill.schema";

export function ChallanSection() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<BillFormValues>();

  const { fields, append, remove } = useFieldArray<BillFormValues>({
    name: "challans",
  });

  function addChallan() {
    append({
      id: crypto.randomUUID(),
      noChallan: false,
      challanNumber: "",
      challanDate: "",
    });
  }

  const inputCls = cn(
    "w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none",
    "focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-900/10 transition-all"
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Challans
        </h3>
        <button
          type="button"
          onClick={addChallan}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-colors"
        >
          <Plus size={12} />
          Add Challan
        </button>
      </div>

      {fields.length === 0 && (
        <div className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-xl">
          No challans added.{" "}
          <button type="button" onClick={addChallan} className="text-brand-700 font-semibold hover:underline">
            Add one
          </button>
        </div>
      )}

      {fields.map((field, index) => {
        const noChallan = watch(`challans.${index}.noChallan`);

        return (
          <div
            key={field.id}
            className="p-4 rounded-xl border border-border bg-secondary/40 space-y-3"
          >
            {/* No Challan toggle */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register(`challans.${index}.noChallan`)}
                  className="w-4 h-4 rounded accent-brand-700"
                />
                <span className="text-xs font-medium text-foreground">
                  Don't have challan?
                </span>
              </label>
              <button
                type="button"
                onClick={() => remove(index)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Challan fields */}
            {!noChallan && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Challan Number
                  </label>
                  <input
                    {...register(`challans.${index}.challanNumber`)}
                    placeholder="e.g. CH-2026-001"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Challan Date
                  </label>
                  <div className="relative">
                    <Calendar
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <input
                      type="date"
                      {...register(`challans.${index}.challanDate`)}
                      className={cn(inputCls, "pl-8")}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
