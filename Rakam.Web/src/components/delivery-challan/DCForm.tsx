"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ChevronDown, Calendar, StickyNote, Plus, ChevronRight, Loader2 } from "lucide-react";
import { dcFormSchema, type DCFormValues } from "@/lib/schemas/delivery-challan.schema";
import { PartyChallanSection } from "./PartyChallanSection";
import { DCLineItemsTable } from "./DCLineItemsTable";
import { DCTotals } from "./DCTotals";
import { cn } from "@/lib/utils";
import { usePartiesDropdown } from "@/hooks/api/use-parties";
import { useCreateDC, useUpdateDC } from "@/hooks/api/use-delivery-challans";
import type { DeliveryChallan } from "@/types";

const inp = cn(
  "w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none",
  "focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-700/10 transition-all placeholder:text-muted-foreground/60"
);
const lbl = "block text-xs font-semibold text-foreground mb-1.5";

interface DCFormProps {
  dc?: DeliveryChallan;
}

export function DCForm({ dc }: DCFormProps) {
  const router = useRouter();
  const isEdit = !!dc;
  const today = new Date().toISOString().split("T")[0];

  const { data: parties = [], isLoading: partiesLoading } = usePartiesDropdown();
  const createDC = useCreateDC();
  const updateDC = useUpdateDC();

  const methods = useForm<DCFormValues>({
    resolver: zodResolver(dcFormSchema),
    defaultValues: dc
      ? {
          partyId: dc.partyId,
          dcNo: dc.dcNo,
          dcDate: dc.dcDate,
          challans: dc.partyChallanNo
            ? [{ id: crypto.randomUUID(), noChallan: false, partyChallanNo: dc.partyChallanNo, partyChallanDate: dc.partyChallanDate }]
            : [],
          lineItems: dc.lineItems.map((li) => ({
            id: crypto.randomUUID(),
            productId: li.productId,
            productName: li.productName,
            itemCode: li.itemCode ?? "",
            hsnCode: li.hsnCode ?? "",
            qty: li.qty,
            unit: li.unit,
            rate: li.rate,
            amount: li.amount,
          })),
          remark: dc.remark ?? "",
        }
      : {
          partyId: "",
          dcNo: "",
          dcDate: today,
          challans: [],
          lineItems: [{
            id: crypto.randomUUID(),
            productName: "",
            itemCode: "",
            hsnCode: "",
            qty: 1,
            unit: "Pcs",
            rate: 0,
            amount: 0,
          }],
          remark: "",
        },
  });

  const {
    register, watch, setValue, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = methods;

  function buildDto(data: DCFormValues) {
    const firstChallan = data.challans?.find((c) => !c.noChallan && c.partyChallanNo);
    return {
      dcDate: data.dcDate,
      partyId: data.partyId,
      partyChallanNo: firstChallan?.partyChallanNo || undefined,
      partyChallanDate: firstChallan?.partyChallanDate || undefined,
      lineItems: data.lineItems.map((li) => ({
        productId: li.productId || undefined,
        productName: li.productName,
        qty: li.qty,
        unit: li.unit,
        rate: li.rate,
        discount: undefined,
      })),
      remark: data.remark || undefined,
    };
  }

  async function onSubmit(data: DCFormValues) {
    const dto = buildDto(data);
    if (isEdit) {
      await updateDC.mutateAsync({ id: dc.id, dto });
    } else {
      await createDC.mutateAsync(dto);
    }
    router.push("/delivery-challan");
  }

  async function onSaveAndNew(data: DCFormValues) {
    await createDC.mutateAsync(buildDto(data));
    reset({
      partyId: "",
      dcNo: "",
      dcDate: today,
      challans: [],
      lineItems: [{
        id: crypto.randomUUID(),
        productName: "",
        itemCode: "",
        hsnCode: "",
        qty: 1,
        unit: "Pcs",
        rate: 0,
        amount: 0,
      }],
      remark: "",
    });
  }

  const isPending = createDC.isPending || updateDC.isPending;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Section 1: Header ── */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold flex items-center justify-center">1</span>
            Challan Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Party */}
            <div className="lg:col-span-2">
              <label className={lbl}>
                Party <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                {partiesLoading ? (
                  <div className={cn(inp, "flex items-center gap-2 text-muted-foreground")}>
                    <Loader2 size={13} className="animate-spin" />
                    <span className="text-xs">Loading parties…</span>
                  </div>
                ) : (
                  <>
                    <select
                      {...register("partyId")}
                      className={cn(inp, "appearance-none pr-8", errors.partyId && "border-destructive")}
                    >
                      <option value="" disabled>Select party</option>
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </>
                )}
              </div>
              {errors.partyId && (
                <p className="text-[11px] text-destructive mt-1">{errors.partyId.message}</p>
              )}
            </div>

            {/* D.Ch. No */}
            <div>
              <label className={lbl}>D.Ch. No.</label>
              <input
                {...register("dcNo")}
                placeholder="Auto"
                className={inp}
              />
            </div>

            {/* D.Ch. Date */}
            <div>
              <label className={lbl}>
                D.Ch. Date <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input type="date" {...register("dcDate")} className={cn(inp, "pl-8")} />
              </div>
              {errors.dcDate && (
                <p className="text-[11px] text-destructive mt-1">{errors.dcDate.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 2: Party Challans ── */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <PartyChallanSection />
        </div>

        {/* ── Section 3: Products ── */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <DCLineItemsTable />
        </div>

        {/* ── Section 4: Remark + Totals ── */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* Remark */}
          <div className="flex-1 bg-white rounded-2xl border border-border p-5">
            <label className={lbl}>
              <span className="flex items-center gap-1.5">
                <StickyNote size={13} />
                Remark
                <span className="text-muted-foreground font-normal">(0/200)</span>
              </span>
            </label>
            <textarea
              rows={3}
              maxLength={200}
              placeholder="Add a note to this delivery challan..."
              {...register("remark")}
              className={cn(inp, "resize-none")}
            />
          </div>

          {/* Totals */}
          <div className="w-full lg:w-auto">
            <DCTotals />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-wrap items-center gap-3 pb-6">
          {!isEdit && (
            <button
              type="button"
              onClick={handleSubmit(onSaveAndNew)}
              disabled={isSubmitting || isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              <Plus size={15} />
              Save & Create New D.Ch.
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push("/delivery-challan")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-400 hover:bg-red-500 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 transition-colors disabled:opacity-60 ml-auto"
          >
            {(isSubmitting || isPending) && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Update Challan" : "Submit"}
            {!isEdit && <ChevronRight size={15} />}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
