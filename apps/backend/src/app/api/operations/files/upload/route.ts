import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-guard';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const repo = new PostgresOperationsRepository();
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'attachments');

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'receipt';
    const referenceId = formData.get('referenceId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, WebP, and PDF are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds maximum allowed size of 5MB.' },
        { status: 400 }
      );
    }

    // Get staff profile if user is linked
    const staff = await repo.getStaffProfileByAuth(user.id, user.email);

    // Generate safe unique stored filename
    const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.png');
    const storedId = `att-${crypto.randomUUID()}`;
    const storedFilename = `${storedId}${ext}`;

    // Save file through private storage abstraction (Local Disk in dev, R2/S3 in Vercel)
    const { privateStorage } = await import('@/lib/private-storage');
    const buffer = Buffer.from(await file.arrayBuffer());
    await privateStorage.save({
      storedFilename,
      buffer,
      mimeType: file.type,
    });

    // Save attachment record in PostgreSQL
    const attachment = await repo.saveSecureAttachment({
      id: storedId,
      originalFilename: file.name,
      storedFilename,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedByUserId: String(user.id),
      uploadedByStaffId: staff ? staff.id : undefined,
      category: category as 'receipt' | 'ticket' | 'payslip' | 'task',
      referenceId: referenceId || undefined,
    });

    const secureUrl = `/api/operations/files/download?id=${storedId}`;

    return NextResponse.json({
      success: true,
      attachmentId: storedId,
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size,
      url: secureUrl,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
