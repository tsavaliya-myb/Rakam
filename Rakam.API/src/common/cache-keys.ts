/**
 * Centralised Redis cache-key builders.
 * Every key follows the pattern documented in rakam-cache-keys.md.
 * Import the relevant namespace in each module — never construct key strings inline.
 *
 * TTL constants (seconds) are co-located so callers never hard-code them.
 */

export const CacheTTL = {
  // Mutable transactional data — short or no cache
  DASHBOARD: 60,
  BILL_DETAIL: 60 * 60,          // 1 hr
  BILL_TOTALS: 60 * 5,           // 5 min
  BILL_NEXT_NO: 60 * 60,         // 1 hr
  DC_UNBILLED: 60 * 5,           // 5 min
  TRANSACTION_DETAIL: 60 * 60,   // 1 hr
  TRANSACTION_SUMMARY: 60 * 5,   // 5 min
  PARTY_OUTSTANDING: 60 * 5,     // 5 min
  PARTY_SEARCH: 60 * 5,          // 5 min
  PRODUCT_SEARCH: 60 * 5,        // 5 min
  PRODUCT_STOCK: 60,             // 60 s
  EXPENSE_DETAIL: 60 * 60,       // 1 hr
  EXPENSE_TOTALS: 60 * 5,        // 5 min
  REPORTS: 60 * 10,              // 10 min
  SUBSCRIPTION: 60 * 5,          // 5 min
  EWAY_GSP_TOKEN: 60 * 60 * 6,   // 6 hr (GSP token lifetime)

  // Stable masters — long TTL + explicit invalidation on write
  LONG: 60 * 60 * 24 * 7,        // 7 days
} as const;

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const DashboardKeys = {
  kpi:            (firmId: bigint, fy: number) => `dashboard:kpi:${firmId}:${fy}`,
  salesChart:     (firmId: bigint, fy: number) => `dashboard:sales-chart:${firmId}:${fy}`,
  purchaseChart:  (firmId: bigint, fy: number) => `dashboard:purchase-chart:${firmId}:${fy}`,
  salesDonut:     (firmId: bigint, fy: number) => `dashboard:sales-donut:${firmId}:${fy}`,
  purchaseDonut:  (firmId: bigint, fy: number) => `dashboard:purchase-donut:${firmId}:${fy}`,
  /** Pattern to wipe all dashboard keys for a firm/FY */
  pattern:        (firmId: bigint, fy: number) => `dashboard:*:${firmId}:${fy}`,
};

// ─── Sales Bill ──────────────────────────────────────────────────────────────

export const SalesBillKeys = {
  detail:   (billId: bigint)                        => `sales-bill:${billId}`,
  nextNo:   (firmId: bigint, fy: number)            => `sales-bill:next-no:${firmId}:${fy}`,
  totals:   (firmId: bigint, fy: number)            => `sales-bill:totals:${firmId}:${fy}`,
  pdf:      (billId: bigint, tplVersion = '*')      => `sales-bill:pdf:${billId}:${tplVersion}`,
  /** Pattern to wipe all PDF variants for a bill */
  pdfPattern: (billId: bigint)                      => `sales-bill:pdf:${billId}:*`,
};

// ─── Purchase Bill ───────────────────────────────────────────────────────────

export const PurchaseBillKeys = {
  detail:     (billId: bigint)               => `purchase-bill:${billId}`,
  totals:     (firmId: bigint, fy: number)   => `purchase-bill:totals:${firmId}:${fy}`,
  pdf:        (billId: bigint, tplVersion = '*') => `purchase-bill:pdf:${billId}:${tplVersion}`,
  pdfPattern: (billId: bigint)               => `purchase-bill:pdf:${billId}:*`,
};

// ─── Delivery Challan ────────────────────────────────────────────────────────

export const DeliveryChallanKeys = {
  detail:     (dcId: bigint)                 => `delivery-challan:${dcId}`,
  nextNo:     (firmId: bigint, fy: number)   => `delivery-challan:next-no:${firmId}:${fy}`,
  unbilled:   (firmId: bigint)               => `delivery-challan:unbilled:${firmId}`,
  pdf:        (dcId: bigint, tplVersion = '*') => `delivery-challan:pdf:${dcId}:${tplVersion}`,
  pdfPattern: (dcId: bigint)                 => `delivery-challan:pdf:${dcId}:*`,
};

// ─── E-Way Bill ──────────────────────────────────────────────────────────────

export const EwayBillKeys = {
  detail:      (ewbId: bigint)    => `eway-bill:${ewbId}`,
  gspAuthToken:(firmId: bigint)   => `eway-bill:gsp-auth-token:${firmId}`,
};

// ─── Party ───────────────────────────────────────────────────────────────────

export const PartyKeys = {
  list:        (firmId: bigint)                           => `party:list:${firmId}`,
  dropdown:    (firmId: bigint)                           => `party:dropdown:${firmId}`,
  detail:      (partyId: bigint)                          => `party:${partyId}`,
  outstanding: (firmId: bigint, partyId: bigint)          => `party:outstanding:${firmId}:${partyId}`,
  search:      (firmId: bigint, queryHash: string)        => `party:search:${firmId}:${queryHash}`,
};

// ─── Product ─────────────────────────────────────────────────────────────────

export const ProductKeys = {
  list:        (firmId: bigint)                           => `product:list:${firmId}`,
  dropdown:    (firmId: bigint)                           => `product:dropdown:${firmId}`,
  detail:      (productId: bigint)                        => `product:${productId}`,
  search:      (firmId: bigint, queryHash: string)        => `product:search:${firmId}:${queryHash}`,
  partyRate:   (firmId: bigint, partyId: bigint)          => `product:party-rate:${firmId}:${partyId}`,
  stock:       (firmId: bigint, productId: bigint)        => `product:stock:${firmId}:${productId}`,
};

// ─── Firm ────────────────────────────────────────────────────────────────────

export const FirmKeys = {
  list:             (accountId: bigint)  => `firm:list:${accountId}`,
  detail:           (firmId: bigint)     => `firm:${firmId}`,
  active:           (userId: bigint)     => `firm:active:${userId}`,
  dispatchAddresses:(firmId: bigint)     => `firm:dispatch-addresses:${firmId}`,
  bankDetails:      (firmId: bigint)     => `firm:bank-details:${firmId}`,
  assets:           (firmId: bigint)     => `firm:assets:${firmId}`,
};

// ─── Expense ─────────────────────────────────────────────────────────────────

export const ExpenseKeys = {
  detail:     (expenseId: bigint)                => `expense:${expenseId}`,
  totals:     (firmId: bigint, fy: number)       => `expense:totals:${firmId}:${fy}`,
  categories: (firmId: bigint)                   => `expense:categories:${firmId}`,
  suppliers:  (firmId: bigint)                   => `expense:suppliers:${firmId}`,
  items:      (firmId: bigint)                   => `expense:items:${firmId}`,
};

// ─── Income ──────────────────────────────────────────────────────────────────

export const IncomeKeys = {
  categories: (firmId: bigint) => `income:categories:${firmId}`,
  suppliers:  (firmId: bigint) => `income:suppliers:${firmId}`,
};

// ─── Transactions ────────────────────────────────────────────────────────────

export const TransactionKeys = {
  detail:   (txnId: bigint)                  => `transaction:${txnId}`,
  summary:  (firmId: bigint, fy: number)     => `transactions:summary:${firmId}:${fy}`,
  byBill:   (billId: bigint)                 => `transactions:by-bill:${billId}`,
};

// ─── Reports ─────────────────────────────────────────────────────────────────

export const ReportKeys = {
  payment:              (firmId: bigint, fy: number, hash: string) => `reports:payment:${firmId}:${fy}:${hash}`,
  transaction:          (firmId: bigint, fy: number, hash: string) => `reports:transaction:${firmId}:${fy}:${hash}`,
  product:              (firmId: bigint, fy: number, hash: string) => `reports:product:${firmId}:${fy}:${hash}`,
  expense:              (firmId: bigint, fy: number, hash: string) => `reports:expense:${firmId}:${fy}:${hash}`,
  income:               (firmId: bigint, fy: number, hash: string) => `reports:income:${firmId}:${fy}:${hash}`,
  salesGst:             (firmId: bigint, fy: number, hash: string) => `reports:sales-gst:${firmId}:${fy}:${hash}`,
  salesWoGst:           (firmId: bigint, fy: number, hash: string) => `reports:sales-wogst:${firmId}:${fy}:${hash}`,
  purchaseGst:          (firmId: bigint, fy: number, hash: string) => `reports:purchase-gst:${firmId}:${fy}:${hash}`,
  purchaseWoGst:        (firmId: bigint, fy: number, hash: string) => `reports:purchase-wogst:${firmId}:${fy}:${hash}`,
  tdsPayable:           (firmId: bigint, fy: number)               => `reports:tds-payable:${firmId}:${fy}`,
  tdsReceivable:        (firmId: bigint, fy: number)               => `reports:tds-receivable:${firmId}:${fy}`,
  tcsPayable:           (firmId: bigint, fy: number)               => `reports:tcs-payable:${firmId}:${fy}`,
  tcsReceivable:        (firmId: bigint, fy: number)               => `reports:tcs-receivable:${firmId}:${fy}`,
  salesBillItemsGst:    (firmId: bigint, fy: number)               => `reports:sales-bill-items-gst:${firmId}:${fy}`,
  salesBillItemsWoGst:  (firmId: bigint, fy: number)               => `reports:sales-bill-items-wogst:${firmId}:${fy}`,
  purchaseBillItemsGst: (firmId: bigint, fy: number)               => `reports:purchase-bill-items-gst:${firmId}:${fy}`,
  purchaseBillItemsWoGst:(firmId: bigint, fy: number)              => `reports:purchase-bill-items-wogst:${firmId}:${fy}`,
  salesOutstanding:     (firmId: bigint)                           => `reports:sales-outstanding:${firmId}`,
  purchaseOutstanding:  (firmId: bigint)                           => `reports:purchase-outstanding:${firmId}`,
  deliveryChallan:      (firmId: bigint, fy: number)               => `reports:delivery-challan:${firmId}:${fy}`,
  creditNote:           (firmId: bigint, fy: number)               => `reports:credit-note:${firmId}:${fy}`,
  profitLoss:           (firmId: bigint, fy: number)               => `reports:profit-loss:${firmId}:${fy}`,
  /** Pattern to wipe all sales report keys for a firm/FY */
  salesPattern:         (firmId: bigint, fy: number)               => `reports:sales-*:${firmId}:${fy}:*`,
  purchasePattern:      (firmId: bigint, fy: number)               => `reports:purchase-*:${firmId}:${fy}:*`,
  profitLossPattern:    (firmId: bigint, fy: number)               => `reports:profit-loss:${firmId}:${fy}*`,
};

// ─── Settings ────────────────────────────────────────────────────────────────

export const SettingsKeys = {
  profile:          (userId: bigint)    => `settings:profile:${userId}`,
  salesBill:        (firmId: bigint)    => `settings:sales-bill:${firmId}`,
  purchaseBill:     (firmId: bigint)    => `settings:purchase-bill:${firmId}`,
  deliveryChallan:  (firmId: bigint)    => `settings:delivery-challan:${firmId}`,
  expense:          (firmId: bigint)    => `settings:expense:${firmId}`,
  income:           (firmId: bigint)    => `settings:income:${firmId}`,
  pdfTemplate:      (firmId: bigint)    => `settings:pdf-template:${firmId}`,
  inventory:        (firmId: bigint)    => `settings:inventory:${firmId}`,
  other:            (firmId: bigint)    => `settings:other:${firmId}`,
  ewayGsp:          (firmId: bigint)    => `settings:eway-gsp:${firmId}`,
  subscription:     (accountId: bigint) => `settings:subscription:${accountId}`,
};

// ─── Auth / Session ──────────────────────────────────────────────────────────

export const AuthKeys = {
  session:       (tokenHash: string)              => `session:${tokenHash}`,
  otp:           (mobile: string)                 => `otp:${mobile}`,
  rateLimitLogin:(mobile: string)                 => `rate-limit:login:${mobile}`,
  rateLimitApi:  (accountId: bigint)              => `rate-limit:api:${accountId}`,
  refreshToken:  (userId: bigint, jti: string)    => `refresh-token:${userId}:${jti}`,
};

// ─── Constants (permanent / app-restart TTL) ─────────────────────────────────

export const ConstantKeys = {
  units:        () => 'constants:units',
  gstPct:       () => 'constants:gst-percentages',
  paymentModes: () => 'constants:payment-modes',
  states:       () => 'constants:states',
  cities:       (stateCode: string) => `constants:cities:${stateCode}`,
};
