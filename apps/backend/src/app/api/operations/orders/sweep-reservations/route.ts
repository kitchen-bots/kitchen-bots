import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';

const repo = new PostgresOperationsRepository();

export async function POST(req: NextRequest) {
  // Allow internal cron callers with secret token or authenticated admin/operations users
  const authHeader = req.headers.get('authorization');
  const cronSecret = req.headers.get('x-internal-cron-token');
  const expectedSecret = process.env.INTERNAL_CRON_TOKEN || 'kb-local-cron-secret-2026';

  let isAuthorized = false;
  if (cronSecret && cronSecret === expectedSecret) {
    isAuthorized = true;
  } else {
    const user = await authenticateRequest(req);
    if (authorizeRole(user, ['admin', 'operations'])) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
  }

  try {
    const result = await repo.sweepExpiredReservations();
    return NextResponse.json({
      success: true,
      sweptCount: result.sweptCount,
      releasedMovements: result.releasedMovements,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sweeper failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
