"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { apiRequest, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const setupSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().max(80).optional(),
  firmName: z.string().min(1, "Firm name is required").max(160),
  gstNo: z
    .string()
    .regex(/^[0-9A-Z]{15}$/, "Must be a valid 15-character GSTIN")
    .optional()
    .or(z.literal("")),
  state: z.string().max(60).optional(),
  mobilePrimary: z.string().max(15).optional(),
});

type SetupFormValues = z.infer<typeof setupSchema>;

interface Props {
  mobile: string;
  onComplete: () => void;
}

export function SetupFirmStep({ mobile, onComplete }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: { mobilePrimary: mobile },
  });

  const onSubmit = async (values: SetupFormValues) => {
    setIsSubmitting(true);
    try {
      const firmPayload: Record<string, string> = { name: values.firmName };
      if (values.gstNo) firmPayload.gstNo = values.gstNo;
      if (values.state) firmPayload.state = values.state;
      if (values.mobilePrimary) firmPayload.mobilePrimary = values.mobilePrimary;

      const profilePayload: Record<string, string> = { firstName: values.firstName };
      if (values.lastName) profilePayload.lastName = values.lastName;

      await Promise.all([
        apiRequest("/firms", { method: "POST", body: JSON.stringify(firmPayload) }),
        apiRequest("/settings/profile", { method: "PATCH", body: JSON.stringify(profilePayload) }),
      ]);

      onComplete();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Setup failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Complete your profile</h2>
        <p className="text-sm text-muted-foreground">
          A few quick details to set up your account
        </p>
      </div>

      {/* ── Personal details ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first-name">
            First name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="first-name"
            placeholder="Rajesh"
            autoFocus
            maxLength={80}
            aria-invalid={!!errors.firstName}
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last-name">
            Last name <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="last-name"
            placeholder="Sharma"
            maxLength={80}
            {...register("lastName")}
          />
        </div>
      </div>

      <Separator />

      {/* ── Firm details ── */}
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Business details
      </p>

      {/* Firm Name */}
      <div className="space-y-1.5">
        <Label htmlFor="firm-name">
          Firm name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="firm-name"
          placeholder="e.g. Sharma Traders"
          maxLength={160}
          aria-invalid={!!errors.firmName}
          {...register("firmName")}
        />
        {errors.firmName && (
          <p className="text-xs text-destructive">{errors.firmName.message}</p>
        )}
      </div>

      {/* GSTIN */}
      <div className="space-y-1.5">
        <Label htmlFor="firm-gst">
          GSTIN <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="firm-gst"
          placeholder="e.g. 22AAAAA0000A1Z5"
          maxLength={15}
          className="uppercase tracking-wider"
          aria-invalid={!!errors.gstNo}
          {...register("gstNo", {
            onChange: (e) => {
              e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "");
            },
          })}
        />
        {errors.gstNo && (
          <p className="text-xs text-destructive">{errors.gstNo.message}</p>
        )}
      </div>

      {/* State + Mobile */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firm-state">
            State <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="firm-state"
            placeholder="e.g. Gujarat"
            maxLength={60}
            {...register("state")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="firm-mobile">
            Mobile <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="firm-mobile"
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            maxLength={15}
            {...register("mobilePrimary")}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="h-10 w-full text-sm font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting up…
          </>
        ) : (
          <>
            <Building2 className="mr-2 h-4 w-4" />
            Get started
          </>
        )}
      </Button>
    </form>
  );
}
