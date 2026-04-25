import { z } from "zod";

// ── Line Item ────────────────────────────────
export const lineItemSchema = z.object({
  id: z.string(),
  productId: z.string().optional(),
  productName: z.string().min(1, "Product is required"),
  itemCode: z.string().optional(),
  hsnCode: z.string().optional(),
  qty: z.coerce.number().min(0.01, "Qty must be > 0"),
  unit: z.string().min(1, "Unit is required"),
  rate: z.coerce.number().min(0, "Rate must be ≥ 0"),
  discount: z.coerce.number().min(0).max(100).optional(),
  amount: z.number(),
});

export type LineItemFormValues = z.infer<typeof lineItemSchema>;

// ── Challan ──────────────────────────────────
export const challanSchema = z.object({
  id: z.string(),
  noChallan: z.boolean().default(false),
  challanNumber: z.string().optional(),
  challanDate: z.string().optional(),
});

export type ChallanFormValues = z.infer<typeof challanSchema>;

// ── Bill Form ────────────────────────────────
export const billFormSchema = z.object({
  partyId: z.string().min(1, "Party is required"),
  partyName: z.string().optional(),
  applyGst: z.boolean().default(false),
  billNo: z.string().optional(),
  billDate: z.string().min(1, "Bill date is required"),
  dueDays: z.coerce.number().min(0).optional(),
  dueDate: z.string().optional(),
  challans: z.array(challanSchema).default([]),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one product"),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  remark: z.string().max(500).optional(),
});

export type BillFormValues = z.infer<typeof billFormSchema>;

// ── Record Payment Form ──────────────────────
export const recordPaymentSchema = z.object({
  billNo: z.string(),
  paymentDate: z.string().min(1, "Payment date is required"),
  transactionAmount: z.coerce.number().min(0.01, "Amount must be > 0"),
  paymentMode: z.enum(["Cash", "Cheque", "Online", "Other"]),
  settlementAmount: z.coerce.number().min(0).optional(),
  note: z.string().max(250).optional(),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;

// ── Filter Form ──────────────────────────────
export const billFilterSchema = z.object({
  status: z.enum(["ALL", "PAID", "UNPAID", "PARTIAL"]).default("ALL"),
  partyId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  billType: z.enum(["ALL", "TAX_INVOICE", "JOB_CHALLAN"]).default("ALL"),
});

export type BillFilterValues = z.infer<typeof billFilterSchema>;
