'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';

interface SecureFileUploadProps {
  onUploadSuccess: (fileInfo: { id: string; url: string; originalFilename: string }) => void;
  category?: 'receipt' | 'ticket' | 'payslip' | 'task';
  referenceId?: string;
  allowedTypes?: string[];
  maxSizeMB?: number;
  label?: string;
  currentFileUrl?: string;
  onRemove?: () => void;
}

export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  onUploadSuccess,
  category = 'receipt',
  referenceId,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxSizeMB = 5,
  label = 'Upload Document or Receipt',
  currentFileUrl,
  onRemove,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ id: string; url: string; originalFilename: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);

    // Validate type
    if (!allowedTypes.includes(file.type)) {
      setUploadError(`Invalid format. Allowed: JPG, PNG, WebP, PDF.`);
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setUploadError(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (referenceId) {
        formData.append('referenceId', referenceId);
      }

      const res = await fetch('/api/operations/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      const result = {
        id: data.attachmentId,
        url: data.url,
        originalFilename: data.originalFilename,
      };
      setUploadedFile(result);
      onUploadSuccess(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div style={{ width: '100%', marginBottom: '14px' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
          {label}
        </label>
      )}

      {uploadedFile || currentFileUrl ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <FileText size={16} color="#0284c7" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {uploadedFile?.originalFilename || 'Attached File'}
            </span>
            <span style={{ fontSize: '11px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CheckCircle2 size={12} /> Securely Attached
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={uploadedFile?.url || currentFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '11px', color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}
            >
              View
            </a>
            <button
              type="button"
              onClick={clearFile}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
              title="Remove file"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? '#0284c7' : '#cbd5e1'}`,
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            backgroundColor: isDragging ? 'rgba(2, 132, 199, 0.04)' : '#fafafa',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.2s',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
            style={{ display: 'none' }}
            disabled={isUploading}
          />

          {isUploading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#0284c7', fontSize: '12px', fontWeight: 600 }}>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Uploading secure attachment...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Upload size={18} color="#64748b" />
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                Drag & drop or <span style={{ color: '#0284c7' }}>browse file</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                JPG, PNG, WebP, or PDF up to {maxSizeMB}MB
              </div>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>
          <AlertCircle size={12} />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};
