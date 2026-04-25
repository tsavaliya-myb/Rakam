"use client";

import { Pencil, Trash2, MapPin, Shield, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FirmDetails } from "@/lib/mock/firms";

interface Props {
  firm: FirmDetails;
  onEdit: (firm: FirmDetails) => void;
  onDelete: (firm: FirmDetails) => void;
  onToggle: (firmId: string, field: "watermark" | "logo" | "signature") => void;
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent",
          "transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-900",
          checked ? "bg-brand-900" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm",
            "transition duration-200 ease-in-out",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export function FirmCard({ firm, onEdit, onDelete, onToggle }: Props) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow",
      firm.isDefault && "ring-2 ring-brand-900/20"
    )}>
      {/* Card header */}
      <div className="flex items-start gap-4 p-5 border-b border-border">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-900 to-brand-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white font-extrabold text-lg select-none">
            {firm.name.charAt(0)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-foreground truncate">{firm.name}</h3>
            {firm.isDefault && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                Default
              </span>
            )}
          </div>

          {/* GST */}
          <div className="flex items-center gap-1.5 mt-1">
            {firm.gstNo ? (
              <>
                <Shield size={11} className="text-green-600 flex-shrink-0" />
                <span className="text-[11px] text-green-700 font-medium">{firm.gstNo}</span>
              </>
            ) : (
              <>
                <ShieldOff size={11} className="text-muted-foreground/60 flex-shrink-0" />
                <span className="text-[11px] text-muted-foreground">No GST registered</span>
              </>
            )}
          </div>

          {/* Location */}
          {(firm.city || firm.state) && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-muted-foreground/60 flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {[firm.city, firm.state].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(firm)}
            title="Edit firm"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-brand-700 hover:bg-brand-50 transition-colors"
          >
            <Pencil size={14} strokeWidth={1.8} />
          </button>
          <button
            onClick={() => onDelete(firm)}
            title="Delete firm"
            disabled={firm.isDefault}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* PDF toggles */}
      <div className="px-5 py-4 space-y-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          PDF Display Options
        </p>
        <Toggle
          label="Watermark"
          checked={firm.watermark}
          onChange={() => onToggle(firm.id, "watermark")}
        />
        <Toggle
          label="Logo"
          checked={firm.logo}
          onChange={() => onToggle(firm.id, "logo")}
        />
        <Toggle
          label="Signature"
          checked={firm.signature}
          onChange={() => onToggle(firm.id, "signature")}
        />
      </div>
    </div>
  );
}
