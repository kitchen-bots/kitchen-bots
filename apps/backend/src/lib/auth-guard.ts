import { NextRequest } from 'next/server';
import crypto from 'crypto';

export interface AuthenticatedUser {
  id: number | string;
  email: string;
  name?: string;
  role: 'admin' | 'operations' | 'hr' | 'finance' | 'editor' | 'employee' | 'customer';
}

/**
 * Validates a JWT using Node's standard crypto module (HS256)
 * without requiring external npm packages.
 */
function verifyJwtToken(token: string, secret: string): { id: number | string; email: string; role?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToSign = `${headerB64}.${payloadB64}`;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(dataToSign)
      .digest('base64url');

    if (signatureB64 !== expectedSignature) {
      return null;
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    // Check expiration if present
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the authenticated user from the Request headers/cookies.
 * Accepts:
 * 1. Authorization: Bearer <token>
 * 2. Authorization: JWT <token>
 * 3. Cookie: payload-token=<token>
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthenticatedUser | null> {
  const rawSecret = process.env.PAYLOAD_SECRET;
  if (!rawSecret) {
    if (process.env.NODE_ENV === 'production') {
      // In production, never fallback to a predictable default secret
      return null;
    }
  }

  const effectiveSecret = rawSecret || (process.env.NODE_ENV !== 'production' ? 'dev-local-only-payload-secret-key-32ch' : '');
  if (!effectiveSecret) {
    return null;
  }

  // Canonical Payload CMS secret key: SHA-256 of raw secret sliced to 32 hex chars
  const canonicalSecret = crypto.createHash('sha256').update(effectiveSecret).digest('hex').slice(0, 32);

  let token: string | null = null;

  // 1. Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (authHeader.startsWith('JWT ')) {
      token = authHeader.substring(4).trim();
    }
  }

  // 2. Fallback to Cookie
  if (!token) {
    const cookieToken = req.cookies.get('payload-token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) {
    return null;
  }

  // Verify against canonical Payload signing key
  const payload = verifyJwtToken(token, canonicalSecret);
  if (!payload || !payload.id || !payload.email) {
    return null;
  }

  let role = (payload.role as AuthenticatedUser['role']);

  // If role is not encoded in JWT payload (Payload CMS 3 standard token structure), query DB
  if (!role) {
    try {
      const { Pool } = await import('pg');
      const dbUri = process.env.DATABASE_URI || 'postgresql://postgres:postgres@127.0.0.1:5432/kitchen_bots';
      const isRemote = dbUri.includes('supabase.com') || dbUri.includes('pooler');
      const cleanUri = isRemote ? dbUri.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/\?$/, '') : dbUri;
      const pool = new Pool({
        connectionString: cleanUri,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        max: 2,
      });
      const res = await pool.query('SELECT role FROM users WHERE id = $1 LIMIT 1', [payload.id]);
      await pool.end();
      if (res.rows.length > 0 && res.rows[0].role) {
        role = res.rows[0].role;
      }
    } catch {
      // Fallback
    }
  }

  return {
    id: payload.id,
    email: payload.email,
    role: role || 'customer',
  };
}

/**
 * Ensures the caller is authenticated and possesses the required role.
 */
export function authorizeRole(
  user: AuthenticatedUser | null,
  allowedRoles: Array<AuthenticatedUser['role']> = ['admin', 'operations']
): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
