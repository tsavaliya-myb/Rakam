import type { QueryFilters } from "@/types";

export const QK = {
  // Account
  account: () => ["account", "me"] as const,

  // Firms
  firms:                 (accountId: string)                    => ["firms", accountId] as const,
  firm:                  (id: string)                           => ["firms", id] as const,
  firmBankDetails:       (firmId: string)                       => ["firms", firmId, "bank-details"] as const,
  firmDispatchAddresses: (firmId: string)                       => ["firms", firmId, "dispatch-addresses"] as const,

  // Parties
  parties:         (firmId: string, filters?: QueryFilters)     => ["parties", firmId, filters] as const,
  party:           (id: string)                                 => ["parties", id] as const,
  partiesDropdown: (firmId: string)                             => ["parties", firmId, "dropdown"] as const,
  partyBalance:    (partyId: string)                            => ["parties", partyId, "balance"] as const,

  // Products
  products:         (firmId: string, filters?: QueryFilters)    => ["products", firmId, filters] as const,
  product:          (id: string)                                => ["products", id] as const,
  productsDropdown: (firmId: string)                            => ["products", firmId, "dropdown"] as const,

  // Sales Bills
  salesBills:   (firmId: string, filters?: QueryFilters)        => ["sales-bills", firmId, filters] as const,
  salesBill:    (id: string)                                    => ["sales-bills", id] as const,
  nextBillNo:   (firmId: string)                                => ["sales-bills", firmId, "next-bill-no"] as const,
  unbilledDCs:  (firmId: string)                                => ["sales-bills", firmId, "unbilled-dc"] as const,

  // Purchase Bills
  purchaseBills: (firmId: string, filters?: QueryFilters)       => ["purchase-bills", firmId, filters] as const,
  purchaseBill:  (id: string)                                   => ["purchase-bills", id] as const,

  // Delivery Challans
  deliveryChallans: (firmId: string, filters?: QueryFilters)    => ["delivery-challans", firmId, filters] as const,
  deliveryChallan:  (id: string)                                => ["delivery-challans", id] as const,

  // Expenses
  expenses:          (firmId: string, filters?: QueryFilters)   => ["expenses", firmId, filters] as const,
  expense:           (id: string)                               => ["expenses", id] as const,
  expenseCategories: (firmId: string)                           => ["expenses", firmId, "categories"] as const,
  expenseSuppliers:  (firmId: string)                           => ["expenses", firmId, "suppliers"] as const,

  // Transactions
  transactions: (firmId: string, filters?: QueryFilters)        => ["transactions", firmId, filters] as const,
  transaction:  (id: string)                                    => ["transactions", id] as const,

  // Dashboard
  dashboard: (firmId: string, filters?: QueryFilters)           => ["dashboard", firmId, filters] as const,

  // Reports
  reports: (firmId: string, type: string, filters?: QueryFilters) => ["reports", firmId, type, filters] as const,

  // Settings
  settings: (firmId: string)                                    => ["settings", firmId] as const,

  // E-Way Bills
  ewayBills: (firmId: string, filters?: QueryFilters)           => ["eway-bills", firmId, filters] as const,
  ewayBill:  (id: string)                                       => ["eway-bills", id] as const,

  // Subscription
  subscription: ()                                              => ["subscription"] as const,

  // PDF Jobs
  pdfJob: (jobId: string)                                       => ["pdf", "jobs", jobId] as const,
} as const;
