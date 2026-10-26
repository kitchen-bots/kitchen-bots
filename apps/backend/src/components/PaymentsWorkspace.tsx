'use client';

import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
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
  Ban,
  ArrowDownRight,
  RefreshCw,
  Eye,
  MessageSquare,
  Lock,
} from 'lucide-react';

export interface BillingPaymentRecord {
  id: string;
  invoiceId: string;
  amountPaise: number | string;
  paymentMethod: string;
  transactionReference: string;
  status: 'pending' | 'success' | 'completed' | 'failed' | 'cancelled';
  recordedBy?: string | null;
  notes?: string | null;
  createdAt: string;
  invoiceNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string | null;
  invoiceTotalPaise?: number | string;
  invoicePaidPaise?: number | string;
  invoiceBalanceDuePaise?: number | string;
  invoiceStatus?: string;
  orderId?: number | string | null;
  orderNumber?: string | null;
  orderStatus?: string | null;
  orderPaymentStatus?: string | null;
  billingAddress?: {
    city?: string;
    state?: string;
    gstin?: string;
    addressLine1?: string;
    postalCode?: string;
  } | null;
  cancellationInfo?: {
    id?: string;
    reasonCategory?: string;
    reasonExplanation?: string;
    refundStatus?: string;
    createdAt?: string;
  } | null;
}

interface PaymentsWorkspaceProps {
  currentTheme: {
    primary: string;
    secondary?: string;
    neutral?: string;
    lightBg?: string;
    subtleBorder?: string;
    [key: string]: any;
  };
  payments: BillingPaymentRecord[];
  onRefreshData: () => Promise<void>;
  onNavigateToInvoice?: (invoiceId: string) => void;
  onNavigateToOrder?: (orderId: string | number) => void;
}

export function PaymentsWorkspace({
  currentTheme,
  payments = [],
  onRefreshData,
  onNavigateToInvoice,
  onNavigateToOrder,
}: PaymentsWorkspaceProps) {
  // 1. Primary Tabs: exactly 'pending' | 'completed' | 'cancelled'
  const [activePrimaryTab, setActivePrimaryTab] = useState<'pending' | 'completed' | 'cancelled'>('completed');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [failedOnlyFilter, setFailedOnlyFilter] = useState(false);
  const [refundFilter, setRefundFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');

  // Detail Drawer state
  const [selectedPayment, setSelectedPayment] = useState<BillingPaymentRecord | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Status mutation & note state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatusSelection, setNewStatusSelection] = useState<string>('');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Currency Formatter
  const formatINR = (paiseVal?: number | string) => {
    if (!paiseVal) return '₹0';
    const num = typeof paiseVal === 'string' ? parseFloat(paiseVal) : paiseVal;
    if (isNaN(num)) return '₹0';
    return `₹${(num / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Normalizer: treats 'success' in database as 'completed'
  const normalizeStatus = (status: string) => {
    if (status === 'success') return 'completed';
    return status;
  };

  // 2. Metrics & KPI calculations strictly from existing records
  const kpis = useMemo(() => {
    let totalCount = payments.length;
    let completedCount = 0;
    let completedAmountPaise = 0;
    let pendingCount = 0;
    let pendingAmountPaise = 0;
    let failedCount = 0;
    let cancelledCount = 0;
    let refundsPendingCount = 0;
    let refundsCompletedCount = 0;

    // Set of unique invoices to calculate outstanding invoice balance without double counting
    const seenInvoices = new Map<string, number>();
    // One order cancellation can be linked to many payments; count each refund once.
    const seenCancellations = new Set<string>();

    payments.forEach((p) => {
      const s = normalizeStatus(p.status);
      const amt = Number(p.amountPaise) || 0;

      if (s === 'completed') {
        completedCount++;
        completedAmountPaise += amt;
      } else if (s === 'pending') {
        pendingCount++;
        pendingAmountPaise += amt;
      } else if (s === 'failed') {
        failedCount++;
      } else if (s === 'cancelled') {
        cancelledCount++;
      }

      const c = p.cancellationInfo;
      if (c?.refundStatus && !seenCancellations.has(String(c.id))) {
        seenCancellations.add(String(c.id));
        if (c.refundStatus.includes('pending')) {
          refundsPendingCount++;
        } else if (c.refundStatus.includes('completed') || c.refundStatus.includes('success')) {
          refundsCompletedCount++;
        }
      }

      if (p.invoiceId && p.invoiceBalanceDuePaise !== undefined) {
        seenInvoices.set(p.invoiceId, Number(p.invoiceBalanceDuePaise) || 0);
      }
    });

    let totalOutstandingPaise = 0;
    seenInvoices.forEach((bal) => {
      totalOutstandingPaise += bal;
    });

    return {
      totalCount,
      completedCount,
      completedAmountPaise,
      pendingCount,
      pendingAmountPaise,
      failedCount,
      cancelledCount,
      refundsPendingCount,
      refundsCompletedCount,
      totalOutstandingPaise,
    };
  }, [payments]);

  // 3. Filtered and Sorted Payment Records
  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        const s = normalizeStatus(p.status);

        // Tab partition
        if (activePrimaryTab === 'completed' && s !== 'completed') return false;
        if (activePrimaryTab === 'cancelled' && s !== 'cancelled') return false;
        if (activePrimaryTab === 'pending') {
          // In pending tab, we show pending records, plus failed records if user does not filter them out
          if (failedOnlyFilter) {
            if (s !== 'failed') return false;
          } else {
            if (s !== 'pending' && s !== 'failed') return false;
          }
        }

        // Method filter
        if (methodFilter !== 'all') {
          if (p.paymentMethod !== methodFilter) return false;
        }

        // Refund filter
        if (refundFilter !== 'all') {
          if (!p.cancellationInfo?.refundStatus) return false;
          if (refundFilter === 'pending' && !p.cancellationInfo.refundStatus.includes('pending')) return false;
          if (refundFilter === 'completed' && !p.cancellationInfo.refundStatus.includes('completed')) return false;
        }

        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = p.id.toLowerCase().includes(q);
          const matchRef = p.transactionReference?.toLowerCase().includes(q) || false;
          const matchCustomer = p.customerName?.toLowerCase().includes(q) || false;
          const matchEmail = p.customerEmail?.toLowerCase().includes(q) || false;
          const matchInv = p.invoiceNumber?.toLowerCase().includes(q) || false;
          const matchOrd = p.orderNumber?.toLowerCase().includes(q) || false;
          if (!matchId && !matchRef && !matchCustomer && !matchEmail && !matchInv && !matchOrd) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'amount_desc') return (Number(b.amountPaise) || 0) - (Number(a.amountPaise) || 0);
        if (sortBy === 'amount_asc') return (Number(a.amountPaise) || 0) - (Number(b.amountPaise) || 0);
        return 0;
      });
  }, [payments, activePrimaryTab, failedOnlyFilter, methodFilter, refundFilter, searchQuery, sortBy]);

  // Handlers for API actions
  const handleUpdateStatus = async () => {
    if (!selectedPayment || !newStatusSelection) return;
    setIsUpdatingStatus(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/operations/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'update_payment_status',
          paymentId: selectedPayment.id,
          newStatus: newStatusSelection,
          reason: statusChangeReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({ type: 'success', message: `Status updated to ${newStatusSelection}` });
        setSelectedPayment({
          ...selectedPayment,
          status: data.payment.status,
          notes: data.payment.notes,
        });
        await onRefreshData();
      } else {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to update status' });
      }
    } catch (err: unknown) {
      setActionFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedPayment || !newNoteText.trim()) return;
    setIsAddingNote(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/operations/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'add_payment_note',
          paymentId: selectedPayment.id,
          note: newNoteText,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({ type: 'success', message: 'Internal note saved securely' });
        setSelectedPayment({
          ...selectedPayment,
          notes: data.payment.notes,
        });
        setNewNoteText('');
        await onRefreshData();
      } else {
        setActionFeedback({ type: 'error', message: data.error || 'Failed to add note' });
      }
    } catch (err: unknown) {
      setActionFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Top Header & Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={22} style={{ color: currentTheme.primary }} />
            Billing & Payment Transactions
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Card-based treasury management, invoice settlements, milestone reconciliation, and refund tracking.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onRefreshData()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#334155',
            }}
          >
            <RefreshCw size={14} /> Refresh Records
          </button>
          <a
            href="/api/operations/reports?type=financial&format=csv"
            download
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: currentTheme.primary,
              color: '#ffffff',
              borderRadius: '6px',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Download size={14} /> Export Financial CSV
          </a>
        </div>
      </div>

      {/* ── Section: Visual KPI Cards Grid (Clickable to Filter) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
        }}
      >
        {/* KPI 1: Total Received */}
        <div
          onClick={() => {
            setActivePrimaryTab('completed');
            setFailedOnlyFilter(false);
          }}
          style={{
            backgroundColor: '#ffffff',
            border: activePrimaryTab === 'completed' && !failedOnlyFilter ? `2px solid ${currentTheme.primary}` : '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Payments Received</span>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(5, 150, 105, 0.1)', color: '#059669' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
            {formatINR(kpis.completedAmountPaise)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {kpis.completedCount} confirmed transactions
          </div>
        </div>

        {/* KPI 2: Pending Payments */}
        <div
          onClick={() => {
            setActivePrimaryTab('pending');
            setFailedOnlyFilter(false);
          }}
          style={{
            backgroundColor: '#ffffff',
            border: activePrimaryTab === 'pending' && !failedOnlyFilter ? `2px solid ${currentTheme.primary}` : '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Pending Volume</span>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(217, 119, 6, 0.1)', color: '#d97706' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706', fontFamily: 'monospace' }}>
            {formatINR(kpis.pendingAmountPaise)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {kpis.pendingCount} awaiting reconciliation
          </div>
        </div>

        {/* KPI 3: Total Outstanding Invoices */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Outstanding Balance</span>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444', fontFamily: 'monospace' }}>
            {formatINR(kpis.totalOutstandingPaise)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Total uncollected B2B receivables
          </div>
        </div>

        {/* KPI 4: Cancelled Attempts */}
        <div
          onClick={() => {
            setActivePrimaryTab('cancelled');
            setFailedOnlyFilter(false);
          }}
          style={{
            backgroundColor: '#ffffff',
            border: activePrimaryTab === 'cancelled' ? `2px solid ${currentTheme.primary}` : '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Cancelled / Voided</span>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#64748b' }}>
              <Ban size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#334155' }}>
            {kpis.cancelledCount}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Voided payment attempts
          </div>
        </div>

        {/* KPI 5: Refunds Status */}
        <div
          onClick={() => {
            setRefundFilter(refundFilter === 'pending' ? 'all' : 'pending');
          }}
          style={{
            backgroundColor: '#ffffff',
            border: refundFilter !== 'all' ? `2px solid ${currentTheme.primary}` : '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Refunds Tracked</span>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <RotateCcw size={16} />
            </div>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            {kpis.refundsPendingCount} Pending <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>/ {kpis.refundsCompletedCount} Done</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Linked to order cancellations
          </div>
        </div>
      </div>

      {/* ── Section: Primary Three Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '2px' }}>
        <button
          onClick={() => {
            setActivePrimaryTab('completed');
            setFailedOnlyFilter(false);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            backgroundColor: 'transparent',
            color: activePrimaryTab === 'completed' ? currentTheme.primary : '#64748b',
            borderBottom: activePrimaryTab === 'completed' ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
            marginBottom: '-2px',
          }}
        >
          <CheckCircle2 size={16} />
          Completed ({kpis.completedCount})
        </button>

        <button
          onClick={() => {
            setActivePrimaryTab('pending');
            setFailedOnlyFilter(false);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            backgroundColor: 'transparent',
            color: activePrimaryTab === 'pending' ? currentTheme.primary : '#64748b',
            borderBottom: activePrimaryTab === 'pending' ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
            marginBottom: '-2px',
          }}
        >
          <Clock size={16} />
          Pending ({kpis.pendingCount + kpis.failedCount})
        </button>

        <button
          onClick={() => {
            setActivePrimaryTab('cancelled');
            setFailedOnlyFilter(false);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            backgroundColor: 'transparent',
            color: activePrimaryTab === 'cancelled' ? currentTheme.primary : '#64748b',
            borderBottom: activePrimaryTab === 'cancelled' ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
            marginBottom: '-2px',
          }}
        >
          <Ban size={16} />
          Cancelled ({kpis.cancelledCount})
        </button>
      </div>

      {/* ── Section: Search & Filters Toolbar ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '14px 18px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} style={{ color: '#94a3b8', position: 'absolute', left: '10px' }} />
          <input
            type="text"
            placeholder="Search by Ref ID, UTR, Invoice #, Order #, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 34px',
              fontSize: '13px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              outline: 'none',
            }}
          />
        </div>

        {/* Payment Method Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Method:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              fontSize: '12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              backgroundColor: '#fff',
              color: '#334155',
            }}
          >
            <option value="all">All Methods</option>
            <option value="bank_neft">Bank NEFT / RTGS</option>
            <option value="upi">UPI / QR</option>
            <option value="card">Card Payment</option>
            <option value="cheque">Cheque</option>
            <option value="cash">Cash Settlement</option>
          </select>
        </div>

        {/* Failed Only Filter (In Pending Tab) */}
        {activePrimaryTab === 'pending' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#e11d48', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={failedOnlyFilter}
              onChange={(e) => setFailedOnlyFilter(e.target.checked)}
            />
            Show Failed Attention ({kpis.failedCount})
          </label>
        )}

        {/* Refund Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Refund:</span>
          <select
            value={refundFilter}
            onChange={(e) => setRefundFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              fontSize: '12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              backgroundColor: '#fff',
              color: '#334155',
            }}
          >
            <option value="all">All Transactions</option>
            <option value="pending">Refund Pending</option>
            <option value="completed">Refund Settled</option>
          </select>
        </div>

        {/* Sort By */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '7px 10px',
              fontSize: '12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              backgroundColor: '#fff',
              color: '#334155',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* ── Section: Payment Cards Grid (NO TABLES) ── */}
      {filteredPayments.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <CreditCard size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            No payment transactions match this view
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0' }}>
            No records found for active filters in the <strong>{activePrimaryTab}</strong> tab.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredPayments.map((p) => {
            const normStatus = normalizeStatus(p.status);
            const isCompleted = normStatus === 'completed';
            const isPending = normStatus === 'pending';
            const isFailed = normStatus === 'failed';
            const isCancelled = normStatus === 'cancelled';

            const statusBg = isCompleted
              ? 'rgba(5,150,105,0.08)'
              : isPending
              ? 'rgba(217,119,6,0.08)'
              : isFailed
              ? 'rgba(225,29,72,0.08)'
              : 'rgba(100,116,139,0.08)';

            const statusColor = isCompleted
              ? '#059669'
              : isPending
              ? '#d97706'
              : isFailed
              ? '#e11d48'
              : '#64748b';

            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                }}
              >
                <div>
                  {/* Card Header: Ref & Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: currentTheme.primary }}>
                        {p.transactionReference || p.id}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        ID: {p.id}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: statusBg,
                        color: statusColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {normStatus}
                    </span>
                  </div>

                  {/* Amount Display */}
                  <div style={{ marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                      {formatINR(p.amountPaise)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} /> {formatDate(p.createdAt)}
                    </div>
                  </div>

                  {/* Customer & Document Association */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Customer:</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{p.customerName || 'Direct B2B Client'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Invoice #:</span>
                      <span style={{ fontWeight: 600, color: currentTheme.primary, fontFamily: 'monospace' }}>
                        {p.invoiceNumber || '—'}
                      </span>
                    </div>
                    {p.orderNumber && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Order #:</span>
                        <span style={{ fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>
                          {p.orderNumber}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Method:</span>
                      <span style={{ fontWeight: 500, color: '#334155' }}>
                        {p.paymentMethod ? p.paymentMethod.toUpperCase().replace('_', ' ') : 'Not recorded'}
                      </span>
                    </div>

                    {/* Refund Indicator if applicable */}
                    {p.cancellationInfo?.refundStatus && (
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(99, 102, 241, 0.08)',
                          color: '#4f46e5',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <RotateCcw size={12} />
                        Refund Status: <strong>{p.cancellationInfo.refundStatus}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <button
                    onClick={() => setSelectedPayment(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: '#f8fafc',
                      color: currentTheme.primary,
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Eye size={13} /> View Details
                  </button>

                  {isCompleted && (
                    <button
                      onClick={() => {
                        setSelectedPayment(p);
                        setIsReceiptModalOpen(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Receipt size={13} /> Print Receipt
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Section: Full-Width Payment Detail Drawer ── */}
      {selectedPayment && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '680px',
            backgroundColor: '#ffffff',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              backgroundColor: '#fff',
              zIndex: 10,
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Payment Transaction Details
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', color: '#0f172a', fontFamily: 'monospace' }}>
                {selectedPayment.transactionReference || selectedPayment.id}
              </h2>
            </div>
            <button
              onClick={() => {
                setSelectedPayment(null);
                setActionFeedback(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '6px',
                borderRadius: '6px',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Feedback Alert */}
          {actionFeedback && (
            <div
              style={{
                margin: '16px 24px 0',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: actionFeedback.type === 'success' ? '#ecfdf5' : '#fff1f2',
                color: actionFeedback.type === 'success' ? '#065f46' : '#9f1239',
                border: `1px solid ${actionFeedback.type === 'success' ? '#a7f3d0' : '#fecdd3'}`,
              }}
            >
              {actionFeedback.message}
            </div>
          )}

          {/* Drawer Body */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Section A: Payment Summary */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
                Section A: Payment Summary
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Amount Settled:</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                    {formatINR(selectedPayment.amountPaise)}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Payment Status:</span>
                  <div style={{ fontWeight: 700, color: normalizeStatus(selectedPayment.status) === 'completed' ? '#059669' : '#d97706', textTransform: 'uppercase' }}>
                    {normalizeStatus(selectedPayment.status)}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Currency:</span>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>INR (Indian Rupee, Paise Precision)</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Recorded Timestamp:</span>
                  <div style={{ fontWeight: 500, color: '#1e293b' }}>{formatDate(selectedPayment.createdAt)}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Recorded By:</span>
                  <div style={{ fontWeight: 500, color: '#1e293b' }}>{selectedPayment.recordedBy || 'Finance Desk'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Method:</span>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{selectedPayment.paymentMethod.toUpperCase()}</div>
                </div>
              </div>
            </div>

            {/* Section B: Customer Details */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
                Section B: Customer Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Customer Name:</span>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedPayment.customerName || 'Direct B2B Client'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Email:</span>
                  <div style={{ fontWeight: 500, color: '#1e293b' }}>{selectedPayment.customerEmail || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Phone:</span>
                  <div style={{ fontWeight: 500, color: '#1e293b' }}>{selectedPayment.customerPhone || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Tax GSTIN:</span>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>
                    {selectedPayment.billingAddress?.gstin || 'Unregistered / B2C'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section C: Invoice & Order Linkage */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
                Section C: Invoice & Order Reconciliation
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Invoice Reference:</span>
                  <div style={{ fontWeight: 700, color: currentTheme.primary, fontFamily: 'monospace' }}>
                    {selectedPayment.invoiceNumber || selectedPayment.invoiceId}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Invoice Status:</span>
                  <div style={{ fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>
                    {selectedPayment.invoiceStatus || '—'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Total Invoice Amount:</span>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>
                    {formatINR(selectedPayment.invoiceTotalPaise)}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Remaining Balance Due:</span>
                  <div style={{ fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>
                    {formatINR(selectedPayment.invoiceBalanceDuePaise)}
                  </div>
                </div>
                {selectedPayment.orderNumber && (
                  <div>
                    <span style={{ color: '#64748b' }}>Linked Order:</span>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>
                      {selectedPayment.orderNumber}
                    </div>
                  </div>
                )}
                {selectedPayment.orderStatus && (
                  <div>
                    <span style={{ color: '#64748b' }}>Order Status:</span>
                    <div style={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>
                      {selectedPayment.orderStatus}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                {onNavigateToInvoice && selectedPayment.invoiceId && (
                  <button
                    onClick={() => onNavigateToInvoice(selectedPayment.invoiceId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                      color: currentTheme.primary,
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <ExternalLink size={13} /> Open Invoice Page
                  </button>
                )}
                {onNavigateToOrder && selectedPayment.orderId && (
                  <button
                    onClick={() => onNavigateToOrder(selectedPayment.orderId!)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Package size={13} /> Open Order Drawer
                  </button>
                )}
                {normalizeStatus(selectedPayment.status) === 'completed' && (
                  <button
                    onClick={() => setIsReceiptModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Receipt size={13} /> Print Receipt Voucher
                  </button>
                )}
              </div>
            </div>

            {/* Section D: Gateway & Payment Method Details */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
                Section D: Payment Method & Gateway Info
              </div>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Payment Method: </span>
                  <strong>{selectedPayment.paymentMethod.toUpperCase()}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Bank Reference / UTR Number: </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>
                    {selectedPayment.transactionReference || 'Not recorded'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Security Clearance: </span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>Zero sensitive card numbers or credentials stored</span>
                </div>
              </div>
            </div>

            {/* Section E: Transaction Timeline */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase' }}>
                Section E: Transaction Timeline
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingLeft: '18px' }}>
                {/* Vertical line */}
                <div style={{ position: 'absolute', left: '6px', top: '4px', bottom: '4px', width: '2px', backgroundColor: '#e2e8f0' }} />

                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-18px', top: '3px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Payment Recorded in Ledger</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{formatDate(selectedPayment.createdAt)} by {selectedPayment.recordedBy || 'Finance Desk'}</div>
                </div>

                {selectedPayment.cancellationInfo && (
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-18px', top: '3px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}>Order Cancellation / Refund Event</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {formatDate(selectedPayment.cancellationInfo.createdAt)} — Reason: {selectedPayment.cancellationInfo.reasonCategory}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section F: Refunds, Reversals & Adjustments */}
            {selectedPayment.cancellationInfo ? (
              <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#4338ca', marginBottom: '10px', textTransform: 'uppercase' }}>
                  Section F: Associated Refund & Reversal
                </div>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Cancellation ID: </span>
                    <strong style={{ fontFamily: 'monospace' }}>{selectedPayment.cancellationInfo.id}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Refund Status: </span>
                    <strong style={{ color: '#4338ca' }}>{selectedPayment.cancellationInfo.refundStatus}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Explanation: </span>
                    <span>{selectedPayment.cancellationInfo.reasonExplanation || selectedPayment.cancellationInfo.reasonCategory}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
                Section F: No refund or reversal recorded for this transaction.
              </div>
            )}

            {/* Section G: Internal Notes & Audit Trail */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={13} /> Section G: Authorized Audit Trail & Internal Notes
              </div>
              {selectedPayment.notes ? (
                <pre
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    color: '#334155',
                    maxHeight: '160px',
                    overflowY: 'auto',
                  }}
                >
                  {selectedPayment.notes}
                </pre>
              ) : (
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px' }}>No internal notes recorded yet.</p>
              )}

              {/* Add Note Form */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Add confidential operational note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={isAddingNote || !newNoteText.trim()}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: currentTheme.primary,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {isAddingNote ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </div>

            {/* Permitted Status Actions */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                Authorized Status Transitions
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={newStatusSelection}
                  onChange={(e) => setNewStatusSelection(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                  }}
                >
                  <option value="">Select Permitted Transition...</option>
                  <option value="pending">Mark as Pending Reconciliation</option>
                  <option value="success">Mark as Success / Completed</option>
                  <option value="failed">Mark as Failed</option>
                </select>

                <input
                  type="text"
                  placeholder="Audit reason (required)..."
                  value={statusChangeReason}
                  onChange={(e) => setStatusChangeReason(e.target.value)}
                  style={{
                    flex: '1 1 180px',
                    padding: '7px 10px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                  }}
                />

                <button
                  onClick={handleUpdateStatus}
                  disabled={isUpdatingStatus || !newStatusSelection}
                  style={{
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {isUpdatingStatus ? 'Updating...' : 'Apply Transition'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section: Print-Friendly Payment Receipt Modal ── */}
      {isReceiptModalOpen && selectedPayment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              maxWidth: '560px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  KITCHEN BOTS MACHINERY
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Commercial Kitchen Automation & Food Machinery
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                  Payment Receipt
                </span>
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                  Ref: {selectedPayment.transactionReference || selectedPayment.id}
                </div>
              </div>
            </div>

            {/* Receipt Body */}
            <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Received From:</span>
                <strong>{selectedPayment.customerName || 'Direct B2B Client'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Invoice Settled:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedPayment.invoiceNumber || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Method:</span>
                <span>{selectedPayment.paymentMethod.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Date & Time:</span>
                <span>{formatDate(selectedPayment.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Amount Paid:</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#059669', fontFamily: 'monospace' }}>
                  {formatINR(selectedPayment.amountPaise)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Remaining Invoice Balance:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#ef4444' }}>
                  {formatINR(selectedPayment.invoiceBalanceDuePaise)}
                </span>
              </div>
            </div>

            {/* Notice */}
            <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', borderTop: '1px solid #f1f5f9', paddingTop: '10px', textAlign: 'center' }}>
              * This is an official electronic payment acknowledgment receipt. Not a tax invoice.
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: currentTheme.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <Printer size={14} /> Print / Save PDF
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
