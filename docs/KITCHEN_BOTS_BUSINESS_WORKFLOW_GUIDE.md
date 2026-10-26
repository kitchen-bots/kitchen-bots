# Kitchen Bots — Business Workflow Guide

**Audience**: Kitchen Bots Business Owners, Operations Managers, Warehouse Supervisors, and Store Cashiers  
**Version**: 1.0.0  
**Last Updated**: October 2026

---

## 1. How Customer Orders Enter the System

1. **Online Storefront (Direct E-commerce)**:
   - A customer selects equipment (e.g. Flip BBQ Grill or Rocket Stove) on the storefront and checks out.
   - The system creates a new record in `orders` (status: `pending`, paymentStatus: `pending`).
   - Simultaneously, an atomic reservation is logged in `stock_movements` (`movementType: reservation`).
   - Available stock decreases immediately (`available = onHand - reserved`), preventing another customer from purchasing the same machine.

2. **In-Store Counter / Direct Sale (POS Workflow)**:
   - When an owner or staff member sells machinery directly at the showroom or trade counter, they execute a Direct Sale.
   - Staff selects products, enters customer details, and inputs payment method (Cash, UPI QR, Card, or Bank Transfer).
   - The system atomically:
     - Deducts inventory (`stock_movements` type: `deduction`).
     - Creates a fulfilled order (`status: delivered`, `payment_status: paid`).
     - Issues a formal tax invoice with standard 18% GST and line-item snapshots.
     - Logs a cleared payment transaction (`status: success`).
     - Prints/issues the receipt immediately.

3. **B2B Wholesale / Commercial Quotation**:
   - Institutional kitchens, hotels, and restaurant chains submit quote requests.
   - Sales staff prepares quotes in the Quotes workspace with custom negotiated pricing.
   - Once approved by the client, clicking **Convert to Order** generates the official order and matching invoice with historical snapshot integrity.

---

## 2. How Inventory and Warehouse Locations Update

1. **SKU-Level Stock Movements**:
   - All physical inventory is managed via an auditable movement ledger (`stock_movements`).
   - `receipt`: Stock received from manufacturing or tier-1 supplier (increases `onHand`).
   - `reservation`: Stock held for confirmed customer orders (increases `reserved`, decreases `available`).
   - `release`: Customer cancels order before dispatch (decreases `reserved`, increases `available`).
   - `deduction`: Equipment packed and dispatched (decreases `onHand` and `reserved`).
   - `adjustment`: Physical stock audit correction (reconciles count discrepancies).
   - `defect_scrap`: QA inspection rejects defective unit (removes from stock).

2. **Multi-Warehouse & Physical Location Tracking**:
   - Managed under `inventory_locations` (e.g. `WH-BLR-01` Bengaluru Central Assembly, `RETAIL-KOR` Koramangala Showroom).
   - Staff or barcode scans assign inventory to specific warehouse zones, racks, and bin locations.
   - The system never fakes GPS or indoor positioning: every location update requires an explicit staff action or scan.

3. **Serialized Unit Tracking**:
   - Heavy machinery and commercial robots are tracked individually in `product_units` with unique serial numbers (e.g. `KB-SN-2026-0042`).
   - Non-serialized accessories and consumables are tracked by bulk SKU quantity.
   - Serial numbers are unique in PostgreSQL; duplicate serial numbers are rejected immediately.

---

## 3. How Payments Are Recorded & Verified

1. **Cash Payments**:
   - Paid directly to the owner or cashier at the showroom.
   - Recorded with cashier identity, receipt number, and timestamp.
   - Updates invoice balance only after transaction is committed. Overpayment is blocked.
   - Does not require or ask for a bank account number.

2. **Bank NEFT / RTGS / IMPS**:
   - Customer initiates bank transfer and provides a UTR (Unique Transaction Reference).
   - Finance staff enters the UTR into the Payments Workspace.
   - The system checks for duplicate UTRs; identical references are rejected with an error.
   - When verified, the payment clears the invoice balance.

3. **Business UPI QR Code**:
   - Displayed on invoices and counter checkout.
   - Customer scans and pays via UPI app.
   - Staff verifies bank SMS / credit notification, enters UPI Reference Number into the system, and clears the transaction.
   - Note: Automated real-time UPI callbacks require an integrated payment gateway (e.g. Razorpay / Cashfree), which is currently pending merchant credential provisioning.

---

## 4. How Invoices Are Generated and Managed

1. **Sequential Invoice Generation**:
   - Invoices are generated sequentially (e.g. `INV-2026-0001`) by the PostgreSQL Operations Repository.
   - Line items, HSN codes, unit prices, and quantities are captured as an immutable snapshot. Future product price changes do not alter issued invoices.
   - Standard 18% GST (CGST + SGST or IGST) is calculated automatically.
2. **Payment Reconciliation**:
   - Payments attach to specific invoices.
   - Partial payments update `paid_paise` and leave remaining `balance_due_paise` active.
   - Full settlement transitions invoice status to `paid`.

---

## 5. Customer Enquiries & Communication Channels

1. **Website Enquiries**:
   - Inquiries from website contact and product inquiry forms enter `enquiries` immediately.
   - Staff can view, assign, follow up, and update status (`new` -> `in_progress` -> `resolved` -> `closed`).
2. **Phone, WhatsApp & In-Person Enquiries**:
   - Staff manually records customer requests and phone leads into the Enquiries Workspace.
   - Internal notes and communication logs preserve conversation history.
3. **Email Ingestion**:
   - Currently requires manual entry. Automatic ingestion of incoming emails via IMAP/SendGrid is pending corporate email server credentials.

---

## 6. After-Sales Service, Warranties, Returns & Repairs

1. **Support Case Intake**:
   - Customer reports equipment issue via support form, phone, or service desk.
   - Case created in `service_cases` linked to customer, product, order, and serial number.
2. **Warranty Adjudication**:
   - Purchase date and warranty expiry are reviewed against policy.
   - Authorized manager approves or rejects warranty coverage with a mandatory reason note.
3. **Repair & Parts Deduction**:
   - Field technician diagnoses fault, logs parts needed in `service_parts`, and records labour estimates.
   - For billable out-of-warranty repairs, parts and labour estimates are presented for customer approval before work proceeds.
   - Upon case resolution, replacement parts are deducted from spare parts inventory.

---

## 7. Cross-Module Automatic Updates

| Trigger Event | Primary Module | Automatically Updated Modules |
|:---|:---|:---|
| **E-commerce Order Placed** | Orders | **Inventory**: Adds reservation; decreases available stock.<br>**CRM**: Links order to customer profile. |
| **Order Cancelled** | Orders Workspace | **Inventory**: Releases reserved stock back to available pool.<br>**Orders**: Records audited cancellation reason. |
| **Direct POS Sale Completed** | POS Desk | **Inventory**: Immediate stock deduction.<br>**Invoicing**: Issues tax invoice.<br>**Treasury**: Records cleared payment. |
| **Payment Recorded** | Payments Workspace | **Invoicing**: Updates `paid_paise` and `balance_due_paise`.<br>**Orders**: Updates `payment_status` to paid/partial. |
| **Quote Converted** | Quotes Workspace | **Orders**: Generates confirmed commercial order.<br>**Invoicing**: Generates sequential invoice snapshot. |
| **Support Case Resolved** | Services Workspace | **CRM**: Updates customer support history timeline.<br>**Inventory**: Deducts replaced spare parts if used. |

---

## 8. What Still Requires Staff Actions & Missing Integrations

1. **Staff Actions Still Required**:
   - **Bank Transfer Verification**: Staff must match customer UTR against bank statement.
   - **Order Dispatch**: Warehouse staff must physically pick, pack, assign tracking number, and change order status to `shipped`.
   - **Warranty Decision**: Authorized supervisor must approve or reject warranty claims.
   - **Cycle Counts**: Warehouse team must perform periodic physical counts and log `adjustment` movements.

2. **Missing External Integrations**:
   - **Payment Gateway Webhook**: Real-time automated bank/UPI capture (Razorpay/Cashfree).
   - **Logistics Courier Push API**: Automated package tracking (Delhivery/BlueDart).
   - **Inbound Email Ingestion**: Automated email-to-enquiry parser (IMAP/SendGrid).
   - **WhatsApp Business API**: Automated shipping notifications to customers (Gupshup/Twilio).
