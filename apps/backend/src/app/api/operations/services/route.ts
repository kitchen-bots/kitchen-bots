import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';
import type { ServiceCase, ServiceMetrics, ServiceDetailResponse } from '@kitchen-bots/types';

const repo = new PostgresOperationsRepository();

function normalizeCase(row: any): ServiceCase {
  return {
    id: row.id,
    reference: row.reference,
    type: row.type,
    customerId: row.customer_id,
    customerName: row.customer_name || 'Customer',
    customerEmail: row.customer_email || '',
    customerPhone: row.customer_phone || '',
    companyName: row.company_name || '',
    productId: row.product_id,
    productName: row.product_name || '',
    productSku: row.product_sku || '',
    serialNumber: row.serial_number || '',
    orderId: row.order_id,
    orderReference: row.order_reference || '',
    purchaseDate: row.purchase_date ? new Date(row.purchase_date).toISOString() : undefined,
    warrantyStartDate: row.warranty_start_date ? new Date(row.warranty_start_date).toISOString() : undefined,
    warrantyExpiryDate: row.warranty_expiry_date ? new Date(row.warranty_expiry_date).toISOString() : undefined,
    warrantyStatus: row.warranty_status || 'unverified',
    subject: row.subject || '',
    category: row.category || 'General',
    description: row.description || '',
    status: row.status || 'new',
    priority: row.priority || 'normal',
    assignedTo: row.assigned_to || '',
    assignedTechnician: row.assigned_technician || '',
    dueDate: row.due_date ? new Date(row.due_date).toISOString() : undefined,
    resolutionSummary: row.resolution_summary || '',
    resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : undefined,
    resolvedBy: row.resolved_by || '',
    warrantyDecision: row.warranty_decision || undefined,
    warrantyDecisionReason: row.warranty_decision_reason || '',
    warrantyDecisionBy: row.warranty_decision_by || '',
    warrantyDecisionAt: row.warranty_decision_at ? new Date(row.warranty_decision_at).toISOString() : undefined,
    approvedResolution: row.approved_resolution || undefined,
    repairStage: row.repair_stage || '',
    diagnosedFault: row.diagnosed_fault || '',
    probableCause: row.probable_cause || '',
    partsEstimatePaise: parseInt(row.parts_estimate_paise || '0', 10),
    labourEstimatePaise: parseInt(row.labour_estimate_paise || '0', 10),
    totalEstimatePaise: parseInt(row.total_estimate_paise || '0', 10),
    customerApproved: Boolean(row.customer_approved),
    customerApprovedAt: row.customer_approved_at ? new Date(row.customer_approved_at).toISOString() : undefined,
    qualityChecked: Boolean(row.quality_checked),
    qualityCheckedBy: row.quality_checked_by || '',
    qualityCheckedAt: row.quality_checked_at ? new Date(row.quality_checked_at).toISOString() : undefined,
    qualityCheckNotes: row.quality_check_notes || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

// GET /api/operations/services
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Unauthorized: Operational credentials required' }, { status: 401 });
  }

  try {
    const pool = (repo as unknown as { pool: { query: Function } }).pool;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const caseRes = await pool.query('SELECT * FROM "service_cases" WHERE id = $1', [id]);
      if (caseRes.rows.length === 0) {
        return NextResponse.json({ error: 'Service case not found' }, { status: 404 });
      }

      const caseRecord = normalizeCase(caseRes.rows[0]);

      const [actRes, partsRes, prodRes, ordRes] = await Promise.all([
        pool.query('SELECT * FROM "service_activities" WHERE service_id = $1 ORDER BY created_at ASC', [id]),
        pool.query('SELECT * FROM "service_parts" WHERE service_id = $1 ORDER BY created_at ASC', [id]),
        caseRecord.productId ? pool.query('SELECT id, name, sku FROM "products" WHERE id = $1', [caseRecord.productId]) : Promise.resolve({ rows: [] }),
        caseRecord.orderId ? pool.query('SELECT id, order_number, total_paise, created_at, status FROM "orders" WHERE id = $1', [caseRecord.orderId]) : Promise.resolve({ rows: [] }),
      ]);

      const activities = actRes.rows.map((r: any) => ({
        id: r.id,
        serviceId: r.service_id,
        type: r.type,
        title: r.title,
        content: r.content,
        author: r.author,
        createdAt: new Date(r.created_at).toISOString(),
      }));

      const parts = partsRes.rows.map((r: any) => ({
        id: r.id,
        serviceId: r.service_id,
        productId: r.product_id,
        partSku: r.part_sku,
        partName: r.part_name,
        quantity: r.quantity,
        unitPricePaise: parseInt(r.unit_price_paise || '0', 10),
        status: r.status,
        createdAt: new Date(r.created_at).toISOString(),
      }));

      const response: ServiceDetailResponse = {
        caseRecord,
        activities,
        parts,
        linkedProduct: prodRes.rows[0] || null,
        linkedOrder: ordRes.rows[0] || null,
      };

      return NextResponse.json(response);
    }

    // List all cases and metrics
    const casesRes = await pool.query('SELECT * FROM "service_cases" ORDER BY created_at DESC');
    const cases = casesRes.rows.map(normalizeCase);

    const now = Date.now();
    const metrics: ServiceMetrics = {
      totalCases: cases.length,
      newAwaitingReview: cases.filter((c: ServiceCase) => c.status === 'new').length,
      openInProgress: cases.filter((c: ServiceCase) => ['in_progress', 'investigating', 'diagnosed', 'testing'].includes(c.status)).length,
      pendingWarrantyDecisions: cases.filter((c: ServiceCase) => c.type === 'warranty' && c.warrantyDecision === 'pending').length,
      approvedWarrantyClaims: cases.filter((c: ServiceCase) => c.type === 'warranty' && c.warrantyDecision === 'approved').length,
      repairsInProgress: cases.filter((c: ServiceCase) => c.type === 'repair' && ['in_progress', 'diagnosed', 'awaiting_parts'].includes(c.status)).length,
      awaitingCustomerResponse: cases.filter((c: ServiceCase) => c.status === 'awaiting_customer').length,
      overdueCases: cases.filter((c: ServiceCase) => c.dueDate && new Date(c.dueDate).getTime() < now && !['resolved', 'closed', 'rejected', 'cancelled'].includes(c.status)).length,
      resolvedClosedCases: cases.filter((c: ServiceCase) => ['resolved', 'closed'].includes(c.status)).length,
    };

    return NextResponse.json({
      cases,
      metrics,
    });
  } catch (err: any) {
    console.error('Failed to query services:', err);
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}

// POST /api/operations/services
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Unauthorized: Operational credentials required' }, { status: 401 });
  }

  try {
    const pool = (repo as unknown as { pool: { query: Function } }).pool;
    const body = await req.json();
    const { action } = body;
    const userName = (user as any)?.name || user?.email || 'Operations Admin';

    if (action === 'create_case') {
      const {
        type, customerName, customerEmail, customerPhone, companyName,
        productId, productName, productSku, serialNumber, orderId, orderReference,
        purchaseDate, subject, category, description, priority, assignedTo
      } = body;

      if (!type || !customerName || !customerEmail || !subject || !description) {
        return NextResponse.json({ error: 'Type, Customer Name, Email, Subject, and Description are required' }, { status: 400 });
      }

      const prefix = type === 'warranty' ? 'KB-WAR' : type === 'repair' ? 'KB-REP' : 'KB-SUP';
      const reference = `${prefix}-${Date.now().toString(36).toUpperCase()}`;

      // Check order for purchase date if provided
      let finalPurchaseDate = purchaseDate ? new Date(purchaseDate) : null;
      let warrantyExpiry = null;
      let warrantyStatus = 'unverified';

      if (orderId) {
        const oRes = await pool.query('SELECT created_at FROM "orders" WHERE id = $1', [orderId]);
        if (oRes.rows.length > 0) {
          finalPurchaseDate = new Date(oRes.rows[0].created_at);
          // Standard 1 year warranty
          warrantyExpiry = new Date(finalPurchaseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
          warrantyStatus = warrantyExpiry.getTime() > Date.now() ? 'active' : 'expired';
        }
      }

      const insertRes = await pool.query(
        `INSERT INTO "service_cases" (
          reference, type, customer_name, customer_email, customer_phone, company_name,
          product_id, product_name, product_sku, serial_number, order_id, order_reference,
          purchase_date, warranty_start_date, warranty_expiry_date, warranty_status,
          subject, category, description, status, priority, assigned_to,
          warranty_decision, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'new', $20, $21, $22, NOW(), NOW()
        ) RETURNING *`,
        [
          reference, type, customerName.trim(), customerEmail.trim().toLowerCase(), customerPhone || null, companyName || null,
          productId || null, productName || null, productSku || null, serialNumber || null, orderId || null, orderReference || null,
          finalPurchaseDate, finalPurchaseDate, warrantyExpiry, warrantyStatus,
          subject.trim(), category || 'General', description.trim(), priority || 'normal', assignedTo || null,
          type === 'warranty' ? 'pending' : null
        ]
      );

      const created = insertRes.rows[0];

      // Add initial activity
      await pool.query(
        `INSERT INTO "service_activities" (service_id, type, title, content, author, created_at)
         VALUES ($1, 'status_change', 'Case Created', $2, $3, NOW())`,
        [created.id, `${type.toUpperCase()} case initiated by staff.`, userName]
      );

      return NextResponse.json({ success: true, caseRecord: normalizeCase(created) });
    }

    if (action === 'update_status') {
      const { serviceId, status } = body;
      if (!serviceId || !status) {
        return NextResponse.json({ error: 'serviceId and status are required' }, { status: 400 });
      }

      await pool.query('UPDATE "service_cases" SET status = $1, updated_at = NOW() WHERE id = $2', [status, serviceId]);

      await pool.query(
        `INSERT INTO "service_activities" (service_id, type, title, content, author, created_at)
         VALUES ($1, 'status_change', 'Status Updated', $2, $3, NOW())`,
        [serviceId, `Service case status updated to: ${status.toUpperCase().replace('_', ' ')}`, userName]
      );

      return NextResponse.json({ success: true, status });
    }

    if (action === 'warranty_decision') {
      const { serviceId, decision, reason, approvedResolution } = body;
      if (!serviceId || !decision) {
        return NextResponse.json({ error: 'serviceId and decision are required' }, { status: 400 });
      }
      if (decision === 'rejected' && (!reason || reason.trim().length === 0)) {
        return NextResponse.json({ error: 'A specific reason is mandatory for rejecting warranty claims.' }, { status: 400 });
      }

      const newStatus = decision === 'approved' ? 'in_progress' : decision === 'rejected' ? 'rejected' : 'investigating';

      await pool.query(
        `UPDATE "service_cases" SET
           warranty_decision = $1,
           warranty_decision_reason = $2,
           warranty_decision_by = $3,
           warranty_decision_at = NOW(),
           approved_resolution = $4,
           status = $5,
           updated_at = NOW()
         WHERE id = $6`,
        [decision, reason || null, userName, approvedResolution || null, newStatus, serviceId]
      );

      await pool.query(
        `INSERT INTO "service_activities" (service_id, type, title, content, author, created_at)
         VALUES ($1, 'decision', $2, $3, $4, NOW())`,
        [
          serviceId,
          `Warranty ${decision.toUpperCase()}`,
          `Decision by ${userName}: ${decision.toUpperCase()}. Reason/Rationale: ${reason || 'Standard coverage approval.'}${approvedResolution ? ` (Resolution: ${approvedResolution})` : ''}`,
          userName
        ]
      );

      return NextResponse.json({ success: true, decision, status: newStatus });
    }

    if (action === 'add_activity') {
      const { serviceId, type, title, content } = body;
      if (!serviceId || !content) {
        return NextResponse.json({ error: 'serviceId and content are required' }, { status: 400 });
      }

      const res = await pool.query(
        `INSERT INTO "service_activities" (service_id, type, title, content, author, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
        [serviceId, type || 'internal_note', title || 'Note', content.trim(), userName]
      );

      return NextResponse.json({ success: true, activity: res.rows[0] });
    }

    if (action === 'repair_diagnosis') {
      const { serviceId, diagnosedFault, probableCause, partsEstimatePaise, labourEstimatePaise } = body;
      if (!serviceId || !diagnosedFault) {
        return NextResponse.json({ error: 'serviceId and diagnosedFault required' }, { status: 400 });
      }

      const parts = parseInt(partsEstimatePaise || '0', 10);
      const labour = parseInt(labourEstimatePaise || '0', 10);
      const total = parts + labour;

      await pool.query(
        `UPDATE "service_cases" SET
           diagnosed_fault = $1,
           probable_cause = $2,
           parts_estimate_paise = $3,
           labour_estimate_paise = $4,
           total_estimate_paise = $5,
           status = 'diagnosed',
           updated_at = NOW()
         WHERE id = $6`,
        [diagnosedFault, probableCause || null, parts, labour, total, serviceId]
      );

      await pool.query(
        `INSERT INTO "service_activities" (service_id, type, title, content, author, created_at)
         VALUES ($1, 'troubleshooting', 'Technical Diagnosis Recorded', $2, $3, NOW())`,
        [serviceId, `Fault: ${diagnosedFault}. Probable Cause: ${probableCause || 'Wear & tear'}. Estimate: ₹${(total / 100).toLocaleString('en-IN')}`, userName]
      );

      return NextResponse.json({ success: true, totalEstimatePaise: total });
    }

    if (action === 'customer_approve_estimate') {
      const { serviceId } = body;
      if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 });

      await pool.query(
        `UPDATE "service_cases" SET
           customer_approved = TRUE,
           customer_approved_at = NOW(),
           status = 'in_progress',
           updated_at = NOW()
         WHERE id = $1`,
        [serviceId]
      );

      await pool.query(
        `INSERT INTO "service_activities" (service_id, type, title, content, author, created_at)
         VALUES ($1, 'status_change', 'Customer Estimate Approved', 'Customer explicitly approved diagnosis and repair cost estimate.', $2, NOW())`,
        [serviceId, userName]
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'quality_check') {
      const { serviceId, passed, notes } = body;
      if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 });

      const newStatus = passed ? 'ready_dispatch' : 'in_progress';
      await pool.query(
        `UPDATE "service_cases" SET
           quality_checked = $1,
           quality_checked_by = $2,
           quality_checked_at = NOW(),
           quality_check_notes = $3,
           status = $4,
           updated_at = NOW()
         WHERE id = $5`,
        [passed, userName, notes || null, newStatus, serviceId]
      );

      await pool.query(
        `INSERT INTO "service_activities" (service_id, type, title, content, author, created_at)
         VALUES ($1, 'work_log', 'Quality Control & Testing', $2, $3, NOW())`,
        [serviceId, `QC Result: ${passed ? 'PASSED — Ready for dispatch' : 'FAILED — Returned for rework'}. Notes: ${notes || 'No issues found.'}`, userName]
      );

      return NextResponse.json({ success: true, passed, status: newStatus });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Failed POST services:', err);
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}
