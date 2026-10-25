import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';

const repo = new PostgresOperationsRepository();

// POST /api/operations/orders/transition
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations'])) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { orderId, newStatus, reason } = body;

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'Missing required orderId or newStatus' }, { status: 400 });
    }

    const result = await repo.transitionOrderStatus({
      orderId: Number(orderId),
      newStatus,
      changedBy: user?.email || 'Operations Admin',
      reason,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Transition failed';
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
