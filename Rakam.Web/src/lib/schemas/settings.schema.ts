import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  mobileNo: z.string().min(10, "Valid mobile number required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  businessType: z.array(z.string()).optional(),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

export const salesBillSettingsSchema = z.object({
  displayDueDetails: z.boolean(),
  displayGstInJobChallan: z.boolean(),
  defaultPrintType: z.enum(["Original", "Duplicate", "Triplicate"]),
  displayChallanOption: z.boolean(),
  billNoLabel: z.enum(["Bill No.", "Invoice No.", "Job Ch No."]),
  displayAddLossProduct: z.boolean(),
  displayDeliveryToSalesBill: z.boolean(),
  displayWithHoldingTax: z.boolean(),
  enableDirectPayment: z.boolean(),
  discountScope: z.enum(["bill_bill", "item_bill", "item_item"]),
  billPrefix: z.string().max(10).optional(),
  termsAndConditions: z.string().optional(),
  titleJobChallan: z.string().max(20).optional(),
  titleTaxInvoice: z.string().max(20).optional(),
  customHeading: z.string().max(30).optional(),
});
export type SalesBillSettingsValues = z.infer<typeof salesBillSettingsSchema>;

export const purchaseBillSettingsSchema = z.object({
  displayWithHoldingTax: z.boolean(),
});
export type PurchaseBillSettingsValues = z.infer<typeof purchaseBillSettingsSchema>;

export const dcSettingsSchema = z.object({
  displayRate: z.boolean(),
  displayGstNo: z.boolean(),
  defaultPrintType: z.enum(["Original", "Duplicate", "Triplicate"]),
  displayChallanOption: z.boolean(),
  termsAndConditions: z.string().optional(),
  customHeading: z.string().max(30).optional(),
});
export type DCSettingsValues = z.infer<typeof dcSettingsSchema>;

export const otherSettingsSchema = z.object({
  enableShortcuts: z.boolean(),
  enableDecimal: z.boolean(),
  enablePartyWiseRate: z.boolean(),
  enableShipmentAddress: z.boolean(),
});
export type OtherSettingsValues = z.infer<typeof otherSettingsSchema>;
