export type StockMovementType =
  | 'receipt'       // Supplier delivery / raw material intake
  | 'reservation'   // Allocated to confirmed commercial order
  | 'release'       // Released back into pool upon order cancellation
  | 'deduction'     // Picked & packed for dispatch (inventory leaves warehouse)
  | 'adjustment'    // Physical audit correction / cycle count reconciliation
  | 'defect_scrap'; // Scrapped during QA inspection

export interface StockMovement {
  id: string;
  productId: string;
  sku: string;
  movementType: StockMovementType;
  quantity: number; // positive for intake/release, negative for deduction/reservation
  referenceType?: 'order' | 'supplier_po' | 'cycle_count' | 'qa_inspection';
  referenceId?: string;
  notes?: string;
  performedBy?: string;
  createdAt: string;
}

export interface InventoryBalance {
  productId: string;
  sku: string;
  onHand: number;      // Total physically present in warehouse
  reserved: number;    // Allocated to pending commercial orders
  available: number;   // onHand - reserved (must never be negative)
  reorderThreshold: number; // Low stock threshold trigger
  warehouseLocation?: string; // e.g. "Aisle B-04, Rack 2"
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string; // e.g. KB-INV-2026-0001
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  billingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    gstin?: string;
  };
  lineItems: Array<{
    name: string;
    sku?: string;
    hsnCode?: string;
    quantity: number;
    unitPricePaise: number;
    totalPaise: number;
  }>;
  subtotalPaise: number;
  taxGstPaise: number; // 18% standard GST for commercial kitchen machinery
  totalPaise: number;
  paidPaise: number;
  balanceDuePaise: number;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';
  dueDate: string;
  issuedAt: string;
  payments: PaymentTransaction[];
}

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  amountPaise: number;
  paymentMethod: 'bank_neft' | 'upi' | 'card' | 'cheque' | 'cash';
  transactionReference: string; // UTR or Gateway TXN ID
  status: 'pending' | 'success' | 'failed';
  recordedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryLocation {
  id: number;
  code: string;
  name: string;
  type: 'warehouse' | 'retail_store' | 'factory_floor' | 'quarantine';
  address?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface ProductUnit {
  id: number;
  productId: number;
  sku: string;
  serialNumber: string;
  unitStatus: 'available' | 'reserved' | 'dispatched' | 'delivered' | 'quarantined' | 'repair';
  locationId?: number | null;
  locationCode?: string;
  locationName?: string;
  binLocation?: string;
  orderId?: number | null;
  orderNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DirectSaleRecord {
  id: number;
  saleNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  locationId?: number;
  locationName?: string;
  subtotalPaise: number;
  taxGstPaise: number;
  totalPaise: number;
  paymentMethod: string;
  paymentReference?: string;
  status: string;
  orderId?: number;
  invoiceId?: string;
  performedBy?: string;
  notes?: string;
  createdAt: string;
}

