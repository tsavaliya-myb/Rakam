"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <PageErrorFallback message={this.state.message} onReset={this.reset} />
      );
    }
    return this.props.children;
  }
}

interface PageErrorFallbackProps {
  message?: string;
  onReset?: () => void;
}

export function PageErrorFallback({ message, onReset }: PageErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground px-4">
      <div className="w-14 h-14 rounded-2xl bg-destructive/8 flex items-center justify-center">
        <AlertTriangle size={28} strokeWidth={1.5} className="text-destructive/70" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-base font-semibold text-foreground">Something went wrong</p>
        {message && (
          <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
        )}
      </div>
      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
          <RotateCcw size={14} />
          Try again
        </Button>
      )}
    </div>
  );
}
