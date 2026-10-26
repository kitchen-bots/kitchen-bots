import React, { useState, useMemo } from 'react';
import {
  Inbox,
  PhoneCall,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Building2,
  Calendar,
  ChevronRight,
  UserCheck,
  FileText,
  DollarSign,
  MessageSquare,
  Shield,
  Send,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowRight,
  Package,
  X,
} from 'lucide-react';
import type {
  EnquiryRecord,
  EnquiryMetrics,
  EnquiryStatus,
  EnquirySource,
  EnquiryPriority,
  EnquiryDetailResponse
} from '@kitchen-bots/types';

interface EnquiriesWorkspaceProps {
  currentTheme: {
    primary: string;
    [key: string]: any;
  };
  metrics: EnquiryMetrics;
  enquiries: EnquiryRecord[];
  activeSubTab: 'direct' | 'website';
  setActiveSubTab: (tab: 'direct' | 'website') => void;
  selectedEnquiry: EnquiryRecord | null;
  setSelectedEnquiry: (e: EnquiryRecord | null) => void;
  enquiryDetail: EnquiryDetailResponse | null;
  detailLoading: boolean;
  onSelectEnquiry: (e: EnquiryRecord) => void;
  onRefreshData: () => Promise<void>;
  formatRupees: (paise?: number) => string;
}

export const EnquiriesWorkspace: React.FC<EnquiriesWorkspaceProps> = ({
  currentTheme,
  metrics,
  enquiries,
  activeSubTab,
  setActiveSubTab,
  selectedEnquiry,
  setSelectedEnquiry,
  enquiryDetail,
  detailLoading,
  onSelectEnquiry,
  onRefreshData,
  formatRupees,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [detailTab, setDetailTab] = useState<'overview' | 'contact' | 'requirements' | 'comms' | 'followups' | 'commercial' | 'activity'>('overview');

  // Form states for manual direct enquiry creation
  const [isCreatingDirect, setIsCreatingDirect] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    city: '',
    message: '',
    productOfInterest: '',
    priority: 'normal',
  });

  // Action states for communication & followup
  const [noteContent, setNoteContent] = useState('');
  const [commType, setCommType] = useState<'internal_note' | 'call' | 'email' | 'message'>('internal_note');
  const [commSubject, setCommSubject] = useState('');
  const [followupTask, setFollowupTask] = useState('');
  const [followupDueDate, setFollowupDueDate] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | number | null>(null);
  const [showEmailConfigModal, setShowEmailConfigModal] = useState(false);

  // Status visual badge helper
  const getEnquiryStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case 'new':
        return { label: 'New Lead', bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'under_review':
        return { label: 'Under Review', bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
      case 'contacted':
        return { label: 'Contacted', bg: '#f3e8ff', text: '#7c3aed', border: '#e9d5ff' };
      case 'clarification':
        return { label: 'Clarification', bg: '#fef9c3', text: '#ca8a04', border: '#fef08a' };
      case 'quote_in_progress':
        return { label: 'Quote In Progress', bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' };
      case 'quote_sent':
        return { label: 'Quote Sent', bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'awaiting_response':
        return { label: 'Awaiting Response', bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' };
      case 'converted':
      case 'closed_won':
        return { label: 'Won / Converted', bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'closed_lost':
        return { label: 'Closed (Lost)', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
      case 'spam':
        return { label: 'Spam / Invalid', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default:
        return { label: status, bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
    }
  };

  // KPI cards
  const kpis = [
    { id: 'total', label: 'Total Enquiries', value: metrics.total, sub: 'All recorded leads', icon: Inbox, color: '#3b82f6', filter: 'ALL' },
    { id: 'new', label: 'New / Unreviewed', value: metrics.newEnquiries, sub: 'Pending first review', icon: Clock, color: '#2563eb', filter: 'new' },
    { id: 'awaiting', label: 'Awaiting Response', value: metrics.awaitingResponse, sub: 'Needs client response', icon: AlertCircle, color: '#ea580c', filter: 'awaiting_response' },
    { id: 'in_progress', label: 'In Progress', value: metrics.inProgress, sub: 'Active quote pipeline', icon: TrendingUp, color: '#8b5cf6', filter: 'quote_in_progress' },
    { id: 'converted', label: 'Converted', value: metrics.converted, sub: 'Turned into quote/order', icon: CheckCircle2, color: '#059669', filter: 'converted' },
    { id: 'closed', label: 'Closed', value: metrics.closed, sub: 'Resolved & archived', icon: Shield, color: '#64748b', filter: 'closed_lost' },
    { id: 'overdue', label: 'Overdue Follow-ups', value: metrics.overdueFollowups, sub: 'Tasks requiring action', icon: AlertCircle, color: '#dc2626', filter: 'overdue' },
  ];

  // Filtering enquiries for card grid
  const filteredList = useMemo(() => {
    return enquiries.filter((e) => {
      // 1. Source Tab Filter
      if (e.source !== activeSubTab) return false;

      // 2. Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'overdue') {
          if (!e.nextFollowupDate || new Date(e.nextFollowupDate).getTime() > Date.now()) return false;
        } else if (e.status !== statusFilter) {
          return false;
        }
      }

      // 3. Priority Filter
      if (priorityFilter !== 'ALL' && e.priority !== priorityFilter) return false;

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          (e.phone && e.phone.toLowerCase().includes(q)) ||
          (e.company && e.company.toLowerCase().includes(q)) ||
          e.reference.toLowerCase().includes(q) ||
          e.message.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [enquiries, activeSubTab, statusFilter, priorityFilter, searchQuery]);

  // Action handlers
  const handleCreateDirectEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/operations/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'create_direct', ...createFormData }),
      });
      if (res.ok) {
        setIsCreatingDirect(false);
        setCreateFormData({ name: '', email: '', phone: '', company: '', city: '', message: '', productOfInterest: '', priority: 'normal' });
        await onRefreshData();
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Error creating enquiry: ${err.message}`);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleUpdateStatus = async (enquiryId: string | number, newStatus: EnquiryStatus) => {
    setUpdatingStatusId(enquiryId);
    try {
      const res = await fetch('/api/operations/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'update_status', enquiryId, status: newStatus }),
      });
      if (res.ok) {
        if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
          selectedEnquiry.status = newStatus;
          if (enquiryDetail) enquiryDetail.enquiry.status = newStatus;
        }
        await onRefreshData();
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleAddCommunication = async () => {
    if (!selectedEnquiry || !noteContent.trim()) return;
    try {
      const res = await fetch('/api/operations/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'add_communication',
          enquiryId: selectedEnquiry.id,
          type: commType,
          subject: commSubject || (commType === 'internal_note' ? 'Staff Internal Note' : `${commType.toUpperCase()} Log`),
          content: noteContent,
        }),
      });
      if (res.ok) {
        setNoteContent('');
        setCommSubject('');
        onSelectEnquiry(selectedEnquiry);
      }
    } catch (e) {
      console.error('Failed to add note/comm', e);
    }
  };

  const handleAddFollowup = async () => {
    if (!selectedEnquiry || !followupTask.trim()) return;
    try {
      const res = await fetch('/api/operations/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'add_followup',
          enquiryId: selectedEnquiry.id,
          task: followupTask,
          dueDate: followupDueDate || null,
        }),
      });
      if (res.ok) {
        setFollowupTask('');
        setFollowupDueDate('');
        onSelectEnquiry(selectedEnquiry);
      }
    } catch (e) {
      console.error('Failed to schedule followup', e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── KPI Metric Cards Section ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isActive = statusFilter === kpi.filter;
          return (
            <div
              key={kpi.id}
              onClick={() => {
                setSelectedEnquiry(null);
                setStatusFilter(kpi.filter);
              }}
              style={{
                backgroundColor: '#ffffff',
                border: isActive ? `2px solid ${kpi.color}` : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = currentTheme.primary;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = '#e2e8f0';
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

      {/* ── Main Workspace Navigation & Action Bar ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
        {/* Tab 1: Direct Enquiries & Tab 2: Website Enquiries */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => {
              setSelectedEnquiry(null);
              setActiveSubTab('direct');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeSubTab === 'direct' ? 700 : 500,
              color: activeSubTab === 'direct' ? '#0f172a' : '#64748b',
              backgroundColor: activeSubTab === 'direct' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: activeSubTab === 'direct' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            <PhoneCall size={14} /> Direct Enquiries ({enquiries.filter((e) => e.source === 'direct').length})
          </button>
          <button
            onClick={() => {
              setSelectedEnquiry(null);
              setActiveSubTab('website');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeSubTab === 'website' ? 700 : 500,
              color: activeSubTab === 'website' ? '#0f172a' : '#64748b',
              backgroundColor: activeSubTab === 'website' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: activeSubTab === 'website' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            <Globe size={14} /> Website Enquiries ({enquiries.filter((e) => e.source === 'website').length})
          </button>
          <button
            type="button"
            onClick={() => setShowEmailConfigModal(true)}
            title="Inbound Email Ingestion is unconfigured. Click to view configuration prerequisites and integration guide."
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#475569',
              backgroundColor: '#f1f5f9',
              border: '1px dashed #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Mail size={13} style={{ color: '#64748b' }} />
            <span>Inbound Email: Unconfigured</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: '#e2e8f0',
                color: '#475569',
              }}
            >
              Setup Guide
            </span>
          </button>
        </div>

        {/* Action Controls & New Enquiry Trigger */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search leads, phone, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                width: '240px',
                backgroundColor: '#ffffff',
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              backgroundColor: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="new">New</option>
            <option value="under_review">Under Review</option>
            <option value="contacted">Contacted</option>
            <option value="quote_in_progress">Quote in Progress</option>
            <option value="converted">Converted</option>
            <option value="closed_lost">Closed (Lost)</option>
          </select>

          <button
            onClick={() => setIsCreatingDirect(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: currentTheme.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Plus size={15} /> Log Direct Enquiry
          </button>
        </div>
      </div>

      {/* ── Modal / Form: Create Direct Enquiry ── */}
      {isCreatingDirect && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>Record Direct In-Person / Phone Enquiry</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Log walk-in client specifications, phone discussions, and direct commercial requests.</p>
            </div>
            <button
              onClick={() => setIsCreatingDirect(false)}
              style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}
            >
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleCreateDirectEnquiry} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Client / Contact Name *</label>
              <input
                type="text"
                required
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                placeholder="Full contact name"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Contact Email *</label>
              <input
                type="email"
                required
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                placeholder="client@company.in"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Phone Number</label>
              <input
                type="text"
                value={createFormData.phone}
                onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                placeholder="+91 9876543210"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Company / Restaurant</label>
              <input
                type="text"
                value={createFormData.company}
                onChange={(e) => setCreateFormData({ ...createFormData, company: e.target.value })}
                placeholder="E.g. Grand Palace Hotel"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>City / Location</label>
              <input
                type="text"
                value={createFormData.city}
                onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                placeholder="City, State"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Machinery / Product of Interest</label>
              <input
                type="text"
                value={createFormData.productOfInterest}
                onChange={(e) => setCreateFormData({ ...createFormData, productOfInterest: e.target.value })}
                placeholder="E.g. Heavy Duty Crank BBQ, Rotisserie"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Full Requirements & Discussion Notes *</label>
              <textarea
                required
                rows={3}
                value={createFormData.message}
                onChange={(e) => setCreateFormData({ ...createFormData, message: e.target.value })}
                placeholder="Enter client specifications, intended dimensions, customisation needs, and timelines discussed..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsCreatingDirect(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSubmitting}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  backgroundColor: currentTheme.primary,
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {createSubmitting ? 'Saving...' : 'Save Direct Enquiry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── View 1: Dedicated Enquiry Detail Page ── */}
      {selectedEnquiry ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Back Navigation Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedEnquiry(null)}
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
              ← Back to {activeSubTab === 'direct' ? 'Direct' : 'Website'} Enquiries
            </button>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Reference ID: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, color: '#0f172a' }}>{selectedEnquiry.reference}</code>
            </div>
          </div>

          {/* Header Summary Card */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{selectedEnquiry.name}</h2>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: getEnquiryStatusBadge(selectedEnquiry.status).bg,
                      color: getEnquiryStatusBadge(selectedEnquiry.status).text,
                      border: `1px solid ${getEnquiryStatusBadge(selectedEnquiry.status).border}`,
                    }}
                  >
                    {getEnquiryStatusBadge(selectedEnquiry.status).label}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: selectedEnquiry.source === 'direct' ? '#f3e8ff' : '#eff6ff',
                      color: selectedEnquiry.source === 'direct' ? '#7c3aed' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {selectedEnquiry.source === 'direct' ? <PhoneCall size={11} /> : <Globe size={11} />}
                    {selectedEnquiry.source === 'direct' ? 'Direct Entry' : 'Storefront Form'}
                  </span>
                </div>
                {selectedEnquiry.company && (
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    <Building2 size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                    {selectedEnquiry.company}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                  {selectedEnquiry.email && (
                    <a href={`mailto:${selectedEnquiry.email}`} style={{ color: currentTheme.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={13} /> {selectedEnquiry.email}
                    </a>
                  )}
                  {selectedEnquiry.phone && (
                    <a href={`tel:${selectedEnquiry.phone}`} style={{ color: currentTheme.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={13} /> {selectedEnquiry.phone}
                    </a>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> Received {new Date(selectedEnquiry.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Update Dropdown in Header */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Enquiry Lifecycle</div>
                <select
                  value={selectedEnquiry.status}
                  disabled={updatingStatusId === selectedEnquiry.id}
                  onChange={(e) => handleUpdateStatus(selectedEnquiry.id, e.target.value as EnquiryStatus)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <option value="new">New Lead</option>
                  <option value="under_review">Under Review</option>
                  <option value="contacted">Contacted</option>
                  <option value="clarification">Requirements Clarification</option>
                  <option value="quote_in_progress">Quote in Progress</option>
                  <option value="quote_sent">Quote Sent</option>
                  <option value="awaiting_response">Awaiting Customer Response</option>
                  <option value="converted">Converted (Order/Quote)</option>
                  <option value="closed_won">Closed — Won</option>
                  <option value="closed_lost">Closed — Lost</option>
                  <option value="spam">Spam / Invalid</option>
                </select>
              </div>
            </div>

            {/* Quick Contextual Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <a
                href={`/admin/collections/quotes/create?contactEmail=${encodeURIComponent(selectedEnquiry.email)}&contactName=${encodeURIComponent(selectedEnquiry.name)}`}
                style={{
                  padding: '6px 14px',
                  backgroundColor: currentTheme.primary,
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                + Convert to Commercial Quote
              </a>
              <button
                onClick={() => setDetailTab('comms')}
                style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
              >
                + Log Call / Note
              </button>
              <button
                onClick={() => setDetailTab('followups')}
                style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
              >
                + Schedule Follow-up
              </button>
              <a
                href={`/admin?tab=crm&search=${encodeURIComponent(selectedEnquiry.email)}`}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  textDecoration: 'none',
                }}
              >
                View in CRM Profile →
              </a>
            </div>
          </div>

          {/* Detail Tabs Bar */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e2e8f0', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'overview', label: 'Overview & Requirements' },
              { id: 'contact', label: 'Contact Details' },
              { id: 'requirements', label: 'Products of Interest' },
              { id: 'comms', label: `Communication (${enquiryDetail?.communications?.length || 0})` },
              { id: 'followups', label: `Follow-ups (${enquiryDetail?.followups?.length || 0})` },
              { id: 'commercial', label: `Commercial (${(enquiryDetail?.relatedQuotes?.length || 0) + (enquiryDetail?.relatedOrders?.length || 0)})` },
              { id: 'activity', label: `Audit Trail (${enquiryDetail?.timeline?.length || 0})` },
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

          {/* Detail Tab Contents */}
          {detailLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading enquiry dossier...</div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
              {/* Tab 1: Overview */}
              {detailTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Submitted Message & Requirements</h3>
                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', fontSize: '13px', color: '#1e293b', lineHeight: '1.6' }}>
                      {selectedEnquiry.message || 'No additional message recorded.'}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Machinery & Specification Highlights</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Product Focus</span>
                        <span style={{ fontWeight: 600 }}>{selectedEnquiry.productOfInterest || 'Custom Machinery Inquiry'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Channel Source</span>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedEnquiry.source} Channel</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>Priority Level</span>
                        <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{selectedEnquiry.priority}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                        <span style={{ color: '#64748b' }}>Target City</span>
                        <span>{selectedEnquiry.city || 'India'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Contact Details */}
              {detailTab === 'contact' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#0f172a' }}>Contact Information</h4>
                    <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div><strong style={{ color: '#64748b' }}>Full Name:</strong> {selectedEnquiry.name}</div>
                      <div><strong style={{ color: '#64748b' }}>Email:</strong> {selectedEnquiry.email}</div>
                      <div><strong style={{ color: '#64748b' }}>Phone:</strong> {selectedEnquiry.phone || 'Not provided'}</div>
                      <div><strong style={{ color: '#64748b' }}>Company:</strong> {selectedEnquiry.company || 'Direct Buyer'}</div>
                      <div><strong style={{ color: '#64748b' }}>Location:</strong> {selectedEnquiry.city || 'Not specified'}</div>
                    </div>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#0f172a' }}>CRM Customer Match</h4>
                    {enquiryDetail?.linkedCustomer ? (
                      <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: '#059669', fontWeight: 600 }}>✓ Verified CRM Customer Account</div>
                        <div><strong style={{ color: '#64748b' }}>Account Name:</strong> {enquiryDetail.linkedCustomer.name}</div>
                        <div><strong style={{ color: '#64748b' }}>Role:</strong> {enquiryDetail.linkedCustomer.role}</div>
                        <a href={`/admin?tab=crm&search=${encodeURIComponent(selectedEnquiry.email)}`} style={{ color: currentTheme.primary, fontWeight: 600, textDecoration: 'none', marginTop: '6px' }}>
                          Open Customer Dossier →
                        </a>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        No direct matching user profile found. This lead can be converted to a quote or registered as a customer directly.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Requirements & Products */}
              {detailTab === 'requirements' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>Target Commercial Unit</h4>
                    <div style={{ fontSize: '13px', color: '#334155' }}>
                      {selectedEnquiry.productOfInterest || 'General Commercial Machinery & SS304 Custom Fabrication'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                      Specifications derived from submitted brief: <em>{selectedEnquiry.message}</em>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Communication History */}
              {detailTab === 'comms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Log Communication Form */}
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#0f172a' }}>Log Call, Client Message, or Internal Note</h4>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <select
                        value={commType}
                        onChange={(e) => setCommType(e.target.value as any)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      >
                        <option value="internal_note">Staff Internal Note</option>
                        <option value="call">Phone Call Log</option>
                        <option value="email">Email Communication</option>
                        <option value="message">Direct Message</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Subject / Summary line"
                        value={commSubject}
                        onChange={(e) => setCommSubject(e.target.value)}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Enter detailed notes regarding what was discussed, client requests, or internal follow-up instructions..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginBottom: '8px' }}
                    />
                    <button
                      onClick={handleAddCommunication}
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
                      Save Communication Record
                    </button>
                  </div>

                  {/* List of communications */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(enquiryDetail?.communications || []).length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: '12px' }}>No communication logs recorded yet.</div>
                    ) : (
                      enquiryDetail?.communications.map((c: any) => (
                        <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', backgroundColor: '#ffffff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: currentTheme.primary, textTransform: 'uppercase' }}>
                              {c.type.replace('_', ' ')} • {c.subject || 'Notes'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#0f172a' }}>{c.content}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>Recorded by {c.authorName}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 5: Follow-ups & Tasks */}
              {detailTab === 'followups' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Schedule Followup Form */}
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#0f172a' }}>Schedule Follow-up Task</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="Task description (e.g. Call client with revised quote)"
                        value={followupTask}
                        onChange={(e) => setFollowupTask(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <input
                        type="date"
                        value={followupDueDate}
                        onChange={(e) => setFollowupDueDate(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    </div>
                    <button
                      onClick={handleAddFollowup}
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
                      Schedule Task
                    </button>
                  </div>

                  {/* List of Tasks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(enquiryDetail?.followups || []).length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: '12px' }}>No scheduled tasks for this enquiry.</div>
                    ) : (
                      enquiryDetail?.followups.map((f: any) => (
                        <div key={f.id} style={{ border: '1px solid #fed7aa', backgroundColor: '#fff7ed', borderRadius: '6px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#9a3412' }}>{f.task}</div>
                            <div style={{ fontSize: '11px', color: '#c2410c', marginTop: '2px' }}>
                              Due: {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : 'No date'} • Assigned: {f.assignedTo || 'Staff'}
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ffedd5', color: '#9a3412' }}>
                            {f.status.toUpperCase()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 6: Quotes & Orders */}
              {detailTab === 'commercial' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0', color: '#0f172a' }}>Associated Commercial Records</h4>
                  {(enquiryDetail?.relatedQuotes || []).length === 0 && (enquiryDetail?.relatedOrders || []).length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '13px' }}>
                      No quotes or orders linked to this enquirer email yet. Click "Convert to Commercial Quote" above to issue a quote.
                    </div>
                  ) : (
                    <>
                      {enquiryDetail?.relatedQuotes.map((q: any) => (
                        <div key={q.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>Quote #{q.quote_number || q.id}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Created: {new Date(q.created_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#334155' }}>
                              {q.status.toUpperCase()}
                            </span>
                            <a href={`/admin/collections/quotes/${q.id}`} style={{ fontSize: '12px', color: currentTheme.primary, textDecoration: 'none' }}>
                              View Quote →
                            </a>
                          </div>
                        </div>
                      ))}
                      {enquiryDetail?.relatedOrders.map((ord: any) => (
                        <div key={ord.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>Order #{ord.order_number || ord.id}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Date: {new Date(ord.created_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: currentTheme.primary }}>{formatRupees(ord.total_paise)}</div>
                            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>{ord.status.toUpperCase()}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Tab 7: Activity Timeline */}
              {detailTab === 'activity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(enquiryDetail?.timeline || []).length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No timeline events recorded.</div>
                  ) : (
                    enquiryDetail?.timeline.map((item: any) => (
                      <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentTheme.primary, marginTop: '6px' }} />
                        <div style={{ flex: 1, borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{item.title}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.description}</div>
                          {item.actor && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>By: {item.actor}</div>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── View 2: Responsive Enquiry Card Grid (No Tables) ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredList.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#64748b' }}>
              No enquiries found in this view matching current filters.
            </div>
          ) : (
            filteredList.map((enq) => {
              const badge = getEnquiryStatusBadge(enq.status);
              return (
                <div
                  key={enq.id}
                  onClick={() => onSelectEnquiry(enq)}
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
                    {/* Header Row: Reference & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: currentTheme.primary, backgroundColor: `${currentTheme.primary}12`, padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                          #{enq.reference}
                        </span>
                        {enq.priority === 'urgent' && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', backgroundColor: '#fee2e2', padding: '1px 5px', borderRadius: '3px' }}>
                            URGENT
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Enquirer Info */}
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                      {enq.name}
                    </div>
                    {enq.company && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                        <Building2 size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                        {enq.company}
                      </div>
                    )}

                    {/* Contact Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                      {enq.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={12} /> {enq.email}
                        </div>
                      )}
                      {enq.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={12} /> {enq.phone}
                        </div>
                      )}
                    </div>

                    {/* Message Preview */}
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: '#334155', maxHeight: '50px', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '12px', fontStyle: 'italic' }}>
                      "{enq.message}"
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(enq.createdAt).toLocaleDateString()}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: currentTheme.primary, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      View Details <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {/* Modal: Inbound Email Ingestion Prerequisites Guide */}
      {showEmailConfigModal && (
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
          onClick={() => setShowEmailConfigModal(false)}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <Mail size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    Inbound Email Ingestion (Unconfigured)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                    Automated email-to-enquiry pipeline status & prerequisites
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailConfigModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: '#334155' }}>
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px', padding: '12px', display: 'flex', gap: '10px' }}>
                <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
                  <strong>Live Email Ingestion is not active:</strong> Kitchen Bots does not invent fake incoming emails or poll unauthenticated mailboxes. All current enquiries arrive via verified Direct Intake or Storefront Website forms.
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '12px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Prerequisites to activate inbound email sync:
                </strong>
                <ul style={{ margin: '8px 0 0', paddingLeft: '20px', lineHeight: '1.6', fontSize: '12px', color: '#475569' }}>
                  <li><strong>Inbound Webhook Provider:</strong> SendGrid Inbound Parse, Postmark Inbound, or AWS SES Inbound rule set.</li>
                  <li><strong>Domain MX Record:</strong> Pointing sub-address (e.g. <code>inbound@enquiries.kitchenbots.in</code>) to the webhook parser endpoint.</li>
                  <li><strong>Security Secret:</strong> <code>INBOUND_EMAIL_WEBHOOK_SECRET</code> configured in deployment environment variables to verify HMAC signatures.</li>
                  <li><strong>Spam Protection:</strong> SPF/DKIM validation enabled before accepting lead records into PostgreSQL.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                  Current Active Channels:
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                  • <strong>Direct Enquiries:</strong> Phone calls, walk-in showroom visits, and WhatsApp messages logged via the "+ Record Direct Lead" button.<br />
                  • <strong>Website Enquiries:</strong> Commercial quote requests submitted live on kitchenbots.in.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowEmailConfigModal(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
