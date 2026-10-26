import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';

const repo = new PostgresOperationsRepository();

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  // Only Admin and Operations roles can list or manage users
  if (!authorizeRole(user, ['admin', 'operations'])) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const role = searchParams.get('role') || undefined;
  const linkedStatus = (searchParams.get('linkedStatus') as 'linked' | 'unlinked' | 'all') || 'all';
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const data = await repo.getUsersList({
      search,
      role,
      linkedStatus,
      limit,
      offset,
    });
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch users';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  // Only Admin can modify user roles and sensitive account settings
  if (!authorizeRole(user, ['admin'])) {
    return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, role, name, phone, company, staffProfileId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Role validation
    const validRoles = ['admin', 'operations', 'hr', 'finance', 'editor', 'employee', 'customer'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    // Protection: Prevent admin from de-admining themselves or locking themselves out
    if (Number(userId) === Number(user.id) && role && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: You cannot revoke your own administrator privileges.' }, { status: 403 });
    }

    const updated = await repo.updateUserRoleAndLink({
      userId: Number(userId),
      role,
      name,
      phone,
      company,
      staffProfileId,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
