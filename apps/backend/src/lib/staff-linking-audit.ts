import { Pool } from 'pg';

export interface StaffLinkAuditReport {
  totalStaff: number;
  totalUsers: number;
  alreadyLinked: Array<{ staffId: string; userId: number; email: string; name: string }>;
  eligibleToLink: Array<{ staffId: string; userId: number; email: string; name: string }>;
  ambiguousMatches: Array<{ email: string; staffIds: string[]; reason: string }>;
  unmatchedUsers: Array<{ userId: number; email: string; role: string }>;
  unmatchedStaff: Array<{ staffId: string; email: string; name: string }>;
}

/**
 * Inspects staff_profiles and users relationships.
 * Produces a dry-run report without mutating database records.
 */
export async function auditStaffUserLinking(pool: Pool): Promise<StaffLinkAuditReport> {
  const staffRes = await pool.query(`
    SELECT id, user_id, TRIM(LOWER(email)) as email, full_name
    FROM staff_profiles
  `);
  const usersRes = await pool.query(`
    SELECT id, TRIM(LOWER(email)) as email, role, name
    FROM users
  `);

  const allStaff = staffRes.rows;
  const allUsers = usersRes.rows;

  const usersByEmail = new Map<string, any[]>();
  for (const u of allUsers) {
    if (!u.email) continue;
    const list = usersByEmail.get(u.email) || [];
    list.push(u);
    usersByEmail.set(u.email, list);
  }

  const staffByEmail = new Map<string, any[]>();
  for (const s of allStaff) {
    if (!s.email) continue;
    const list = staffByEmail.get(s.email) || [];
    list.push(s);
    staffByEmail.set(s.email, list);
  }

  const alreadyLinked: StaffLinkAuditReport['alreadyLinked'] = [];
  const eligibleToLink: StaffLinkAuditReport['eligibleToLink'] = [];
  const ambiguousMatches: StaffLinkAuditReport['ambiguousMatches'] = [];
  const unmatchedUsers: StaffLinkAuditReport['unmatchedUsers'] = [];
  const unmatchedStaff: StaffLinkAuditReport['unmatchedStaff'] = [];

  for (const s of allStaff) {
    if (s.user_id) {
      alreadyLinked.push({
        staffId: s.id,
        userId: s.user_id,
        email: s.email,
        name: s.full_name,
      });
      continue;
    }

    if (!s.email) {
      unmatchedStaff.push({ staffId: s.id, email: '', name: s.full_name });
      continue;
    }

    const matchingStaffWithEmail = staffByEmail.get(s.email) || [];
    if (matchingStaffWithEmail.length > 1) {
      if (!ambiguousMatches.some(a => a.email === s.email)) {
        ambiguousMatches.push({
          email: s.email,
          staffIds: matchingStaffWithEmail.map(m => m.id),
          reason: 'Multiple staff profiles share this email address',
        });
      }
      continue;
    }

    const matchingUsers = usersByEmail.get(s.email) || [];
    if (matchingUsers.length === 1) {
      eligibleToLink.push({
        staffId: s.id,
        userId: matchingUsers[0].id,
        email: s.email,
        name: s.full_name,
      });
    } else if (matchingUsers.length > 1) {
      ambiguousMatches.push({
        email: s.email,
        staffIds: [s.id],
        reason: 'Multiple user accounts match this email address',
      });
    } else {
      unmatchedStaff.push({ staffId: s.id, email: s.email, name: s.full_name });
    }
  }

  for (const u of allUsers) {
    const isLinked = allStaff.some(s => s.user_id === u.id);
    const hasEligible = eligibleToLink.some(e => e.userId === u.id);
    if (!isLinked && !hasEligible) {
      unmatchedUsers.push({ userId: u.id, email: u.email, role: u.role });
    }
  }

  return {
    totalStaff: allStaff.length,
    totalUsers: allUsers.length,
    alreadyLinked,
    eligibleToLink,
    ambiguousMatches,
    unmatchedUsers,
    unmatchedStaff,
  };
}
