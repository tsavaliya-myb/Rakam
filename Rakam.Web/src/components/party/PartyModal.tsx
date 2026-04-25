"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, User } from "lucide-react";
import { partySchema, type PartyFormValues } from "@/lib/schemas/party-product.schema";
import { INDIA_STATES } from "@/config/constants";
import { cn } from "@/lib/utils";
import type { Party } from "@/types";

interface PartyModalProps {
  party?: Party;
  onClose: () => void;
  onSubmit: (data: PartyFormValues) => void;
}

const inp = cn(
  "w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none",
  "focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-900/10 transition-all placeholder:text-muted-foreground/60"
);
const lbl = "block text-xs font-semibold text-foreground mb-1.5";

export function PartyModal({ party, onClose, onSubmit }: PartyModalProps) {
  const isEdit = !!party;

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<PartyFormValues>({
      resolver: zodResolver(partySchema),
      defaultValues: party
        ? { ...party }
        : { dueDays: 45, discount: 0 },
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
              <User size={16} strokeWidth={1.8} className="text-brand-700" />
            </div>
            <h2 className="font-semibold text-foreground text-sm">
              {isEdit ? `Edit Party — ${party.name}` : "Add New Party"}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="party-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* GST + PAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>GST No.</label>
                <input {...register("gstNo")} placeholder="e.g. 27AABCM1234A1Z5" className={inp} />
              </div>
              <div>
                <label className={lbl}>PAN Card</label>
                <input {...register("panCard")} placeholder="e.g. AABCM1234A" className={inp} />
              </div>
            </div>

            {/* Party Name + Owner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>
                  Party Name <span className="text-destructive">*</span>
                </label>
                <input {...register("name")} placeholder="e.g. Mehta Co." className={cn(inp, errors.name && "border-destructive")} />
                {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className={lbl}>Owner Name</label>
                <input {...register("ownerName")} placeholder="e.g. Rakesh Mehta" className={inp} />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className={lbl}>
                Address <span className="text-destructive">*</span>
              </label>
              <textarea rows={2} {...register("address")} placeholder="Full address..."
                className={cn(inp, "resize-none", errors.address && "border-destructive")} />
              {errors.address && <p className="text-[11px] text-destructive mt-1">{errors.address.message}</p>}
            </div>

            {/* State + City + Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={lbl}>
                  State <span className="text-destructive">*</span>
                </label>
                <select {...register("state")} className={cn(inp, errors.state && "border-destructive")}>
                  <option value="">Select state</option>
                  {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <p className="text-[11px] text-destructive mt-1">{errors.state.message}</p>}
              </div>
              <div>
                <label className={lbl}>City</label>
                <input {...register("city")} placeholder="City" className={inp} />
              </div>
              <div>
                <label className={lbl}>Pincode</label>
                <input {...register("pincode")} placeholder="e.g. 400053" maxLength={6} className={inp} />
              </div>
            </div>

            {/* Contact + Discount + Due Days */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Contact Number</label>
                <input {...register("contactNumber")} placeholder="10-digit mobile" maxLength={10} className={inp} />
              </div>
              <div>
                <label className={lbl}>Discount (%)</label>
                <input type="number" step="0.01" min="0" max="100" {...register("discount")} className={cn(inp, "tabular-nums")} />
              </div>
              <div>
                <label className={lbl}>Due Days</label>
                <input type="number" min="0" {...register("dueDays")} className={cn(inp, "tabular-nums")} />
              </div>
            </div>

            {/* Broker */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Broker Details (optional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Broker Name</label>
                  <input {...register("brokerName")} placeholder="Broker's name" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Broker Mobile No.</label>
                  <input {...register("brokerMobile")} placeholder="10-digit mobile" maxLength={10} className={inp} />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button type="submit" form="party-form" disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors disabled:opacity-60">
            {isSubmitting ? "Saving…" : isEdit ? "Update Party" : "Save Party"}
          </button>
        </div>
      </div>
    </div>
  );
}
