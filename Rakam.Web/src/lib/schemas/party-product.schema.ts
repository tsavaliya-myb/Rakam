import { z } from "zod";

export const partySchema = z.object({
  id: z.string().optional(),
  gstNo: z.string().optional(),
  panCard: z.string().optional(),
  name: z.string().min(1, "Party name is required"),
  ownerName: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().optional(),
  pincode: z.string().optional(),
  contactNumber: z.string().optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  dueDays: z.coerce.number().min(0).default(45),
  brokerName: z.string().optional(),
  brokerMobile: z.string().optional(),
});

export type PartyFormValues = z.infer<typeof partySchema>;

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  rate: z.coerce.number().min(0).optional(),
  unit: z.string().min(1, "Unit is required"),
  gst: z.string().optional(),
  itemCode: z.string().optional(),
  hsnCode: z.string().optional(),
  description: z.string().max(250).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
