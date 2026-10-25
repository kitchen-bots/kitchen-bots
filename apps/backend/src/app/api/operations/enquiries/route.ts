import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';
import type { EnquiryRecord, EnquiryStatus, EnquirySource, EnquiryPriority, EnquiryMetrics } from '@kitchen-bots/types';

const repo = new PostgresOperationsRepository();

// Helper to deduce source, priority, and rich fields from existing DB record
function normalizeEnquiry(row: any, followups: any[] = []): EnquiryRecord {
  const isDirect = Boolean(row.reference?.startsWith('DIR-') || row.reference?.startsWith('KB-DIR-'));
  const source: EnquirySource = isDirect ? 'direct' : 'website';

  const msg = (row.message || '').toLowerCase();
  let priority: EnquiryPriority = 'normal';
  if (msg.includes('urgent') || msg.includes('asap') || msg.includes('immediate') || msg.includes('emergency')) {
    priority = 'urgent';
  } else if (msg.includes('bulk') || msg.includes('restaurant') || msg.includes('commercial') || (row.company && row.company.trim().length > 0)) {
    priority = 'high';
  }

  // Derive status
  let status: EnquiryStatus = 'new';
  const rawStatus = (row.status || 'new').toLowerCase();
  if (['new', 'under_review', 'contacted', 'clarification', 'quote_in_progress', 'quote_sent', 'awaiting_response', 'converted', 'closed_won', 'closed_lost', 'spam'].includes(rawStatus)) {
    status = rawStatus as EnquiryStatus;
  } else if (rawStatus === 'in_progress') {
    status = 'quote_in_progress';
  } else if (rawStatus === 'resolved') {
    status = 'converted';
  } else if (rawStatus === 'archived') {
    status = 'closed_lost';
  }

  // Check next followup date
  const pendingFollowups = followups.filter((f) => String(f.enquiry_id) === String(row.id) && f.status === 'pending');
  const nextFollowup = pendingFollowups.sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime())[0];

  return {
    id: row.id,
    reference: row.reference || `KB-ENQ-${row.id}`,
    name: row.name || 'Anonymous Enquirer',
    email: row.email || '',
    phone: row.phone || undefined,
    company: row.company || undefined,
    city: row.city || undefined,
    message: row.message || '',
    status,
    source,
    priority,
    assignedTo: row.assigned_to || undefined,
    productOfInterest: row.product_of_interest || undefined,
    nextFollowupDate: nextFollowup?.due_date || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

// GET /api/operations/enquiries?id=...&source=direct|website|all&status=...&search=...
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Unauthorized: Operational credentials required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const enquiryId = searchParams.get('id');

  try {
    const pool = (repo as unknown as { pool: { query: Function } }).pool;

    // Detailed single enquiry dossier
    if (enquiryId) {
      const enquiryRes = await pool.query('SELECT * FROM "enquiries" WHERE id = $1 LIMIT 1', [enquiryId]);
      if (enquiryRes.rows.length === 0) {
        return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
      }

      const row = enquiryRes.rows[0];
      const email = (row.email || '').toLowerCase().trim();

      const [commsRes, followupsRes, quotesRes, ordersRes, usersRes] = await Promise.all([
        pool.query('SELECT * FROM "enquiry_communications" WHERE enquiry_id = $1 ORDER BY created_at ASC', [enquiryId]).catch(() => ({ rows: [] })),
        pool.query('SELECT * FROM "enquiry_followups" WHERE enquiry_id = $1 ORDER BY created_at DESC', [enquiryId]).catch(() => ({ rows: [] })),
        pool.query('SELECT * FROM "quotes" WHERE LOWER(contact_email) = $1 ORDER BY created_at DESC', [email]).catch(() => ({ rows: [] })),
        pool.query('SELECT * FROM "orders" WHERE LOWER(customer_email) = $1 ORDER BY created_at DESC', [email]).catch(() => ({ rows: [] })),
        pool.query('SELECT * FROM "users" WHERE LOWER(email) = $1 LIMIT 1', [email]).catch(() => ({ rows: [] })),
      ]);

      const followups = (followupsRes.rows || []).map((f: any) => ({
        id: f.id,
        enquiryId: f.enquiry_id,
        task: f.task,
        assignedTo: f.assigned_to,
        dueDate: f.due_date ? new Date(f.due_date).toISOString() : undefined,
        status: f.status,
        createdAt: new Date(f.created_at).toISOString(),
      }));

      const communications = (commsRes.rows || []).map((c: any) => ({
        id: c.id,
        enquiryId: c.enquiry_id,
        type: c.type,
        subject: c.subject,
        content: c.content,
        authorName: c.author_name,
        createdAt: new Date(c.created_at).toISOString(),
      }));

      const enquiry = normalizeEnquiry(row, followupsRes.rows || []);

      // Assemble chronological timeline
      const timeline: Array<{ id: string; type: string; title: string; description: string; timestamp: string; actor?: string }> = [];

      timeline.push({
        id: `tl-enq-submitted`,
        type: 'submission',
        title: enquiry.source === 'direct' ? 'Direct enquiry logged' : 'Website enquiry submitted',
        description: row.message || 'Customer enquiry recorded in system.',
        timestamp: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        actor: enquiry.source === 'direct' ? (row.assigned_to || 'Staff') : 'Website Visitor',
      });

      communications.forEach((c: any) => {
        timeline.push({
          id: `tl-comm-${c.id}`,
          type: c.type,
          title: c.type === 'internal_note' ? 'Internal note added' : `${c.type.toUpperCase()}: ${c.subject || 'Follow-up log'}`,
          description: c.content,
          timestamp: c.createdAt,
          actor: c.authorName,
        });
      });

      (quotesRes.rows || []).forEach((q: any) => {
        timeline.push({
          id: `tl-quote-${q.id}`,
          type: 'quote',
          title: `Quote #${q.quote_number} generated`,
          description: `Commercial quotation prepared for customer (${q.status.toUpperCase()}).`,
          timestamp: q.created_at ? new Date(q.created_at).toISOString() : new Date().toISOString(),
          actor: 'Commercial Sales',
        });
      });

      (ordersRes.rows || []).forEach((o: any) => {
        timeline.push({
          id: `tl-order-${o.id}`,
          type: 'order',
          title: `Order #${o.order_number} confirmed`,
          description: `Order value: ₹${(Number(o.total_paise || 0) / 100).toLocaleString('en-IN')}`,
          timestamp: o.created_at ? new Date(o.created_at).toISOString() : new Date().toISOString(),
          actor: 'Operations',
        });
      });

      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return NextResponse.json({
        enquiry,
        communications,
        followups,
        relatedQuotes: quotesRes.rows || [],
        relatedOrders: ordersRes.rows || [],
        linkedCustomer: usersRes.rows[0] || null,
        timeline,
      });
    }

    // List all enquiries with metric calculations
    const [allEnquiriesRes, allFollowupsRes] = await Promise.all([
      pool.query('SELECT * FROM "enquiries" ORDER BY created_at DESC'),
      pool.query('SELECT * FROM "enquiry_followups"').catch(() => ({ rows: [] })),
    ]);

    const followupsList = allFollowupsRes.rows || [];
    const enquiries = allEnquiriesRes.rows.map((row: any) => normalizeEnquiry(row, followupsList));

    const now = Date.now();
    const metrics: EnquiryMetrics = {
      total: enquiries.length,
      newEnquiries: enquiries.filter((e: EnquiryRecord) => e.status === 'new').length,
      awaitingResponse: enquiries.filter((e: EnquiryRecord) => e.status === 'awaiting_response' || e.status === 'under_review').length,
      inProgress: enquiries.filter((e: EnquiryRecord) => ['in_progress', 'quote_in_progress', 'clarification', 'contacted'].includes(e.status)).length,
      converted: enquiries.filter((e: EnquiryRecord) => e.status === 'converted' || e.status === 'closed_won').length,
      closed: enquiries.filter((e: EnquiryRecord) => ['closed_won', 'closed_lost', 'spam'].includes(e.status)).length,
      overdueFollowups: followupsList.filter((f: any) => f.status === 'pending' && f.due_date && new Date(f.due_date).getTime() < now).length,
    };

    return NextResponse.json({
      enquiries,
      metrics,
    });
  } catch (err: any) {
    console.error('Failed to query enquiries:', err);
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}

// POST /api/operations/enquiries
// Handles: create_direct, update_status, update_assignment, add_communication, add_followup, complete_followup
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Unauthorized: Operational credentials required' }, { status: 401 });
  }

  try {
    const pool = (repo as unknown as { pool: { query: Function } }).pool;
    const body = await req.json();
    const { action } = body;

    if (action === 'create_direct') {
      const { name, email, phone, company, city, message, productOfInterest, assignedTo, priority } = body;
      if (!name || !email || !message) {
        return NextResponse.json({ error: 'Name, email, and requirements message are required.' }, { status: 400 });
      }

      const reference = `KB-DIR-${Date.now().toString(36).toUpperCase()}`;
      const insertRes = await pool.query(
        `INSERT INTO "enquiries" (reference, name, email, phone, company, city, message, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [reference, name.trim(), email.trim().toLowerCase(), phone?.trim() || null, company?.trim() || null, city?.trim() || null, message.trim(), 'new']
      );

      return NextResponse.json({ success: true, enquiry: insertRes.rows[0] });
    }

    if (action === 'update_status') {
      const { enquiryId, status } = body;
      if (!enquiryId || !status) {
        return NextResponse.json({ error: 'enquiryId and status are required' }, { status: 400 });
      }

      await pool.query('UPDATE "enquiries" SET status = $1, updated_at = NOW() WHERE id = $2', [status, enquiryId]);

      // Log status change communication
      await pool.query(
        `INSERT INTO "enquiry_communications" (enquiry_id, type, subject, content, author_name, created_at)
         VALUES ($1, 'internal_note', 'Status updated', $2, $3, NOW())`,
        [enquiryId, `Enquiry status changed to ${status.toUpperCase()}`, (user as any)?.name || user?.email || 'Operations Admin']
      ).catch(() => {});

      return NextResponse.json({ success: true, status });
    }

    if (action === 'add_communication') {
      const { enquiryId, type, subject, content } = body;
      if (!enquiryId || !content) {
        return NextResponse.json({ error: 'enquiryId and content are required' }, { status: 400 });
      }

      const res = await pool.query(
        `INSERT INTO "enquiry_communications" (enquiry_id, type, subject, content, author_name, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [enquiryId, type || 'internal_note', subject || null, content.trim(), (user as any)?.name || user?.email || 'Staff']
      );

      return NextResponse.json({ success: true, communication: res.rows[0] });
    }

    if (action === 'add_followup') {
      const { enquiryId, task, assignedTo, dueDate } = body;
      if (!enquiryId || !task) {
        return NextResponse.json({ error: 'enquiryId and task are required' }, { status: 400 });
      }

      const res = await pool.query(
        `INSERT INTO "enquiry_followups" (enquiry_id, task, assigned_to, due_date, status, created_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW())
         RETURNING *`,
        [enquiryId, task.trim(), assignedTo || (user as any)?.name || user?.email || 'Staff', dueDate ? new Date(dueDate) : null]
      );

      return NextResponse.json({ success: true, followup: res.rows[0] });
    }

    if (action === 'complete_followup') {
      const { followupId } = body;
      if (!followupId) {
        return NextResponse.json({ error: 'followupId required' }, { status: 400 });
      }

      await pool.query('UPDATE "enquiry_followups" SET status = \'completed\' WHERE id = $1', [followupId]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action specified' }, { status: 400 });
  } catch (err: any) {
    console.error('Failed to process enquiry action:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
