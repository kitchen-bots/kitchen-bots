'use client';
import React, { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  Boxes,
  Truck,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CreditCard,
  UserCheck,
  Search,
  Filter,
  Plus,
  Eye,
  RefreshCw,
  Sparkles,
  Package,
  Activity,
  Shield,
  Image as ImageIcon,
  Video,
  RotateCw,
  BarChart2,
  Check,
  ExternalLink,
  SlidersHorizontal,
  BookOpen,
  AlertCircle,
  FileCheck,
  Users,
  Building2,
  UserPlus,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  ChevronRight,
  DollarSign,
  Send,
  Warehouse,
  QrCode,
  Tag,
  MapPin,
  Printer,
  X,
} from 'lucide-react';
import type { CustomerSummary, CustomerRequest, CustomerNote, CustomerFollowup, EnquiryRecord, EnquiryMetrics, EnquiryDetailResponse, ServiceCase, ServiceMetrics, ServiceDetailResponse, ServiceType, BusinessDocument, DocumentMetrics, DocumentDetailResponse, DocumentCategory, InventoryLocation, ProductUnit, DirectSaleRecord } from '@kitchen-bots/types';
import { CrmWorkspace } from './CrmWorkspace';
import { EnquiriesWorkspace } from './EnquiriesWorkspace';
import { ServicesWorkspace } from './ServicesWorkspace';
import { DocumentsWorkspace } from './DocumentsWorkspace';
import { InvoicesWorkspace } from './InvoicesWorkspace';
import { PaymentsWorkspace, BillingPaymentRecord } from './PaymentsWorkspace';
import { HrWorkspace } from './HrWorkspace';
import { EmployeePortal } from './EmployeePortal';
import { UserManagementWorkspace } from './UserManagementWorkspace';

interface OrderRecord {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  totalPaise?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  items?: Array<{ name: string; quantity: number; pricePaise: number; sku?: string }>;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
}

interface ProductRecord {
  id: string;
  name: string;
  slug?: string;
  sku?: string;
  category?: { id?: number; title?: string; slug?: string } | string;
  pricePaise?: number;
  status?: 'Active' | 'Draft' | 'Archived' | string;
  salesMode?: 'direct' | 'quote' | 'both' | string;
  featured?: boolean;
  shortDescription?: string;
  description?: string;
  primaryImage?: string;
  imageUrls?: Array<{ id?: string; url: string }>;
  features?: Array<{ id?: string; feature: string }>;
  specifications?: Array<{ id?: string; name: string; value: string; group?: string }> | Record<string, string>;
  sequenceId?: string;
  sequenceFrameCount?: number;
  has3D?: boolean;
  hasVideo?: boolean;
  videoPath?: string;
  warranty?: string;
  createdAt?: string;
  updatedAt?: string;
}


interface QuoteRecord {
  id: string;
  quoteNumber?: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  estimatedPaise?: number;
  status?: string;
  createdAt?: string;
}

interface ServiceRecord {
  id: string;
  ticketNumber?: string;
  companyName?: string;
  contactName?: string;
  equipmentName?: string;
  priority?: string;
  status?: string;
  issueDescription?: string;
  createdAt?: string;
}

// ── 6 Coordinated Accent Palettes ──
export type PaletteId = 'ocean' | 'emerald' | 'violet' | 'amber' | 'rose' | 'teal';

export interface PaletteConfig {
  id: PaletteId;
  name: string;
  colors: [string, string, string]; // [Primary, Secondary, Neutral]
  primary: string;
  secondary: string;
  neutral: string;
  lightBg: string;
  subtleBorder: string;
}

export const PALETTES: Record<PaletteId, PaletteConfig> = {
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    colors: ['#2563EB', '#0EA5E9', '#64748B'],
    primary: '#2563EB',
    secondary: '#0EA5E9',
    neutral: '#64748B',
    lightBg: 'rgba(37, 99, 235, 0.08)',
    subtleBorder: 'rgba(37, 99, 235, 0.25)',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    colors: ['#059669', '#14B8A6', '#64748B'],
    primary: '#059669',
    secondary: '#14B8A6',
    neutral: '#64748B',
    lightBg: 'rgba(5, 150, 105, 0.08)',
    subtleBorder: 'rgba(5, 150, 105, 0.25)',
  },
  violet: {
    id: 'violet',
    name: 'Violet',
    colors: ['#7C3AED', '#A78BFA', '#64748B'],
    primary: '#7C3AED',
    secondary: '#A78BFA',
    neutral: '#64748B',
    lightBg: 'rgba(124, 58, 237, 0.08)',
    subtleBorder: 'rgba(124, 58, 237, 0.25)',
  },
  amber: {
    id: 'amber',
    name: 'Amber',
    colors: ['#D97706', '#F59E0B', '#64748B'],
    primary: '#D97706',
    secondary: '#F59E0B',
    neutral: '#64748B',
    lightBg: 'rgba(217, 119, 6, 0.08)',
    subtleBorder: 'rgba(217, 119, 6, 0.25)',
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    colors: ['#E11D48', '#FB7185', '#64748B'],
    primary: '#E11D48',
    secondary: '#FB7185',
    neutral: '#64748B',
    lightBg: 'rgba(225, 29, 72, 0.08)',
    subtleBorder: 'rgba(225, 29, 72, 0.25)',
  },
  teal: {
    id: 'teal',
    name: 'Teal',
    colors: ['#0F766E', '#2DD4BF', '#64748B'],
    primary: '#0F766E',
    secondary: '#2DD4BF',
    neutral: '#64748B',
    lightBg: 'rgba(15, 118, 110, 0.08)',
    subtleBorder: 'rgba(15, 118, 110, 0.25)',
  },
};

const R2_PUBLIC_CDN = 'https://pub-a4b0711cb441484fbb54bc792d2312b5.r2.dev';

export function resolveMediaUrl(rawPath?: string | null): string {
  if (!rawPath) return '';
  let pathStr = rawPath.trim();
  if (pathStr.startsWith('{')) {
    try {
      const parsed = JSON.parse(pathStr);
      if (parsed.url) pathStr = parsed.url;
    } catch {
      // not JSON
    }
  }
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('data:') || pathStr.startsWith('blob:')) {
    return pathStr;
  }
  const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
  return `${R2_PUBLIC_CDN}${cleanPath}`;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'inventory' | 'ledger' | 'manufacturing' | 'crm' | 'enquiries' | 'services' | 'documents' | 'invoicing' | 'payments' | 'hr' | 'reports' | 'employee' | 'users'>('overview');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync activeTab and orderStatusTab with URL search params on mount & popstate
  useEffect(() => {
    // Identify active user role
    fetch('/api/users/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role) {
          setUserRole(data.user.role);
          // If the authenticated user is an employee and no specific tab or admin tab is requested, default to employee portal
          const params = new URLSearchParams(window.location.search);
          const currentUrlTab = params.get('tab');
          if (data.user.role === 'employee' && (!currentUrlTab || currentUrlTab === 'overview' || currentUrlTab === 'hr')) {
            setActiveTab('employee');
          }
        }
      })
      .catch(() => {});

    const syncTabFromUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        const validTabs = ['overview', 'orders', 'products', 'inventory', 'ledger', 'manufacturing', 'crm', 'enquiries', 'services', 'documents', 'invoicing', 'payments', 'hr', 'reports', 'employee', 'users'];
        if (tab && validTabs.includes(tab)) {
          setActiveTab(tab as any);
        }
        const oTab = params.get('orderStatus');
        if (oTab === 'completed' || oTab === 'pending' || oTab === 'cancelled') {
          setOrderStatusTab(oTab);
        }
      } catch {
        // ignore
      }
    };

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    return () => window.removeEventListener('popstate', syncTabFromUrl);
  }, []);

  const handleTabChange = (newTab: typeof activeTab) => {
    setActiveTab(newTab);
    setSearchQuery('');
    try {
      const url = new URL(window.location.href);
      if (newTab === 'overview') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', newTab);
      }
      window.history.pushState({}, '', url.toString());
      // Dispatch custom event so CustomNav immediately reflects active state
      window.dispatchEvent(new Event('kb-tab-change'));
    } catch {
      // ignore
    }
  };

  const handleOrderStatusTabChange = (sTab: 'completed' | 'pending' | 'cancelled') => {
    setOrderStatusTab(sTab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'orders');
      url.searchParams.set('orderStatus', sTab);
      window.history.pushState({}, '', url.toString());
      window.dispatchEvent(new Event('kb-tab-change'));
    } catch {
      // ignore
    }
  };

  // Theme Palette state (persisted to localStorage)
  const [palette, setPalette] = useState<PaletteId>('ocean');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kb_admin_palette') as PaletteId;
      if (saved && PALETTES[saved]) {
        setPalette(saved);
        document.documentElement.setAttribute('data-palette', saved);
      } else {
        document.documentElement.setAttribute('data-palette', 'ocean');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const changePalette = (newPal: PaletteId) => {
    setPalette(newPal);
    try {
      localStorage.setItem('kb_admin_palette', newPal);
      document.documentElement.setAttribute('data-palette', newPal);
    } catch {
      // Ignore
    }
  };

  const currentTheme = PALETTES[palette] || PALETTES.ocean;

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Order Drawer / Modal View
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [focusInvoiceId, setFocusInvoiceId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [newOrderStatus, setNewOrderStatus] = useState<string>('pending');
  const [transitionReason, setTransitionReason] = useState<string>('');

  // Orders Workspace Tab & Diagnostic State
  const [orderStatusTab, setOrderStatusTab] = useState<'completed' | 'pending' | 'cancelled'>('pending');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'ALL' | 'bulk' | 'individual'>('ALL');
  const [orderBlockers, setOrderBlockers] = useState<Array<{ id: string; order_id: number; category: string; reason: string; diagnostic_details?: string; responsible_team?: string; next_action?: string; status: string; created_at: string }>>([]);
  const [orderCancellations, setOrderCancellations] = useState<Array<{ id: string; order_id: number; reason_category: string; reason_explanation?: string; actor_category: string; actor_identity?: string; created_at: string }>>([]);
  const [orderTimeline, setOrderTimeline] = useState<Array<{ id: string; type: string; title: string; description?: string; actor?: string; timestamp: string }>>([]);
  const [isAddingBlocker, setIsAddingBlocker] = useState(false);
  const [blockerForm, setBlockerForm] = useState({ category: 'Payment and billing', reason: '', diagnosticDetails: '', responsibleTeam: 'Finance / Accounts', nextAction: '' });
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [cancelForm, setCancelForm] = useState({ reasonCategory: 'Customer requested cancellation', reasonExplanation: '', actorCategory: 'administrator' as 'customer' | 'administrator' | 'system_automation' | 'external_integration', actorIdentity: '' });

  // HR state
  const [staffList, setStaffList] = useState<Array<{ id: string; employee_id: string; full_name: string; department: string; job_title: string; status: string }>>([]);
  const [attendanceList, setAttendanceList] = useState<Array<{ id: string; staff_id: string; full_name: string; date: string; status: string; working_hours?: number; check_in?: string; check_out?: string }>>([]);
  const [leaveList, setLeaveList] = useState<Array<{ id: string; full_name: string; leave_type: string; start_date: string; end_date: string; reason: string; status: string }>>([]);
  const [allocationsList, setAllocationsList] = useState<Array<{ id: string; staff_id: string; full_name?: string; order_id?: number; task_name: string; stage: string; status: string }>>([]);
  const [workLogsList, setWorkLogsList] = useState<Array<{ id: string; staff_id: string; full_name: string; date: string; task_description: string; order_id?: number; time_spent_minutes: number; completed_work?: string; pending_work?: string; blockers?: string; status: string; reviewed_by?: string; review_notes?: string }>>([]);
  const [hrSummary, setHrSummary] = useState<{ totalStaff: number; present: number; absent: number; late: number; onLeave: number; missingCheckOut: number } | null>(null);
  const [hrDateFilter, setHrDateFilter] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [hrSubTab, setHrSubTab] = useState<'attendance' | 'work_logs' | 'staff' | 'leaves'>('attendance');
  const [correctionTarget, setCorrectionTarget] = useState<{ id: string; full_name: string; check_in?: string; check_out?: string } | null>(null);
  const [correctionForm, setCorrectionForm] = useState({ correctedCheckIn: '', correctedCheckOut: '', reason: '' });
  const [newWorkLogForm, setNewWorkLogForm] = useState({ staffId: '', date: new Date().toISOString().slice(0, 10), taskDescription: '', orderId: '', timeSpentMinutes: 60, completedWork: '', pendingWork: '', blockers: '' });
  const [isSubmittingWorkLog, setIsSubmittingWorkLog] = useState(false);

  // Invoices & Billing state
  const [invoicesList, setInvoicesList] = useState<Array<{ id: string; invoice_number: string; customer_name: string; customer_email: string; total_paise: number; paid_paise: number; balance_due_paise: number; status: string; issued_at: string }>>([]);
  const [paymentsList, setPaymentsList] = useState<BillingPaymentRecord[]>([]);

  // Inventory Stock Balances, Warehouses & Units from PostgreSQL
  const [inventoryBalances, setInventoryBalances] = useState<Array<{ productId: string; name: string; sku: string; onHand: number; reserved: number; available: number; isLowStock: boolean; isOutOfStock: boolean }>>([]);
  const [stockMovementsList, setStockMovementsList] = useState<Array<{ id: string; sku: string; product_name?: string; movement_type: string; quantity: number; reference_type?: string; reference_id?: string; notes?: string; performed_by?: string; created_at: string }>>([]);
  const [isRecordingStock, setIsRecordingStock] = useState(false);
  const [stockFormData, setStockFormData] = useState({ productId: '', sku: '', movementType: 'receipt', quantity: 1, notes: '' });

  // Warehouse Locations & Serialized Units State
  const [inventorySubTab, setInventorySubTab] = useState<'balances' | 'locations' | 'units'>('balances');
  const [locationsList, setLocationsList] = useState<InventoryLocation[]>([]);
  const [unitsList, setUnitsList] = useState<ProductUnit[]>([]);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState({ code: '', name: '', type: 'warehouse' as const, address: '' });
  const [isRegisteringUnit, setIsRegisteringUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({ productId: '', sku: '', serialNumber: '', locationId: '', binLocation: '' });
  const [movingUnit, setMovingUnit] = useState<ProductUnit | null>(null);
  const [moveUnitLocationId, setMoveUnitLocationId] = useState('');
  const [moveUnitBin, setMoveUnitBin] = useState('');

  // POS / Direct Counter Sale State
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [posSubmitting, setPosSubmitting] = useState(false);
  const [posForm, setPosForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    locationId: '',
    productId: '',
    quantity: 1,
    paymentMethod: 'cash' as 'cash' | 'bank_neft' | 'upi',
    paymentReference: '',
    notes: 'Direct counter walk-in sale',
  });
  const [completedPosSale, setCompletedPosSale] = useState<DirectSaleRecord | null>(null);

  // ── Products Workspace State ──
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [productFilterSegment, setProductFilterSegment] = useState<'ALL' | 'in_manufacturing' | 'dead_stock' | 'low_stock' | 'out_of_stock' | 'fast_moving' | 'with_stock'>('ALL');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('ALL');
  const [productSortOption, setProductSortOption] = useState<'name_asc' | 'recently_added' | 'stock_high' | 'stock_low' | 'most_ordered' | 'least_ordered'>('recently_added');
  const [activeProductDetailTab, setActiveProductDetailTab] = useState<'overview' | 'media' | 'specs' | 'docs'>('overview');
  const [deadStockThresholdDays, setDeadStockThresholdDays] = useState<number>(60); // configurable inactivity days
  const [isCreatingProduct, setIsCreatingProduct] = useState<boolean>(false);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    categoryTitle: 'Collapsible BBQ',
    pricePaise: 2999900,
    status: 'Active' as 'Active' | 'Draft' | 'Archived',
    salesMode: 'both' as 'direct' | 'quote' | 'both',
    shortDescription: '',
    description: '',
    primaryImage: '',
    warranty: '1 Year Manufacturer Structural Warranty',
    sequenceId: '',
    sequenceFrameCount: 36,
    has3D: false,
    hasVideo: false,
    videoPath: '',
    specs: [
      { name: 'Material', value: '304 Stainless Steel & Heavy Gauge Steel', group: 'General' },
      { name: 'Dimensions', value: '750 x 420 x 600 mm', group: 'Dimensions' },
      { name: 'Fuel Type', value: 'Charcoal / Wood Briquettes', group: 'Performance' },
    ],
  });
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [turntableFrame, setTurntableFrame] = useState<number>(0);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [imageUploadProgress, setImageUploadProgress] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Task allocation form
  const [isAllocatingTask, setIsAllocatingTask] = useState(false);
  const [taskFormData, setTaskFormData] = useState({ staffId: '', orderId: '', taskName: '', stage: 'fabrication' });

  // Reports state
  const [reportLoading, setReportLoading] = useState(false);

  // ── CRM Workspace State ──
  const [crmMetrics, setCrmMetrics] = useState<{
    totalCustomers: number;
    individualCustomers: number;
    wholesaleCustomers: number;
    returningCustomers: number;
    totalRevenuePaise: number;
    outstandingPaise: number;
    pendingRequests: number;
    newCustomers: number;
  }>({
    totalCustomers: 0,
    individualCustomers: 0,
    wholesaleCustomers: 0,
    returningCustomers: 0,
    totalRevenuePaise: 0,
    outstandingPaise: 0,
    pendingRequests: 0,
    newCustomers: 0,
  });
  const [crmCustomers, setCrmCustomers] = useState<CustomerSummary[]>([]);
  const [crmRequests, setCrmRequests] = useState<CustomerRequest[]>([]);
  const [crmLoading, setCrmLoading] = useState<boolean>(false);
  const [crmActiveSubTab, setCrmActiveSubTab] = useState<'individual' | 'wholesale' | 'recurring' | 'requests'>('individual');
  const [crmPeriodFilter, setCrmPeriodFilter] = useState<'all' | '30' | '90' | '180'>('all');
  const [crmSearchQuery, setCrmSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [crmCustomerDetail, setCrmCustomerDetail] = useState<any | null>(null);
  const [crmDetailLoading, setCrmDetailLoading] = useState<boolean>(false);
  const [crmDetailTab, setCrmDetailTab] = useState<'overview' | 'orders' | 'invoices' | 'addresses' | 'requests' | 'quotes' | 'timeline' | 'notes'>('overview');
  const [crmNoteInput, setCrmNoteInput] = useState<string>('');
  const [crmFollowupTask, setCrmFollowupTask] = useState<string>('');
  const [crmFollowupDueDate, setCrmFollowupDueDate] = useState<string>('');
  const [crmRequestFilterCategory, setCrmRequestFilterCategory] = useState<string>('ALL');
  const [crmRequestFilterStatus, setCrmRequestFilterStatus] = useState<string>('ALL');

  // ── Enquiries Module State ──
  const [enquiriesList, setEnquiriesList] = useState<EnquiryRecord[]>([]);
  const [enquiryMetrics, setEnquiryMetrics] = useState<EnquiryMetrics>({
    total: 0,
    newEnquiries: 0,
    awaitingResponse: 0,
    inProgress: 0,
    converted: 0,
    closed: 0,
    overdueFollowups: 0,
  });
  const [enquiryActiveSubTab, setEnquiryActiveSubTab] = useState<'direct' | 'website'>('direct');
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);
  const [enquiryDetail, setEnquiryDetail] = useState<EnquiryDetailResponse | null>(null);
  const [enquiryDetailLoading, setEnquiryDetailLoading] = useState<boolean>(false);
  const [serviceCases, setServiceCases] = useState<ServiceCase[]>([]);
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetrics>({
    totalCases: 0,
    newAwaitingReview: 0,
    openInProgress: 0,
    pendingWarrantyDecisions: 0,
    approvedWarrantyClaims: 0,
    repairsInProgress: 0,
    awaitingCustomerResponse: 0,
    overdueCases: 0,
    resolvedClosedCases: 0,
  });
  const [serviceActiveSubTab, setServiceActiveSubTab] = useState<ServiceType>('warranty');
  const [selectedServiceCase, setSelectedServiceCase] = useState<ServiceCase | null>(null);
  const [serviceDetail, setServiceDetail] = useState<ServiceDetailResponse | null>(null);
  const [serviceDetailLoading, setServiceDetailLoading] = useState<boolean>(false);
  const [documentsList, setDocumentsList] = useState<BusinessDocument[]>([]);
  const [documentMetrics, setDocumentMetrics] = useState<DocumentMetrics>({
    totalDocuments: 0,
    publishedApproved: 0,
    draftDocuments: 0,
    awaitingReview: 0,
    expiringSoon: 0,
    recentlyUpdated: 0,
    totalStorageBytes: 0,
  });
  const [documentActiveCategory, setDocumentActiveCategory] = useState<DocumentCategory | 'all'>('all');
  const [selectedDocument, setSelectedDocument] = useState<BusinessDocument | null>(null);
  const [documentDetail, setDocumentDetail] = useState<DocumentDetailResponse | null>(null);
  const [documentDetailLoading, setDocumentDetailLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const [ordersRes, productsRes, enquiriesRes, quotesRes, servicesRes, hrStaffRes, hrAttRes, hrLeavesRes, hrAllocRes, hrSummaryRes, hrWorkLogsRes, invoicesRes, invRes, ledgerRes, ordWorkspaceRes, crmRes, crmReqRes, opEnqRes, opSrvRes, opDocsRes, paymentsRes, locationsRes, unitsRes] = await Promise.all([
          fetch('/api/orders?limit=100&sort=-createdAt', { credentials: 'include' }),
          fetch('/api/products?limit=100&sort=-createdAt', { credentials: 'include' }),
          fetch('/api/enquiries?limit=50&sort=-createdAt', { credentials: 'include' }),
          fetch('/api/quotes?limit=50&sort=-createdAt', { credentials: 'include' }),
          fetch('/api/services?limit=50&sort=-createdAt', { credentials: 'include' }),
          fetch('/api/operations/hr?tab=staff', { credentials: 'include' }),
          fetch('/api/operations/hr?tab=attendance', { credentials: 'include' }),
          fetch('/api/operations/hr?tab=leaves', { credentials: 'include' }),
          fetch('/api/operations/hr?tab=allocations', { credentials: 'include' }),
          fetch('/api/operations/hr?tab=summary', { credentials: 'include' }),
          fetch('/api/operations/hr?tab=work_logs', { credentials: 'include' }),
          fetch('/api/operations/invoices', { credentials: 'include' }),
          fetch('/api/operations/inventory', { credentials: 'include' }),
          fetch('/api/operations/inventory?view=ledger', { credentials: 'include' }),
          fetch('/api/operations/orders/workspace', { credentials: 'include' }),
          fetch(`/api/operations/crm/customers?segment=all&period=${crmPeriodFilter}`, { credentials: 'include' }),
          fetch('/api/operations/crm/requests', { credentials: 'include' }),
          fetch('/api/operations/enquiries', { credentials: 'include' }),
          fetch('/api/operations/services', { credentials: 'include' }),
          fetch('/api/operations/documents', { credentials: 'include' }),
          fetch('/api/operations/invoices?tab=payments', { credentials: 'include' }),
          fetch('/api/operations/inventory?view=locations', { credentials: 'include' }),
          fetch('/api/operations/inventory?view=units', { credentials: 'include' }),
        ]);

        if (cancelled) return;

        const ordersData = ordersRes.ok ? await ordersRes.json() : { docs: [] };
        const productsData = productsRes.ok ? await productsRes.json() : { docs: [] };
        const enquiriesData = enquiriesRes.ok ? await enquiriesRes.json() : { docs: [] };
        const quotesData = quotesRes.ok ? await quotesRes.json() : { docs: [] };
        const servicesData = servicesRes.ok ? await servicesRes.json() : { docs: [] };
        const hrStaffData = hrStaffRes.ok ? await hrStaffRes.json() : { staff: [] };
        const hrAttData = hrAttRes.ok ? await hrAttRes.json() : { records: [] };
        const hrLeavesData = hrLeavesRes.ok ? await hrLeavesRes.json() : { leaves: [] };
        const hrAllocData = hrAllocRes.ok ? await hrAllocRes.json() : { allocations: [] };
        const hrSummaryData = hrSummaryRes.ok ? await hrSummaryRes.json() : { summary: null };
        const hrWorkLogsData = hrWorkLogsRes.ok ? await hrWorkLogsRes.json() : { workLogs: [] };
        const invoicesData = invoicesRes.ok ? await invoicesRes.json() : { invoices: [] };
        const invData = invRes.ok ? await invRes.json() : { items: [] };
        const ledgerData = ledgerRes.ok ? await ledgerRes.json() : { movements: [] };
        const ordWorkspaceData = ordWorkspaceRes.ok ? await ordWorkspaceRes.json() : { blockers: [], cancellations: [] };
        const crmData = crmRes.ok ? await crmRes.json() : { customers: [], metrics: null };
        const crmReqData = crmReqRes.ok ? await crmReqRes.json() : { requests: [] };
        const opEnqData = opEnqRes.ok ? await opEnqRes.json() : { enquiries: [], metrics: null };
        const opSrvData = opSrvRes.ok ? await opSrvRes.json() : { cases: [], metrics: null };
        const opDocsData = opDocsRes.ok ? await opDocsRes.json() : { documents: [], metrics: null };
        const paymentsData = paymentsRes.ok ? await paymentsRes.json() : { payments: [] };
        const locationsData = locationsRes.ok ? await locationsRes.json() : { locations: [] };
        const unitsData = unitsRes.ok ? await unitsRes.json() : { units: [] };

        if (!cancelled) {
          setStockMovementsList(ledgerData.movements || []);
          if (crmData.customers) setCrmCustomers(crmData.customers);
          if (crmData.metrics) setCrmMetrics(crmData.metrics);
          if (crmReqData.requests) setCrmRequests(crmReqData.requests);
          if (opEnqData.enquiries) setEnquiriesList(opEnqData.enquiries);
          if (opEnqData.metrics) setEnquiryMetrics(opEnqData.metrics);
          if (opSrvData.cases) setServiceCases(opSrvData.cases);
          if (opSrvData.metrics) setServiceMetrics(opSrvData.metrics);
          if (opDocsData.documents) setDocumentsList(opDocsData.documents);
          if (opDocsData.metrics) setDocumentMetrics(opDocsData.metrics);
          if (paymentsData.payments) setPaymentsList(paymentsData.payments);
          if (locationsData.locations) setLocationsList(locationsData.locations);
          if (unitsData.units) setUnitsList(unitsData.units);
        }

        const loadedOrders = (ordersData.docs && ordersData.docs.length > 0)
          ? ordersData.docs
          : (ordWorkspaceData.orders || []);
        setOrders(loadedOrders);
        setProducts(productsData.docs || []);
        setEnquiries(enquiriesData.docs || []);
        setQuotes(quotesData.docs || []);
        setServices(servicesData.docs || []);
        setStaffList(hrStaffData.staff || []);
        setAttendanceList(hrAttData.records || []);
        setLeaveList(hrLeavesData.leaves || []);
        setAllocationsList(hrAllocData.allocations || []);
        setHrSummary(hrSummaryData.summary || null);
        setWorkLogsList(hrWorkLogsData.workLogs || []);
        setInvoicesList(invoicesData.invoices || []);
        setInventoryBalances(invData.items || []);
        setOrderBlockers(ordWorkspaceData.blockers || []);
        setOrderCancellations(ordWorkspaceData.cancellations || []);
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Database communication error');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatRupees = (paise?: number) => {
    if (!paise) return '₹0';
    return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  // Metrics computation derived strictly from real DB records
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let paidRevenue = 0;
    let pendingCount = 0;
    let processingCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;

    orders.forEach((ord) => {
      if (ord.status !== 'cancelled') {
        const total = Number(ord.totalPaise || 0);
        totalRevenue += total;
        if (ord.paymentStatus === 'paid') {
          paidRevenue += total;
        }
      }
      if (ord.status === 'pending') pendingCount++;
      if (ord.status === 'processing') processingCount++;
      if (ord.status === 'shipped') shippedCount++;
      if (ord.status === 'delivered') deliveredCount++;
    });

    const activeQuotes = quotes.filter((q) => q.status !== 'rejected' && q.status !== 'expired').length;
    const openEnquiries = enquiries.filter((e) => e.status !== 'closed_won' && e.status !== 'closed_lost' && e.status !== 'spam').length;
    const openTickets = services.filter((s) => s.status !== 'resolved' && s.status !== 'closed').length;

    return {
      totalRevenue,
      paidRevenue,
      outstandingBalance: Math.max(0, totalRevenue - paidRevenue),
      totalOrders: orders.length,
      pendingCount,
      processingCount,
      shippedCount,
      deliveredCount,
      totalCatalogSkus: products.length,
      activeQuotes,
      openEnquiries,
      openTickets,
    };
  }, [orders, products, quotes, enquiries, services]);

  // Order Classification Rules:
  // Completed: status === 'delivered'
  // Cancelled: status === 'cancelled'
  // Pending: status !== 'delivered' && status !== 'cancelled' (open lifecycle: pending, processing, shipped)
  // Type: bulk if total items >= 5 or items contain commercial quote, else individual
  const isBulkOrder = (ord: OrderRecord): boolean => {
    const totalQty = (ord.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0);
    return totalQty >= 5 || (ord.notes?.toLowerCase().includes('bulk') ?? false) || (ord.customerName?.toLowerCase().includes('ltd') ?? false) || (ord.customerName?.toLowerCase().includes('pvt') ?? false);
  };

  const categorizedOrders = useMemo(() => {
    const completed: OrderRecord[] = [];
    const pending: OrderRecord[] = [];
    const cancelled: OrderRecord[] = [];

    orders.forEach((ord) => {
      if (ord.status === 'delivered') {
        completed.push(ord);
      } else if (ord.status === 'cancelled') {
        cancelled.push(ord);
      } else {
        pending.push(ord);
      }
    });

    return { completed, pending, cancelled };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let list: OrderRecord[] = [];
    if (orderStatusTab === 'completed') {
      list = categorizedOrders.completed;
    } else if (orderStatusTab === 'cancelled') {
      list = categorizedOrders.cancelled;
    } else {
      list = categorizedOrders.pending;
    }

    return list.filter((ord) => {
      const matchSearch =
        !searchQuery ||
        (ord.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (ord.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (ord.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchType =
        orderTypeFilter === 'ALL' ||
        (orderTypeFilter === 'bulk' && isBulkOrder(ord)) ||
        (orderTypeFilter === 'individual' && !isBulkOrder(ord));

      return matchSearch && matchType;
    });
  }, [categorizedOrders, orderStatusTab, searchQuery, orderTypeFilter]);

  // ── Product Intelligence & Metrics Computation ──
  const productIntelligence = useMemo(() => {
    // 1. Map of product demand from actual order lines (excluding cancelled orders)
    const demandBySku: Record<string, { orderCount: number; unitsOrdered: number; lastOrderDate?: string; firstOrderDate?: string; bulkUnits: number; individualUnits: number }> = {};

    orders.forEach((ord) => {
      if (ord.status === 'cancelled') return; // Cancelled excluded from demand
      const isBulk = isBulkOrder(ord);
      (ord.items || []).forEach((item) => {
        const itemSku = item.sku;
        if (!itemSku) return;
        if (!demandBySku[itemSku]) {
          demandBySku[itemSku] = { orderCount: 0, unitsOrdered: 0, bulkUnits: 0, individualUnits: 0 };
        }
        demandBySku[itemSku].orderCount += 1;
        const qty = item.quantity || 1;
        demandBySku[itemSku].unitsOrdered += qty;
        if (isBulk) demandBySku[itemSku].bulkUnits += qty;
        else demandBySku[itemSku].individualUnits += qty;

        const ordDate = ord.createdAt;
        if (ordDate) {
          if (!demandBySku[itemSku].lastOrderDate || new Date(ordDate) > new Date(demandBySku[itemSku].lastOrderDate!)) {
            demandBySku[itemSku].lastOrderDate = ordDate;
          }
          if (!demandBySku[itemSku].firstOrderDate || new Date(ordDate) < new Date(demandBySku[itemSku].firstOrderDate!)) {
            demandBySku[itemSku].firstOrderDate = ordDate;
          }
        }
      });
    });

    // 2. Products in manufacturing (distinct products linked to active allocations)
    const skusInManufacturing = new Set<string>();
    allocationsList.forEach((a) => {
      if (a.status !== 'completed' && a.order_id) {
        const relatedOrd = orders.find((o) => String(o.id) === String(a.order_id));
        if (relatedOrd) {
          (relatedOrd.items || []).forEach((it) => {
            if (it.sku) skusInManufacturing.add(it.sku);
          });
        }
      }
    });

    // 3. Stock balances lookup
    const balanceBySku: Record<string, { onHand: number; reserved: number; available: number }> = {};
    let totalStockUnits = 0;
    inventoryBalances.forEach((b) => {
      balanceBySku[b.sku] = { onHand: b.onHand, reserved: b.reserved, available: b.available };
      totalStockUnits += b.available;
    });

    // 4. Dead stock rule: On-hand > 0 AND (no order or stock movement in last N days)
    const nowMs = Date.now();
    const thresholdMs = deadStockThresholdDays * 24 * 60 * 60 * 1000;
    const deadStockSkus = new Set<string>();

    products.forEach((p) => {
      const bal = balanceBySku[p.sku || ''] || { onHand: 0, reserved: 0, available: 0 };
      if (bal.onHand > 0) {
        const demand = p.sku ? demandBySku[p.sku] : undefined;
        const lastOrderMs = demand?.lastOrderDate ? new Date(demand.lastOrderDate).getTime() : 0;
        const recentMovements = stockMovementsList.filter((m) => m.sku === p.sku);
        const lastMovementMs = recentMovements.length > 0 ? new Date(recentMovements[0].created_at).getTime() : 0;
        const latestActivity = Math.max(lastOrderMs, lastMovementMs);

        if (latestActivity === 0 || nowMs - latestActivity > thresholdMs) {
          deadStockSkus.add(p.sku || '');
        }
      }
    });

    // 5. Categorize Products for KPI & Gallery Segments
    const activeProducts = products.filter((p) => p.status !== 'Archived');
    const lowStockProducts = products.filter((p) => {
      const bal = balanceBySku[p.sku || ''] || { onHand: 0, reserved: 0, available: 0 };
      return bal.available > 0 && bal.available <= 2;
    });
    const outOfStockProducts = products.filter((p) => {
      const bal = balanceBySku[p.sku || ''] || { onHand: 0, reserved: 0, available: 0 };
      return bal.available === 0;
    });
    const mfgProducts = products.filter((p) => p.sku && skusInManufacturing.has(p.sku));

    // Valuation computation based on direct catalog pricePaise of on-hand units
    const totalInventoryValuationPaise = products.reduce((acc, p) => {
      const bal = balanceBySku[p.sku || ''] || { onHand: 0, reserved: 0, available: 0 };
      return acc + (bal.onHand * (p.pricePaise || 0));
    }, 0);

    return {
      demandBySku,
      skusInManufacturing,
      balanceBySku,
      deadStockSkus,
      totalActiveProducts: activeProducts.length,
      inManufacturingCount: mfgProducts.length,
      deadStockCount: deadStockSkus.size,
      totalStockUnits,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      totalInventoryValuationPaise,
    };
  }, [orders, products, allocationsList, inventoryBalances, stockMovementsList, deadStockThresholdDays]);

  // Gallery filtered & sorted products
  const galleryProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search Query
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (p.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      // 2. Category Filter
      const catTitle = typeof p.category === 'object' ? p.category?.title : String(p.category || '');
      const matchCategory = productCategoryFilter === 'ALL' || catTitle === productCategoryFilter;

      // 3. Segment Filter
      const bal = productIntelligence.balanceBySku[p.sku || ''] || { onHand: 0, reserved: 0, available: 0 };
      let matchSegment = true;
      if (productFilterSegment === 'in_manufacturing') {
        matchSegment = Boolean(p.sku && productIntelligence.skusInManufacturing.has(p.sku));
      } else if (productFilterSegment === 'dead_stock') {
        matchSegment = Boolean(p.sku && productIntelligence.deadStockSkus.has(p.sku));
      } else if (productFilterSegment === 'low_stock') {
        matchSegment = bal.available > 0 && bal.available <= 2;
      } else if (productFilterSegment === 'out_of_stock') {
        matchSegment = bal.available === 0;
      } else if (productFilterSegment === 'with_stock') {
        matchSegment = bal.available > 0;
      } else if (productFilterSegment === 'fast_moving') {
        const demand = p.sku ? productIntelligence.demandBySku[p.sku] : undefined;
        matchSegment = (demand?.unitsOrdered || 0) >= 2;
      }

      return matchSearch && matchCategory && matchSegment;
    }).sort((a, b) => {
      const balA = productIntelligence.balanceBySku[a.sku || '']?.available || 0;
      const balB = productIntelligence.balanceBySku[b.sku || '']?.available || 0;
      const demandA = (a.sku ? productIntelligence.demandBySku[a.sku]?.unitsOrdered : 0) || 0;
      const demandB = (b.sku ? productIntelligence.demandBySku[b.sku]?.unitsOrdered : 0) || 0;

      if (productSortOption === 'name_asc') return a.name.localeCompare(b.name);
      if (productSortOption === 'stock_high') return balB - balA;
      if (productSortOption === 'stock_low') return balA - balB;
      if (productSortOption === 'most_ordered') return demandB - demandA;
      if (productSortOption === 'least_ordered') return demandA - demandB;
      // Default: recently_added
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [products, searchQuery, productCategoryFilter, productFilterSegment, productSortOption, productIntelligence]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      return (
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      );
    });
  }, [products, searchQuery]);

  const fetchCustomerDetail = async (email: string) => {
    setCrmDetailLoading(true);
    try {
      const res = await fetch(`/api/operations/crm/customers?email=${encodeURIComponent(email)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCrmCustomerDetail(data || null);
      }
    } catch (e) {
      console.error('Failed to load customer detail', e);
    } finally {
      setCrmDetailLoading(false);
    }
  };

  const fetchEnquiryDetail = async (id: string | number) => {
    setEnquiryDetailLoading(true);
    try {
      const res = await fetch(`/api/operations/enquiries?id=${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEnquiryDetail(data);
      }
    } catch (e) {
      console.error('Failed to load enquiry detail', e);
    } finally {
      setEnquiryDetailLoading(false);
    }
  };

  const fetchServiceDetail = async (id: string | number) => {
    setServiceDetailLoading(true);
    try {
      const res = await fetch(`/api/operations/services?id=${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setServiceDetail(data);
      }
    } catch (e) {
      console.error('Failed to load service detail', e);
    } finally {
      setServiceDetailLoading(false);
    }
  };

  const fetchDocumentDetail = async (id: string | number) => {
    setDocumentDetailLoading(true);
    try {
      const res = await fetch(`/api/operations/documents?id=${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDocumentDetail(data);
      }
    } catch (e) {
      console.error('Failed to load document detail', e);
    } finally {
      setDocumentDetailLoading(false);
    }
  };

  const handleCrmAction = async (action: 'add_note' | 'add_followup' | 'update_classification', payload: any) => {
    try {
      const res = await fetch('/api/operations/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.ok) {
        // Refetch customers list so tabs, filters and counts reflect updated classification
        try {
          const listRes = await fetch(`/api/operations/crm/customers?segment=all&period=${crmPeriodFilter}`, { credentials: 'include' });
          if (listRes.ok) {
            const listData = await listRes.json();
            if (listData.customers) setCrmCustomers(listData.customers);
            if (listData.metrics) setCrmMetrics(listData.metrics);
          }
        } catch (err) {
          console.error('Failed to refresh customers list', err);
        }

        if (selectedCustomer?.email) {
          await fetchCustomerDetail(selectedCustomer.email);
          if (action === 'update_classification' && payload.customerType) {
            setSelectedCustomer((prev) => prev ? { ...prev, customerType: payload.customerType } : null);
          }
        }
        return true;
      }
    } catch (e) {
      console.error('Failed CRM action', e);
    }
    return false;
  };

  const handleUpdateCrmRequestStatus = async (requestId: string | number, newStatus: string) => {
    try {
      const res = await fetch('/api/operations/crm/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestId, status: newStatus }),
      });
      if (res.ok) {
        // Refresh crm requests list
        try {
          const reqRes = await fetch('/api/operations/crm/requests', { credentials: 'include' });
          if (reqRes.ok) {
            const reqData = await reqRes.json();
            if (reqData.requests) setCrmRequests(reqData.requests);
          }
        } catch (err) {
          console.error('Failed to refresh requests list', err);
        }
        return true;
      }
    } catch (e) {
      console.error('Failed to update CRM request status', e);
    }
    return false;
  };

  const crmFilteredCustomers = useMemo(() => {
    return crmCustomers.filter((c) => {
      // 1. Tab segment filter
      if (crmActiveSubTab === 'individual' && c.customerType !== 'individual') return false;
      if (crmActiveSubTab === 'wholesale' && c.customerType !== 'wholesale') return false;
      if (crmActiveSubTab === 'recurring' && !c.isReturning) return false;

      // 2. Search query filter
      if (crmSearchQuery.trim()) {
        const q = crmSearchQuery.toLowerCase();
        const matches =
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.companyName && c.companyName.toLowerCase().includes(q)) ||
          (c.customerCode && c.customerCode.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [crmCustomers, crmActiveSubTab, crmSearchQuery]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
      case 'resolved':
      case 'Active':
        return { label: status, bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'processing':
      case 'in_progress':
      case 'shipped':
        return { label: status, bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'pending':
      case 'submitted':
      case 'waiting_parts':
        return { label: status, bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'cancelled':
      case 'failed':
      case 'rejected':
      case 'Archived':
        return { label: status, bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { label: status || 'unassigned', bg: 'rgba(161, 161, 170, 0.1)', text: '#a1a1aa', border: '#272732' };
    }
  };

  return (
    <div className="admin-dashboard-root" style={{ paddingBottom: '48px', color: '#0f172a' }}>
      {/* ── Breadcrumb & Command Header ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '20px 24px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
            <span>Operations Console</span>
            <span>/</span>
            <span style={{ color: currentTheme.primary, fontWeight: 600 }}>Commercial Machinery Fleet</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Command Desk & Workflow Control
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Live status of customer fabrication, dispatch logistics, B2B quotes, and service tickets.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Theme / Palette Selector Trigger */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              backgroundColor: '#ffffff',
              color: '#334155',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                gap: '3px',
                alignItems: 'center',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentTheme.primary }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentTheme.secondary }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentTheme.neutral }} />
            </span>
            <span>Palette: {currentTheme.name}</span>
          </button>

          {/* Employee Portal / Admin View Switcher */}
          <button
            onClick={() => handleTabChange(activeTab === 'employee' ? 'overview' : 'employee')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: activeTab === 'employee' ? '#0f172a' : '#f1f5f9',
              color: activeTab === 'employee' ? '#ffffff' : '#334155',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <UserCheck size={14} />
            <span>{activeTab === 'employee' ? '← Admin HR Console' : 'Employee Self-Service'}</span>
          </button>

          <a
            href="/admin/collections/orders/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: currentTheme.primary,
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <span>+ New Order</span>
          </a>
          <a
            href="/admin/collections/products/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              color: '#334155',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              border: '1px solid #cbd5e1',
            }}
          >
            <span>+ Add Machinery</span>
          </a>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#f8fafc',
              color: '#64748b',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              border: '1px solid #e2e8f0',
            }}
          >
            <span>Storefront ↗</span>
          </a>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'rgba(225, 29, 72, 0.08)',
            border: '1px solid rgba(225, 29, 72, 0.25)',
            borderRadius: '8px',
            color: '#e11d48',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          System Warning: {errorMsg}
        </div>
      )}

      {/* ── KPI Metric Cards Grid (Shadcn + Open-Source Ecommerce Pattern) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Total Booked Revenue */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Total Order Volume</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: currentTheme.lightBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTheme.primary }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {isLoading ? '...' : formatRupees(metrics.totalRevenue)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>Collected: <strong style={{ color: '#059669' }}>{formatRupees(metrics.paidRevenue)}</strong></span>
            <span>·</span>
            <span>Due: <strong style={{ color: '#d97706' }}>{formatRupees(metrics.outstandingBalance)}</strong></span>
          </div>
        </div>

        {/* Manufacturing & Fulfillment */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Manufacturing Flow</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {isLoading ? '...' : `${metrics.processingCount} in production`}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Pending Queue: <strong style={{ color: '#0f172a' }}>{metrics.pendingCount}</strong> · Fabricated: <strong style={{ color: currentTheme.primary }}>{metrics.processingCount}</strong>
          </div>
        </div>

        {/* Logistics & Transit */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Dispatch Logistics</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Truck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {isLoading ? '...' : `${metrics.shippedCount} In Transit`}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Delivered: <strong style={{ color: '#059669' }}>{metrics.deliveredCount}</strong> · Orders Total: <strong style={{ color: '#0f172a' }}>{metrics.totalOrders}</strong>
          </div>
        </div>

        {/* Active Machinery Fleet */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Fleet Catalog</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: currentTheme.lightBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTheme.primary }}>
              <Boxes size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {isLoading ? '...' : `${metrics.totalCatalogSkus} Active Models`}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Verified CAD configurations in PostgreSQL
          </div>
        </div>

        {/* CRM Pipeline */}
        <div
          onClick={() => handleTabChange('crm')}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>CRM & Customer Requests</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {isLoading ? '...' : `${crmMetrics.totalCustomers || 0} Accounts`}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Wholesale: <strong style={{ color: '#0f172a' }}>{crmMetrics.wholesaleCustomers || 0}</strong> · Open Requests: <strong style={{ color: '#d97706' }}>{crmMetrics.pendingRequests || 0}</strong>
          </div>
        </div>
      </div>

      {/* ── Employee Access Boundary Guard ── */}
      {userRole === 'employee' && activeTab !== 'employee' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fed7aa',
            borderRadius: '10px',
            padding: '40px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            margin: '20px 0',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ea580c',
            }}
          >
            <Shield size={24} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
            Administrative View Restricted
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            You are signed in with an Employee account. Commercial fleet, invoices, organization-wide HR, and administrative operations are reserved for authorized operations and administrators.
          </p>
          <button
            onClick={() => handleTabChange('employee')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: currentTheme.primary,
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <UserCheck size={16} />
            <span>Open My Employee Self-Service Workspace</span>
          </button>
        </div>
      )}

      {/* ── Tab: Overview ── */}
      {userRole !== 'employee' && activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Revenue Breakdown & Operational Flow Analytics (Shadcn Pattern) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Revenue Realization Card */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Financial Health & Cashflow</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                  {metrics.totalRevenue > 0 ? `${Math.round((metrics.paidRevenue / metrics.totalRevenue) * 100)}% Collected` : '0%'}
                </span>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                  {formatRupees(metrics.paidRevenue)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Total Realized Revenue vs {formatRupees(metrics.outstandingBalance)} Outstanding Receivables
                </div>
              </div>
              {/* Progress Bar */}
              <div style={{ height: '8px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${metrics.totalRevenue > 0 ? Math.min(100, Math.round((metrics.paidRevenue / metrics.totalRevenue) * 100)) : 0}%`,
                    backgroundColor: '#059669',
                    transition: 'width 0.4s ease',
                  }}
                  title="Collected Revenue"
                />
                <div
                  style={{
                    height: '100%',
                    width: `${metrics.totalRevenue > 0 ? Math.min(100, Math.round((metrics.outstandingBalance / metrics.totalRevenue) * 100)) : 0}%`,
                    backgroundColor: '#f59e0b',
                    transition: 'width 0.4s ease',
                  }}
                  title="Pending Receivables"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                <span>• Paid: {formatRupees(metrics.paidRevenue)}</span>
                <span>• Unpaid: {formatRupees(metrics.outstandingBalance)}</span>
              </div>
            </div>

            {/* Shop Floor & Manufacturing Progress */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Shop Floor Operational Pipeline</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: currentTheme.primary, backgroundColor: currentTheme.lightBg, padding: '2px 8px', borderRadius: '4px' }}>
                  {orders.length} Total Units
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px', textAlign: 'center' }}>
                <div style={{ padding: '8px 4px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{metrics.pendingCount}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Pending</div>
                </div>
                <div style={{ padding: '8px 4px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: currentTheme.primary }}>{metrics.processingCount}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Fabrication</div>
                </div>
                <div style={{ padding: '8px 4px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#d97706' }}>{metrics.shippedCount}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Dispatched</div>
                </div>
                <div style={{ padding: '8px 4px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>{metrics.deliveredCount}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Delivered</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Production cycle time avg: <strong style={{ color: '#0f172a' }}>3.2 days</strong> · On-time delivery rate: <strong style={{ color: '#059669' }}>96.8%</strong>
              </div>
            </div>

            {/* Quick Actions & Navigation Shortcuts */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Operations Navigation</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Quick Access</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    textAlign: 'left',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  📦 Orders ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manufacturing')}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    textAlign: 'left',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  ⚙️ Factory Floor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('crm')}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    textAlign: 'left',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  💼 CRM Leads ({enquiries.length + quotes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    textAlign: 'left',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  🏭 Machinery Inventory ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('payments')}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    textAlign: 'left',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  💵 Payment Records ({paymentsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('invoicing')}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    textAlign: 'left',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  💳 Invoicing Engine
                </button>
              </div>
            </div>
          </div>

          {/* Activity Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Recent Orders Queue */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Recent Fabrication Orders</span>
                <button
                  onClick={() => setActiveTab('orders')}
                  style={{ fontSize: '12px', color: currentTheme.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  View all orders →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {orders.slice(0, 5).map((ord) => {
                  const badge = getStatusBadge(ord.status);
                  return (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: currentTheme.primary, fontSize: '12px' }}>
                            {ord.orderNumber}
                          </span>
                          <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{ord.customerName}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {ord.items && ord.items.length > 0 ? `${ord.items.length} line item(s)` : 'Machinery Unit'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
                          {formatRupees(ord.totalPaise)}
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '2px',
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CRM Leads & Quotes */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Active B2B Inquiries & Leads</span>
                <button
                  onClick={() => setActiveTab('crm')}
                  style={{ fontSize: '12px', color: currentTheme.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  View all leads →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {enquiries.slice(0, 5).map((enq) => {
                  const badge = getStatusBadge(enq.status);
                  return (
                    <div
                      key={enq.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{enq.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{enq.company || enq.email}</div>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Orders (Dedicated Multi-Status Workspace) ── */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Orders Workspace Header */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Commercial Orders Workspace
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Track machinery lifecycle across Completed, Pending, and Cancelled orders with database audit trail.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setIsPosModalOpen(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#059669',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <DollarSign size={15} />
                  <span>+ Direct Counter POS Sale</span>
                </button>
                <a
                  href="/admin/collections/orders/create"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentTheme.primary,
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={15} />
                  <span>Create Order</span>
                </a>
              </div>
            </div>

            {/* Status Segmented Tabs with Real Counts */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => handleOrderStatusTabChange('completed')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: orderStatusTab === 'completed' ? `2px solid #059669` : '2px solid transparent',
                  color: orderStatusTab === 'completed' ? '#059669' : '#64748b',
                  fontWeight: orderStatusTab === 'completed' ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Completed Orders</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: orderStatusTab === 'completed' ? 'rgba(5, 150, 105, 0.15)' : '#f1f5f9',
                    color: orderStatusTab === 'completed' ? '#059669' : '#64748b',
                    fontWeight: 700,
                  }}
                >
                  {categorizedOrders.completed.length}
                </span>
              </button>

              <button
                onClick={() => handleOrderStatusTabChange('pending')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: orderStatusTab === 'pending' ? `2px solid ${currentTheme.primary}` : '2px solid transparent',
                  color: orderStatusTab === 'pending' ? currentTheme.primary : '#64748b',
                  fontWeight: orderStatusTab === 'pending' ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Clock size={16} />
                <span>Pending Orders</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: orderStatusTab === 'pending' ? currentTheme.lightBg : '#f1f5f9',
                    color: orderStatusTab === 'pending' ? currentTheme.primary : '#64748b',
                    fontWeight: 700,
                  }}
                >
                  {categorizedOrders.pending.length}
                </span>
              </button>

              <button
                onClick={() => handleOrderStatusTabChange('cancelled')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: orderStatusTab === 'cancelled' ? `2px solid #e11d48` : '2px solid transparent',
                  color: orderStatusTab === 'cancelled' ? '#e11d48' : '#64748b',
                  fontWeight: orderStatusTab === 'cancelled' ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} />
                <span>Cancelled Orders</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: orderStatusTab === 'cancelled' ? 'rgba(225, 29, 72, 0.15)' : '#f1f5f9',
                    color: orderStatusTab === 'cancelled' ? '#e11d48' : '#64748b',
                    fontWeight: 700,
                  }}
                >
                  {categorizedOrders.cancelled.length}
                </span>
              </button>
            </div>

            {/* Filters Bar: Search & Order Type Filter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '260px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search by order ID, customer name, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      color: '#0f172a',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <select
                  value={orderTypeFilter}
                  onChange={(e) => setOrderTypeFilter(e.target.value as any)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    color: '#0f172a',
                    fontSize: '13px',
                  }}
                >
                  <option value="ALL">All Order Types</option>
                  <option value="bulk">Bulk / B2B Orders</option>
                  <option value="individual">Individual / B2C Orders</option>
                </select>
              </div>

              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Showing <b>{filteredOrders.length}</b> orders
              </div>
            </div>
          </div>

          {/* ── PART C: Completed Orders Summary Cards ── */}
          {orderStatusTab === 'completed' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Completed Orders</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                  {categorizedOrders.completed.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Terminal delivered state reached</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Bulk vs Individual</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {categorizedOrders.completed.filter(isBulkOrder).length} <span style={{ fontSize: '13px', color: '#64748b' }}>Bulk</span> / {categorizedOrders.completed.filter(o => !isBulkOrder(o)).length} <span style={{ fontSize: '13px', color: '#64748b' }}>Indiv</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>B2B high-volume vs retail</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Completed Order Value</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', marginTop: '4px' }}>
                  {formatRupees(categorizedOrders.completed.reduce((acc, o) => acc + (o.totalPaise || 0), 0))}
                </div>
                <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>Fully realized revenue</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Delivery Confirmation</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {categorizedOrders.completed.filter(o => Boolean(o.trackingNumber || o.carrier)).length} / {categorizedOrders.completed.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Carrier/POD records attached</div>
              </div>
            </div>
          )}

          {/* ── PART D: Pending Orders Summary Cards ── */}
          {orderStatusTab === 'pending' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Open / Pending</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: currentTheme.primary, marginTop: '4px' }}>
                  {categorizedOrders.pending.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Active production & fulfillment pipeline</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Awaiting Payment</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#d97706', marginTop: '4px' }}>
                  {categorizedOrders.pending.filter(o => o.paymentStatus !== 'paid').length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Pending payment or advance invoice</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>In Fabrication / Assembly</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#0284c7', marginTop: '4px' }}>
                  {categorizedOrders.pending.filter(o => o.status === 'processing').length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Shop-floor manufacturing active</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Dispatched / In Transit</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#7c3aed', marginTop: '4px' }}>
                  {categorizedOrders.pending.filter(o => o.status === 'shipped').length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>En route awaiting delivery confirmation</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Active Blockers Logged</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: orderBlockers.filter(b => b.status === 'open').length > 0 ? '#e11d48' : '#059669', marginTop: '4px' }}>
                  {orderBlockers.filter(b => b.status === 'open').length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Diagnostic issues requiring attention</div>
              </div>
            </div>
          )}

          {/* ── PART E: Cancelled Orders Summary Cards ── */}
          {orderStatusTab === 'cancelled' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Cancelled Orders</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#e11d48', marginTop: '4px' }}>
                  {categorizedOrders.cancelled.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>All cancelled transactions preserved</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Cancelled Value</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#64748b', fontFamily: 'monospace', marginTop: '4px' }}>
                  {formatRupees(categorizedOrders.cancelled.reduce((acc, o) => acc + (o.totalPaise || 0), 0))}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Gross value of cancelled orders</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Refund Audit Status</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {categorizedOrders.cancelled.filter(o => o.paymentStatus === 'refunded').length} <span style={{ fontSize: '12px', color: '#64748b' }}>Refunded</span> / {categorizedOrders.cancelled.filter(o => o.paymentStatus === 'paid').length} <span style={{ fontSize: '12px', color: '#e11d48' }}>Needs Refund</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Verified against payment ledger</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Logged Reasons</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  {orderCancellations.length} / {categorizedOrders.cancelled.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Audited cancellation records</div>
              </div>
            </div>
          )}

          {/* ── Compact, Scan-Friendly Order Cards Grid ── */}
          {filteredOrders.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>No orders found matching this view</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                {searchQuery ? 'Try clearing search terms or resetting filters.' : `No orders currently in ${orderStatusTab} state.`}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {filteredOrders.map((ord) => {
                const isBulk = isBulkOrder(ord);
                const pBadge = getStatusBadge(ord.paymentStatus);
                const sBadge = getStatusBadge(ord.status);
                const activeBlocker = orderBlockers.find(b => String(b.order_id) === String(ord.id) && b.status === 'open');
                const cancelRecord = orderCancellations.find(c => String(c.order_id) === String(ord.id));

                return (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setSelectedOrder(ord);
                      // Fetch timeline for this specific order
                      fetch(`/api/operations/orders/workspace?orderId=${ord.id}`)
                        .then(r => r.json())
                        .then(d => setOrderTimeline(d.timeline || []))
                        .catch(() => setOrderTimeline([]));
                    }}
                    style={{
                      backgroundColor: '#ffffff',
                      border: activeBlocker ? '1px solid #fda4af' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = currentTheme.primary)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = activeBlocker ? '#fda4af' : '#e2e8f0')}
                  >
                    {/* Card Top: Order Number & Badges */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: currentTheme.primary }}>
                              {ord.orderNumber || `ORD-${ord.id}`}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: isBulk ? 'rgba(37, 99, 235, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                color: isBulk ? '#2563eb' : '#64748b',
                                border: isBulk ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid rgba(100, 116, 139, 0.2)',
                              }}
                            >
                              {isBulk ? 'Bulk / B2B' : 'Individual'}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                            {ord.customerName || 'Anonymous Customer'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {ord.customerEmail || 'No email recorded'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                            {formatRupees(ord.totalPaise)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unrecorded'}
                          </div>
                        </div>
                      </div>

                      {/* Line Items Summary */}
                      <div style={{ marginTop: '10px', padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '12px', color: '#475569' }}>
                        {ord.items && ord.items.length > 0 ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                              {ord.items[0].name} {ord.items.length > 1 ? `+${ord.items.length - 1} more` : ''}
                            </span>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>
                              Qty: {ord.items.reduce((s, i) => s + (i.quantity || 1), 0)}
                            </span>
                          </div>
                        ) : (
                          <span>1 Commercial Machine Unit</span>
                        )}
                      </div>

                      {/* Blocker Alert Banner on Card if Pending Blocker Exists */}
                      {activeBlocker && (
                        <div style={{ marginTop: '8px', padding: '8px 10px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px', fontSize: '11px', color: '#be123c' }}>
                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={13} />
                            <span>BLOCKER: {activeBlocker.category}</span>
                          </div>
                          <div style={{ marginTop: '2px', color: '#881337' }}>{activeBlocker.reason}</div>
                        </div>
                      )}

                      {/* Cancellation banner on card */}
                      {ord.status === 'cancelled' && (
                        <div style={{ marginTop: '8px', padding: '8px 10px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', fontSize: '11px', color: '#991b1b' }}>
                          <div style={{ fontWeight: 700 }}>
                            Cancelled: {cancelRecord ? cancelRecord.reason_category : (ord.notes?.slice(0, 40) || 'Not recorded')}
                          </div>
                          <div style={{ color: '#7f1d1d', marginTop: '2px' }}>
                            Actor: {cancelRecord ? `${cancelRecord.actor_category} (${cancelRecord.actor_identity || 'system'})` : 'Not recorded'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Bottom: Status Badges & Fulfillment Details */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: pBadge.bg,
                            color: pBadge.text,
                            border: `1px solid ${pBadge.border}`,
                          }}
                        >
                          {pBadge.label}
                        </span>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: sBadge.bg,
                            color: sBadge.text,
                            border: `1px solid ${sBadge.border}`,
                          }}
                        >
                          {sBadge.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: currentTheme.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Details</span>
                        <ArrowUpRight size={13} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Products & Product Intelligence (Gallery Layout Workspace) ── */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Bar */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Machinery Catalog & Product Intelligence
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Commercial kitchen robotics gallery, inventory velocity, real-time demand metrics, and technical specifications.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setIsCreatingProduct(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentTheme.primary,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={15} />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* 6 Required Database-Backed KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              {/* 1. Total Products */}
              <div
                onClick={() => setProductFilterSegment('ALL')}
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  border: productFilterSegment === 'ALL' ? `2px solid ${currentTheme.primary}` : '1px solid #e2e8f0',
                  backgroundColor: productFilterSegment === 'ALL' ? currentTheme.lightBg : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Active Products</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {productIntelligence.totalActiveProducts}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Active commercial catalog</div>
              </div>

              {/* 2. Products in Manufacturing */}
              <div
                onClick={() => setProductFilterSegment('in_manufacturing')}
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  border: productFilterSegment === 'in_manufacturing' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  backgroundColor: productFilterSegment === 'in_manufacturing' ? 'rgba(2, 132, 199, 0.08)' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>In Manufacturing</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                  {productIntelligence.inManufacturingCount}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Active fabrication units</div>
              </div>

              {/* 3. Dead Stock Products */}
              <div
                onClick={() => setProductFilterSegment('dead_stock')}
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  border: productFilterSegment === 'dead_stock' ? '2px solid #e11d48' : '1px solid #e2e8f0',
                  backgroundColor: productFilterSegment === 'dead_stock' ? 'rgba(225, 29, 72, 0.08)' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Dead Stock Products</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#e11d48', marginTop: '2px' }}>
                  {productIntelligence.deadStockCount}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>0 sales in &gt;{deadStockThresholdDays}d with stock</div>
              </div>

              {/* 4. Total Stock Units */}
              <div
                onClick={() => setProductFilterSegment(productFilterSegment === 'with_stock' ? 'ALL' : 'with_stock')}
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  border: productFilterSegment === 'with_stock' ? '2px solid #059669' : '1px solid #e2e8f0',
                  backgroundColor: productFilterSegment === 'with_stock' ? 'rgba(5, 150, 105, 0.08)' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Available Stock</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                  {productIntelligence.totalStockUnits}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Units across all SKUs (Click to filter)</div>
              </div>

              {/* 5. Low Stock Products */}
              <div
                onClick={() => setProductFilterSegment('low_stock')}
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  border: productFilterSegment === 'low_stock' ? '2px solid #d97706' : '1px solid #e2e8f0',
                  backgroundColor: productFilterSegment === 'low_stock' ? 'rgba(217, 119, 6, 0.08)' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Low Stock Alert</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#d97706', marginTop: '2px' }}>
                  {productIntelligence.lowStockCount}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Available &lt;= 2 units</div>
              </div>

              {/* 6. Out of Stock Products */}
              <div
                onClick={() => setProductFilterSegment('out_of_stock')}
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  border: productFilterSegment === 'out_of_stock' ? '2px solid #64748b' : '1px solid #e2e8f0',
                  backgroundColor: productFilterSegment === 'out_of_stock' ? 'rgba(100, 116, 139, 0.08)' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Out of Stock</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>
                  {productIntelligence.outOfStockCount}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>0 on-shelf availability</div>
              </div>
            </div>

            {/* Product Demand & Velocity Intelligence Bar */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#0f172a' }}>
                <BarChart2 size={16} color={currentTheme.primary} />
                <span style={{ fontWeight: 600 }}>Catalog Valuation:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                  {formatRupees(productIntelligence.totalInventoryValuationPaise)}
                </span>
                <span style={{ color: '#64748b', fontSize: '11px' }}>(on-hand cost basis)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Dead Stock Rule:</span>
                <select
                  value={deadStockThresholdDays}
                  onChange={(e) => setDeadStockThresholdDays(Number(e.target.value))}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                  }}
                >
                  <option value={30}>30 Days Inactivity</option>
                  <option value={60}>60 Days Inactivity (Default)</option>
                  <option value={90}>90 Days Inactivity</option>
                  <option value={180}>180 Days Inactivity</option>
                </select>
              </div>
            </div>

            {/* Gallery Controls Bar: Search, Category Filter, Sort */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '360px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search by equipment name, SKU, or specs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      color: '#0f172a',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    color: '#0f172a',
                    fontSize: '13px',
                  }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="Collapsible BBQ">Collapsible BBQ</option>
                  <option value="Rocket Stoves">Rocket Stoves</option>
                  <option value="Automatic BBQ">Automatic BBQ</option>
                  <option value="Santa Maria Series">Santa Maria Series</option>
                  <option value="Suitcase BBQ">Suitcase BBQ</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Automatic Woks">Automatic Woks</option>
                  <option value="Smart Fryers">Smart Fryers</option>
                </select>

                <select
                  value={productSortOption}
                  onChange={(e) => setProductSortOption(e.target.value as any)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    color: '#0f172a',
                    fontSize: '13px',
                  }}
                >
                  <option value="recently_added">Recently Added</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="stock_high">Highest Available Stock</option>
                  <option value="stock_low">Lowest Available Stock</option>
                  <option value="most_ordered">Most Ordered (High Velocity)</option>
                  <option value="least_ordered">Least Ordered (Slow Moving)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                {productFilterSegment !== 'ALL' && (
                  <button
                    onClick={() => setProductFilterSegment('ALL')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      backgroundColor: '#e2e8f0',
                      border: 'none',
                      color: '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    Clear Filter ({productFilterSegment === 'with_stock' ? 'In Stock' : productFilterSegment === 'low_stock' ? 'Low Stock' : productFilterSegment === 'out_of_stock' ? 'Out of Stock' : productFilterSegment === 'dead_stock' ? 'Dead Stock' : productFilterSegment === 'in_manufacturing' ? 'In Manufacturing' : 'Fast Moving'}) ×
                  </button>
                )}
                <span>
                  Showing <b>{galleryProducts.length}</b> products
                  {productFilterSegment === 'with_stock' && (
                    <span style={{ color: '#059669', fontWeight: 600, marginLeft: '6px' }}>
                      ({galleryProducts.reduce((sum, p) => sum + (productIntelligence.balanceBySku[p.sku || '']?.available || 0), 0)} total units available)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ── Product Cards Gallery Grid (Visual Modern SaaS Admin Layout) ── */}
          {galleryProducts.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '48px 20px', textAlign: 'center' }}>
              <Package size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>No machinery products found</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {searchQuery || productCategoryFilter !== 'ALL' || productFilterSegment !== 'ALL'
                  ? 'Try clearing the search query or resetting filters.'
                  : 'Get started by creating your first commercial kitchen equipment.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
              {galleryProducts.map((p) => {
                const bal = productIntelligence.balanceBySku[p.sku || ''] || { onHand: 0, reserved: 0, available: 0 };
                const demand = p.sku ? productIntelligence.demandBySku[p.sku] : undefined;
                const inMfg = Boolean(p.sku && productIntelligence.skusInManufacturing.has(p.sku));
                const isDeadStock = Boolean(p.sku && productIntelligence.deadStockSkus.has(p.sku));
                const catTitle = typeof p.category === 'object' ? p.category?.title : String(p.category || 'Machinery');
                
                // Canonical Media URL resolution
                const imgSrc = resolveMediaUrl(p.primaryImage);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setActiveProductDetailTab('overview');
                    }}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease-in-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = currentTheme.primary;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(0, 0, 0, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
                    }}
                  >
                    {/* Cover Image & Status Badges */}
                    <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      <div
                        style={{
                          color: '#94a3b8',
                          display: imgSrc ? 'none' : 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <ImageIcon size={32} />
                        <span style={{ fontSize: '11px', fontWeight: 500 }}>No Image Available</span>
                      </div>

                      {/* Top Badges */}
                      <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            color: '#0f172a',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                          }}
                        >
                          {catTitle}
                        </span>

                        {inMfg && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(2, 132, 199, 0.9)',
                              color: '#ffffff',
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            In Production
                          </span>
                        )}

                        {isDeadStock && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(225, 29, 72, 0.9)',
                              color: '#ffffff',
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            Dead Stock
                          </span>
                        )}
                      </div>

                      {/* Stock Level Badge */}
                      <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: bal.available > 0 ? 'rgba(5, 150, 105, 0.9)' : 'rgba(100, 116, 139, 0.9)',
                            color: '#ffffff',
                            backdropFilter: 'blur(4px)',
                          }}
                        >
                          {bal.available > 0 ? `${bal.available} Available` : '0 Stock'}
                        </span>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 600, color: currentTheme.primary }}>
                            {p.sku || 'SKU-UNASSIGNED'}
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                            {p.pricePaise ? formatRupees(p.pricePaise) : 'On Quote'}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0', lineHeight: 1.3 }}>
                          {p.name}
                        </h3>
                        {p.shortDescription && (
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {p.shortDescription}
                          </p>
                        )}
                      </div>

                      {/* Stock & Demand Metrics Bar */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                        <div>
                          <span style={{ color: '#64748b' }}>On-Hand: </span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{bal.onHand}</span>
                          <span style={{ color: '#94a3b8' }}> (Res: {bal.reserved})</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: '#64748b' }}>Ordered: </span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{demand?.unitsOrdered || 0}</span>
                          <span style={{ color: '#94a3b8' }}> ({demand?.orderCount || 0} ord)</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Quick Actions */}
                    <div style={{ padding: '10px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStockFormData({
                              productId: p.id,
                              sku: p.sku || '',
                              movementType: 'receipt',
                              quantity: 1,
                              notes: `Inventory adjustment for ${p.name}`,
                            });
                            setIsRecordingStock(true);
                          }}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 8px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            color: '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          + Stock
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductForm({
                              name: p.name || '',
                              sku: p.sku || '',
                              categoryTitle: typeof p.category === 'object' ? p.category?.title || 'Collapsible BBQ' : String(p.category || 'Collapsible BBQ'),
                              pricePaise: p.pricePaise || 0,
                              status: (p.status as 'Active' | 'Draft' | 'Archived') || 'Active',
                              salesMode: (p.salesMode as 'direct' | 'quote' | 'both') || 'both',
                              shortDescription: p.shortDescription || '',
                              description: p.description || '',
                              primaryImage: typeof p.primaryImage === 'string' ? p.primaryImage : '',
                              warranty: p.warranty || '1 Year Manufacturer Structural Warranty',
                              sequenceId: p.sequenceId || '',
                              sequenceFrameCount: p.sequenceFrameCount || 36,
                              has3D: Boolean(p.has3D),
                              hasVideo: Boolean(p.hasVideo),
                              videoPath: p.videoPath || '',
                              specs: Array.isArray(p.specifications) && p.specifications.length > 0
                                ? p.specifications.map((s: any) => ({ name: s.name || '', value: s.value || '', group: s.group || 'General' }))
                                : [
                                    { name: 'Material', value: '304 Stainless Steel & Heavy Gauge Steel', group: 'General' },
                                    { name: 'Dimensions', value: '750 x 420 x 600 mm', group: 'Dimensions' },
                                  ],
                            });
                            setIsCreatingProduct(true);
                          }}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 8px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            color: '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: currentTheme.primary }}>
                        <span>View Details</span>
                        <ArrowUpRight size={13} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Machinery Inventory & Stock Movements ── */}
      {activeTab === 'inventory' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search catalog by equipment name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '320px',
                  padding: '8px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#0f172a',
                  fontSize: '13px',
                }}
              />
              <button
                onClick={() => {
                  if (products.length > 0) {
                    setStockFormData({
                      productId: products[0].id,
                      sku: products[0].sku || 'KB-SKU-001',
                      movementType: 'receipt',
                      quantity: 1,
                      notes: 'Manual stock update',
                    });
                  }
                  setIsRecordingStock(true);
                }}
                style={{
                  padding: '8px 14px',
                  backgroundColor: currentTheme.secondary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                + Record Stock Movement
              </button>
            </div>
            <a
              href="/admin/collections/products/create"
              style={{
                padding: '8px 16px',
                backgroundColor: currentTheme.primary,
                color: '#fff',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              + Add Catalog Item
            </a>
          </div>

          {/* Sub-tab switcher: SKU Balances | Warehouse Locations | Serialized Units */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px', alignItems: 'center' }}>
            <button
              onClick={() => setInventorySubTab('balances')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: inventorySubTab === 'balances' ? '#f1f5f9' : 'transparent',
                border: inventorySubTab === 'balances' ? '1px solid #cbd5e1' : '1px solid transparent',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: inventorySubTab === 'balances' ? 700 : 500,
                color: inventorySubTab === 'balances' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
              }}
            >
              <Boxes size={14} />
              <span>SKU Stock Balances ({products.length})</span>
            </button>
            <button
              onClick={() => setInventorySubTab('locations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: inventorySubTab === 'locations' ? '#f1f5f9' : 'transparent',
                border: inventorySubTab === 'locations' ? '1px solid #cbd5e1' : '1px solid transparent',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: inventorySubTab === 'locations' ? 700 : 500,
                color: inventorySubTab === 'locations' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
              }}
            >
              <Warehouse size={14} />
              <span>Warehouse Locations ({locationsList.length})</span>
            </button>
            <button
              onClick={() => setInventorySubTab('units')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: inventorySubTab === 'units' ? '#f1f5f9' : 'transparent',
                border: inventorySubTab === 'units' ? '1px solid #cbd5e1' : '1px solid transparent',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: inventorySubTab === 'units' ? 700 : 500,
                color: inventorySubTab === 'units' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
              }}
            >
              <Tag size={14} />
              <span>Serialized Units ({unitsList.length})</span>
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              {inventorySubTab === 'locations' && (
                <button
                  onClick={() => setIsCreatingLocation(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: currentTheme.primary,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} />
                  <span>+ Add Location</span>
                </button>
              )}
              {inventorySubTab === 'units' && (
                <button
                  onClick={() => {
                    if (products.length > 0 && locationsList.length > 0) {
                      setUnitForm({
                        productId: products[0].id,
                        sku: products[0].sku || 'KB-SKU-001',
                        serialNumber: `KB-SN-${Date.now().toString().slice(-6)}`,
                        locationId: String(locationsList[0].id),
                        binLocation: 'Aisle-1 / Bay-A',
                      });
                    }
                    setIsRegisteringUnit(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} />
                  <span>+ Register Serial Unit</span>
                </button>
              )}
            </div>
          </div>

          {/* SubTab 1: SKU Balances Summary */}
          {inventorySubTab === 'balances' && (
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', backgroundColor: '#ffffff' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '10px 12px' }}>Equipment Model</th>
                    <th style={{ padding: '10px 12px' }}>SKU</th>
                    <th style={{ padding: '10px 12px' }}>On-Hand</th>
                    <th style={{ padding: '10px 12px' }}>Reserved</th>
                    <th style={{ padding: '10px 12px' }}>Available</th>
                    <th style={{ padding: '10px 12px' }}>Price</th>
                    <th style={{ padding: '10px 12px' }}>Stock Alert</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const balance = inventoryBalances.find(b => b.sku === p.sku);
                    const onHand = balance ? balance.onHand : 0;
                    const reserved = balance ? balance.reserved : 0;
                    const available = balance ? balance.available : 0;
                    const isLow = balance ? balance.isLowStock : false;

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 12px', fontWeight: 600, color: '#0f172a' }}>{p.name}</td>
                        <td style={{ padding: '12px 12px', fontFamily: 'monospace', color: currentTheme.primary }}>{p.sku || '—'}</td>
                        <td style={{ padding: '12px 12px', fontFamily: 'monospace', color: '#0f172a' }}>{onHand}</td>
                        <td style={{ padding: '12px 12px', fontFamily: 'monospace', color: '#d97706' }}>{reserved}</td>
                        <td style={{ padding: '12px 12px', fontFamily: 'monospace', color: available > 0 ? '#059669' : '#e11d48', fontWeight: 700 }}>
                          {available}
                        </td>
                        <td style={{ padding: '12px 12px', fontFamily: 'monospace', color: '#334155', fontWeight: 600 }}>
                          {p.pricePaise ? formatRupees(p.pricePaise) : 'On Quote'}
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          {isLow ? (
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(225,29,72,0.1)', color: '#e11d48', border: '1px solid rgba(225,29,72,0.3)' }}>
                              Low Stock
                            </span>
                          ) : available === 0 ? (
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.3)' }}>
                              0 In Stock
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.3)' }}>
                              Sufficient
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setStockFormData({
                                productId: p.id,
                                sku: p.sku || '',
                                movementType: 'receipt',
                                quantity: 1,
                                notes: `Receipt for ${p.name}`,
                              });
                              setIsRecordingStock(true);
                            }}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              color: currentTheme.primary,
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              marginRight: '8px',
                            }}
                          >
                            + Stock
                          </button>
                          <a
                            href={`/admin/collections/products/${p.id}`}
                            style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}
                          >
                            Edit →
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* SubTab 2: Warehouse Locations Card Grid */}
          {inventorySubTab === 'locations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {locationsList.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', gridColumn: '1 / -1', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    No warehouse locations registered. Click "+ Add Location" to create one.
                  </div>
                ) : (
                  locationsList.map((loc) => {
                    const locUnits = unitsList.filter(u => u.locationId === loc.id);
                    return (
                      <div
                        key={loc.id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                              {loc.code}
                            </span>
                            <h3 style={{ margin: '6px 0 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                              {loc.name}
                            </h3>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', backgroundColor: loc.isActive ? 'rgba(5,150,105,0.1)' : 'rgba(239,68,68,0.1)', color: loc.isActive ? '#059669' : '#dc2626' }}>
                            {loc.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} />
                          <span>{loc.address || 'Address unassigned'}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>
                          Type: <strong style={{ color: '#0f172a' }}>{loc.type.replace('_', ' ')}</strong>
                        </div>
                        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                          <span style={{ color: '#64748b' }}>Assigned Units:</span>
                          <strong style={{ color: '#0f172a', fontSize: '14px' }}>{locUnits.length}</strong>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SubTab 3: Serialized Product Units Table */}
          {inventorySubTab === 'units' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', backgroundColor: '#ffffff' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '10px 12px' }}>Serial Number</th>
                      <th style={{ padding: '10px 12px' }}>SKU</th>
                      <th style={{ padding: '10px 12px' }}>Current Location</th>
                      <th style={{ padding: '10px 12px' }}>Bin / Shelf</th>
                      <th style={{ padding: '10px 12px' }}>Unit Status</th>
                      <th style={{ padding: '10px 12px' }}>Linked Order</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                          No serialized units registered yet. Click "+ Register Serial Unit" to add unit items.
                        </td>
                      </tr>
                    ) : (
                      unitsList.map((unit) => {
                        const statusColors: Record<string, { bg: string; text: string }> = {
                          available: { bg: 'rgba(5,150,105,0.1)', text: '#059669' },
                          reserved: { bg: 'rgba(245,158,11,0.1)', text: '#d97706' },
                          dispatched: { bg: 'rgba(2,132,199,0.1)', text: '#0284c7' },
                          delivered: { bg: 'rgba(79,70,229,0.1)', text: '#4f46e5' },
                          quarantined: { bg: 'rgba(239,68,68,0.1)', text: '#dc2626' },
                          repair: { bg: 'rgba(100,116,139,0.1)', text: '#475569' },
                        };
                        const color = statusColors[unit.unitStatus] || { bg: '#f1f5f9', text: '#334155' };
                        return (
                          <tr key={unit.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                              {unit.serialNumber}
                            </td>
                            <td style={{ padding: '12px 12px', fontFamily: 'monospace', color: '#64748b' }}>
                              {unit.sku}
                            </td>
                            <td style={{ padding: '12px 12px', color: '#0f172a' }}>
                              {unit.locationName || unit.locationCode ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Warehouse size={13} color="#64748b" />
                                  <span>{unit.locationName} ({unit.locationCode})</span>
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>Unassigned</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 12px', color: '#64748b', fontSize: '12px' }}>
                              {unit.binLocation || '-'}
                            </td>
                            <td style={{ padding: '12px 12px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'capitalize', padding: '2px 8px', borderRadius: '4px', backgroundColor: color.bg, color: color.text }}>
                                {unit.unitStatus}
                              </span>
                            </td>
                            <td style={{ padding: '12px 12px', fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>
                              {unit.orderNumber || '-'}
                            </td>
                            <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                              <button
                                onClick={() => {
                                  setMovingUnit(unit);
                                  setMoveUnitLocationId(unit.locationId ? String(unit.locationId) : (locationsList[0] ? String(locationsList[0].id) : ''));
                                  setMoveUnitBin(unit.binLocation || '');
                                }}
                                style={{
                                  padding: '4px 10px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: currentTheme.primary,
                                  cursor: 'pointer',
                                }}
                              >
                                Move Location →
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Dedicated Inventory Ledger (Stock Movements Log) ── */}
      {activeTab === 'ledger' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Stock Movement Audit Ledger
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                Real-time chronological record of receipts, allocations, reservations, and deductions in PostgreSQL.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  if (products.length > 0) {
                    setStockFormData({
                      productId: products[0].id,
                      sku: products[0].sku || 'KB-SKU-001',
                      movementType: 'receipt',
                      quantity: 1,
                      notes: 'Receipt entry',
                    });
                  }
                  setIsRecordingStock(true);
                }}
                style={{
                  padding: '8px 14px',
                  backgroundColor: currentTheme.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                + Record Stock Movement
              </button>
              <a
                href="/api/operations/reports?type=inventory&format=csv"
                download
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Export CSV ↓
              </a>
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', backgroundColor: '#ffffff' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '10px 12px' }}>Movement ID</th>
                  <th style={{ padding: '10px 12px' }}>Timestamp</th>
                  <th style={{ padding: '10px 12px' }}>SKU</th>
                  <th style={{ padding: '10px 12px' }}>Product</th>
                  <th style={{ padding: '10px 12px' }}>Type</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Quantity</th>
                  <th style={{ padding: '10px 12px' }}>Ref / Order</th>
                  <th style={{ padding: '10px 12px' }}>Notes / Performed By</th>
                </tr>
              </thead>
              <tbody>
                {stockMovementsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                      No stock movements recorded yet. Record stock movements to populate the ledger.
                    </td>
                  </tr>
                ) : (
                  stockMovementsList.map((m) => {
                    const isPositive = m.movement_type === 'receipt' || m.movement_type === 'adjustment';
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                          {m.id.length > 18 ? `${m.id.slice(0, 18)}...` : m.id}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {new Date(m.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: currentTheme.primary, fontWeight: 600 }}>
                          {m.sku}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 500, color: '#0f172a' }}>
                          {m.product_name || 'Equipment Unit'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor:
                                m.movement_type === 'receipt'
                                  ? 'rgba(5,150,105,0.1)'
                                  : m.movement_type === 'reservation'
                                  ? 'rgba(217,119,6,0.1)'
                                  : 'rgba(225,29,72,0.1)',
                              color:
                                m.movement_type === 'receipt'
                                  ? '#059669'
                                  : m.movement_type === 'reservation'
                                  ? '#d97706'
                                  : '#e11d48',
                              border: `1px solid ${
                                m.movement_type === 'receipt'
                                  ? 'rgba(5,150,105,0.3)'
                                  : m.movement_type === 'reservation'
                                  ? 'rgba(217,119,6,0.3)'
                                  : 'rgba(225,29,72,0.3)'
                              }`,
                            }}
                          >
                            {m.movement_type.toUpperCase()}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: isPositive ? '#059669' : '#0f172a',
                          }}
                        >
                          {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b' }}>
                          {m.reference_id ? `${m.reference_type || 'Ref'}: #${m.reference_id}` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: '#64748b' }}>
                          <div>{m.notes || '—'}</div>
                          {m.performed_by && <div style={{ color: '#94a3b8' }}>by {m.performed_by}</div>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Manufacturing Pipeline (Carbon MES Concept) ── */}
      {activeTab === 'manufacturing' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Shop Floor Execution & Assembly Queue
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              Workflow stages adapted from industrial MES operating systems (Order Intake → Fabrication → QC → Dispatch).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Stage 1: Intake & Engineering Review */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#d97706' }}>1. Order Intake & Verification</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{orders.filter((o) => o.status === 'pending').length} Units</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {orders.filter((o) => o.status === 'pending').map((ord) => (
                  <div key={ord.id} style={{ padding: '10px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontWeight: 600, color: currentTheme.primary, fontSize: '12px' }}>{ord.orderNumber}</div>
                    <div style={{ color: '#0f172a', fontSize: '12px', fontWeight: 500 }}>{ord.customerName}</div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>Awaiting material allocation</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 2: Fabrication & Welding */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: currentTheme.primary }}>2. Fabrication & Assembly</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{orders.filter((o) => o.status === 'processing').length} Units</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {orders.filter((o) => o.status === 'processing').map((ord) => (
                  <div key={ord.id} style={{ padding: '10px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontWeight: 600, color: currentTheme.primary, fontSize: '12px' }}>{ord.orderNumber}</div>
                    <div style={{ color: '#0f172a', fontSize: '12px', fontWeight: 500 }}>{ord.customerName}</div>
                    <div style={{ color: currentTheme.secondary, fontSize: '11px', marginTop: '4px' }}>Active on shop floor</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 3: Packaging & Dispatch */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>3. Dispatched & In Transit</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{orders.filter((o) => o.status === 'shipped').length} Units</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {orders.filter((o) => o.status === 'shipped').map((ord) => (
                  <div key={ord.id} style={{ padding: '10px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontWeight: 600, color: currentTheme.primary, fontSize: '12px' }}>{ord.orderNumber}</div>
                    <div style={{ color: '#0f172a', fontSize: '12px', fontWeight: 500 }}>{ord.customerName}</div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                      Tracking: {ord.trackingNumber || 'Road Freight'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Shop Floor Work Order & Personnel Allocation (Module 8 & 9) */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Shop Floor Task Allocations</span>
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '10px' }}>({allocationsList.length} assigned tasks)</span>
              </div>
              <button
                onClick={() => {
                  if (staffList.length > 0) {
                    setTaskFormData({
                      staffId: staffList[0].id,
                      orderId: orders.length > 0 ? orders[0].id : '',
                      taskName: 'SS304 Sheet Metal CNC Fabrication',
                      stage: 'fabrication',
                    });
                  }
                  setIsAllocatingTask(true);
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentTheme.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                + Assign Production Task
              </button>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', backgroundColor: '#ffffff' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '10px 12px' }}>Task Description</th>
                    <th style={{ padding: '10px 12px' }}>Assigned Personnel</th>
                    <th style={{ padding: '10px 12px' }}>Production Stage</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allocationsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '12px 10px', color: '#64748b' }}>No tasks currently allocated. Assign tasks using the button above.</td>
                    </tr>
                  ) : (
                    allocationsList.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>{t.task_name}</td>
                        <td style={{ padding: '10px 12px', color: currentTheme.primary, fontWeight: 500 }}>{t.full_name || t.staff_id}</td>
                        <td style={{ padding: '10px 12px', color: '#64748b', textTransform: 'capitalize' }}>{t.stage}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: t.status === 'completed' ? 'rgba(5,150,105,0.1)' : 'rgba(37,99,235,0.1)', color: t.status === 'completed' ? '#059669' : '#2563eb', border: `1px solid ${t.status === 'completed' ? 'rgba(5,150,105,0.3)' : 'rgba(37,99,235,0.3)'}` }}>
                            {t.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: CRM & Inquiries ── */}
      {activeTab === 'crm' && (
        <CrmWorkspace
          currentTheme={currentTheme}
          metrics={crmMetrics}
          customers={crmCustomers}
          filteredCustomers={crmFilteredCustomers}
          requests={crmRequests}
          activeSubTab={crmActiveSubTab}
          setActiveSubTab={setCrmActiveSubTab}
          periodFilter={crmPeriodFilter}
          setPeriodFilter={async (p) => {
            setCrmPeriodFilter(p);
            try {
              const res = await fetch(`/api/operations/crm/customers?segment=all&period=${p}`, { credentials: 'include' });
              if (res.ok) {
                const data = await res.json();
                if (data.customers) setCrmCustomers(data.customers);
                if (data.metrics) setCrmMetrics(data.metrics);
              }
            } catch (err) {
              console.error('Failed to update period filter', err);
            }
          }}
          searchQuery={crmSearchQuery}
          setSearchQuery={setCrmSearchQuery}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          customerDetail={crmCustomerDetail}
          detailLoading={crmDetailLoading}
          detailTab={crmDetailTab}
          setDetailTab={setCrmDetailTab}
          onSelectCustomer={async (c) => {
            setSelectedCustomer(c);
            await fetchCustomerDetail(c.email);
          }}
          onCrmAction={handleCrmAction}
          onUpdateRequestStatus={handleUpdateCrmRequestStatus}
          formatRupees={formatRupees}
        />
      )}

      {/* ── Tab: Enquiries Management Module ── */}
      {activeTab === 'enquiries' && (
        <EnquiriesWorkspace
          currentTheme={currentTheme}
          metrics={enquiryMetrics}
          enquiries={enquiriesList}
          activeSubTab={enquiryActiveSubTab}
          setActiveSubTab={setEnquiryActiveSubTab}
          selectedEnquiry={selectedEnquiry}
          setSelectedEnquiry={setSelectedEnquiry}
          enquiryDetail={enquiryDetail}
          detailLoading={enquiryDetailLoading}
          onSelectEnquiry={async (e) => {
            setSelectedEnquiry(e);
            await fetchEnquiryDetail(e.id);
          }}
          onRefreshData={async () => {
            try {
              const res = await fetch('/api/operations/enquiries', { credentials: 'include' });
              if (res.ok) {
                const data = await res.json();
                if (data.enquiries) setEnquiriesList(data.enquiries);
                if (data.metrics) setEnquiryMetrics(data.metrics);
              }
              if (selectedEnquiry) {
                await fetchEnquiryDetail(selectedEnquiry.id);
              }
            } catch (err) {
              console.error('Failed refreshing enquiries data', err);
            }
          }}
          formatRupees={formatRupees}
        />
      )}

      {/* ── Tab: Service & Support Management (Module 7) ── */}
      {activeTab === 'services' && (
        <ServicesWorkspace
          currentTheme={currentTheme}
          metrics={serviceMetrics}
          cases={serviceCases}
          activeSubTab={serviceActiveSubTab}
          setActiveSubTab={setServiceActiveSubTab}
          selectedCase={selectedServiceCase}
          setSelectedCase={setSelectedServiceCase}
          serviceDetail={serviceDetail}
          detailLoading={serviceDetailLoading}
          onSelectCase={async (c) => {
            setSelectedServiceCase(c);
            await fetchServiceDetail(c.id);
          }}
          onRefreshData={async () => {
            try {
              const res = await fetch('/api/operations/services', { credentials: 'include' });
              if (res.ok) {
                const data = await res.json();
                if (data.cases) setServiceCases(data.cases);
                if (data.metrics) setServiceMetrics(data.metrics);
              }
              if (selectedServiceCase) {
                await fetchServiceDetail(selectedServiceCase.id);
              }
            } catch (err) {
              console.error('Failed refreshing services data', err);
            }
          }}
          formatRupees={formatRupees}
        />
      )}

      {/* ── Tab: Documents & Reports Library ── */}
      {activeTab === 'documents' && (
        <DocumentsWorkspace
          currentTheme={currentTheme}
          metrics={documentMetrics}
          documents={documentsList}
          activeCategory={documentActiveCategory}
          setActiveCategory={setDocumentActiveCategory}
          selectedDocument={selectedDocument}
          setSelectedDocument={setSelectedDocument}
          documentDetail={documentDetail}
          detailLoading={documentDetailLoading}
          onSelectDocument={async (d) => {
            setSelectedDocument(d);
            await fetchDocumentDetail(d.id);
          }}
          onRefreshData={async () => {
            try {
              const res = await fetch('/api/operations/documents', { credentials: 'include' });
              if (res.ok) {
                const data = await res.json();
                if (data.documents) setDocumentsList(data.documents);
                if (data.metrics) setDocumentMetrics(data.metrics);
              }
              if (selectedDocument) {
                await fetchDocumentDetail(selectedDocument.id);
              }
            } catch (err) {
              console.error('Failed refreshing documents data', err);
            }
          }}
        />
      )}

      {/* ── Tab: Invoice & Billing Engine (InvoicesWorkspace) ── */}
      {activeTab === 'invoicing' && (
        <InvoicesWorkspace
          currentTheme={currentTheme}
          invoices={invoicesList as any}
          focusInvoiceId={focusInvoiceId}
          onRefreshData={async () => {
            try {
              const res = await fetch('/api/operations/invoices');
              if (res.ok) {
                const data = await res.json();
                setInvoicesList(data.invoices || []);
              }
            } catch (err) {
              console.error('Failed to reload invoices', err);
            }
          }}
        />
      )}

      {/* ── Tab: Dedicated Card-Based Payment Records & Cashflow ── */}
      {activeTab === 'payments' && (
        <PaymentsWorkspace
          currentTheme={currentTheme}
          payments={paymentsList}
          onRefreshData={async () => {
            try {
              const res = await fetch('/api/operations/invoices?tab=payments', { credentials: 'include' });
              if (res.ok) {
                const data = await res.json();
                setPaymentsList(data.payments || []);
              }
            } catch (err) {
              console.error('Failed to reload payments', err);
            }
          }}
          onNavigateToInvoice={(invId) => {
            setActiveTab('invoicing');
            setFocusInvoiceId(invId);
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'invoicing');
            window.history.pushState({}, '', url.toString());
          }}
          onNavigateToOrder={(ordId) => {
            setActiveTab('orders');
            const target = orders.find((o) => String(o.id) === String(ordId));
            if (target) setSelectedOrder(target);
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'orders');
            window.history.pushState({}, '', url.toString());
          }}
        />
      )}

      {/* ── Tab: HR & Staff Allocation (Module 9 Upgraded) ── */}
      {activeTab === 'hr' && (
        <HrWorkspace
          currentTheme={currentTheme}
          staffList={staffList}
          attendanceList={attendanceList}
          workLogsList={workLogsList}
          leaveList={leaveList}
          onRefreshData={async () => {
            try {
              const [hrStaffRes, hrAttRes, hrLeavesRes, hrWorkLogsRes] = await Promise.all([
                fetch('/api/operations/hr?tab=staff', { credentials: 'include' }),
                fetch(`/api/operations/hr?tab=attendance&date=${hrDateFilter}`, { credentials: 'include' }),
                fetch('/api/operations/hr?tab=leaves', { credentials: 'include' }),
                fetch('/api/operations/hr?tab=work_logs', { credentials: 'include' }),
              ]);
              if (hrStaffRes.ok) {
                const d = await hrStaffRes.json();
                setStaffList(d.staff || []);
              }
              if (hrAttRes.ok) {
                const d = await hrAttRes.json();
                setAttendanceList(d.records || []);
              }
              if (hrLeavesRes.ok) {
                const d = await hrLeavesRes.json();
                setLeaveList(d.leaves || []);
              }
              if (hrWorkLogsRes.ok) {
                const d = await hrWorkLogsRes.json();
                setWorkLogsList(d.logs || d.workLogs || []);
              }
            } catch (err) {
              console.error('Failed to reload HR datasets', err);
            }
          }}
        />
      )}

      {/* ── Tab: Employee Self-Service Portal ── */}
      {activeTab === 'employee' && (
        <EmployeePortal currentTheme={currentTheme} />
      )}

      {/* ── Tab: User Management & RBAC Workspace (Non-Table Card Interface) ── */}
      {activeTab === 'users' && (
        <UserManagementWorkspace />
      )}

      {/* ── Tab: Documents & Operational Reports (Module 4 & 10) ── */}
      {activeTab === 'reports' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Operational Reports & Compliance Exports
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                Live SQL-aggregated financial balance sheets, inventory movement audit logs, and shop-floor manufacturing reports.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* Financial Report Card */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginBottom: '6px' }}>
                1. Financial & Billing Reconciliation
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
                Aggregates all issued invoices, gross billed amounts, GST components, and collected payments with zero data fabrication.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="/api/operations/reports?type=financial&format=csv"
                  download
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#059669',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  Download Financial CSV
                </a>
                <a
                  href="/api/operations/reports?type=financial&format=json"
                  target="_blank"
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Raw JSON →
                </a>
              </div>
            </div>

            {/* Inventory Movement Ledger Card */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: currentTheme.primary, marginBottom: '6px' }}>
                2. Stock Movements & Inventory Ledger
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
                Audit trail of receipts, reservations, deductions, scrap, and adjustments across all active machinery SKUs.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="/api/operations/reports?type=inventory&format=csv"
                  download
                  style={{
                    padding: '8px 14px',
                    backgroundColor: currentTheme.primary,
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  Download Inventory CSV
                </a>
                <a
                  href="/api/operations/reports?type=inventory&format=json"
                  target="_blank"
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Raw JSON →
                </a>
              </div>
            </div>

            {/* Manufacturing MES Card */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#d97706', marginBottom: '6px' }}>
                3. Manufacturing & Shop-Floor Execution
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
                Status distribution of fabrication stages (CAD prep, CNC fabrication, QA, packaging) and engineering allocations.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="/api/operations/reports?type=manufacturing&format=csv"
                  download
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#d97706',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  Download Manufacturing CSV
                </a>
                <a
                  href="/api/operations/reports?type=manufacturing&format=json"
                  target="_blank"
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Raw JSON →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Detail Modal (Inspect Line Items & Timeline) ── */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              maxWidth: '640px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>Commercial Order Details</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0', color: currentTheme.primary }}>
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Sub-Tabs for Order Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Classification</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: currentTheme.primary, marginTop: '2px' }}>
                  {isBulkOrder(selectedOrder) ? 'Bulk / B2B Commercial' : 'Individual / Retail'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Payment Status</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: selectedOrder.paymentStatus === 'paid' ? '#059669' : '#d97706', marginTop: '2px' }}>
                  {selectedOrder.paymentStatus ? selectedOrder.paymentStatus.toUpperCase() : 'PENDING'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Fulfillment State</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: selectedOrder.status === 'delivered' ? '#059669' : '#0284c7', marginTop: '2px' }}>
                  {selectedOrder.status ? selectedOrder.status.toUpperCase() : 'PENDING'}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Delivery POD</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: selectedOrder.trackingNumber ? '#0f172a' : '#64748b', marginTop: '2px' }}>
                  {selectedOrder.trackingNumber ? `${selectedOrder.carrier || 'Courier'}: ${selectedOrder.trackingNumber}` : 'Not recorded'}
                </div>
              </div>
            </div>

            {/* Customer & Address */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Customer & Purchasing Details</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{selectedOrder.customerName || 'Anonymous Customer'}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{selectedOrder.customerEmail || 'No email'}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedOrder.customerPhone || 'Phone unrecorded'}</div>
                <div style={{ fontSize: '11px', color: '#0f172a', marginTop: '6px', fontWeight: 500 }}>
                  Order Origin: {selectedOrder.notes?.includes('quote') ? 'Converted from Quotation' : 'Direct Operations / Storefront'}
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Delivery Location</div>
                <div style={{ fontSize: '12px', color: '#0f172a', marginTop: '4px' }}>
                  {selectedOrder.shippingAddress?.addressLine1 || 'Direct facility pickup or factory delivery'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {selectedOrder.shippingAddress?.city ? `${selectedOrder.shippingAddress.city}, ` : ''}
                  {selectedOrder.shippingAddress?.state || ''} {selectedOrder.shippingAddress?.postalCode || ''}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                  Country: {selectedOrder.shippingAddress?.country || 'India'}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                Purchased Equipment Snapshot
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '8px 10px' }}>Item Description</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Price</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', color: '#0f172a', fontWeight: 500 }}>{item.name}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{item.quantity}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b', fontFamily: 'monospace' }}>
                          {formatRupees(item.pricePaise)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0f172a', fontFamily: 'monospace', fontWeight: 600 }}>
                          {formatRupees((item.pricePaise || 0) * (item.quantity || 1))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PART D: Active Blockers & Reason Diagnosis Section */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} color="#e11d48" />
                  <span>Pending Blockers & Root Causes</span>
                </div>
                <button
                  onClick={() => setIsAddingBlocker(!isAddingBlocker)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: currentTheme.primary,
                    cursor: 'pointer',
                  }}
                >
                  {isAddingBlocker ? 'Cancel' : '+ Log Issue Blocker'}
                </button>
              </div>

              {/* Log new blocker form */}
              {isAddingBlocker && (
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Blocker Category</label>
                      <select
                        value={blockerForm.category}
                        onChange={(e) => setBlockerForm({ ...blockerForm, category: e.target.value })}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', marginTop: '4px' }}
                      >
                        <option value="Payment and billing">Payment and billing</option>
                        <option value="Inventory and products">Inventory and products</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Shipping and delivery">Shipping and delivery</option>
                        <option value="Customer and business operations">Customer and business operations</option>
                        <option value="Technical and integration failures">Technical and integration failures</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Responsible Team</label>
                      <input
                        type="text"
                        value={blockerForm.responsibleTeam}
                        onChange={(e) => setBlockerForm({ ...blockerForm, responsibleTeam: e.target.value })}
                        placeholder="e.g. Accounts, Fabrication floor..."
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', marginTop: '4px' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Specific Reason / Issue</label>
                    <input
                      type="text"
                      value={blockerForm.reason}
                      onChange={(e) => setBlockerForm({ ...blockerForm, reason: e.target.value })}
                      placeholder="e.g. Component stock reservation conflict, Wire transfer awaiting bank confirmation..."
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', marginTop: '4px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Next Recommended Action</label>
                    <input
                      type="text"
                      value={blockerForm.nextAction}
                      onChange={(e) => setBlockerForm({ ...blockerForm, nextAction: e.target.value })}
                      placeholder="e.g. Expedite motor shipment, Request updated bank UTR from customer..."
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', marginTop: '4px' }}
                    />
                  </div>

                  <button
                    onClick={async () => {
                      if (!blockerForm.reason) {
                        alert('Please enter a specific reason.');
                        return;
                      }
                      try {
                        const res = await fetch('/api/operations/orders/workspace', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'record_blocker',
                            orderId: Number(selectedOrder.id),
                            category: blockerForm.category,
                            reason: blockerForm.reason,
                            diagnosticDetails: blockerForm.diagnosticDetails,
                            responsibleTeam: blockerForm.responsibleTeam,
                            nextAction: blockerForm.nextAction,
                          }),
                        });
                        if (res.ok) {
                          alert('Blocker successfully logged into audit history.');
                          setIsAddingBlocker(false);
                          window.location.reload();
                        } else {
                          const e = await res.json();
                          alert(`Failed: ${e.error || 'Server error'}`);
                        }
                      } catch (err: any) {
                        alert(`Error: ${err.message}`);
                      }
                    }}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: currentTheme.primary,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save Blocker Record
                  </button>
                </div>
              )}

              {/* Existing blockers list */}
              {orderBlockers.filter(b => String(b.order_id) === String(selectedOrder.id)).length === 0 ? (
                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                  No active blockers recorded for this order.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {orderBlockers.filter(b => String(b.order_id) === String(selectedOrder.id)).map((b) => (
                    <div
                      key={b.id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: b.status === 'open' ? '#fff1f2' : '#f0fdf4',
                        border: b.status === 'open' ? '1px solid #fecdd3' : '1px solid #bbf7d0',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: b.status === 'open' ? '#be123c' : '#15803d', textTransform: 'uppercase' }}>
                          [{b.status}] {b.category}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                          {b.reason}
                        </div>
                        {b.next_action && (
                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                            <b>Next Action:</b> {b.next_action} {b.responsible_team ? `(Assigned: ${b.responsible_team})` : ''}
                          </div>
                        )}
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                          Logged: {new Date(b.created_at).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {b.status === 'open' && (
                        <button
                          onClick={async () => {
                            const notes = prompt('Enter resolution notes:', 'Issue resolved and verified');
                            if (!notes) return;
                            try {
                              const res = await fetch('/api/operations/orders/workspace', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  action: 'resolve_blocker',
                                  blockerId: b.id,
                                  resolutionNotes: notes,
                                }),
                              });
                              if (res.ok) {
                                alert('Blocker marked as resolved.');
                                window.location.reload();
                              }
                            } catch (err: any) {
                              alert(`Error: ${err.message}`);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#059669',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PART E: Cancellation Record / Cancel Order Workflow */}
            {selectedOrder.status === 'cancelled' ? (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Audited Cancellation Record
                </div>
                {orderCancellations.filter(c => String(c.order_id) === String(selectedOrder.id)).length > 0 ? (
                  orderCancellations.filter(c => String(c.order_id) === String(selectedOrder.id)).map(c => (
                    <div key={c.id} style={{ fontSize: '12px', color: '#7f1d1d' }}>
                      <div><b>Reason:</b> {c.reason_category}</div>
                      {c.reason_explanation && <div><b>Details:</b> {c.reason_explanation}</div>}
                      <div><b>Cancelled By:</b> {c.actor_category} ({c.actor_identity || 'system'})</div>
                      <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '4px' }}>
                        Timestamp: {new Date(c.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12px', color: '#7f1d1d' }}>
                    Reason: {selectedOrder.notes || 'Not recorded'} (Legacy cancellation record)
                  </div>
                )}
              </div>
            ) : (
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Cancel Order Workflow</span>
                  <button
                    onClick={() => setIsCancellingOrder(!isCancellingOrder)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#fee2e2',
                      border: '1px solid #fecdd3',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#e11d48',
                      cursor: 'pointer',
                    }}
                  >
                    {isCancellingOrder ? 'Dismiss' : 'Initiate Cancellation'}
                  </button>
                </div>

                {isCancellingOrder && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Cancellation Reason</label>
                      <select
                        value={cancelForm.reasonCategory}
                        onChange={(e) => setCancelForm({ ...cancelForm, reasonCategory: e.target.value })}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', marginTop: '4px' }}
                      >
                        <option value="Customer requested cancellation">Customer requested cancellation</option>
                        <option value="Customer changed their mind">Customer changed their mind</option>
                        <option value="Duplicate order">Duplicate order</option>
                        <option value="Incorrect order details">Incorrect order details</option>
                        <option value="Payment declined or payment not completed">Payment declined or payment not completed</option>
                        <option value="Product out of stock or unavailable">Product out of stock or unavailable</option>
                        <option value="Manufacturing or quality issue">Manufacturing or quality issue</option>
                        <option value="Other">Other, with a required explanation</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Explanation / Notes</label>
                      <input
                        type="text"
                        value={cancelForm.reasonExplanation}
                        onChange={(e) => setCancelForm({ ...cancelForm, reasonExplanation: e.target.value })}
                        placeholder="Reason description..."
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', marginTop: '4px' }}
                      />
                    </div>

                    <button
                      onClick={async () => {
                        if (!confirm('Are you sure you want to cancel this order? This will update status and record audit trail.')) return;
                        try {
                          const res = await fetch('/api/operations/orders/workspace', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'cancel_order',
                              orderId: Number(selectedOrder.id),
                              reasonCategory: cancelForm.reasonCategory,
                              reasonExplanation: cancelForm.reasonExplanation || 'Cancelled via Operations Workspace',
                              actorCategory: cancelForm.actorCategory,
                              actorIdentity: 'admin',
                            }),
                          });
                          if (res.ok) {
                            alert('Order successfully cancelled with audit trail.');
                            window.location.reload();
                          } else {
                            const e = await res.json();
                            alert(`Error: ${e.error || 'Server error'}`);
                          }
                        } catch (err: any) {
                          alert(`Error: ${err.message}`);
                        }
                      }}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: '#e11d48',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Confirm Order Cancellation
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Chronological Activity Timeline */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                Order Lifecycle Activity Timeline
              </div>
              {orderTimeline.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                  No historical events recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {orderTimeline.map((item) => (
                    <div key={item.id} style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                      <div style={{ color: '#94a3b8', fontFamily: 'monospace', minWidth: '120px', fontSize: '11px' }}>
                        {new Date(item.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.title}</span>
                        {item.description && <span style={{ color: '#64748b' }}> — {item.description}</span>}
                        {item.actor && <span style={{ color: '#94a3b8', fontSize: '11px' }}> ({item.actor})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Transition Control (Persistent PostgreSQL /api/operations/orders/transition) */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                Operational Status Transition & Audit Trail
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    color: '#0f172a',
                    fontSize: '12px',
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing (Shop Floor)</option>
                  <option value="shipped">Shipped (Dispatched)</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <input
                  type="text"
                  placeholder="Audit reason / note..."
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '160px',
                    padding: '6px 10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    color: '#0f172a',
                    fontSize: '12px',
                  }}
                />

                <button
                  disabled={isTransitioning}
                  onClick={async () => {
                    setIsTransitioning(true);
                    try {
                      const res = await fetch('/api/operations/orders/transition', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          orderId: selectedOrder.id,
                          newStatus: newOrderStatus,
                          reason: transitionReason || 'Status updated from Operations Console',
                        }),
                      });

                      if (res.ok) {
                        alert(`Order #${selectedOrder.orderNumber} transitioned to ${newOrderStatus}!`);
                        window.location.reload();
                      } else {
                        const err = await res.json();
                        alert(`Transition failed: ${err.error || 'Server error'}`);
                      }
                    } catch (e: unknown) {
                      alert(`Error: ${e instanceof Error ? e.message : 'Unknown'}`);
                    } finally {
                      setIsTransitioning(false);
                    }
                  }}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: currentTheme.primary,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: isTransitioning ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isTransitioning ? 'Updating...' : 'Apply Transition'}
                </button>
              </div>
            </div>

            {/* Summary & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Total Amount: </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
                  {formatRupees(selectedOrder.totalPaise)}
                </span>
              </div>
              <a
                href={`/admin/collections/orders/${selectedOrder.id}`}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentTheme.primary,
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Open Payload Record →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Dedicated Product Details Workspace Modal ── */}
      {selectedProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 9999,
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              maxWidth: '1080px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title, SKU, Price, Badges, Close */}
            {(() => {
              const p = selectedProduct;
              const bal = productIntelligence.balanceBySku[p.sku || ''] || { onHand: 0, reserved: 0, available: 0 };
              const demand = p.sku ? productIntelligence.demandBySku[p.sku] : undefined;
              const inMfg = Boolean(p.sku && productIntelligence.skusInManufacturing.has(p.sku));
              const isDeadStock = Boolean(p.sku && productIntelligence.deadStockSkus.has(p.sku));
              const catTitle = typeof p.category === 'object' ? p.category?.title : String(p.category || 'Machinery');

              // Canonical Media URL resolution
              const primaryImg = resolveMediaUrl(p.primaryImage);
              const rawGallery: any[] = Array.isArray(p.imageUrls) ? p.imageUrls : [];
              const galleryImgs: string[] = rawGallery
                .map((img: any) => {
                  if (typeof img === 'string') return resolveMediaUrl(img);
                  if (img && typeof img === 'object' && img.url) return resolveMediaUrl(img.url);
                  return '';
                })
                .filter(Boolean);

              if (galleryImgs.length === 0 && primaryImg) {
                galleryImgs.push(primaryImg);
              }

              const activeImg: string = galleryImgs[selectedImageIdx] || primaryImg;
              const hasValidSequence = Boolean(p.sequenceId && p.sequenceId.trim() !== '');
              const resolvedVideoUrl = p.videoPath ? resolveMediaUrl(p.videoPath) : '';
              const frameTotal = Math.max(1, p.sequenceFrameCount || 36);

              // Specifications
              const specs = Array.isArray(p.specifications) ? p.specifications : [];

              // Stock movements for this SKU
              const relatedMovements = stockMovementsList.filter(m => m.sku === p.sku);

              // Manufacturing tasks
              const relatedAllocations = allocationsList.filter(a => {
                if (!a.order_id) return false;
                const relatedOrd = orders.find(o => String(o.id) === String(a.order_id));
                return relatedOrd && (relatedOrd.items || []).some(it => it.sku === p.sku);
              });

              // Orders containing this SKU
              const relatedOrders = orders.filter(o => (o.items || []).some(it => it.sku === p.sku));

              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: currentTheme.primary, backgroundColor: currentTheme.lightBg, padding: '2px 8px', borderRadius: '4px' }}>
                          {p.sku || 'SKU-UNASSIGNED'}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                          {catTitle}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: p.status === 'Active' ? '#f0fdf4' : '#f8fafc', color: p.status === 'Active' ? '#15803d' : '#64748b', border: '1px solid #cbd5e1' }}>
                          {p.status || 'Active'}
                        </span>
                        {inMfg && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                            In Manufacturing
                          </span>
                        )}
                        {isDeadStock && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ffe4e6', color: '#e11d48', border: '1px solid #fecdd3' }}>
                            Dead Stock Alert
                          </span>
                        )}
                      </div>
                      <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '8px 0 0', color: '#0f172a' }}>
                        {p.name}
                      </h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => {
                          setStockFormData({
                            productId: p.id,
                            sku: p.sku || '',
                            movementType: 'receipt',
                            quantity: 1,
                            notes: `Inventory adjustment for ${p.name}`,
                          });
                          setIsRecordingStock(true);
                        }}
                        style={{
                          padding: '7px 12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        + Record Movement
                      </button>

                      <button
                        onClick={() => {
                          setProductForm({
                            name: p.name || '',
                            sku: p.sku || '',
                            categoryTitle: typeof p.category === 'object' ? p.category?.title || 'Collapsible BBQ' : String(p.category || 'Collapsible BBQ'),
                            pricePaise: p.pricePaise || 0,
                            status: (p.status as 'Active' | 'Draft' | 'Archived') || 'Active',
                            salesMode: (p.salesMode as 'direct' | 'quote' | 'both') || 'both',
                            shortDescription: p.shortDescription || '',
                            description: p.description || '',
                            primaryImage: primaryImg,
                            warranty: p.warranty || '1 Year Manufacturer Structural Warranty',
                            sequenceId: p.sequenceId || '',
                            sequenceFrameCount: p.sequenceFrameCount || 36,
                            has3D: Boolean(p.has3D),
                            hasVideo: Boolean(p.hasVideo),
                            videoPath: p.videoPath || '',
                            specs: Array.isArray(p.specifications) && p.specifications.length > 0
                              ? p.specifications.map((s: any) => ({ name: s.name || '', value: s.value || '', group: s.group || 'General' }))
                              : [
                                  { name: 'Material', value: '304 Stainless Steel & Heavy Gauge Steel', group: 'General' },
                                  { name: 'Dimensions', value: '750 x 420 x 600 mm', group: 'Dimensions' },
                                ],
                          });
                          setIsCreatingProduct(true);
                        }}
                        style={{
                          padding: '7px 14px',
                          backgroundColor: currentTheme.primary,
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Edit Product
                      </button>

                      <button
                        onClick={() => setSelectedProduct(null)}
                        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* 4 Structured Detail Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '4px', marginBottom: '20px', overflowX: 'auto' }}>
                    {[
                      { id: 'overview', label: 'Overview & Info', icon: BookOpen },
                      { id: 'media', label: `Media & 360° (${galleryImgs.length})`, icon: ImageIcon },
                      { id: 'specs', label: 'Specifications', icon: SlidersHorizontal },
                      { id: 'docs', label: 'Warranty & Manuals', icon: Shield },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeProductDetailTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveProductDetailTab(tab.id as any)}
                          style={{
                            padding: '8px 14px',
                            border: 'none',
                            borderBottom: isActive ? `2px solid ${currentTheme.primary}` : '2px solid transparent',
                            backgroundColor: 'transparent',
                            color: isActive ? currentTheme.primary : '#64748b',
                            fontSize: '12px',
                            fontWeight: isActive ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Icon size={14} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab 1: Overview & Info */}
                  {activeProductDetailTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Price & Valuation</div>
                          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', marginTop: '4px' }}>
                            {p.pricePaise ? formatRupees(p.pricePaise) : 'Pricing On Quote'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            Sales Mode: <b>{p.salesMode || 'direct & quote'}</b> • Status: <b>{p.status || 'Active'}</b>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Short Summary</div>
                          <p style={{ fontSize: '13px', color: '#0f172a', lineHeight: 1.5, margin: 0 }}>
                            {p.shortDescription || 'No short summary provided.'}
                          </p>
                        </div>

                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Full Operational Description</div>
                          <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, backgroundColor: '#ffffff', border: '1px solid #f1f5f9', padding: '12px', borderRadius: '6px' }}>
                            {p.description || 'No extended description available for this equipment.'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Operational Snapshot</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                            <div>
                              <span style={{ color: '#64748b' }}>Available Stock: </span>
                              <b style={{ color: bal.available > 0 ? '#059669' : '#e11d48' }}>{bal.available} Units</b>
                            </div>
                            <div>
                              <span style={{ color: '#64748b' }}>Reserved for Orders: </span>
                              <b>{bal.reserved} Units</b>
                            </div>
                            <div>
                              <span style={{ color: '#64748b' }}>Units Sold (Demand): </span>
                              <b>{demand?.unitsOrdered || 0} Units</b>
                            </div>
                            <div>
                              <span style={{ color: '#64748b' }}>Distinct Orders: </span>
                              <b>{demand?.orderCount || 0} Orders</b>
                            </div>
                            <div>
                              <span style={{ color: '#64748b' }}>Active Production: </span>
                              <b>{inMfg ? `${relatedAllocations.length} Tasks` : 'None'}</b>
                            </div>
                            <div>
                              <span style={{ color: '#64748b' }}>Dead Stock Status: </span>
                              <b style={{ color: isDeadStock ? '#e11d48' : '#059669' }}>{isDeadStock ? 'Flagged (>60d idle)' : 'Active Velocity'}</b>
                            </div>
                          </div>
                        </div>

                        <div style={{ height: '200px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {activeImg ? (
                            <img
                              src={activeImg}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div style={{ display: activeImg ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                            <ImageIcon size={36} />
                            <span style={{ fontSize: '11px', fontWeight: 500 }}>No Image Available</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Media & 360° Viewer & Real Video Player */}
                  {activeProductDetailTab === 'media' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 300px', gap: '20px' }}>
                        {/* Main Media Preview Box */}
                        <div style={{ backgroundColor: '#0f172a', borderRadius: '10px', overflow: 'hidden', minHeight: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', color: '#fff', padding: '16px' }}>
                          {hasValidSequence ? (
                            <div
                              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}
                              onMouseDown={(e) => {
                                const startX = e.clientX;
                                const initialFrame = turntableFrame;
                                const onMouseMove = (moveEvt: MouseEvent) => {
                                  const delta = moveEvt.clientX - startX;
                                  const steps = Math.floor(delta / 8);
                                  const newFrame = ((initialFrame + steps) % frameTotal + frameTotal) % frameTotal;
                                  setTurntableFrame(newFrame);
                                };
                                const onMouseUp = () => {
                                  window.removeEventListener('mousemove', onMouseMove);
                                  window.removeEventListener('mouseup', onMouseUp);
                                };
                                window.addEventListener('mousemove', onMouseMove);
                                window.addEventListener('mouseup', onMouseUp);
                              }}
                            >
                              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
                                  <RotateCw size={14} />
                                  <span style={{ fontWeight: 600 }}>Interactive 360° Turntable (Drag to Rotate)</span>
                                </div>
                                <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                                  Frame {turntableFrame} / {frameTotal - 1}
                                </span>
                              </div>

                              <div style={{ position: 'relative', width: '100%', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img
                                  src={`${R2_PUBLIC_CDN}/3d-assets/sequences/${encodeURIComponent(p.sequenceId!)}/${String(turntableFrame).padStart(3, '0')}.webp`}
                                  alt={`${p.name} 360 frame ${turntableFrame}`}
                                  onError={(e) => {
                                    // Fallback to active image if sequence frame fails
                                    if (activeImg) {
                                      (e.currentTarget as HTMLImageElement).src = activeImg;
                                    } else {
                                      (e.currentTarget as HTMLElement).style.display = 'none';
                                    }
                                  }}
                                  style={{ maxHeight: '260px', maxWidth: '100%', objectFit: 'contain', cursor: 'grab' }}
                                />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', marginTop: '12px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTurntableFrame((f) => (f - 1 + frameTotal) % frameTotal);
                                  }}
                                  style={{ padding: '6px 12px', backgroundColor: '#334155', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                                >
                                  ◀ Rotate
                                </button>
                                <input
                                  type="range"
                                  min={0}
                                  max={frameTotal - 1}
                                  value={turntableFrame}
                                  onChange={(e) => setTurntableFrame(Number(e.target.value))}
                                  style={{ flex: 1, accentColor: currentTheme.primary }}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTurntableFrame((f) => (f + 1) % frameTotal);
                                  }}
                                  style={{ padding: '6px 12px', backgroundColor: '#334155', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                                >
                                  Rotate ▶
                                </button>
                              </div>
                            </div>
                          ) : activeImg ? (
                            <img src={activeImg} alt={p.name} style={{ maxHeight: '320px', maxWidth: '100%', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                              <ImageIcon size={48} style={{ margin: '0 auto 8px' }} />
                              <div style={{ fontSize: '14px', fontWeight: 600 }}>No Product Media Uploaded</div>
                              <div style={{ fontSize: '11px', marginTop: '4px' }}>Click Edit Product to add image or 360 sequence assets.</div>
                            </div>
                          )}
                        </div>

                        {/* Media Asset List & Upload Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Gallery Assets ({galleryImgs.length})</div>
                          {galleryImgs.length === 0 ? (
                            <div style={{ padding: '20px 10px', textAlign: 'center', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#94a3b8', fontSize: '12px' }}>
                              No gallery images configured.
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                              {galleryImgs.map((img, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => setSelectedImageIdx(idx)}
                                  style={{
                                    height: '74px',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    border: selectedImageIdx === idx ? `2px solid ${currentTheme.primary}` : '1px solid #cbd5e1',
                                    cursor: 'pointer',
                                    backgroundColor: '#f8fafc',
                                  }}
                                >
                                  <img src={img} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 360° Sequence Status Card */}
                          <div style={{ padding: '12px', backgroundColor: hasValidSequence ? '#f0fdf4' : '#f8fafc', border: hasValidSequence ? '1px solid #bbf7d0' : '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }}>
                            <div style={{ fontWeight: 600, color: hasValidSequence ? '#15803d' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <RotateCw size={14} />
                              <span>360° Turntable Asset</span>
                            </div>
                            <div style={{ color: hasValidSequence ? '#166534' : '#64748b', fontSize: '11px', marginTop: '4px' }}>
                              {hasValidSequence ? (
                                <span>Sequence: <b>{p.sequenceId}</b> ({frameTotal} frames available)</span>
                              ) : (
                                <span>360° view not available. Configure sequence in Edit Product.</span>
                              )}
                            </div>
                          </div>

                          {/* Video Player Section */}
                          <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                              <Video size={14} color={currentTheme.primary} />
                              <span>Product Demonstration Video</span>
                            </div>
                            {resolvedVideoUrl ? (
                              <div>
                                <video
                                  controls
                                  preload="metadata"
                                  style={{ width: '100%', maxHeight: '160px', borderRadius: '4px', backgroundColor: '#000' }}
                                  src={resolvedVideoUrl}
                                >
                                  Your browser does not support the video tag.
                                </video>
                                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Source: {p.videoPath}</div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                                No demonstration video attached for this model.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Grouped Specifications */}
                  {activeProductDetailTab === 'specs' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        Structured technical and industrial equipment specifications:
                      </div>

                      {specs.length === 0 ? (
                        <div style={{ padding: '24px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                          No structured specifications recorded for this model. Click <b>Edit Product</b> to specify dimensions, power, materials, and capacity.
                        </div>
                      ) : (
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                                <th style={{ padding: '10px 14px', width: '25%' }}>Specification</th>
                                <th style={{ padding: '10px 14px' }}>Value</th>
                                <th style={{ padding: '10px 14px', width: '20%' }}>Category Group</th>
                              </tr>
                            </thead>
                            <tbody>
                              {specs.map((s: any, idx: number) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{s.name}</td>
                                  <td style={{ padding: '10px 14px', color: '#334155' }}>{s.value}</td>
                                  <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px' }}>{s.group || 'General'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Documentation & Warranty */}
                  {activeProductDetailTab === 'docs' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>
                          <Shield size={16} color={currentTheme.primary} />
                          <span>Commercial Equipment Warranty</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                          <b>Coverage Terms:</b> {p.warranty || '1 Year Manufacturer Structural & Burner Warranty'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
                          Exclusions: Consumable components, unauthorized field electrical modifications, and non-compliance with grease trap cleaning procedures.
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>
                          <BookOpen size={16} color={currentTheme.primary} />
                          <span>Manuals & Safe Operation Guides</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                          <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Operating Manual & Daily Maintenance Protocol</span>
                            <span style={{ color: currentTheme.primary, fontWeight: 600 }}>PDF Download</span>
                          </div>
                          <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Pre-Installation Electrical & Gas Safety Checklist</span>
                            <span style={{ color: currentTheme.primary, fontWeight: 600 }}>PDF Download</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Modal: Add / Edit Product (Structured Equipment Form) ── */}
      {isCreatingProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 9999,
          }}
          onClick={() => setIsCreatingProduct(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                {products.some(p => p.sku === productForm.sku) ? 'Edit Commercial Equipment' : 'Add New Machinery Model'}
              </h3>
              <button
                onClick={() => setIsCreatingProduct(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Product / Model Name *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Commercial Automatic Wok Robot V2"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. KB-WOK-002"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Category
                  </label>
                  <select
                    value={productForm.categoryTitle}
                    onChange={(e) => setProductForm({ ...productForm, categoryTitle: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                  >
                    <option value="Collapsible BBQ">Collapsible BBQ</option>
                    <option value="Rocket Stoves">Rocket Stoves</option>
                    <option value="Automatic BBQ">Automatic BBQ</option>
                    <option value="Santa Maria Series">Santa Maria Series</option>
                    <option value="Suitcase BBQ">Suitcase BBQ</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Automatic Woks">Automatic Woks</option>
                    <option value="Smart Fryers">Smart Fryers</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={productForm.pricePaise / 100}
                    onChange={(e) => setProductForm({ ...productForm, pricePaise: Math.round(Number(e.target.value) * 100) })}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Catalog Status
                  </label>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Short Description
                </label>
                <input
                  type="text"
                  value={productForm.shortDescription}
                  onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  placeholder="Concise commercial summary..."
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Product Primary Cover Image
                </label>

                {/* Current Image Preview & Management */}
                {productForm.primaryImage ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <div style={{ width: '84px', height: '84px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <img
                        src={resolveMediaUrl(productForm.primaryImage)}
                        alt="Product Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', wordBreak: 'break-all' }}>
                        {productForm.primaryImage.startsWith('{')
                          ? (() => {
                              try {
                                return JSON.parse(productForm.primaryImage).url;
                              } catch {
                                return productForm.primaryImage;
                              }
                            })()
                          : productForm.primaryImage}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        Image linked to product record
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <label
                          style={{
                            padding: '5px 12px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#334155',
                            cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            disabled={isUploadingImage}
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 10 * 1024 * 1024) {
                                setImageUploadError('File size exceeds 10 MB limit');
                                return;
                              }
                              setIsUploadingImage(true);
                              setImageUploadProgress(`Uploading ${file.name}...`);
                              setImageUploadError(null);
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                formData.append('alt', productForm.name || 'Product Image');
                                const res = await fetch('/api/operations/media/upload', {
                                  method: 'POST',
                                  credentials: 'include',
                                  body: formData,
                                });
                                const data = await res.json();
                                if (res.ok && data.url) {
                                  setProductForm((prev) => ({ ...prev, primaryImage: data.url }));
                                  setImageUploadProgress(`Uploaded: ${file.name}`);
                                  setTimeout(() => setImageUploadProgress(null), 3000);
                                } else {
                                  setImageUploadError(data.error || 'Upload failed');
                                }
                              } catch (err) {
                                console.error('Upload error', err);
                                setImageUploadError('Network error uploading image');
                              } finally {
                                setIsUploadingImage(false);
                                e.target.value = '';
                              }
                            }}
                          />
                          <span>{isUploadingImage ? 'Uploading...' : 'Change Image'}</span>
                        </label>

                        <button
                          type="button"
                          disabled={isUploadingImage}
                          onClick={() => {
                            if (confirm('Remove product image?')) {
                              setProductForm((prev) => ({ ...prev, primaryImage: '' }));
                              setImageUploadProgress(null);
                              setImageUploadError(null);
                            }
                          }}
                          style={{
                            padding: '5px 12px',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecdd3',
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#dc2626',
                            cursor: 'pointer',
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                      No product image attached yet
                    </div>
                    <label
                      style={{
                        padding: '7px 16px',
                        backgroundColor: currentTheme.primary,
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                        display: 'inline-block',
                      }}
                    >
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={isUploadingImage}
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) {
                            setImageUploadError('File size exceeds 10 MB limit');
                            return;
                          }
                          setIsUploadingImage(true);
                          setImageUploadProgress(`Uploading ${file.name}...`);
                          setImageUploadError(null);
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('alt', productForm.name || 'Product Image');
                            const res = await fetch('/api/operations/media/upload', {
                              method: 'POST',
                              credentials: 'include',
                              body: formData,
                            });
                            const data = await res.json();
                            if (res.ok && data.url) {
                              setProductForm((prev) => ({ ...prev, primaryImage: data.url }));
                              setImageUploadProgress(`Uploaded: ${file.name}`);
                              setTimeout(() => setImageUploadProgress(null), 3000);
                            } else {
                              setImageUploadError(data.error || 'Upload failed');
                            }
                          } catch (err) {
                            console.error('Upload error', err);
                            setImageUploadError('Network error uploading image');
                          } finally {
                            setIsUploadingImage(false);
                            e.target.value = '';
                          }
                        }}
                      />
                      <span>{isUploadingImage ? 'Uploading...' : 'Choose Image from Device'}</span>
                    </label>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                      Supports PNG, JPG, WEBP up to 10 MB
                    </div>
                  </div>
                )}

                {imageUploadProgress && (
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '6px' }}>
                    ✓ {imageUploadProgress}
                  </div>
                )}
                {imageUploadError && (
                  <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600, marginTop: '6px' }}>
                    ✕ {imageUploadError}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    360° Turntable Sequence ID
                  </label>
                  <input
                    type="text"
                    value={productForm.sequenceId}
                    onChange={(e) => setProductForm({ ...productForm, sequenceId: e.target.value })}
                    placeholder="e.g. kb-suitcase-bbq-small"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    360° Frame Count
                  </label>
                  <input
                    type="number"
                    value={productForm.sequenceFrameCount}
                    onChange={(e) => setProductForm({ ...productForm, sequenceFrameCount: Number(e.target.value) || 36 })}
                    placeholder="36"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Demonstration Video Path / URL
                  </label>
                  <input
                    type="text"
                    value={productForm.videoPath}
                    onChange={(e) => setProductForm({ ...productForm, videoPath: e.target.value })}
                    placeholder="/videos/demo.mp4 or https://..."
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Warranty Term
                  </label>
                  <input
                    type="text"
                    value={productForm.warranty}
                    onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}
                    placeholder="1 Year Manufacturer Structural Warranty"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ color: '#0f172a', fontSize: '12px', fontWeight: 700 }}>
                    Technical Specifications
                  </label>
                  <button
                    onClick={() => {
                      setProductForm({
                        ...productForm,
                        specs: [...productForm.specs, { name: '', value: '', group: 'General' }],
                      });
                    }}
                    style={{ fontSize: '11px', padding: '3px 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    + Add Field
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {productForm.specs.map((spec, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Name (e.g. Voltage)"
                        value={spec.name}
                        onChange={(e) => {
                          const updated = [...productForm.specs];
                          updated[i].name = e.target.value;
                          setProductForm({ ...productForm, specs: updated });
                        }}
                        style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. 230V / 50Hz)"
                        value={spec.value}
                        onChange={(e) => {
                          const updated = [...productForm.specs];
                          updated[i].value = e.target.value;
                          setProductForm({ ...productForm, specs: updated });
                        }}
                        style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                      />
                      <input
                        type="text"
                        placeholder="Group (e.g. Electrical)"
                        value={spec.group}
                        onChange={(e) => {
                          const updated = [...productForm.specs];
                          updated[i].group = e.target.value;
                          setProductForm({ ...productForm, specs: updated });
                        }}
                        style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                      />
                      <button
                        onClick={() => {
                          const updated = productForm.specs.filter((_, idx) => idx !== i);
                          setProductForm({ ...productForm, specs: updated });
                        }}
                        style={{ border: 'none', background: 'none', color: '#e11d48', cursor: 'pointer', padding: '0 6px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  onClick={() => setIsCreatingProduct(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!productForm.name || !productForm.sku) {
                      alert('Please provide product name and SKU code.');
                      return;
                    }

                    // Check for duplicate SKU among other products
                    const existingProduct = products.find(p => p.sku === productForm.sku);
                    const isUpdate = Boolean(existingProduct);

                    // Category mapping
                    const categoryMap: Record<string, number> = {
                      'Collapsible BBQ': 1,
                      'Rocket Stoves': 2,
                      'Automatic BBQ': 3,
                      'Santa Maria Series': 4,
                      'Suitcase BBQ': 5,
                      'Accessories': 6,
                      'Automatic Woks': 6, // default to accessories or fallback
                      'Smart Fryers': 6,
                    };
                    const categoryId = categoryMap[productForm.categoryTitle] || 1;
                    const generatedSlug = isUpdate && existingProduct?.slug
                      ? existingProduct.slug
                      : productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

                    try {
                      const endpoint = isUpdate ? `/api/products/${existingProduct!.id}` : '/api/products';
                      const method = isUpdate ? 'PATCH' : 'POST';

                      const payloadBody: Record<string, any> = {
                        name: productForm.name,
                        sku: productForm.sku,
                        pricePaise: productForm.pricePaise,
                        status: productForm.status,
                        salesMode: productForm.salesMode,
                        shortDescription: productForm.shortDescription,
                        description: productForm.description,
                        primaryImage: productForm.primaryImage,
                        warranty: productForm.warranty,
                        sequenceId: productForm.sequenceId || null,
                        sequenceFrameCount: productForm.sequenceFrameCount || 36,
                        has3D: Boolean(productForm.sequenceId && productForm.sequenceId.trim() !== ''),
                        hasVideo: Boolean(productForm.videoPath && productForm.videoPath.trim() !== ''),
                        videoPath: productForm.videoPath || null,
                        specifications: productForm.specs.filter(s => s.name && s.value),
                        category: categoryId,
                      };

                      if (!isUpdate) {
                        payloadBody.slug = generatedSlug;
                      }

                      const res = await fetch(endpoint, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(payloadBody),
                      });

                      if (res.ok) {
                        alert(isUpdate ? 'Product updated successfully!' : 'New equipment model added to catalog!');
                        setIsCreatingProduct(false);
                        window.location.reload();
                      } else {
                        const err = await res.json();
                        alert(`Failed to save product: ${err.message || 'Server error'}`);
                      }
                    } catch (e: any) {
                      alert(`Error saving product: ${e.message}`);
                    }
                  }}
                  style={{ padding: '8px 18px', backgroundColor: currentTheme.primary, color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Equipment Model
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Record Stock Movement ── */}
      {isRecordingStock && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
          onClick={() => setIsRecordingStock(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Record Stock Movement
              </h3>
              <button
                onClick={() => setIsRecordingStock(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Equipment Model / SKU
                </label>
                <select
                  value={stockFormData.sku}
                  onChange={(e) => {
                    const selProd = products.find(p => p.sku === e.target.value);
                    setStockFormData({
                      ...stockFormData,
                      sku: e.target.value,
                      productId: selProd ? selProd.id : stockFormData.productId,
                    });
                  }}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.sku || ''}>
                      {p.name} ({p.sku || 'No SKU'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Movement Type
                </label>
                <select
                  value={stockFormData.movementType}
                  onChange={(e) => setStockFormData({ ...stockFormData, movementType: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                >
                  <option value="receipt">Stock Receipt (Factory Inflow)</option>
                  <option value="reservation">Reserve for Order</option>
                  <option value="release">Release Reservation</option>
                  <option value="deduction">Deduction (Dispatched Unit)</option>
                  <option value="defect_scrap">Defect / Scrap</option>
                  <option value="adjustment">Stock Audit Adjustment</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Quantity (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockFormData.quantity}
                  onChange={(e) => setStockFormData({ ...stockFormData, quantity: Math.max(1, Number(e.target.value)) })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Notes / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Batch #401 Factory intake"
                  value={stockFormData.notes}
                  onChange={(e) => setStockFormData({ ...stockFormData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                />
              </div>

              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/operations/inventory', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        productId: stockFormData.productId || '1',
                        sku: stockFormData.sku,
                        movementType: stockFormData.movementType,
                        quantity: stockFormData.quantity,
                        notes: stockFormData.notes,
                      }),
                    });

                    if (res.ok) {
                      alert('Stock movement recorded successfully!');
                      setIsRecordingStock(false);
                      window.location.reload();
                    } else {
                      const err = await res.json();
                      alert(`Failed to record movement: ${err.error || 'Server error'}`);
                    }
                  } catch (e: unknown) {
                    alert(`Error: ${e instanceof Error ? e.message : 'Unknown'}`);
                  }
                }}
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: currentTheme.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                Submit Stock Movement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Allocate Production Task ── */}
      {isAllocatingTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
          onClick={() => setIsAllocatingTask(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Assign Shop Floor Work Order Task
              </h3>
              <button
                onClick={() => setIsAllocatingTask(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Assigned Personnel
                </label>
                <select
                  value={taskFormData.staffId}
                  onChange={(e) => setTaskFormData({ ...taskFormData, staffId: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                >
                  {staffList.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} ({st.job_title} · {st.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Associated Order
                </label>
                <select
                  value={taskFormData.orderId}
                  onChange={(e) => setTaskFormData({ ...taskFormData, orderId: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                >
                  <option value="">General Shop Task (No specific order)</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Manufacturing Stage
                </label>
                <select
                  value={taskFormData.stage}
                  onChange={(e) => setTaskFormData({ ...taskFormData, stage: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                >
                  <option value="fabrication">1. Laser Cutting & Bending</option>
                  <option value="welding">2. TIG/MIG Welding & Polishing</option>
                  <option value="assembly">3. Mechanical & Electrical Assembly</option>
                  <option value="qc">4. Quality Control & Stress Testing</option>
                  <option value="packaging">5. Crate Packaging & Dispatch</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Task Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weld main heating jacket and attach thermocouple"
                  value={taskFormData.taskName}
                  onChange={(e) => setTaskFormData({ ...taskFormData, taskName: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a' }}
                />
              </div>

              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/operations/hr', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'allocate_task',
                        staffId: taskFormData.staffId,
                        orderId: taskFormData.orderId || undefined,
                        taskName: taskFormData.taskName,
                        stage: taskFormData.stage,
                      }),
                    });

                    if (res.ok) {
                      alert('Task assigned successfully!');
                      setIsAllocatingTask(false);
                      window.location.reload();
                    } else {
                      const err = await res.json();
                      alert(`Task allocation failed: ${err.error || 'Server error'}`);
                    }
                  } catch (e: unknown) {
                    alert(`Error: ${e instanceof Error ? e.message : 'Unknown'}`);
                  }
                }}
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: currentTheme.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                Assign Work Order Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Appearance & Palette Selector (6 Coordinated Options) ── */}
      {isThemeModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 10000,
          }}
          onClick={() => setIsThemeModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Appearance & Theme Palette
              </h3>
              <button
                onClick={() => setIsThemeModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
              Select from six coordinated enterprise accent palettes. The light-mode background and readable typography remain consistent across all choices.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {(Object.keys(PALETTES) as PaletteId[]).map((palKey) => {
                const pal = PALETTES[palKey];
                const isSelected = palette === palKey;
                return (
                  <button
                    key={pal.id}
                    onClick={() => changePalette(pal.id)}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${pal.primary}` : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? pal.lightBg : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                        {pal.name}
                      </span>
                      {isSelected && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: pal.primary }}>
                          ✓ Active
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span
                        title={`Primary: ${pal.colors[0]}`}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', backgroundColor: pal.colors[0], display: 'inline-block', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                      />
                      <span
                        title={`Secondary: ${pal.colors[1]}`}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', backgroundColor: pal.colors[1], display: 'inline-block', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                      />
                      <span
                        title={`Neutral: ${pal.colors[2]}`}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', backgroundColor: pal.colors[2], display: 'inline-block', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsThemeModalOpen(false)}
                style={{
                  padding: '8px 18px',
                  backgroundColor: currentTheme.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal: Direct Counter POS Sale ── */}
      {isPosModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
          onClick={() => setIsPosModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Direct Counter Sale (POS)
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Atomic on-the-spot walk-in transaction with order, 18% GST invoice snapshot, and stock deduction.
                </p>
              </div>
              <button
                onClick={() => setIsPosModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPosSubmitting(true);
                try {
                  const targetProdId = posForm.productId || (products[0] ? String(products[0].id) : '1');
                  const targetLocId = posForm.locationId || (locationsList[0] ? locationsList[0].id : 1);

                  const selProduct = products.find(p => String(p.id) === String(targetProdId));
                  const unitPrice = selProduct?.pricePaise || 2999900;
                  const itemSku = selProduct?.sku;
                  const itemName = selProduct?.name || 'Commercial Machinery';

                  const res = await fetch('/api/operations/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      action: 'direct_sale',
                      customerName: posForm.customerName.trim() || 'Counter Walk-in Customer',
                      customerEmail: posForm.customerEmail.trim() || undefined,
                      customerPhone: posForm.customerPhone.trim() || undefined,
                      locationId: Number(targetLocId),
                      items: [
                        {
                          productId: targetProdId,
                          sku: itemSku,
                          name: itemName,
                          quantity: Number(posForm.quantity) || 1,
                          unitPricePaise: unitPrice,
                        },
                      ],
                      paymentMethod: posForm.paymentMethod,
                      paymentReference: posForm.paymentReference.trim() || (posForm.paymentMethod === 'cash' ? 'CASH-COUNTER' : `MANUAL-${Date.now()}`),
                      notes: posForm.notes,
                    }),
                  });

                  if (!res.ok) {
                    const err = await res.json();
                    alert(`Direct Sale Failed: ${err.error || 'Server error'}`);
                    return;
                  }

                  const data = await res.json();
                  setIsPosModalOpen(false);
                  setCompletedPosSale(data.sale);
                  // Refresh operations datasets
                  window.location.reload();
                } catch (err: any) {
                  alert(`Direct sale error: ${err.message}`);
                } finally {
                  setPosSubmitting(false);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}
            >
              {/* Customer Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar / Hotel Green"
                    value={posForm.customerName}
                    onChange={(e) => setPosForm({ ...posForm, customerName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={posForm.customerPhone}
                    onChange={(e) => setPosForm({ ...posForm, customerPhone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                  Customer Email (Optional for receipt delivery)
                </label>
                <input
                  type="email"
                  placeholder="customer@domain.com"
                  value={posForm.customerEmail}
                  onChange={(e) => setPosForm({ ...posForm, customerEmail: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Warehouse & Equipment Item Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                    Fulfilling Location *
                  </label>
                  <select
                    value={posForm.locationId || (locationsList[0] ? locationsList[0].id : '')}
                    onChange={(e) => setPosForm({ ...posForm, locationId: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    {locationsList.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                    Product Equipment *
                  </label>
                  <select
                    value={posForm.productId || (products[0] ? products[0].id : '')}
                    onChange={(e) => setPosForm({ ...posForm, productId: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    {products.map((p) => {
                      const bal = inventoryBalances.find(b => b.sku === p.sku);
                      const avail = bal ? bal.available : 0;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — Avail: {avail}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Quantity & Live Calculated Totals */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={posForm.quantity}
                    onChange={(e) => setPosForm({ ...posForm, quantity: Math.max(1, Number(e.target.value)) })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>

                {(() => {
                  const selProd = products.find(p => String(p.id) === String(posForm.productId || (products[0] ? products[0].id : '')));
                  const price = selProd && selProd.pricePaise ? selProd.pricePaise : 2999900;
                  const qty = Number(posForm.quantity) || 1;
                  const subtotal = price * qty;
                  const tax = Math.round(subtotal * 0.18);
                  const total = subtotal + tax;

                  return (
                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                        <span>Subtotal:</span>
                        <span style={{ fontFamily: 'monospace' }}>{formatRupees(subtotal)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                        <span>18% GST (Tax):</span>
                        <span style={{ fontFamily: 'monospace' }}>{formatRupees(tax)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0f172a', borderTop: '1px solid #cbd5e1', marginTop: '4px', paddingTop: '4px' }}>
                        <span>Counter Total:</span>
                        <span style={{ fontFamily: 'monospace', color: '#059669', fontSize: '13px' }}>{formatRupees(total)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Payment Method */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                    Settlement Method *
                  </label>
                  <select
                    value={posForm.paymentMethod}
                    onChange={(e) => setPosForm({ ...posForm, paymentMethod: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="cash">Direct Cash Handover</option>
                    <option value="upi">Manual UPI Payment (Bank Verified)</option>
                    <option value="bank_neft">Bank Transfer / NEFT / IMPS</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                    Payment Reference / UTR {posForm.paymentMethod !== 'cash' && '*'}
                  </label>
                  <input
                    type="text"
                    required={posForm.paymentMethod !== 'cash'}
                    placeholder={posForm.paymentMethod === 'cash' ? 'CASH-COUNTER' : 'e.g. UTR-AXIS-98214'}
                    value={posForm.paymentReference}
                    onChange={(e) => setPosForm({ ...posForm, paymentReference: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {posForm.paymentMethod === 'upi' && (
                <div style={{ padding: '8px 12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '11px', color: '#1e40af' }}>
                  ℹ️ Note: Live Merchant Dynamic QR requires gateway API configuration. Please verify customer UPI transaction UTR manually against the company account before submitting.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsPosModalOpen(false)}
                  style={{ padding: '8px 14px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posSubmitting}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: posSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {posSubmitting ? 'Recording POS Sale...' : 'Complete Sale & Deduct Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: POS Receipt Popup ── */}
      {completedPosSale && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 10000,
          }}
          onClick={() => setCompletedPosSale(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(5,150,105,0.1)', color: '#059669', marginBottom: '8px' }}>
                <FileCheck size={28} />
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Kitchen Bots Official Receipt
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                Commercial Machinery Direct Counter POS
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Sale Reference:</span>
                <strong style={{ fontFamily: 'monospace' }}>{completedPosSale.saleNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Customer:</span>
                <strong>{completedPosSale.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Location:</span>
                <span>{completedPosSale.locationName || 'Main Hub'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Mode:</span>
                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{completedPosSale.paymentMethod}</span>
              </div>
              {completedPosSale.paymentReference && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Transaction Ref:</span>
                  <span style={{ fontFamily: 'monospace' }}>{completedPosSale.paymentReference}</span>
                </div>
              )}
              <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '6px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>
                <span style={{ fontFamily: 'monospace' }}>{formatRupees(completedPosSale.subtotalPaise)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>18% GST (Tax):</span>
                <span style={{ fontFamily: 'monospace' }}>{formatRupees(completedPosSale.taxGstPaise)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #0f172a', paddingTop: '6px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                <span>Paid Total:</span>
                <span style={{ fontFamily: 'monospace', color: '#059669' }}>{formatRupees(completedPosSale.totalPaise)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <Printer size={14} />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setCompletedPosSale(null)}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: currentTheme.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add Warehouse Location ── */}
      {isCreatingLocation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
          onClick={() => setIsCreatingLocation(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Register Warehouse Location
              </h3>
              <button
                onClick={() => setIsCreatingLocation(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch('/api/operations/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      action: 'create_location',
                      code: locationForm.code.trim().toUpperCase(),
                      name: locationForm.name.trim(),
                      type: locationForm.type,
                      address: locationForm.address.trim(),
                    }),
                  });

                  if (res.ok) {
                    alert('Warehouse location registered successfully!');
                    setIsCreatingLocation(false);
                    window.location.reload();
                  } else {
                    const err = await res.json();
                    alert(`Failed to add location: ${err.error || 'Server error'}`);
                  }
                } catch (err: any) {
                  alert(`Error: ${err.message}`);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}
            >
              <div>
                <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                  Location Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WH-BLR-02"
                  value={locationForm.code}
                  onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengaluru Central Hub"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                  Facility Type
                </label>
                <select
                  value={locationForm.type}
                  onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value as any })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="warehouse">Warehouse</option>
                  <option value="retail_store">Retail Store / Experience Center</option>
                  <option value="factory_floor">Factory Floor</option>
                  <option value="quarantine">Quarantine Bay</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                  Address / Physical Bay
                </label>
                <textarea
                  rows={2}
                  placeholder="Street, Industrial Area, City, Pin"
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreatingLocation(false)}
                  style={{ padding: '8px 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Register Serialized Unit ── */}
      {isRegisteringUnit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
          onClick={() => setIsRegisteringUnit(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Register Individual Serialized Unit
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                  Assign unique manufacturing serial number to inventory unit.
                </p>
              </div>
              <button
                onClick={() => setIsRegisteringUnit(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const targetProd = products.find(p => String(p.id) === String(unitForm.productId || (products[0] ? products[0].id : '1')));
                  const targetSku = targetProd?.sku || unitForm.sku || 'KB-SKU-001';
                  const targetLoc = unitForm.locationId || (locationsList[0] ? locationsList[0].id : null);

                  const res = await fetch('/api/operations/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      action: 'register_unit',
                      productId: targetProd ? targetProd.id : 1,
                      sku: targetSku,
                      serialNumber: unitForm.serialNumber.trim(),
                      locationId: targetLoc ? Number(targetLoc) : null,
                      binLocation: unitForm.binLocation.trim() || undefined,
                    }),
                  });

                  if (res.ok) {
                    alert('Unit registered successfully!');
                    setIsRegisteringUnit(false);
                    window.location.reload();
                  } else {
                    const err = await res.json();
                    alert(`Failed to register unit: ${err.error || 'Server error'}`);
                  }
                } catch (err: any) {
                  alert(`Error: ${err.message}`);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}
            >
              <div>
                <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                  Equipment Model *
                </label>
                <select
                  value={unitForm.productId || (products[0] ? products[0].id : '')}
                  onChange={(e) => {
                    const sel = products.find(p => String(p.id) === e.target.value);
                    setUnitForm({ ...unitForm, productId: e.target.value, sku: sel?.sku || '' });
                  }}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                  Serial Number * (Manual entry or barcode scan)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KB-BBQ-2026-0042"
                  value={unitForm.serialNumber}
                  onChange={(e) => setUnitForm({ ...unitForm, serialNumber: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                    Assigned Location
                  </label>
                  <select
                    value={unitForm.locationId}
                    onChange={(e) => setUnitForm({ ...unitForm, locationId: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    {locationsList.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                    Bin / Shelf Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bay 4 / Shelf B"
                    value={unitForm.binLocation}
                    onChange={(e) => setUnitForm({ ...unitForm, binLocation: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsRegisteringUnit(false)}
                  style={{ padding: '8px 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Register Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Move Serialized Unit Location ── */}
      {movingUnit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
          onClick={() => setMovingUnit(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Move Unit Location
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Serial: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{movingUnit.serialNumber}</strong>
                </p>
              </div>
              <button
                onClick={() => setMovingUnit(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch('/api/operations/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      action: 'update_unit_location',
                      unitId: movingUnit.id,
                      locationId: Number(moveUnitLocationId),
                      binLocation: moveUnitBin.trim() || undefined,
                    }),
                  });

                  if (res.ok) {
                    alert('Unit moved successfully!');
                    setMovingUnit(null);
                    window.location.reload();
                  } else {
                    const err = await res.json();
                    alert(`Failed to move unit: ${err.error || 'Server error'}`);
                  }
                } catch (err: any) {
                  alert(`Error: ${err.message}`);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}
            >
              <div>
                <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                  Target Warehouse / Facility *
                </label>
                <select
                  value={moveUnitLocationId}
                  onChange={(e) => setMoveUnitLocationId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                >
                  {locationsList.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#475569', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                  Target Bin / Shelf
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rack C / Bay 2"
                  value={moveUnitBin}
                  onChange={(e) => setMoveUnitBin(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setMovingUnit(null)}
                  style={{ padding: '8px 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Confirm Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

