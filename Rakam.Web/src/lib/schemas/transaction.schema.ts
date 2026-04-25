import { z } from "zod";

export const addPaymentSchema = z.object({
  paymentDate: z.string().min(1),
  transactionFor: z.enum(["SALES", "PURCHASE"]),
  partyId: z.string().optional(),
  paymentMode: z.enum(["CASH", "CHEQUE", "ONLINE", "OTHER"]),
  paymentAmount: z.coerce.number().min(0.01, "Amount is required"),
  notes: z.string().max(250).optional(),
});

export type AddPaymentFormValues = z.infer<typeof addPaymentSchema>;

export const transactionFilterSchema = z.object({
  transactionType: z.enum(["ALL", "DEBIT", "CREDIT"]),
  mode: z.enum(["ALL", "CASH", "CHEQUE", "ONLINE", "OTHER"]),
  partyId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export type TransactionFilterValues = z.infer<typeof transactionFilterSchema>;
