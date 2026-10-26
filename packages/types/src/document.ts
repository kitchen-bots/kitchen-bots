export type DocumentCategory =
  | 'warranty'
  | 'policies'
  | 'manuals'
  | 'commercial'
  | 'service'
  | 'internal'
  | 'compliance'
  | 'reports';

export type DocumentStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'published'
  | 'archived';

export type DocumentVisibility =
  | 'internal'
  | 'restricted'
  | 'customer'
  | 'public';

export interface DocumentVersion {
  id: string | number;
  documentId: string | number;
  version: string;
  fileName: string;
  filePath?: string;
  fileSizeBytes: number;
  notes?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface DocumentActivity {
  id: string | number;
  documentId: string | number;
  action: string;
  details: string;
  actor: string;
  createdAt: string;
}

export interface BusinessDocument {
  id: string | number;
  reference: string;
  title: string;
  category: DocumentCategory;
  documentType: string;
  description?: string;
  fileName: string;
  filePath?: string;
  fileSizeBytes: number;
  fileMimeType: string;
  version: string;
  status: DocumentStatus;
  visibility: DocumentVisibility;
  owner: string;
  tags: string[];
  effectiveDate?: string;
  expiryDate?: string;
  // Cross module links
  productId?: string | number;
  productName?: string;
  productSku?: string;
  orderId?: string | number;
  orderReference?: string;
  serviceId?: string | number;
  serviceReference?: string;
  customerEmail?: string;
  customerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMetrics {
  totalDocuments: number;
  publishedApproved: number;
  draftDocuments: number;
  awaitingReview: number;
  expiringSoon: number;
  recentlyUpdated: number;
  totalStorageBytes: number;
}

export interface DocumentDetailResponse {
  document: BusinessDocument;
  versions: DocumentVersion[];
  activities: DocumentActivity[];
  linkedProduct?: any;
  linkedOrder?: any;
  linkedService?: any;
}
