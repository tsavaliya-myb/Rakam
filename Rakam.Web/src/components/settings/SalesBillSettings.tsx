"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import {
  salesBillSettingsSchema,
  type SalesBillSettingsValues,
} from "@/lib/schemas/settings.schema";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export function SalesBillSettings() {
  const { register, control, handleSubmit, formState: { isSubmitting } } =
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

  function onSubmit(data: SalesBillSettingsValues) {
    toast.success("Sales bill settings saved");
  }

  const toggleFields: { name: keyof SalesBillSettingsValues; label: string; desc?: string }[] = [
    { name: "displayDueDetails",          label: "Display Due Details in Invoice",         desc: "Shows Due Days & Date on PDF" },
    { name: "displayGstInJobChallan",     label: "Display GST No. in Job Challan",          desc: "Shows GST number on Job Challan PDF" },
    { name: "displayChallanOption",       label: "Display Challan Option in Sales Bill",    desc: "Shows challan section in bill form" },
    { name: "displayAddLossProduct",      label: "Display Add Loss Product Option",         desc: "Shows loss product option in bill" },
    { name: "displayDeliveryToSalesBill", label: "Import Delivery Challan to Sales Bill",   desc: "Allows creating bill from Delivery Challan" },
    { name: "displayWithHoldingTax",      label: "Display With Holding Tax Option",         desc: "Shows TDS/TCS option in Sales Bill" },
    { name: "enableDirectPayment",        label: "Enable Direct Payment",                   desc: "Direct payment entry from Sales Bill" },
  ];

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

      <button type="submit" disabled={isSubmitting}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors disabled:opacity-60">
        <Save size={14} />
        {isSubmitting ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
