import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';

const repo = new PostgresOperationsRepository();

// POST /api/operations/crm/convert-quote
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations'])) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges for order conversion' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { quoteId, shippingAddress } = body;

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing required quoteId' }, { status: 400 });
    }

    const result = await repo.convertQuoteToOrder({
      quoteId: Number(quoteId),
      shippingAddress: shippingAddress || {},
      convertedBy: user?.email || 'Operations Admin',
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Quote conversion failed';
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
