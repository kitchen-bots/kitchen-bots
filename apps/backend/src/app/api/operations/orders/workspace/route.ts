import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';

const repo = new PostgresOperationsRepository();

// GET /api/operations/orders/workspace?orderId=123
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const orderIdStr = searchParams.get('orderId');

  try {
    if (orderIdStr) {
      const orderId = Number(orderIdStr);
      const [blockers, cancellations, timeline] = await Promise.all([
        repo.getOrderBlockers(orderId),
        repo.getOrderCancellations(orderId),
        repo.getOrderActivityTimeline(orderId),
      ]);
      return NextResponse.json({
        success: true,
        orderId,
        blockers,
        cancellations,
        timeline,
      });
    }

    const pool = (repo as unknown as { pool: { query: Function } }).pool;
    const [allBlockers, allCancellations, allOrdersRes] = await Promise.all([
      repo.getOrderBlockers(),
      repo.getOrderCancellations(),
      pool.query(`
        SELECT 
          id, 
          order_number as "orderNumber", 
          customer_name as "customerName", 
          customer_email as "customerEmail", 
          customer_phone as "customerPhone", 
          status, 
          payment_status as "paymentStatus", 
          total_paise as "totalPaise", 
          customer_approval_status as "customerApprovalStatus", 
          customer_approval_notes as "customerApprovalNotes", 
          notes, 
          created_at as "createdAt", 
          updated_at as "updatedAt"
        FROM "orders" 
        ORDER BY created_at DESC 
        LIMIT 100
      `),
    ]);

    return NextResponse.json({
      success: true,
      orders: allOrdersRes.rows,
      blockers: allBlockers,
      cancellations: allCancellations,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query order workspace data';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/operations/orders/workspace
// Action: 'record_blocker' | 'resolve_blocker' | 'cancel_order'
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations'])) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'record_blocker') {
      const { orderId, category, reason, diagnosticDetails, responsibleTeam, nextAction } = body;
      if (!orderId || !category || !reason) {
        return NextResponse.json({ error: 'Missing required fields: orderId, category, reason' }, { status: 400 });
      }
      const blocker = await repo.recordOrderBlocker({
        orderId: Number(orderId),
        category,
        reason,
        diagnosticDetails,
        responsibleTeam,
        nextAction,
      });
      return NextResponse.json({ success: true, blocker });
    }

    if (action === 'resolve_blocker') {
      const { blockerId, resolutionNotes } = body;
      if (!blockerId) {
        return NextResponse.json({ error: 'Missing required field: blockerId' }, { status: 400 });
      }
      const resolved = await repo.resolveOrderBlocker({
        blockerId,
        resolutionNotes,
      });
      return NextResponse.json({ success: true, blocker: resolved });
    }

    if (action === 'cancel_order') {
      const { orderId, reasonCategory, reasonExplanation, actorCategory, actorIdentity, refundStatus, restockStatus } = body;
      if (!orderId || !reasonCategory || !actorCategory) {
        return NextResponse.json({ error: 'Missing required fields: orderId, reasonCategory, actorCategory' }, { status: 400 });
      }
      const cancellation = await repo.recordOrderCancellation({
        orderId: Number(orderId),
        reasonCategory,
        reasonExplanation,
        actorCategory,
        actorIdentity: actorIdentity || user?.email,
        refundStatus,
        restockStatus,
      });
      return NextResponse.json({ success: true, cancellation });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Operation failed';
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
