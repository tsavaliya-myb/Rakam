"use client";

import { useRef, ChangeEvent, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function OtpInput({ length = 6, value, onChange, disabled, hasError }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focus = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    onChange(next.join(""));
    if (digit && i < length - 1) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      focus(i - 1);
    }
    if (e.key === "ArrowLeft" && i > 0) focus(i - 1);
    if (e.key === "ArrowRight" && i < length - 1) focus(i + 1);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length).trimEnd() || pasted);
    focus(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="flex justify-center gap-2.5">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          autoFocus={i === 0}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-12 w-10 rounded-xl border-2 bg-background text-center text-lg font-bold caret-transparent",
            "outline-none transition-all duration-150",
            "focus:border-primary focus:ring-3 focus:ring-primary/15",
            "disabled:cursor-not-allowed disabled:opacity-50",
            hasError
              ? "border-destructive ring-3 ring-destructive/20"
              : digit
                ? "border-primary/60 bg-primary/5"
                : "border-input"
          )}
        />
      ))}
    </div>
  );
}
