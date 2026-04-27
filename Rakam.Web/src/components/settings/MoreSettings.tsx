"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Rocket, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import type { PlanType } from "@/types";
import { otherSettingsSchema, type OtherSettingsValues } from "@/lib/schemas/settings.schema";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

/* ── PDF Template ── */
export function PDFTemplateSettings() {
  const [salesTemplate, setSalesTemplate]   = useState<"Standard" | "Modern">("Standard");
  const [dcTemplate, setDcTemplate]         = useState<"Standard" | "Modern">("Standard");

  return (
    <div className="space-y-5">
      {[
        { label: "Sales Bill PDF Template",         value: salesTemplate, onChange: setSalesTemplate },
        { label: "Delivery Challan PDF Template",   value: dcTemplate,   onChange: setDcTemplate },
      ].map((item) => (
        <div key={item.label} className="bg-white rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-foreground mb-3">{item.label}</p>
          <div className="flex gap-3">
            {(["Standard", "Modern"] as const).map((t) => (
              <button key={t} type="button"
                onClick={() => item.onChange(t)}
                className={cn(
                  "flex-1 py-10 rounded-2xl text-sm font-semibold border-2 transition-all",
                  item.value === t
                    ? "border-brand-900 bg-brand-50 text-brand-900"
                    : "border-border bg-secondary text-muted-foreground hover:border-brand-300"
                )}>
                {t}
                {item.value === t && (
                  <div className="mt-2 flex justify-center">
                    <span className="w-2 h-2 rounded-full bg-brand-900" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Inventory Settings ── */
export function InventorySettings() {
  const [enabled, setEnabled]           = useState(false);
  const [allowNegative, setAllowNegative] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-border px-5">
      <ToggleRow
        label="Enable Inventory / Stock Management"
        description="Tracks stock per product; sales deduct inventory automatically"
        checked={enabled}
        onChange={(v) => { setEnabled(v); toast.success(v ? "Inventory enabled" : "Inventory disabled"); }}
      />
      {enabled && (
        <ToggleRow
          label="Allow Sales Without Stock"
          description="Allows creating bills even when stock is zero or negative"
          checked={allowNegative}
          onChange={setAllowNegative}
        />
      )}
    </div>
  );
}

/* ── Other Settings ── */
export function OtherSettings() {
  const { control, handleSubmit, formState: { isSubmitting } } =
    useForm<OtherSettingsValues>({
      resolver: zodResolver(otherSettingsSchema),
      defaultValues: {
        enableShortcuts: true,
        enableDecimal: true,
        enablePartyWiseRate: false,
        enableShipmentAddress: false,
      },
    });

  return (
    <form onSubmit={handleSubmit(() => toast.success("Other settings saved"))} className="space-y-6">
      <div className="bg-white rounded-2xl border border-border px-5">
        <Controller control={control} name="enableShortcuts" render={({ field }) => (
          <ToggleRow label="Enable / Disable Shortcuts" description="Keyboard shortcut support across the app" checked={field.value} onChange={field.onChange} />
        )} />
        <Controller control={control} name="enableDecimal" render={({ field }) => (
          <ToggleRow label="Enable / Disable Decimal Value" description="Allow decimals in quantity and rate fields" checked={field.value} onChange={field.onChange} />
        )} />
        <Controller control={control} name="enablePartyWiseRate" render={({ field }) => (
          <ToggleRow label="Enable Party Wise Product Rate" description="Set custom product prices per party" checked={field.value} onChange={field.onChange} />
        )} />
        <Controller control={control} name="enableShipmentAddress" render={({ field }) => (
          <ToggleRow label="Enable Shipment Address" description="Add shipment address per party on bills" checked={field.value} onChange={field.onChange} />
        )} />
      </div>
      <button type="submit" disabled={isSubmitting}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors disabled:opacity-60">
        <Save size={14} />{isSubmitting ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

const PLAN_BADGE: Record<PlanType, { label: string; cls: string }> = {
  trial:        { label: "TRIAL",      cls: "bg-amber-100 text-amber-700 border-amber-200" },
  starter:      { label: "STARTER",    cls: "bg-blue-100 text-blue-700 border-blue-200" },
  professional: { label: "PRO",        cls: "bg-purple-100 text-purple-700 border-purple-200" },
  enterprise:   { label: "ENTERPRISE", cls: "bg-green-100 text-green-700 border-green-200" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── My Subscriptions ── */
export function SubscriptionSettings() {
  const { subscription, isLoading, hasFetched, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    if (!hasFetched) fetchSubscription();
  }, [hasFetched, fetchSubscription]);

  if (isLoading || !hasFetched) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-2xl border border-border p-5">
        <p className="text-sm text-muted-foreground">Unable to load subscription details.</p>
      </div>
    );
  }

  const badge = PLAN_BADGE[subscription.planType] ?? PLAN_BADGE.trial;
  const isTrial = subscription.planType === "trial";
  const isUrgent = subscription.remainingDays <= 7;
  const isExpired = subscription.remainingDays === 0;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-semibold text-foreground">Current Plan</p>
            <p className="text-xs text-muted-foreground mt-0.5">Billing &amp; subscription info</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Plan Name",   value: subscription.planName },
            { label: "Plan Type",   value: subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1) },
            { label: "Firms Used",  value: `${subscription.firmsUsed} / ${subscription.firmLimit}` },
            { label: "Expires On",  value: formatDate(subscription.expiresOn) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-secondary rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold text-foreground mt-1">{value}</p>
            </div>
          ))}
        </div>

        {(isUrgent || isTrial) && (
          <div className={`mt-4 p-3 rounded-xl flex items-center gap-3 border ${isUrgent ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
            <AlertCircle size={16} className={`flex-shrink-0 ${isUrgent ? "text-amber-500" : "text-blue-500"}`} />
            <p className={`text-xs font-medium flex-1 ${isUrgent ? "text-amber-800" : "text-blue-800"}`}>
              {isExpired ? (
                <><strong>Your plan has expired.</strong> Upgrade to restore access to all features.</>
              ) : (
                <><strong>{subscription.remainingDays} day{subscription.remainingDays !== 1 ? "s" : ""} remaining.</strong> {isTrial ? "Upgrade to retain access to all features." : "Renew to avoid interruption."}</>
              )}
            </p>
            {subscription.planType !== "enterprise" && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors flex-shrink-0">
                <Rocket size={12} /> {isTrial ? "Upgrade" : "Renew"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── E-way Bill GSP ── */
export function EwayGSPSettings() {
  const [showPass, setShowPass] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
        <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          No firm with GST number found. Add a GST number in{" "}
          <span className="font-semibold underline cursor-pointer">Manage Firm</span>{" "}
          before registering GSP credentials.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">GSP Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="Your GSP account username" className={inp} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">GSP Password</label>
          <div className="relative">
            <input type={showPass ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your GSP account password"
              className={cn(inp, "pr-10")} />
            <button type="button" onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button className="text-brand-700 hover:underline font-medium">GSP Credentials Guide →</button>
          <span className="text-muted-foreground">·</span>
          <button className="text-brand-700 hover:underline font-medium">E-way Bill Generation Guide →</button>
        </div>

        <button
          onClick={() => toast.success("GSP credentials saved & registered")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors">
          <Save size={14} /> Save & Register Details
        </button>
      </div>
    </div>
  );
}
