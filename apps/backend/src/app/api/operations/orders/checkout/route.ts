import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';

const repo = new PostgresOperationsRepository();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      idempotencyKey,
      customerName,
      customerEmail,
      customerPhone,
      items,
      shippingAddress,
      notes,
      reservationTtlMinutes,
    } = body;

    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid required header/body: idempotencyKey' },
        { status: 400 }
      );
    }

    if (!customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required customer details: customerName, customerEmail' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart must contain at least one valid item' },
        { status: 400 }
      );
    }

    // Sort items predictably for payload hashing
    const sortedItemsForHash = [...items].sort((a, b) => Number(a.productId) - Number(b.productId));
    const normalizedPayload = {
      customerEmail: customerEmail.trim().toLowerCase(),
      items: sortedItemsForHash.map((i: any) => ({
        productId: Number(i.productId),
        quantity: Number(i.quantity),
      })),
      shippingAddress: {
        addressLine1: shippingAddress?.addressLine1 || '',
        city: shippingAddress?.city || '',
        state: shippingAddress?.state || '',
        postalCode: shippingAddress?.postalCode || '',
      },
    };

    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(normalizedPayload))
      .digest('hex');

    const result = await repo.createStorefrontOrderWithReservation({
      idempotencyKey,
      requestHash,
      customerName,
      customerEmail,
      customerPhone,
      items,
      shippingAddress: shippingAddress || {
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
      },
      notes,
      reservationTtlMinutes,
    });

    const status = result.isExisting ? 200 : 201;
    return NextResponse.json(
      {
        success: true,
        isExisting: result.isExisting,
        order: result.order,
        items: result.items,
        reservations: result.reservations,
      },
      { status }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout failed';

    if (message.startsWith('IDEMPOTENCY_KEY_PAYLOAD_MISMATCH')) {
      return NextResponse.json(
        { error: 'Idempotency key reused with conflicting request payload' },
        { status: 422 }
      );
    }

    if (message.startsWith('INSUFFICIENT_STOCK')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (message.startsWith('UNPRICED_PRODUCT')) {
      return NextResponse.json({ error: message }, { status: 422 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
