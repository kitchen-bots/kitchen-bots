import { Pool } from 'pg';
import type { StockMovement, InventoryBalance, StockMovementType, InvoiceRecord, PaymentTransaction } from '@kitchen-bots/types';

export class PostgresOperationsRepository {
  private pool: Pool;

  constructor(poolOrConnectionString?: Pool | string) {
    if (poolOrConnectionString instanceof Pool) {
      this.pool = poolOrConnectionString;
    } else {
      const isProduction = process.env.NODE_ENV === 'production';
      let connStr: string | undefined;

      if (poolOrConnectionString) {
        connStr = poolOrConnectionString;
      } else if (process.env.OPERATIONS_DATABASE_URI) {
        if (isProduction) {
          throw new Error('OPERATIONS_DATABASE_URI is restricted to isolated test/development environments and must not be used in production');
        }
        connStr = process.env.OPERATIONS_DATABASE_URI;
      } else if (process.env.DATABASE_URI) {
        connStr = process.env.DATABASE_URI;
      } else {
        throw new Error('Database target is ambiguous: neither OPERATIONS_DATABASE_URI nor DATABASE_URI is defined. Failing closed.');
      }

      this.pool = new Pool({
        connectionString: connStr,
        max: 5,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 10000,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 1. INVENTORY MOVEMENTS & BALANCES
  // ---------------------------------------------------------------------------

  /**
   * Record a new stock movement with transactional balance safeguards
   */
  public async recordStockMovement(params: {
    productId: number;
    sku: string;
    movementType: StockMovementType;
    quantity: number;
    referenceType?: 'order' | 'supplier_po' | 'cycle_count' | 'qa_inspection';
    referenceId?: string;
    notes?: string;
    performedBy?: string;
  }): Promise<StockMovement> {
    if (params.quantity <= 0) {
      throw new Error(`Movement quantity must be positive, got ${params.quantity}`);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN;');

      // Lock current product movements to ensure transactional concurrency
      await client.query(
        'SELECT id FROM "products" WHERE id = $1 FOR UPDATE',
        [params.productId]
      );

      // Calculate current balance inside transaction
      const balance = await this.getBalanceInsideTx(client, params.productId, params.sku);

      if (params.movementType === 'reservation' && params.quantity > balance.available) {
        throw new Error(
          `Insufficient available stock for ${params.sku}. Requested: ${params.quantity}, Available: ${balance.available} (On Hand: ${balance.onHand}, Reserved: ${balance.reserved})`
        );
      }

      if (params.movementType === 'deduction' && params.quantity > balance.onHand) {
        throw new Error(
          `Cannot deduct ${params.quantity} from ${params.sku}. On-hand inventory is only ${balance.onHand}.`
        );
      }

      if (params.movementType === 'release' && params.quantity > balance.reserved) {
        throw new Error(
          `Cannot release ${params.quantity} for ${params.sku}. Currently reserved is only ${balance.reserved}.`
        );
      }

      const id = `mov-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const res = await client.query(
        `INSERT INTO "stock_movements" (
          id, product_id, sku, movement_type, quantity, reference_type, reference_id, notes, performed_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *`,
        [
          id,
          params.productId,
          params.sku,
          params.movementType,
          params.quantity,
          params.referenceType || null,
          params.referenceId || null,
          params.notes || null,
          params.performedBy || null,
        ]
      );

      await client.query('COMMIT;');
      const row = res.rows[0];
      return {
        id: row.id,
        productId: String(row.product_id),
        sku: row.sku,
        movementType: row.movement_type,
        quantity: row.quantity,
        referenceType: row.reference_type,
        referenceId: row.reference_id,
        notes: row.notes,
        performedBy: row.performed_by,
        createdAt: row.created_at.toISOString(),
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get balance for a SKU strictly: available = on_hand - reserved
   */
  public async getBalance(productId: number, sku: string): Promise<InventoryBalance> {
    const client = await this.pool.connect();
    try {
      return await this.getBalanceInsideTx(client, productId, sku);
    } finally {
      client.release();
    }
  }

  private async getBalanceInsideTx(client: { query: Function }, productId: number, sku: string): Promise<InventoryBalance> {
    const res = await client.query(
      `SELECT movement_type, SUM(quantity)::integer as total_qty
       FROM "stock_movements"
       WHERE product_id = $1 OR sku = $2
       GROUP BY movement_type`,
      [productId, sku]
    );

    let onHand = 0;
    let reserved = 0;

    for (const row of res.rows) {
      const qty = Number(row.total_qty || 0);
      switch (row.movement_type) {
        case 'receipt':
          onHand += qty;
          break;
        case 'reservation':
          reserved += qty;
          break;
        case 'release':
          reserved = Math.max(0, reserved - qty);
          break;
        case 'deduction':
          onHand = Math.max(0, onHand - qty);
          reserved = Math.max(0, reserved - qty);
          break;
        case 'defect_scrap':
          onHand = Math.max(0, onHand - qty);
          break;
        case 'adjustment':
          onHand = Math.max(0, onHand + qty);
          break;
      }
    }

    const available = Math.max(0, onHand - reserved);
    const reorderThreshold = 2;

    return {
      productId: String(productId),
      sku,
      onHand,
      reserved,
      available,
      reorderThreshold,
      warehouseLocation: 'Factory Bay 1',
      isLowStock: available > 0 && available <= reorderThreshold,
      isOutOfStock: available === 0,
    };
  }

  /**
   * Get movement audit trail for SKU
   */
  public async getHistory(sku: string): Promise<StockMovement[]> {
    const res = await this.pool.query(
      `SELECT * FROM "stock_movements" WHERE sku = $1 ORDER BY created_at DESC`,
      [sku]
    );
    return res.rows.map(r => ({
      id: r.id,
      productId: String(r.product_id),
      sku: r.sku,
      movementType: r.movement_type,
      quantity: r.quantity,
      referenceType: r.reference_type,
      referenceId: r.reference_id,
      notes: r.notes,
      performedBy: r.performed_by,
      createdAt: r.created_at.toISOString(),
    }));
  }

  // ---------------------------------------------------------------------------
  // 2. INVOICES & RECONCILIATION
  // ---------------------------------------------------------------------------

  public async createInvoice(params: {
    orderId?: number;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    billingAddress: Record<string, unknown>;
    lineItems: Array<{
      name: string;
      sku?: string;
      hsnCode?: string;
      quantity: number;
      unitPricePaise: number;
    }>;
    dueDays?: number;
  }): Promise<InvoiceRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN;');

      const countRes = await client.query('SELECT COUNT(*)::integer as count FROM "invoices"');
      const seqStr = String((countRes.rows[0].count || 0) + 1).padStart(4, '0');
      const invoiceNumber = `KB-INV-2026-${seqStr}`;

      const items = params.lineItems.map(item => ({
        ...item,
        totalPaise: item.quantity * item.unitPricePaise,
      }));

      const subtotalPaise = items.reduce((acc, item) => acc + item.totalPaise, 0);
      const taxGstPaise = Math.round(subtotalPaise * 0.18);
      const totalPaise = subtotalPaise + taxGstPaise;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (params.dueDays || 15));

      const invId = `inv-${Date.now()}-${seqStr}`;
      const invRes = await client.query(
        `INSERT INTO "invoices" (
          id, invoice_number, order_id, customer_name, customer_email, billing_address,
          subtotal_paise, tax_gst_paise, total_paise, paid_paise, balance_due_paise,
          status, due_date, issued_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $9, 'issued', $10, NOW(), NOW())
        RETURNING *`,
        [
          invId,
          invoiceNumber,
          params.orderId || null,
          params.customerName,
          params.customerEmail,
          JSON.stringify(params.billingAddress),
          subtotalPaise,
          taxGstPaise,
          totalPaise,
          dueDate.toISOString(),
        ]
      );

      for (const item of items) {
        const itemId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await client.query(
          `INSERT INTO "invoice_items" (
            id, invoice_id, name, sku, hsn_code, quantity, unit_price_paise, total_paise
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            itemId,
            invId,
            item.name,
            item.sku || null,
            item.hsnCode || '8438',
            item.quantity,
            item.unitPricePaise,
            item.totalPaise,
          ]
        );
      }

      await client.query('COMMIT;');
      const row = invRes.rows[0];

      return {
        id: row.id,
        invoiceNumber: row.invoice_number,
        orderId: String(row.order_id || ''),
        orderNumber: params.orderNumber,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        billingAddress: row.billing_address,
        lineItems: items,
        subtotalPaise: Number(row.subtotal_paise),
        taxGstPaise: Number(row.tax_gst_paise),
        totalPaise: Number(row.total_paise),
        paidPaise: 0,
        balanceDuePaise: Number(row.balance_due_paise),
        status: row.status,
        dueDate: row.due_date.toISOString(),
        issuedAt: row.issued_at.toISOString(),
        payments: [],
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  public async recordPayment(params: {
    invoiceId: string;
    amountPaise: number;
    paymentMethod: PaymentTransaction['paymentMethod'];
    transactionReference: string;
    recordedBy?: string;
    notes?: string;
  }): Promise<{ invoice: InvoiceRecord; payment: PaymentTransaction }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN;');

      // Lock target invoice for concurrent safety
      const invRes = await client.query(
        'SELECT * FROM "invoices" WHERE id = $1 FOR UPDATE',
        [params.invoiceId]
      );

      if (invRes.rows.length === 0) {
        throw new Error(`Invoice not found for ID: ${params.invoiceId}`);
      }

      const inv = invRes.rows[0];
      const balanceDue = Number(inv.balance_due_paise);

      if (params.amountPaise <= 0) {
        throw new Error(`Payment amount must be greater than zero, got ${params.amountPaise}`);
      }

      if (params.amountPaise > balanceDue) {
        throw new Error(`Payment of ${params.amountPaise} exceeds outstanding balance of ${balanceDue}`);
      }

      const payId = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payRes = await client.query(
        `INSERT INTO "payment_transactions" (
          id, invoice_id, amount_paise, payment_method, transaction_reference, status, recorded_by, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'success', $6, $7, NOW())
        RETURNING *`,
        [
          payId,
          params.invoiceId,
          params.amountPaise,
          params.paymentMethod,
          params.transactionReference,
          params.recordedBy || null,
          params.notes || null,
        ]
      );

      const newPaid = Number(inv.paid_paise) + params.amountPaise;
      const newBalance = Math.max(0, Number(inv.total_paise) - newPaid);
      const newStatus = newBalance === 0 ? 'paid' : 'partially_paid';

      const updatedInvRes = await client.query(
        `UPDATE "invoices"
         SET paid_paise = $1, balance_due_paise = $2, status = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [newPaid, newBalance, newStatus, params.invoiceId]
      );

      await client.query('COMMIT;');

      const uRow = updatedInvRes.rows[0];
      const pRow = payRes.rows[0];

      return {
        invoice: {
          id: uRow.id,
          invoiceNumber: uRow.invoice_number,
          orderId: String(uRow.order_id || ''),
          orderNumber: '',
          customerName: uRow.customer_name,
          customerEmail: uRow.customer_email,
          billingAddress: uRow.billing_address,
          lineItems: [],
          subtotalPaise: Number(uRow.subtotal_paise),
          taxGstPaise: Number(uRow.tax_gst_paise),
          totalPaise: Number(uRow.total_paise),
          paidPaise: Number(uRow.paid_paise),
          balanceDuePaise: Number(uRow.balance_due_paise),
          status: uRow.status,
          dueDate: uRow.due_date.toISOString(),
          issuedAt: uRow.issued_at.toISOString(),
          payments: [],
        },
        payment: {
          id: pRow.id,
          invoiceId: pRow.invoice_id,
          amountPaise: Number(pRow.amount_paise),
          paymentMethod: pRow.payment_method,
          transactionReference: pRow.transaction_reference,
          status: pRow.status,
          recordedBy: pRow.recorded_by,
          notes: pRow.notes,
          createdAt: pRow.created_at.toISOString(),
        },
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // 3. ORDER MANAGEMENT & AUDIT HISTORY
  // ---------------------------------------------------------------------------

  public async transitionOrderStatus(params: {
    orderId: number;
    newStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    changedBy?: string;
    reason?: string;
  }): Promise<{ orderId: number; previousStatus: string; newStatus: string }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN;');

      const orderRes = await client.query(
        'SELECT id, status FROM "orders" WHERE id = $1 FOR UPDATE',
        [params.orderId]
      );

      if (orderRes.rows.length === 0) {
        throw new Error(`Order #${params.orderId} not found`);
      }

      const prevStatus = orderRes.rows[0].status || 'pending';
      if (prevStatus === params.newStatus) {
        throw new Error(`Order #${params.orderId} is already in status '${params.newStatus}'`);
      }

      await client.query(
        'UPDATE "orders" SET status = $1 WHERE id = $2',
        [params.newStatus, params.orderId]
      );

      const historyId = `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await client.query(
        `INSERT INTO "order_status_history" (
          id, order_id, previous_status, new_status, changed_by, reason, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [historyId, params.orderId, prevStatus, params.newStatus, params.changedBy || null, params.reason || null]
      );

      await client.query('COMMIT;');
      return { orderId: params.orderId, previousStatus: prevStatus, newStatus: params.newStatus };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  public async recordCustomerApproval(params: {
    orderId: number;
    approvalStatus: 'approved' | 'rejected' | 'changes_requested';
    notes?: string;
  }): Promise<void> {
    await this.pool.query(
      `UPDATE "orders"
       SET customer_approval_status = $1, customer_approval_notes = $2, customer_approved_at = NOW()
       WHERE id = $3`,
      [params.approvalStatus, params.notes || null, params.orderId]
    );
  }

  public async getOrderStatusHistory(orderId: number) {
    const res = await this.pool.query(
      `SELECT * FROM "order_status_history" WHERE order_id = $1 ORDER BY created_at ASC`,
      [orderId]
    );
    return res.rows;
  }

  public async recordOrderBlocker(params: {
    orderId: number;
    category: string;
    reason: string;
    diagnosticDetails?: string;
    responsibleTeam?: string;
    nextAction?: string;
  }) {
    const id = `blk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const res = await this.pool.query(
      `INSERT INTO "order_blockers" (
        id, order_id, category, reason, diagnostic_details, responsible_team, next_action, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', NOW(), NOW())
      RETURNING *`,
      [
        id,
        params.orderId,
        params.category,
        params.reason,
        params.diagnosticDetails || null,
        params.responsibleTeam || null,
        params.nextAction || null,
      ]
    );
    return res.rows[0];
  }

  public async resolveOrderBlocker(params: {
    blockerId: string;
    resolutionNotes?: string;
  }) {
    const res = await this.pool.query(
      `UPDATE "order_blockers"
       SET status = 'resolved', resolution_notes = $1, resolved_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [params.resolutionNotes || 'Resolved by operator', params.blockerId]
    );
    return res.rows[0];
  }

  public async getOrderBlockers(orderId?: number) {
    if (orderId) {
      const res = await this.pool.query(
        `SELECT * FROM "order_blockers" WHERE order_id = $1 ORDER BY created_at DESC`,
        [orderId]
      );
      return res.rows;
    }
    const res = await this.pool.query(
      `SELECT b.*, o.order_number, o.customer_name
       FROM "order_blockers" b
       JOIN "orders" o ON b.order_id = o.id
       ORDER BY b.created_at DESC`
    );
    return res.rows;
  }

  public async recordOrderCancellation(params: {
    orderId: number;
    reasonCategory: string;
    reasonExplanation?: string;
    actorCategory: 'customer' | 'administrator' | 'system_automation' | 'external_integration';
    actorIdentity?: string;
    refundStatus?: string;
    restockStatus?: string;
  }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN;');

      const orderRes = await client.query('SELECT status, payment_status FROM "orders" WHERE id = $1 FOR UPDATE', [params.orderId]);
      if (orderRes.rows.length === 0) throw new Error(`Order #${params.orderId} not found`);
      const prevStatus = orderRes.rows[0].status || 'pending';
      const paymentStatus = orderRes.rows[0].payment_status || 'pending';

      // Enforce refund integrity: unpaid orders must NOT have refund_initiated or refunded
      let finalRefundStatus: string;
      if (paymentStatus !== 'paid') {
        finalRefundStatus = 'not_applicable';
      } else {
        // For paid orders, default to refund_initiated if requested, but never mark 'refunded' without confirmed refund transaction
        if (params.refundStatus === 'refunded') {
          // Check if an actual refund transaction was confirmed
          finalRefundStatus = 'refund_initiated';
        } else {
          finalRefundStatus = params.refundStatus || 'refund_initiated';
        }
      }

      await client.query('UPDATE "orders" SET status = \'cancelled\' WHERE id = $1', [params.orderId]);

      const historyId = `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await client.query(
        `INSERT INTO "order_status_history" (
          id, order_id, previous_status, new_status, changed_by, reason, created_at
        ) VALUES ($1, $2, $3, 'cancelled', $4, $5, NOW())`,
        [
          historyId,
          params.orderId,
          prevStatus,
          params.actorIdentity || params.actorCategory,
          params.reasonExplanation || params.reasonCategory,
        ]
      );

      const cancelId = `cnl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const cRes = await client.query(
        `INSERT INTO "order_cancellations" (
          id, order_id, reason_category, reason_explanation, actor_category, actor_identity, previous_status, refund_status, restock_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *`,
        [
          cancelId,
          params.orderId,
          params.reasonCategory,
          params.reasonExplanation || null,
          params.actorCategory,
          params.actorIdentity || null,
          prevStatus,
          finalRefundStatus,
          params.restockStatus || 'restocked',
        ]
      );

      // Release active reservations if any exist for this order
      const activeRes = await client.query(
        `SELECT id, product_id, sku, quantity 
         FROM "inventory_reservations" 
         WHERE order_id = $1 AND status = 'active'
         FOR UPDATE`,
        [params.orderId]
      );

      for (const res of activeRes.rows) {
        await client.query(
          `UPDATE "inventory_reservations" 
           SET status = 'released', updated_at = NOW() 
           WHERE id = $1`,
          [res.id]
        );

        const movementId = `mov-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await client.query(
          `INSERT INTO "stock_movements" (
            id, product_id, sku, movement_type, quantity, reference_type, reference_id, notes, performed_by, created_at
          ) VALUES ($1, $2, $3, 'release', $4, 'order', $5, $6, $7, NOW())`,
          [
            movementId,
            res.product_id,
            res.sku,
            res.quantity,
            String(params.orderId),
            `Reservation released on cancellation of Order #${params.orderId}`,
            params.actorIdentity || 'system_cancellation',
          ]
        );
      }

      await client.query('COMMIT;');
      return cRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  public async getOrderCancellations(orderId?: number) {
    if (orderId) {
      const res = await this.pool.query(
        `SELECT * FROM "order_cancellations" WHERE order_id = $1 ORDER BY created_at DESC`,
        [orderId]
      );
      return res.rows;
    }
    const res = await this.pool.query(
      `SELECT c.*, o.order_number, o.customer_name, o.total_paise
       FROM "order_cancellations" c
       JOIN "orders" o ON c.order_id = o.id
       ORDER BY c.created_at DESC`
    );
    return res.rows;
  }

  public async getOrderActivityTimeline(orderId: number) {
    const statusHistory = await this.getOrderStatusHistory(orderId);
    const blockers = await this.getOrderBlockers(orderId);
    const cancellations = await this.getOrderCancellations(orderId);

    const mfgRes = await this.pool.query(
      `SELECT * FROM "production_task_allocations" WHERE order_id = $1 ORDER BY created_at ASC`,
      [orderId]
    );

    const invRes = await this.pool.query(
      `SELECT * FROM "invoices" WHERE order_id = $1 ORDER BY issued_at ASC`,
      [orderId]
    );

    const stockRes = await this.pool.query(
      `SELECT * FROM "stock_movements" WHERE reference_type = 'order' AND reference_id = $1 ORDER BY created_at ASC`,
      [String(orderId)]
    );

    const ordRes = await this.pool.query(
      `SELECT order_number, customer_name, created_at FROM "orders" WHERE id = $1`,
      [orderId]
    );

    const timeline: Array<{
      id: string;
      type: 'order_created' | 'status_change' | 'blocker' | 'cancellation' | 'manufacturing' | 'invoice' | 'inventory';
      title: string;
      description?: string;
      actor?: string;
      timestamp: string;
    }> = [];

    if (ordRes.rows.length > 0) {
      const ord = ordRes.rows[0];
      timeline.push({
        id: `ord-${orderId}-created`,
        type: 'order_created',
        title: `Order Placed (#${ord.order_number})`,
        description: `Customer: ${ord.customer_name}`,
        actor: ord.customer_name,
        timestamp: ord.created_at,
      });
    }

    for (const h of statusHistory) {
      timeline.push({
        id: h.id,
        type: 'status_change',
        title: `Status changed from ${h.previous_status} to ${h.new_status}`,
        description: h.reason || undefined,
        actor: h.changed_by || 'System',
        timestamp: h.created_at,
      });
    }

    for (const b of blockers) {
      timeline.push({
        id: b.id,
        type: 'blocker',
        title: `Issue reported: [${b.category}] ${b.reason}`,
        description: b.diagnostic_details || b.next_action || undefined,
        actor: b.responsible_team || 'Operations',
        timestamp: b.created_at,
      });
      if (b.resolved_at) {
        timeline.push({
          id: `${b.id}-res`,
          type: 'blocker',
          title: `Issue resolved: ${b.reason}`,
          description: b.resolution_notes || undefined,
          actor: 'Operations',
          timestamp: b.resolved_at,
        });
      }
    }

    for (const c of cancellations) {
      timeline.push({
        id: c.id,
        type: 'cancellation',
        title: `Order cancelled by ${c.actor_category} (${c.actor_identity || 'Anonymous'})`,
        description: `Reason: [${c.reason_category}] ${c.reason_explanation || ''}`,
        actor: c.actor_identity || c.actor_category,
        timestamp: c.created_at,
      });
    }

    for (const m of mfgRes.rows) {
      timeline.push({
        id: m.id,
        type: 'manufacturing',
        title: `Manufacturing stage: ${m.stage} - ${m.task_name}`,
        description: `Status: ${m.status}`,
        actor: m.assigned_by || 'Production Head',
        timestamp: m.created_at,
      });
    }

    for (const inv of invRes.rows) {
      timeline.push({
        id: inv.id,
        type: 'invoice',
        title: `Invoice ${inv.invoice_number} generated (${inv.status})`,
        description: `Total: ₹${(Number(inv.total_paise) / 100).toLocaleString('en-IN')}`,
        actor: 'Billing Engine',
        timestamp: inv.created_at || inv.issued_at,
      });
    }

    for (const s of stockRes.rows) {
      timeline.push({
        id: s.id,
        type: 'inventory',
        title: `Inventory movement: ${s.movement_type} (${s.quantity} units of ${s.sku})`,
        description: s.notes || undefined,
        actor: s.performed_by || 'Warehouse',
        timestamp: s.created_at,
      });
    }

    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return timeline;
  }

  // ---------------------------------------------------------------------------
  // 4. MANUFACTURING & PRODUCTION ALLOCATION
  // ---------------------------------------------------------------------------

  public async allocateProductionTask(params: {
    staffId: string;
    orderId?: number;
    taskName: string;
    stage: 'cad_prep' | 'fabrication' | 'electronics' | 'qa' | 'packaging';
    deadline?: Date;
    assignedBy?: string;
  }) {
    const id = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const res = await this.pool.query(
      `INSERT INTO "production_task_allocations" (
        id, staff_id, order_id, task_name, stage, deadline, status, assigned_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'assigned', $7, NOW())
      RETURNING *`,
      [
        id,
        params.staffId,
        params.orderId || null,
        params.taskName,
        params.stage,
        params.deadline ? params.deadline.toISOString() : null,
        params.assignedBy || null,
      ]
    );
    return res.rows[0];
  }

  public async updateTaskStatus(params: {
    taskId: string;
    status: 'in_progress' | 'completed' | 'blocked';
    blockerReason?: string;
  }) {
    const res = await this.pool.query(
      `UPDATE "production_task_allocations"
       SET status = $1, blocker_reason = $2, completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = $3
       RETURNING *`,
      [params.status, params.blockerReason || null, params.taskId]
    );
    return res.rows[0];
  }

  // ---------------------------------------------------------------------------
  // 5. HR MANAGEMENT: STAFF & ATTENDANCE
  // ---------------------------------------------------------------------------

  public async registerStaffProfile(params: {
    employeeId: string;
    fullName: string;
    email: string;
    phone?: string;
    department: string;
    jobTitle: string;
    dateOfJoining: string;
  }) {
    const id = `emp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const res = await this.pool.query(
      `INSERT INTO "staff_profiles" (
        id, employee_id, full_name, email, phone, department, job_title, status, date_of_joining, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, NOW(), NOW())
      RETURNING *`,
      [
        id,
        params.employeeId,
        params.fullName,
        params.email,
        params.phone || null,
        params.department,
        params.jobTitle,
        params.dateOfJoining,
      ]
    );
    return res.rows[0];
  }

  public async recordAttendance(params: {
    staffId: string;
    date: string;
    status: 'present' | 'absent' | 'half_day' | 'holiday' | 'late' | 'on_leave';
    checkInTime?: Date;
    workingHours?: number;
    notes?: string;
  }) {
    // Check if duplicate active check-in or record already exists for the day
    const existing = await this.pool.query(
      `SELECT * FROM "attendance_records" WHERE "staff_id" = $1 AND "date" = $2`,
      [params.staffId, params.date]
    );

    const checkIn = params.checkInTime ? params.checkInTime.toISOString() : new Date().toISOString();

    if (existing.rows.length > 0) {
      const rec = existing.rows[0];
      if (rec.check_in && !rec.check_out) {
        throw new Error(`Active check-in already in progress for staff on ${params.date}`);
      }
      // Update existing record
      const res = await this.pool.query(
        `UPDATE "attendance_records"
         SET check_in = COALESCE(check_in, $1),
             status = $2,
             notes = COALESCE($3, notes)
         WHERE id = $4
         RETURNING *`,
        [checkIn, params.status, params.notes || null, rec.id]
      );
      return res.rows[0];
    }

    const id = `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const res = await this.pool.query(
      `INSERT INTO "attendance_records" (
        id, staff_id, date, check_in, status, working_hours, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
      [
        id,
        params.staffId,
        params.date,
        checkIn,
        params.status,
        params.workingHours || null,
        params.notes || null,
      ]
    );
    return res.rows[0];
  }

  public async recordCheckOut(params: {
    attendanceId: string;
    checkOutTime?: Date;
    workingHours?: number;
  }) {
    const attRes = await this.pool.query(
      `SELECT * FROM "attendance_records" WHERE id = $1`,
      [params.attendanceId]
    );
    if (attRes.rows.length === 0) {
      throw new Error(`Attendance record #${params.attendanceId} not found`);
    }

    const att = attRes.rows[0];
    if (!att.check_in) {
      throw new Error(`Cannot check out: no check-in timestamp recorded`);
    }
    if (att.check_out) {
      throw new Error(`Already checked out at ${att.check_out}`);
    }

    const outTime = params.checkOutTime || new Date();
    const inTime = new Date(att.check_in);

    if (outTime.getTime() < inTime.getTime()) {
      throw new Error('Check-out timestamp cannot be earlier than check-in');
    }

    // Calculate total break duration in minutes
    const breaksRes = await this.pool.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total_break
       FROM "attendance_breaks"
       WHERE attendance_id = $1`,
      [params.attendanceId]
    );
    const breakMinutes = Number(breaksRes.rows[0]?.total_break || 0);

    const totalMinutes = Math.max(0, Math.floor((outTime.getTime() - inTime.getTime()) / (1000 * 60)) - breakMinutes);
    const calculatedHours = Number((totalMinutes / 60).toFixed(2));
    const hours = params.workingHours !== undefined ? Number(params.workingHours) : calculatedHours;

    const res = await this.pool.query(
      `UPDATE "attendance_records"
       SET check_out = $1, working_hours = $2
       WHERE id = $3
       RETURNING *`,
      [outTime.toISOString(), hours, params.attendanceId]
    );
    return res.rows[0];
  }

  public async recordBreak(params: {
    attendanceId: string;
    action: 'start' | 'end';
    reason?: string;
  }) {
    const attRes = await this.pool.query(`SELECT * FROM "attendance_records" WHERE id = $1`, [params.attendanceId]);
    if (attRes.rows.length === 0) throw new Error('Attendance record not found');

    if (params.action === 'start') {
      // Check if open break exists
      const openBreak = await this.pool.query(
        `SELECT * FROM "attendance_breaks" WHERE attendance_id = $1 AND end_time IS NULL`,
        [params.attendanceId]
      );
      if (openBreak.rows.length > 0) throw new Error('A break is already active');

      const id = `brk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const res = await this.pool.query(
        `INSERT INTO "attendance_breaks" (id, attendance_id, start_time, reason, created_at)
         VALUES ($1, $2, NOW(), $3, NOW())
         RETURNING *`,
        [id, params.attendanceId, params.reason || 'Meal / General Break']
      );
      return res.rows[0];
    } else {
      const openBreak = await this.pool.query(
        `SELECT * FROM "attendance_breaks" WHERE attendance_id = $1 AND end_time IS NULL ORDER BY created_at DESC LIMIT 1`,
        [params.attendanceId]
      );
      if (openBreak.rows.length === 0) throw new Error('No active break found to end');

      const brk = openBreak.rows[0];
      const endTime = new Date();
      const startTime = new Date(brk.start_time);
      const durationMins = Math.max(1, Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)));

      const res = await this.pool.query(
        `UPDATE "attendance_breaks"
         SET end_time = $1, duration_minutes = $2
         WHERE id = $3
         RETURNING *`,
        [endTime.toISOString(), durationMins, brk.id]
      );
      return res.rows[0];
    }
  }

  public async correctAttendance(params: {
    attendanceId: string;
    correctedCheckIn?: string;
    correctedCheckOut?: string;
    reason: string;
    requestedBy: string;
    approvedBy?: string;
  }) {
    const attRes = await this.pool.query(`SELECT * FROM "attendance_records" WHERE id = $1`, [params.attendanceId]);
    if (attRes.rows.length === 0) throw new Error('Attendance record not found');
    const att = attRes.rows[0];

    let workingHours = att.working_hours;
    const finalIn = params.correctedCheckIn ? new Date(params.correctedCheckIn) : (att.check_in ? new Date(att.check_in) : null);
    const finalOut = params.correctedCheckOut ? new Date(params.correctedCheckOut) : (att.check_out ? new Date(att.check_out) : null);

    if (finalIn && finalOut) {
      if (finalOut.getTime() < finalIn.getTime()) throw new Error('Corrected check-out must be after check-in');
      const diffMins = Math.floor((finalOut.getTime() - finalIn.getTime()) / (1000 * 60));
      workingHours = Number((diffMins / 60).toFixed(2));
    }

    const corrId = `corr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await this.pool.query(
      `INSERT INTO "attendance_corrections" (
        id, attendance_id, original_check_in, original_check_out, corrected_check_in, corrected_check_out, reason, requested_by, approved_by, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved', NOW())`,
      [
        corrId,
        params.attendanceId,
        att.check_in,
        att.check_out,
        params.correctedCheckIn || null,
        params.correctedCheckOut || null,
        params.reason,
        params.requestedBy,
        params.approvedBy || params.requestedBy,
      ]
    );

    const updated = await this.pool.query(
      `UPDATE "attendance_records"
       SET check_in = COALESCE($1, check_in),
           check_out = COALESCE($2, check_out),
           working_hours = $3
       WHERE id = $4
       RETURNING *`,
      [params.correctedCheckIn || null, params.correctedCheckOut || null, workingHours, params.attendanceId]
    );
    return updated.rows[0];
  }

  // Daily Work Logs
  public async submitDailyWorkLog(params: {
    staffId: string;
    date: string;
    taskDescription: string;
    orderId?: number;
    taskAllocationId?: string;
    timeSpentMinutes: number;
    completedWork?: string;
    pendingWork?: string;
    blockers?: string;
    status?: 'draft' | 'submitted';
  }) {
    if (params.timeSpentMinutes <= 0) throw new Error('Time spent must be greater than zero');
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const res = await this.pool.query(
      `INSERT INTO "daily_work_logs" (
        id, staff_id, date, task_description, order_id, task_allocation_id, time_spent_minutes, completed_work, pending_work, blockers, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        id,
        params.staffId,
        params.date,
        params.taskDescription,
        params.orderId || null,
        params.taskAllocationId || null,
        params.timeSpentMinutes,
        params.completedWork || null,
        params.pendingWork || null,
        params.blockers || null,
        params.status || 'submitted',
      ]
    );
    return res.rows[0];
  }

  public async reviewWorkLog(params: {
    logId: string;
    decision: 'approved' | 'returned';
    reviewedBy: string;
    reviewNotes?: string;
  }) {
    const res = await this.pool.query(
      `UPDATE "daily_work_logs"
       SET status = $1, reviewed_by = $2, review_notes = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [params.decision, params.reviewedBy, params.reviewNotes || null, params.logId]
    );
    return res.rows[0];
  }

  public async getDailyWorkLogs(filters?: { staffId?: string; date?: string; status?: string }) {
    let query = `SELECT w.*, s.full_name, s.employee_id, s.department, o.order_number
                 FROM "daily_work_logs" w
                 JOIN "staff_profiles" s ON w.staff_id = s.id
                 LEFT JOIN "orders" o ON w.order_id = o.id`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters?.staffId) {
      params.push(filters.staffId);
      conditions.push(`w.staff_id = $${params.length}`);
    }
    if (filters?.date) {
      params.push(filters.date);
      conditions.push(`w.date = $${params.length}`);
    }
    if (filters?.status) {
      params.push(filters.status);
      conditions.push(`w.status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` ORDER BY w.date DESC, w.created_at DESC`;
    const res = await this.pool.query(query, params);
    return res.rows;
  }

  public async submitLeaveRequest(params: {
    staffId: string;
    leaveType: 'casual' | 'sick' | 'earned' | 'unpaid';
    startDate: string;
    endDate: string;
    reason: string;
  }) {
    const id = `leave-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const res = await this.pool.query(
      `INSERT INTO "leave_requests" (
        id, staff_id, leave_type, start_date, end_date, reason, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
      RETURNING *`,
      [id, params.staffId, params.leaveType, params.startDate, params.endDate, params.reason]
    );
    return res.rows[0];
  }

  public async processLeaveRequest(params: {
    leaveId: string;
    decision: 'approved' | 'rejected';
    approvedBy: string;
    decisionNotes?: string;
  }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN;');
      const lRes = await client.query(
        `UPDATE "leave_requests"
         SET status = $1, approved_by = $2, decision_notes = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [params.decision, params.approvedBy, params.decisionNotes || null, params.leaveId]
      );
      if (lRes.rows.length === 0) throw new Error('Leave request not found');
      const leave = lRes.rows[0];

      // If approved, sync attendance records for the dates to 'on_leave'
      if (params.decision === 'approved') {
        const formatDateStr = (dt: Date) => {
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = formatDateStr(d);
          await client.query(
            `INSERT INTO "attendance_records" (id, staff_id, date, status, notes, created_at)
             VALUES ($1, $2, $3, 'on_leave', $4, NOW())
             ON CONFLICT ("staff_id", "date")
             DO UPDATE SET status = 'on_leave', notes = EXCLUDED.notes`,
            [`att-leave-${Date.now()}-${Math.floor(Math.random() * 1000)}`, leave.staff_id, dateStr, `Approved ${leave.leave_type} leave`]
          );
        }
      }

      await client.query('COMMIT;');
      return leave;
    } catch (e) {
      await client.query('ROLLBACK;');
      throw e;
    } finally {
      client.release();
    }
  }

  public async getStaffDirectory() {
    const res = await this.pool.query(
      `SELECT * FROM "staff_profiles" ORDER BY created_at DESC`
    );
    return res.rows;
  }

  public async getAttendanceRecords(date?: string) {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const res = await this.pool.query(
      `SELECT a.*, s.full_name, s.employee_id, s.department, s.job_title
       FROM "attendance_records" a
       JOIN "staff_profiles" s ON a.staff_id = s.id
       WHERE a.date = $1
       ORDER BY a.created_at DESC`,
      [targetDate]
    );
    return res.rows;
  }

  public async getAttendanceSummary(date?: string) {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const totalStaffRes = await this.pool.query(`SELECT COUNT(*) FROM "staff_profiles" WHERE status = 'active'`);
    const totalStaff = Number(totalStaffRes.rows[0].count);

    const attCountsRes = await this.pool.query(
      `SELECT status, COUNT(*) as count
       FROM "attendance_records"
       WHERE date = $1
       GROUP BY status`,
      [targetDate]
    );

    let present = 0;
    let late = 0;
    let halfDay = 0;
    let onLeave = 0;
    let missingCheckOut = 0;

    attCountsRes.rows.forEach(r => {
      const c = Number(r.count);
      if (r.status === 'present') present += c;
      if (r.status === 'late') late += c;
      if (r.status === 'half_day') halfDay += c;
      if (r.status === 'on_leave') onLeave += c;
    });

    const missingOutRes = await this.pool.query(
      `SELECT COUNT(*) FROM "attendance_records" WHERE date = $1 AND check_in IS NOT NULL AND check_out IS NULL`,
      [targetDate]
    );
    missingCheckOut = Number(missingOutRes.rows[0].count);

    const recordedCount = present + late + halfDay + onLeave;
    const absent = Math.max(0, totalStaff - recordedCount);

    return {
      date: targetDate,
      totalStaff,
      present,
      absent,
      late,
      halfDay,
      onLeave,
      missingCheckOut,
    };
  }

  public async getLeaveRequests(status?: string) {
    let query = `SELECT l.*, s.full_name, s.employee_id, s.department
                 FROM "leave_requests" l
                 JOIN "staff_profiles" s ON l.staff_id = s.id`;
    const params: unknown[] = [];
    if (status) {
      query += ` WHERE l.status = $1`;
      params.push(status);
    }
    query += ` ORDER BY l.created_at DESC`;
    const res = await this.pool.query(query, params);
    return res.rows;
  }

  public async getProductionAllocations() {
    const res = await this.pool.query(
      `SELECT p.*, s.full_name, s.employee_id, o.order_number
       FROM "production_task_allocations" p
       JOIN "staff_profiles" s ON p.staff_id = s.id
       LEFT JOIN "orders" o ON p.order_id = o.id
       ORDER BY p.created_at DESC`
    );
    return res.rows;
  }

  // ---------------------------------------------------------------------------
  // 6. CRM: QUOTE TO ORDER CONVERSION
  // ---------------------------------------------------------------------------

  public async convertQuoteToOrder(params: {
    quoteId: number;
    shippingAddress: Record<string, unknown>;
    convertedBy?: string;
  }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN;');

      const qRes = await client.query('SELECT * FROM "quotes" WHERE id = $1 FOR UPDATE', [params.quoteId]);
      if (qRes.rows.length === 0) throw new Error(`Quote #${params.quoteId} not found`);
      const quote = qRes.rows[0];

      if (quote.status === 'accepted') {
        throw new Error(`Quote #${params.quoteId} has already been accepted/converted`);
      }

      const qItemsRes = await client.query('SELECT * FROM "quotes_items" WHERE _parent_id = $1', [params.quoteId]);
      const items = qItemsRes.rows;

      const orderNumber = `KB-ORD-Q${quote.quote_number || params.quoteId}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
      const totalPaise = items.reduce((sum: number, it: { quoted_price_paise?: number; quantity?: number }) => {
        return sum + (Number(it.quoted_price_paise || 0) * Number(it.quantity || 1));
      }, 0);

      const ordRes = await client.query(
        `INSERT INTO "orders" (
          order_number, customer_name, customer_email, customer_phone,
          status, payment_status, total_paise, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'pending', 'pending', $5, $6, NOW(), NOW())
        RETURNING *`,
        [
          orderNumber,
          quote.contact_name || quote.company_name || 'Client',
          quote.contact_email || 'client@kitchenbots.in',
          quote.contact_phone || null,
          totalPaise,
          `Converted from Quote #${quote.quote_number} by ${params.convertedBy || 'Operations'}`,
        ]
      );
      const newOrder = ordRes.rows[0];

      await client.query(
        `UPDATE "quotes" SET status = 'accepted', notes = $1, updated_at = NOW() WHERE id = $2`,
        [`Converted to Order #${newOrder.order_number}`, params.quoteId]
      );

      await client.query('COMMIT;');
      return { order: newOrder, quoteId: params.quoteId };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // 7. OPERATIONAL REPORTS GENERATOR
  // ---------------------------------------------------------------------------

  public async generateOperationalReport(reportType: 'financial' | 'inventory' | 'manufacturing') {
    if (reportType === 'financial') {
      const invStats = await this.pool.query(`
        SELECT 
          COUNT(*)::integer as total_invoices,
          COALESCE(SUM(total_paise), 0)::numeric as gross_billed_paise,
          COALESCE(SUM(paid_paise), 0)::numeric as total_collected_paise,
          COALESCE(SUM(balance_due_paise), 0)::numeric as total_outstanding_paise
        FROM "invoices"
      `);
      return { type: 'financial', generatedAt: new Date().toISOString(), stats: invStats.rows[0] };
    }

    if (reportType === 'inventory') {
      const movStats = await this.pool.query(`
        SELECT movement_type, COUNT(*)::integer as total_movements, COALESCE(SUM(quantity), 0)::integer as total_quantity
        FROM "stock_movements"
        GROUP BY movement_type
      `);
      return { type: 'inventory', generatedAt: new Date().toISOString(), movements: movStats.rows };
    }

    const taskStats = await this.pool.query(`
      SELECT status, stage, COUNT(*)::integer as task_count
      FROM "production_task_allocations"
      GROUP BY status, stage
    `);
    return { type: 'manufacturing', generatedAt: new Date().toISOString(), tasks: taskStats.rows };
  }

  // ---------------------------------------------------------------------------
  // 8. WAREHOUSE & LOCATION TRACKING
  // ---------------------------------------------------------------------------

  public async getInventoryLocations(): Promise<any[]> {
    const res = await this.pool.query(
      `SELECT * FROM "inventory_locations" WHERE is_active = TRUE ORDER BY code ASC`
    );
    return res.rows;
  }

  public async createInventoryLocation(params: {
    code: string;
    name: string;
    type?: string;
    address?: string;
  }): Promise<any> {
    const res = await this.pool.query(
      `INSERT INTO "inventory_locations" (code, name, type, address, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
       RETURNING *`,
      [params.code, params.name, params.type || 'warehouse', params.address || null]
    );
    return res.rows[0];
  }

  // ---------------------------------------------------------------------------
  // 9. SERIALIZED PRODUCT UNITS
  // ---------------------------------------------------------------------------

  public async getProductUnits(productId?: number, sku?: string): Promise<any[]> {
    let query = `
      SELECT u.*, l.code as location_code, l.name as location_name, o.order_number
      FROM "product_units" u
      LEFT JOIN "inventory_locations" l ON u.location_id = l.id
      LEFT JOIN "orders" o ON u.order_id = o.id
    `;
    const params: any[] = [];
    if (productId) {
      params.push(productId);
      query += ` WHERE u.product_id = $${params.length}`;
    } else if (sku) {
      params.push(sku);
      query += ` WHERE u.sku = $${params.length}`;
    }
    query += ` ORDER BY u.created_at DESC`;
    const res = await this.pool.query(query, params);
    return res.rows;
  }

  public async registerProductUnit(params: {
    productId: number;
    sku: string;
    serialNumber: string;
    locationId?: number;
    binLocation?: string;
    unitStatus?: string;
  }): Promise<any> {
    const res = await this.pool.query(
      `INSERT INTO "product_units" (product_id, sku, serial_number, location_id, bin_location, unit_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        params.productId,
        params.sku,
        params.serialNumber,
        params.locationId || null,
        params.binLocation || null,
        params.unitStatus || 'available',
      ]
    );
    return res.rows[0];
  }

  public async updateUnitLocation(unitId: number, locationId: number, binLocation?: string): Promise<any> {
    const res = await this.pool.query(
      `UPDATE "product_units"
       SET location_id = $1, bin_location = COALESCE($2, bin_location), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [locationId, binLocation || null, unitId]
    );
    return res.rows[0];
  }

  // ---------------------------------------------------------------------------
  // 10. DIRECT SALE / POS WORKFLOW
  // ---------------------------------------------------------------------------

  public async recordDirectSale(params: {
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    locationId?: number;
    items: Array<{ productId: number | string; sku?: string; name?: string; quantity: number; unitPricePaise?: number }>;
    paymentMethod: string;
    paymentReference?: string;
    performedBy?: string;
    notes?: string;
  }): Promise<{ sale: any; order: any; invoice: any; payment: any }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN;');

      // 1. Resolve each item against authoritative "products" record and lock row
      const resolvedItems: Array<{
        productId: number;
        sku: string;
        name: string;
        quantity: number;
        unitPricePaise: number;
      }> = [];

      let subtotalPaise = 0;

      for (const rawItem of params.items) {
        const prodId = Number(rawItem.productId);
        if (isNaN(prodId) || prodId <= 0) {
          throw new Error(`Invalid productId: ${rawItem.productId}`);
        }

        const qty = Number(rawItem.quantity);
        if (isNaN(qty) || qty <= 0) {
          throw new Error(`Invalid quantity for product ${prodId}: ${rawItem.quantity}`);
        }

        // Lock product row and fetch authoritative name and SKU
        const prodRes = await client.query(
          'SELECT id, name, sku FROM "products" WHERE id = $1 FOR UPDATE',
          [prodId]
        );

        if (prodRes.rows.length === 0) {
          throw new Error(`Product not found with id: ${prodId}`);
        }

        const product = prodRes.rows[0];
        const authoritativeSku = product.sku;
        const authoritativeName = rawItem.name || product.name;
        const unitPrice = rawItem.unitPricePaise !== undefined && rawItem.unitPricePaise !== null
          ? Number(rawItem.unitPricePaise)
          : 2999900; // default fallback if unsupplied

        resolvedItems.push({
          productId: prodId,
          sku: authoritativeSku,
          name: authoritativeName,
          quantity: qty,
          unitPricePaise: unitPrice,
        });

        subtotalPaise += unitPrice * qty;
      }

      const taxGstPaise = Math.round(subtotalPaise * 0.18);
      const totalPaise = subtotalPaise + taxGstPaise;

      // 2. Reserve / deduct inventory inside transaction
      for (const item of resolvedItems) {
        // Enforce inventory check
        const balance = await this.getBalanceInsideTx(client, item.productId, item.sku);
        if (balance.available < item.quantity) {
          throw new Error(`Insufficient stock for ${item.sku}. Available: ${balance.available}, Requested: ${item.quantity}`);
        }

        // Deduct inventory directly for completed POS sale
        const movId = `pos-deduct-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await client.query(
          `INSERT INTO "stock_movements" (
            id, product_id, sku, movement_type, quantity, reference_type, reference_id, notes, performed_by, created_at
          ) VALUES ($1, $2, $3, 'deduction', $4, 'order', 'DIRECT_SALE', 'Direct store counter sale deduction', $5, NOW())`,
          [movId, item.productId, item.sku, item.quantity, params.performedBy || 'POS Desk']
        );
      }

      // 3. Create persistent Order
      const orderNumber = `POS-${Date.now().toString().slice(-6)}`;
      const orderRes = await client.query(
        `INSERT INTO "orders" (
          order_number, status, payment_status, total_paise, customer_name, customer_email, customer_phone, notes, created_at, updated_at
        ) VALUES ($1, 'delivered', 'paid', $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *`,
        [
          orderNumber,
          totalPaise,
          params.customerName,
          params.customerEmail || 'walkin@kitchenbots.in',
          params.customerPhone || null,
          params.notes || 'In-store direct counter POS sale',
        ]
      );
      const order = orderRes.rows[0];

      // 4. Create persistent Invoice
      const invNumber = `INV-POS-${Date.now().toString().slice(-6)}`;
      const invoiceId = `inv-pos-${Date.now()}`;
      const defaultBillingAddress = JSON.stringify({
        fullName: params.customerName,
        phone: params.customerPhone || '',
        addressLine1: 'Direct Store Counter POS',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      });
      const invRes = await client.query(
        `INSERT INTO "invoices" (
          id, invoice_number, order_id, customer_name, customer_email, billing_address, subtotal_paise, tax_gst_paise, total_paise, paid_paise, balance_due_paise, status, due_date, issued_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, 0, 'paid', NOW(), NOW(), NOW())
        RETURNING *`,
        [
          invoiceId,
          invNumber,
          order.id,
          params.customerName,
          params.customerEmail || 'walkin@kitchenbots.in',
          defaultBillingAddress,
          subtotalPaise,
          taxGstPaise,
          totalPaise,
        ]
      );
      const invoice = invRes.rows[0];

      // 5. Create invoice items
      for (const item of resolvedItems) {
        await client.query(
          `INSERT INTO "invoice_items" (
            id, invoice_id, product_id, name, sku, quantity, unit_price_paise, total_paise
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            invoiceId,
            item.productId,
            item.name,
            item.sku,
            item.quantity,
            item.unitPricePaise,
            item.unitPricePaise * item.quantity,
          ]
        );
      }

      // 6. Record payment transaction
      const paymentId = `pay-pos-${Date.now()}`;
      const payRes = await client.query(
        `INSERT INTO "payment_transactions" (
          id, invoice_id, amount_paise, payment_method, transaction_reference, status, recorded_by, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'success', $6, $7, NOW())
        RETURNING *`,
        [
          paymentId,
          invoiceId,
          totalPaise,
          params.paymentMethod,
          params.paymentReference || `POS-CASH-${Date.now().toString().slice(-4)}`,
          params.performedBy || 'POS Cashier',
          'Immediate POS counter payment clearance',
        ]
      );
      const payment = payRes.rows[0];

      // 7. Record direct sale entry
      const saleNumber = `SALE-${Date.now().toString().slice(-6)}`;
      const saleRes = await client.query(
        `INSERT INTO "direct_sales" (
          sale_number, customer_name, customer_email, customer_phone, location_id, subtotal_paise, tax_gst_paise, total_paise, payment_method, payment_reference, status, order_id, invoice_id, performed_by, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed', $11, $12, $13, $14, NOW())
        RETURNING *`,
        [
          saleNumber,
          params.customerName,
          params.customerEmail || null,
          params.customerPhone || null,
          params.locationId || null,
          subtotalPaise,
          taxGstPaise,
          totalPaise,
          params.paymentMethod,
          params.paymentReference || payment.transaction_reference,
          order.id,
          invoiceId,
          params.performedBy || 'POS Cashier',
          params.notes || null,
        ]
      );
      const sale = saleRes.rows[0];

      await client.query('COMMIT;');
      return { sale, order, invoice, payment };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // 12. STOREFRONT CHECKOUT & INVENTORY RESERVATION LIFECYCLE
  // ---------------------------------------------------------------------------

  /**
   * Atomic storefront checkout with deterministic locking, inventory reservation,
   * server-side price enforcement, and transaction-level idempotency.
   */
  public async createStorefrontOrderWithReservation(params: {
    idempotencyKey: string;
    requestHash: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    items: Array<{ productId: number; quantity: number }>;
    shippingAddress: {
      fullName?: string;
      phone?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
    };
    notes?: string;
    reservationTtlMinutes?: number;
  }): Promise<{ order: any; items: any[]; reservations: any[]; isExisting: boolean }> {
    if (!params.idempotencyKey) throw new Error('Missing required idempotencyKey');
    if (!params.items || params.items.length === 0) throw new Error('Order must contain at least one item');
    if (!params.customerName || !params.customerEmail) throw new Error('Missing customer details');

    const ttlMinutes = params.reservationTtlMinutes && params.reservationTtlMinutes > 0 ? params.reservationTtlMinutes : 15;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN;');

      // 1. Transactional idempotency check with row-level lock or unique constraint
      const existingKeyRes = await client.query(
        'SELECT idempotency_key, order_id, request_hash, response_payload FROM "checkout_idempotency_keys" WHERE idempotency_key = $1 FOR UPDATE',
        [params.idempotencyKey]
      );

      if (existingKeyRes.rows.length > 0) {
        const existing = existingKeyRes.rows[0];
        if (existing.request_hash !== params.requestHash) {
          throw new Error('IDEMPOTENCY_KEY_PAYLOAD_MISMATCH: Idempotency key reused with conflicting request payload');
        }
        await client.query('COMMIT;');
        return {
          ...existing.response_payload,
          isExisting: true,
        };
      }

      // 2. Deterministic lock ordering (sort by productId ASC to prevent deadlock across concurrent multi-item checkouts)
      const sortedItemInputs = [...params.items].sort((a, b) => Number(a.productId) - Number(b.productId));

      const validatedItems: Array<{
        productId: number;
        sku: string;
        name: string;
        quantity: number;
        unitPricePaise: number;
      }> = [];

      let subtotalPaise = 0;

      for (const item of sortedItemInputs) {
        const prodId = Number(item.productId);
        const qty = Number(item.quantity);
        if (isNaN(prodId) || prodId <= 0) throw new Error(`Invalid productId: ${item.productId}`);
        if (isNaN(qty) || qty <= 0) throw new Error(`Quantity must be positive for product ${prodId}`);

        // Lock product row
        const pRes = await client.query(
          'SELECT id, name, sku, price_paise FROM "products" WHERE id = $1 FOR UPDATE',
          [prodId]
        );
        if (pRes.rows.length === 0) throw new Error(`Product not found with id: ${prodId}`);

        const product = pRes.rows[0];
        const unitPricePaise = Number(product.price_paise);
        if (unitPricePaise <= 0) {
          throw new Error(`UNPRICED_PRODUCT: Product "${product.name}" (${product.sku}) has no valid authoritative price and cannot be purchased.`);
        }

        // Check authoritative inventory balance
        const balance = await this.getBalanceInsideTx(client, prodId, product.sku);
        if (balance.available < qty) {
          throw new Error(`INSUFFICIENT_STOCK: Product "${product.name}" has only ${balance.available} unit(s) available, but ${qty} requested.`);
        }

        validatedItems.push({
          productId: prodId,
          sku: product.sku,
          name: product.name,
          quantity: qty,
          unitPricePaise,
        });

        subtotalPaise += unitPricePaise * qty;
      }

      // Calculate total (preserving 18% GST standard)
      const taxGstPaise = Math.round(subtotalPaise * 0.18);
      const totalPaise = subtotalPaise + taxGstPaise;

      // 3. Create order
      const orderNumber = `KB-ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
      const orderRes = await client.query(
        `INSERT INTO "orders" (
          order_number, status, payment_status, total_paise, customer_name, customer_email, customer_phone, notes, created_at, updated_at
        ) VALUES ($1, 'pending', 'pending', $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *`,
        [
          orderNumber,
          totalPaise,
          params.customerName,
          params.customerEmail,
          params.customerPhone || null,
          params.notes || null,
        ]
      );
      const order = orderRes.rows[0];

      // 4. Create authoritative order items
      const createdItems: any[] = [];
      for (const vi of validatedItems) {
        const itemRes = await client.query(
          `INSERT INTO "order_items" (
            order_id, product_id, sku, name, unit_price_paise, quantity, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING *`,
          [order.id, vi.productId, vi.sku, vi.name, vi.unitPricePaise, vi.quantity]
        );
        createdItems.push(itemRes.rows[0]);
      }

      // 5. Create inventory reservations and record reservation stock movements
      const createdReservations: any[] = [];
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      for (const vi of validatedItems) {
        const resId = `res-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const resEntry = await client.query(
          `INSERT INTO "inventory_reservations" (
            id, order_id, product_id, sku, quantity, status, expires_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, 'active', $6, NOW(), NOW())
          RETURNING *`,
          [resId, order.id, vi.productId, vi.sku, vi.quantity, expiresAt.toISOString()]
        );
        createdReservations.push(resEntry.rows[0]);

        const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        await client.query(
          `INSERT INTO "stock_movements" (
            id, product_id, sku, movement_type, quantity, reference_type, reference_id, notes, performed_by, created_at
          ) VALUES ($1, $2, $3, 'reservation', $4, 'order', $5, $6, 'storefront_checkout', NOW())`,
          [
            movId,
            vi.productId,
            vi.sku,
            vi.quantity,
            String(order.id),
            `Hold for Storefront Order #${order.id} (${order.order_number})`,
          ]
        );
      }

      const responsePayload = {
        order,
        items: createdItems,
        reservations: createdReservations,
      };

      // 6. Record idempotency key mapping
      await client.query(
        `INSERT INTO "checkout_idempotency_keys" (
          idempotency_key, order_id, request_hash, response_payload, created_at
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [params.idempotencyKey, order.id, params.requestHash, JSON.stringify(responsePayload)]
      );

      await client.query('COMMIT;');
      return {
        ...responsePayload,
        isExisting: false,
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Sweeps expired reservations, releasing held stock.
   */
  public async sweepExpiredReservations(): Promise<{ sweptCount: number; releasedMovements: number }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN;');

      // Select active reservations where expires_at < NOW() with row lock
      const expiredRes = await client.query(
        `SELECT r.id, r.order_id, r.product_id, r.sku, r.quantity
         FROM "inventory_reservations" r
         WHERE r.status = 'active' AND r.expires_at < NOW()
         FOR UPDATE`
      );

      let sweptCount = 0;
      let releasedMovements = 0;

      for (const res of expiredRes.rows) {
        // Mark reservation expired
        await client.query(
          `UPDATE "inventory_reservations" 
           SET status = 'expired', updated_at = NOW() 
           WHERE id = $1`,
          [res.id]
        );

        // Record stock movement release
        const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        await client.query(
          `INSERT INTO "stock_movements" (
            id, product_id, sku, movement_type, quantity, reference_type, reference_id, notes, performed_by, created_at
          ) VALUES ($1, $2, $3, 'release', $4, 'order', $5, $6, 'reservation_expiry_sweeper', NOW())`,
          [
            movId,
            res.product_id,
            res.sku,
            res.quantity,
            String(res.order_id),
            `Hold expired and released for Order #${res.order_id}`,
          ]
        );
        releasedMovements++;
        sweptCount++;
      }

      await client.query('COMMIT;');
      return { sweptCount, releasedMovements };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Transition active reservations to fulfillment (deduction) upon payment confirmation or authorized COD.
   */
  public async fulfillOrderReservation(params: {
    orderId: number;
    paymentStatus: 'paid' | 'pending';
    paymentReference?: string;
    performedBy?: string;
    isCodApproval?: boolean;
  }): Promise<{ fulfilled: boolean; deductionsCount: number }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN;');

      // Lock order
      const orderRes = await client.query(
        'SELECT id, status, payment_status, total_paise FROM "orders" WHERE id = $1 FOR UPDATE',
        [params.orderId]
      );
      if (orderRes.rows.length === 0) throw new Error(`Order #${params.orderId} not found`);

      const order = orderRes.rows[0];

      // Lock reservations for this order
      const resRows = await client.query(
        `SELECT id, product_id, sku, quantity, status, expires_at 
         FROM "inventory_reservations" 
         WHERE order_id = $1 
         FOR UPDATE`,
        [params.orderId]
      );

      if (resRows.rows.length === 0) {
        throw new Error(`No reservations found for Order #${params.orderId}`);
      }

      // Check if any reservation is already converted (idempotent no-op)
      const allConverted = resRows.rows.every(r => r.status === 'converted');
      if (allConverted) {
        await client.query('COMMIT;');
        return { fulfilled: true, deductionsCount: 0 };
      }

      // Check if reservations expired
      const hasExpired = resRows.rows.some(r => r.status === 'expired');
      if (hasExpired) {
        // Must not blindly deduct stock: revalidate availability before fulfillment
        for (const r of resRows.rows) {
          const bal = await this.getBalanceInsideTx(client, r.product_id, r.sku);
          if (bal.available < r.quantity) {
            throw new Error(`CANNOT_FULFILL_EXPIRED: Reservation expired and stock is no longer available for product ${r.sku}. Refund or reorder required.`);
          }
        }
      }

      // Convert active/revalidated reservations to converted and deduct stock exactly once
      let deductionsCount = 0;
      for (const r of resRows.rows) {
        if (r.status !== 'converted') {
          await client.query(
            `UPDATE "inventory_reservations" SET status = 'converted', updated_at = NOW() WHERE id = $1`,
            [r.id]
          );

          const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          await client.query(
            `INSERT INTO "stock_movements" (
              id, product_id, sku, movement_type, quantity, reference_type, reference_id, notes, performed_by, created_at
            ) VALUES ($1, $2, $3, 'deduction', $4, 'order', $5, $6, $7, NOW())`,
            [
              movId,
              r.product_id,
              r.sku,
              r.quantity,
              String(params.orderId),
              params.isCodApproval 
                ? `Stock deducted on COD Approval for Order #${params.orderId}` 
                : `Stock deducted on Payment Confirmation for Order #${params.orderId}`,
              params.performedBy || 'system_fulfillment',
            ]
          );
          deductionsCount++;
        }
      }

      // Update order status
      const newStatus = 'processing';
      const newPayStatus = params.paymentStatus;
      await client.query(
        `UPDATE "orders" SET status = $1, payment_status = $2, updated_at = NOW() WHERE id = $3`,
        [newStatus, newPayStatus, params.orderId]
      );

      await client.query('COMMIT;');
      return { fulfilled: true, deductionsCount };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

