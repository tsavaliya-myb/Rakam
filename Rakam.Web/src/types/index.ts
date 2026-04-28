/* ─────────────────────────────────────────────
   Global type definitions for Rakam
───────────────────────────────────────────── */

// ── Pagination ───────────────────────────────
export interface ApiPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface QueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  fromDate?: string;
  toDate?: string;
}

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

// ── Auth / Account ───────────────────────────
export interface AuthUser {
  id: string;
  mobile: string;
  name?: string;
}

export interface Account {
  id: string;
  mobile: string;
  name?: string;
  email?: string;
  createdAt: string;
}

// ── Firm ────────────────────────────────────
export interface Firm {
  id: string;
  accountId: string;
  name: string;
  gstNo?: string;
  panNo?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  isDefault: boolean;
  pdfOptions?: FirmPdfOptions;
}

export interface FirmPdfOptions {
  showLogo: boolean;
  showSign: boolean;
  showBank: boolean;
  showTerms: boolean;
  terms?: string;
}

export interface FirmBankDetails {
  id: string;
  firmId: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  accountHolderName: string;
  branch?: string;
}

export interface DispatchAddress {
  id: string;
  firmId: string;
  label: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface CreateFirmDto {
  name: string;
  gstNo?: string;
  panNo?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
}

export type UpdateFirmDto = Partial<CreateFirmDto>;

export interface TogglePdfOptionsDto {
  showLogo?: boolean;
  showSign?: boolean;
  showBank?: boolean;
  showTerms?: boolean;
  terms?: string;
}

export interface UpdateBankDetailsDto {
  bankName: string;
  accountNo: string;
  ifscCode: string;
  accountHolderName: string;
  branch?: string;
}

export interface CreateDispatchAddressDto {
  label: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export type UpdateDispatchAddressDto = Partial<CreateDispatchAddressDto>;

// ── Party ───────────────────────────────────
export type PartyType = "CUSTOMER" | "SUPPLIER" | "BOTH";

export interface ShipmentAddress {
  id: string;
  label: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Party {
  id: string;
  firmId: string;
  name: string;
  type: PartyType;
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
  balance?: number;
  shipmentAddresses?: ShipmentAddress[];
}

export interface PartyBalance {
  partyId: string;
  balance: number;
  totalCredit: number;
  totalDebit: number;
}

export interface PartyDropdownItem {
  id: string;
  name: string;
  gstNo?: string;
  state?: string;
  balance?: number;
}

export interface ListPartiesDto extends QueryFilters {
  type?: PartyType;
}

export interface CreatePartyDto {
  name: string;
  type: PartyType;
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

export type UpdatePartyDto = Partial<CreatePartyDto>;

// ── Product ─────────────────────────────────
export interface PartyRate {
  partyId: string;
  partyName: string;
  rate: number;
}

export interface Product {
  id: string;
  firmId: string;
  name: string;
  rate?: number;
  unit: string;
  gst?: number;
  cessRate?: number;
  taxable: boolean;
  itemCode?: string;
  hsnCode?: string;
  description?: string;
  partyRates?: PartyRate[];
}

export interface ProductDropdownItem {
  id: string;
  name: string;
  rate?: number;
  unit: string;
  gst?: number;
  hsnCode?: string;
  itemCode?: string;
}

export interface ListProductsDto extends QueryFilters {
  unit?: string;
}

export interface CreateProductDto {
  name: string;
  rate?: number;
  unit: string;
  gst?: number;
  cessRate?: number;
  taxable?: boolean;
  itemCode?: string;
  hsnCode?: string;
  description?: string;
}

export type UpdateProductDto = Partial<CreateProductDto>;

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
  gst?: number;
  cessRate?: number;
  taxableAmount?: number;
  taxAmount?: number;
  amount: number;
}

// ── Sales Bill ──────────────────────────────
export type BillStatus = "PAID" | "UNPAID" | "PARTIAL";
export type BillType   = "TAX_INVOICE" | "JOB_CHALLAN";

export interface BillPayment {
  id: string;
  date: string;
  amount: number;
  mode: PaymentMode;
  note?: string;
}

export interface SalesBill {
  id: string;
  firmId: string;
  billNo: string;
  billDate: string;
  billType: BillType;
  dueDate?: string;
  dueDays?: number;
  partyId: string;
  partyName: string;
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
  creditNoteIds?: string[];
  payments?: BillPayment[];
}

/** @deprecated Use SalesBill */
export type Bill = SalesBill;

export interface ListSalesBillsDto extends QueryFilters {
  status?: BillStatus;
  partyId?: string;
  billType?: BillType;
}

export interface CreateSalesBillLineItemDto {
  productId?: string;
  productName: string;
  itemCode?: string;
  hsnCode?: string;
  qty: number;
  unit: string;
  rate: number;
  discount?: number;
  gst?: number;
  cessRate?: number;
}

export interface CreateSalesBillDto {
  billDate: string;
  billType: BillType;
  dueDate?: string;
  dueDays?: number;
  partyId: string;
  applyGst: boolean;
  lineItems: CreateSalesBillLineItemDto[];
  remark?: string;
  challanNo?: string;
  challanDate?: string;
  dcIds?: string[];
}

export type UpdateSalesBillDto = Partial<CreateSalesBillDto>;

export interface RecordPaymentDto {
  date: string;
  amount: number;
  mode: PaymentMode;
  note?: string;
}

export interface CreateCreditNoteDto {
  date: string;
  amount: number;
  reason?: string;
}

// ── Purchase Bill ───────────────────────────
export type PurchaseBillType = "WITH_TAX" | "WITHOUT_TAX";

export interface PurchaseBill {
  id: string;
  firmId: string;
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
  payments?: BillPayment[];
}

export interface ListPurchaseBillsDto extends QueryFilters {
  status?: BillStatus;
  partyId?: string;
}

export interface CreatePurchaseBillLineItemDto {
  productId?: string;
  productName: string;
  qty: number;
  unit: string;
  rate: number;
  discount?: number;
  gst?: number;
}

export interface CreatePurchaseBillDto {
  billNo: string;
  billDate: string;
  billType: PurchaseBillType;
  dueDate?: string;
  dueDays?: number;
  partyId: string;
  applyGst: boolean;
  lineItems: CreatePurchaseBillLineItemDto[];
  remark?: string;
}

export type UpdatePurchaseBillDto = Partial<CreatePurchaseBillDto>;

// ── Delivery Challan ─────────────────────────
export interface DeliveryChallan {
  id: string;
  firmId: string;
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
  salesBillId?: string;
  salesBillNo?: string;
  remark?: string;
}

export interface ListDCDto extends QueryFilters {
  partyId?: string;
  billed?: boolean;
}

export interface CreateDCLineItemDto {
  productId?: string;
  productName: string;
  qty: number;
  unit: string;
  rate: number;
  discount?: number;
}

export interface CreateDCDto {
  dcDate: string;
  partyId: string;
  partyChallanNo?: string;
  partyChallanDate?: string;
  lineItems: CreateDCLineItemDto[];
  remark?: string;
}

export type UpdateDCDto = Partial<CreateDCDto>;

// ── Expense ─────────────────────────────────
export type ExpenseMode = "AMOUNT" | "ITEM";

export interface ExpenseCategory {
  id: string;
  firmId: string;
  name: string;
}

export interface ExpenseSupplier {
  id: string;
  firmId: string;
  name: string;
  contactNumber?: string;
}

export interface Expense {
  id: string;
  firmId: string;
  date: string;
  categoryId: string;
  category: string;
  supplierId?: string;
  supplierName?: string;
  amount: number;
  note?: string;
  attachmentUrl?: string;
  mode: ExpenseMode;
  expenseItem?: string;
  qty?: number;
  rate?: number;
}

export interface ListExpensesDto extends QueryFilters {
  categoryId?: string;
  supplierId?: string;
}

export interface CreateExpenseDto {
  date: string;
  categoryId: string;
  supplierId?: string;
  amount: number;
  note?: string;
  mode: ExpenseMode;
  expenseItem?: string;
  qty?: number;
  rate?: number;
}

export type UpdateExpenseDto = Partial<CreateExpenseDto>;

export interface CreateSupplierDto {
  name: string;
  contactNumber?: string;
}

// ── Transaction / Payment ───────────────────
export type TransactionType = "DEBIT" | "CREDIT";
export type PaymentMode     = "CASH" | "CHEQUE" | "ONLINE" | "OTHER";

export interface Transaction {
  id: string;
  firmId: string;
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

export interface ListTransactionsDto extends QueryFilters {
  partyId?: string;
  transactionType?: TransactionType;
  mode?: PaymentMode;
}

export interface CreateTransactionDto {
  date: string;
  refNumber: string;
  partyId?: string;
  amount: number;
  transactionType: TransactionType;
  transactionFor: string;
  mode: PaymentMode;
  note?: string;
}

export type UpdateTransactionDto = Partial<CreateTransactionDto>;

// ── E-Way Bill ───────────────────────────────
export interface EwayBill {
  id: string;
  firmId: string;
  ewbNo: string;
  ewbDate: string;
  salesBillId?: string;
  billNo?: string;
  partyId: string;
  partyName: string;
  vehicleNo?: string;
  distance?: number;
  transporterName?: string;
  transporterId?: string;
  totalValue: number;
  status: string;
}

export interface ListEwayBillsDto extends QueryFilters {
  partyId?: string;
  status?: string;
}

export interface CreateEwayBillDto {
  salesBillId?: string;
  partyId: string;
  vehicleNo?: string;
  distance?: number;
  transporterName?: string;
  transporterId?: string;
}

export type UpdateEwayBillDto = Partial<CreateEwayBillDto>;

// ── Dashboard ────────────────────────────────
export interface DashboardStats {
  totalSales: number;
  totalPurchase: number;
  totalExpense: number;
  netIncome: number;
  salesChange: number;
  purchaseChange: number;
  expenseChange: number;
  incomeChange: number;
  salesPartyData?: PartyBarData[];
  purchasePartyData?: PartyBarData[];
  monthlyTrend?: MonthlyTrend[];
}

export interface PartyBarData {
  label: string;
  total: number;
  received?: number;
  paid?: number;
  pending: number;
}

export interface MonthlyTrend {
  month: string;
  sales: number;
  purchase: number;
  expense: number;
}

export interface DashboardFiltersDto {
  fromDate?: string;
  toDate?: string;
  financialYear?: string;
}

export interface GlobalSearchResult {
  parties: Array<{ id: string; name: string; type: string }>;
  products: Array<{ id: string; name: string }>;
  salesBills: Array<{ id: string; billNo: string; partyName: string }>;
  purchaseBills: Array<{ id: string; billNo: string; partyName: string }>;
}

// ── Reports ──────────────────────────────────
export type ReportType =
  | "sales-summary"
  | "purchase-summary"
  | "party-ledger"
  | "gst-summary"
  | "profit-loss"
  | "expense-summary"
  | "stock-summary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReportRow = Record<string, any>;

export interface ReportData {
  type: ReportType;
  columns: string[];
  rows: ReportRow[];
  summary?: Record<string, number>;
}

export interface ReportFiltersDto extends QueryFilters {
  partyId?: string;
  reportType?: ReportType;
  financialYear?: string;
}

// ── Settings ──────────────────────────────────
export interface FirmSettings {
  firmId: string;
  defaultDueDays?: number;
  defaultBillType?: BillType;
  invoicePrefix?: string;
  challanPrefix?: string;
  termsAndConditions?: string;
  autoCalculateGst: boolean;
  showHsn: boolean;
  showItemCode: boolean;
  updatedAt: string;
}

export interface UpdateSettingsDto {
  defaultDueDays?: number;
  defaultBillType?: BillType;
  invoicePrefix?: string;
  challanPrefix?: string;
  termsAndConditions?: string;
  autoCalculateGst?: boolean;
  showHsn?: boolean;
  showItemCode?: boolean;
}

// ── Subscription ─────────────────────────────
export type PlanType = "trial" | "starter" | "professional" | "enterprise";

export interface Subscription {
  planName: string;
  planType: PlanType;
  expiresOn: string;
  remainingDays: number;
  firmLimit: number;
  firmsUsed: number;
  isActive: boolean;
}

// ── Attachment ───────────────────────────────
export interface Attachment {
  id: string;
  firmId: string;
  entityType: string;
  entityId: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

// ── PDF Job ───────────────────────────────────
export type PdfJobStatus = "pending" | "processing" | "done" | "failed";

export interface PdfJob {
  jobId: string;
  status: PdfJobStatus;
  url?: string;
}
