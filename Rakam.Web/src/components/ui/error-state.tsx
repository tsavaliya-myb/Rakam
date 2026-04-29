import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  /** Human-readable error description. E.g. "Failed to load parties." */
  message: string;
  /** Callback for the retry button. If omitted, the button is hidden. */
  onRetry?: () => void;
  /** Extra classes applied to the outer wrapper. */
  className?: string;
}

/**
 * Centred error state with an alert icon, message, and optional retry button.
 * Matches the rounded-card style used throughout the app.
 */
export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-border",
        "flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-destructive/8 flex items-center justify-center">
        <AlertCircle
          size={24}
          strokeWidth={1.5}
          className="text-destructive/70"
        />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors hover:underline"
        >
          <RotateCcw size={12} />
          Try again
        </button>
      )}
    </div>
  );
}
