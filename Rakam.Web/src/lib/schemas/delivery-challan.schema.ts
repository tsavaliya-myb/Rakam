import { z } from "zod";

// ── DC Line Item ─────────────────────────────
export const dcLineItemSchema = z.object({
  id: z.string(),
  productId: z.string().optional(),
  productName: z.string().min(1, "Product is required"),
  itemCode: z.string().optional(),
  hsnCode: z.string().optional(),
  qty: z.coerce.number().min(0.01, "Qty must be > 0"),
  unit: z.string().min(1, "Unit is required"),
  rate: z.coerce.number().min(0),
  amount: z.number(),
});

export type DCLineItemFormValues = z.infer<typeof dcLineItemSchema>;

// ── Party Challan block ──────────────────────
export const partyChallanSchema = z.object({
  id: z.string(),
  noChallan: z.boolean().default(false),
  partyChallanNo: z.string().optional(),
  partyChallanDate: z.string().optional(),
});

export type PartyChallanFormValues = z.infer<typeof partyChallanSchema>;

// ── Delivery Challan Form ────────────────────
export const dcFormSchema = z.object({
  partyId: z.string().min(1, "Party is required"),
  partyName: z.string().optional(),
  dcNo: z.string().optional(),
  dcDate: z.string().min(1, "Date is required"),
  challans: z.array(partyChallanSchema).default([]),
  lineItems: z.array(dcLineItemSchema).min(1, "Add at least one product"),
  remark: z.string().max(200).optional(),
});

export type DCFormValues = z.infer<typeof dcFormSchema>;

// ── DC Filter ────────────────────────────────
export const dcFilterSchema = z.object({
  partyId: z.string().optional(),
  salesBillCreated: z.enum(["ALL", "YES", "NO"]).default("ALL"),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export type DCFilterValues = z.infer<typeof dcFilterSchema>;
