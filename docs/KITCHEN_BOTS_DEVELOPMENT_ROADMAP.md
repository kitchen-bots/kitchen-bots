# KITCHEN BOTS — DEVELOPMENT ROADMAP & IMPLEMENTATION STATUS

**Document Version:** 1.0.0  
**Phase:** Phase 1 Operational Review & Hardening  
**Target Architecture:** Next.js 15 App Router + Payload CMS 3 + PostgreSQL / Supabase + React/Vite Storefront  
**Last Updated:** October 2026  

---

## 1. Roadmap Classification Guide

All features, workflows, and modules in the Kitchen Bots ecosystem are tracked under one of five explicit engineering states:

1. **COMPLETED & VERIFIED**: Implemented, backed by database schemas, API routes, automated tests, and verified against functional criteria.
2. **IN PROGRESS**: Core implementation exists in the codebase but requires additional test coverage, UI polish, or configuration hardening.
3. **PARTIALLY VERIFIED / MISSING INTEGRATIONS**: Backend endpoints and UI exist and work with manual inputs, but external third-party services (webhooks, carrier APIs, SMS gateways) are unintegrated.
4. **BLOCKED**: Implementation cannot proceed without external infrastructure, network access, or missing credentials.
5. **PLANNED**: Identified for future sprints, not yet present in active code.

---

## 2. Master Module Status & Verification Summary

| Module | Core UI | Backend API | Database Schema | Automated Tests | External Integrations | Overall State |
|--------|---------|-------------|-----------------|-----------------|-----------------------|---------------|
| **1. Overview / Dashboard** | Implemented (`AdminDashboard.tsx`) | Implemented (`/api/orders`, `/api/products`, etc.) | PostgreSQL aggregates | Verified via API fetch | None required | **COMPLETED & VERIFIED** |
| **2. Orders Workspace** | Implemented (Drawer, Blockers, History) | Implemented (`/api/operations/orders/*`) | `orders`, `order_status_history`, `order_blockers` | Verified (Test #4, #9) | Logistics/Carrier Tracking: *Missing* | **PARTIALLY VERIFIED** |
| **3. Machinery Catalog** | Implemented (Grid, Modal, File Upload) | Implemented (`/api/products`, `/api/operations/media/upload`) | `products`, `media` | Verified (Test upload & patch) | Cloudflare R2 Sync: *Configured* | **COMPLETED & VERIFIED** |
| **4. Inventory Ledger** | Implemented (Movement Table & Modal) | Implemented (`/api/operations/inventory`) | `stock_movements` (Directional movements) | Verified (Test #1, #2) | Barcode / RFID Hardware: *Planned* | **COMPLETED & VERIFIED** |
| **5. CRM & Customer Requests** | Implemented (`CrmWorkspace.tsx`) | Implemented (`/api/operations/crm/*`) | `customer_classifications`, `customer_notes` | Verified (Test #6, #7) | Email marketing / CRM Sync: *Planned* | **COMPLETED & VERIFIED** |
| **6. Inquiries (Presales Leads)** | Implemented (`EnquiriesWorkspace.tsx`) | Implemented (`/api/operations/enquiries`) | `enquiries`, `enquiry_communications` | Verified (Test #6) | Automated WhatsApp/SMS: *Missing* | **PARTIALLY VERIFIED** |
| **7. Manufacturing & Fulfillment**| Implemented (Kanban, Tasks) | Implemented (`/api/operations/hr`) | `production_task_allocations`, `daily_work_logs` | Verified (Test #5, #11) | Factory Floor Barcode Terminals: *Planned*| **PARTIALLY VERIFIED** |
| **8. Service & Support** | Implemented (`ServicesWorkspace.tsx`) | Implemented (`/api/operations/services`) | `service_cases`, `service_activities`, `service_parts` | Verified via sample seed data | Field Technician GPS Mobile App: *Planned* | **PARTIALLY VERIFIED** |
| **9. Documents & Reports** | Implemented (`DocumentsWorkspace.tsx`) | Implemented (`/api/operations/documents/*`) | `business_documents`, `document_versions` | Verified (File upload & download) | Cloudflare R2 Bucket: *Configured* | **COMPLETED & VERIFIED** |
| **10. Invoice Management** | Implemented (`InvoicesWorkspace.tsx`) | Implemented (`/api/operations/invoices`) | `invoices`, `invoice_items` | Verified (Real Chrome & Test #3) | Dynamic multi-slab / Interstate GST: *Needs Policy* | **COMPLETED & VERIFIED** |
| **11. Billing & Payments** | Implemented (`PaymentsWorkspace.tsx`) | Implemented (`/api/operations/invoices?tab=payments`) | `payment_transactions` | Verified (Real Chrome + UTR tests) | Automated Payment Gateway Webhooks: *Planned* | **COMPLETED & VERIFIED** |
| **12. HR & Attendance** | Implemented (`AdminDashboard.tsx`) | Implemented (`/api/operations/hr`) | `staff_profiles`, `attendance_records` | Verified (Real Chrome + Tests #8-#12)| Biometric Hardware Bridge: *Planned* | **COMPLETED & VERIFIED** |
| **13. User Management & RBAC** | Implemented (Payload Admin) | Implemented (`/api/users/*`) | `users`, `users_sessions` | Verified (Real Chrome + JWT Guards) | Enterprise SSO (SAML/Okta): *Planned* | **COMPLETED & VERIFIED** |
| **14. Storefront Integration** | Implemented (React/Vite App) | Implemented (Catalog REST/GraphQL) | `products`, `categories` | Verified (Real Chrome + 25 Vitest tests) | Automated Playwright CDN: *Bypassed via native Chrome* | **COMPLETED & VERIFIED** |

---

## 3. High-Priority Bug Fixes (Recently Completed in Phase 1)

1. **CRM Customer Reclassification Persistence**:
   - *Status*: **FIXED & VERIFIED**.
   - *Fix*: Created dedicated `customer_classifications` table in PostgreSQL; wired `POST /api/operations/crm/customers` to perform upserts; added cache invalidation to reload filtered tabs immediately upon change.
2. **Customer Requests Status Persistence**:
   - *Status*: **FIXED & VERIFIED**.
   - *Fix*: Aligned parameter naming (`id || requestId`) in `crm/requests/route.ts`; added communication audit log row in `enquiry_communications`. Verified across lifecycle (`new` -> `open` -> `resolved` -> `closed`).
3. **Product Detail Page Redundant Tabs**:
   - *Status*: **FIXED & VERIFIED**.
   - *Fix*: Cleaned 4 unnecessary tabs (`Inventory`, `Orders & Demand`, `Manufacturing`, `Audit Timeline`) from detail UI while preserving underlying database tables and standalone Inventory Ledger.
4. **Product Image Upload Pipeline**:
   - *Status*: **FIXED & VERIFIED**.
   - *Fix*: Replaced plain text URL input with multipart upload API (`/api/operations/media/upload`), live preview, file format validation (JPG/PNG/WebP <= 10MB), removal state, and product record synchronization.
5. **Billing & Payments Card Workspace**:
   - *Status*: **COMPLETED & VERIFIED IN REAL CHROME**.
   - *Fix*: Replaced legacy unstyled table with card-first treasury workspace with Pending/Completed/Cancelled tabs, live KPIs, detail drawer, internal note logging, and receipt preview modal.
6. **Warehouse Locations, Serialized Units & Direct POS Sales**:
   - *Status*: **COMPLETED & VERIFIED IN UI & TEST DB (Test #14 + Dashboard UI)**.
   - *Fix*: Added `inventory_locations`, `product_units`, and `direct_sales` schemas and repository methods. Implemented fast direct store counter POS checkout with atomic inventory deduction, 18% GST tax invoice generation, instant payment clearance, unique serial number enforcement, and printable receipt modal. Added Warehouse Locations and Serialized Units management views directly in the Machinery Inventory workspace.


---

## 4. Prior Tooling Blockers & Resolutions

1. **Playwright Driver Download 404 (RESOLVED)**:
   - *Impact*: Previously blocked browser automation when attempting to pull `playwright-1.57.0-mac-arm64.zip` over restricted network.
   - *Resolution*: Leveraged native macOS Google Chrome binary (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`) connected directly via `puppeteer-core`. Real browser E2E visual tour and interactive workflows completed with zero driver downloads. All 14 modules visual verified.
2. **Production Storage Abstraction & Cloudflare R2 Integration (LOCAL VERIFIED; LIVE R2 STAGING PENDING)**:
   - *Status*: **LOCAL STORAGE VERIFICATION COMPLETE; LIVE R2 STAGING TEST PENDING APPROVAL**.
   - *Architecture*: Implemented `IStorageProvider`, `LocalStorageProvider`, and `R2StorageProvider` using `@aws-sdk/client-s3`. Wired `/api/operations/documents` (upload & versions), `/api/operations/documents/download`, and `/api/operations/media/upload`. Verified with unit tests, rollback simulations, and native Chrome E2E.
   - *Safety Guard*: Fails fatal (refuses silent fallback to ephemeral disk) if `STORAGE_DRIVER=r2` is set without credentials. Local development and tests default to `STORAGE_DRIVER=local`. Automatic DB failure rollback deletes uploaded storage objects.
   - *Pending Staging Phase*: Live staging verification against staging Cloudflare R2 bucket with Vercel Preview environment variables is planned and awaiting explicit operational approval.

---

## 5. Missing Integrations & Technical Debt

1. **Payment Gateway Webhooks**:
   - *Current Behavior*: Payments are recorded manually by administrative staff checking bank UTR/RTGS slips.
   - *Target Integration*: Razorpay B2B Smart Collect or Cashfree Virtual Accounts webhook handler to automatically reconcile incoming NEFT/RTGS payments against invoice balances.
2. **Dynamic Tax Engine (GST Sub-rules)**:
   - *Current Behavior*: Flat 18% GST calculation across all invoice line items.
   - *Target Integration*: Dynamic GST split (intra-state: 9% CGST + 9% SGST vs. inter-state: 18% IGST) determined by supplier state code vs. customer shipping state code. Support for multi-slab rates (e.g. 12% on specialized parts).
3. **Outbound Notification Dispatchers**:
   - *Current Behavior*: Service status updates and order blocker resolutions are written to database tables only.
   - *Target Integration*: Webhook triggers to Gupshup / Twilio for automated WhatsApp and SMS delivery to kitchen owners.
4. **Serverless Ephemeral Storage Guard**:
   - *Current Status*: **RESOLVED VIA SHARED STORAGE ABSTRACTION**.
   - *Architecture*: Implemented `STORAGE_DRIVER=local` (disk fallback) and `STORAGE_DRIVER=r2` (`@aws-sdk/client-s3` streaming). Operational document routes and product image routes now use `getStorageProvider()`.
   - *Remaining Step*: Live staging verification against production R2 credentials once approved.

---

## 6. Recommended Phase 2 Implementation Order

1. **Task 1: GST Engine Refinement**:
   - Add state code fields to customer profiles and supplier settings.
   - Implement intra-state (CGST + SGST) vs inter-state (IGST) split in `InvoicingEngine`.
2. **Task 2: Payment Gateway Webhook Endpoint**:
   - Create `/api/operations/payments/webhook` with cryptographic signature verification.
   - Automatically reconcile pending invoices upon receiving payment capture events.
3. **Task 3: Production Cloudflare R2 Upload Streamer**:
   - Verify S3 client direct streaming for `/api/operations/media/upload` when running in production mode (`NODE_ENV === 'production'`).
4. **Task 4: Playwright Driver Setup & Automated Browser E2E**:
   - Download local Playwright binaries offline.
   - Add automated browser tests for order status workflow, invoice print modal, and storefront checkout.
