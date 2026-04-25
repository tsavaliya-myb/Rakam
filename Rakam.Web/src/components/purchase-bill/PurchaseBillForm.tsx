"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ChevronDown, Calendar, Paperclip, X, Plus, ChevronRight, StickyNote } from "lucide-react";
import {
  purchaseBillFormSchema,
  type PurchaseBillFormValues,
} from "@/lib/schemas/purchase-bill.schema";
import { PurchaseLineItemsTable } from "./PurchaseLineItemsTable";
import { PurchaseBillTotals } from "./PurchaseBillTotals";
import { cn } from "@/lib/utils";

const MOCK_SUPPLIERS = [
  { id: "s1", name: "RK Mills",          dueDays: 30 },
  { id: "s2", name: "Agarwal Suppliers", dueDays: 30 },
  { id: "s3", name: "VK Traders",        dueDays: 15 },
  { id: "s4", name: "Suresh Textiles",   dueDays: 30 },
  { id: "s5", name: "Modi Corporation",  dueDays: 15 },
  { id: "s6", name: "Deepak Polymers",   dueDays: 30 },
  { id: "s7", name: "National Stores",   dueDays: 30 },
];

const GST_RATES = [0, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];

const inp = cn(
  "w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none",
  "focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-700/10 transition-all placeholder:text-muted-foreground/60"
);
const lbl = "block text-xs font-semibold text-foreground mb-1.5";

export function PurchaseBillForm() {
  const router = useRouter();
  const [selectedGst, setSelectedGst] = useState(18);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const methods = useForm<PurchaseBillFormValues>({
    resolver: zodResolver(purchaseBillFormSchema),
    defaultValues: {
      partyId: "",
      applyGst: false,
      billNo: "",
      billDate: today,
      dueDays: 30,
      dueDate: "",
      lineItems: [{
        id: crypto.randomUUID(),
        productName: "",
        itemCode: "",
        hsnCode: "",
        qty: 1,
        unit: "Pcs",
        rate: 0,
        discount: 0,
        amount: 0,
      }],
      remark: "",
    },
  });

  const {
    register, watch, setValue, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = methods;

  const applyGst = watch("applyGst");

  function handleDueDaysChange(e: React.ChangeEvent<HTMLInputElement>) {
    const days = Number(e.target.value);
    setValue("dueDays", days);
    if (days > 0) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      setValue("dueDate", d.toISOString().split("T")[0]);
    }
  }

  function handleSupplierSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const supplier = MOCK_SUPPLIERS.find((s) => s.id === e.target.value);
    setValue("partyId", e.target.value);
    if (supplier) {
      setValue("dueDays", supplier.dueDays);
      if (supplier.dueDays > 0) {
        const d = new Date();
        d.setDate(d.getDate() + supplier.dueDays);
        setValue("dueDate", d.toISOString().split("T")[0]);
      }
    }
  }

  function handleAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setAttachmentName(file.name);
  }

  function onSubmit(data: PurchaseBillFormValues) {
    console.log("PURCHASE BILL SUBMIT:", data);
    // TODO: API call via TanStack Query mutation
  }

  function onSaveAndNew(data: PurchaseBillFormValues) {
    console.log("SAVE & NEW:", data);
    reset();
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Section 1: Bill Header ── */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center">1</span>
            Bill Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Supplier / Party */}
            <div className="lg:col-span-2">
              <label className={lbl}>
                Party / Supplier <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <select onChange={handleSupplierSelect} className={cn(inp, "appearance-none pr-8")} defaultValue="">
                  <option value="" disabled>Select supplier</option>
                  {MOCK_SUPPLIERS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <button type="button" className="text-[11px] text-violet-700 hover:underline mt-1 font-medium">
                + Add Party
              </button>
              {errors.partyId && (
                <p className="text-[11px] text-destructive mt-1">{errors.partyId.message}</p>
              )}
            </div>

            {/* Apply GST */}
            <div className="flex flex-col justify-center">
              <label className={lbl}>GST</label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" {...register("applyGst")} className="w-4 h-4 rounded accent-violet-700" />
                <span className="text-sm font-medium text-foreground">Apply GST</span>
              </label>
              {applyGst && (
                <div className="mt-2">
                  <select
                    value={selectedGst}
                    onChange={(e) => setSelectedGst(Number(e.target.value))}
                    className={cn(inp, "text-xs")}
                  >
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>GST {r}%</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Bill No — manual required */}
            <div>
              <label className={lbl}>
                Bill No. <span className="text-destructive">*</span>
              </label>
              <input
                {...register("billNo")}
                placeholder="Enter supplier's bill number"
                className={cn(inp, errors.billNo && "border-destructive")}
              />
              {errors.billNo && (
                <p className="text-[11px] text-destructive mt-1">{errors.billNo.message}</p>
              )}
            </div>

            {/* Bill Date */}
            <div>
              <label className={lbl}>
                Bill Date <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input type="date" {...register("billDate")} className={cn(inp, "pl-8")} />
              </div>
            </div>

            {/* Due Days */}
            <div>
              <label className={lbl}>Due Days</label>
              <input type="number" min="0"
                {...register("dueDays")}
                onChange={handleDueDaysChange}
                className={cn(inp, "tabular-nums")} />
            </div>

            {/* Due Date */}
            <div>
              <label className={lbl}>Due Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input type="date" {...register("dueDate")} className={cn(inp, "pl-8")} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Line Items ── */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <PurchaseLineItemsTable applyGst={applyGst} />
        </div>

        {/* ── Section 3: Attachment + Remark + Totals ── */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* Left — Attachment + Remark */}
          <div className="flex-1 space-y-4">

            {/* Attachment */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <label className={lbl}>
                <span className="flex items-center gap-1.5">
                  <Paperclip size={13} /> Add Attachment
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </span>
              </label>
              {attachmentName ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-100">
                  <Paperclip size={13} className="text-violet-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-violet-700 flex-1 truncate">{attachmentName}</span>
                  <button type="button" onClick={() => setAttachmentName(null)}
                    className="text-violet-400 hover:text-violet-600 transition-colors flex-shrink-0">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed border-border bg-secondary cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-all group">
                  <Paperclip size={18} className="text-muted-foreground group-hover:text-violet-500 mb-1 transition-colors" />
                  <p className="text-xs text-muted-foreground group-hover:text-violet-600 transition-colors">
                    Click to upload <span className="font-medium">Image or PDF</span>
                  </p>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleAttachment} />
                </label>
              )}
            </div>

            {/* Remark */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <label className={lbl}>
                <span className="flex items-center gap-1.5">
                  <StickyNote size={13} /> Remark
                  <span className="text-muted-foreground font-normal">(0/200)</span>
                </span>
              </label>
              <textarea
                rows={3}
                maxLength={200}
                placeholder="Add a note to this purchase bill..."
                {...register("remark")}
                className={cn(inp, "resize-none")}
              />
            </div>
          </div>

          {/* Right — Totals */}
          <div className="w-full lg:w-auto">
            <PurchaseBillTotals applyGst={applyGst} gstPercent={selectedGst} />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center gap-3 pb-6">
          <button
            type="button"
            onClick={handleSubmit(onSaveAndNew)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            <Plus size={15} />
            Save & Create New
          </button>

          <button
            type="button"
            onClick={() => router.push("/purchase-bill")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-400 hover:bg-red-500 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 transition-colors disabled:opacity-60 ml-auto"
          >
            Submit <ChevronRight size={15} />
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
