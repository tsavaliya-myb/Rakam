import { z } from "zod";

export const addExpenseSchema = z.object({
  mode: z.enum(["AMOUNT", "ITEM"]),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  supplierName: z.string().optional(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  note: z.string().max(200).optional(),
  attachmentUrl: z.string().optional(),
  // Item mode extras
  expenseItem: z.string().optional(),
  qty: z.coerce.number().optional(),
  rate: z.coerce.number().optional(),
}).refine(
  (data) => {
    if (data.mode === "ITEM") {
      return !!data.expenseItem && (data.qty ?? 0) > 0 && (data.rate ?? 0) > 0;
    }
    return true;
  },
  {
    message: "Expense item, qty, and rate are required in Item mode",
    path: ["expenseItem"],
  }
);

export type AddExpenseFormValues = z.infer<typeof addExpenseSchema>;
