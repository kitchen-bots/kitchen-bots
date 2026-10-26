import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';
import { getStorageProvider } from '@/lib/storage';

const repo = new PostgresOperationsRepository();

// GET /api/operations/documents/download?id=123&version=1.0
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const requestedVersion = searchParams.get('version');

  if (!id) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
  }

  try {
    const pool = (repo as unknown as { pool: { query: Function } }).pool;
    const docRes = await pool.query('SELECT * FROM "business_documents" WHERE id = $1', [id]);

    if (docRes.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = docRes.rows[0];

    // Check visibility permissions
    const isPublic = doc.visibility === 'public' && doc.status === 'published';

    if (!isPublic) {
      const user = await authenticateRequest(req);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized: Authentication required to access internal or restricted documents.' }, { status: 401 });
      }

      if (doc.visibility === 'restricted' && !authorizeRole(user, ['admin'])) {
        return NextResponse.json({ error: 'Forbidden: Admin access required for restricted document.' }, { status: 403 });
      }
    }

    // Determine target file
    let targetFileName = doc.file_name;
    let targetFilePath = doc.file_path;

    if (requestedVersion && requestedVersion !== doc.version) {
      const verRes = await pool.query(
        'SELECT * FROM "document_versions" WHERE document_id = $1 AND version = $2',
        [id, requestedVersion]
      );
      if (verRes.rows.length > 0) {
        targetFileName = verRes.rows[0].file_name;
        targetFilePath = verRes.rows[0].file_path;
      }
    }

    // Download via shared storage provider
    const storageProvider = getStorageProvider();
    const downloadRes = await storageProvider.download(
      targetFilePath || targetFileName,
      targetFileName,
      doc.file_mime_type || 'application/pdf'
    );

    if (downloadRes) {
      const headers = new Headers({
        'Content-Type': downloadRes.mimeType || 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(downloadRes.filename)}"`,
        'Cache-Control': 'private, no-cache',
      });

      if (downloadRes.sizeBytes) {
        headers.set('Content-Length', downloadRes.sizeBytes.toString());
      }

      return new NextResponse(downloadRes.stream as any, {
        headers,
      });
    }

    return NextResponse.json({
      error: 'File object not found on configured storage',
      fileName: targetFileName,
      reference: doc.reference,
    }, { status: 404 });

  } catch (err: any) {
    console.error('File delivery error:', err);
    return NextResponse.json({ error: 'Internal server error during document download' }, { status: 500 });
  }
}
