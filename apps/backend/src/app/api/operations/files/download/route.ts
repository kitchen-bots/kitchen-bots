import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-guard';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import path from 'path';
import fs from 'fs/promises';

const repo = new PostgresOperationsRepository();
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'attachments');

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const attachmentId = searchParams.get('id');

  if (!attachmentId) {
    return NextResponse.json({ error: 'Missing attachment ID' }, { status: 400 });
  }

  try {
    const attachment = await repo.getSecureAttachment(attachmentId);
    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const staff = await repo.getStaffProfileByAuth(user.id, user.email);
    const userRole = (user.role || '').toLowerCase();
    const isStaffUploader = staff && attachment.uploaded_by_staff_id === staff.id;
    const isUserUploader = String(attachment.uploaded_by_user_id) === String(user.id);
    const isPrivilegedRole = ['admin', 'hr', 'finance', 'operations'].includes(userRole);

    // Enforce Authorization:
    // Only the uploader or privileged administrative roles can access
    if (!isUserUploader && !isStaffUploader && !isPrivilegedRole) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view or download this attachment' },
        { status: 403 }
      );
    }

    // Role-specific check:
    // Only finance or admin can download payslips and financial files if not the employee themselves
    if (attachment.category === 'payslip' && !isStaffUploader && !['admin', 'hr', 'finance'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges for payroll documents' },
        { status: 403 }
      );
    }

    const { privateStorage } = await import('@/lib/private-storage');
    const fileBuffer = await privateStorage.get(attachment.stored_filename);
    if (!fileBuffer) {
      return NextResponse.json({ error: 'File content missing from storage' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': attachment.mime_type,
        'Content-Length': String(attachment.size_bytes),
        'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.original_filename)}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Download failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
