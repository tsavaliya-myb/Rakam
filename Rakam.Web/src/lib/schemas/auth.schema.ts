import { z } from "zod";

export const mobileSchema = z.object({
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

export type MobileFormValues = z.infer<typeof mobileSchema>;
