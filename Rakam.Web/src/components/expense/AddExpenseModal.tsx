"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Receipt, Upload, Plus } from "lucide-react";
import { addExpenseSchema, type AddExpenseFormValues } from "@/lib/schemas/expense.schema";
import { MOCK_EXPENSE_CATEGORIES, MOCK_EXPENSE_SUPPLIERS, MOCK_EXPENSE_ITEMS } from "@/lib/mock/expenses";
import { cn } from "@/lib/utils";
import type { Expense } from "@/types";

interface Props {
  expense?: Expense | null;
  onClose: () => void;
  onSubmit: (data: AddExpenseFormValues) => void;
}

const today = new Date().toISOString().split("T")[0];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-500 mt-0.5">{message}</p>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-foreground block mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const inputCls = cn(
  "w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground",
  "outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-900/10 transition-all",
  "placeholder:text-muted-foreground/60"
);

export function AddExpenseModal({ expense, onClose, onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddExpenseFormValues>({
    resolver: zodResolver(addExpenseSchema),
    defaultValues: {
      mode: "AMOUNT",
      date: today,
      category: "",
      supplierName: "",
      amount: 0,
      note: "",
      expenseItem: "",
      qty: undefined,
      rate: undefined,
    },
  });

  const mode = watch("mode");
  const qty = watch("qty");
  const rate = watch("rate");

  // Auto-calculate amount in Item mode
  useEffect(() => {
    if (mode === "ITEM" && qty && rate) {
      setValue("amount", qty * rate);
    }
  }, [mode, qty, rate, setValue]);

  // Populate for edit
  useEffect(() => {
    if (expense) {
      setValue("mode", expense.mode);
      setValue("date", expense.date);
      setValue("category", expense.category);
      setValue("supplierName", expense.supplierName ?? "");
      setValue("amount", expense.amount);
      setValue("note", expense.note ?? "");
      setValue("expenseItem", expense.expenseItem ?? "");
      setValue("qty", expense.qty);
      setValue("rate", expense.rate);
    }
  }, [expense, setValue]);

  const noteVal = watch("note") ?? "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
              <Receipt size={16} strokeWidth={1.8} className="text-brand-700" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">
                {expense ? "Edit Expense" : "Add Expense"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Record a business expense
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-4 flex-shrink-0">
          <Controller
            control={control}
            name="mode"
            render={({ field }) => (
              <div className="flex items-center bg-secondary rounded-xl p-1 gap-1 w-fit">
                {(["AMOUNT", "ITEM"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => field.onChange(m)}
                    className={cn(
                      "px-5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      field.value === m
                        ? "bg-white text-brand-900 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m === "AMOUNT" ? "Amount" : "Item"}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        {/* Form body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {/* Row: Date + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Expense Date</Label>
              <input type="date" {...register("date")} className={inputCls} />
              <FieldError message={errors.date?.message} />
            </div>
            <div>
              <Label required>Expense Category</Label>
              <select {...register("category")} className={inputCls}>
                <option value="">Select category</option>
                {MOCK_EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <FieldError message={errors.category?.message} />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <Label>Supplier Name</Label>
            <select {...register("supplierName")} className={inputCls}>
              <option value="">Select supplier</option>
              {MOCK_EXPENSE_SUPPLIERS.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Item mode extras */}
          {mode === "ITEM" && (
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-4">
              <div>
                <Label required>Expense Item</Label>
                <select {...register("expenseItem")} className={inputCls}>
                  <option value="">Select item</option>
                  {MOCK_EXPENSE_ITEMS.map((i) => (
                    <option key={i.id} value={i.name}>{i.name}</option>
                  ))}
                </select>
                <FieldError message={errors.expenseItem?.message} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Qty</Label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    {...register("qty")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label required>Rate (₹)</Label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("rate")}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <Label required>Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("amount")}
                readOnly={mode === "ITEM"}
                className={cn(inputCls, "pl-7", mode === "ITEM" && "bg-secondary text-muted-foreground cursor-not-allowed")}
              />
            </div>
            <FieldError message={errors.amount?.message} />
          </div>

          {/* Attachment */}
          <div>
            <Label>Upload Attachment</Label>
            <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/60 transition-colors text-xs text-muted-foreground">
              <Upload size={14} />
              Click to upload (JPEG, PNG)
              <input type="file" accept="image/jpeg,image/png" className="sr-only" />
            </label>
          </div>

          {/* Note */}
          <div>
            <Label>Add Note</Label>
            <textarea
              {...register("note")}
              placeholder="Optional note..."
              rows={3}
              maxLength={200}
              className={cn(inputCls, "resize-none")}
            />
            <p className="text-[11px] text-muted-foreground text-right mt-0.5">
              {noteVal.length}/200
            </p>
          </div>

          {/* Add Payment placeholder */}
          <button
            type="button"
            className="flex items-center gap-2 text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
          >
            <Plus size={14} /> Add Payment
          </button>
        </form>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="expense-form"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-brand-900 text-white hover:bg-brand-800 disabled:opacity-60 transition-colors"
          >
            {expense ? "Update Expense" : "Save Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}
