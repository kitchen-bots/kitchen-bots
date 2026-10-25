'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  Printer,
  ChevronRight,
  ExternalLink,
  Building,
  User,
  Package,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle,
  Truck,
  RotateCcw,
  PlusCircle,
  Send,
  X,
  Mail,
  Phone,
  Receipt,
  FileCheck,
} from 'lucide-react';

export interface InvoiceItem {
  id?: string;
  name: string;
  sku?: string;
  hsnCode?: string;
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
}

export interface PaymentTransactionRecord {
  id: string;
  amountPaise: number;
  paymentMethod: string;
  transactionReference: string;
  status: string;
  recordedBy?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface InvoiceDetail {
  id: string;
  invoice_number: string;
  order_id?: number | null;
  order_number?: string | null;
  order_status?: string | null;
  order_payment_status?: string | null;
  customer_phone?: string | null;
  customer_name: string;
  customer_email: string;
  billing_address?: any;
  subtotal_paise: string | number;
  tax_gst_paise: string | number;
  total_paise: string | number;
  paid_paise: string | number;
  balance_due_paise: string | number;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';
  due_date: string;
  issued_at: string;
  updated_at: string;
  item_count?: number;
  payment_count?: number;
  items?: InvoiceItem[];
  items_summary?: InvoiceItem[];
  payments?: PaymentTransactionRecord[];
}

interface InvoicesWorkspaceProps {
  currentTheme: {
    primary: string;
    secondary?: string;
    neutral?: string;
    lightBg?: string;
    subtleBorder?: string;
    [key: string]: any;
  };
  invoices: InvoiceDetail[];
  onRefreshData: () => Promise<void>;
  onRecordPayment?: (params: {
    invoiceId: string;
    amountPaise: number;
    paymentMethod: string;
    transactionReference: string;
    notes?: string;
  }) => Promise<void>;
  focusInvoiceId?: string | null;
}

export const InvoicesWorkspace: React.FC<InvoicesWorkspaceProps> = ({
  currentTheme,
  invoices,
  onRefreshData,
  onRecordPayment,
  focusInvoiceId,
}) => {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'product' | 'bulk'>('product');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(focusInvoiceId ?? null);
  useEffect(() => {
    if (focusInvoiceId) setSelectedInvoiceId(focusInvoiceId);
  }, [focusInvoiceId]);
  const [detailTab, setDetailTab] = useState<
    | 'overview'
    | 'items'
    | 'tax'
    | 'payments'
    | 'address'
    | 'delivery'
    | 'customer'
    | 'actions'
    | 'activity'
  >('overview');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partially_paid' | 'issued' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'due'>('newest');

  // Payment Recording Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmountRupees, setPaymentAmountRupees] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_neft' | 'upi' | 'card' | 'cheque' | 'cash'>('bank_neft');
  const [txnRef, setTxnRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Classification logic (Strict, verified business rules - no guessing)
  const isBulkOrder = (inv: InvoiceDetail): boolean => {
    if (inv.order_number && inv.order_number.startsWith('KB-ORD-Q')) return true;
    if (inv.billing_address && typeof inv.billing_address === 'object' && inv.billing_address.gstin) {
      return true;
    }
    const lowerName = (inv.customer_name || '').toLowerCase();
    if (lowerName.includes('caterer') || lowerName.includes('pvt') || lowerName.includes('ltd') || lowerName.includes('commercial')) {
      return true;
    }
    return false;
  };

  const formatRupees = (paise: string | number | undefined): string => {
    const val = typeof paise === 'string' ? parseFloat(paise) : paise || 0;
    return (val / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  };

  const formatDate = (isoStr?: string): string => {
    if (!isoStr) return 'Not recorded';
    try {
      return new Date(isoStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  // KPI Calculations across verified records
  const kpis = useMemo(() => {
    const totalInvoices = invoices.length;
    let totalInvoicedPaise = 0;
    let totalPaymentsPaise = 0;
    let outstandingPaise = 0;
    let overdueCount = 0;
    let fullyPaidCount = 0;
    let partialCount = 0;
    let draftCount = 0;

    const now = new Date();

    invoices.forEach((inv) => {
      const tot = parseFloat(String(inv.total_paise || 0));
      const paid = parseFloat(String(inv.paid_paise || 0));
      const bal = parseFloat(String(inv.balance_due_paise || 0));

      totalInvoicedPaise += tot;
      totalPaymentsPaise += paid;
      outstandingPaise += bal;

      if (inv.status === 'paid' || bal <= 0) {
        fullyPaidCount++;
      } else if (inv.status === 'partially_paid' || (paid > 0 && bal > 0)) {
        partialCount++;
      } else if (inv.status === 'draft') {
        draftCount++;
      }

      if (bal > 0 && inv.due_date && new Date(inv.due_date) < now) {
        overdueCount++;
      }
    });

    return {
      totalInvoices,
      totalInvoicedPaise,
      totalPaymentsPaise,
      outstandingPaise,
      overdueCount,
      fullyPaidCount,
      partialCount,
      draftCount,
    };
  }, [invoices]);

  // Tab Filtering & Querying
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    return invoices
      .filter((inv) => {
        const bulk = isBulkOrder(inv);
        if (activeTab === 'bulk' && !bulk) return false;
        if (activeTab === 'product' && bulk) return false;

        if (statusFilter === 'paid' && inv.status !== 'paid' && parseFloat(String(inv.balance_due_paise || 0)) > 0) return false;
        if (statusFilter === 'partially_paid' && inv.status !== 'partially_paid') return false;
        if (statusFilter === 'issued' && inv.status !== 'issued') return false;
        if (statusFilter === 'overdue') {
          const isOverdue = parseFloat(String(inv.balance_due_paise || 0)) > 0 && inv.due_date && new Date(inv.due_date) < now;
          if (!isOverdue) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNum = inv.invoice_number?.toLowerCase().includes(q);
          const matchOrd = inv.order_number?.toLowerCase().includes(q);
          const matchCust = inv.customer_name?.toLowerCase().includes(q);
          const matchEmail = inv.customer_email?.toLowerCase().includes(q);
          const matchPhone = inv.customer_phone?.toLowerCase().includes(q);
          const matchGstin = typeof inv.billing_address === 'object' && inv.billing_address?.gstin?.toLowerCase().includes(q);
          if (!matchNum && !matchOrd && !matchCust && !matchEmail && !matchPhone && !matchGstin) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime();
        if (sortBy === 'oldest') return new Date(a.issued_at).getTime() - new Date(b.issued_at).getTime();
        if (sortBy === 'highest') return parseFloat(String(b.total_paise || 0)) - parseFloat(String(a.total_paise || 0));
        if (sortBy === 'lowest') return parseFloat(String(a.total_paise || 0)) - parseFloat(String(b.total_paise || 0));
        if (sortBy === 'due') return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        return 0;
      });
  }, [invoices, activeTab, statusFilter, searchQuery, sortBy]);

  // Selected Detail Record
  const selectedInvoice = useMemo(() => {
    if (!selectedInvoiceId) return null;
    return invoices.find((i) => i.id === selectedInvoiceId) || null;
  }, [invoices, selectedInvoiceId]);

  // Payment Recording Submit Handler
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPaymentError(null);

    const amountRupees = parseFloat(paymentAmountRupees);
    if (isNaN(amountRupees) || amountRupees <= 0) {
      setPaymentError('Please enter a valid payment amount greater than ₹0');
      return;
    }

    const amountPaise = Math.round(amountRupees * 100);
    const balanceDue = parseFloat(String(selectedInvoice.balance_due_paise || 0));
    if (amountPaise > balanceDue) {
      setPaymentError(`Payment amount (${formatRupees(amountPaise)}) exceeds balance due (${formatRupees(balanceDue)})`);
      return;
    }

    if (!txnRef.trim()) {
      setPaymentError('Transaction or UTR reference ID is required');
      return;
    }

    setPaymentSubmitting(true);
    try {
      if (onRecordPayment) {
        await onRecordPayment({
          invoiceId: selectedInvoice.id,
          amountPaise,
          paymentMethod,
          transactionReference: txnRef.trim(),
          notes: paymentNotes.trim() || undefined,
        });
      } else {
        const res = await fetch('/api/operations/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'payment',
            invoiceId: selectedInvoice.id,
            amountPaise,
            paymentMethod,
            transactionReference: txnRef.trim(),
            notes: paymentNotes.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to record payment');
        }
        await onRefreshData();
      }
      setIsPaymentModalOpen(false);
      setPaymentAmountRupees('');
      setTxnRef('');
      setPaymentNotes('');
    } catch (err: any) {
      setPaymentError(err.message || 'Payment recording failed');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return { backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' };
      case 'partially_paid':
        return { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' };
      case 'issued':
        return { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' };
      case 'draft':
        return { backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* ── KPI Overview Strip (Card-First, Native Inline-Flex Grid) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        {/* KPI 1: Total Invoices */}
        <div
          onClick={() => setStatusFilter('all')}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = currentTheme.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
              Total Invoices
            </span>
            <FileText style={{ width: '16px', height: '16px', color: currentTheme.primary }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
            {kpis.totalInvoices}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontFamily: 'monospace' }}>
            Billed: {formatRupees(kpis.totalInvoicedPaise)}
          </div>
        </div>

        {/* KPI 2: Payments Settled */}
        <div
          onClick={() => setStatusFilter('paid')}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#059669')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
              Payments Settled
            </span>
            <CheckCircle2 style={{ width: '16px', height: '16px', color: '#059669' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669', lineHeight: 1.2 }}>
            {formatRupees(kpis.totalPaymentsPaise)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            {kpis.fullyPaidCount} fully settled invoices
          </div>
        </div>

        {/* KPI 3: Outstanding Balance */}
        <div
          onClick={() => setStatusFilter('partially_paid')}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#d97706')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
              Outstanding Due
            </span>
            <Clock style={{ width: '16px', height: '16px', color: '#d97706' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706', lineHeight: 1.2 }}>
            {formatRupees(kpis.outstandingPaise)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            {kpis.partialCount} partially paid
          </div>
        </div>

        {/* KPI 4: Overdue Invoices */}
        <div
          onClick={() => setStatusFilter('overdue')}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#dc2626')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
              Overdue Invoices
            </span>
            <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626', lineHeight: 1.2 }}>
            {kpis.overdueCount}
          </div>
          <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>
            Requires collection action
          </div>
        </div>
      </div>

      {/* ── Main Workspace Card ── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden',
        }}
      >
        {/* Navigation & Controls Strip */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            backgroundColor: '#f8fafc',
          }}
        >
          {/* Primary Category Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                setActiveTab('product');
                setSelectedInvoiceId(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                border: activeTab === 'product' ? `1px solid ${currentTheme.primary}` : '1px solid #cbd5e1',
                backgroundColor: activeTab === 'product' ? currentTheme.primary : '#ffffff',
                color: activeTab === 'product' ? '#ffffff' : '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Package style={{ width: '15px', height: '15px' }} />
              Product Invoices
            </button>
            <button
              onClick={() => {
                setActiveTab('bulk');
                setSelectedInvoiceId(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                border: activeTab === 'bulk' ? `1px solid ${currentTheme.primary}` : '1px solid #cbd5e1',
                backgroundColor: activeTab === 'bulk' ? currentTheme.primary : '#ffffff',
                color: activeTab === 'bulk' ? '#ffffff' : '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Building style={{ width: '15px', height: '15px' }} />
              Bulk Order Invoices
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            Showing <strong>{filteredInvoices.length}</strong> of {invoices.length} total records
          </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '15px',
                height: '15px',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search by invoice #, order #, customer, email, phone or GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Payment Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Fully Settled</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="issued">Unpaid / Issued</option>
            <option value="overdue">Overdue Invoices</option>
          </select>

          {/* Sort By Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
            <option value="due">Due Date</option>
          </select>
        </div>

        {/* Workspace Body: Responsive Master-Detail Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: selectedInvoice ? 'repeat(auto-fit, minmax(360px, 1fr))' : '1fr',
            minHeight: '560px',
          }}
        >
          {/* Master Listing: Invoice Cards (Card-First, Never Tables) */}
          <div
            style={{
              padding: '20px',
              borderRight: selectedInvoice ? '1px solid #e2e8f0' : 'none',
              backgroundColor: '#ffffff',
              maxHeight: '800px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {filteredInvoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                <FileText style={{ width: '36px', height: '36px', color: '#cbd5e1', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>No Invoices Found</div>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  No records match the active category and filter criteria.
                </p>
              </div>
            ) : (
              filteredInvoices.map((inv) => {
                const isSelected = selectedInvoiceId === inv.id;
                const balanceDue = parseFloat(String(inv.balance_due_paise || 0));
                const totalAmount = parseFloat(String(inv.total_paise || 0));
                const isOverdue = balanceDue > 0 && inv.due_date && new Date(inv.due_date) < new Date();
                const badgeStyle = getStatusBadgeStyle(inv.status);

                return (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvoiceId(inv.id);
                      setDetailTab('overview');
                    }}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${currentTheme.primary}` : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.03)' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: currentTheme.primary }}>
                        {inv.invoice_number}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isOverdue && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                            }}
                          >
                            OVERDUE
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            ...badgeStyle,
                          }}
                        >
                          {inv.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Customer Row */}
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                      {inv.customer_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span>Order: {inv.order_number || 'Direct'}</span>
                      <span>·</span>
                      <span>{formatDate(inv.issued_at)}</span>
                    </div>

                    {/* Financial Summary Tile */}
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, display: 'block' }}>
                          Total Invoiced
                        </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                          {formatRupees(totalAmount)}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, display: 'block' }}>
                          Balance Due
                        </span>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: balanceDue > 0 ? '#d97706' : '#059669',
                          }}
                        >
                          {formatRupees(balanceDue)}
                        </span>
                      </div>
                    </div>

                    {inv.items_summary && inv.items_summary.length > 0 && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Items: {inv.items_summary.map((i) => i.name).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Detail Panel: Clean Structured Tabs */}
          {selectedInvoice && (
            <div
              style={{
                padding: '24px',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                overflowY: 'auto',
                maxHeight: '800px',
              }}
            >
              {/* Detail Header Tile */}
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                        {selectedInvoice.invoice_number}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          ...getStatusBadgeStyle(selectedInvoice.status),
                        }}
                      >
                        {selectedInvoice.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      <span>Issued: <strong>{formatDate(selectedInvoice.issued_at)}</strong></span>
                      <span>·</span>
                      <span>Due: <strong>{formatDate(selectedInvoice.due_date)}</strong></span>
                      <span>·</span>
                      <span>Linked Order: <strong>{selectedInvoice.order_number || 'Direct'}</strong></span>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={handlePrint}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Printer style={{ width: '14px', height: '14px' }} />
                      Print
                    </button>
                    <button
                      onClick={handlePrint}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Download style={{ width: '14px', height: '14px' }} />
                      Save PDF
                    </button>
                    {parseFloat(String(selectedInvoice.balance_due_paise || 0)) > 0 && (
                      <button
                        onClick={() => {
                          setPaymentAmountRupees(
                            (parseFloat(String(selectedInvoice.balance_due_paise || 0)) / 100).toFixed(0)
                          );
                          setIsPaymentModalOpen(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <PlusCircle style={{ width: '14px', height: '14px' }} />
                        Record Payment
                      </button>
                    )}
                  </div>
                </div>

                {/* 3 Metric Tiles inside Header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, display: 'block' }}>Total Invoiced</span>
                    <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                      {formatRupees(selectedInvoice.total_paise)}
                    </span>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#047857', fontWeight: 600, display: 'block' }}>Amount Settled</span>
                    <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', color: '#047857' }}>
                      {formatRupees(selectedInvoice.paid_paise)}
                    </span>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#b45309', fontWeight: 600, display: 'block' }}>Balance Due</span>
                    <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', color: '#b45309' }}>
                      {formatRupees(selectedInvoice.balance_due_paise)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Navigation Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  backgroundColor: '#ffffff',
                  padding: '4px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  overflowX: 'auto',
                }}
              >
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'items', label: 'Line Items' },
                  { id: 'tax', label: 'Tax & GST' },
                  { id: 'payments', label: 'Transactions' },
                  { id: 'address', label: 'Addresses' },
                  { id: 'delivery', label: 'Fulfilment' },
                  { id: 'customer', label: 'Customer' },
                  { id: 'actions', label: 'Actions' },
                  { id: 'activity', label: 'Audit Trail' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDetailTab(t.id as any)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: detailTab === t.id ? currentTheme.primary : 'transparent',
                      color: detailTab === t.id ? '#ffffff' : '#64748b',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Detail Tab Contents */}
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
              >
                {/* 1. Overview */}
                {detailTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      Transaction Summary
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Customer Name</span>
                        <strong style={{ color: '#0f172a' }}>{selectedInvoice.customer_name}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedInvoice.customer_email}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Order Category</span>
                        <strong style={{ color: '#0f172a' }}>
                          {isBulkOrder(selectedInvoice) ? 'Commercial / Bulk Order' : 'Individual Product Order'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Order Number</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>
                          {selectedInvoice.order_number || 'Direct Invoice'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Fulfilment Status</span>
                        <strong style={{ textTransform: 'capitalize', color: '#0f172a' }}>
                          {selectedInvoice.order_status || 'Confirmed'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Items Purchased */}
                {detailTab === 'items' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      Invoiced Line Items Snapshot
                    </h4>
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '6px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                              SKU: {item.sku || 'N/A'} · HSN: {item.hsnCode || '8438'} · Qty: {item.quantity}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{formatRupees(item.unitPricePaise)} each</div>
                            <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                              {formatRupees(item.totalPaise)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : selectedInvoice.items_summary && selectedInvoice.items_summary.length > 0 ? (
                      selectedInvoice.items_summary.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '6px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                              SKU: {item.sku || 'N/A'} · Qty: {item.quantity}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                            {formatRupees(item.totalPaise)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#64748b', padding: '12px 0' }}>No item breakdown recorded for this legacy invoice.</div>
                    )}
                  </div>
                )}

                {/* 3. Tax Breakdown */}
                {detailTab === 'tax' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      Tax & GST Compliance Breakdown
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Subtotal (Taxable Value):</span>
                        <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{formatRupees(selectedInvoice.subtotal_paise)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Applicable GST (CGST 9% + SGST 9% / IGST 18%):</span>
                        <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{formatRupees(selectedInvoice.tax_gst_paise)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, fontSize: '14px' }}>
                        <span style={{ color: '#0f172a' }}>Final Invoice Total:</span>
                        <span style={{ fontFamily: 'monospace', color: currentTheme.primary }}>{formatRupees(selectedInvoice.total_paise)}</span>
                      </div>
                    </div>

                    <div style={{ padding: '12px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a', fontSize: '12px', color: '#92400e', marginTop: '10px' }}>
                      <strong>GSTIN Validation:</strong> Seller is classified under Indian GST for Food Processing Machinery (HSN 8438). Buyer GSTIN is read strictly from billing address snapshots without fabrication.
                    </div>
                  </div>
                )}

                {/* 4. Payments */}
                {detailTab === 'payments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Transaction History</h4>
                      {parseFloat(String(selectedInvoice.balance_due_paise || 0)) > 0 && (
                        <button
                          onClick={() => {
                            setPaymentAmountRupees((parseFloat(String(selectedInvoice.balance_due_paise || 0)) / 100).toFixed(0));
                            setIsPaymentModalOpen(true);
                          }}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          + Add Payment
                        </button>
                      )}
                    </div>

                    {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                      selectedInvoice.payments.map((p, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px',
                            borderRadius: '6px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', textTransform: 'uppercase', fontSize: '12px' }}>
                              {p.paymentMethod.replace('_', ' ')} · Ref: {p.transactionReference}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {formatDate(p.createdAt)} · Status: <span style={{ color: '#059669', fontWeight: 700 }}>{p.status}</span>
                            </div>
                            {p.notes && <div style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', marginTop: '4px' }}>Note: {p.notes}</div>}
                          </div>
                          <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#059669', fontSize: '14px' }}>
                            +{formatRupees(p.amountPaise)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#64748b', padding: '16px 0', textAlign: 'center' }}>
                        No payments recorded yet for this invoice.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Addresses */}
                {detailTab === 'address' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      Recorded Addresses Snapshot
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Billing Address</div>
                        {selectedInvoice.billing_address ? (
                          <div style={{ color: '#475569', lineHeight: 1.5, fontSize: '12px' }}>
                            <div>{selectedInvoice.billing_address.fullName || selectedInvoice.customer_name}</div>
                            <div>{selectedInvoice.billing_address.addressLine1 || 'On-file commercial premises'}</div>
                            <div>
                              {selectedInvoice.billing_address.city || 'Bengaluru'}, {selectedInvoice.billing_address.state || 'Karnataka'} {selectedInvoice.billing_address.postalCode}
                            </div>
                            {selectedInvoice.billing_address.gstin && (
                              <div style={{ marginTop: '6px', fontFamily: 'monospace', fontWeight: 700, color: currentTheme.primary }}>
                                GSTIN: {selectedInvoice.billing_address.gstin}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ color: '#94a3b8' }}>Not recorded</div>
                        )}
                      </div>
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Shipping / Destination Address</div>
                        <div style={{ color: '#475569', fontSize: '12px', lineHeight: 1.5 }}>
                          Same as verified commercial billing address / on-site installation location.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Fulfilment */}
                {detailTab === 'delivery' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      Order Fulfilment Status
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle2 style={{ width: '16px', height: '16px', color: '#059669' }} />
                        <div>
                          <strong style={{ color: '#0f172a' }}>Invoice Issued & Order Confirmed</strong>
                          <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>{formatDate(selectedInvoice.issued_at)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Truck style={{ width: '16px', height: '16px', color: currentTheme.primary }} />
                        <div>
                          <strong style={{ color: '#0f172a' }}>Delivery & Dispatch</strong>
                          <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>
                            Order Status: {selectedInvoice.order_status || 'Pending dispatch'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. Customer Profile */}
                {detailTab === 'customer' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      Customer Record
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Full Name</span>
                        <strong style={{ color: '#0f172a' }}>{selectedInvoice.customer_name}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Email Address</span>
                        <strong style={{ color: '#0f172a' }}>{selectedInvoice.customer_email}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Phone Contact</span>
                        <span style={{ color: '#0f172a' }}>{selectedInvoice.customer_phone || 'Not recorded'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. Actions */}
                {detailTab === 'actions' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      Invoice Actions
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      <button
                        onClick={handlePrint}
                        style={{
                          padding: '12px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: 600,
                          color: '#0f172a',
                        }}
                      >
                        <span>Print Tax Invoice</span>
                        <Printer style={{ width: '16px', height: '16px', color: '#64748b' }} />
                      </button>
                      <button
                        onClick={handlePrint}
                        style={{
                          padding: '12px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontWeight: 600,
                          color: '#0f172a',
                        }}
                      >
                        <span>Save as PDF</span>
                        <Download style={{ width: '16px', height: '16px', color: '#64748b' }} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 9. Audit Trail */}
                {detailTab === 'activity' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      Internal Audit History
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                      <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <strong style={{ color: '#0f172a' }}>Invoice Created:</strong> {formatDate(selectedInvoice.issued_at)}
                      </div>
                      <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <strong style={{ color: '#0f172a' }}>Last Updated:</strong> {formatDate(selectedInvoice.updated_at)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Record Payment Modal ── */}
      {isPaymentModalOpen && selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Record Payment Receipt</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Target Invoice</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>
                  {selectedInvoice.invoice_number} ({selectedInvoice.customer_name})
                </strong>
                <div style={{ fontSize: '12px', color: '#d97706', marginTop: '2px', fontWeight: 600 }}>
                  Balance Due: {formatRupees(selectedInvoice.balance_due_paise)}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={paymentAmountRupees}
                  onChange={(e) => setPaymentAmountRupees(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="bank_neft">Bank Transfer / NEFT / RTGS</option>
                  <option value="upi">UPI (Manual UTR Verification)</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash Handover</option>
                </select>
              </div>

              {paymentMethod === 'upi' && (
                <div style={{ padding: '8px 12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '11px', color: '#1e40af' }}>
                  ℹ️ <strong>Merchant UPI Dynamic QR Unconfigured</strong>: Live payment gateway webhooks are not connected. Enter the bank verified UTR / transaction ID from your account statement.
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Transaction Reference / UTR
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-AXIS-2026-98124"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Internal audit trail note..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {paymentError && (
                <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '12px' }}>
                  {paymentError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: paymentSubmitting ? 'not-allowed' : 'pointer',
                    opacity: paymentSubmitting ? 0.6 : 1,
                  }}
                >
                  {paymentSubmitting ? 'Recording...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
