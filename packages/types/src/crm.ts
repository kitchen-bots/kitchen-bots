export type CustomerType = 'individual' | 'wholesale';
export type CustomerAccountStatus = 'active' | 'pending' | 'dormant' | 'archived';

export interface CustomerSummary {
  id: string; // email or user id
  customerCode: string; // e.g. CUST-0012
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  customerType: CustomerType;
  accountStatus: CustomerAccountStatus;
  isReturning: boolean;
  totalOrders: number;
  completedOrders: number;
  totalSpentPaise: number;
  outstandingPaise: number;
  latestOrderNumber?: string;
  latestOrderStatus?: string;
  latestOrderDate?: string;
  customerSince: string;
  lastPurchaseDaysAgo?: number;
  averageOrderValuePaise?: number;
  billingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    gstin?: string;
  };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export type CustomerRequestCategory =
  | 'product_enquiry'
  | 'pricing_wholesale'
  | 'quote_request'
  | 'order_status'
  | 'delivery_courier'
  | 'payment_invoice'
  | 'installation'
  | 'warranty_claim'
  | 'maintenance_repair'
  | 'return_refund'
  | 'complaint_feedback'
  | 'other';

export type CustomerRequestStatus =
  | 'new'
  | 'open'
  | 'in_progress'
  | 'waiting_customer'
  | 'waiting_internal'
  | 'resolved'
  | 'closed';

export type CustomerRequestPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CustomerRequest {
  id: string | number;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  category: CustomerRequestCategory;
  subject: string;
  description: string;
  priority: CustomerRequestPriority;
  status: CustomerRequestStatus;
  assignedStaff?: string;
  nextFollowupDate?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerNote {
  id: string;
  customerEmail: string;
  note: string;
  author: string;
  createdAt: string;
}

export interface CustomerFollowup {
  id: string;
  customerEmail: string;
  task: string;
  dueDate?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}
