import React, { useState } from 'react';
import {
  Users,
  Building2,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle2,
  Package,
  FileText,
  CreditCard,
  MessageSquare,
  Shield,
  Send,
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';
import type { CustomerSummary, CustomerRequest } from '@kitchen-bots/types';

interface CrmWorkspaceProps {
  currentTheme: {
    primary: string;
    [key: string]: any;
  };
  metrics: {
    totalCustomers: number;
    individualCustomers: number;
    wholesaleCustomers: number;
    returningCustomers: number;
    totalRevenuePaise: number;
    outstandingPaise: number;
    pendingRequests: number;
    newCustomers: number;
  };
  customers: CustomerSummary[];
  filteredCustomers: CustomerSummary[];
  requests: CustomerRequest[];
  activeSubTab: 'individual' | 'wholesale' | 'recurring' | 'requests';
  setActiveSubTab: (tab: 'individual' | 'wholesale' | 'recurring' | 'requests') => void;
  periodFilter: 'all' | '30' | '90' | '180';
  setPeriodFilter: (p: 'all' | '30' | '90' | '180') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCustomer: CustomerSummary | null;
  setSelectedCustomer: (c: CustomerSummary | null) => void;
  customerDetail: any | null;
  detailLoading: boolean;
  detailTab: 'overview' | 'orders' | 'invoices' | 'addresses' | 'requests' | 'quotes' | 'timeline' | 'notes';
  setDetailTab: (t: 'overview' | 'orders' | 'invoices' | 'addresses' | 'requests' | 'quotes' | 'timeline' | 'notes') => void;
  onSelectCustomer: (c: CustomerSummary) => void;
  onCrmAction: (action: 'add_note' | 'add_followup' | 'update_classification', payload: any) => Promise<boolean>;
  onUpdateRequestStatus?: (requestId: string | number, newStatus: string) => Promise<boolean>;
  formatRupees: (paise?: number) => string;
}

export const CrmWorkspace: React.FC<CrmWorkspaceProps> = ({
  currentTheme,
  metrics,
  customers,
  filteredCustomers,
  requests,
  activeSubTab,
  setActiveSubTab,
  periodFilter,
  setPeriodFilter,
  searchQuery,
  setSearchQuery,
  selectedCustomer,
  setSelectedCustomer,
  customerDetail,
  detailLoading,
  detailTab,
  setDetailTab,
  onSelectCustomer,
  onCrmAction,
  onUpdateRequestStatus,
  formatRupees,
}) => {
  const [noteContent, setNoteContent] = useState('');
  const [followupTask, setFollowupTask] = useState('');
  const [followupDueDate, setFollowupDueDate] = useState('');
  const [requestFilterCategory, setRequestFilterCategory] = useState('ALL');
  const [requestFilterStatus, setRequestFilterStatus] = useState('ALL');
  const [updatingRequestId, setUpdatingRequestId] = useState<string | number | null>(null);
  const [isReclassifying, setIsReclassifying] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [convertingQuoteId, setConvertingQuoteId] = useState<string | number | null>(null);

  const kpis = [
    { id: 'total', label: 'Total Customers', value: metrics.totalCustomers, sub: 'Unified accounts', tab: 'individual' as const, icon: Users, color: '#3b82f6' },
    { id: 'individual', label: 'Individual Customers', value: metrics.individualCustomers, sub: 'Direct personal buyers', tab: 'individual' as const, icon: UserPlus, color: '#059669' },
    { id: 'wholesale', label: 'Wholesale Customers', value: metrics.wholesaleCustomers, sub: 'B2B & machinery accounts', tab: 'wholesale' as const, icon: Building2, color: '#8b5cf6' },
    { id: 'returning', label: 'Returning Customers', value: metrics.returningCustomers, sub: '≥2 qualifying orders', tab: 'recurring' as const, icon: TrendingUp, color: '#d97706' },
    { id: 'revenue', label: 'Customer Revenue', value: formatRupees(metrics.totalRevenuePaise), sub: 'Non-cancelled orders', tab: 'individual' as const, icon: DollarSign, color: '#059669' },
    { id: 'outstanding', label: 'Outstanding Payments', value: formatRupees(metrics.outstandingPaise), sub: 'Payable balance', tab: 'wholesale' as const, icon: AlertCircle, color: '#dc2626' },
    { id: 'requests', label: 'Pending Requests', value: metrics.pendingRequests, sub: 'Awaiting resolution', tab: 'requests' as const, icon: MessageSquare, color: '#ea580c' },
    { id: 'new', label: 'New Customers', value: metrics.newCustomers, sub: `In selected period (${periodFilter})`, tab: 'individual' as const, icon: Clock, color: '#0284c7' },
  ];

  const filteredRequestsList = requests.filter((r) => {
    if (requestFilterCategory !== 'ALL' && r.category !== requestFilterCategory) return false;
    if (requestFilterStatus !== 'ALL' && r.status !== requestFilterStatus) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      {feedbackToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: '#059669',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span>
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ── CRM KPI Section ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              onClick={() => {
                setSelectedCustomer(null);
                setActiveSubTab(kpi.tab);
              }}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = currentTheme.primary;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {kpi.label}
                </span>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={kpi.color} />
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{kpi.value}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Customer Details Dedicated View ── */}
      {selectedCustomer ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Breadcrumb / Back button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => setSelectedCustomer(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: currentTheme.primary,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              ← Back to Customer Directory
            </button>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Customer Record: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, color: '#0f172a' }}>{selectedCustomer.customerCode || selectedCustomer.id}</code>
            </div>
          </div>

          {/* Profile Header Card */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: selectedCustomer.customerType === 'wholesale' ? '#8b5cf615' : `${currentTheme.primary}15`,
                    color: selectedCustomer.customerType === 'wholesale' ? '#8b5cf6' : currentTheme.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                    border: `1px solid ${selectedCustomer.customerType === 'wholesale' ? '#8b5cf630' : `${currentTheme.primary}30`}`,
                  }}
                >
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{selectedCustomer.name}</h2>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: selectedCustomer.customerType === 'wholesale' ? '#8b5cf615' : '#05966915',
                        color: selectedCustomer.customerType === 'wholesale' ? '#8b5cf6' : '#059669',
                        textTransform: 'uppercase',
                      }}
                    >
                      {selectedCustomer.customerType}
                    </span>
                    {selectedCustomer.isReturning && (
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#d9770615', color: '#d97706' }}>
                        Returning Buyer
                      </span>
                    )}
                  </div>
                  {selectedCustomer.companyName && (
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                      <Building2 size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                      {selectedCustomer.companyName}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                    {selectedCustomer.email && (
                      <a href={`mailto:${selectedCustomer.email}`} style={{ color: currentTheme.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={13} /> {selectedCustomer.email}
                      </a>
                    )}
                    {selectedCustomer.phone && (
                      <a href={`tel:${selectedCustomer.phone}`} style={{ color: currentTheme.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={13} /> {selectedCustomer.phone}
                      </a>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} /> Customer since {selectedCustomer.customerSince ? new Date(selectedCustomer.customerSince).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header metrics */}
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px 18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Lifetime Spend</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>{formatRupees(selectedCustomer.totalSpentPaise)}</div>
                </div>
                <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0' }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Completed Orders</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{selectedCustomer.completedOrders}</div>
                </div>
                <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0' }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Outstanding</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: selectedCustomer.outstandingPaise > 0 ? '#dc2626' : '#64748b' }}>
                    {formatRupees(selectedCustomer.outstandingPaise)}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <button
                disabled={isReclassifying}
                onClick={async () => {
                  const newType = selectedCustomer.customerType === 'wholesale' ? 'individual' : 'wholesale';
                  const confirmed = confirm(`Switch customer classification to ${newType}?`);
                  if (confirmed) {
                    setIsReclassifying(true);
                    try {
                      const success = await onCrmAction('update_classification', { email: selectedCustomer.email, customerType: newType });
                      if (success) {
                        setFeedbackToast(`Customer successfully reclassified as ${newType}.`);
                        setTimeout(() => setFeedbackToast(null), 3000);
                      } else {
                        alert('Failed to update classification on server. Please try again.');
                      }
                    } catch (err) {
                      console.error('Reclassification error', err);
                      alert('Network or server error during reclassification.');
                    } finally {
                      setIsReclassifying(false);
                    }
                  }
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isReclassifying ? '#94a3b8' : '#334155',
                  cursor: isReclassifying ? 'not-allowed' : 'pointer',
                  opacity: isReclassifying ? 0.7 : 1,
                }}
              >
                {isReclassifying
                  ? 'Updating...'
                  : `Reclassify as ${selectedCustomer.customerType === 'wholesale' ? 'Individual' : 'Wholesale'}`}
              </button>
              <a
                href={`/admin/collections/orders/create?customerEmail=${encodeURIComponent(selectedCustomer.email)}`}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentTheme.primary,
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                + Create Order
              </a>
              <a
                href={`/admin/collections/quotes/create?customerEmail=${encodeURIComponent(selectedCustomer.email)}`}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  textDecoration: 'none',
                }}
              >
                + Create Quote
              </a>
              <button
                onClick={() => setDetailTab('notes')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                + Add Note
              </button>
            </div>
          </div>

          {/* 8 Detail Tabs */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e2e8f0', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'orders', label: `Orders (${customerDetail?.orders?.length || selectedCustomer.completedOrders})` },
              { id: 'invoices', label: `Payments & Invoices (${customerDetail?.invoices?.length || 0})` },
              { id: 'addresses', label: 'Addresses & Business' },
              { id: 'requests', label: `Requests (${customerDetail?.enquiries?.length || 0})` },
              { id: 'quotes', label: `Quotes (${customerDetail?.quotes?.length || 0})` },
              { id: 'timeline', label: `Activity Timeline (${customerDetail?.timeline?.length || 0})` },
              { id: 'notes', label: `Internal Notes (${customerDetail?.notes?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id as any)}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: detailTab === tab.id ? 700 : 500,
                  color: detailTab === tab.id ? currentTheme.primary : '#64748b',
                  backgroundColor: detailTab === tab.id ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderBottom: detailTab === tab.id ? `2px solid ${currentTheme.primary}` : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Detail Tab Content */}
          {detailLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading customer dossier...</div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
              {/* Tab 1: Overview */}
              {detailTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Account Snapshot</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Account Type</span>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedCustomer.customerType}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Account Status</span>
                        <span style={{ fontWeight: 600, color: '#059669', textTransform: 'capitalize' }}>{selectedCustomer.accountStatus}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Latest Order Status</span>
                        <span style={{ fontWeight: 600 }}>{selectedCustomer.latestOrderStatus || 'None'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Latest Order Date</span>
                        <span>{selectedCustomer.latestOrderDate ? new Date(selectedCustomer.latestOrderDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                        <span style={{ color: '#64748b' }}>Days Since Last Order</span>
                        <span>{selectedCustomer.lastPurchaseDaysAgo ?? 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Active Alerts & Follow-ups</h3>
                    {(customerDetail?.followups || []).length === 0 ? (
                      <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '6px', color: '#64748b', fontSize: '12px' }}>
                        No pending follow-ups. Customer account is in good standing.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {customerDetail.followups.map((f: any) => (
                          <div key={f.id} style={{ padding: '10px 12px', border: '1px solid #fed7aa', backgroundColor: '#fff7ed', borderRadius: '6px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#9a3412' }}>{f.task}</div>
                            <div style={{ fontSize: '11px', color: '#c2410c', marginTop: '2px' }}>Due: {f.due_date ? new Date(f.due_date).toLocaleDateString() : 'No date'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Orders */}
              {detailTab === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {(customerDetail?.orders || []).length === 0 ? (
                    <div style={{ padding: '36px 20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px' }}>
                      No orders found for this customer record.
                    </div>
                  ) : (
                    customerDetail.orders.map((ord: any) => {
                      const isCancelled = ord.status === 'cancelled';
                      const isDelivered = ord.status === 'delivered';
                      const isPaid = ord.payment_status === 'paid';
                      return (
                        <div
                          key={ord.id}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '18px 20px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                                #{ord.order_number || ord.id}
                              </span>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                Placed on {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                  backgroundColor: isDelivered ? '#ecfdf5' : isCancelled ? '#fef2f2' : '#eff6ff',
                                  color: isDelivered ? '#059669' : isCancelled ? '#dc2626' : '#2563eb',
                                  border: `1px solid ${isDelivered ? '#a7f3d0' : isCancelled ? '#fecaca' : '#bfdbfe'}`,
                                }}
                              >
                                {ord.status}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                  backgroundColor: isPaid ? '#ecfdf5' : '#fffbeb',
                                  color: isPaid ? '#059669' : '#d97706',
                                  border: `1px solid ${isPaid ? '#a7f3d0' : '#fde68a'}`,
                                }}
                              >
                                {ord.payment_status || 'UNPAID'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Value</div>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                                {formatRupees(ord.total_paise)}
                              </div>
                            </div>
                            {ord.notes && (
                              <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <em>{ord.notes}</em>
                              </div>
                            )}
                            <div>
                              <a
                                href={`/admin?tab=orders&search=${encodeURIComponent(ord.order_number || ord.id)}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: currentTheme.primary,
                                  textDecoration: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                }}
                              >
                                View Order Details →
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 3: Payments & Invoices */}
              {detailTab === 'invoices' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(customerDetail?.invoices || []).length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No invoice or transaction records recorded for this customer.</div>
                  ) : (
                    customerDetail.invoices.map((inv: any) => (
                      <div key={inv.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>Invoice #{inv.invoice_number}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Date: {new Date(inv.created_at).toLocaleDateString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{formatRupees(inv.total_paise)}</div>
                          <div style={{ fontSize: '11px', color: inv.balance_due_paise > 0 ? '#dc2626' : '#059669' }}>
                            Balance Due: {formatRupees(inv.balance_due_paise)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Addresses & Business Details */}
              {detailTab === 'addresses' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#0f172a' }}>Business Profile</h4>
                    <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div><strong style={{ color: '#64748b' }}>Company Legal Name:</strong> {selectedCustomer.companyName || 'Not specified'}</div>
                      <div><strong style={{ color: '#64748b' }}>GSTIN / Tax ID:</strong> {customerDetail?.user?.gstin || 'Unregistered / Direct Buyer'}</div>
                      <div><strong style={{ color: '#64748b' }}>Primary Contact:</strong> {selectedCustomer.name}</div>
                      <div><strong style={{ color: '#64748b' }}>Email:</strong> {selectedCustomer.email}</div>
                      <div><strong style={{ color: '#64748b' }}>Phone:</strong> {selectedCustomer.phone || 'N/A'}</div>
                    </div>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#0f172a' }}>Delivery & Shipping Details</h4>
                    <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', color: '#334155' }}>
                      {customerDetail?.orders?.[0]?.shipping_address ? (
                        <div>
                          <div>{customerDetail.orders[0].shipping_address.addressLine1}</div>
                          <div>{customerDetail.orders[0].shipping_address.city}, {customerDetail.orders[0].shipping_address.state} - {customerDetail.orders[0].shipping_address.postalCode}</div>
                        </div>
                      ) : (
                        <div style={{ color: '#64748b' }}>Standard direct delivery to client location recorded upon dispatch.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Requests & Support */}
              {detailTab === 'requests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(customerDetail?.enquiries || []).length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No support requests or client enquiries logged.</div>
                  ) : (
                    customerDetail.enquiries.map((enq: any) => (
                      <div key={enq.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{enq.subject || enq.message || 'Support Request'}</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e2e8f0' }}>{enq.status}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Logged on {new Date(enq.created_at).toLocaleDateString()}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 6: Quotes & Commercial History */}
              {detailTab === 'quotes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(customerDetail?.quotes || []).length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No formal commercial quotes issued for this customer.</div>
                  ) : (
                    customerDetail.quotes.map((q: any) => (
                      <div key={q.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>Quote #{q.quote_number || q.id.slice(0, 8)}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Issued: {new Date(q.created_at).toLocaleDateString()}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: q.status === 'accepted' ? '#ecfdf5' : '#f1f5f9', color: q.status === 'accepted' ? '#059669' : '#334155' }}>
                            {q.status.toUpperCase()}
                          </span>
                          {q.status !== 'accepted' && q.status !== 'rejected' && q.status !== 'expired' && (
                            <button
                              type="button"
                              disabled={convertingQuoteId === q.id}
                              onClick={async () => {
                                if (!confirm(`Convert Quote #${q.quote_number || q.id} to a confirmed Commercial Order?`)) return;
                                setConvertingQuoteId(q.id);
                                try {
                                  const res = await fetch('/api/operations/crm/convert-quote', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({
                                      quoteId: Number(q.id),
                                      shippingAddress: customerDetail?.orders?.[0]?.shipping_address || {},
                                    }),
                                  });

                                  if (res.ok) {
                                    const data = await res.json();
                                    setFeedbackToast(`Quote converted successfully! Order #${data.order?.order_number || ''} created.`);
                                    q.status = 'accepted';
                                    if (onSelectCustomer && selectedCustomer) {
                                      await onSelectCustomer(selectedCustomer);
                                    }
                                  } else {
                                    const err = await res.json();
                                    alert(`Failed to convert quote: ${err.error || 'Server error'}`);
                                  }
                                } catch (e: any) {
                                  alert(`Conversion error: ${e.message}`);
                                } finally {
                                  setConvertingQuoteId(null);
                                }
                              }}
                              style={{
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: convertingQuoteId === q.id ? '#94a3b8' : currentTheme.primary,
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: convertingQuoteId === q.id ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {convertingQuoteId === q.id ? 'Converting...' : 'Convert to Order →'}
                            </button>
                          )}
                          <a href={`/admin/collections/quotes/${q.id}`} style={{ fontSize: '12px', color: currentTheme.primary, textDecoration: 'none' }}>
                            View Quote →
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 7: Activity Timeline */}
              {detailTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(customerDetail?.timeline || []).length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No historical events recorded yet.</div>
                  ) : (
                    customerDetail.timeline.map((event: any) => (
                      <div key={event.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentTheme.primary, marginTop: '6px' }} />
                        <div style={{ flex: 1, borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{event.title}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{event.description}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 8: Notes & Follow-ups */}
              {detailTab === 'notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Add Note Form */}
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#0f172a' }}>Log Internal Note</h4>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Add an internal staff note about this client or order preference..."
                      style={{ width: '100%', height: '70px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginBottom: '8px' }}
                    />
                    <button
                      onClick={async () => {
                        if (!noteContent.trim()) return;
                        await onCrmAction('add_note', { email: selectedCustomer.email, content: noteContent });
                        setNoteContent('');
                      }}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: currentTheme.primary,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Save Note
                    </button>
                  </div>

                  {/* List of Notes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(customerDetail?.notes || []).length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: '12px' }}>No internal notes saved yet.</div>
                    ) : (
                      customerDetail.notes.map((n: any) => (
                        <div key={n.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', backgroundColor: '#ffffff' }}>
                          <div style={{ fontSize: '12px', color: '#0f172a' }}>{n.content}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                            By {n.author_name} • {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── Main Customer Directory View ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tab Navigation & Search Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            {/* Primary Customer Segment Tabs */}
            <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
              {[
                { id: 'individual', label: `Individual (${metrics.individualCustomers})` },
                { id: 'wholesale', label: `Wholesale (${metrics.wholesaleCustomers})` },
                { id: 'recurring', label: `Returning (${metrics.returningCustomers})` },
                { id: 'requests', label: `Requests (${requests.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: activeSubTab === tab.id ? 700 : 500,
                    color: activeSubTab === tab.id ? '#0f172a' : '#64748b',
                    backgroundColor: activeSubTab === tab.id ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: activeSubTab === tab.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Reporting Period & Search Controls */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                }}
              >
                <option value="all">All Time History</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="180">Last 180 Days</option>
              </select>

              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 32px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    width: '240px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sub-view: Customer Requests Workspace */}
          {activeSubTab === 'requests' ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>Customer Enquiries & Service Requests</h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Track ticket lifecycle, enquiry follow-ups, and field support</div>
                </div>
                {/* Filters */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={requestFilterStatus}
                    onChange={(e) => setRequestFilterStatus(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="new">New</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredRequestsList.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No requests matching the selected filters.</div>
                ) : (
                  filteredRequestsList.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: currentTheme.primary, backgroundColor: `${currentTheme.primary}15`, padding: '2px 6px', borderRadius: '4px' }}>
                            #{req.reference}
                          </span>
                          <span style={{ fontSize: '11px', textTransform: 'capitalize', color: '#64748b', fontWeight: 600 }}>{req.category.replace('_', ' ')}</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: req.priority === 'urgent' ? '#fee2e2' : '#f1f5f9', color: req.priority === 'urgent' ? '#dc2626' : '#475569' }}>
                            {req.priority.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '6px' }}>{req.subject}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{req.description}</div>
                        <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                          <span>Contact: <strong style={{ color: '#475569' }}>{req.customerName}</strong> ({req.customerEmail})</span>
                          <span>Created: {new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Status Lifecycle Updater */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={req.status}
                          disabled={updatingRequestId === req.id}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            const prevStatus = req.status;
                            setUpdatingRequestId(req.id);
                            try {
                              let ok = false;
                              if (onUpdateRequestStatus) {
                                ok = await onUpdateRequestStatus(req.id, newStatus);
                              } else {
                                const res = await fetch('/api/operations/crm/requests', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ requestId: req.id, status: newStatus }),
                                });
                                ok = res.ok;
                              }

                              if (ok) {
                                req.status = newStatus as any;
                                setFeedbackToast(`Request #${req.reference} marked as ${newStatus.toUpperCase()}`);
                                setTimeout(() => setFeedbackToast(null), 3000);
                              } else {
                                req.status = prevStatus;
                                alert('Failed to update status on server. Please try again.');
                              }
                            } catch (err) {
                              req.status = prevStatus;
                              console.error('Request status update failed', err);
                              alert('Error connecting to server to update status.');
                            } finally {
                              setUpdatingRequestId(null);
                            }
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: updatingRequestId === req.id ? '#f1f5f9' : '#ffffff',
                            cursor: updatingRequestId === req.id ? 'wait' : 'pointer',
                          }}
                        >
                          <option value="new">New</option>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="waiting_customer">Waiting on Customer</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                        {updatingRequestId === req.id && (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Saving...</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Sub-view: Customer Card Grid */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredCustomers.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b' }}>
                  No customer records found matching this segment and search criteria.
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCustomer(c)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '18px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = currentTheme.primary;
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)';
                    }}
                  >
                    <div>
                      {/* Top bar with Avatar & Type */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              backgroundColor: c.customerType === 'wholesale' ? '#8b5cf615' : `${currentTheme.primary}15`,
                              color: c.customerType === 'wholesale' ? '#8b5cf6' : currentTheme.primary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: 700,
                            }}
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                            {c.companyName && (
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                <Building2 size={11} style={{ display: 'inline', marginRight: '2px', verticalAlign: '-1px' }} />
                                {c.companyName}
                              </div>
                            )}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: c.customerType === 'wholesale' ? '#8b5cf615' : '#05966915',
                            color: c.customerType === 'wholesale' ? '#8b5cf6' : '#059669',
                            textTransform: 'uppercase',
                          }}
                        >
                          {c.customerType}
                        </span>
                      </div>

                      {/* Contact items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                        {c.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={12} /> {c.email}
                          </div>
                        )}
                        {c.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={12} /> {c.phone}
                          </div>
                        )}
                      </div>

                      {/* Order stats pill */}
                      <div style={{ backgroundColor: '#f8fafc', borderRadius: '6px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Lifetime Spend</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>{formatRupees(c.totalSpentPaise)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Orders</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{c.completedOrders}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Latest Status</div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>{c.latestOrderStatus || 'None'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom action link */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Joined {c.customerSince ? new Date(c.customerSince).toLocaleDateString() : 'N/A'}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: currentTheme.primary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View Profile <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
