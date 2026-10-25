'use client';

import React, { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  Headphones,
  Plus,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ChevronRight,
  DollarSign,
  MessageSquare,
  Activity,
  Check,
} from 'lucide-react';
import type {
  ServiceCase,
  ServiceMetrics,
  ServiceDetailResponse,
  ServiceType,
  ServiceStatus,
  ServicePriority,
} from '@kitchen-bots/types';

interface ServicesWorkspaceProps {
  currentTheme: any;
  metrics: ServiceMetrics;
  cases: ServiceCase[];
  activeSubTab: ServiceType;
  setActiveSubTab: (tab: ServiceType) => void;
  selectedCase: ServiceCase | null;
  setSelectedCase: (c: ServiceCase | null) => void;
  serviceDetail: ServiceDetailResponse | null;
  detailLoading: boolean;
  onSelectCase: (c: ServiceCase) => Promise<void>;
  onRefreshData: () => Promise<void>;
  formatRupees: (paise?: number) => string;
}

export const ServicesWorkspace: React.FC<ServicesWorkspaceProps> = ({
  currentTheme,
  metrics,
  cases,
  activeSubTab,
  setActiveSubTab,
  selectedCase,
  setSelectedCase,
  serviceDetail,
  detailLoading,
  onSelectCase,
  onRefreshData,
  formatRupees,
}) => {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [warrantyDecisionFilter, setWarrantyDecisionFilter] = useState<string>('all');
  const [detailTab, setDetailTab] = useState<string>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Case Form State
  const [formType, setFormType] = useState<ServiceType>('warranty');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<ServicePriority>('normal');
  const [submitting, setSubmitting] = useState(false);

  // Decision Modal State
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionChoice, setDecisionChoice] = useState<'approved' | 'rejected'>('approved');
  const [decisionReason, setDecisionReason] = useState('');
  const [approvedResolution, setApprovedResolution] = useState<'repair' | 'replacement' | 'parts' | 'guidance'>('replacement');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  // Activity / Log State
  const [activityNote, setActivityNote] = useState('');
  const [activityType, setActivityType] = useState<'internal_note' | 'customer_message' | 'troubleshooting' | 'work_log'>('internal_note');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Filter cases for the current primary tab
  const filteredCases = cases.filter((c) => {
    if (c.type !== activeSubTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        c.reference.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerEmail.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        (c.productName?.toLowerCase().includes(q) ?? false) ||
        (c.productSku?.toLowerCase().includes(q) ?? false);
      if (!match) return false;
    }
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
    if (activeSubTab === 'warranty' && warrantyDecisionFilter !== 'all') {
      if (warrantyDecisionFilter === 'pending' && c.warrantyDecision !== 'pending') return false;
      if (warrantyDecisionFilter === 'approved' && c.warrantyDecision !== 'approved') return false;
      if (warrantyDecisionFilter === 'rejected' && c.warrantyDecision !== 'rejected') return false;
    }
    return true;
  });

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'new':
        return { label: 'New Case', bg: '#eff6ff', color: '#1d4ed8' };
      case 'in_progress':
      case 'investigating':
        return { label: 'In Progress', bg: '#fef3c7', color: '#b45309' };
      case 'diagnosed':
        return { label: 'Diagnosed', bg: '#f3e8ff', color: '#7e22ce' };
      case 'awaiting_customer':
        return { label: 'Awaiting Customer', bg: '#fff7ed', color: '#c2410c' };
      case 'awaiting_parts':
        return { label: 'Awaiting Parts', bg: '#fee2e2', color: '#b91c1c' };
      case 'testing':
        return { label: 'Testing / QC', bg: '#e0f2fe', color: '#0369a1' };
      case 'ready_dispatch':
        return { label: 'Ready for Dispatch', bg: '#ecfdf5', color: '#047857' };
      case 'resolved':
      case 'closed':
        return { label: 'Resolved', bg: '#f0fdf4', color: '#15803d' };
      case 'rejected':
      case 'cancelled':
        return { label: 'Closed / Rejected', bg: '#f1f5f9', color: '#475569' };
      default:
        return { label: status, bg: '#f1f5f9', color: '#475569' };
    }
  };

  const getPriorityBadge = (p: ServicePriority) => {
    switch (p) {
      case 'urgent':
        return { label: 'Urgent', bg: '#fee2e2', color: '#991b1b' };
      case 'high':
        return { label: 'High', bg: '#ffedd5', color: '#9a3412' };
      case 'low':
        return { label: 'Low', bg: '#f1f5f9', color: '#475569' };
      default:
        return { label: 'Normal', bg: '#e2e8f0', color: '#334155' };
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/operations/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'create_case',
          type: formType,
          customerName: formName,
          customerEmail: formEmail,
          customerPhone: formPhone,
          companyName: formCompany,
          productName: formProduct,
          productSku: formSku,
          serialNumber: formSerial,
          subject: formSubject,
          category: formCategory,
          description: formDesc,
          priority: formPriority,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        // reset
        setFormName('');
        setFormEmail('');
        setFormPhone('');
        setFormCompany('');
        setFormSubject('');
        setFormDesc('');
        await onRefreshData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleWarrantyDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setDecisionSubmitting(true);
    try {
      const res = await fetch('/api/operations/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'warranty_decision',
          serviceId: selectedCase.id,
          decision: decisionChoice,
          reason: decisionReason,
          approvedResolution,
        }),
      });
      if (res.ok) {
        setShowDecisionModal(false);
        await onSelectCase(selectedCase);
        await onRefreshData();
      }
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedCase || !activityNote.trim()) return;
    setNoteSubmitting(true);
    try {
      const res = await fetch('/api/operations/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'add_activity',
          serviceId: selectedCase.id,
          type: activityType,
          title: activityType === 'work_log' ? 'Work Log Entry' : activityType === 'troubleshooting' ? 'Diagnostic Test' : 'Internal Note',
          content: activityNote.trim(),
        }),
      });
      if (res.ok) {
        setActivityNote('');
        await onSelectCase(selectedCase);
      }
    } finally {
      setNoteSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER DEDICATED CASE DETAIL VIEW
  // -------------------------------------------------------------
  if (selectedCase) {
    const c = serviceDetail?.caseRecord || selectedCase;
    const stBadge = getStatusBadge(c.status);
    const prBadge = getPriorityBadge(c.priority);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Back Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setSelectedCase(null)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#334155',
            }}
          >
            ← Back to All {c.type === 'warranty' ? 'Warranty Claims' : c.type === 'repair' ? 'Repair Jobs' : 'Support Cases'}
          </button>
          <span style={{ fontSize: '13px', color: '#64748b' }}>/</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{c.reference}</span>
        </div>

        {/* ── Summary Card Header ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569' }}>
                  {c.reference}
                </span>
                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: stBadge.bg, color: stBadge.color }}>
                  {stBadge.label}
                </span>
                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: prBadge.bg, color: prBadge.color }}>
                  {prBadge.label} Priority
                </span>
                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1e40af' }}>
                  {c.type.toUpperCase()}
                </span>
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{c.subject}</h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Customer: <strong style={{ color: '#0f172a' }}>{c.customerName}</strong> {c.companyName ? `(${c.companyName})` : ''} • Email: {c.customerEmail} {c.customerPhone ? `• Phone: ${c.customerPhone}` : ''}
              </p>
            </div>

            {/* Header Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {c.type === 'warranty' && (
                <button
                  onClick={() => setShowDecisionModal(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentTheme.primary,
                    color: '#fff',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Record Warranty Decision
                </button>
              )}
              {c.type === 'repair' && !c.customerApproved && (
                <button
                  onClick={async () => {
                    await fetch('/api/operations/services', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ action: 'customer_approve_estimate', serviceId: c.id }),
                    });
                    await onSelectCase(c);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ✓ Approve Repair Estimate
                </button>
              )}
              <button
                onClick={async () => {
                  const nextStatus = c.status === 'resolved' ? 'closed' : 'resolved';
                  await fetch('/api/operations/services', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ action: 'update_status', serviceId: c.id, status: nextStatus }),
                  });
                  await onSelectCase(c);
                  await onRefreshData();
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {c.status === 'resolved' ? 'Close Case' : 'Mark Resolved'}
              </button>
            </div>
          </div>

          {/* Warranty decision callout if present */}
          {c.warrantyDecision && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: c.warrantyDecision === 'approved' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${c.warrantyDecision === 'approved' ? '#bbf7d0' : '#fecaca'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {c.warrantyDecision === 'approved' ? (
                <CheckCircle2 size={20} color="#16a34a" />
              ) : (
                <XCircle size={20} color="#dc2626" />
              )}
              <div style={{ flex: 1, fontSize: '13px' }}>
                <strong style={{ color: c.warrantyDecision === 'approved' ? '#15803d' : '#991b1b' }}>
                  Warranty Claim {c.warrantyDecision.toUpperCase()}
                </strong>
                <span style={{ color: '#475569' }}>
                  {' '}— {c.warrantyDecisionReason || 'Standard coverage verification.'}
                  {c.approvedResolution ? ` (Resolution: ${c.approvedResolution})` : ''}
                </span>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Decided by {c.warrantyDecisionBy || 'Operations Lead'} on{' '}
                  {c.warrantyDecisionAt ? new Date(c.warrantyDecisionAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Detail Tabs Navigation ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '8px' }}>
          {[
            { id: 'overview', label: '1. Overview & Description' },
            { id: 'product', label: '2. Product & Purchase' },
            { id: 'activities', label: '3. Communication & Work Log' },
            ...(c.type === 'repair' ? [{ id: 'repair_details', label: '4. Diagnosis & Parts' }] : []),
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setDetailTab(t.id)}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                borderBottom: detailTab === t.id ? `2px solid ${currentTheme.primary}` : '2px solid transparent',
                fontWeight: detailTab === t.id ? 700 : 500,
                color: detailTab === t.id ? currentTheme.primary : '#64748b',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Detail Tab Content ── */}
        {detailLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading service details...</div>
        ) : (
          <div>
            {/* Tab 1: Overview */}
            {detailTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Issue Description</h3>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                    {c.description}
                  </p>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#64748b' }}>
                    Category: <strong style={{ color: '#0f172a' }}>{c.category}</strong> • Assigned To:{' '}
                    <strong style={{ color: '#0f172a' }}>{c.assignedTo || 'Unassigned'}</strong>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Operational Metadata</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Created On: </span>
                      <strong style={{ color: '#0f172a' }}>{new Date(c.createdAt).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Warranty Status: </span>
                      <strong style={{ color: c.warrantyStatus === 'active' ? '#16a34a' : '#b45309' }}>
                        {c.warrantyStatus?.toUpperCase() || 'UNVERIFIED'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Assigned Technician: </span>
                      <strong style={{ color: '#0f172a' }}>{c.assignedTechnician || 'Staff Dispatch'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Target Due Date: </span>
                      <strong style={{ color: '#0f172a' }}>
                        {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : 'Standard 48-hour turn'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Product & Purchase */}
            {detailTab === 'product' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Commercial Machinery Item</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Model / Name: </span>
                      <strong style={{ color: '#0f172a' }}>{c.productName || 'Industrial Kitchen Machine'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Catalog SKU: </span>
                      <strong style={{ color: '#0f172a' }}>{c.productSku || 'KB-CAT-001'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Serial Number: </span>
                      <strong style={{ color: '#0f172a' }}>{c.serialNumber || 'SN-VERIFY-REQUIRED'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Linked Order & Invoice</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Order Number: </span>
                      <strong style={{ color: '#0f172a' }}>{c.orderReference || 'N/A (Direct Support)'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Purchase Date: </span>
                      <strong style={{ color: '#0f172a' }}>
                        {c.purchaseDate ? new Date(c.purchaseDate).toLocaleDateString() : 'Verify with Invoice'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Warranty Window: </span>
                      <strong style={{ color: '#0f172a' }}>
                        {c.warrantyStartDate ? new Date(c.warrantyStartDate).toLocaleDateString() : 'Start'} —{' '}
                        {c.warrantyExpiryDate ? new Date(c.warrantyExpiryDate).toLocaleDateString() : 'Expiry'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Activities & Work Log */}
            {detailTab === 'activities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Add Activity Box */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Add Activity / Note</h3>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value as any)}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="internal_note">Internal Note</option>
                      <option value="customer_message">Customer Communication</option>
                      <option value="troubleshooting">Troubleshooting / Diagnostic Log</option>
                      <option value="work_log">Technician Work Log</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Enter notes, observations, or troubleshooting findings..."
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleAddNote}
                      disabled={noteSubmitting || !activityNote.trim()}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: currentTheme.primary,
                        color: '#fff',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: noteSubmitting || !activityNote.trim() ? 0.6 : 1,
                      }}
                    >
                      {noteSubmitting ? 'Saving...' : 'Post Entry'}
                    </button>
                  </div>
                </div>

                {/* Timeline cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {serviceDetail?.activities.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '16px',
                        borderLeft: `4px solid ${act.type === 'decision' ? '#16a34a' : act.type === 'work_log' ? '#7e22ce' : '#3b82f6'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                        <strong style={{ color: '#0f172a' }}>{act.title || act.type}</strong>
                        <span style={{ color: '#64748b' }}>
                          {act.author} • {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>{act.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Repair Diagnosis & Parts */}
            {detailTab === 'repair_details' && c.type === 'repair' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Diagnosis & Cost Estimate</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Diagnosed Fault: </span>
                      <strong style={{ color: '#0f172a' }}>{c.diagnosedFault || 'Pending Initial Inspection'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Probable Cause: </span>
                      <strong style={{ color: '#0f172a' }}>{c.probableCause || 'Inspection required'}</strong>
                    </div>
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Estimated Parts:</span>
                        <strong style={{ color: '#0f172a' }}>{formatRupees(c.partsEstimatePaise || 0)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Estimated Labor:</span>
                        <strong style={{ color: '#0f172a' }}>{formatRupees(c.labourEstimatePaise || 0)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>Total Estimate:</span>
                        <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatRupees(c.totalEstimatePaise || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Reserved Parts & Components</h3>
                  {serviceDetail?.parts && serviceDetail.parts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {serviceDetail.parts.map((p) => (
                        <div key={p.id} style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span>{p.partName}</span>
                            <span>{formatRupees(p.unitPricePaise)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginTop: '2px' }}>
                            <span>SKU: {p.partSku} • Qty: {p.quantity}</span>
                            <span style={{ color: p.status === 'consumed' ? '#16a34a' : '#b45309' }}>{p.status.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No spare parts registered for this repair job.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Decision Modal ── */}
        {showDecisionModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', width: '500px', maxWidth: '90%' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>Record Warranty Claim Decision</h2>
              <form onSubmit={handleWarrantyDecision}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Decision</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <input
                        type="radio"
                        checked={decisionChoice === 'approved'}
                        onChange={() => setDecisionChoice('approved')}
                      />
                      Approve Claim
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <input
                        type="radio"
                        checked={decisionChoice === 'rejected'}
                        onChange={() => setDecisionChoice('rejected')}
                      />
                      Reject Claim
                    </label>
                  </div>
                </div>

                {decisionChoice === 'approved' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Approved Resolution</label>
                    <select
                      value={approvedResolution}
                      onChange={(e) => setApprovedResolution(e.target.value as any)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="replacement">Full Unit Replacement</option>
                      <option value="repair">Workshop Component Repair</option>
                      <option value="parts">Dispatch Replacement Parts</option>
                      <option value="guidance">Technical Assistance & Calibration</option>
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    {decisionChoice === 'rejected' ? 'Mandatory Rejection Reason *' : 'Approval Rationale / Notes'}
                  </label>
                  <textarea
                    rows={4}
                    required={decisionChoice === 'rejected'}
                    placeholder={
                      decisionChoice === 'rejected'
                        ? 'Specify reason (e.g. Damage outside warranty scope, expired warranty window, user water immersion defect)...'
                        : 'Explain coverage terms verified...'
                    }
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowDecisionModal(false)}
                    style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={decisionSubmitting}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: decisionChoice === 'approved' ? '#16a34a' : '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {decisionSubmitting ? 'Recording...' : `Confirm ${decisionChoice.toUpperCase()}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER OVERVIEW WORKSPACE & CARDS (NO TABLES)
  // -------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Equipment Services & Customer Support Hub
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Manage warranty claims, customer technical support tickets, and commercial machinery repairs.
          </p>
        </div>
        <button
          onClick={() => {
            setFormType(activeSubTab);
            setShowCreateModal(true);
          }}
          style={{
            padding: '10px 18px',
            backgroundColor: currentTheme.primary,
            color: '#fff',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} /> Create Service Case
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Cases', val: metrics.totalCases, filter: 'all' },
          { label: 'New / Review', val: metrics.newAwaitingReview, filter: 'new' },
          { label: 'Open In Progress', val: metrics.openInProgress, filter: 'in_progress' },
          { label: 'Pending Warranty', val: metrics.pendingWarrantyDecisions, filter: 'pending_warranty' },
          { label: 'Approved Claims', val: metrics.approvedWarrantyClaims, filter: 'approved_warranty' },
          { label: 'Repairs Active', val: metrics.repairsInProgress, filter: 'repair_active' },
          { label: 'Awaiting Customer', val: metrics.awaitingCustomerResponse, filter: 'awaiting_customer' },
          { label: 'Overdue Cases', val: metrics.overdueCases, filter: 'overdue' },
          { label: 'Resolved / Closed', val: metrics.resolvedClosedCases, filter: 'resolved' },
        ].map((k, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (k.filter === 'pending_warranty') {
                setActiveSubTab('warranty');
                setWarrantyDecisionFilter('pending');
              } else if (k.filter === 'approved_warranty') {
                setActiveSubTab('warranty');
                setWarrantyDecisionFilter('approved');
              } else if (k.filter === 'repair_active') {
                setActiveSubTab('repair');
                setStatusFilter('in_progress');
              } else if (k.filter !== 'all') {
                setStatusFilter(k.filter);
              } else {
                setStatusFilter('all');
                setWarrantyDecisionFilter('all');
              }
            }}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 14px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* ── Main Service Tabs (Warranty, Support, Repair) ── */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '24px' }}>
        {[
          { id: 'warranty' as ServiceType, label: 'Warranty Claims', icon: ShieldCheck, count: cases.filter((c) => c.type === 'warranty').length },
          { id: 'support' as ServiceType, label: 'Support Service', icon: Headphones, count: cases.filter((c) => c.type === 'support').length },
          { id: 'repair' as ServiceType, label: 'Repair Service', icon: Wrench, count: cases.filter((c) => c.type === 'repair').length },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveSubTab(t.id);
                setStatusFilter('all');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 6px',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? currentTheme.primary : '#64748b',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <Icon size={18} />
              <span>{t.label}</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#eff6ff' : '#f1f5f9',
                  color: isActive ? currentTheme.primary : '#64748b',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Controls ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search by reference, client name, model, SKU, or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="diagnosed">Diagnosed</option>
          <option value="awaiting_customer">Awaiting Customer</option>
          <option value="ready_dispatch">Ready for Dispatch</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        {activeSubTab === 'warranty' && (
          <select
            value={warrantyDecisionFilter}
            onChange={(e) => setWarrantyDecisionFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
          >
            <option value="all">All Decisions</option>
            <option value="pending">Pending Decision</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
      </div>

      {/* ── CARD GRID (NO TABLES) ── */}
      {filteredCases.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <Wrench size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }}>No service cases found</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>Try adjusting your search criteria or register a new service case.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filteredCases.map((c) => {
            const stBadge = getStatusBadge(c.status);
            const prBadge = getPriorityBadge(c.priority);

            return (
              <div
                key={c.id}
                onClick={() => onSelectCase(c)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '18px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = currentTheme.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                <div>
                  {/* Card Reference & Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{c.reference}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: stBadge.bg,
                          color: stBadge.color,
                        }}
                      >
                        {stBadge.label}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: prBadge.bg,
                          color: prBadge.color,
                        }}
                      >
                        {prBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Subject & Category */}
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.4 }}>
                    {c.subject}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    Category: <strong style={{ color: '#334155' }}>{c.category}</strong>
                  </div>

                  {/* Machine / Model */}
                  {c.productName && (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        marginBottom: '12px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.productName}</div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>
                        SKU: {c.productSku || 'General'} {c.serialNumber ? `• Serial: ${c.serialNumber}` : ''}
                      </div>
                    </div>
                  )}

                  {/* Description preview */}
                  <p
                    style={{
                      margin: '0 0 12px',
                      fontSize: '13px',
                      color: '#475569',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.description}
                  </p>
                </div>

                {/* Footer Metadata & CTA */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    <div>Customer: <strong style={{ color: '#334155' }}>{c.customerName}</strong></div>
                    <div>{new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: currentTheme.primary, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Details <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE SERVICE CASE MODAL ── */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', width: '560px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>Register New Service Case</h2>
            <form onSubmit={handleCreateCase}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Service Case Type *</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="warranty">Warranty Claim</option>
                  <option value="support">Customer Technical Support</option>
                  <option value="repair">Workshop Equipment Repair</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Customer Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@business.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Kitchens"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Machinery Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Flip BBQ Grill"
                    value={formProduct}
                    onChange={(e) => setFormProduct(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Serial Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-KB-FBQ-2026-..."
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Subject / Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Summary of breakdown or request"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Electrical / Motor / Setup"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed breakdown notes, symptoms, observed defects..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentTheme.primary,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Registering...' : 'Register Service Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
