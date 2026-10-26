import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';

const repo = new PostgresOperationsRepository();

// GET /api/operations/inventory?sku=...&productId=...
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const sku = searchParams.get('sku');
  const productId = searchParams.get('productId');
  const view = searchParams.get('view');

  if (view === 'ledger') {
    try {
      const ledgerResult = await (repo as unknown as { pool: { query: Function } }).pool.query(
        `SELECT sm.id, sm.sku, p.name as product_name, sm.movement_type, sm.quantity, sm.reference_type, sm.reference_id, sm.notes, sm.performed_by, sm.created_at
         FROM stock_movements sm
         LEFT JOIN products p ON sm.sku = p.sku
         ORDER BY sm.created_at DESC LIMIT 100;`
      );
      return NextResponse.json({ movements: ledgerResult.rows, count: ledgerResult.rows.length });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query stock ledger';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  if (view === 'locations') {
    try {
      const locations = await repo.getInventoryLocations();
      return NextResponse.json({ locations, count: locations.length });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query locations';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  if (view === 'units') {
    try {
      const units = await repo.getProductUnits(productId ? Number(productId) : undefined, sku || undefined);
      return NextResponse.json({ units, count: units.length });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query serialized units';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  if (sku) {
    try {
      const balance = await repo.getBalance(productId ? Number(productId) : 0, sku);
      const history = await repo.getHistory(sku);
      return NextResponse.json({ balance, history });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inventory lookup failed';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // If no specific sku requested, return summary of all known stock movements / balances
  try {
    const allMovements = await (repo as unknown as { pool: { query: Function } }).pool.query(
      `SELECT p.id as product_id, p.name, p.sku,
        COALESCE(SUM(CASE WHEN sm.movement_type = 'receipt' THEN sm.quantity 
                          WHEN sm.movement_type = 'deduction' THEN -sm.quantity 
                          WHEN sm.movement_type = 'defect_scrap' THEN -sm.quantity 
                          WHEN sm.movement_type = 'adjustment' THEN sm.quantity ELSE 0 END), 0)::integer as on_hand,
        COALESCE(SUM(CASE WHEN sm.movement_type = 'reservation' THEN sm.quantity 
                          WHEN sm.movement_type = 'release' THEN -sm.quantity 
                          WHEN sm.movement_type = 'deduction' THEN -sm.quantity ELSE 0 END), 0)::integer as reserved
       FROM "products" p
       LEFT JOIN "stock_movements" sm ON p.sku = sm.sku
       GROUP BY p.id, p.name, p.sku
       ORDER BY p.name ASC`
    );

    const items = allMovements.rows.map((row: any) => {
      const onHand = Math.max(0, Number(row.on_hand || 0));
      const reserved = Math.max(0, Number(row.reserved || 0));
      const available = Math.max(0, onHand - reserved);
      return {
        productId: String(row.product_id),
        name: row.name,
        sku: row.sku,
        onHand,
        reserved,
        available,
        isLowStock: available > 0 && available <= 2,
        isOutOfStock: available === 0,
      };
    });

    return NextResponse.json({ items, count: items.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve stock list';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/operations/inventory
// Action: record receipt, reservation, release, deduction, or adjustment
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations'])) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges for inventory modification' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'create_location') {
      const { code, name, type, address } = body;
      if (!code || !name) {
        return NextResponse.json({ error: 'code and name are required' }, { status: 400 });
      }
      const location = await repo.createInventoryLocation({ code, name, type, address });
      return NextResponse.json({ success: true, location });
    }

    if (action === 'register_unit') {
      const { productId, sku, serialNumber, locationId, binLocation, unitStatus } = body;
      if (!productId || !sku || !serialNumber) {
        return NextResponse.json({ error: 'productId, sku, and serialNumber are required' }, { status: 400 });
      }
      const unit = await repo.registerProductUnit({
        productId: Number(productId),
        sku,
        serialNumber,
        locationId: locationId ? Number(locationId) : undefined,
        binLocation,
        unitStatus,
      });
      return NextResponse.json({ success: true, unit });
    }

    if (action === 'update_unit_location') {
      const { unitId, locationId, binLocation } = body;
      if (!unitId || !locationId) {
        return NextResponse.json({ error: 'unitId and locationId are required' }, { status: 400 });
      }
      const updatedUnit = await repo.updateUnitLocation(Number(unitId), Number(locationId), binLocation);
      return NextResponse.json({ success: true, unit: updatedUnit });
    }

    if (action === 'direct_sale') {
      const { customerName, customerEmail, customerPhone, locationId, items, paymentMethod, paymentReference, notes } = body;
      if (!customerName || !items || !Array.isArray(items) || items.length === 0 || !paymentMethod) {
        return NextResponse.json({ error: 'customerName, items array, and paymentMethod are required' }, { status: 400 });
      }
      if (paymentMethod !== 'cash' && (!paymentReference || !paymentReference.trim())) {
        return NextResponse.json({ error: `Payment reference / UTR is mandatory for non-cash settlement method: ${paymentMethod}` }, { status: 400 });
      }
      const saleResult = await repo.recordDirectSale({
        customerName,
        customerEmail,
        customerPhone,
        locationId: locationId ? Number(locationId) : undefined,
        items,
        paymentMethod,
        paymentReference: paymentReference?.trim(),
        performedBy: user?.email || 'Operations Desk',
        notes,
      });
      return NextResponse.json({ success: true, ...saleResult });
    }

    const { productId, sku, movementType, quantity, referenceType, referenceId, notes, performedBy } = body;

    if (!productId || !sku || !movementType || !quantity) {
      return NextResponse.json(
        { error: 'Missing required parameters: productId, sku, movementType, quantity' },
        { status: 400 }
      );
    }

    const movement = await repo.recordStockMovement({
      productId: Number(productId),
      sku,
      movementType,
      quantity: Number(quantity),
      referenceType,
      referenceId,
      notes,
      performedBy: performedBy || user?.email || 'Operations Manager',
    });

    const updatedBalance = await repo.getBalance(Number(productId), sku);
    return NextResponse.json({ success: true, movement, updatedBalance });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Movement rejected';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
