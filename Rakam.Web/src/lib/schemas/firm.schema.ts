import { z } from "zod";

export const dispatchAddressSchema = z.object({
  id: z.string(),
  dispatchName: z.string().min(1, "Dispatch name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().min(1, "State is required"),
  pin: z.string().optional(),
});

export const editFirmSchema = z.object({
  // Firm Details
  gstNo: z.string().optional(),
  name: z.string().min(1, "Firm name is required"),
  ownerName: z.string().optional(),
  panNo: z.string().optional(),
  gstPercent: z.string().optional(),
  mobilePrimary: z.string().optional(),
  mobileSecondary: z.string().optional(),
  msmeNo: z.string().optional(),
  fullAddress: z.string().min(1, "Address is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().optional(),
  pincode: z.string().optional(),
  // Bank Details
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountType: z.string().optional(),
  accountNo: z.string().optional(),
  ifscCode: z.string().optional(),
  // Dispatch Addresses
  dispatchAddresses: z.array(dispatchAddressSchema),
});

export type EditFirmFormValues = z.infer<typeof editFirmSchema>;
