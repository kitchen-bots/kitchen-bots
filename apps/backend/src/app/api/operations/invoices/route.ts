import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';

const repo = new PostgresOperationsRepository();

// GET /api/operations/invoices?id=... OR ?tab=payments
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Unauthorized: Operational credentials required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const tab = searchParams.get('tab');

  try {
    const pool = (repo as unknown as { pool: { query: Function } }).pool;

    if (tab === 'payments') {
      const paymentsRes = await pool.query(
        `SELECT 
          p.id,
          p.invoice_id as "invoiceId",
          p.amount_paise as "amountPaise",
          p.payment_method as "paymentMethod",
          p.transaction_reference as "transactionReference",
          p.status,
          p.recorded_by as "recordedBy",
          p.notes,
          p.created_at as "createdAt",
          i.invoice_number as "invoiceNumber",
          i.customer_name as "customerName",
          i.customer_email as "customerEmail",
          i.total_paise as "invoiceTotalPaise",
          i.paid_paise as "invoicePaidPaise",
          i.balance_due_paise as "invoiceBalanceDuePaise",
          i.status as "invoiceStatus",
          i.order_id as "orderId",
          i.billing_address as "billingAddress",
          o.order_number as "orderNumber",
          o.status as "orderStatus",
          o.payment_status as "orderPaymentStatus",
          o.customer_phone as "customerPhone",
          (
            SELECT jsonb_build_object(
              'id', oc.id,
              'reasonCategory', oc.reason_category,
              'reasonExplanation', oc.reason_explanation,
              'refundStatus', oc.refund_status,
              'createdAt', oc.created_at
            )
            FROM "order_cancellations" oc
            WHERE oc.order_id = i.order_id
            ORDER BY oc.created_at DESC
            LIMIT 1
          ) as "cancellationInfo"
        FROM "payment_transactions" p
        LEFT JOIN "invoices" i ON p.invoice_id = i.id
        LEFT JOIN "orders" o ON i.order_id = o.id
        ORDER BY p.created_at DESC`
      );
      return NextResponse.json({ payments: paymentsRes.rows, count: paymentsRes.rows.length });
    }

    if (id) {
      const inv = await pool.query(
        `SELECT i.*, 
          o.order_number,
          o.status as order_status,
          o.payment_status as order_payment_status,
          o.customer_phone,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', it.id,
                'name', it.name,
                'sku', it.sku,
                'hsnCode', it.hsn_code,
                'quantity', it.quantity,
                'unitPricePaise', it.unit_price_paise,
                'totalPaise', it.total_paise
              )
            ) FILTER (WHERE it.id IS NOT NULL), '[]'
          ) as items,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', p.id,
                'amountPaise', p.amount_paise,
                'paymentMethod', p.payment_method,
                'transactionReference', p.transaction_reference,
                'status', p.status,
                'recordedBy', p.recorded_by,
                'notes', p.notes,
                'createdAt', p.created_at
              )
            ) FILTER (WHERE p.id IS NOT NULL), '[]'
          ) as payments
         FROM "invoices" i
         LEFT JOIN "orders" o ON i.order_id = o.id
         LEFT JOIN "invoice_items" it ON i.id = it.invoice_id
         LEFT JOIN "payment_transactions" p ON i.id = p.invoice_id
         WHERE i.id = $1
         GROUP BY i.id, o.order_number, o.status, o.payment_status, o.customer_phone`,
        [id]
      );
      if (inv.rows.length === 0) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      return NextResponse.json({ invoice: inv.rows[0] });
    }

    const all = await pool.query(
      `SELECT i.*, 
        o.order_number,
        o.status as order_status,
        o.payment_status as order_payment_status,
        o.customer_phone,
        (SELECT COUNT(*)::integer FROM "invoice_items" WHERE invoice_id = i.id) as item_count,
        (SELECT COUNT(*)::integer FROM "payment_transactions" WHERE invoice_id = i.id) as payment_count,
        (
          SELECT json_agg(json_build_object('name', it.name, 'sku', it.sku, 'quantity', it.quantity, 'unitPricePaise', it.unit_price_paise, 'totalPaise', it.total_paise))
          FROM "invoice_items" it WHERE it.invoice_id = i.id
        ) as items_summary
       FROM "invoices" i
       LEFT JOIN "orders" o ON i.order_id = o.id
       ORDER BY i.issued_at DESC`
    );
    return NextResponse.json({ invoices: all.rows, count: all.rows.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query invoices';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/operations/invoices
// Action: 'create' from order | 'payment' for recording receipt | 'update_payment_status' | 'add_payment_note'
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations'])) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges for billing modifications' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const pool = (repo as unknown as { pool: { query: Function } }).pool;

    if (action === 'create') {
      const { orderId, orderNumber, customerName, customerEmail, billingAddress, lineItems, dueDays } = body;
      const invoice = await repo.createInvoice({
        orderId: orderId ? Number(orderId) : undefined,
        orderNumber: orderNumber || 'Direct Invoice',
        customerName,
        customerEmail,
        billingAddress: billingAddress || {},
        lineItems: lineItems || [],
        dueDays: dueDays ? Number(dueDays) : 15,
      });
      return NextResponse.json({ success: true, invoice }, { status: 201 });
    }

    if (action === 'payment') {
      const { invoiceId, amountPaise, paymentMethod, transactionReference, recordedBy, notes } = body;
      const result = await repo.recordPayment({
        invoiceId,
        amountPaise: Number(amountPaise),
        paymentMethod,
        transactionReference,
        recordedBy: recordedBy || user?.email || 'Finance Desk',
        notes,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'update_payment_status') {
      const { paymentId, newStatus, reason } = body;
      if (!paymentId || !newStatus) {
        return NextResponse.json({ error: 'paymentId and newStatus are required' }, { status: 400 });
      }
      // Must match payment_transactions_status_check in the database.
      const validStatuses = ['pending', 'success', 'failed'];
      if (!validStatuses.includes(newStatus)) {
        return NextResponse.json({ error: `Invalid payment status: ${newStatus}` }, { status: 400 });
      }

      const updateRes = await pool.query(
        `UPDATE "payment_transactions"
         SET status = $1, notes = COALESCE(notes || E'\\n', '') || $2
         WHERE id = $3
         RETURNING *`,
        [newStatus, `[${new Date().toISOString()}] Status changed to ${newStatus} by ${user?.email || 'Staff'}${reason ? `: ${reason}` : ''}`, paymentId]
      );
      if (updateRes.rows.length === 0) {
        return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, payment: updateRes.rows[0] });
    }

    if (action === 'add_payment_note') {
      const { paymentId, note } = body;
      if (!paymentId || typeof note !== 'string' || !note.trim()) {
        return NextResponse.json({ error: 'paymentId and note are required' }, { status: 400 });
      }
      const noteEntry = `[${new Date().toISOString()}] ${user?.email || 'Staff'}: ${note.trim()}`;
      const updateRes = await pool.query(
        `UPDATE "payment_transactions"
         SET notes = COALESCE(notes || E'\\n', '') || $1
         WHERE id = $2
         RETURNING *`,
        [noteEntry, paymentId]
      );
      if (updateRes.rows.length === 0) {
        return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, payment: updateRes.rows[0] });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invoicing action failed';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
