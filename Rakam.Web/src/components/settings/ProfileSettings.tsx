"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Save, Loader2 } from "lucide-react";
import { profileSchema, type ProfileFormValues } from "@/lib/schemas/settings.schema";
import { cn } from "@/lib/utils";
import { useProfile, useUpdateProfile } from "@/hooks/api/use-settings";

const BUSINESS_TYPES = [
  "Manufacturer", "Trader", "Retailer", "Wholesaler",
  "Service Provider", "Exporter", "Importer",
];

const inp = cn(
  "w-full px-3 py-2 text-sm rounded-xl border border-border bg-secondary text-foreground outline-none",
  "focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-900/10 transition-all placeholder:text-muted-foreground/60"
);
const lbl = "block text-xs font-semibold text-foreground mb-1.5";

export function ProfileSettings() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } =
    useForm<ProfileFormValues>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        firstName: "",
        lastName: "",
        mobileNo: "",
        email: "",
        businessType: [],
      },
    });

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        mobileNo: profile.mobile,
        email: profile.email ?? "",
        businessType: profile.businessTypes,
      });
    }
  }, [profile, reset]);

  function onSubmit(data: ProfileFormValues) {
    updateProfile.mutate({
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      email: data.email || null,
      businessTypes: data.businessType ?? [],
    });
  }

  const firstName = watch("firstName") ?? "";
  const lastName = watch("lastName") ?? "";
  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : firstName
    ? firstName.slice(0, 2).toUpperCase()
    : profile?.mobile?.slice(-2) ?? "Me";
  const displayName = firstName || lastName
    ? `${firstName} ${lastName}`.trim()
    : profile?.mobile ?? "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-900 to-brand-500 flex items-center justify-center">
            <span className="text-white text-2xl font-bold select-none">{initials}</span>
          </div>
          <button type="button"
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-white border-2 border-border flex items-center justify-center shadow-sm hover:bg-secondary transition-colors">
            <Camera size={13} className="text-muted-foreground" />
          </button>
        </div>
        <div>
          <p className="font-semibold text-foreground">{displayName || profile?.mobile}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Click the camera to update photo</p>
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>First Name</label>
          <input {...register("firstName")} placeholder="First name" className={inp} />
        </div>
        <div>
          <label className={lbl}>Last Name</label>
          <input {...register("lastName")} placeholder="Last name" className={inp} />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>
            Mobile No. <span className="text-destructive">*</span>
          </label>
          <input
            {...register("mobileNo")}
            readOnly
            className={cn(inp, "opacity-60 cursor-not-allowed")}
          />
          <p className="text-[11px] text-muted-foreground mt-1">Mobile number cannot be changed</p>
        </div>
        <div>
          <label className={lbl}>Email</label>
          <input type="email" {...register("email")} placeholder="email@example.com"
            className={cn(inp, errors.email && "border-destructive")} />
          {errors.email && <p className="text-[11px] text-destructive mt-1">{errors.email.message}</p>}
        </div>
      </div>

      {/* Business Type */}
      <div>
        <label className={lbl}>Business Type</label>
        <div className="flex flex-wrap gap-2">
          {BUSINESS_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" value={type} {...register("businessType")}
                className="w-4 h-4 rounded accent-brand-700" />
              <span className="text-xs font-medium text-foreground group-hover:text-brand-700 transition-colors">
                {type}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button"
          onClick={() => profile && reset({
            firstName: profile.firstName ?? "",
            lastName: profile.lastName ?? "",
            mobileNo: profile.mobile,
            email: profile.email ?? "",
            businessType: profile.businessTypes,
          })}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-secondary transition-colors">
          Discard Changes
        </button>
        <button type="submit" disabled={updateProfile.isPending || !isDirty}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-900 hover:bg-brand-800 transition-colors disabled:opacity-60">
          {updateProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {updateProfile.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
