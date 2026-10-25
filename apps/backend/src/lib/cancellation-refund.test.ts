import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { PostgresOperationsRepository } from './postgres-operations-repo';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URI ||
  'postgresql://localhost:5432/kitchen_bots_test';

describe('Cancellation and Refund State Transitions', () => {
  let pool: Pool;
  let repo: PostgresOperationsRepository;
  const createdOrderIds: number[] = [];

  before(async () => {
    pool = new Pool({ connectionString: TEST_DATABASE_URL });
    repo = new PostgresOperationsRepository(pool);
  });

  after(async () => {
    if (createdOrderIds.length > 0) {
      await pool.query('DELETE FROM "stock_movements" WHERE reference_type = \'order\' AND reference_id = ANY($1)', [createdOrderIds.map(String)]);
      await pool.query('DELETE FROM "order_status_history" WHERE order_id = ANY($1)', [createdOrderIds]);
      await pool.query('DELETE FROM "order_cancellations" WHERE order_id = ANY($1)', [createdOrderIds]);
      await pool.query('DELETE FROM "inventory_reservations" WHERE order_id = ANY($1)', [createdOrderIds]);
      await pool.query('DELETE FROM "orders" WHERE id = ANY($1)', [createdOrderIds]);
    }
    await pool.end();
  });

  it('1. Unpaid order cancellation must force refund_status to "not_applicable"', async () => {
    const ordRes = await pool.query(
      `INSERT INTO "orders" (
        order_number, customer_name, customer_email, total_paise, payment_status, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'pending', 'pending', NOW(), NOW())
      RETURNING id`,
      [
        `TEST-ORD-UNPAID-${Date.now()}`,
        'Unpaid Customer',
        'unpaid@test.com',
        1000000,
      ]
    );
    const orderId = ordRes.rows[0].id;
    createdOrderIds.push(orderId);

    // Add active reservation
    const resvId = `resv-${Date.now()}-1`;
    await pool.query(
      `INSERT INTO "inventory_reservations" (
        id, order_id, product_id, sku, quantity, status, expires_at, created_at, updated_at
      ) VALUES ($1, $2, 1, 'KB-WOK-001', 2, 'active', NOW() + INTERVAL '1 hour', NOW(), NOW())`,
      [resvId, orderId]
    );

    // Call cancellation requesting refund_initiated
    const cancellation = await repo.recordOrderCancellation({
      orderId,
      reasonCategory: 'customer_request',
      reasonExplanation: 'Customer cancelled unpaid draft',
      actorCategory: 'customer',
      actorIdentity: 'unpaid@test.com',
      refundStatus: 'refund_initiated',
      restockStatus: 'restocked',
    });

    assert.equal(cancellation.refund_status, 'not_applicable');

    // Verify order status updated to cancelled
    const orderCheck = await pool.query('SELECT status FROM "orders" WHERE id = $1', [orderId]);
    assert.equal(orderCheck.rows[0].status, 'cancelled');

    // Verify reservation status transitioned from active to released
    const resvCheck = await pool.query(
      'SELECT status FROM "inventory_reservations" WHERE id = $1',
      [resvId]
    );
    assert.equal(resvCheck.rows[0].status, 'released');
  });

  it('2. Paid order cancellation should record "refund_initiated" and not mark refunded without confirmation', async () => {
    const ordRes = await pool.query(
      `INSERT INTO "orders" (
        order_number, customer_name, customer_email, total_paise, payment_status, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'paid', 'confirmed', NOW(), NOW())
      RETURNING id`,
      [
        `TEST-ORD-PAID-${Date.now()}`,
        'Paid Customer',
        'paid@test.com',
        2500000,
      ]
    );
    const orderId = ordRes.rows[0].id;
    createdOrderIds.push(orderId);

    // Attempt cancellation with requested refundStatus='refunded' without actual confirmed refund
    const cancellation = await repo.recordOrderCancellation({
      orderId,
      reasonCategory: 'pre_dispatch_cancellation',
      reasonExplanation: 'Cancellation before shipping',
      actorCategory: 'administrator',
      actorIdentity: 'admin@kitchenbots.in',
      refundStatus: 'refunded',
      restockStatus: 'restocked',
    });

    // Must be refund_initiated, NOT refunded
    assert.equal(cancellation.refund_status, 'refund_initiated');

    const orderCheck = await pool.query('SELECT status FROM "orders" WHERE id = $1', [orderId]);
    assert.equal(orderCheck.rows[0].status, 'cancelled');
  });

  it('3. Inventory release operates independently of refund status', async () => {
    const ordRes = await pool.query(
      `INSERT INTO "orders" (
        order_number, customer_name, customer_email, total_paise, payment_status, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, 'pending', 'pending', NOW(), NOW())
      RETURNING id`,
      [
        `TEST-ORD-INV-${Date.now()}`,
        'Inventory Check',
        'inv@test.com',
        500000,
      ]
    );
    const orderId = ordRes.rows[0].id;
    createdOrderIds.push(orderId);

    const resvId = `resv-${Date.now()}-2`;
    await pool.query(
      `INSERT INTO "inventory_reservations" (
        id, order_id, product_id, sku, quantity, status, expires_at, created_at, updated_at
      ) VALUES ($1, $2, 1, 'KB-WOK-001', 1, 'active', NOW() + INTERVAL '1 hour', NOW(), NOW())`,
      [resvId, orderId]
    );

    const cancellation = await repo.recordOrderCancellation({
      orderId,
      reasonCategory: 'payment_failed',
      actorCategory: 'system_automation',
      actorIdentity: 'system_auto_cancel',
      restockStatus: 'restocked',
    });

    assert.equal(cancellation.refund_status, 'not_applicable');

    // Reservation is guaranteed released
    const resvCheck = await pool.query(
      'SELECT status FROM "inventory_reservations" WHERE id = $1',
      [resvId]
    );
    assert.equal(resvCheck.rows[0].status, 'released');

    // Check stock movement created with release
    const movCheck = await pool.query(
      `SELECT movement_type, quantity, sku FROM "stock_movements" 
       WHERE reference_type = 'order' AND reference_id = $1`,
      [String(orderId)]
    );
    assert.equal(movCheck.rows.length, 1);
    assert.equal(movCheck.rows[0].movement_type, 'release');
    assert.equal(movCheck.rows[0].quantity, 1);
  });
});
