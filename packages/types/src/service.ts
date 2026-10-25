export type ServiceType = 'warranty' | 'support' | 'repair';

export type ServiceStatus =
  | 'new'
  | 'investigating'
  | 'awaiting_customer'
  | 'awaiting_parts'
  | 'diagnosed'
  | 'in_progress'
  | 'testing'
  | 'resolved'
  | 'ready_dispatch'
  | 'closed'
  | 'rejected'
  | 'cancelled';

export type ServicePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ServicePartItem {
  id: string | number;
  serviceId: string | number;
  productId?: string | number;
  partSku: string;
  partName: string;
  quantity: number;
  unitPricePaise: number;
  status: 'needed' | 'reserved' | 'consumed' | 'returned';
  createdAt: string;
}

export interface ServiceActivity {
  id: string | number;
  serviceId: string | number;
  type: 'internal_note' | 'customer_message' | 'status_change' | 'troubleshooting' | 'work_log' | 'decision';
  title?: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface ServiceCase {
  id: string | number;
  reference: string;
  type: ServiceType;
  customerId?: string | number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  productId?: string | number;
  productName?: string;
  productSku?: string;
  serialNumber?: string;
  orderId?: string | number;
  orderReference?: string;
  purchaseDate?: string;
  warrantyStartDate?: string;
  warrantyExpiryDate?: string;
  warrantyStatus?: 'active' | 'expired' | 'unverified' | 'void';
  subject: string;
  category: string;
  description: string;
  status: ServiceStatus;
  priority: ServicePriority;
  assignedTo?: string;
  assignedTechnician?: string;
  dueDate?: string;
  resolutionSummary?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  // Warranty fields
  warrantyDecision?: 'pending' | 'approved' | 'rejected';
  warrantyDecisionReason?: string;
  warrantyDecisionBy?: string;
  warrantyDecisionAt?: string;
  approvedResolution?: 'repair' | 'replacement' | 'parts' | 'refund' | 'guidance';
  // Repair fields
  repairStage?: string;
  diagnosedFault?: string;
  probableCause?: string;
  partsEstimatePaise?: number;
  labourEstimatePaise?: number;
  totalEstimatePaise?: number;
  customerApproved?: boolean;
  customerApprovedAt?: string;
  qualityChecked?: boolean;
  qualityCheckedBy?: string;
  qualityCheckedAt?: string;
  qualityCheckNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceMetrics {
  totalCases: number;
  newAwaitingReview: number;
  openInProgress: number;
  pendingWarrantyDecisions: number;
  approvedWarrantyClaims: number;
  repairsInProgress: number;
  awaitingCustomerResponse: number;
  overdueCases: number;
  resolvedClosedCases: number;
}

export interface ServiceDetailResponse {
  caseRecord: ServiceCase;
  activities: ServiceActivity[];
  parts: ServicePartItem[];
  linkedCustomer?: any;
  linkedProduct?: any;
  linkedOrder?: any;
}
