export type EnquiryStatus = 'new' | 'in_progress' | 'contacted' | 'resolved' | 'archived';

export interface EnquiryItem {
  productId: string;
  quantity: number;
}

export interface Enquiry {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  message: string;
  items?: EnquiryItem[];
  status: EnquiryStatus;
  createdAt: string;
  updatedAt?: string;
}
