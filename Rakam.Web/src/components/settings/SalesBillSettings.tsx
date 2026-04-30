"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Loader2 } from "lucide-react";
import {
  salesBillSettingsSchema,
  type SalesBillSettingsValues,
} from "@/lib/schemas/settings.schema";
import { cn } from "@/lib/utils";
import { useSalesBillSettings, useSaveSalesBillSettings } from "@/hooks/api/use-settings";

const inp = cn(
  "w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none",
  "focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-900/10 transition-all"
);
const lbl = "text-xs font-semibold text-foreground";
const desc = "text-[11px] text-muted-foreground mt-0.5";

function ToggleRow({
  label, description, checked, onChange,
}: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between py-3.5 border-b border-border last:border-0 gap-4">
      <div className="flex-1">
        <p className={lbl}>{label}</p>
        {description && <p className={desc}>{description}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className="relative rounded-full transition-colors duration-200 flex-shrink-0 mt-0.5 focus:outline-none"
        style={{ width: 40, height: 22, background: checked ? "#16532d" : "#d1d5db" }}>
        <span className="absolute top-1 rounded-full bg-white shadow transition-transform duration-200"
          style={{ width: 14, height: 14, left: 4, transform: checked ? "translateX(18px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}

const PRINT_TYPE_TO_API: Record<string, string> = {
  Original: "ORIGINAL", Duplicate: "DUPLICATE", Triplicate: "TRIPLICATE",
};
const API_TO_PRINT_TYPE: Record<string, string> = {
  ORIGINAL: "Original", DUPLICATE: "Duplicate", TRIPLICATE: "Triplicate",
};

export function SalesBillSettings() {
  const { data: settings, isLoading } = useSalesBillSettings();
  const saveSettings = useSaveSalesBillSettings();

  const { register, control, handleSubmit, reset, formState: { isSubmitting } } =
    useForm<SalesBillSettingsValues>({
      resolver: zodResolver(salesBillSettingsSchema),
      defaultValues: {
        displayDueDetails: false,
        displayGstInJobChallan: true,
        defaultPrintType: "Original",
        displayChallanOption: true,
        billNoLabel: "Bill No.",
        displayAddLossProduct: false,
        displayDeliveryToSalesBill: false,
        displayWithHoldingTax: false,
        enableDirectPayment: false,
        discountScope: "bill_bill",
        billPrefix: "",
        termsAndConditions: "",
        titleJobChallan: "",
        titleTaxInvoice: "",
        customHeading: "",
      },
    });

  useEffect(() => {
    if (!settings) return;
    const discountScope =
      settings.discountScope === "ITEM" && settings.gstScope === "ITEM" ? "item_item" :
      settings.discountScope === "ITEM" ? "item_bill" : "bill_bill";

    reset({
      displayDueDetails: settings.showDueDetailsInInvoice,
      displayGstInJobChallan: settings.showGstInJobChallan,
      defaultPrintType: (API_TO_PRINT_TYPE[settings.defaultPrintType] ?? "Original") as "Original" | "Duplicate" | "Triplicate",
      displayChallanOption: settings.showChallanSection,
      billNoLabel: (settings.billNoLabel ?? "Bill No.") as "Bill No." | "Invoice No." | "Job Ch No.",
      displayAddLossProduct: settings.showLossProductOption,
      displayDeliveryToSalesBill: settings.showDeliveryToSalesOption,
      displayWithHoldingTax: settings.showWithholdingTax,
      enableDirectPayment: settings.enableDirectPayment,
      discountScope,
      billPrefix: settings.billPrefix ?? "",
      termsAndConditions: settings.termsAndConditions ?? "",
      titleJobChallan: settings.jobChallanTitle ?? "",
      titleTaxInvoice: settings.taxInvoiceTitle ?? "",
      customHeading: settings.pdfCustomHeading ?? "",
    });
  }, [settings, reset]);

  function onSubmit(data: SalesBillSettingsValues) {
    const scopeMap = {
      bill_bill: { discountScope: "BILL", gstScope: "BILL" },
      item_bill: { discountScope: "ITEM", gstScope: "BILL" },
      item_item: { discountScope: "ITEM", gstScope: "ITEM" },
    };
    const scopes = scopeMap[data.discountScope];

    saveSettings.mutate({
      showDueDetailsInInvoice: data.displayDueDetails,
      showGstInJobChallan: data.displayGstInJobChallan,
      defaultPrintType: PRINT_TYPE_TO_API[data.defaultPrintType],
      showChallanSection: data.displayChallanOption,
      billNoLabel: data.billNoLabel,
      showLossProductOption: data.displayAddLossProduct,
      showDeliveryToSalesOption: data.displayDeliveryToSalesBill,
      showWithholdingTax: data.displayWithHoldingTax,
      enableDirectPayment: data.enableDirectPayment,
      discountScope: scopes.discountScope,
      gstScope: scopes.gstScope,
      billPrefix: data.billPrefix ?? null,
      termsAndConditions: data.termsAndConditions ?? null,
      jobChallanTitle: data.titleJobChallan ?? null,
      taxInvoiceTitle: data.titleTaxInvoice ?? null,
      pdfCustomHeading: data.customHeading ?? null,
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Toggles */}
      <div className="bg-white rounded-2xl border border-border px-5">
        <Controller control={control} name="displayDueDetails" render={({ field }) => (
          <ToggleRow label="Display Due Details in Invoice" description="Shows Due Days & Date on PDF" checked={field.value} onChange={field.onChange} />
        )} />
        <Controller control={control} name="displayGstInJobChallan" render={({ field }) => (
          <ToggleRow label="Display GST No. in Job Challan" description="Shows GST number on Job Challan PDF" checked={field.value} onChange={field.onChange} />
        )} />
        <Controller control={control} name="displayChallanOption" render={({ field }) => (
          <ToggleRow label="Display Challan Option in Sales Bill" description="Shows challan section in bill form" checked={field.value} onChange={field.onChange} />
        )} />
        <Controller control={control} name="displayAddLossProduct" render={({ field }) => (
          <ToggleRow label="Display Add Loss Product Option" description="Shows loss/adjustment row in bill" checked={field.value} onChange={field.onChange} />
        )} />
        <Controller control={control} name="displayDeliveryToSalesBill" render={({ field }) => (
          <ToggleRow label="Import Delivery Challan to Sales Bill" description="Allows creating bill from a Delivery Challan" checked={field.value} onChange={field.onChange} />
        )} />
        <Controller control={control} name="displayWithHoldingTax" render={({ field }) => (
          <ToggleRow label="Display With Holding Tax Option" description="Shows TDS/TCS option in Sales Bill" checked={field.value} onChange={field.onChange} />
        )} />
        <Controller control={control} name="enableDirectPayment" render={({ field }) => (
          <ToggleRow label="Enable Direct Payment" description="Direct payment entry from Sales Bill" checked={field.value} onChange={field.onChange} />
        )} />
      </div>

      {/* Select fields */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Default Print Type</label>
            <select {...register("defaultPrintType")} className={inp}>
              {["Original", "Duplicate", "Triplicate"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Bill No. Label</label>
            <select {...register("billNoLabel")} className={inp}>
              {["Bill No.", "Invoice No.", "Job Ch No."].map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Bill Prefix</label>
            <input {...register("billPrefix")} placeholder="e.g. INV-" maxLength={10} className={inp} />
          </div>
        </div>

        {/* Discount Scope */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-2">
            Discount & GST Scope
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "bill_bill", label: "Discount Bill Wise / GST Bill Wise" },
              { value: "item_bill", label: "Discount Item Wise / GST Bill Wise" },
              { value: "item_item", label: "Discount Item Wise / GST Item Wise" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={opt.value} {...register("discountScope")} className="w-4 h-4 accent-brand-700" />
                <span className="text-xs font-medium text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Text fields */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Title of Tax Invoice <span className="text-muted-foreground font-normal">(0/20)</span>
            </label>
            <input {...register("titleTaxInvoice")} maxLength={20} placeholder="Custom title..." className={inp} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Title of Job Challan <span className="text-muted-foreground font-normal">(0/20)</span>
            </label>
            <input {...register("titleJobChallan")} maxLength={20} placeholder="Custom title..." className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Custom Heading on PDF <span className="text-muted-foreground font-normal">(0/30)</span>
            </label>
            <input {...register("customHeading")} maxLength={30} placeholder="Appears at top of all Sales Bill PDFs..." className={inp} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-foreground mb-1.5">Terms and Conditions</label>
            <textarea rows={4} {...register("termsAndConditions")}
              placeholder="Enter terms and conditions shown on Sales Bill PDF..."
              className={cn(inp, "resize-none")} />
          </div>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting || saveSettings.isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors disabled:opacity-60">
        {saveSettings.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {saveSettings.isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
