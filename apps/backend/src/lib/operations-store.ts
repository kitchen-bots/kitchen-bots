import { InventoryLedgerEngine } from '@/lib/inventory-ledger';
import { InvoicingEngine } from '@/lib/invoicing-engine';

const globalStore = global as unknown as {
  __inventoryEngine?: InventoryLedgerEngine;
  __invoicingEngine?: InvoicingEngine;
};

if (!globalStore.__inventoryEngine) {
  globalStore.__inventoryEngine = new InventoryLedgerEngine();
}

if (!globalStore.__invoicingEngine) {
  globalStore.__invoicingEngine = new InvoicingEngine();
}

export const inventoryEngine = globalStore.__inventoryEngine;
export const invoicingEngine = globalStore.__invoicingEngine;
