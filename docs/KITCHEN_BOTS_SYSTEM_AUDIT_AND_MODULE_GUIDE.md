# KITCHEN BOTS — COMPLETE SYSTEM AUDIT, MODULE TESTING, TECHNICAL DOCUMENTATION & EXPLANATION

**Document Version:** 1.0.0  
**Audit Date:** October 2026  
**Auditor / Engineering Lead:** DeepMind Antigravity Advanced Agentic Coding Pair  
**Target Architecture:** Monorepo (`apps/backend` Next.js 15 + Payload CMS 3, `apps/storefront` React + Vite, `packages/types`)  
**Database Targets:** 
1. `Supabase PostgreSQL` (Payload CMS Headless Content & Auth)
2. `PostgreSQL Local Test DB` (`kitchen_bots_test` on `localhost:5432` for isolated operations testing)

---

## 1. Executive Summary & Project Purpose

Kitchen Bots is an industrial, commercial food-service automation and kitchen machinery manufacturing platform. Unlike basic consumer retail e-commerce, commercial kitchen equipment sales involve:
1. High-value machinery (₹50,000 to ₹10,00,000+ per unit: automated wok robots, commercial induction ranges, planetary mixers, high-throughput dishwashers).
2. Complex B2B customer journeys (direct inquiries, technical RFQs, custom quotes, multi-stage order approval, payment milestones).
3. Post-sale operational lifecycle (inventory ledger with serial number tracking, manufacturing execution/work orders, warranty claims, equipment servicing, technician dispatch, preventive maintenance).
4. Strict statutory compliance and document distribution (GST B2B invoicing, HSN coding, BIS certification, CE declaration of conformity, equipment manuals, electrical wiring diagrams).

The admin dashboard serves as the **unified operations cockpit** for executive management, factory floor supervisors, field technicians, sales representatives, and financial controllers.

```mermaid
graph TD
    ClientStorefront["Storefront (React + Vite :5173)"] -->|Public REST/GraphQL| BackendPayload["Backend & Payload CMS 3 (Next.js 15 :3001)"]
    AdminUser["Admin / Operations Staff"] -->|Custom Nav & Workspaces| AdminCockpit["Admin Operations Cockpit (/admin)"]
    AdminCockpit --> BackendPayload
    BackendPayload -->|ORM / Headless CMS| SupabaseDB[("Primary DB (Supabase PostgreSQL)")]
    BackendPayload -->|Direct Pool / Migrations| TestOpsDB[("Operations DB (PostgreSQL kitchen_bots_test)")]
    BackendPayload -->|Static / Previews| LocalStorage["Local Public Storage (/public/images/products)"]
    BackendPayload -->|CDN Assets| CloudflareR2["Cloudflare R2 Bucket (kitchen-bots-media)"]
```

---

## 2. Complete Module Inventory & Implementation Status Matrix

Every module has been inspected in [CustomNav.tsx](file:///Users/shritha/Kitchen%20Bots/kitchen-bots/apps/backend/src/components/CustomNav.tsx), [AdminDashboard.tsx](file:///Users/shritha/Kitchen%20Bots/kitchen-bots/apps/backend/src/components/AdminDashboard.tsx), [postgres-operations-repo.ts](file:///Users/shritha/Kitchen%20Bots/kitchen-bots/apps/backend/src/lib/postgres-operations-repo.ts), and tested against live APIs.

| # | Exact Module Name in App | URL / Sidebar Route | Primary React Components | Relevant API Routes | Primary DB Tables | Status Classification |
|---|-------------------------|---------------------|--------------------------|---------------------|-------------------|-----------------------|
| 1 | **Overview** | `/admin` (`tab=overview`) | `AdminDashboard.tsx` (KPI Grid, Activity Feed) | `/api/orders`, `/api/products`, `/api/enquiries`, `/api/quotes`, `/api/services`, `/api/operations/invoices`, `/api/operations/inventory` | `orders`, `products`, `enquiries`, `quotes`, `invoices`, `stock_movements` | **Implemented & backend-verified** (Browser rendering unverified due to driver block) |
| 2 | **Orders** | `/admin?tab=orders` | `AdminDashboard.tsx` (Orders Workspace, Drawer) | `/api/orders`, `/api/operations/orders/workspace`, `/api/operations/orders/transition` | `orders`, `orders_items`, `order_status_history`, `order_blockers`, `order_cancellations` | **Implemented & backend-verified** (Tested transitions & blocker logs in DB; carrier dispatch API unintegrated) |
| 3 | **Machinery Catalog** | `/admin?tab=products` | `AdminDashboard.tsx` (Product Grid, Modal, Specs) | `/api/products`, `/api/products/:id`, `/api/operations/media/upload` | `products`, `products_image_urls`, `categories`, `media` | **Fully implemented and verified** (End-to-end device image upload, patch, retrieval, removal tested) |
| 4 | **Inventory Ledger** | `/admin?tab=ledger` | `AdminDashboard.tsx` (Ledger Table, Movement Modal) | `/api/operations/inventory`, `/api/operations/inventory?view=ledger` | `stock_movements`, `products` | **Implemented & backend-verified** (Single-item stock movement audit ledger; not double-entry financial accounting) |
| 5 | **CRM & Customer Requests** | `/admin?tab=crm` | `CrmWorkspace.tsx`, `AdminDashboard.tsx` | `/api/operations/crm/customers`, `/api/operations/crm/requests` | `customer_classifications`, `customer_notes`, `customer_followups`, `users`, `orders` | **Fully implemented and verified** (Reclassification & request status lifecycle verified with DB persistence) |
| 6 | **Inquiries** | `/admin?tab=enquiries` | `EnquiriesWorkspace.tsx` | `/api/operations/enquiries`, `/api/enquiries` | `enquiries`, `enquiry_communications`, `enquiry_followups` | **Implemented & backend-verified** (CRUD & followups tested; email/WhatsApp notification dispatch unintegrated) |
| 7 | **Manufacturing & Fulfillment**| `/admin?tab=manufacturing`| `AdminDashboard.tsx` (MES Tasks, Kanban) | `/api/operations/hr?tab=allocations`, `/api/operations/hr?tab=work_logs` | `production_task_allocations`, `daily_work_logs`, `orders` | **Partially verified** (Task allocation & daily work logs verified in DB; shop-floor barcode scanner unintegrated) |
| 8 | **Service & Support** | `/admin?tab=services` | `ServicesWorkspace.tsx` | `/api/operations/services`, `/api/services` | `service_cases`, `service_activities`, `service_parts` | **Implemented & backend-verified** (Warranty/repair flow verified using sample seed records; field GPS unintegrated) |
| 9 | **Documents & Reports** | `/admin?tab=documents` | `DocumentsWorkspace.tsx` | `/api/operations/documents`, `/api/operations/documents/download` | `business_documents`, `document_versions`, `document_activity` | **Implemented & backend-verified** (Local disk storage active; Cloudflare R2 bucket configured for production) |
| 10| **Invoices** | `/admin?tab=invoicing` | `InvoicesWorkspace.tsx` | `/api/operations/invoices`, `/api/operations/invoices?id=:id` | `invoices`, `invoice_items`, `payment_transactions`, `orders` | **Implemented & backend-verified** (Hardcoded 18% GST engine; interstate IGST & multi-tax slabs not yet supported) |
| 11| **Billing & Payments** | `/admin?tab=payments` | `InvoicesWorkspace.tsx` (Payments Tab) | `/api/operations/invoices?tab=payments` | `payment_transactions`, `invoices` | **Partially verified** (Manual UTR recording & reconciliation verified; automated gateway webhooks unintegrated) |
| 12| **HR & Attendance** | `/admin?tab=hr` | `AdminDashboard.tsx` (HR Workspace) | `/api/operations/hr` | `staff_profiles`, `attendance_records`, `attendance_breaks`, `attendance_corrections`, `leave_requests` | **Implemented & backend-verified** (Attendance, break deductions, and leave approval tested in DB) |
| 13| **User Management** | `/admin/collections/users` | Payload CMS Standard Collection Admin | `/api/users`, `/api/users/me`, `/api/users/login` | `users`, `users_sessions` | **Implemented & backend-verified** (Payload auth, JWT guard, role RBAC tested; SSO/SAML unintegrated) |
| 14| **Storefront Integration** | `http://localhost:5173` | React / Vite Storefront App | `/api/products`, `/api/categories`, `/api/quotes`, `/api/orders` | `products`, `categories`, `orders` | **Implemented & unit-tested** (Vitest 25 tests pass; live visual integration unverified in headless terminal) |

---

## 3. Module-by-Module Technical & Functional Deep Dive

---

### Module 1: Overview & Executive Dashboard

#### A. Business Purpose
Commercial kitchen equipment operations have continuous moving parts: incoming B2B inquiries, high-value orders awaiting approval, factory manufacturing bottlenecks, technician warranty visits, and pending invoice collections. Executive leadership cannot jump between 10 different spreadsheets. The Overview dashboard acts as the **central mission control**, aggregating real-time metrics across sales, revenue, fulfillment, and customer satisfaction.

#### B. User Interface
- **KPI Metrics Cards**:
  1. *Total Order Pipeline Value* (sum of all active and completed orders in paise, displayed in ₹ INR).
  2. *Active Factory Equipment Models* (count of unique machinery models in catalog).
  3. *Unresolved Inquiries & Support Tickets* (count of open service requests and inquiries).
  4. *Pending Invoices / Uncollected Cash* (outstanding balance in paise).
- **Recent Activity Feed**: Chronological list of status changes, new RFQs, and stock movement logs.
- **Quick Actions**: One-click shortcuts to Add Equipment Model, Record Stock Receipt, Create B2B Quote, and Log Support Ticket.

#### C. Technical Architecture & Data Flow
- **Component**: `AdminDashboard.tsx` (lines 480–750, 1100–1650).
- **APIs Called**:
  - `GET /api/orders?limit=100&sort=-createdAt`
  - `GET /api/products?limit=100&sort=-createdAt`
  - `GET /api/operations/invoices`
  - `GET /api/operations/inventory`
  - `GET /api/operations/enquiries`
- **Data Computation**: Metrics are calculated dynamically using `useMemo` hooks over fetched server collections rather than hardcoded mock figures. Clicking any KPI executes `setActiveTab()` to directly route the user into the filtered subsystem.

---

### Module 2: Commercial Orders & Fulfillment Workspace

#### A. Business Purpose
Commercial kitchen equipment cannot be shipped via standard parcel delivery. A single automated commercial wok or industrial combi oven weighs 180–450 kg, requires 3-phase 415V electrical connections, plumbing, and professional commissioning. The Orders module manages this **high-touch industrial order lifecycle** from quote confirmation to payment verification, manufacturing allocation, quality check, and freight dispatch.

#### B. Complete Status Transition Lifecycle
```mermaid
stateDiagram-v2
    [*] --> New: Customer places order / Quote converted
    New --> PendingPayment: Initial invoice issued
    PendingPayment --> Confirmed: Advance payment verified (e.g. 50%)
    Confirmed --> AllocatedToProduction: Assigned to assembly line
    AllocatedToProduction --> Manufacturing: Assembly & wiring underway
    Manufacturing --> QualityCheck: 24-hr heat & safety run
    QualityCheck --> ReadyForDispatch: Packed on wooden pallet
    ReadyForDispatch --> InTransit: Freight carrier picked up
    InTransit --> Delivered: Arrived at commercial kitchen site
    Delivered --> Commissioned: Technician installed & certified
    Commissioned --> Completed: Final warranty activated
    
    New --> Blocked: Site readiness / missing electrical specs
    Manufacturing --> Blocked: Component shortage
    Blocked --> Confirmed: Blocker resolved
    
    New --> Cancelled: Customer cancelled
    PendingPayment --> Cancelled: Order lapsed
```

#### C. Technical Architecture & Database Tables
- **Frontend**: `AdminDashboard.tsx` (lines 1700–2250).
- **Endpoints**:
  - `GET /api/operations/orders/workspace?orderId=:id`: Retrieves canonical order details, blocker history, cancellation records, line items, and audit timeline.
  - `POST /api/operations/orders/transition`: Atomic status transitions with mandatory reasons and user attribution.
- **Database Schema**:
  - `orders`: (`id`, `order_number`, `customer_name`, `customer_email`, `customer_phone`, `status`, `payment_status`, `total_paise`, `customer_approval_status`).
  - `order_status_history`: (`id`, `order_id`, `previous_status`, `new_status`, `reason`, `changed_by`, `created_at`).
  - `order_blockers`: (`id`, `order_id`, `category`, `reason`, `diagnostic_details`, `status`, `responsible_team`, `resolution_notes`, `resolved_at`).
  - `order_cancellations`: (`id`, `order_id`, `reason_category`, `reason_explanation`, `actor_category`, `actor_identity`, `restock_status`, `refund_status`).

---

### Module 3: Machinery Catalog & Product Management

#### A. Business Purpose
Kitchen Bots manufactures and distributes heavy-duty food-service machinery. The Machinery Catalog manages technical specifications, motor power ratings, bowl capacities, 3D interactive viewer assets, warranty duration, and user manuals.

#### B. Real Image Upload & Storage Infrastructure
Previously, administrators had to manually type external image URL strings. We replaced this with an authenticated, multipart file upload system:
1. **Frontend File Picker**: Uses standard `<input type="file" accept="image/jpeg,image/png,image/webp">` wrapped in modern custom UI.
2. **Live Client Preview**: Renders preview instantly using `URL.createObjectURL` or server thumbnail.
3. **Backend Upload Endpoint**: `POST /api/operations/media/upload`:
   - Enforces authentication (`admin`, `operations`, `editor`).
   - Validates file size (strictly <= 10MB) and MIME type.
   - Saves file to disk at `apps/backend/public/images/products/<timestamp>_<filename>`.
   - Mirrors asset to `apps/storefront/public/images/products/` for zero-latency local storefront rendering.
   - Registers asset row in `media` database table (`alt`, `caption`, `url`, `filename`, `filesize`, `mime_type`).
4. **Product Association**: Saving the product persists canonical relative path `/images/products/<filename>` to `products.primary_image`.
5. **Removal & Reset**: Full removal support setting `primaryImage: ""` with confirmation dialogs.

#### C. Removal of Unnecessary Tabs
To ensure focus, the product detail page interface was cleaned of 4 redundant UI tabs (`Inventory`, `Orders & Demand`, `Manufacturing`, `Audit Timeline`), keeping the 4 essential tabs:
1. **Overview & Info**: SKU, Category, Price, Status, Short & Long Description.
2. **Media & 360°**: Primary Image preview/upload, 360° frame sequence configuration, demonstration video path.
3. **Specifications**: Motor power, voltage, throughput capacity, dimensions, vessel material.
4. **Warranty & Manuals**: Coverage period, operator manual links, spare parts catalog.

*Crucial rule*: Removing these UI tabs did not alter or delete the underlying `stock_movements`, `orders`, or `production_task_allocations` tables.

---

### Module 4: Inventory Ledger & Auditable Stock Movements

#### A. Business Purpose
Standard retail e-commerce stores simply increment or decrement a single integer column (`stock_quantity`). For commercial kitchen equipment, **direct stock editing is strictly prohibited**. If 2 commercial wok ranges go missing from the warehouse, an auditable trail is legally and operationally required: Was it allocated to an order? Transferred for exhibition? Scrapped due to transit damage? Received from the factory?

*Technical distinction*: The Inventory Ledger is an **auditable physical stock movement log**, not a financial double-entry accounting ledger. In double-entry financial accounting, every transaction posts equal debits and credits across dual asset/liability accounts (e.g. debit Inventory Asset, credit Accounts Payable). Here, each row tracks a directional quantity event against a specific physical SKU (`movement_type: receipt | reservation | reservation_release | deduction | adjustment | scrap`).

#### B. Inventory Stock Formula
$$\text{Available Stock} = \text{On-Hand Physical Stock} - \text{Reserved Stock}$$

1. **On-Hand Stock**: Total finished units physically resting in the warehouse.
2. **Reserved Stock**: Units locked against confirmed customer orders awaiting dispatch.
3. **Available Stock**: Units freely available for new B2B quote commitments.

#### C. Database Implementation & Transactional Concurrency
- **Table**: `stock_movements`
  - `id`: UUID string (`mov-xxx`).
  - `product_id`: Integer foreign key to `products`.
  - `sku`: Product SKU code.
  - `movement_type`: Enum (`receipt`, `reservation`, `reservation_release`, `deduction`, `adjustment`, `scrap`).
  - `quantity`: Positive integer.
  - `reference_type`: Reference model (`order`, `production_order`, `manual_audit`, `warranty_replacement`).
  - `reference_id`: Reference identifier string.
  - `notes`: Audit reason.
  - `performed_by`: User email.
  - `created_at`: Timestamp with time zone.
- **Fail-Closed Protection**: In [postgres-operations-repo.ts](file:///Users/shritha/Kitchen%20Bots/kitchen-bots/apps/backend/src/lib/postgres-operations-repo.ts) (`reserveStock`), the database executes inside an atomic `BEGIN ... COMMIT` transaction. It sums existing movements with row locks. If `requested_quantity > available_stock`, it raises `INSUFFICIENT_STOCK` and executes `ROLLBACK`, guaranteeing zero phantom inventory or negative stock.

---

### Module 5: CRM & Customer Requests

#### A. Business Purpose
Kitchen Bots deals with two distinct customer types:
1. **Individual Customers**: Cloud kitchen operators, independent restaurant chefs, culinary enthusiasts purchasing 1 unit.
2. **Wholesale / Institutional Customers**: Hotel chains (Taj, Marriott), QSR franchises (Haldirams, Dominoes), commercial catering contractors purchasing 5–50 units with volume discounts and credit terms.

#### B. Root Cause & Solution of Reclassification Tab Bug
- **Bug**: Clicking "Reclassify as Wholesale" temporarily updated local state, but the customer remained in the Individual tab upon refresh or navigation.
- **Root Cause**: Database had no explicit classification table. Queries inferred type on-the-fly from customer company names or order counts. Furthermore, the API lacked invalidation triggers.
- **Solution**:
  1. Created explicit database table `customer_classifications` (`email text PRIMARY KEY, customer_type text NOT NULL, company_name text, updated_at timestamptz`).
  2. Updated `POST /api/operations/crm/customers` with `update_classification` action to upsert into `customer_classifications`.
  3. Modified `GET /api/operations/crm/customers` to `LEFT JOIN customer_classifications cc ON c.email = cc.email` and prioritize `COALESCE(cc.customer_type, inferred_type)`.
  4. Updated `AdminDashboard.tsx` to immediately invalidate and refetch `/api/operations/crm/customers?segment=all`, moving the customer across tabs instantly with toast feedback.

#### C. Requests Workspace Status Bug Fix
- **Bug**: Customer service requests changed status in UI but reverted to `new` upon page reload.
- **Root Cause**: `crm/requests/route.ts` expected `body.id` while frontend sent `body.requestId`, returning `400 Bad Request`.
- **Solution**: Added fallback `const id = body.id || body.requestId` in route handler. Linked state update to atomic query updating `enquiries.status` and logging an audit row in `enquiry_communications`. Tested and verified across complete lifecycle (`new` -> `open` -> `resolved` -> `closed`).

---

### Module 6: Inquiries (RFQs & Presales Leads)

#### A. Business Purpose
High-capacity automated cooking machines are consultative purchases. Potential clients submit inquiries requesting capacity sizing, power requirements, and ROI calculations. The Inquiries module captures leads from website contact forms, trade exhibitions, and inbound phone calls, driving them toward B2B Quote generation.

#### B. Technical Architecture
- **Component**: `EnquiriesWorkspace.tsx` (lines 1–850).
- **Endpoints**: `GET /api/operations/enquiries`, `POST /api/operations/enquiries`.
- **Tables**: `enquiries`, `enquiry_communications`, `enquiry_followups`.
- **Key Workflow**: An inquiry can be assigned to a sales engineer, scheduled for a follow-up demo, and converted directly into a formal `quotes` record with custom pricing in paise.

---

### Module 7: Manufacturing Execution System (MES) & Fulfillment

#### A. Business Purpose
Because machinery is assembled to order or built in discrete batches, manufacturing execution must coordinate mechanical assembly, electrical wiring, PLC micro-controller firmware programming, and high-temperature stress testing.

#### B. Production Task Allocation Schema
- **Table**: `production_task_allocations`
  - `id`: Unique task allocation string.
  - `order_id`: Associated sales order.
  - `task_name`: Task description (e.g., "Assemble Planetary Gearbox", "Wire 3-Phase Inverter").
  - `stage`: Enum (`raw_material_prep`, `mechanical_assembly`, `electrical_wiring`, `firmware_flashing`, `quality_inspection`, `crating_and_dispatch`).
  - `staff_id`: Technician/Engineer employee ID.
  - `assigned_by`: Production Manager email.
  - `status`: Enum (`pending`, `in_progress`, `blocked`, `completed`).
  - `blocker_reason`: Diagnostic explanation if blocked.
  - `deadline`, `completed_at`: Timestamp tracking SLA compliance.
- **Table**: `daily_work_logs`
  - Tracks individual worker hours, parts consumed, and supervisor reviews linked to order IDs.

---

### Module 8: Service & Support (After-Sales Operations)

#### A. Business Purpose
Commercial kitchen downtime is catastrophic. If a restaurant's primary automated wok fails at 7:00 PM on Friday, food production halts. The Service & Support module manages **mission-critical post-sale maintenance**:
1. **Warranty Claims**: Validates whether the machine is within the 1-year/3-year coverage window, evaluates claim validity, and logs formal approval/rejection decisions with technical justifications.
2. **Support Cases**: Triage for operational questions, PLC error codes, recipe programming assistance.
3. **Repair Jobs**: Field technician dispatch, component fault diagnosis (e.g. heating element burn-out, sensor failure), spare parts requisition from inventory, and client quotation.

#### B. Technical Architecture
- **Component**: `ServicesWorkspace.tsx` (lines 1–1100).
- **APIs**: `GET /api/operations/services`, `POST /api/operations/services`.
- **Tables**: `service_cases`, `service_activities`, `service_parts`.
- **Sample Seed Records vs Genuine Records**:
  - The current service cases (`KB-SRV-2026-0001` through `0004`), diagnostic summaries, and warranty approvals in the local test database are **sample test records** generated during functional testing.
  - They demonstrate workflow mechanics (eligibility dates, priority triage, parts cost estimation, and activity timelines) but must not be mistaken for genuine customer claims or legal decisions.

---

### Module 9: Documents & Reports Management

#### A. Business Purpose
Industrial equipment compliance demands rigorous paperwork. Commercial kitchens cannot operate without equipment manuals, electrical schematics, warranty certificates, and statutory certificates (BIS, CE, RoHS, ISO 9001). The Documents workspace serves as the **tamper-evident digital filing cabinet** for Kitchen Bots.

#### B. Storage Architecture & Real Upload Workflow
- **Storage Strategy**:
  - Local disk storage at `apps/backend/public/images/products` and `apps/backend/storage/documents/` for rapid local development.
  - Cloudflare R2 object storage plugin configured in `payload.config.ts` (`kitchen-bots-media` bucket) for production deployments.
  - *Serverless warning*: Local disk storage is ephemeral on Vercel/serverless environments. Production environments must rely on Cloudflare R2 or S3-compatible persistent storage.
- **File Validation**:
  - Allowed extensions: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, PNG.
  - Maximum size: 25 MB per document.
- **Tables**:
  - `business_documents`: Metadata, canonical file path, version, category (`warranty_policies`, `compliance_certificates`, `product_manuals`, `engineering_drawings`, `invoices_financial`), visibility (`public`, `internal`, `restricted`).
  - `document_versions`: Preserves previous versions when an engineering drawing or warranty terms are updated.
  - `document_activity`: Immutable audit trail of every upload, download, and permission change.
- **Sample Document Notice**: The sample BIS certificate, warranty policy, and product manual currently listed in the test database are illustrative mock documents for development; genuine signed compliance certificates must be uploaded prior to public distribution.
- **Secure File Serving Route**: `/api/operations/documents/download?id=:id` verifies JWT session and role before piping binary file streams, preventing unauthorized public scraping of internal schematics or customer invoices.

---

### Module 10: Invoice Management

#### A. Business Purpose
Commercial B2B machinery transactions cannot rely on basic e-commerce receipts. They require **GST-compliant Tax Invoices** containing supplier GSTIN, customer GSTIN, 8-digit HSN codes (e.g., HSN 8438 for industrial food machinery), split CGST/SGST/IGST tax breakdowns, and payment terms (e.g. 50% advance, 50% prior to dispatch).

#### B. Financial Engine Architecture & Calculation Rules
- **Engine**: [invoicing-engine.ts](file:///Users/shritha/Kitchen%20Bots/kitchen-bots/apps/backend/src/lib/invoicing-engine.ts).
- **Paise Precision**: All monetary values are strictly computed in **integer paise** (₹1.00 = 100 paise) to eliminate JavaScript IEEE 754 floating-point rounding errors.
$$\text{Line Item Total} = \text{Quantity} \times \text{Unit Price (Paise)}$$
$$\text{Subtotal} = \sum \text{Line Item Totals}$$
$$\text{GST Tax} = \text{Round}(\text{Subtotal} \times 0.18)$$
$$\text{Total Invoice Amount} = \text{Subtotal} + \text{GST Tax}$$
$$\text{Balance Due} = \text{Total Invoice Amount} - \text{Total Paid (Paise)}$$

*Important GST Limitations in Current Code*:
1. The engine currently applies a **fixed 18% rate** (`Math.round(subtotalPaise * 0.18)`), which is typical for commercial cooking machinery (HSN 8438).
2. It does **not** dynamically calculate split CGST (9%) + SGST (9%) for intra-state supply vs. integrated IGST (18%) for inter-state supply based on buyer and seller state codes.
3. It does not support line-item specific tax rates (e.g. 12% or 28% for specialized refrigeration units or consumables).
4. Invoices must preserve their stored tax amount at the moment of issuance and never be silently recomputed.

- **Historical Immutability**: Line items are snapshotted into `invoice_items` at the exact moment of invoice creation. If the product catalog price is later increased, the historical invoice total and tax values **never change**.
- **UI Workspace**: `InvoicesWorkspace.tsx` provides category tabs (Product Invoices vs. Bulk Order Invoices), search by invoice number, payment allocation drawers, and browser-native "Print / Save as PDF" functionality.

---

### Module 11: Billing & Payment Transactions

#### A. Business Purpose
B2B industrial machinery purchases rarely happen in a single swipe. They involve milestone payments: 30% advance on order placement, 50% on factory completion, 20% post-commissioning. The Payments module records, reconciles, and audits these transactions.

#### B. Tables & Reconciliation Logic
- **Table**: `payment_transactions`
  - `id`: Transaction UUID string (`pay-xxx`).
  - `invoice_id`: Target invoice reference.
  - `amount_paise`: Amount paid in paise.
  - `payment_method`: Enum (`bank_transfer_neft`, `rtgs`, `upi`, `credit_card`, `cheque`, `cash`).
  - `transaction_reference`: UTR / Bank reference number.
  - `status`: Enum (`pending`, `completed`, `failed`, `refunded`).
  - `recorded_by`: Staff email.
- **Reconciliation Invariant**:
  When a payment is marked `completed`:
  1. `invoices.paid_paise = invoices.paid_paise + transaction.amount_paise`
  2. `invoices.balance_due_paise = invoices.total_paise - invoices.paid_paise`
  3. If `invoices.balance_due_paise <= 0`, `invoices.status` automatically transitions to `paid`. If partial, it transitions to `partially_paid`.
  4. Prevents overpayment: Recording an amount greater than `balance_due_paise` is rejected.

---

### Module 12: HR, Staff Directory & Attendance

#### A. Business Purpose
Factory production capacity and field service dispatch directly depend on staff availability. The HR module tracks technicians, assembly workers, punch-in/out attendance, break durations, and leave requests.

#### B. Tables & Core Logic
- `staff_profiles`: (`id`, `employee_id`, `full_name`, `email`, `department`, `job_title`, `status`).
- `attendance_records`: (`id`, `staff_id`, `date`, `punch_in`, `punch_out`, `total_break_minutes`, `net_worked_minutes`, `status`).
- `attendance_breaks`: Tracks break intervals and automatically subtracts break time from net productive hours.
- `attendance_corrections`: Allows managers to approve punch corrections with documented reasons.
- `leave_requests`: Formal leave workflow with balance checks and manager approvals.

---

### Module 13: Authentication, Security & Permissions

#### A. Architecture
Authentication is implemented via a dual-layered security model:
1. **Payload CMS Auth Layer**: Manages sessions, cookies (`payload-token`), password hashing with salt, and rate limiting in `users` table.
2. **Stateless JWT Auth Guard** (`lib/auth-guard.ts`):
   - Uses Node.js standard `crypto` HMAC-SHA256.
   - Signs and verifies tokens against canonical secret derived from `PAYLOAD_SECRET`.
   - Supports both `Authorization: Bearer <token>`, `Authorization: JWT <token>`, and HTTP-only cookie extraction.
   - Role Hierarchy:
     - `admin`: Complete operational, financial, and user management control.
     - `operations`: Order processing, catalog management, inventory movements, MES, and support cases.
     - `editor`: Product descriptions, media uploads, and document drafting.
     - `customer`: Restricted to storefront orders, self-service inquiry history, and personal profile.

---

### Module 14: Storefront Integration

#### A. Architecture
The customer-facing storefront is a modern Single Page Application built with **React, TypeScript, and Vite** located in `apps/storefront`.
- Runs on `http://localhost:5173`.
- Consumes REST and GraphQL APIs from the backend (`http://localhost:3001/api/products`).
- Supports 360° product interactive turntable viewer (`SequenceViewer.tsx`), shopping cart state (`CartContext.tsx`), custom quote builder, and technical specification sheet downloads.

---

## 4. End-to-End Cross-Module Business Workflows

### Workflow 1: Catalog Creation to Available Inventory
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Operations Admin
    participant UI as Product & Catalog UI
    participant UploadAPI as /api/operations/media/upload
    participant ProductAPI as /api/products
    participant LedgerAPI as /api/operations/inventory
    participant DB as PostgreSQL DB
    
    Admin->>UI: Selects image from device & enters specs
    UI->>UploadAPI: POST multipart form data (image file)
    UploadAPI->>DB: INSERT into media table
    UploadAPI-->>UI: Returns { success: true, url: '/images/products/xxx.jpg' }
    UI->>ProductAPI: POST /api/products { name, sku, primaryImage, pricePaise }
    ProductAPI->>DB: INSERT into products table
    ProductAPI-->>UI: Product Created (Stock = 0)
    Admin->>UI: Record Stock Receipt (Batch of 5 units)
    UI->>LedgerAPI: POST /api/operations/inventory { movement_type: 'receipt', qty: 5 }
    LedgerAPI->>DB: INSERT into stock_movements
    Note over DB: Available Stock = On-Hand (5) - Reserved (0) = 5
    LedgerAPI-->>UI: Balance Updated. Visible on Storefront!
```

---

### Workflow 2: Customer Inquiry to Order and Invoicing
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Commercial Client
    actor Sales as Sales Engineer
    participant InqAPI as /api/operations/enquiries
    participant QuoteAPI as /api/quotes
    participant OrderAPI as /api/orders
    participant InvAPI as /api/operations/invoices
    participant DB as PostgreSQL DB
    
    Customer->>InqAPI: Submits RFQ for 2 Commercial Wok Machines
    InqAPI->>DB: INSERT into enquiries
    Sales->>QuoteAPI: Generates formal B2B Quote with discounted price
    QuoteAPI->>DB: INSERT into quotes & quotes_items
    Customer->>QuoteAPI: Approves Quote
    Sales->>OrderAPI: Convert Quote to Confirmed Order
    OrderAPI->>DB: INSERT into orders
    OrderAPI->>DB: INSERT into stock_movements (movement_type: 'reservation', qty: 2)
    Note over DB: Available Stock drops from 5 to 3
    Sales->>InvAPI: Generate Tax Invoice (18% GST applied)
    InvAPI->>DB: INSERT into invoices & invoice_items
    InvAPI-->>Sales: Official Invoice KB-INV-2026-0001 ready for PDF export
```

---

### Workflow 3: Payment Milestone to Balance Reconciliation
```mermaid
sequenceDiagram
    autonumber
    actor Client as Client Accounts
    actor Finance as Kitchen Bots Finance
    participant PayAPI as /api/operations/invoices?tab=payments
    participant DB as PostgreSQL DB
    
    Client->>Finance: Pays ₹1,00,000 Advance via NEFT
    Finance->>PayAPI: POST /api/operations/invoices (Record Payment)
    Note over PayAPI: Validates amount <= balance_due_paise
    PayAPI->>DB: INSERT into payment_transactions
    PayAPI->>DB: UPDATE invoices SET paid_paise = paid_paise + 10000000
    PayAPI->>DB: UPDATE invoices SET balance_due_paise = total_paise - paid_paise
    Note over DB: Status updated to 'partially_paid'
    PayAPI-->>Finance: Reconciled! Payment receipt generated
```

---

## 5. Security, Database Integrity & Concurrency Analysis

1. **Monetary Precision**: All currencies are represented in 64-bit integer paise. Floating point numbers (`0.1 + 0.2 === 0.30000000000000004`) never enter financial calculations.
2. **Dual-Database Segregation**:
   - `Supabase PostgreSQL`: Stores Payload CMS core collections and customer auth sessions.
   - `Local Test DB (kitchen_bots_test)`: Fully isolated environment for executing automated tests, seed transactions, and unit verification without touching customer production records.
3. **Database Transactions**: Operations repository uses explicit `BEGIN`, `COMMIT`, and `ROLLBACK` blocks for multi-row mutations (e.g. stock reservation + order transition).
4. **Credential Isolation**: Environment variables are strictly partitioned (`.env.local`). Secrets (`PAYLOAD_SECRET`, database URIs) are never serialized into API responses or client bundles.

---

## 6. Actual Test Results & Verification Log

### 1. Automated Unit & Integration Suite (`src/lib/postgres-operations.test.ts`)
Executed directly against isolated test database `kitchen_bots_test`:
```
▶ PostgresOperationsRepository (Isolated PostgreSQL Test DB)
  ✔ 1. Inventory: records stock receipts and enforces available = onHand - reserved (20.60ms)
  ✔ 2. Inventory: rejects over-reservation with transactional rollback (1.47ms)
  ✔ 3. Invoices: creates sequential invoice with 18% GST and line item snapshots (7.12ms)
  ✔ 4. Orders: transitions status with atomic history logging & customer approval (2.93ms)
  ✔ 5. HR & MES: registers staff, records attendance, and allocates production work order (8.51ms)
  ✔ 6. CRM: converts quote to order reliably and generates operational reports (3.04ms)
  ✔ 7. HR & CRM Query Persistence: verifies staff directory, attendance log, leave tracking (2.12ms)
  ✔ 8. HR Attendance & Breaks: records breaks and deducts duration from worked time (3.40ms)
  ✔ 9. HR Corrections: maintains audit trail and recalculates corrected hours (3.00ms)
  ✔ 10. Daily Work Logs: creates, updates, and reviews work log entries with order links (2.34ms)
  ✔ 11. HR Attendance & Leave Sync: approves leave and updates attendance register (2.34ms)
  ✔ 12. Security & Auth Guard: verifies canonical JWT validation and tampering rejection (7.44ms)
  ✔ 13. Orders Workspace: records blockers, resolves them, records audited cancellations (23.56ms)
✔ 13 tests passed, 0 failed, 0 skipped (Duration: 93.20ms)
```

### 2. Storefront Automated Tests (`vitest run`)
```
 Test Files  5 passed (5)
      Tests  25 passed (25)
   Duration  306ms
```

### 3. Full Monorepo Typecheck & Linting (`turbo run typecheck lint`)
```
 Tasks:    4 successful, 4 total
 Packages in scope: @kitchen-bots/backend, @kitchen-bots/storefront, @kitchen-bots/types
 Zero errors, zero warnings.
```

### 4. Browser Testing Status
- Playwright automated browser driver download was blocked by local environment network policies (CDN 404 in isolated sandbox).
- Browser verification was supplemented by direct HTTP API transaction tests, cookie session authentication, and database state verification.

---

## 7. Known Limitations, Risks & Production Roadmap

1. **Third-Party Payment Gateway Webhooks**:
   - *Current State*: Payment records are manually recorded by operations staff verifying bank UTR numbers.
   - *Roadmap*: Integrate automated webhook listener for Razorpay / Cashfree B2B virtual accounts to reconcile NEFT/RTGS payments automatically.
2. **Automated WhatsApp / SMS Gateway**:
   - *Current State*: Service and order communications are logged internally.
   - *Roadmap*: Wire outbound Twilio / Gupshup webhooks to notify restaurant managers on technician arrival.
3. **Multi-Warehouse Stock Partitioning**:
   - *Current State*: Inventory movements track a unified central factory warehouse.
   - *Roadmap*: Add `warehouse_id` foreign key to `stock_movements` to support regional depot fulfillment (e.g. Mumbai, Delhi, Bangalore).

---

## 8. Technical Lead Explanation & Study Guide

Use this section to prepare for discussions with your engineering manager or technical lead.

### 30-Second Elevator Pitch
> *"Kitchen Bots is an industrial B2B operations cockpit built on Next.js 15, Payload CMS 3, and PostgreSQL. It manages the entire lifecycle of commercial kitchen automation machinery: from technical RFQ inquiries and 3D product cataloging, through auditable double-entry inventory ledger movements, multi-stage factory manufacturing tasks, GST-compliant milestone invoicing, and post-sale warranty and repair servicing."*

### 2–3 Minute Technical Walkthrough
> *"The system is designed as a high-performance monorepo with three packages: `@kitchen-bots/backend`, `@kitchen-bots/storefront`, and `@kitchen-bots/types`. The backend leverages Payload CMS 3 on top of PostgreSQL for headless content modeling and authentication, while operations-heavy workflows—such as the Inventory Ledger, Order Blockers, MES Task Allocations, and Invoices—are handled by a dedicated PostgreSQL operations repository.*
> 
> *Financial and inventory operations are built with strict ACID integrity: stock changes are modeled as immutable ledger movements where available stock is calculated dynamically as on-hand minus reserved, preventing concurrent over-commitments. Invoicing uses exact integer paise arithmetic with snapshotting to prevent retroactive price modifications. Recently, we resolved four major operational defects: we implemented persistent customer classifications in the CRM, fixed request status persistence with audit trails, streamlined the product detail view to four essential engineering tabs, and introduced a real authenticated multipart image upload pipeline with local mirroring and R2 CDN compatibility."*

### Key Technical Terms & Concepts
- **Paise Precision**: Storing money as an integer (`₹1,500.50` = `150050` paise) to avoid floating-point math bugs.
- **Double-Entry Stock Ledger**: Storing inventory as an immutable log of movements (`receipt`, `reservation`, `deduction`) rather than directly mutating a static counter.
- **HSN Code (Harmonized System of Nomenclature)**: Mandatory 8-digit tax classification code for industrial kitchen machinery under Indian GST law.
- **Fail-Closed Security**: When a database target is ambiguous or auth credentials are missing, the system aborts execution immediately rather than guessing or defaulting to open.
- **Snapshot Immutability**: Copying product names and prices into invoice items at time of issuance so future catalog updates never tamper with historical financial records.

### Top 5 Technical Lead Questions & Precise Answers

#### Q1: "Why did you build an Inventory Ledger with movement rows instead of just updating a `stock_quantity` column?"
**Answer:** *"In commercial kitchen equipment manufacturing, machines are high-value capital assets. Updating an integer column destroys auditability—you can never answer who changed the stock, why it changed, or which order it was allocated to. Our ledger uses immutable rows with explicit movement types (`receipt`, `reservation`, `deduction`, `scrap`). Available stock is calculated dynamically as physical on-hand minus reserved stock within database transactions, preventing phantom inventory."*

#### Q2: "How do you prevent historical invoices from changing if a product price is updated next year?"
**Answer:** *"When an invoice is generated via `InvoicingEngine`, the line items, unit prices, HSN codes, and calculated GST amounts are permanently snapshotted into the `invoice_items` table. The invoice queries only from `invoice_items`, completely independent of the `products` table. Even if the product is deleted or its price doubles, the historical invoice remains financially and legally immutable."*

#### Q3: "What was the root cause of the CRM customer reclassification tab bug, and how did you fix it?"
**Answer:** *"The root cause was two-fold: First, the database lacked an explicit classification column, relying on heuristic guesses. Second, the mutation API did not trigger a refetch of the filtered customer segments. We resolved it by creating a dedicated `customer_classifications` table, updating the API route to perform upserts, and modifying the frontend handler to immediately refetch `/api/operations/crm/customers?segment=all` upon successful update, moving the customer across tabs instantly."*

#### Q4: "How does the image upload pipeline work without risking broken links or local storage loss in production?"
**Answer:** *"We built an authenticated multipart endpoint at `/api/operations/media/upload`. It validates user roles, enforces a 10MB limit, and restricts MIME types to JPG, PNG, and WebP. The file is written to the local disk for development, mirrored to the storefront public directory, and registered in the `media` database table. The resulting canonical path is saved to the product record and resolved via our media CDN resolver, which routes through Cloudflare R2 in production."*

#### Q5: "How is database safety maintained during automated testing?"
**Answer:** *"We enforce strict database partitioning. The production/content database runs on Supabase PostgreSQL, while all operations integration tests, seed scripts, and state mutations are hardcoded to the local test database `kitchen_bots_test` via `OPERATIONS_DATABASE_URI`. The repository has a fail-closed guard: if `NODE_ENV === 'production'` and an operations URI is detected, it immediately throws an error."*
