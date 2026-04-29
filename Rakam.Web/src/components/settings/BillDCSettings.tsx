"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Loader2 } from "lucide-react";
import {
  dcSettingsSchema,
  purchaseBillSettingsSchema,
  type DCSettingsValues,
  type PurchaseBillSettingsValues,
} from "@/lib/schemas/settings.schema";
import { cn } from "@/lib/utils";
import { useSettings, useUpdateSettings } from "@/hooks/api/use-settings";

const inp = cn(
  "w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none",
  "focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-900/10 transition-all"
);

function ToggleRow({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between py-3.5 border-b border-border last:border-0 gap-4">
      <div className="flex-1">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className="relative rounded-full transition-colors duration-200 flex-shrink-0 mt-0.5"
        style={{ width: 40, height: 22, background: checked ? "#16532d" : "#d1d5db" }}>
        <span className="absolute top-1 rounded-full bg-white shadow transition-transform duration-200"
          style={{ width: 14, height: 14, left: 4, transform: checked ? "translateX(18px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}

/* ── Purchase Bill Settings ── */
export function PurchaseBillSettings() {
  const updateSettings = useUpdateSettings();
  const { control, handleSubmit, formState: { isSubmitting } } =
    useForm<PurchaseBillSettingsValues>({
      resolver: zodResolver(purchaseBillSettingsSchema),
      defaultValues: { displayWithHoldingTax: false },
    });

  return (
    <form onSubmit={handleSubmit((data) => updateSettings.mutate({ section: "purchase-bill", dto: data }))} className="space-y-6">
      <div className="bg-white rounded-2xl border border-border px-5">
        <Controller control={control} name="displayWithHoldingTax" render={({ field }) => (
          <ToggleRow
            label="Display With Holding Tax Option in Purchase Bill"
            description="Shows TDS/TCS option in Purchase Bill form"
            checked={field.value} onChange={field.onChange}
          />
        )} />
      </div>
      <button type="submit" disabled={isSubmitting || updateSettings.isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors disabled:opacity-60">
        {updateSettings.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {updateSettings.isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

/* ── DC Settings ── */
export function DCSettings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const { register, control, handleSubmit, reset, formState: { isSubmitting } } =
    useForm<DCSettingsValues>({
      resolver: zodResolver(dcSettingsSchema),
      defaultValues: {
        displayRate: true,
        displayGstNo: true,
        defaultPrintType: "Duplicate",
        displayChallanOption: true,
        termsAndConditions: "",
        customHeading: "",
      },
    });

  useEffect(() => {
    if (settings) {
      reset((prev) => ({
        ...prev,
        termsAndConditions: settings.termsAndConditions ?? "",
      }));
    }
  }, [settings, reset]);

  function onSubmit(data: DCSettingsValues) {
    updateSettings.mutate({
      section: "dc",
      dto: {
        challanPrefix: data.customHeading,
        termsAndConditions: data.termsAndConditions,
        displayRate: data.displayRate,
        displayGstNo: data.displayGstNo,
        defaultPrintType: data.defaultPrintType,
        displayChallanOption: data.displayChallanOption,
        customHeading: data.customHeading,
      },
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
      <div className="bg-white rounded-2xl border border-border px-5">
        <Controller control={control} name="displayRate" render={({ field }) => (
          <ToggleRow label="Display Rate in Delivery Challan" description="Shows rate column on DC PDF" checked={field.value} onChange={field.onChange} />
        )} />
        <Controller control={control} name="displayGstNo" render={({ field }) => (
          <ToggleRow label="Display GST No. in Delivery Challan" description="Shows firm GST on DC PDF" checked={field.value} onChange={field.onChange} />
        )} />
        <Controller control={control} name="displayChallanOption" render={({ field }) => (
          <ToggleRow label="Display Challan Option in Delivery Challan" description="Shows party challan fields in form" checked={field.value} onChange={field.onChange} />
        )} />
      </div>

      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Default Print Type</label>
          <select {...register("defaultPrintType")} className={inp}>
            {["Original", "Duplicate", "Triplicate"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Custom Heading on PDF <span className="text-muted-foreground font-normal">(0/30)</span>
          </label>
          <input {...register("customHeading")} maxLength={30} placeholder="Top heading on DC PDFs..." className={inp} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Terms and Conditions</label>
          <textarea rows={3} {...register("termsAndConditions")}
            placeholder="Terms shown on Delivery Challan PDFs..."
            className={cn(inp, "resize-none")} />
        </div>
      </div>

      <button type="submit" disabled={isSubmitting || updateSettings.isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors disabled:opacity-60">
        {updateSettings.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {updateSettings.isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
