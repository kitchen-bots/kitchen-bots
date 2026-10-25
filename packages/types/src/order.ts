export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'quality_passed'
  | 'ready_for_dispatch'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type FulfillmentStage =
  | 'intake'
  | 'fabrication'
  | 'quality_control'
  | 'crating'
  | 'in_transit'
  | 'accepted';

export type PaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  productId?: string;
  name: string;
  sku?: string;
  pricePaise: number;
  quantity: number;
  image?: string;
  manufacturingStatus?: 'pending' | 'in_fabrication' | 'qc' | 'ready';
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BillingAddress {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType?: 'standard' | 'bulk_b2b' | 'custom_fabrication' | 'institutional';
  customerId?: string;
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  companyName?: string;
  gstin?: string;
  items: OrderItem[];
  totalPaise: number;
  paidPaise?: number;
  paymentReference?: string;
  status: OrderStatus;
  fulfillmentStage?: FulfillmentStage;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  trackingNumber?: string;
  carrier?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  workOrderNumber?: string;
  assignedTechnician?: string;
  qcInspectionNotes?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
