import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';

const repo = new PostgresOperationsRepository();

// GET /api/operations/crm/requests?status=...&category=...&priority=...
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Unauthorized: Operational credentials required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const priority = searchParams.get('priority');
  const search = searchParams.get('search');

  try {
    const pool = (repo as unknown as { pool: { query: Function } }).pool;

    let query = 'SELECT * FROM "enquiries" WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(reference) LIKE $${params.length} OR LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(message) LIKE $${params.length})`;
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const res = await pool.query(query, params);

    // Map each enquiry to a rich CustomerRequest entity
    const requests = res.rows.map((row: any) => {
      // Deduce category from message keywords
      const msg = (row.message || '').toLowerCase();
      let deducedCategory = 'product_enquiry';
      if (msg.includes('quote') || msg.includes('quotation')) deducedCategory = 'quote_request';
      else if (msg.includes('price') || msg.includes('bulk') || msg.includes('wholesale')) deducedCategory = 'pricing_wholesale';
      else if (msg.includes('order') || msg.includes('status') || msg.includes('track')) deducedCategory = 'order_status';
      else if (msg.includes('ship') || msg.includes('courier') || msg.includes('delivery')) deducedCategory = 'delivery_courier';
      else if (msg.includes('invoice') || msg.includes('pay') || msg.includes('bill')) deducedCategory = 'payment_invoice';
      else if (msg.includes('install') || msg.includes('setup')) deducedCategory = 'installation';
      else if (msg.includes('warranty') || msg.includes('guarantee')) deducedCategory = 'warranty_claim';
      else if (msg.includes('repair') || msg.includes('maintenance') || msg.includes('service')) deducedCategory = 'maintenance_repair';

      // Deduce priority
      let deducedPriority = 'normal';
      if (msg.includes('urgent') || msg.includes('asap') || msg.includes('emergency')) deducedPriority = 'urgent';
      else if (deducedCategory === 'warranty_claim' || deducedCategory === 'delivery_courier') deducedPriority = 'high';

      return {
        id: row.id,
        reference: row.reference,
        customerName: row.name,
        customerEmail: row.email,
        customerPhone: row.phone || 'On Request',
        companyName: row.company || (row.city ? `${row.city} Client` : undefined),
        category: deducedCategory,
        subject: `${deducedCategory.replace(/_/g, ' ').toUpperCase()}: ${row.reference}`,
        description: row.message,
        priority: deducedPriority,
        status: row.status || 'new',
        assignedStaff: 'Customer Operations Team',
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
      };
    });

    return NextResponse.json({ requests, count: requests.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Customer requests query failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/operations/crm/requests
// Action: 'update_status'
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations'])) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const id = body.id || body.requestId;
    const { status, resolutionNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id or requestId, and status are required' }, { status: 400 });
    }

    const pool = (repo as unknown as { pool: { query: Function } }).pool;
    await pool.query(
      'UPDATE "enquiries" SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    // Record in enquiry_communications or activity trail if table exists
    const author = user?.email || 'Operations Admin';
    const note = resolutionNotes || `Request status updated to ${status.toUpperCase()} via CRM Requests Workspace`;
    await pool.query(
      `INSERT INTO enquiry_communications (enquiry_id, type, author, summary, content, created_at)
       VALUES ($1, 'status_change', $2, $3, $4, NOW())`,
      [id, author, `Status: ${status}`, note]
    ).catch(() => {});

    return NextResponse.json({ success: true, id, newStatus: status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Request update failed';
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
