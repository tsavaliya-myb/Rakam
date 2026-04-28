# API Integration Implementation Plan — Rakam.Web

## Current State Assessment

| What exists | What's missing |
|---|---|
| `lib/api.ts` — base client + auth + subscription only | Service layer for 16 remaining modules |
| `QueryProvider.tsx` — React Query configured | Custom query/mutation hooks per module |
| `useAuthStore`, `useAppStore`, `useSubscriptionStore` | Real firm loading (store has hardcoded `firm-1`) |
| Type definitions in `types/index.ts` | Response types aligned to actual API DTOs |
| Components exist for all modules | Components wired to live data |

---

## Architecture: 4-Layer Pattern

```
components / pages
      ↓
hooks/api/*   (React Query hooks — useSalesBills, useCreateParty, etc.)
      ↓
services/*    (typed API functions — one file per module)
      ↓
lib/api.ts    (HTTP client — token, refresh, error normalization)
```

---

## Phase 1 — Foundation

### 1.1 Extend `lib/api.ts`

Add missing capabilities to the existing client:

- `ApiError` class with `status`, `code`, `message`, `errors[]` fields matching the NestJS `AllExceptionsFilter` response shape
- `createApiRequest()` factory that accepts `firmId` from `useAppStore` and injects `x-firm-id` header (required by `TenantGuard`)
- Typed `PaginatedResponse<T>` wrapper `{ data, total, page, limit }`
- File upload helper for attachments (multipart/form-data)

### 1.2 Standardize `types/index.ts`

Audit and reconcile frontend types against backend DTOs. Key gaps to fix:

- `SalesBill` — add `firmId`, `billType`, `creditNoteIds`, `payments[]`
- `Party` — add `balance`, `type` (CUSTOMER | SUPPLIER), `shipmentAddresses[]`
- `Product` — add `partyRates[]`, `taxable`, `cessRate`
- Add `ApiPaginatedResponse<T>`, `ApiError`, `QueryFilters` base types
- Add separate `CreateSalesBillDto`, `UpdateSalesBillDto` (form state ≠ API response)

### 1.3 Query Key Registry — `lib/query-keys.ts` (new file)

Central registry prevents cache invalidation bugs:

```typescript
export const QK = {
  firms:         (accountId: string)           => ['firms', accountId],
  firm:          (id: string)                  => ['firms', id],
  parties:       (firmId: string, filters?)    => ['parties', firmId, filters],
  party:         (id: string)                  => ['parties', id],
  products:      (firmId: string, filters?)    => ['products', firmId, filters],
  product:       (id: string)                  => ['products', id],
  salesBills:    (firmId: string, filters?)    => ['sales-bills', firmId, filters],
  salesBill:     (id: string)                  => ['sales-bills', id],
  nextBillNo:    (firmId: string)              => ['sales-bills', firmId, 'next-bill-no'],
  unbilledDCs:   (firmId: string)              => ['sales-bills', firmId, 'unbilled-dc'],
  purchaseBills: (firmId: string, filters?)    => ['purchase-bills', firmId, filters],
  purchaseBill:  (id: string)                  => ['purchase-bills', id],
  deliveryChallans: (firmId: string, filters?) => ['delivery-challans', firmId, filters],
  deliveryChallan:  (id: string)               => ['delivery-challans', id],
  expenses:      (firmId: string, filters?)    => ['expenses', firmId, filters],
  expense:       (id: string)                  => ['expenses', id],
  expenseCategories: (firmId: string)          => ['expenses', firmId, 'categories'],
  expenseSuppliers:  (firmId: string)          => ['expenses', firmId, 'suppliers'],
  transactions:  (firmId: string, filters?)    => ['transactions', firmId, filters],
  transaction:   (id: string)                  => ['transactions', id],
  dashboard:     (firmId: string, filters?)    => ['dashboard', firmId, filters],
  reports:       (firmId: string, type: string, filters?) => ['reports', firmId, type, filters],
  settings:      (firmId: string)              => ['settings', firmId],
  ewayBills:     (firmId: string, filters?)    => ['eway-bills', firmId, filters],
  ewayBill:      (id: string)                  => ['eway-bills', id],
  subscription:  ()                            => ['subscription'],
  account:       ()                            => ['account', 'me'],
  pdfJob:        (jobId: string)               => ['pdf', 'jobs', jobId],
  firmBankDetails:       (firmId: string)      => ['firms', firmId, 'bank-details'],
  firmDispatchAddresses: (firmId: string)      => ['firms', firmId, 'dispatch-addresses'],
  partyBalance:          (partyId: string)     => ['parties', partyId, 'balance'],
  partiesDropdown:       (firmId: string)      => ['parties', firmId, 'dropdown'],
  productsDropdown:      (firmId: string)      => ['products', firmId, 'dropdown'],
}
```

---

## Phase 2 — Service Layer (`src/services/`)

One file per backend module. Each exports plain async functions only (no React). Keeps them testable and usable outside React Query.

### `services/auth.ts` (move from `lib/api.ts`)

```typescript
sendOtp(mobile: string): Promise<{ reqId: string }>
retryOtp(reqId: string, type: 'voice' | 'text'): Promise<void>
verifyOtp(reqId: string, otp: string): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }>
refresh(refreshToken: string): Promise<{ accessToken: string }>
logout(refreshToken: string): Promise<void>
```

### `services/accounts.ts`

```typescript
getMe(): Promise<Account>
```

### `services/firms.ts`

```typescript
getFirms(): Promise<Firm[]>
getFirm(id: string): Promise<Firm>
createFirm(dto: CreateFirmDto): Promise<Firm>
updateFirm(id: string, dto: UpdateFirmDto): Promise<Firm>
deleteFirm(id: string): Promise<void>
setDefaultFirm(id: string): Promise<void>
togglePdfOptions(id: string, dto: TogglePdfOptionsDto): Promise<void>
getBankDetails(firmId: string): Promise<FirmBankDetails>
updateBankDetails(firmId: string, dto: UpdateBankDetailsDto): Promise<FirmBankDetails>
getDispatchAddresses(firmId: string): Promise<DispatchAddress[]>
createDispatchAddress(firmId: string, dto: CreateDispatchAddressDto): Promise<DispatchAddress>
updateDispatchAddress(firmId: string, addressId: string, dto: UpdateDispatchAddressDto): Promise<DispatchAddress>
deleteDispatchAddress(firmId: string, addressId: string): Promise<void>
```

### `services/parties.ts`

```typescript
getParties(firmId: string, filters?: ListPartiesDto): Promise<PaginatedResponse<Party>>
getPartiesDropdown(firmId: string): Promise<PartyDropdownItem[]>
getParty(id: string): Promise<Party>
createParty(firmId: string, dto: CreatePartyDto): Promise<Party>
updateParty(id: string, dto: UpdatePartyDto): Promise<Party>
deleteParty(id: string): Promise<void>
getPartyBalance(partyId: string): Promise<PartyBalance>
```

### `services/products.ts`

```typescript
getProducts(firmId: string, filters?: ListProductsDto): Promise<PaginatedResponse<Product>>
getProductsDropdown(firmId: string): Promise<ProductDropdownItem[]>
getProduct(id: string): Promise<Product>
createProduct(firmId: string, dto: CreateProductDto): Promise<Product>
updateProduct(id: string, dto: UpdateProductDto): Promise<Product>
deleteProduct(id: string): Promise<void>
```

### `services/sales-bills.ts`

```typescript
getSalesBills(firmId: string, filters?: ListSalesBillsDto): Promise<PaginatedResponse<SalesBill>>
getSalesBill(id: string): Promise<SalesBill>
getNextBillNo(firmId: string): Promise<{ billNo: string }>
getUnbilledChallans(firmId: string): Promise<DeliveryChallan[]>
createSalesBill(firmId: string, dto: CreateSalesBillDto): Promise<SalesBill>
updateSalesBill(id: string, dto: UpdateSalesBillDto): Promise<SalesBill>
deleteSalesBill(id: string): Promise<void>
duplicateBill(id: string): Promise<SalesBill>
recordPayment(id: string, dto: RecordPaymentDto): Promise<void>
createCreditNote(id: string, dto: CreateCreditNoteDto): Promise<void>
generatePdf(id: string): Promise<{ jobId: string }>
```

### `services/purchase-bills.ts`

```typescript
getPurchaseBills(firmId: string, filters?: ListPurchaseBillsDto): Promise<PaginatedResponse<PurchaseBill>>
getPurchaseBill(id: string): Promise<PurchaseBill>
createPurchaseBill(firmId: string, dto: CreatePurchaseBillDto): Promise<PurchaseBill>
updatePurchaseBill(id: string, dto: UpdatePurchaseBillDto): Promise<PurchaseBill>
deletePurchaseBill(id: string): Promise<void>
recordPayment(id: string, dto: RecordPaymentDto): Promise<void>
```

### `services/delivery-challans.ts`

```typescript
getDeliveryChallans(firmId: string, filters?: ListDCDto): Promise<PaginatedResponse<DeliveryChallan>>
getDeliveryChallan(id: string): Promise<DeliveryChallan>
createDeliveryChallan(firmId: string, dto: CreateDCDto): Promise<DeliveryChallan>
updateDeliveryChallan(id: string, dto: UpdateDCDto): Promise<DeliveryChallan>
deleteDeliveryChallan(id: string): Promise<void>
convertToInvoice(id: string): Promise<SalesBill>
```

### `services/expenses.ts`

```typescript
getExpenses(firmId: string, filters?: ListExpensesDto): Promise<PaginatedResponse<Expense>>
getExpense(id: string): Promise<Expense>
createExpense(firmId: string, dto: CreateExpenseDto): Promise<Expense>
updateExpense(id: string, dto: UpdateExpenseDto): Promise<Expense>
deleteExpense(id: string): Promise<void>
getCategories(firmId: string): Promise<ExpenseCategory[]>
createCategory(firmId: string, name: string): Promise<ExpenseCategory>
getSuppliers(firmId: string): Promise<ExpenseSupplier[]>
createSupplier(firmId: string, dto: CreateSupplierDto): Promise<ExpenseSupplier>
```

### `services/transactions.ts`

```typescript
getTransactions(firmId: string, filters?: ListTransactionsDto): Promise<PaginatedResponse<Transaction>>
getTransaction(id: string): Promise<Transaction>
createTransaction(firmId: string, dto: CreateTransactionDto): Promise<Transaction>
updateTransaction(id: string, dto: UpdateTransactionDto): Promise<Transaction>
deleteTransaction(id: string): Promise<void>
```

### `services/dashboard.ts`

```typescript
getDashboardStats(firmId: string, filters?: DashboardFiltersDto): Promise<DashboardStats>
globalSearch(firmId: string, query: string): Promise<GlobalSearchResult>
```

### `services/reports.ts`

```typescript
getReport(firmId: string, type: ReportType, filters?: ReportFiltersDto): Promise<ReportData>
exportReport(firmId: string, type: ReportType, format: 'pdf' | 'excel', filters?: ReportFiltersDto): Promise<Blob>
```

### `services/settings.ts`

```typescript
getSettings(firmId: string): Promise<FirmSettings>
updateSettings(firmId: string, section: string, dto: UpdateSettingsDto): Promise<FirmSettings>
```

### `services/eway-bills.ts`

```typescript
getEwayBills(firmId: string, filters?: ListEwayBillsDto): Promise<PaginatedResponse<EwayBill>>
getEwayBill(id: string): Promise<EwayBill>
createEwayBill(firmId: string, dto: CreateEwayBillDto): Promise<EwayBill>
updateEwayBill(id: string, dto: UpdateEwayBillDto): Promise<EwayBill>
```

### `services/subscriptions.ts` (move from `lib/api.ts`)

```typescript
getMySubscription(): Promise<Subscription>
```

### `services/attachments.ts`

```typescript
uploadFile(firmId: string, file: File, entityType: string, entityId: string): Promise<Attachment>
deleteFile(id: string): Promise<void>
```

### `services/pdf.ts`

```typescript
getPdfJobStatus(jobId: string): Promise<{ status: 'pending' | 'processing' | 'done' | 'failed'; url?: string }>
```

---

## Phase 3 — React Query Hooks (`src/hooks/api/`)

### Standard hook patterns

**Query hook pattern:**

```typescript
export function useParties(filters?: ListPartiesDto) {
  const firmId = useAppStore(s => s.activeFirmId)
  return useQuery({
    queryKey: QK.parties(firmId!, filters),
    queryFn: () => partiesService.getParties(firmId!, filters),
    enabled: !!firmId,
  })
}
```

**Mutation hook pattern:**

```typescript
export function useCreateParty() {
  const qc = useQueryClient()
  const firmId = useAppStore(s => s.activeFirmId)
  return useMutation({
    mutationFn: (dto: CreatePartyDto) => partiesService.createParty(firmId!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.parties(firmId!) })
      qc.invalidateQueries({ queryKey: QK.partiesDropdown(firmId!) })
      toast.success('Party created successfully')
    },
    onError: (err: ApiError) => toast.error(err.message),
  })
}
```

**Optimistic delete pattern:**

```typescript
export function useDeleteParty() {
  const qc = useQueryClient()
  const firmId = useAppStore(s => s.activeFirmId)
  return useMutation({
    mutationFn: partiesService.deleteParty,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.parties(firmId!) })
      const prev = qc.getQueryData(QK.parties(firmId!))
      qc.setQueryData(QK.parties(firmId!), (old: any) => ({
        ...old,
        data: old.data.filter((p: Party) => p.id !== id),
      }))
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      qc.setQueryData(QK.parties(firmId!), ctx?.prev)
      toast.error('Failed to delete party')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QK.parties(firmId!) }),
  })
}
```

**PDF polling hook pattern:**

```typescript
export function usePdfJob(jobId: string | null) {
  return useQuery({
    queryKey: QK.pdfJob(jobId!),
    queryFn: () => pdfService.getPdfJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (data) =>
      data?.status === 'done' || data?.status === 'failed' ? false : 2000,
  })
}
```

### Hook files to create

| File | Hooks exported |
|---|---|
| `hooks/api/use-firms.ts` | `useFirms`, `useFirm`, `useCreateFirm`, `useUpdateFirm`, `useDeleteFirm`, `useSetDefaultFirm`, `useFirmBankDetails`, `useUpdateBankDetails`, `useDispatchAddresses`, `useCreateDispatchAddress`, `useUpdateDispatchAddress`, `useDeleteDispatchAddress` |
| `hooks/api/use-parties.ts` | `useParties`, `usePartiesDropdown`, `useParty`, `usePartyBalance`, `useCreateParty`, `useUpdateParty`, `useDeleteParty` |
| `hooks/api/use-products.ts` | `useProducts`, `useProductsDropdown`, `useProduct`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct` |
| `hooks/api/use-sales-bills.ts` | `useSalesBills`, `useSalesBill`, `useNextBillNo`, `useUnbilledChallans`, `useCreateSalesBill`, `useUpdateSalesBill`, `useDeleteSalesBill`, `useDuplicateBill`, `useRecordPayment`, `useCreateCreditNote`, `useGeneratePdf` |
| `hooks/api/use-purchase-bills.ts` | `usePurchaseBills`, `usePurchaseBill`, `useCreatePurchaseBill`, `useUpdatePurchaseBill`, `useDeletePurchaseBill`, `useRecordPurchasePayment` |
| `hooks/api/use-delivery-challans.ts` | `useDeliveryChallans`, `useDeliveryChallan`, `useCreateDC`, `useUpdateDC`, `useDeleteDC`, `useConvertToInvoice` |
| `hooks/api/use-expenses.ts` | `useExpenses`, `useExpense`, `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense`, `useExpenseCategories`, `useCreateCategory`, `useExpenseSuppliers`, `useCreateSupplier` |
| `hooks/api/use-transactions.ts` | `useTransactions`, `useTransaction`, `useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction` |
| `hooks/api/use-dashboard.ts` | `useDashboardStats`, `useGlobalSearch` |
| `hooks/api/use-reports.ts` | `useReport`, `useExportReport` |
| `hooks/api/use-settings.ts` | `useSettings`, `useUpdateSettings` |
| `hooks/api/use-eway-bills.ts` | `useEwayBills`, `useEwayBill`, `useCreateEwayBill`, `useUpdateEwayBill` |
| `hooks/api/use-subscriptions.ts` | `useMySubscription` |
| `hooks/api/use-attachments.ts` | `useUploadFile`, `useDeleteFile` |
| `hooks/api/use-pdf-job.ts` | `usePdfJob` |
| `hooks/api/index.ts` | re-exports all |

### Special query behaviors

| Hook | Behavior |
|---|---|
| `usePartiesDropdown`, `useProductsDropdown` | `staleTime: Infinity` — dropdown data rarely changes |
| `useNextBillNo` | `staleTime: 0` — must always be fresh |
| `usePdfJob` | `refetchInterval: 2000` until status is `done` or `failed` |
| `useDashboardStats` | `staleTime: 60_000` — acceptable 1-minute stale |
| `useSettings` | `staleTime: 300_000` — settings change rarely |
| All list queries | `keepPreviousData: true` — no flicker on filter/page change |

---

## Phase 4 — Store Updates

### `store/useAuthStore.ts`

Changes required:
- Add `accountId: string | null` field
- After `verifyOtp` success, call `GET /accounts/me` and store `accountId`
- `accountId` is required by `useFirms(accountId)` to scope firm list to the account

```typescript
// Updated auth flow
async function loginWithOtp(reqId: string, otp: string) {
  const { accessToken, refreshToken, user } = await authService.verifyOtp(reqId, otp)
  setAuth(accessToken, refreshToken, user)
  const account = await accountsService.getMe()
  set({ accountId: account.id })
}
```

### `store/useAppStore.ts`

Changes required:
- Remove hardcoded `activeFirmId: "firm-1"` and `activeFirmName: "Shreeji Traders"`
- Initialize `activeFirmId: null`, `activeFirmName: null`
- On first load after login, `useFirms` resolves the default firm and calls `setActiveFirm`

```typescript
// In app/(app)/layout.tsx — firm bootstrapping
const { data: firms } = useFirms()
const setActiveFirm = useAppStore(s => s.setActiveFirm)
const activeFirmId = useAppStore(s => s.activeFirmId)

useEffect(() => {
  if (firms && !activeFirmId) {
    const defaultFirm = firms.find(f => f.isDefault) ?? firms[0]
    if (defaultFirm) setActiveFirm(defaultFirm.id, defaultFirm.name)
  }
}, [firms, activeFirmId])
```

### `store/useSubscriptionStore.ts`

Wire to `useMySubscription` hook — drive firm limit checks and feature gates:

```typescript
const { data: subscription } = useMySubscription()
// Gates: subscription.firmLimit, subscription.planType
```

---

## Phase 5 — Component Integration Order

Recommended integration order (highest user impact first):

### Priority 1 — Dashboard

- Replace hardcoded stats with `useDashboardStats(filters)`
- Wire `useGlobalSearch` to the search input in `Header.tsx`
- Charts use real `partyBarData`, `monthlyTrend` from API response

### Priority 2 — Sales Bills

- `BillListTable` → `useSalesBills(filters)`
- `BillForm` → `useNextBillNo`, `usePartiesDropdown`, `useProductsDropdown`, `useUnbilledChallans`
- `BillForm` submit → `useCreateSalesBill` / `useUpdateSalesBill`
- `RecordPaymentModal` → `useRecordPayment`
- PDF button → `useGeneratePdf` + `usePdfJob` polling → open URL when done

### Priority 3 — Parties

- `PartyListTable` → `useParties(filters)`
- `PartyForm` submit → `useCreateParty` / `useUpdateParty`
- Delete action → `useDeleteParty` (optimistic)

### Priority 4 — Products

- `ProductListTable` → `useProducts(filters)`
- `ProductForm` submit → `useCreateProduct` / `useUpdateProduct`
- Delete → `useDeleteProduct` (optimistic)

### Priority 5 — Manage Firm

- Firm list page → `useFirms`
- Firm edit form → `useUpdateFirm`
- Bank details form → `useFirmBankDetails` + `useUpdateBankDetails`
- Dispatch addresses → `useDispatchAddresses` + CRUD hooks
- Default firm toggle → `useSetDefaultFirm`

### Priority 6 — Purchase Bills

- Same pattern as Sales Bills (list, form, payment)

### Priority 7 — Delivery Challans

- List + form + `useConvertToInvoice` action

### Priority 8 — Expenses

- List + form + categories + suppliers dropdown

### Priority 9 — Transactions

- List + form

### Priority 10 — Reports

- `useReport(type, filters)` driven by report type selector
- Export button → `useExportReport` → download Blob

### Priority 11 — Settings

- `useSettings` to populate form
- `useUpdateSettings` on save per section

### Priority 12 — E-Way Bills

- List + form (currently commented out in nav — enable when ready)

### Loading & empty states (apply to every module)

```typescript
// Loading
if (isLoading) return <TableSkeleton rows={10} />

// Error
if (isError) return <ErrorState message={error.message} onRetry={refetch} />

// Empty
if (data?.data.length === 0) return <EmptyState entity="parties" onAdd={() => setOpen(true)} />

// Data
return <PartyListTable data={data.data} total={data.total} />
```

---

## Phase 6 — Error Handling Infrastructure

### `lib/api-error.ts`

```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}
```

### Error classification by HTTP status

| Status | Handling |
|---|---|
| 400 | Pass `errors` to `react-hook-form` via `setError` |
| 401 | Auto-refresh token → if fails, redirect to `/login` (already in `api.ts`) |
| 403 | `toast.error('You do not have permission')` |
| 404 | Show inline "not found" state in component |
| 409 | `toast.error(err.message)` — e.g. duplicate bill number |
| 422 | Pass validation errors to form fields |
| 429 | `toast.error('Too many requests, please slow down')` |
| 5xx | `toast.error('Something went wrong. Please try again.')` |

### `providers/QueryProvider.tsx` — global error handler

```typescript
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isApiError(error) && error.status >= 500) {
        toast.error('Server error. Please try again.')
      }
    },
  }),
  defaultOptions: { ... }
})
```

### React Error Boundary in `app/(app)/layout.tsx`

```typescript
<ErrorBoundary fallback={<PageErrorFallback />}>
  {children}
</ErrorBoundary>
```

---

## Phase 7 — Environment & CORS Config

### `Rakam.Web/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### `Rakam.Web/.env.production`

```
NEXT_PUBLIC_API_URL=https://api.rakam.app/api/v1
```

### `next.config.ts` — dev proxy (avoids CORS in local development)

```typescript
async rewrites() {
  return process.env.NODE_ENV === 'development'
    ? [{ source: '/api/:path*', destination: 'http://localhost:3000/api/:path*' }]
    : []
}
```

---

## Files to Create / Modify

### New files

```
Rakam.Web/src/
  lib/
    api-error.ts
    query-keys.ts
  services/
    auth.ts
    accounts.ts
    firms.ts
    parties.ts
    products.ts
    sales-bills.ts
    purchase-bills.ts
    delivery-challans.ts
    expenses.ts
    transactions.ts
    dashboard.ts
    reports.ts
    settings.ts
    eway-bills.ts
    subscriptions.ts
    attachments.ts
    pdf.ts
    index.ts
  hooks/api/
    use-firms.ts
    use-parties.ts
    use-products.ts
    use-sales-bills.ts
    use-purchase-bills.ts
    use-delivery-challans.ts
    use-expenses.ts
    use-transactions.ts
    use-dashboard.ts
    use-reports.ts
    use-settings.ts
    use-eway-bills.ts
    use-subscriptions.ts
    use-attachments.ts
    use-pdf-job.ts
    index.ts
```

### Modified files

```
Rakam.Web/src/
  lib/api.ts                       — add ApiError, firm header, upload helper
  types/index.ts                   — align all types to backend DTOs
  store/useAuthStore.ts            — add accountId field
  store/useAppStore.ts             — remove hardcoded firm mock
  providers/QueryProvider.tsx      — add QueryCache global error handler
  app/(app)/layout.tsx             — add ErrorBoundary + firm bootstrapping
  next.config.ts                   — add dev proxy rewrite
  .env.local                       — add NEXT_PUBLIC_API_URL (create if missing)
  .env.production                  — add NEXT_PUBLIC_API_URL (create if missing)
```

---

## Execution Sequence

```
Week 1
  Day 1-2   Phase 1  — lib/api.ts + api-error.ts + types/index.ts + query-keys.ts
  Day 3-5   Phase 2  — All 17 service files

Week 2
  Day 1-3   Phase 3  — All 15 hook files
  Day 4     Phase 4  — Store updates + firm bootstrapping
  Day 5     Phase 5  — Dashboard + Sales Bills integration

Week 3
  Day 1     Phase 5  — Parties + Products integration
  Day 2     Phase 5  — Manage Firm integration
  Day 3     Phase 5  — Purchase Bills + Delivery Challans
  Day 4     Phase 5  — Expenses + Transactions
  Day 5     Phase 5  — Reports + Settings
  
Week 4
  Day 1     Phase 6  — Error handling, loading states, empty states across all modules
  Day 2     Phase 7  — Env config, CORS, production prep
  Day 3-5   QA       — End-to-end smoke test of all flows
```

---

## API Endpoint Reference

| Module | Method | Endpoint |
|---|---|---|
| Auth | POST | /auth/otp/request |
| Auth | POST | /auth/otp/retry |
| Auth | POST | /auth/otp/verify |
| Auth | POST | /auth/refresh |
| Auth | POST | /auth/logout |
| Accounts | GET | /accounts/me |
| Firms | GET | /firms |
| Firms | POST | /firms |
| Firms | GET | /firms/:id |
| Firms | PATCH | /firms/:id |
| Firms | DELETE | /firms/:id |
| Firms | PATCH | /firms/:id/set-default |
| Firms | PATCH | /firms/:id/pdf-options |
| Firms | GET | /firms/:id/bank-details |
| Firms | PUT | /firms/:id/bank-details |
| Firms | GET | /firms/:id/dispatch-addresses |
| Firms | POST | /firms/:id/dispatch-addresses |
| Firms | PATCH | /firms/:id/dispatch-addresses/:addrId |
| Firms | DELETE | /firms/:id/dispatch-addresses/:addrId |
| Parties | GET | /parties |
| Parties | POST | /parties |
| Parties | GET | /parties/dropdown |
| Parties | GET | /parties/:id |
| Parties | PATCH | /parties/:id |
| Parties | DELETE | /parties/:id |
| Parties | GET | /parties/:id/balance |
| Products | GET | /products |
| Products | POST | /products |
| Products | GET | /products/dropdown |
| Products | GET | /products/:id |
| Products | PATCH | /products/:id |
| Products | DELETE | /products/:id |
| Sales Bills | GET | /sales-bills |
| Sales Bills | POST | /sales-bills |
| Sales Bills | GET | /sales-bills/next-bill-no |
| Sales Bills | GET | /sales-bills/unbilled-dc |
| Sales Bills | GET | /sales-bills/:id |
| Sales Bills | PATCH | /sales-bills/:id |
| Sales Bills | DELETE | /sales-bills/:id |
| Sales Bills | POST | /sales-bills/:id/duplicate |
| Sales Bills | POST | /sales-bills/:id/payment |
| Sales Bills | POST | /sales-bills/:id/credit-note |
| Sales Bills | POST | /sales-bills/:id/pdf |
| Purchase Bills | GET | /purchase-bills |
| Purchase Bills | POST | /purchase-bills |
| Purchase Bills | GET | /purchase-bills/:id |
| Purchase Bills | PATCH | /purchase-bills/:id |
| Purchase Bills | DELETE | /purchase-bills/:id |
| Purchase Bills | POST | /purchase-bills/:id/payment |
| Delivery Challans | GET | /delivery-challans |
| Delivery Challans | POST | /delivery-challans |
| Delivery Challans | GET | /delivery-challans/:id |
| Delivery Challans | PATCH | /delivery-challans/:id |
| Delivery Challans | DELETE | /delivery-challans/:id |
| Delivery Challans | POST | /delivery-challans/:id/convert |
| Expenses | GET | /expenses |
| Expenses | POST | /expenses |
| Expenses | GET | /expenses/:id |
| Expenses | PATCH | /expenses/:id |
| Expenses | DELETE | /expenses/:id |
| Expenses | GET | /expenses/categories |
| Expenses | POST | /expenses/categories |
| Expenses | GET | /expenses/suppliers |
| Expenses | POST | /expenses/suppliers |
| Transactions | GET | /transactions |
| Transactions | POST | /transactions |
| Transactions | GET | /transactions/:id |
| Transactions | PATCH | /transactions/:id |
| Transactions | DELETE | /transactions/:id |
| Dashboard | GET | /dashboard/stats |
| Dashboard | GET | /dashboard/search |
| Reports | GET | /reports |
| Settings | GET | /settings |
| Settings | PATCH | /settings/:section |
| E-Way Bills | GET | /eway-bills |
| E-Way Bills | POST | /eway-bills |
| E-Way Bills | GET | /eway-bills/:id |
| E-Way Bills | PATCH | /eway-bills/:id |
| Subscriptions | GET | /subscriptions/me |
| Attachments | POST | /attachments |
| Attachments | DELETE | /attachments/:id |
| PDF Jobs | GET | /pdf/jobs/:jobId |
