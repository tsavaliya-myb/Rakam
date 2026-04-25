"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2, Landmark, Truck, ImageIcon,
  Plus, Trash2, Upload, ChevronDown, ChevronUp,
} from "lucide-react";
import { editFirmSchema, type EditFirmFormValues } from "@/lib/schemas/firm.schema";
import { INDIA_STATES, GST_OPTIONS } from "@/config/constants";
import { cn } from "@/lib/utils";
import type { FirmDetails } from "@/lib/mock/firms";

interface Props {
  firm: FirmDetails;
  onSubmit: (data: EditFirmFormValues) => void;
  onCancel: () => void;
}

const inputCls = cn(
  "w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-foreground",
  "outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-900/10 transition-all",
  "placeholder:text-muted-foreground/60"
);

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-foreground block mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-500 mt-0.5">{message}</p>;
}

function SectionHeader({
  icon: Icon,
  title,
  open,
  onToggle,
}: {
  icon: React.ElementType;
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
          <Icon size={15} strokeWidth={1.8} className="text-brand-700" />
        </div>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      {open ? (
        <ChevronUp size={16} className="text-muted-foreground" />
      ) : (
        <ChevronDown size={16} className="text-muted-foreground" />
      )}
    </button>
  );
}

export function EditFirmForm({ firm, onSubmit, onCancel }: Props) {
  const [sections, setSections] = useState({
    details: true,
    bank: true,
    dispatch: true,
    assets: true,
  });

  function toggleSection(key: keyof typeof sections) {
    setSections((s) => ({ ...s, [key]: !s[key] }));
  }

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFirmFormValues>({
    resolver: zodResolver(editFirmSchema),
    defaultValues: {
      gstNo: firm.gstNo ?? "",
      name: firm.name,
      ownerName: firm.ownerName ?? "",
      panNo: firm.panNo ?? "",
      gstPercent: firm.gstPercent ?? "",
      mobilePrimary: firm.mobilePrimary ?? "",
      mobileSecondary: firm.mobileSecondary ?? "",
      msmeNo: firm.msmeNo ?? "",
      fullAddress: firm.fullAddress,
      state: firm.state,
      city: firm.city ?? "",
      pincode: firm.pincode ?? "",
      bankName: firm.bankName ?? "",
      branchName: firm.branchName ?? "",
      accountHolderName: firm.accountHolderName ?? "",
      accountType: firm.accountType ?? "",
      accountNo: firm.accountNo ?? "",
      ifscCode: firm.ifscCode ?? "",
      dispatchAddresses: firm.dispatchAddresses,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "dispatchAddresses",
  });

  function addDispatch() {
    append({
      id: `da${Date.now()}`,
      dispatchName: "",
      address: "",
      city: "",
      state: "",
      pin: "",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* ── Section 1: Firm Details ── */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <SectionHeader
          icon={Building2}
          title="Firm Details"
          open={sections.details}
          onToggle={() => toggleSection("details")}
        />
        {sections.details && (
          <div className="px-5 pb-5 pt-1 space-y-4 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>GST No.</Label>
                <input {...register("gstNo")} placeholder="27AABCM1234A1Z5" className={inputCls} />
              </div>
              <div>
                <Label required>Firm Name</Label>
                <input {...register("name")} placeholder="Shreeji Enterprises" className={inputCls} />
                <FieldError message={errors.name?.message} />
              </div>
              <div>
                <Label>Owner Name</Label>
                <input {...register("ownerName")} placeholder="Rakesh Mehta" className={inputCls} />
              </div>
              <div>
                <Label>PAN No.</Label>
                <input {...register("panNo")} placeholder="AABCM1234A" className={inputCls} />
              </div>
              <div>
                <Label>GST (%)</Label>
                <select {...register("gstPercent")} className={inputCls}>
                  <option value="">Select GST</option>
                  {GST_OPTIONS.map((g) => (
                    <option key={g} value={g}>GST {g}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Mobile No. (Primary)</Label>
                <input {...register("mobilePrimary")} type="tel" placeholder="9876543210" className={inputCls} />
              </div>
              <div>
                <Label>Mobile No. (Secondary)</Label>
                <input {...register("mobileSecondary")} type="tel" placeholder="9988776655" className={inputCls} />
              </div>
              <div>
                <Label>MSME No.</Label>
                <input {...register("msmeNo")} placeholder="MH-23-0012345" className={inputCls} />
              </div>
            </div>
            <div>
              <Label required>Full Address</Label>
              <textarea
                {...register("fullAddress")}
                rows={3}
                placeholder="123 Ring Road, Andheri East"
                className={cn(inputCls, "resize-none")}
              />
              <FieldError message={errors.fullAddress?.message} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label required>State</Label>
                <select {...register("state")} className={inputCls}>
                  <option value="">Select state</option>
                  {INDIA_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <FieldError message={errors.state?.message} />
              </div>
              <div>
                <Label>City</Label>
                <input {...register("city")} placeholder="Mumbai" className={inputCls} />
              </div>
              <div>
                <Label>Pincode</Label>
                <input {...register("pincode")} placeholder="400069" className={inputCls} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Bank Details ── */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <SectionHeader
          icon={Landmark}
          title="Bank Details"
          open={sections.bank}
          onToggle={() => toggleSection("bank")}
        />
        {sections.bank && (
          <div className="px-5 pb-5 pt-1 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Bank Name</Label>
                <input {...register("bankName")} placeholder="State Bank of India" className={inputCls} />
              </div>
              <div>
                <Label>Branch Name</Label>
                <input {...register("branchName")} placeholder="Andheri East Branch" className={inputCls} />
              </div>
              <div>
                <Label>Account Holder Name</Label>
                <input {...register("accountHolderName")} placeholder="Shreeji Enterprises" className={inputCls} />
              </div>
              <div>
                <Label>Account Type</Label>
                <input {...register("accountType")} placeholder="Current / Savings" className={inputCls} />
              </div>
              <div>
                <Label>A/C No.</Label>
                <input {...register("accountNo")} placeholder="12345678901" className={inputCls} />
              </div>
              <div>
                <Label>IFSC Code</Label>
                <input {...register("ifscCode")} placeholder="SBIN0001234" className={inputCls} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Dispatch Addresses ── */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <SectionHeader
          icon={Truck}
          title="Dispatch Address Management"
          open={sections.dispatch}
          onToggle={() => toggleSection("dispatch")}
        />
        {sections.dispatch && (
          <div className="px-5 pb-5 pt-1 border-t border-border space-y-4">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="p-4 bg-secondary/40 rounded-xl border border-border space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Dispatch Address {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label required>Dispatch Name</Label>
                    <input
                      {...register(`dispatchAddresses.${idx}.dispatchName`)}
                      placeholder="Main Warehouse"
                      className={inputCls}
                    />
                    <FieldError message={errors.dispatchAddresses?.[idx]?.dispatchName?.message} />
                  </div>
                  <div>
                    <Label required>Address</Label>
                    <input
                      {...register(`dispatchAddresses.${idx}.address`)}
                      placeholder="Plot 12, MIDC Industrial Area"
                      className={inputCls}
                    />
                    <FieldError message={errors.dispatchAddresses?.[idx]?.address?.message} />
                  </div>
                  <div>
                    <Label>City</Label>
                    <input
                      {...register(`dispatchAddresses.${idx}.city`)}
                      placeholder="Mumbai"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Label required>State</Label>
                    <select {...register(`dispatchAddresses.${idx}.state`)} className={inputCls}>
                      <option value="">Select state</option>
                      {INDIA_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <FieldError message={errors.dispatchAddresses?.[idx]?.state?.message} />
                  </div>
                  <div>
                    <Label>Pin</Label>
                    <input
                      {...register(`dispatchAddresses.${idx}.pin`)}
                      placeholder="400093"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addDispatch}
              className="flex items-center gap-2 text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
            >
              <Plus size={14} /> Add Dispatch Address
            </button>
          </div>
        )}
      </div>

      {/* ── Section 4: Assets ── */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <SectionHeader
          icon={ImageIcon}
          title="Assets (Logo, Watermark, Signature)"
          open={sections.assets}
          onToggle={() => toggleSection("assets")}
        />
        {sections.assets && (
          <div className="px-5 pb-5 pt-1 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {[
                { label: "Logo",                accept: "image/*" },
                { label: "Watermark Image",     accept: "image/*" },
                { label: "Signature Image",     accept: "image/*" },
                { label: "Udhyam Certificate",  accept: "image/*,application/pdf" },
              ].map((asset) => (
                <div key={asset.label}>
                  <Label>{asset.label}</Label>
                  <label className="flex items-center gap-2 px-3 py-3 border border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/60 transition-colors text-xs text-muted-foreground">
                    <Upload size={14} />
                    Click to upload {asset.label.toLowerCase()}
                    <input type="file" accept={asset.accept} className="sr-only" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Actions ── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 sm:flex-none sm:px-8 py-2.5 rounded-xl text-sm font-semibold bg-brand-900 text-white hover:bg-brand-800 disabled:opacity-60 transition-colors shadow-sm"
        >
          Update Firm
        </button>
      </div>
    </form>
  );
}
