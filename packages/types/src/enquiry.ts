export type EnquiryStatus =
  | 'new'
  | 'under_review'
  | 'contacted'
  | 'clarification'
  | 'quote_in_progress'
  | 'quote_sent'
  | 'awaiting_response'
  | 'converted'
  | 'closed_won'
  | 'closed_lost'
  | 'spam';

export type EnquirySource = 'direct' | 'website';

export type EnquiryPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface EnquiryItem {
  productId?: string;
  productName?: string;
  quantity?: number;
  notes?: string;
}

export interface EnquiryCommunication {
  id: string | number;
  enquiryId: string | number;
  type: 'email' | 'call' | 'message' | 'internal_note';
  subject?: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface EnquiryFollowup {
  id: string | number;
  enquiryId: string | number;
  task: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'pending' | 'completed' | 'overdue';
  createdAt: string;
}

export interface EnquiryRecord {
  id: string | number;
  reference: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  message: string;
  status: EnquiryStatus;
  source: EnquirySource;
  priority: EnquiryPriority;
  assignedTo?: string;
  items?: EnquiryItem[];
  expectedQuantity?: number;
  targetBudgetPaise?: number;
  deliveryLocation?: string;
  expectedTimeline?: string;
  productOfInterest?: string;
  lastResponseDate?: string;
  nextFollowupDate?: string;
  linkedCustomerId?: string;
  linkedQuoteId?: string;
  linkedOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export type Enquiry = EnquiryRecord;

export interface EnquiryDetailResponse {
  enquiry: EnquiryRecord;
  communications: EnquiryCommunication[];
  followups: EnquiryFollowup[];
  relatedQuotes: any[];
  relatedOrders: any[];
  linkedCustomer?: any;
  timeline: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    actor?: string;
  }>;
}

export interface EnquiryMetrics {
  total: number;
  newEnquiries: number;
  awaitingResponse: number;
  inProgress: number;
  converted: number;
  closed: number;
  overdueFollowups: number;
}
