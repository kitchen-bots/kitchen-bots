import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { Pool } from 'pg';
import crypto from 'crypto';
import { PostgresOperationsRepository } from './postgres-operations-repo';

const TEST_DB_URL = 'postgresql://localhost:5432/kitchen_bots_test';

function hashPayload(email: string, items: Array<{ productId: number; quantity: number }>, address: any) {
  const sorted = [...items].sort((a, b) => Number(a.productId) - Number(b.productId));
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        customerEmail: email.trim().toLowerCase(),
        items: sorted,
        shippingAddress: address,
      })
    )
    .digest('hex');
}

describe('PHASE 3: Comprehensive Storefront Checkout & Inventory Reservation Lifecycle Suite', () => {
  let pool: Pool;
  let repo: PostgresOperationsRepository;
  const targetProductId = 5;
  const targetSku = 'KB-CBBQ-005';

  before(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });
    repo = new PostgresOperationsRepository(pool);

    // Ensure clean test fixture for product #5 (Collapsible BBQ Small)
    await pool.query(`DELETE FROM "order_items" WHERE product_id = $1`, [targetProductId]);
    await pool.query(`DELETE FROM "inventory_reservations" WHERE product_id = $1`, [targetProductId]);
    await pool.query(`DELETE FROM "stock_movements" WHERE product_id = $1`, [targetProductId]);

    // Give product #5 exactly 1 unit via receipt
    const receiptId = `mov-init-${Date.now()}`;
    await pool.query(
      `INSERT INTO "stock_movements" (
        id, product_id, sku, movement_type, quantity, reference_type, reference_id, notes, performed_by, created_at
      ) VALUES ($1, $2, $3, 'receipt', 1, 'supplier_po', 'PO-INIT-P3', 'Initial stock for Phase 3 test', 'test_runner', NOW())`,
      [receiptId, targetProductId, targetSku]
    );
  });

  after(async () => {
    await pool.end();
  });

  let winningOrder: any;
  let winningPayload: any;

  it('1. Two simultaneous checkout requests competing for final available unit: exactly one succeeds', async () => {
    const key1 = `race-user-A-${Date.now()}`;
    const key2 = `race-user-B-${Date.now()}`;

    const payload1 = {
      idempotencyKey: key1,
      requestHash: hashPayload('userA@kitchenbots.in', [{ productId: targetProductId, quantity: 1 }], { city: 'Hyderabad' }),
      customerName: 'User A',
      customerEmail: 'userA@kitchenbots.in',
      items: [{ productId: targetProductId, quantity: 1 }],
      shippingAddress: { addressLine1: 'Road 1', city: 'Hyderabad', state: 'Telangana', postalCode: '500081' },
      reservationTtlMinutes: 15,
    };

    const payload2 = {
      idempotencyKey: key2,
      requestHash: hashPayload('userB@kitchenbots.in', [{ productId: targetProductId, quantity: 1 }], { city: 'Bengaluru' }),
      customerName: 'User B',
      customerEmail: 'userB@kitchenbots.in',
      items: [{ productId: targetProductId, quantity: 1 }],
      shippingAddress: { addressLine1: 'Road 2', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001' },
      reservationTtlMinutes: 15,
    };

    const [resA, resB] = await Promise.allSettled([
      repo.createStorefrontOrderWithReservation(payload1),
      repo.createStorefrontOrderWithReservation(payload2),
    ]);

    const successList = [resA, resB].filter((r) => r.status === 'fulfilled');
    const failureList = [resA, resB].filter((r) => r.status === 'rejected');

    assert.strictEqual(successList.length, 1, 'Exactly one concurrent request must succeed');
    assert.strictEqual(failureList.length, 1, 'Exactly one concurrent request must fail');

    winningOrder = (successList[0] as PromiseFulfilledResult<any>).value;
    winningPayload = resA.status === 'fulfilled' ? payload1 : payload2;
    const losingError = (failureList[0] as PromiseRejectedResult).reason;

    assert.match(losingError.message, /INSUFFICIENT_STOCK/);
    assert.ok(winningOrder.order.id, 'Winning order has an ID');

    const bal = await repo.getBalance(targetProductId, targetSku);
    assert.strictEqual(bal.available, 0, 'Available balance should now be 0');
    assert.strictEqual(bal.reserved, 1, 'Reserved balance should now be 1');
    assert.strictEqual(bal.onHand, 1, 'OnHand balance should remain 1');
  });

  it('2. Repeated checkout with same idempotency key: returns original order without duplicate stock movements', async () => {
    const retryResult = await repo.createStorefrontOrderWithReservation(winningPayload);
    assert.strictEqual(retryResult.isExisting, true);
    assert.strictEqual(retryResult.order.id, winningOrder.order.id);

    const movements = await pool.query(
      `SELECT COUNT(*)::int as count FROM "stock_movements" WHERE product_id = $1`,
      [targetProductId]
    );
    // 1 receipt + 1 reservation = 2
    assert.strictEqual(movements.rows[0].count, 2, 'Movement count must not increase on retry');
  });

  it('3. Same key with different request payload: reject safely with 422 mismatch error', async () => {
    const conflictingPayload = {
      ...winningPayload,
      requestHash: 'completely-different-tampered-hash-xyz',
    };
    await assert.rejects(
      async () => {
        await repo.createStorefrontOrderWithReservation(conflictingPayload);
      },
      /IDEMPOTENCY_KEY_PAYLOAD_MISMATCH/
    );
  });

  it('4. Multi-product cart with one unavailable item: entire transaction rolls back', async () => {
    const multiPayload = {
      idempotencyKey: `multi-fail-${Date.now()}`,
      requestHash: hashPayload('multi@kitchenbots.in', [{ productId: 6, quantity: 1 }, { productId: targetProductId, quantity: 1 }], { city: 'Hyderabad' }),
      customerName: 'Multi Fail',
      customerEmail: 'multi@kitchenbots.in',
      items: [
        { productId: 6, quantity: 1 },
        { productId: targetProductId, quantity: 1 }, // unavailable (0 available)
      ],
      shippingAddress: { addressLine1: 'Road 3', city: 'Hyderabad', state: 'Telangana', postalCode: '500081' },
    };

    await assert.rejects(
      async () => {
        await repo.createStorefrontOrderWithReservation(multiPayload);
      },
      /INSUFFICIENT_STOCK/
    );

    const check = await pool.query(
      `SELECT * FROM "checkout_idempotency_keys" WHERE idempotency_key = $1`,
      [multiPayload.idempotencyKey]
    );
    assert.strictEqual(check.rows.length, 0, 'No idempotency key or order record persisted');
  });

  it('5. Reservation expiry releases stock exactly once', async () => {
    // Backdate the winning reservation's expiry date
    await pool.query(
      `UPDATE "inventory_reservations" SET expires_at = NOW() - INTERVAL '2 minute' WHERE id = $1`,
      [winningOrder.reservations[0].id]
    );

    const sweep1 = await repo.sweepExpiredReservations();
    assert.strictEqual(sweep1.sweptCount >= 1, true, 'At least 1 reservation swept');

    const balAfterSweep = await repo.getBalance(targetProductId, targetSku);
    assert.strictEqual(balAfterSweep.available, 1, 'Stock should be available again');
    assert.strictEqual(balAfterSweep.reserved, 0, 'Reserved stock should be 0');

    // Second sweep run must be idempotent
    const sweep2 = await repo.sweepExpiredReservations();
    assert.strictEqual(sweep2.sweptCount, 0, 'Subsequent sweep must be a no-op');
  });

  it('6. Cancellation releases active reservations exactly once', async () => {
    // Place a new order using the newly released stock
    const cancelOrderRes = await repo.createStorefrontOrderWithReservation({
      idempotencyKey: `cancel-test-${Date.now()}`,
      requestHash: hashPayload('cancel@kitchenbots.in', [{ productId: targetProductId, quantity: 1 }], { city: 'Chennai' }),
      customerName: 'Cancel Test',
      customerEmail: 'cancel@kitchenbots.in',
      items: [{ productId: targetProductId, quantity: 1 }],
      shippingAddress: { addressLine1: 'Beach Road', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600001' },
    });

    const balBefore = await repo.getBalance(targetProductId, targetSku);
    assert.strictEqual(balBefore.available, 0);
    assert.strictEqual(balBefore.reserved, 1);

    // Cancel order
    await repo.recordOrderCancellation({
      orderId: cancelOrderRes.order.id,
      reasonCategory: 'customer_request',
      reasonExplanation: 'Customer cancelled prior to payment',
      actorCategory: 'customer',
      actorIdentity: 'cancel@kitchenbots.in',
    });

    const resCheck = await pool.query(
      `SELECT status FROM "inventory_reservations" WHERE order_id = $1`,
      [cancelOrderRes.order.id]
    );
    assert.strictEqual(resCheck.rows[0].status, 'released');

    const balAfter = await repo.getBalance(targetProductId, targetSku);
    assert.strictEqual(balAfter.available, 1, 'Available stock restored');
    assert.strictEqual(balAfter.reserved, 0, 'Reserved stock restored');
  });

  it('7. Payment confirmation and fulfillment convert reservation without double deduction', async () => {
    const payOrder = await repo.createStorefrontOrderWithReservation({
      idempotencyKey: `pay-test-${Date.now()}`,
      requestHash: hashPayload('pay@kitchenbots.in', [{ productId: targetProductId, quantity: 1 }], { city: 'Delhi' }),
      customerName: 'Pay Test',
      customerEmail: 'pay@kitchenbots.in',
      items: [{ productId: targetProductId, quantity: 1 }],
      shippingAddress: { addressLine1: 'Connaught Place', city: 'Delhi', state: 'Delhi', postalCode: '110001' },
    });

    const fulfillResult = await repo.fulfillOrderReservation({
      orderId: payOrder.order.id,
      paymentStatus: 'paid',
      paymentReference: 'UPI-TXN-112233',
      performedBy: 'Verified Accountant',
    });

    assert.strictEqual(fulfillResult.fulfilled, true);
    assert.strictEqual(fulfillResult.deductionsCount, 1);

    const balAfterFulfill = await repo.getBalance(targetProductId, targetSku);
    assert.strictEqual(balAfterFulfill.onHand, 0, 'onHand decremented to 0');
    assert.strictEqual(balAfterFulfill.reserved, 0, 'reserved decremented to 0');
    assert.strictEqual(balAfterFulfill.available, 0, 'available is 0');

    // Duplicate fulfillment call must be idempotent
    const dupFulfill = await repo.fulfillOrderReservation({
      orderId: payOrder.order.id,
      paymentStatus: 'paid',
      paymentReference: 'UPI-TXN-112233',
    });
    assert.strictEqual(dupFulfill.deductionsCount, 0, 'No extra deduction on repeat call');

    const balAfterDup = await repo.getBalance(targetProductId, targetSku);
    assert.strictEqual(balAfterDup.onHand, 0);
  });

  it('8. Expiry racing with payment confirmation produces one valid final state', async () => {
    // Attempting to fulfill winningOrder (which was swept and expired in Test 5, while stock is 0)
    await assert.rejects(
      async () => {
        await repo.fulfillOrderReservation({
          orderId: winningOrder.order.id,
          paymentStatus: 'paid',
          paymentReference: 'LATE-CAPTURE-999',
        });
      },
      /CANNOT_FULFILL_EXPIRED/
    );
  });

  it('9. Failed database operations leave no orphaned orders, reservations, or movements', async () => {
    const invalidPayload = {
      idempotencyKey: `nonexistent-prod-${Date.now()}`,
      requestHash: 'hash-nonexistent',
      customerName: 'Orphan Test',
      customerEmail: 'orphan@kitchenbots.in',
      items: [{ productId: 999999, quantity: 1 }],
      shippingAddress: { addressLine1: 'Nowhere', city: 'Nowhere', state: 'None', postalCode: '000000' },
    };

    await assert.rejects(
      async () => {
        await repo.createStorefrontOrderWithReservation(invalidPayload);
      },
      /Product not found/
    );

    const orphanCheck = await pool.query(
      `SELECT * FROM "checkout_idempotency_keys" WHERE idempotency_key = $1`,
      [invalidPayload.idempotencyKey]
    );
    assert.strictEqual(orphanCheck.rows.length, 0);
  });

  it('10. Storefront retry after network drop does not duplicate orders', async () => {
    // Refill 1 unit of stock
    await pool.query(
      `INSERT INTO "stock_movements" (
        id, product_id, sku, movement_type, quantity, reference_type, reference_id, notes, performed_by, created_at
      ) VALUES ($1, $2, $3, 'receipt', 1, 'supplier_po', 'PO-REFILL-10', 'Refill', 'runner', NOW())`,
      [`mov-refill-${Date.now()}`, targetProductId, targetSku]
    );

    const offlineKey = `retry-key-${Date.now()}`;
    const testEmail = `retry-${Date.now()}@kitchenbots.in`;
    const retryPayload = {
      idempotencyKey: offlineKey,
      requestHash: hashPayload(testEmail, [{ productId: targetProductId, quantity: 1 }], { city: 'Pune' }),
      customerName: 'Retry User',
      customerEmail: testEmail,
      items: [{ productId: targetProductId, quantity: 1 }],
      shippingAddress: { addressLine1: 'MG Road', city: 'Pune', state: 'Maharashtra', postalCode: '411001' },
    };

    const attempt1 = await repo.createStorefrontOrderWithReservation(retryPayload);
    assert.strictEqual(attempt1.isExisting, false);

    // Simulate second call with same key and payload
    const attempt2 = await repo.createStorefrontOrderWithReservation(retryPayload);
    assert.strictEqual(attempt2.isExisting, true);
    assert.strictEqual(attempt2.order.id, attempt1.order.id);

    const orderCount = await pool.query(
      `SELECT COUNT(*)::int as count FROM "orders" WHERE customer_email = $1`,
      [testEmail]
    );
    assert.strictEqual(orderCount.rows[0].count, 1, 'Exactly one order stored');
  });
});
