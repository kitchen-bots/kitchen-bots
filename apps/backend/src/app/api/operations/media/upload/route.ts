import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import path from 'path';
import fs from 'fs';

const repo = new PostgresOperationsRepository();

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

// POST /api/operations/media/upload
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Unauthorized: Operational credentials required' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const altText = (formData.get('alt') as string) || '';
    const productId = formData.get('productId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Image exceeds maximum allowed size of 10 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB)` },
        { status: 400 }
      );
    }

    const filename = file.name;
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_IMAGE_TYPES[ext]) {
      return NextResponse.json(
        { error: `Unsupported image format .${ext}. Allowed formats: JPG, JPEG, PNG, WEBP` },
        { status: 400 }
      );
    }

    const mimeType = file.type || ALLOWED_IMAGE_TYPES[ext];

    // Upload using shared storage provider
    const { getStorageProvider } = await import('@/lib/storage');
    const storageProvider = getStorageProvider();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let publicUrl: string;

    if (storageProvider.providerName === 'r2') {
      const uploadRes = await storageProvider.upload({
        category: 'products',
        filename,
        data: buffer,
        mimeType,
      });
      publicUrl = uploadRes.publicUrl || `/api/operations/documents/download?key=${encodeURIComponent(uploadRes.key)}`;
    } else {
      // Local provider: save to public/images/products for static web server delivery
      const sanitizedBase = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeFilename = `${Date.now()}_${sanitizedBase}.${ext}`;
      const targetDir = path.resolve(process.cwd(), 'public/images/products');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(path.join(targetDir, safeFilename), buffer);

      // Mirror to storefront/public/images/products/ if running in local monorepo
      const storefrontTargetDir = path.resolve(process.cwd(), '../storefront/public/images/products');
      try {
        if (!fs.existsSync(storefrontTargetDir)) {
          fs.mkdirSync(storefrontTargetDir, { recursive: true });
        }
        fs.writeFileSync(path.join(storefrontTargetDir, safeFilename), buffer);
      } catch {
        // Non-blocking if storefront directory differs
      }

      publicUrl = `/images/products/${safeFilename}`;
    }

    // Record in media table for catalog synchronization
    let mediaId: number | string | null = null;
    try {
      const pool = (repo as unknown as { pool: { query: Function } }).pool;
      await pool.query(`
        CREATE TABLE IF NOT EXISTS media (
          id SERIAL PRIMARY KEY,
          alt VARCHAR(255),
          caption VARCHAR(255),
          url VARCHAR(500),
          filename VARCHAR(255),
          mime_type VARCHAR(100),
          filesize NUMERIC,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      const mediaInsert = await pool.query(
        `INSERT INTO media (alt, caption, url, filename, mime_type, filesize, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, url, filename, filesize`,
        [altText || filename, `Product image ${productId ? `for product #${productId}` : ''}`, publicUrl, filename, mimeType, file.size]
      );
      if (mediaInsert.rows && mediaInsert.rows[0]) {
        mediaId = mediaInsert.rows[0].id;
      }
    } catch (dbErr) {
      console.warn('Non-fatal media catalog registration warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      mediaId,
      url: publicUrl,
      filename,
      mimeType,
      size: file.size,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Image upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
