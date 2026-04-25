"use client";

import { useRouter } from "next/navigation";
import { X, ClipboardList, FileInput } from "lucide-react";

interface ChooseBillTypeModalProps {
  onClose: () => void;
}

const OPTIONS = [
  {
    id: "manual",
    title: "Manual Challans",
    description: "You have to list out all the challan items manually",
    icon: ClipboardList,
    accent: "#16532d",
    bg: "#f0faf3",
    href: "/bill/add?type=manual",
  },
  {
    id: "import",
    title: "Import Delivery Challan",
    description: "Import delivery and create sales bill in a few clicks",
    icon: FileInput,
    accent: "#0369a1",
    bg: "#f0f9ff",
    href: "/bill/add?type=import",
  },
] as const;

export function ChooseBillTypeModal({ onClose }: ChooseBillTypeModalProps) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground text-sm">
            Choose Bill Type
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => { router.push(opt.href); onClose(); }}
                className="w-full flex items-start gap-4 p-4 rounded-2xl border border-border hover:border-brand-200 hover:bg-brand-50/30 transition-all text-left group"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: opt.bg }}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.8}
                    style={{ color: opt.accent }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-brand-900 transition-colors">
                    {opt.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 text-pretty leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
