import type { StockMovement, InventoryBalance, StockMovementType } from '@kitchen-bots/types';

export class InventoryLedgerEngine {
  private movements: StockMovement[] = [];
  private thresholds: Map<string, { reorderThreshold: number; warehouseLocation: string }> = new Map();

  constructor(
    initialThresholds?: Array<{ sku: string; reorderThreshold: number; warehouseLocation: string }>
  ) {
    if (initialThresholds) {
      initialThresholds.forEach(t => {
        this.thresholds.set(t.sku, {
          reorderThreshold: t.reorderThreshold,
          warehouseLocation: t.warehouseLocation,
        });
      });
    }
  }

  /**
   * Record a new stock movement with transactional balance validation
   */
  public recordMovement(params: {
    productId: string;
    sku: string;
    movementType: StockMovementType;
    quantity: number;
    referenceType?: StockMovement['referenceType'];
    referenceId?: string;
    notes?: string;
    performedBy?: string;
  }): StockMovement {
    if (params.quantity <= 0) {
      throw new Error(`Movement quantity must be positive, got ${params.quantity}`);
    }

    const currentBalance = this.getBalance(params.productId, params.sku);

    // Guard against negative stock or over-reservation
    switch (params.movementType) {
      case 'reservation':
        if (params.quantity > currentBalance.available) {
          throw new Error(
            `Insufficient available stock for ${params.sku}. Requested: ${params.quantity}, Available: ${currentBalance.available} (On Hand: ${currentBalance.onHand}, Reserved: ${currentBalance.reserved})`
          );
        }
        break;

      case 'deduction':
        if (params.quantity > currentBalance.onHand) {
          throw new Error(
            `Cannot deduct ${params.quantity} from ${params.sku}. On-hand inventory is only ${currentBalance.onHand}.`
          );
        }
        break;

      case 'release':
        if (params.quantity > currentBalance.reserved) {
          throw new Error(
            `Cannot release ${params.quantity} for ${params.sku}. Currently reserved is only ${currentBalance.reserved}.`
          );
        }
        break;

      case 'adjustment':
        // For physical reconciliation, ensure resulting on-hand is non-negative
        // Caller specifies delta: positive for surplus, handled by receipt logic
        break;
    }

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      productId: params.productId,
      sku: params.sku,
      movementType: params.movementType,
      quantity: params.quantity,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      notes: params.notes,
      performedBy: params.performedBy,
      createdAt: new Date().toISOString(),
    };

    this.movements.push(movement);
    return movement;
  }

  /**
   * Calculate current stock balance strictly using formula:
   * available = onHand - reserved
   */
  public getBalance(productId: string, sku: string): InventoryBalance {
    const skuMovements = this.movements.filter(m => m.sku === sku || m.productId === productId);

    let onHand = 0;
    let reserved = 0;

    for (const m of skuMovements) {
      switch (m.movementType) {
        case 'receipt':
          onHand += m.quantity;
          break;
        case 'reservation':
          reserved += m.quantity;
          break;
        case 'release':
          reserved = Math.max(0, reserved - m.quantity);
          break;
        case 'deduction':
          onHand = Math.max(0, onHand - m.quantity);
          reserved = Math.max(0, reserved - m.quantity); // Deducted stock fulfills reservation
          break;
        case 'defect_scrap':
          onHand = Math.max(0, onHand - m.quantity);
          break;
        case 'adjustment':
          onHand = Math.max(0, onHand + m.quantity);
          break;
      }
    }

    const available = Math.max(0, onHand - reserved);
    const config = this.thresholds.get(sku) || { reorderThreshold: 2, warehouseLocation: 'Factory Bay 1' };

    return {
      productId,
      sku,
      onHand,
      reserved,
      available,
      reorderThreshold: config.reorderThreshold,
      warehouseLocation: config.warehouseLocation,
      isLowStock: available > 0 && available <= config.reorderThreshold,
      isOutOfStock: available === 0,
    };
  }

  /**
   * Retrieve historical audit trail for SKU or Product
   */
  public getHistory(sku: string): StockMovement[] {
    return this.movements
      .filter(m => m.sku === sku)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all products currently below safety threshold
   */
  public getLowStockAlerts(allSkus: Array<{ productId: string; sku: string }>): InventoryBalance[] {
    return allSkus
      .map(item => this.getBalance(item.productId, item.sku))
      .filter(b => b.isLowStock || b.isOutOfStock);
  }
}
