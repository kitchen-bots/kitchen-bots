import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';

const repo = new PostgresOperationsRepository();

// Helper to sanitize HTML and prevent XSS (removes <script>, javascript: handlers, inline onload/onerror)
function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/href="javascript:[^"]*"/gi, 'href="#"')
    .replace(/href='javascript:[^']*'/gi, "href='#'");
}

// GET /api/operations/email/inbound - List received emails for authorized staff
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Unauthorized: Staff credentials required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;

  try {
    const emails = await repo.getInboundEmails({ status });
    return NextResponse.json({ emails, count: emails.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query emails';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/operations/email/inbound
// Handles:
// 1. Webhook delivery from Inbound Email Providers (Resend, SendGrid, Postmark, AWS SES, or custom webhook)
// 2. Staff actions: 'mark_read', 'mark_unread', 'archive'
export async function POST(req: NextRequest) {
  // Check if this is a staff management action or an incoming webhook
  const authHeader = req.headers.get('authorization');
  const cookieHeader = req.headers.get('cookie');
  const signatureHeader = req.headers.get('x-webhook-signature') || req.headers.get('x-resend-signature') || req.headers.get('x-postmark-signature');

  // Case A: Staff action on existing email
  if (cookieHeader || (authHeader && !signatureHeader)) {
    const user = await authenticateRequest(req);
    if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const body = await req.json();
      const { action, emailId, status } = body;

      if (action === 'update_status' && emailId && status) {
        const updated = await repo.updateInboundEmailStatus(emailId, status);
        return NextResponse.json({ success: true, email: updated });
      }

      return NextResponse.json({ error: 'Invalid staff email action' }, { status: 400 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  // Case B: Inbound Webhook from external mail provider
  const rawBody = await req.text();
  const webhookSecret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;

  // If secret configured, verify HMAC SHA256 signature
  if (webhookSecret) {
    if (!signatureHeader) {
      return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 401 });
    }

    const hmac = crypto.createHmac('sha256', webhookSecret);
    const calculatedSignature = hmac.update(rawBody).digest('hex');

    // Secure timing-safe buffer comparison
    const sigBuf = Buffer.from(signatureHeader.replace(/^sha256=/, ''), 'hex');
    const calcBuf = Buffer.from(calculatedSignature, 'hex');

    if (sigBuf.length !== calcBuf.length || !crypto.timingSafeEqual(sigBuf, calcBuf)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 403 });
    }
  }

  try {
    const payload = JSON.parse(rawBody);

    // Normalize payload across standard providers (Resend / SendGrid / Postmark / generic)
    const messageId =
      payload.message_id ||
      payload.MessageID ||
      payload.id ||
      payload.headers?.['message-id'] ||
      `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const fromAddress =
      payload.from?.email ||
      payload.From ||
      payload.from ||
      payload.sender ||
      'unknown@sender.com';

    const fromName =
      payload.from?.name ||
      payload.FromName ||
      (typeof payload.from === 'string' && payload.from.includes('<') ? payload.from.split('<')[0].trim() : null);

    const toAddress =
      payload.to?.[0]?.email ||
      payload.to ||
      payload.To ||
      payload.recipient ||
      'contact@kitchenbots.in';

    const subject = payload.subject || payload.Subject || '(No Subject)';
    const bodyText = payload.text || payload.TextBody || payload.body || '';
    const rawHtml = payload.html || payload.HtmlBody || '';
    const bodyHtml = sanitizeHtml(rawHtml);

    // Parse attachments metadata if present
    const rawAttachments = payload.attachments || payload.Attachments || [];
    const attachments = Array.isArray(rawAttachments)
      ? rawAttachments.map((att: any) => ({
          filename: att.filename || att.Name || 'attachment',
          contentType: att.content_type || att.ContentType || 'application/octet-stream',
          size: att.size || att.ContentLength || 0,
          url: att.url || null,
        }))
      : [];

    const result = await repo.saveInboundEmail({
      messageId,
      fromAddress: String(fromAddress),
      fromName: fromName ? String(fromName) : undefined,
      toAddress: String(toAddress),
      subject: String(subject),
      bodyText: String(bodyText),
      bodyHtml: bodyHtml ? String(bodyHtml) : undefined,
      attachments,
    });

    return NextResponse.json({
      success: true,
      emailId: result.email.id,
      duplicate: result.duplicate,
    }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook parsing failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
