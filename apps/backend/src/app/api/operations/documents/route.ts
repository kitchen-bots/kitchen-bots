import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';
import { getStorageProvider } from '@/lib/storage';
import type { BusinessDocument, DocumentMetrics, DocumentDetailResponse } from '@kitchen-bots/types';

const repo = new PostgresOperationsRepository();

function normalizeDocument(row: any): BusinessDocument {
  return {
    id: row.id,
    reference: row.reference,
    title: row.title,
    category: row.category,
    documentType: row.document_type,
    description: row.description || '',
    fileName: row.file_name,
    filePath: row.file_path || '',
    fileSizeBytes: parseInt(row.file_size_bytes || '0', 10),
    fileMimeType: row.file_mime_type || 'application/pdf',
    version: row.version || '1.0',
    status: row.status || 'published',
    visibility: row.visibility || 'internal',
    owner: row.owner || 'Operations Team',
    tags: Array.isArray(row.tags) ? row.tags : [],
    effectiveDate: row.effective_date ? new Date(row.effective_date).toISOString() : undefined,
    expiryDate: row.expiry_date ? new Date(row.expiry_date).toISOString() : undefined,
    productId: row.product_id,
    productName: row.product_name || '',
    productSku: row.product_sku || '',
    orderId: row.order_id,
    orderReference: row.order_reference || '',
    serviceId: row.service_id,
    serviceReference: row.service_reference || '',
    customerEmail: row.customer_email || '',
    customerName: row.customer_name || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

// GET /api/operations/documents
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Unauthorized: Operational credentials required' }, { status: 401 });
  }

  try {
    const pool = (repo as unknown as { pool: { query: Function } }).pool;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const docRes = await pool.query('SELECT * FROM "business_documents" WHERE id = $1', [id]);
      if (docRes.rows.length === 0) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      const document = normalizeDocument(docRes.rows[0]);

      const [versRes, actRes, prodRes, ordRes, srvRes] = await Promise.all([
        pool.query('SELECT * FROM "document_versions" WHERE document_id = $1 ORDER BY created_at DESC', [id]),
        pool.query('SELECT * FROM "document_activity" WHERE document_id = $1 ORDER BY created_at DESC', [id]),
        document.productId ? pool.query('SELECT id, name, sku FROM "products" WHERE id = $1', [document.productId]) : Promise.resolve({ rows: [] }),
        document.orderId ? pool.query('SELECT id, order_number, total_paise, created_at FROM "orders" WHERE id = $1', [document.orderId]) : Promise.resolve({ rows: [] }),
        document.serviceId ? pool.query('SELECT id, reference, subject, type, status FROM "service_cases" WHERE id = $1', [document.serviceId]) : Promise.resolve({ rows: [] }),
      ]);

      const versions = versRes.rows.map((r: any) => ({
        id: r.id,
        documentId: r.document_id,
        version: r.version,
        fileName: r.file_name,
        filePath: r.file_path,
        fileSizeBytes: parseInt(r.file_size_bytes || '0', 10),
        notes: r.notes || '',
        uploadedBy: r.uploaded_by,
        createdAt: new Date(r.created_at).toISOString(),
      }));

      const activities = actRes.rows.map((r: any) => ({
        id: r.id,
        documentId: r.document_id,
        action: r.action,
        details: r.details,
        actor: r.actor,
        createdAt: new Date(r.created_at).toISOString(),
      }));

      const response: DocumentDetailResponse = {
        document,
        versions,
        activities,
        linkedProduct: prodRes.rows[0] || null,
        linkedOrder: ordRes.rows[0] || null,
        linkedService: srvRes.rows[0] || null,
      };

      return NextResponse.json(response);
    }

    // List all documents and compute KPIs
    const docsRes = await pool.query('SELECT * FROM "business_documents" ORDER BY created_at DESC');
    const documents = docsRes.rows.map(normalizeDocument);

    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const metrics: DocumentMetrics = {
      totalDocuments: documents.length,
      publishedApproved: documents.filter((d: BusinessDocument) => ['published', 'approved'].includes(d.status)).length,
      draftDocuments: documents.filter((d: BusinessDocument) => d.status === 'draft').length,
      awaitingReview: documents.filter((d: BusinessDocument) => d.status === 'pending_review').length,
      expiringSoon: documents.filter((d: BusinessDocument) => d.expiryDate && new Date(d.expiryDate).getTime() <= thirtyDaysFromNow && new Date(d.expiryDate).getTime() >= now).length,
      recentlyUpdated: documents.filter((d: BusinessDocument) => new Date(d.updatedAt).getTime() >= sevenDaysAgo).length,
      totalStorageBytes: documents.reduce((acc: number, d: BusinessDocument) => acc + d.fileSizeBytes, 0),
    };

    return NextResponse.json({
      documents,
      metrics,
    });
  } catch (err: any) {
    console.error('Failed to query documents:', err);
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}

import fs from 'fs';
import path from 'path';

// Allowed MIME types and extensions: PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG, JPEG
const ALLOWED_MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function getStorageDir(subDir: string): string {
  const base = path.join(process.cwd(), 'storage', 'documents', subDir);
  if (!fs.existsSync(base)) {
    fs.mkdirSync(base, { recursive: true });
  }
  return base;
}

// POST /api/operations/documents
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Unauthorized: Operational credentials required' }, { status: 401 });
  }

  try {
    const pool = (repo as unknown as { pool: { query: Function } }).pool;
    const userName = (user as any)?.name || user?.email || 'Operations Admin';

    const contentType = req.headers.get('content-type') || '';
    let action = '';
    let body: any = {};
    let uploadedFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      action = (formData.get('action') as string) || '';
      uploadedFile = formData.get('file') as File | null;

      // Extract form fields
      for (const [key, value] of formData.entries()) {
        if (key !== 'file') {
          if (key === 'tags') {
            try {
              body[key] = JSON.parse(value as string);
            } catch {
              body[key] = (value as string).split(',').map(s => s.trim()).filter(Boolean);
            }
          } else {
            body[key] = value;
          }
        }
      }
    } else {
      body = await req.json();
      action = body.action || '';
    }

    if (action === 'create_document') {
      const {
        title, category, documentType, description,
        version, visibility, status, tags, effectiveDate, expiryDate,
        productId, productName, productSku, orderId, orderReference, serviceId, serviceReference,
        customerName, customerEmail
      } = body;

      let fileName = body.fileName || (uploadedFile ? uploadedFile.name : '');
      if (!title || !category || (!fileName && !uploadedFile)) {
        return NextResponse.json({ error: 'Title, category, and file are required' }, { status: 400 });
      }

      let fileMimeType = 'application/pdf';
      let fileSizeBytes = parseInt(body.fileSizeBytes || '0', 10);
      let relativeFilePath = `/documents/${category}/${fileName.replace(/\s+/g, '_')}`;

      let uploadedObjectKey: string | null = null;
      const storageProvider = getStorageProvider();

      if (uploadedFile) {
        fileName = uploadedFile.name;
        fileSizeBytes = uploadedFile.size;

        if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json({ error: `File size exceeds 25 MB limit (${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB)` }, { status: 400 });
        }

        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (!ALLOWED_MIME_TYPES[ext]) {
          return NextResponse.json({ error: `Unsupported file type .${ext}. Allowed formats: PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG` }, { status: 400 });
        }
        fileMimeType = uploadedFile.type || ALLOWED_MIME_TYPES[ext];

        const arrayBuffer = await uploadedFile.arrayBuffer();
        const uploadRes = await storageProvider.upload({
          category,
          filename: fileName,
          data: Buffer.from(arrayBuffer),
          mimeType: fileMimeType,
        });

        uploadedObjectKey = uploadRes.key;
        relativeFilePath = uploadRes.key;
      }

      const prefixMap: Record<string, string> = {
        warranty: 'WAR',
        policies: 'POL',
        manuals: 'MAN',
        commercial: 'COM',
        service: 'SRV',
        compliance: 'CMP',
        internal: 'INT',
        reports: 'REP',
      };
      const prefix = prefixMap[category] || 'DOC';
      const reference = `DOC-${prefix}-${Date.now().toString(36).toUpperCase()}`;

      let created: any;
      try {
        const insertRes = await pool.query(
          `INSERT INTO "business_documents" (
            reference, title, category, document_type, description,
            file_name, file_path, file_size_bytes, file_mime_type, version,
            status, visibility, owner, tags, effective_date, expiry_date,
            product_id, product_name, product_sku,
            order_id, order_reference, service_id, service_reference,
            customer_name, customer_email, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW(), NOW()
          ) RETURNING *`,
          [
            reference, title.trim(), category, documentType || 'Standard Document', description || null,
            fileName.trim(), relativeFilePath, fileSizeBytes, fileMimeType, version || '1.0',
            status || 'published', visibility || 'internal', userName, tags || [],
            effectiveDate ? new Date(effectiveDate) : null, expiryDate ? new Date(expiryDate) : null,
            productId || null, productName || null, productSku || null,
            orderId || null, orderReference || null, serviceId || null, serviceReference || null,
            customerName || null, customerEmail || null
          ]
        );

        created = insertRes.rows[0];

        // Insert version record
        await pool.query(
          `INSERT INTO "document_versions" (document_id, version, file_name, file_path, file_size_bytes, notes, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [created.id, version || '1.0', fileName.trim(), relativeFilePath, fileSizeBytes, 'Initial document upload', userName]
        );

        // Insert audit activity
        await pool.query(
          `INSERT INTO "document_activity" (document_id, action, details, actor)
           VALUES ($1, 'upload', $2, $3)`,
          [created.id, `Uploaded version ${version || '1.0'} (${fileName}) by ${userName}`, userName]
        );
      } catch (dbErr: any) {
        if (uploadedObjectKey) {
          try {
            await storageProvider.delete(uploadedObjectKey);
          } catch (delErr) {
            console.error('Failed to clean up uploaded storage object after DB error:', delErr);
          }
        }
        throw dbErr;
      }

      return NextResponse.json({ success: true, document: normalizeDocument(created) });
    }

    if (action === 'upload_new_version') {
      const { documentId, newVersion, notes } = body;
      let fileName = body.fileName || (uploadedFile ? uploadedFile.name : '');
      if (!documentId || !newVersion || (!fileName && !uploadedFile)) {
        return NextResponse.json({ error: 'documentId, newVersion, and file are required' }, { status: 400 });
      }

      const docCheck = await pool.query('SELECT * FROM "business_documents" WHERE id = $1', [documentId]);
      if (docCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      const existingDoc = docCheck.rows[0];

      let sizeBytes = parseInt(body.fileSizeBytes || '0', 10);
      let relativeFilePath = existingDoc.file_path || `/documents/versions/${fileName.replace(/\s+/g, '_')}`;
      let mimeType = existingDoc.file_mime_type || 'application/pdf';

      let uploadedVersionKey: string | null = null;
      const storageProvider = getStorageProvider();

      if (uploadedFile) {
        fileName = uploadedFile.name;
        sizeBytes = uploadedFile.size;

        if (sizeBytes > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json({ error: `File size exceeds 25 MB limit (${(sizeBytes / (1024 * 1024)).toFixed(1)} MB)` }, { status: 400 });
        }

        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (!ALLOWED_MIME_TYPES[ext]) {
          return NextResponse.json({ error: `Unsupported file type .${ext}. Allowed formats: PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG` }, { status: 400 });
        }
        mimeType = uploadedFile.type || ALLOWED_MIME_TYPES[ext];

        const arrayBuffer = await uploadedFile.arrayBuffer();
        const uploadRes = await storageProvider.upload({
          category: `versions/${existingDoc.category || 'general'}`,
          filename: `v${newVersion}_${fileName}`,
          data: Buffer.from(arrayBuffer),
          mimeType,
        });

        uploadedVersionKey = uploadRes.key;
        relativeFilePath = uploadRes.key;
      }

      try {
        await pool.query(
          `INSERT INTO "document_versions" (document_id, version, file_name, file_path, file_size_bytes, notes, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [documentId, newVersion, fileName.trim(), relativeFilePath, sizeBytes, notes || 'Version upgrade', userName]
        );

        await pool.query(
          `UPDATE "business_documents" SET
             version = $1,
             file_name = $2,
             file_path = $3,
             file_size_bytes = $4,
             file_mime_type = $5,
             updated_at = NOW()
           WHERE id = $6`,
          [newVersion, fileName.trim(), relativeFilePath, sizeBytes, mimeType, documentId]
        );

        await pool.query(
          `INSERT INTO "document_activity" (document_id, action, details, actor)
           VALUES ($1, 'version_upgrade', $2, $3)`,
          [documentId, `Uploaded new version ${newVersion} (${fileName}). Notes: ${notes || 'No notes'}`, userName]
        );
      } catch (dbErr: any) {
        if (uploadedVersionKey) {
          try {
            await storageProvider.delete(uploadedVersionKey);
          } catch (delErr) {
            console.error('Failed to clean up uploaded version storage object after DB error:', delErr);
          }
        }
        throw dbErr;
      }

      return NextResponse.json({ success: true, version: newVersion });
    }

    if (action === 'update_status') {
      const { documentId, status } = body;
      if (!documentId || !status) {
        return NextResponse.json({ error: 'documentId and status are required' }, { status: 400 });
      }

      await pool.query(
        'UPDATE "business_documents" SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, documentId]
      );

      await pool.query(
        `INSERT INTO "document_activity" (document_id, action, details, actor)
         VALUES ($1, 'status_change', $2, $3)`,
        [documentId, `Document status changed to ${status.toUpperCase()}`, userName]
      );

      return NextResponse.json({ success: true, status });
    }

    if (action === 'update_metadata') {
      const { documentId, title, description, visibility, tags, effectiveDate, expiryDate } = body;
      if (!documentId || !title) {
        return NextResponse.json({ error: 'documentId and title are required' }, { status: 400 });
      }

      await pool.query(
        `UPDATE "business_documents" SET
           title = $1,
           description = $2,
           visibility = $3,
           tags = $4,
           effective_date = $5,
           expiry_date = $6,
           updated_at = NOW()
         WHERE id = $7`,
        [
          title.trim(),
          description || null,
          visibility || 'internal',
          tags || [],
          effectiveDate ? new Date(effectiveDate) : null,
          expiryDate ? new Date(expiryDate) : null,
          documentId
        ]
      );

      await pool.query(
        `INSERT INTO "document_activity" (document_id, action, details, actor)
         VALUES ($1, 'metadata_update', 'Document metadata and classification updated', $2)`,
        [documentId, userName]
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Failed POST documents:', err);
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}
