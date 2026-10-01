export type QuoteStatus = 'draft' | 'submitted' | 'under_review' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface QuoteItem {
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  customRequirements?: string;
  quotedPricePaise?: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId?: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  city?: string;
  items: QuoteItem[];
  status: QuoteStatus;
  estimatedPaise?: number;
  validUntil?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
