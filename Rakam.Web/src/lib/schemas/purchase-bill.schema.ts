import { z } from "zod";

// ── Purchase Line Item ───────────────────────
export const purchaseLineItemSchema = z.object({
  id: z.string(),
  productId: z.string().optional(),
  productName: z.string().min(1, "Product is required"),
  itemCode: z.string().optional(),
  hsnCode: z.string().optional(),
  qty: z.coerce.number().min(0.01, "Qty must be > 0"),
  unit: z.string().min(1, "Unit is required"),
  rate: z.coerce.number().min(0, "Rate must be ≥ 0"),
  discount: z.coerce.number().min(0).max(100).default(0),
  amount: z.number(),
});

export type PurchaseLineItemFormValues = z.infer<typeof purchaseLineItemSchema>;

// ── Purchase Bill Form ───────────────────────
export const purchaseBillFormSchema = z.object({
  partyId: z.string().min(1, "Party is required"),
  partyName: z.string().optional(),
  applyGst: z.boolean().default(false),
  billNo: z.string().min(1, "Bill number is required"),
  billDate: z.string().min(1, "Bill date is required"),
  dueDays: z.coerce.number().min(0).optional(),
  dueDate: z.string().optional(),
  lineItems: z.array(purchaseLineItemSchema).min(1, "Add at least one product"),
  remark: z.string().max(200).optional(),
  attachmentUrl: z.string().optional(),
});

export type PurchaseBillFormValues = z.infer<typeof purchaseBillFormSchema>;

// ── Purchase Record Payment ──────────────────
export const purchasePaymentSchema = z.object({
  billNo: z.string(),
  paymentDate: z.string().min(1, "Payment date is required"),
  transactionAmount: z.coerce.number().min(0.01, "Amount must be > 0"),
  paymentMode: z.enum(["Cash", "Cheque", "Online", "Other"]),
  settlementAmount: z.coerce.number().min(0).optional(),
  note: z.string().max(250).optional(),
});

export type PurchasePaymentFormValues = z.infer<typeof purchasePaymentSchema>;

// ── Purchase Bill Filter ─────────────────────
export const purchaseBillFilterSchema = z.object({
  status: z.enum(["ALL", "PAID", "UNPAID", "PARTIAL"]).default("ALL"),
  partyId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  billType: z.enum(["ALL", "WITH_TAX", "WITHOUT_TAX"]).default("ALL"),
});

export type PurchaseBillFilterValues = z.infer<typeof purchaseBillFilterSchema>;
