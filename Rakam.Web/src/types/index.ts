/* ─────────────────────────────────────────────
   Global type definitions for Rakam
───────────────────────────────────────────── */

// ── Navigation ──────────────────────────────
export type NavItemId =
  | "dashboard" | "bill" | "purchase" | "challan"
  | "eway" | "firm" | "party" | "product"
  | "expense" | "transactions" | "reports" | "settings";

export interface NavItem {
  id: NavItemId;
  label: string;
  href: string;
  icon: string;
}

// ── Firm ────────────────────────────────────
export interface Firm {
  id: string;
  name: string;
  gstNo?: string;
  city?: string;
  state?: string;
  isDefault: boolean;
}

// ── Party ───────────────────────────────────
export interface Party {
  id: string;
  name: string;
  ownerName?: string;
  gstNo?: string;
  panCard?: string;
  address: string;
  state: string;
  city?: string;
  pincode?: string;
  contactNumber?: string;
  discount?: number;
  dueDays?: number;
  brokerName?: string;
  brokerMobile?: string;
}

// ── Product ─────────────────────────────────
export interface Product {
  id: string;
  name: string;
  rate?: number;
  unit: string;
  gst?: number;
  itemCode?: string;
  hsnCode?: string;
  description?: string;
}

// ── Bill Line Item ──────────────────────────
export interface BillLineItem {
  id: string;
  productId?: string;
  productName: string;
  itemCode?: string;
  hsnCode?: string;
  qty: number;
  unit: string;
  rate: number;
  discount?: number;
  amount: number;
}

// ── Bill ────────────────────────────────────
export type BillStatus = "PAID" | "UNPAID" | "PARTIAL";
export type BillType   = "TAX_INVOICE" | "JOB_CHALLAN";

export interface Bill {
  id: string;
  billNo: string;
  billDate: string;
  dueDate?: string;
  dueDays?: number;
  partyId: string;
  partyName: string;
  billType: BillType;
  applyGst: boolean;
  lineItems: BillLineItem[];
  netAmount: number;
  discountAmount: number;
  taxableAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  pendingAmount: number;
  status: BillStatus;
  remark?: string;
  challanNo?: string;
  challanDate?: string;
}

// ── Purchase Bill ───────────────────────────
export type PurchaseBillType = "WITH_TAX" | "WITHOUT_TAX";

export interface PurchaseBill {
  id: string;
  billNo: string;
  billDate: string;
  dueDate?: string;
  dueDays?: number;
  partyId: string;
  partyName: string;
  billType: PurchaseBillType;
  applyGst: boolean;
  lineItems: BillLineItem[];
  totalQty: number;
  netAmount: number;
  discountAmount: number;
  totalAmount: number;
  pendingAmount: number;
  status: BillStatus;
  remark?: string;
  attachmentUrl?: string;
}

// ── Delivery Challan ─────────────────────────
export interface DeliveryChallan {
  id: string;
  dcNo: string;
  dcDate: string;
  partyId: string;
  partyName: string;
  partyChallanNo?: string;
  partyChallanDate?: string;
  lineItems: BillLineItem[];
  totalQty: number;
  netAmount: number;
  totalAmount: number;
  salesBillCreated: boolean;
  salesBillNo?: string;
  remark?: string;
}

// ── Expense ─────────────────────────────────
export type ExpenseMode = "AMOUNT" | "ITEM";

export interface Expense {
  id: string;
  date: string;
  category: string;
  supplierName?: string;
  amount: number;
  note?: string;
  attachmentUrl?: string;
  mode: ExpenseMode;
  expenseItem?: string;
  qty?: number;
  rate?: number;
}

// ── Transaction / Payment ───────────────────
export type TransactionType = "DEBIT" | "CREDIT";
export type PaymentMode     = "CASH" | "CHEQUE" | "ONLINE" | "OTHER";

export interface Transaction {
  id: string;
  date: string;
  refNumber: string;
  partyId?: string;
  partyName?: string;
  amount: number;
  transactionType: TransactionType;
  transactionFor: string;
  mode: PaymentMode;
  note?: string;
}

// ── Report ───────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReportRow = Record<string, any>;

// ── Subscription ─────────────────────────────
export type PlanType = "trial" | "starter" | "professional" | "enterprise";

export interface Subscription {
  planName: string;
  planType: PlanType;
  expiresOn: string;
  remainingDays: number;
  firmLimit: number;
  firmsUsed: number;
}

// ── Dashboard Stats ──────────────────────────
export interface DashboardStats {
  totalSales: number;
  totalPurchase: number;
  totalExpense: number;
  netIncome: number;
  salesChange: number;
  purchaseChange: number;
  expenseChange: number;
  incomeChange: number;
}

export interface PartyBarData {
  label: string;
  total: number;
  received?: number;
  paid?: number;
  pending: number;
}
