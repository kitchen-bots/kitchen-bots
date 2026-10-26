# Kitchen Bots — Business Workflow Gap Audit

**Version**: 1.0.0  
**Date**: October 2026  
**Auditor**: Antigravity Operational Engineer  
**Database Verified**: `kitchen_bots_test` (PostgreSQL Local / Isolated)

---

## 1. Executive Summary & Workflow Status Classification

Every realistic business interaction across customers, administrators, warehouse staff, store cashiers, and technicians has been audited against the actual source code, database tables, and API routes.

Status definitions:
- **PASS**: End-to-end workflow fully verified against database and APIs with automated test proof.
- **PARTIAL**: Core API/database capability exists and works, but external hardware/integration is manual.
- **FAIL**: Workflow behaved incorrectly or caused data corruption (none currently; all identified bugs fixed).
- **NOT IMPLEMENTED**: Feature not built yet; requires schema or UI implementation.
- **BLOCKED**: Requires live third-party carrier/payment gateway/email server credentials not present locally.

---

## 2. Business Scenario Gap Matrix

| # | Business Scenario | Channel / Entry Point | Receiving Module | Database Mutation | Status | Gap & Missing Functionality Analysis |
|---|---|---|---|---|---|---|
| **1** | **E-commerce Storefront Order** | Storefront cart checkout | Orders & Inventory | `orders`, `stock_movements` (reservation) | **PASS** | Customer order places reservation; available stock (`onHand - reserved`) strictly protected against concurrency. |
| **2** | **Simultaneous Last-Unit Purchase** | Two simultaneous web checkouts | Inventory Ledger | `stock_movements` | **PASS** | PostgreSQL `SELECT ... FOR UPDATE` row locks prevent over-reservation. Second request rejects with HTTP 422. |
| **3** | **Order Cancellation before Dispatch** | Operations Orders Workspace | Orders & Inventory | `order_cancellations`, `stock_movements` (release) | **PASS** | `release` movement returns reserved stock back to available pool; cancellation reason logged with actor audit. |
| **4** | **Direct In-Person Sale / POS** | Admin Store Counter / POS Desk | Inventory & Invoicing | `direct_sales`, `orders`, `invoices`, `payment_transactions`, `stock_movements` (deduction) | **PASS** | Implemented `recordDirectSale()` transaction: atomic stock deduction, invoice generation with 18% GST, payment clearance, and POS receipt. |
| **5** | **Physical Warehouse & Multi-Location** | Barcode / Staff Put-Away | Inventory | `inventory_locations`, `product_units` | **PASS** | Multi-warehouse table (`inventory_locations`) and bin assignment supported. Explicit staff or scan action required; no fake GPS. |
| **6** | **Serialized Unit Tracking** | Production QA / Inward Intake | Machinery & Inventory | `product_units` | **PASS** | Unique serial numbers per physical unit enforced with database unique constraint. Optional for non-serialized bulk accessories. |
| **7** | **Cash Payment to Owner / Cashier** | Storefront / Admin Counter | Invoicing & Treasury | `payment_transactions`, `invoices` | **PASS** | Recorded with cashier ID and UTR/Receipt #. Updates invoice balance due atomically; rejects overpayment unless approved. |
| **8** | **Bank Transfer (NEFT/RTGS/IMPS)** | Client sends UTR | Invoicing & Payments Workspace | `payment_transactions`, `invoices` | **PASS** | Verified UTR recorded by staff. Duplicate UTR rejected with HTTP 422. Reconciles invoice balance. Automated bank feed: *BLOCKED*. |
| **9** | **Business UPI QR Payment** | Storefront / Invoice QR | Payments Workspace | `payment_transactions` | **PARTIAL** | Manual UTR verification supported. Dynamic UPI intent / bank webhook requires Razorpay/Cashfree credentials (*BLOCKED*). |
| **10** | **Quotation Request & Conversion** | Storefront B2B Quote Form | Quotes & Invoices | `quotes`, `invoices`, `orders` | **PASS** | Quote converts to order/invoice with line-item preservation and audit stamp via `convertQuoteToOrder()`. |
| **11** | **Customer Reclassification** | CRM Workspace | CRM | `customer_classifications`, `customer_notes` | **PASS** | Individual vs wholesale classification explicitly recorded; reclassification persists and updates filtered tabs. |
| **12** | **Defective Product & Warranty Claim** | Support Request / Phone Intake | Services & Support | `service_cases`, `service_activities`, `service_parts` | **PASS** | Complete warranty adjudication: claim intake, evidence logging, technician assignment, warranty approve/reject with reason, parts deduction. |
| **13** | **Out-of-Warranty Repair & Parts** | Repair Desk | Services & Inventory | `service_cases`, `service_parts` | **PASS** | Parts estimates, customer approval checkbox, and labour charges tracked in paise. |
| **14** | **Document Upload & Version Upgrade** | Documents Workspace | Documents & Reports | `business_documents`, `document_versions` | **PASS** | Uploads to local storage (dev) / R2 (prod). Atomic version upgrade, rollback on DB error, authenticated streaming download with RBAC. |
| **15** | **Order Blocker Diagnostic Logging** | Orders Workspace | Orders | `order_blockers` | **PASS** | Blocker categorized (Suppliers, Logistics, Inventory), team assigned, resolution logged with timestamp. |
| **16** | **Biometric Attendance & Corrections** | Staff Tablet / Operations | HR & MES | `attendance_records`, `attendance_corrections` | **PASS** | Check-in, lunch breaks, auditable supervisor corrections, and production task allocations verified. |
| **17** | **Inbound Email Ingestion** | Incoming email | Enquiries | `enquiries` | **BLOCKED** | Manual enquiry entry works. Automated IMAP/SendGrid webhook ingestion blocked pending corporate mailbox credentials. |
| **18** | **Automated Carrier Tracking** | Carrier API Webhook | Orders | `orders.trackingNumber` | **BLOCKED** | Manual tracking number input works. Real-time carrier push tracking blocked pending Delhivery/BlueDart API keys. |

---

## 3. Detailed Audit of Critical Workflow Gaps

### 3.1 Direct Sale / POS (Resolved)
- **Previous State**: Admins could only view existing invoices or manually generate invoices from orders, but could not execute a fast store counter sale with instant payment clearance and stock deduction in a single step.
- **Resolution**: Implemented `recordDirectSale()` in [postgres-operations-repo.ts](file:///Users/shritha/Kitchen%20Bots/kitchen-bots/apps/backend/src/lib/postgres-operations-repo.ts#L1480-L1620) and `/api/operations/inventory` with action `direct_sale`. Atomically creates order, invoice, payment transaction, stock deduction, and POS sale record.

### 3.2 Inventory Multi-Location & Serialization (Resolved)
- **Previous State**: Inventory tracking was SKU-level only, with no table for physical warehouse/bin locations or individual serial numbers.
- **Resolution**: Created `inventory_locations` and `product_units` tables. Enforces serial number uniqueness, tracks unit status (`available`, `reserved`, `dispatched`, `quarantined`, `repair`), and maps units to locations.

### 3.3 Third-Party External Integrations (Explicitly Marked as Blocked)
- **Payment Gateway Webhooks**: Blocked until live Razorpay/Cashfree merchant keys are provisioned. In UI, UPI option explicitly indicates manual UTR verification required; no fake QR is generated.
- **Carrier Tracking API**: Blocked until live logistics provider contracts are active.
- **Inbound Email Ingestion**: Blocked until enterprise IMAP/SMTP credentials are provided. Enquiries module explicitly displays unconfigured badge.

---

## 4. Admin UI Implementation & Verification Evidence

All backend workflow capabilities have been integrated and verified in the Admin Dashboard:

1. **Direct Counter Sale / POS**:
   - Access: Dedicated `+ Direct Counter POS Sale` action in Orders and Invoicing workspaces.
   - Capabilities: Customer selection, warehouse location picker, equipment model selector, real-time quantity input, auto-computed 18% GST and total, cash / UPI / bank settlement.
   - Feedback: On submission, displays an instant official printable POS receipt modal with sale reference, customer name, tax breakdown, and paid total.
   - Data Consistency: Directly verified against database test suite (`postgres-operations.test.ts` test 14); atomically creates order, snapshot invoice, payment transaction, and stock movement.

2. **Warehouse Multi-Location & Serialized Unit Management**:
   - Access: Inventory tab segmented sub-navigation (`SKU Stock Balances`, `Warehouse Locations`, `Serialized Units`).
   - Warehouse Locations: Card grid showing code, facility name, status, physical address, and count of currently assigned machinery units. Includes `+ Add Location` modal.
   - Serialized Units: Table view showing unit serial number, SKU, physical location, bin/shelf reference, lifecycle status, and linked order. Includes `+ Register Serial Unit` modal and `Move Location` modal for inter-facility transfers.

3. **Billing, UPI & Bank Transfer Transparency**:
   - Invoices & Payments workspace includes manual UTR input for NEFT/RTGS and UPI payments.
   - Invoices payment modal explicitly displays notice: *"Merchant UPI Dynamic QR Unconfigured: Live payment gateway webhooks are not connected. Enter the bank verified UTR / transaction ID from your account statement."*

4. **Enquiries Channel Separation**:
   - Direct manual enquiry intake (walk-in, phone, messaging) verified.
   - Website enquiries tab verified.
   - Inbound email ingestion explicitly rendered as disabled badge: *"Inbound Email: Unconfigured (Requires enterprise IMAP/SendGrid credentials)"*.

