'use client';

import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  BookOpen,
  FileSpreadsheet,
  Wrench,
  Lock,
  Award,
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Tag,
  Clock,
  Layers,
  ChevronRight,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  ExternalLink,
  UploadCloud,
} from 'lucide-react';
import type {
  BusinessDocument,
  DocumentMetrics,
  DocumentDetailResponse,
  DocumentCategory,
  DocumentStatus,
  DocumentVisibility,
} from '@kitchen-bots/types';

interface DocumentsWorkspaceProps {
  currentTheme: any;
  metrics: DocumentMetrics;
  documents: BusinessDocument[];
  activeCategory: DocumentCategory | 'all';
  setActiveCategory: (cat: DocumentCategory | 'all') => void;
  selectedDocument: BusinessDocument | null;
  setSelectedDocument: (doc: BusinessDocument | null) => void;
  documentDetail: DocumentDetailResponse | null;
  detailLoading: boolean;
  onSelectDocument: (doc: BusinessDocument) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const DocumentsWorkspace: React.FC<DocumentsWorkspaceProps> = ({
  currentTheme,
  metrics,
  documents,
  activeCategory,
  setActiveCategory,
  selectedDocument,
  setSelectedDocument,
  documentDetail,
  detailLoading,
  onSelectDocument,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [detailTab, setDetailTab] = useState<string>('overview');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);

  // Upload Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DocumentCategory>('warranty');
  const [formType, setFormType] = useState('Warranty Policy');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formFileName, setFormFileName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formVersion, setFormVersion] = useState('1.0');
  const [formStatus, setFormStatus] = useState<DocumentStatus>('published');
  const [formVisibility, setFormVisibility] = useState<DocumentVisibility>('internal');
  const [formTagString, setFormTagString] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Version Form State
  const [newVersionString, setNewVersionString] = useState('');
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [versionFileName, setVersionFileName] = useState('');
  const [versionNotes, setVersionNotes] = useState('');
  const [versionSubmitting, setVersionSubmitting] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'published':
        return { label: 'Published', bg: '#ecfdf5', color: '#047857' };
      case 'approved':
        return { label: 'Approved', bg: '#eff6ff', color: '#1d4ed8' };
      case 'draft':
        return { label: 'Draft', bg: '#fef3c7', color: '#b45309' };
      case 'pending_review':
        return { label: 'In Review', bg: '#fff7ed', color: '#c2410c' };
      case 'archived':
        return { label: 'Archived', bg: '#f1f5f9', color: '#475569' };
      default:
        return { label: status, bg: '#f1f5f9', color: '#475569' };
    }
  };

  const getVisibilityBadge = (v: DocumentVisibility) => {
    switch (v) {
      case 'public':
        return { label: 'Public Portal', bg: '#f0fdf4', color: '#15803d' };
      case 'customer':
        return { label: 'Customer Shareable', bg: '#eff6ff', color: '#2563eb' };
      case 'restricted':
        return { label: 'Restricted (Admin)', bg: '#fef2f2', color: '#b91c1c' };
      default:
        return { label: 'Internal Staff', bg: '#f8fafc', color: '#475569' };
    }
  };

  const categoriesConfig: Array<{ id: DocumentCategory | 'all'; label: string; icon: any; count: number }> = [
    { id: 'all', label: 'All Documents', icon: FolderOpen, count: documents.length },
    { id: 'warranty', label: 'Warranty Documents', icon: ShieldCheck, count: documents.filter((d) => d.category === 'warranty').length },
    { id: 'policies', label: 'Terms of Use & Policies', icon: BookOpen, count: documents.filter((d) => d.category === 'policies').length },
    { id: 'manuals', label: 'Product Manuals & Specs', icon: FileText, count: documents.filter((d) => d.category === 'manuals').length },
    { id: 'commercial', label: 'Commercial Documents', icon: FileSpreadsheet, count: documents.filter((d) => d.category === 'commercial').length },
    { id: 'service', label: 'Service & Repair Reports', icon: Wrench, count: documents.filter((d) => d.category === 'service').length },
    { id: 'internal', label: 'Internal & Company SOPs', icon: Lock, count: documents.filter((d) => d.category === 'internal').length },
    { id: 'compliance', label: 'Certificates & BIS Compliance', icon: Award, count: documents.filter((d) => d.category === 'compliance').length },
    { id: 'reports', label: 'Reports & Exports', icon: BarChart3, count: documents.filter((d) => d.category === 'reports').length },
  ];

  const filteredDocuments = documents.filter((d) => {
    if (activeCategory !== 'all' && d.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        d.title.toLowerCase().includes(q) ||
        d.reference.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        (d.productName?.toLowerCase().includes(q) ?? false) ||
        (d.customerName?.toLowerCase().includes(q) ?? false) ||
        d.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (visibilityFilter !== 'all' && d.visibility !== visibilityFilter) return false;
    return true;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!selectedFile) {
      setUploadError('Please select a file from your device to upload.');
      return;
    }

    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'png', 'jpg', 'jpeg'];
    if (!allowedExts.includes(ext)) {
      setUploadError(`Unsupported file format .${ext}. Allowed formats: PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG`);
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setUploadError(`File exceeds maximum 25 MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setSubmitting(true);
    try {
      const tags = formTagString
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const formData = new FormData();
      formData.append('action', 'create_document');
      formData.append('title', formTitle.trim());
      formData.append('category', formCategory);
      formData.append('documentType', formType.trim());
      formData.append('description', formDesc.trim());
      formData.append('version', formVersion.trim() || '1.0');
      formData.append('status', formStatus);
      formData.append('visibility', formVisibility);
      formData.append('tags', JSON.stringify(tags));
      formData.append('file', selectedFile);

      const res = await fetch('/api/operations/documents', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload document');
      }

      setShowUploadModal(false);
      setFormTitle('');
      setSelectedFile(null);
      setFormFileName('');
      setFormDesc('');
      setFormTagString('');
      setUploadError(null);
      await onRefreshData();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocument) return;
    setVersionError(null);

    if (!versionFile) {
      setVersionError('Please select an updated file from your device.');
      return;
    }

    const ext = versionFile.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'png', 'jpg', 'jpeg'];
    if (!allowedExts.includes(ext)) {
      setVersionError(`Unsupported file format .${ext}. Allowed formats: PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG`);
      return;
    }

    if (versionFile.size > 25 * 1024 * 1024) {
      setVersionError(`File exceeds maximum 25 MB limit (${(versionFile.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setVersionSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('action', 'upload_new_version');
      formData.append('documentId', String(selectedDocument.id));
      formData.append('newVersion', newVersionString.trim());
      formData.append('notes', versionNotes.trim());
      formData.append('file', versionFile);

      const res = await fetch('/api/operations/documents', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload new version');
      }

      setShowVersionModal(false);
      setNewVersionString('');
      setVersionFile(null);
      setVersionFileName('');
      setVersionNotes('');
      setVersionError(null);
      await onSelectDocument(selectedDocument);
      await onRefreshData();
    } catch (err: any) {
      setVersionError(err.message || 'Version upload failed');
    } finally {
      setVersionSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // DEDICATED DOCUMENT DETAIL VIEW (NO TABLES)
  // -------------------------------------------------------------
  if (selectedDocument) {
    const doc = documentDetail?.document || selectedDocument;
    const stBadge = getStatusBadge(doc.status);
    const visBadge = getVisibilityBadge(doc.visibility);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setSelectedDocument(null)}
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
            ← Back to Documents Library
          </button>
          <span style={{ fontSize: '13px', color: '#64748b' }}>/</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{doc.reference}</span>
        </div>

        {/* ── Summary Header Card ── */}
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
            <div style={{ flex: '1 1 500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569' }}>
                  {doc.reference}
                </span>
                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: stBadge.bg, color: stBadge.color }}>
                  {stBadge.label}
                </span>
                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: visBadge.bg, color: visBadge.color }}>
                  {visBadge.label}
                </span>
                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
                  v{doc.version}
                </span>
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{doc.title}</h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                File: <strong style={{ color: '#0f172a' }}>{doc.fileName}</strong> ({formatFileSize(doc.fileSizeBytes)}) • Category: {doc.category.toUpperCase()} • Owner: {doc.owner}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowVersionModal(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentTheme.primary,
                  color: '#fff',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <UploadCloud size={16} /> Upload New Version
              </button>
              <button
                onClick={async () => {
                  const newStatus = doc.status === 'published' ? 'archived' : 'published';
                  await fetch('/api/operations/documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ action: 'update_status', documentId: doc.id, status: newStatus }),
                  });
                  await onSelectDocument(doc);
                  await onRefreshData();
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#334155',
                }}
              >
                {doc.status === 'published' ? 'Archive Document' : 'Publish Document'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Sub-tabs ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '8px' }}>
          {[
            { id: 'overview', label: '1. Overview & Description' },
            { id: 'preview', label: '2. Document Preview & Download' },
            { id: 'linked', label: '3. Linked Business Records' },
            { id: 'versions', label: '4. Version History' },
            { id: 'activity', label: '5. Audit Trail' },
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

        {/* ── Tab Content ── */}
        {detailLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading document details...</div>
        ) : (
          <div>
            {/* Tab 1: Overview */}
            {detailTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Document Purpose & Notes</h3>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '0 0 16px' }}>
                    {doc.description || 'No description provided.'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {doc.tags.map((tg, idx) => (
                      <span key={idx} style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: 600 }}>
                        #{tg}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Lifecycle & Metadata</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Document Type: </span>
                      <strong style={{ color: '#0f172a' }}>{doc.documentType}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Uploaded On: </span>
                      <strong style={{ color: '#0f172a' }}>{new Date(doc.createdAt).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Effective Window: </span>
                      <strong style={{ color: '#0f172a' }}>
                        {doc.effectiveDate ? new Date(doc.effectiveDate).toLocaleDateString() : 'Effective Immediately'}
                        {doc.expiryDate ? ` to ${new Date(doc.expiryDate).toLocaleDateString()}` : ' (Perpetual / Ongoing)'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Storage Path: </span>
                      <code style={{ fontSize: '12px', color: '#0f172a', backgroundColor: '#f8fafc', padding: '2px 4px', borderRadius: '4px' }}>
                        {doc.filePath || '/documents/library/' + doc.fileName}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Preview & Download */}
            {detailTab === 'preview' && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={24} color={currentTheme.primary} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{doc.fileName}</h4>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {formatFileSize(doc.fileSizeBytes)} • MIME: {doc.fileMimeType}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(`/api/operations/documents/download?id=${doc.id}`, '_blank')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: currentTheme.primary,
                      color: '#fff',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Download size={16} /> Download File
                  </button>
                </div>

                <div
                  style={{
                    height: '350px',
                    backgroundColor: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    gap: '10px',
                  }}
                >
                  <FileText size={48} color="#94a3b8" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Embedded PDF / Document Reader</span>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', maxWidth: '400px', textAlign: 'center' }}>
                    Authenticated secure preview rendered for {doc.title} (v{doc.version}).
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Linked Business Records */}
            {detailTab === 'linked' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#0f172a', textTransform: 'uppercase' }}>
                    Connected Machinery Product
                  </h4>
                  {doc.productName ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{doc.productName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>SKU: {doc.productSku || 'General'}</div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No product directly linked.</p>
                  )}
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#0f172a', textTransform: 'uppercase' }}>
                    Associated Commercial Order
                  </h4>
                  {doc.orderReference ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{doc.orderReference}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Client: {doc.customerName || 'B2B Client'}</div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No commercial order associated.</p>
                  )}
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#0f172a', textTransform: 'uppercase' }}>
                    Connected Service / Warranty Case
                  </h4>
                  {doc.serviceReference ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{doc.serviceReference}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Inspection & Support Case</div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No service ticket associated.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Version History */}
            {detailTab === 'versions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {documentDetail?.versions && documentDetail.versions.length > 0 ? (
                  documentDetail.versions.map((ver) => (
                    <div
                      key={ver.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '12px' }}>
                            v{ver.version}
                          </span>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>{ver.fileName}</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                          Uploaded by {ver.uploadedBy} on {new Date(ver.createdAt).toLocaleString()} • {formatFileSize(ver.fileSizeBytes)}
                        </p>
                        {ver.notes && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#334155' }}>Note: {ver.notes}</p>}
                      </div>
                      <button
                        onClick={() => window.open(`/api/operations/documents/download?id=${doc.id}&version=${ver.version}`, '_blank')}
                        style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Download v{ver.version}
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#64748b' }}>No previous versions recorded.</p>
                )}
              </div>
            )}

            {/* Tab 5: Audit Trail */}
            {detailTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {documentDetail?.activities && documentDetail.activities.length > 0 ? (
                  documentDetail.activities.map((act) => (
                    <div key={act.id} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: '#0f172a' }}>{act.action.toUpperCase()}</strong>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>{new Date(act.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ color: '#334155' }}>{act.details}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Actor: {act.actor}</div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#64748b' }}>No audit activity records found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Upload New Version Modal ── */}
        {showVersionModal && (
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
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', width: '480px', maxWidth: '90%' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>Upload New Version</h2>
              <form onSubmit={handleVersionSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>New Version Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2.0 or 2.1"
                    value={newVersionString}
                    onChange={(e) => setNewVersionString(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                {/* Version File Attachment Upload Control */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Updated Document File *
                  </label>
                  <div
                    style={{
                      border: versionFile ? '2px solid #059669' : '2px dashed #cbd5e1',
                      borderRadius: '8px',
                      padding: '14px',
                      backgroundColor: versionFile ? '#f0fdf4' : '#f8fafc',
                      textAlign: 'center',
                    }}
                  >
                    {versionFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                          <FileText size={20} color="#059669" />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{versionFile.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{formatFileSize(versionFile.size)}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <label
                            htmlFor="version-file-upload-input"
                            style={{
                              padding: '3px 8px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Replace
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setVersionFile(null);
                              setVersionFileName('');
                            }}
                            style={{
                              padding: '3px 8px',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud size={24} color="#64748b" style={{ margin: '0 auto 6px' }} />
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                          Select updated file from device
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG (Max: 25 MB)
                        </div>
                        <label
                          htmlFor="version-file-upload-input"
                          style={{
                            display: 'inline-block',
                            marginTop: '8px',
                            padding: '6px 14px',
                            backgroundColor: currentTheme.primary,
                            color: '#ffffff',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                    <input
                      id="version-file-upload-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setVersionFile(file);
                          setVersionFileName(file.name);
                        }
                      }}
                    />
                  </div>
                </div>

                {versionError && (
                  <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '12px', marginBottom: '14px' }}>
                    {versionError}
                  </div>
                )}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Version Release Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Describe clauses changed or improvements made..."
                    value={versionNotes}
                    onChange={(e) => setVersionNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowVersionModal(false)}
                    style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={versionSubmitting}
                    style={{ padding: '8px 16px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {versionSubmitting ? 'Saving...' : 'Deploy Version'}
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
  // RENDER LIBRARY OVERVIEW & CARDS (NO TABLES)
  // -------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Central Document Library & Reports
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Store, version, and link warranty terms, legal policies, machinery manuals, commercial documents, and SOPs.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
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
          <Plus size={16} /> Upload Document
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Documents', val: metrics.totalDocuments, filter: 'all' },
          { label: 'Published / Approved', val: metrics.publishedApproved, filter: 'published' },
          { label: 'Drafts', val: metrics.draftDocuments, filter: 'draft' },
          { label: 'Awaiting Review', val: metrics.awaitingReview, filter: 'pending_review' },
          { label: 'Expiring Soon (30d)', val: metrics.expiringSoon, filter: 'expiring' },
          { label: 'Recently Updated', val: metrics.recentlyUpdated, filter: 'recent' },
          { label: 'Total Storage', val: formatFileSize(metrics.totalStorageBytes), filter: 'storage' },
        ].map((k, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (k.filter === 'storage') return;
              if (k.filter !== 'all') {
                setStatusFilter(k.filter);
              } else {
                setStatusFilter('all');
              }
            }}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 14px',
              cursor: k.filter === 'storage' ? 'default' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{k.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* ── Visual Category Navigation Cards ── */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', margin: '0 0 10px' }}>
          Document Library Categories
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {categoriesConfig.map((c) => {
            const Icon = c.icon;
            const isSelected = activeCategory === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                style={{
                  backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                  border: `1px solid ${isSelected ? currentTheme.primary : '#e2e8f0'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: isSelected ? currentTheme.primary : '#f1f5f9', color: isSelected ? '#fff' : '#64748b' }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{c.count} files</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search documents by title, file name, SKU, tag, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="approved">Approved</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending Review</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
        >
          <option value="all">All Visibility</option>
          <option value="public">Public Portal</option>
          <option value="customer">Customer Shareable</option>
          <option value="internal">Internal Staff</option>
          <option value="restricted">Restricted (Admin)</option>
        </select>
      </div>

      {/* ── DOCUMENT CARDS GRID (NO TABLES) ── */}
      {filteredDocuments.length === 0 ? (
        <div style={{ padding: '60px 20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
          <FileText size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }}>No documents found</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>Upload a new file or adjust your filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredDocuments.map((doc) => {
            const stBadge = getStatusBadge(doc.status);
            const visBadge = getVisibilityBadge(doc.visibility);

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
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
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = currentTheme.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                <div>
                  {/* Reference & Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{doc.reference}</span>
                      {doc.title.startsWith('[SAMPLE]') && (
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                          TEST / DEMO
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: stBadge.bg, color: stBadge.color }}>
                        {stBadge.label}
                      </span>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
                        v{doc.version}
                      </span>
                    </div>
                  </div>

                  {/* Title & Document Type */}
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.4 }}>
                    {doc.title}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                    Type: <strong style={{ color: '#334155' }}>{doc.documentType}</strong>
                  </div>

                  {/* File preview box */}
                  <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <FileText size={16} color={currentTheme.primary} />
                    <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.fileName}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto', flexShrink: 0 }}>
                      {formatFileSize(doc.fileSizeBytes)}
                    </span>
                  </div>

                  {/* Connected product or order tag */}
                  {doc.productName && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                      Connected Machine: <strong style={{ color: '#0f172a' }}>{doc.productName}</strong>
                    </div>
                  )}
                  {doc.orderReference && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                      Order: <strong style={{ color: '#0f172a' }}>{doc.orderReference}</strong>
                    </div>
                  )}
                </div>

                {/* Footer metadata */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    <span style={{ padding: '1px 6px', borderRadius: '3px', backgroundColor: visBadge.bg, color: visBadge.color, fontWeight: 600 }}>
                      {visBadge.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: currentTheme.primary, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Inspect <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── UPLOAD DOCUMENT MODAL ── */}
      {showUploadModal && (
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
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>Upload New Document</h2>
            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Warranty Policy 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="warranty">Warranty Documents</option>
                    <option value="policies">Terms of Use & Policies</option>
                    <option value="manuals">Product Manuals & Specs</option>
                    <option value="commercial">Commercial Documents</option>
                    <option value="service">Service & Repair Reports</option>
                    <option value="internal">Internal & Company SOPs</option>
                    <option value="compliance">Certificates & Compliance</option>
                    <option value="reports">Reports & Exports</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Document Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Policy / SOP / Manual"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* File Attachment Upload Control */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Document File Attachment *
                </label>
                <div
                  style={{
                    border: selectedFile ? '2px solid #059669' : '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: selectedFile ? '#f0fdf4' : '#f8fafc',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {selectedFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                        <FileText size={24} color="#059669" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{selectedFile.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {formatFileSize(selectedFile.size)} · {selectedFile.type || 'Standard Document'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <label
                          htmlFor="doc-file-upload-input"
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Replace
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setFormFileName('');
                          }}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud size={28} color="#64748b" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                        Choose a file from your device
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        Supported formats: <strong>PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG</strong> (Max: 25 MB)
                      </div>
                      <label
                        htmlFor="doc-file-upload-input"
                        style={{
                          display: 'inline-block',
                          marginTop: '10px',
                          padding: '7px 16px',
                          backgroundColor: currentTheme.primary,
                          color: '#ffffff',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                  <input
                    id="doc-file-upload-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setSelectedFile(file);
                        setFormFileName(file.name);
                        if (!formTitle.trim()) {
                          // Auto-fill title from filename
                          setFormTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Initial Version</label>
                  <input
                    type="text"
                    placeholder="1.0"
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Access Visibility</label>
                  <select
                    value={formVisibility}
                    onChange={(e) => setFormVisibility(e.target.value as any)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="internal">Internal Staff</option>
                    <option value="customer">Customer Shareable</option>
                    <option value="public">Public Portal</option>
                    <option value="restricted">Restricted (Admin Only)</option>
                  </select>
                </div>
              </div>

              {uploadError && (
                <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '12px', marginBottom: '14px' }}>
                  {uploadError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="published">Published</option>
                    <option value="approved">Approved</option>
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Access Visibility</label>
                  <select
                    value={formVisibility}
                    onChange={(e) => setFormVisibility(e.target.value as any)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="internal">Internal Staff</option>
                    <option value="customer">Customer Shareable</option>
                    <option value="public">Public Portal</option>
                    <option value="restricted">Restricted (Admin Only)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="warranty, flip-bbq, legal, 2026"
                  value={formTagString}
                  onChange={(e) => setFormTagString(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Description / Summary</label>
                <textarea
                  rows={3}
                  placeholder="Detailed notes on document purpose or clauses..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 16px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {submitting ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
