"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Phone, RotateCcw } from "lucide-react";

import { mobileSchema, type MobileFormValues } from "@/lib/schemas/auth.schema";
import { authApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/auth/OtpInput";
import { cn } from "@/lib/utils";

const RESEND_DELAY = 30;

type Step = "mobile" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/dashboard";
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>("mobile");
  const [reqId, setReqId] = useState("");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<MobileFormValues>({
    resolver: zodResolver(mobileSchema),
  });

  // resend countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const onSendOtp = async ({ mobile }: MobileFormValues) => {
    setIsSending(true);
    try {
      const { reqId: id } = await authApi.sendOtp(mobile);
      setReqId(id);
      setMaskedMobile(`${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`);
      setStep("otp");
      setCountdown(RESEND_DELAY);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not send OTP. Try again.";
      setError("mobile", { message: msg });
    } finally {
      setIsSending(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const onVerifyOtp = async () => {
    if (otp.length < 4) {
      setOtpError("Please enter the complete OTP");
      return;
    }
    setOtpError("");
    setIsVerifying(true);
    try {
      const tokens = await authApi.verifyOtp(reqId, otp);
      setAuth(tokens);
      toast.success("Logged in successfully");
      router.replace(redirectTo);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Invalid or expired OTP";
      setOtpError(msg);
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const onResend = async () => {
    setIsResending(true);
    setOtp("");
    setOtpError("");
    try {
      await authApi.retryOtp(reqId);
      setCountdown(RESEND_DELAY);
      toast.success("OTP resent");
    } catch {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const goBack = () => {
    setStep("mobile");
    setOtp("");
    setOtpError("");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* ── Brand mark ── */}
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
          <span className="text-3xl font-black text-primary-foreground">₹</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rakam</h1>
          <p className="text-sm text-muted-foreground">GST-ready billing for Indian SMEs</p>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">

        {/* ── Step indicator ── */}
        <div className="mb-6 flex items-center gap-2">
          {(["mobile", "otp"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  step === s || (s === "mobile" && step === "otp")
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {s === "mobile" && step === "otp" ? "✓" : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  step === s ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s === "mobile" ? "Mobile" : "OTP"}
              </span>
              {i === 0 && (
                <div
                  className={cn(
                    "mx-1 h-px w-8 transition-colors",
                    step === "otp" ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════
            Step 1 — Mobile number
            ════════════════════════════════════════ */}
        {step === "mobile" && (
          <form onSubmit={handleSubmit(onSendOtp)} noValidate className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground">
                Enter your mobile number to receive a one-time password
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mobile">Mobile number</Label>
              <div className="flex gap-2">
                {/* country code badge */}
                <div className="flex h-8 shrink-0 items-center rounded-lg border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
                  🇮🇳 +91
                </div>
                <Input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  maxLength={10}
                  autoComplete="tel-national"
                  autoFocus
                  aria-invalid={!!errors.mobile}
                  className="flex-1 tracking-widest"
                  {...register("mobile", {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    },
                  })}
                />
              </div>
              {errors.mobile && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-destructive" />
                  {errors.mobile.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="h-10 w-full text-sm font-semibold"
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP…
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Send OTP
                </>
              )}
            </Button>
          </form>
        )}

        {/* ════════════════════════════════════════
            Step 2 — OTP entry
            ════════════════════════════════════════ */}
        {step === "otp" && (
          <div className="space-y-5">
            <div>
              <button
                type="button"
                onClick={goBack}
                className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change number
              </button>
              <h2 className="text-lg font-semibold text-foreground">Enter OTP</h2>
              <p className="text-sm text-muted-foreground">
                6-digit code sent to{" "}
                <span className="font-medium text-foreground">
                  +91 {maskedMobile}
                </span>
              </p>
            </div>

            {/* OTP digit boxes */}
            <div className="space-y-3">
              <OtpInput
                value={otp}
                onChange={(v) => {
                  setOtp(v);
                  setOtpError("");
                }}
                disabled={isVerifying}
                hasError={!!otpError}
              />
              {otpError && (
                <p className="text-center text-xs text-destructive">{otpError}</p>
              )}
            </div>

            {/* Verify button */}
            <Button
              type="button"
              className="h-10 w-full text-sm font-semibold"
              onClick={onVerifyOtp}
              disabled={isVerifying || otp.length < 4}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify & Login"
              )}
            </Button>

            {/* Resend */}
            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive the code?{" "}
              {countdown > 0 ? (
                <span className="font-medium tabular-nums">Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={onResend}
                  disabled={isResending}
                  className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline disabled:opacity-60"
                >
                  {isResending ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                      Resending…
                    </>
                  ) : (
                    "Resend OTP"
                  )}
                </button>
              )}
            </p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <span className="font-medium text-foreground">Terms of Service</span> &amp;{" "}
        <span className="font-medium text-foreground">Privacy Policy</span>
      </p>
    </div>
  );
}
