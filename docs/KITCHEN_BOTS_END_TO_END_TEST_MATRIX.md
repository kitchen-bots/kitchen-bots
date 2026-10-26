# Kitchen Bots — End-to-End Test Matrix & Verification Evidence

**Audit Date**: October 2026  
**Test Database**: `kitchen_bots_test` (PostgreSQL Local)  
**Total Scenarios Audited**: 18  
**Total Automated Suites**: 3 (`postgres-operations.test.ts`, `inventory-invoicing.test.ts`, `storefront vitest`)  
**Pass Count**: 15  
**Partial Count**: 1 (UPI QR Manual Reconciliation)  
**Blocked Count**: 2 (Live Carrier Webhook & Inbound Email Server)  
**Fail Count**: 0  

---

## 1. Automated Test Execution Evidence

### Test Suite 1: Backend PostgreSQL Operations (`postgres-operations.test.ts`)
Run command: `pnpm --filter @kitchen-bots/backend exec node --import tsx src/lib/postgres-operations.test.ts`
- **Result**: **14 PASS / 0 FAIL** (Duration: 89.37ms)
1. `Inventory: records stock receipts and enforces available = onHand - reserved`: **PASS**
2. `Inventory: rejects over-reservation with transactional rollback`: **PASS**
3. `Invoices: creates sequential invoice with 18% GST and line item snapshots`: **PASS**
4. `Orders: transitions status with atomic history logging & customer approval`: **PASS**
5. `HR & MES: registers staff, records attendance, and allocates production work order`: **PASS**
6. `CRM: converts quote to order reliably and generates operational reports`: **PASS**
7. `HR & CRM Query Persistence: verifies staff directory, attendance log, leave tracking, and CRM profiles`: **PASS**
8. `HR Attendance & Breaks: records breaks and deducts duration from worked time`: **PASS**
9. `HR Corrections: maintains audit trail and recalculates corrected hours`: **PASS**
10. `Daily Work Logs: creates, updates, and reviews work log entries with order links`: **PASS**
11. `HR Attendance & Leave Sync: approves leave and updates attendance register with live summaries`: **PASS**
12. `Security & Auth Guard: verifies canonical JWT validation, tampering rejection, and fail-closed isolation`: **PASS**
13. `Orders Workspace: records blockers, resolves them, records audited cancellations and timeline`: **PASS**
14. `Warehouse Locations, Serialized Units & Direct POS Sales Workflow`: **PASS**

### Test Suite 2: Inventory & Invoicing Ledger (`inventory-invoicing.test.ts`)
Run command: `pnpm --filter @kitchen-bots/backend exec node --import tsx src/lib/inventory-invoicing.test.ts`
- **Result**: **2 PASS / 0 FAIL** (Duration: 3.85ms)
1. `InventoryLedgerEngine: correctly calculates available stock = onHand - reserved`: **PASS**
2. `InvoicingEngine: creates persistent invoice with standard GST (18%) and reconciles partial payments`: **PASS**

### Test Suite 3: Storefront & Customer Portal (`apps/storefront vitest`)
Run command: `pnpm --filter @kitchen-bots/storefront test`
- **Result**: **25 PASS / 0 FAIL** (5 test files, Duration: 309ms)
1. `src/lib/portal.test.ts`: **PASS** (2 tests)
2. `src/modules/__tests__/sequence-viewer.test.ts`: **PASS** (5 tests)
3. `src/context/CartContext.test.ts`: **PASS** (3 tests)
4. `src/lib/api.test.ts`: **PASS** (7 tests)
5. `src/lib/cdn.test.ts`: **PASS** (8 tests)

---

## 2. End-to-End Scenario Verification Matrix

| Scenario # | Description | Trigger / Channel | Modules Involved | Evidence Required for Verification | Status |
|:---|:---|:---|:---|:---|:---|
| **E2E-01** | Stock Receipt & Availability Formula | Warehouse staff inward intake | Inventory Ledger | `stock_movements` row added with `movement_type: receipt`. `available = onHand - reserved` verified. | **PASS** |
| **E2E-02** | Simultaneous Concurrency & Over-Reservation Rejection | 2 concurrent checkout attempts for last unit | Inventory & Orders | Second request aborts with error: `Insufficient available stock`. Transaction rolls back cleanly. | **PASS** |
| **E2E-03** | Order Blocker & Resolution | Operations team identifies motor shortage | Orders Workspace | `order_blockers` row created (`open`), resolved with notes, audit timeline updated. | **PASS** |
| **E2E-04** | Order Cancellation & Stock Release | Customer cancels prior to dispatch | Orders & Inventory | `order_cancellations` row created; `stock_movements` logs `release`; stock returns to available pool. | **PASS** |
| **E2E-05** | Direct Store Counter POS Sale | Walk-in customer counter purchase | POS & Invoicing | `direct_sales`, `orders`, `invoices`, `payment_transactions`, `stock_movements` (deduction) all inserted atomically. | **PASS** |
| **E2E-06** | Physical Warehouse Location Management | Operations defines new stockroom | Warehouse & Inventory | `inventory_locations` record created with unique code; lists and filters active warehouses. | **PASS** |
| **E2E-07** | Serialized Product Unit Tracking | Production QA tags finished machine | Machinery Catalog | `product_units` record created with unique serial number; rejects duplicate serial with unique constraint. | **PASS** |
| **E2E-08** | Serialized Unit Location Movement | Warehouse worker moves unit to rack | Warehouse Logistics | `updateUnitLocation()` updates `location_id` and `bin_location` with timestamp. | **PASS** |
| **E2E-09** | Cash Payment Clearance & Receipt | Cashier collects cash | Treasury & Invoicing | `payment_transactions` record created with method `cash`; invoice `paid_paise` updated and balance due zeroed. | **PASS** |
| **E2E-10** | Bank Transfer UTR Matching | Client transfers via NEFT | Billing & Payments | `payment_transactions` record created with UTR; rejects duplicate reference with HTTP 422. | **PASS** |
| **E2E-11** | Wholesale B2B Quote Conversion | Approved quotation converts to order | Quotes & Invoicing | `convertQuoteToOrder()` creates order and sequential invoice with identical line items. | **PASS** |
| **E2E-12** | Customer CRM Reclassification | Operations switches customer to Wholesale | CRM Workspace | `customer_classifications` upserted; customer appears under Wholesale tab immediately. | **PASS** |
| **E2E-13** | Warranty Adjudication & Claim Intake | Customer reports damaged burner | Service & Support | `service_cases` logged with warranty dates; technician assigned; warranty approved with reason. | **PASS** |
| **E2E-14** | Out-of-Warranty Repair & Spare Parts | Technician quotes replacement valve | Service & Parts | `service_parts` recorded with unit price in paise; labour and parts summed for customer signoff. | **PASS** |
| **E2E-15** | Document Upload & Storage Failover Guard | Staff uploads warranty policy PDF | Documents & Storage | `upload()` writes durable object; DB failure triggers automatic object rollback cleanup. | **PASS** |
| **E2E-16** | Authenticated Document Download RBAC | User requests restricted contract | Documents Download | Public downloads stream freely; internal/restricted require JWT session and Admin role check. | **PASS** |
| **E2E-17** | Automated Gateway Webhook Capture | External payment gateway callback | Treasury & Webhooks | Awaiting live Razorpay/Cashfree webhook secret in production. | **BLOCKED** |
| **E2E-18** | Inbound Customer Email Parser | Customer sends email to info@kitchenbots.in | Enquiries Ingestion | Awaiting corporate IMAP/SendGrid webhook configuration. | **BLOCKED** |
