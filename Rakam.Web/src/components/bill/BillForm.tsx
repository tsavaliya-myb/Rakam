"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  ChevronDown, Calendar, StickyNote, X, Plus, ChevronRight, Loader2,
} from "lucide-react";
import { billFormSchema, type BillFormValues } from "@/lib/schemas/bill.schema";
import { useNextBillNo, useCreateSalesBill } from "@/hooks/api/use-sales-bills";
import { usePartiesDropdown } from "@/hooks/api/use-parties";
import { LineItemsTable } from "./LineItemsTable";
import { BillTotals } from "./BillTotals";
import { ChallanSection } from "./ChallanSection";
import { cn } from "@/lib/utils";

const GST_RATES = [0, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];

const inputCls = cn(
  "w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none",
  "focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-900/10 transition-all placeholder:text-muted-foreground/60"
);

const labelCls = "block text-xs font-semibold text-foreground mb-1.5";

export function BillForm() {
  const router = useRouter();
  const [showRemark, setShowRemark] = useState(false);
  const [selectedGst, setSelectedGst] = useState(18);

  const { data: partiesDropdown = [], isLoading: partiesLoading } = usePartiesDropdown();
  const { data: nextBillNoData } = useNextBillNo();
  const createBill = useCreateSalesBill();

  const today = new Date().toISOString().split("T")[0];

  const methods = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      partyId: "",
      applyGst: false,
      billNo: "",
      billDate: today,
      dueDays: 15,
      dueDate: "",
      challans: [],
      lineItems: [
        {
          id: crypto.randomUUID(),
          productName: "",
          itemCode: "",
          hsnCode: "",
          qty: 1,
          unit: "Pcs",
          rate: 0,
          discount: 0,
          amount: 0,
        },
      ],
      discountPercent: 0,
      remark: "",
    },
  });

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  // Populate bill number from API when loaded
  useEffect(() => {
    if (nextBillNoData?.billNo) {
      setValue("billNo", nextBillNoData.billNo);
    }
  }, [nextBillNoData, setValue]);

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

  function handlePartySelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const partyId = e.target.value;
    const party = partiesDropdown.find((p) => p.id === partyId);
    setValue("partyId", partyId);
    if (party) {
      if (party.balance !== undefined) {
        // balance info available
      }
    }
  }

  async function onSubmit(data: BillFormValues) {
    await createBill.mutateAsync({
      billDate: data.billDate,
      billType: "TAX_INVOICE",
      dueDate: data.dueDate || undefined,
      dueDays: data.dueDays,
      partyId: data.partyId,
      applyGst,
      lineItems: data.lineItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        itemCode: item.itemCode,
        hsnCode: item.hsnCode,
        qty: item.qty,
        unit: item.unit,
        rate: item.rate,
        discount: item.discount,
        gst: applyGst ? selectedGst : undefined,
      })),
      discountPercent: data.discountPercent,
      remark: data.remark,
    });
    router.push("/bill");
  }

  async function onSaveAndNew(data: BillFormValues) {
    await createBill.mutateAsync({
      billDate: data.billDate,
      billType: "TAX_INVOICE",
      dueDate: data.dueDate || undefined,
      dueDays: data.dueDays,
      partyId: data.partyId,
      applyGst,
      lineItems: data.lineItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        itemCode: item.itemCode,
        hsnCode: item.hsnCode,
        qty: item.qty,
        unit: item.unit,
        rate: item.rate,
        discount: item.discount,
        gst: applyGst ? selectedGst : undefined,
      })),
      discountPercent: data.discountPercent,
      remark: data.remark,
    });
    reset({
      partyId: "",
      applyGst: false,
      billNo: nextBillNoData?.billNo ?? "",
      billDate: today,
      dueDays: 15,
      dueDate: "",
      challans: [],
      lineItems: [{ id: crypto.randomUUID(), productName: "", itemCode: "", hsnCode: "", qty: 1, unit: "Pcs", rate: 0, discount: 0, amount: 0 }],
      discountPercent: 0,
      remark: "",
    });
  }

  const busy = isSubmitting || createBill.isPending;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Section 1: Header ── */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center">1</span>
            Bill Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Party */}
            <div className="lg:col-span-2">
              <label className={labelCls}>
                Party <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <select
                  onChange={handlePartySelect}
                  disabled={partiesLoading}
                  className={cn(inputCls, "appearance-none pr-8", errors.partyId && "border-destructive")}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {partiesLoading ? "Loading parties…" : "Select party"}
                  </option>
                  {partiesDropdown.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {partiesLoading ? (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin pointer-events-none" />
                ) : (
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                )}
              </div>
              <button type="button" className="text-[11px] text-brand-700 hover:underline mt-1 font-medium">
                + Add Party
              </button>
              {errors.partyId && (
                <p className="text-[11px] text-destructive mt-1">{errors.partyId.message}</p>
              )}
            </div>

            {/* Apply GST */}
            <div className="flex flex-col justify-center">
              <label className={labelCls}>GST</label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("applyGst")}
                  className="w-4 h-4 rounded accent-brand-700"
                />
                <span className="text-sm font-medium text-foreground">Apply GST</span>
              </label>
              {applyGst && (
                <div className="mt-2">
                  <select
                    value={selectedGst}
                    onChange={(e) => setSelectedGst(Number(e.target.value))}
                    className={cn(inputCls, "text-xs")}
                  >
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>GST {r}%</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Bill No */}
            <div>
              <label className={labelCls}>Bill No.</label>
              <input
                {...register("billNo")}
                placeholder="Auto"
                className={inputCls}
              />
            </div>

            {/* Bill Date */}
            <div>
              <label className={labelCls}>
                Bill Date <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  {...register("billDate")}
                  className={cn(inputCls, "pl-8")}
                />
              </div>
            </div>

            {/* Due Days */}
            <div>
              <label className={labelCls}>Due Days</label>
              <input
                type="number"
                min="0"
                {...register("dueDays")}
                onChange={handleDueDaysChange}
                className={cn(inputCls, "tabular-nums")}
              />
            </div>

            {/* Due Date */}
            <div>
              <label className={labelCls}>Due Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  {...register("dueDate")}
                  className={cn(inputCls, "pl-8")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Challans ── */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <ChallanSection />
        </div>

        {/* ── Section 3: Products ── */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <LineItemsTable applyGst={applyGst} />
        </div>

        {/* ── Section 4: Remarks + Totals ── */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">

          <div className="flex-1 bg-white rounded-2xl border border-border p-5">
            {!showRemark ? (
              <button
                type="button"
                onClick={() => setShowRemark(true)}
                className="flex items-center gap-2 text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
              >
                <Plus size={14} />
                <StickyNote size={13} />
                Add Remarks
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls}>Remark</label>
                  <button
                    type="button"
                    onClick={() => { setShowRemark(false); setValue("remark", ""); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Add a note to this bill..."
                  {...register("remark")}
                  className={cn(inputCls, "resize-none")}
                />
              </div>
            )}
          </div>

          <div className="w-full lg:w-auto">
            <BillTotals applyGst={applyGst} gstPercent={selectedGst} />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center gap-3 pb-6">
          <button
            type="button"
            onClick={handleSubmit(onSaveAndNew)}
            disabled={busy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Save & Create New Bill
          </button>

          <button
            type="button"
            onClick={() => router.push("/bill")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-400 hover:bg-red-500 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors disabled:opacity-60 ml-auto"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : null}
            Submit
            {!busy && <ChevronRight size={15} />}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
