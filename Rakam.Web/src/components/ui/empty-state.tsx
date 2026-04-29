import { type ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Lucide icon element rendered inside the icon bubble. */
  icon: ReactNode;
  /** Primary label shown below the icon. */
  label: string;
  /** Optional secondary description line. */
  description?: string;
  /** Label for the CTA button. Defaults to "Add New". Only shown when `onAdd` is provided. */
  addLabel?: string;
  /** Callback when the CTA button is clicked. If omitted, the button is hidden. */
  onAdd?: () => void;
  /** Background/accent colour class for the icon bubble. Defaults to brand blue. */
  iconBgClass?: string;
  /** Colour class for the icon itself. Defaults to brand blue. */
  iconColorClass?: string;
  /** Extra classes on the outer wrapper. */
  className?: string;
}

/**
 * Centred empty-state panel with icon, label, optional description, and optional CTA.
 * Designed to replace all custom empty-state divs in list pages.
 */
export function EmptyState({
  icon,
  label,
  description,
  addLabel = "Add New",
  onAdd,
  iconBgClass = "bg-brand-50",
  iconColorClass = "text-brand-400",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-border",
        "flex flex-col items-center justify-center py-24 gap-4",
        className
      )}
    >
      {/* Icon bubble */}
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center",
          iconBgClass
        )}
      >
        <span className={cn("flex items-center justify-center", iconColorClass)}>
          {icon}
        </span>
      </div>

      {/* Text */}
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {/* CTA */}
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors"
        >
          <Plus size={15} />
          {addLabel}
        </button>
      )}
    </div>
  );
}
