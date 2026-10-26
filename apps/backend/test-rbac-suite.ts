import crypto from 'crypto';
import { Client } from 'pg';

const BASE_URL = 'http://localhost:3001';
const DB_URI = 'postgresql://localhost:5432/kitchen_bots_test';
const RAW_SECRET = 'dev-local-only-payload-secret-key-32ch';
const CANONICAL_SECRET = crypto.createHash('sha256').update(RAW_SECRET).digest('hex').slice(0, 32);

function generateJwt(user: { id: number; email: string; role: string }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    collection: 'users',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', CANONICAL_SECRET)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');
  return `${b64Header}.${b64Payload}.${signature}`;
}

const ROLES = {
  admin: { id: 1, email: 'admin@kitchenbots.com', role: 'admin' },
  hr: { id: 103, email: 'hr.user@kitchenbots.test', role: 'hr' },
  finance: { id: 102, email: 'finance.user@kitchenbots.test', role: 'finance' },
  operations: { id: 104, email: 'ops.user@kitchenbots.test', role: 'operations' },
  editor: { id: 105, email: 'editor.user@kitchenbots.test', role: 'editor' },
  employee1: { id: 100, email: 'rbac.test.employee@kitchenbots.test', role: 'employee' },
  employee2: { id: 101, email: 'bob.builder@kitchenbots.test', role: 'employee' },
  customer: { id: 106, email: 'customer.user@kitchenbots.test', role: 'customer' },
};

const TOKENS = Object.fromEntries(
  Object.entries(ROLES).map(([key, user]) => [key, generateJwt(user)])
);

const results: Array<{ test: string; status: 'PASS' | 'FAIL'; details: string }> = [];

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ test: name, status: 'PASS', details: 'All assertions satisfied' });
    console.log(`[PASS] ${name}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ test: name, status: 'FAIL', details: msg });
    console.error(`[FAIL] ${name} -> ${msg}`);
  }
}

async function main() {
  console.log('=== STARTING AUTOMATED RBAC & DATA INTEGRITY TEST SUITE ===\n');
  const db = new Client({ connectionString: DB_URI });
  await db.connect();

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Unauthenticated session rejected on protected operations endpoints
    // -------------------------------------------------------------------------
    await runTest('1. Unauthenticated request to /api/operations/hr is rejected (HTTP 401)', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/hr?tab=staff`);
      if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
      }
    });

    // -------------------------------------------------------------------------
    // TEST 2: Customer role rejected on operations HR endpoints
    // -------------------------------------------------------------------------
    await runTest('2. Customer role denied access to /api/operations/hr (HTTP 403)', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/hr?tab=staff`, {
        headers: { Authorization: `Bearer ${TOKENS.customer}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403, got ${res.status}`);
      }
    });

    // -------------------------------------------------------------------------
    // TEST 3: Editor role rejected on employee portal mutating endpoints
    // -------------------------------------------------------------------------
    await runTest('3. Editor role denied access to /api/operations/employee (HTTP 403/404)', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/employee`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKENS.editor}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'check_in' }),
      });
      if (res.status !== 403 && res.status !== 404) {
        throw new Error(`Expected 403 or 404, got ${res.status}`);
      }
    });

    // -------------------------------------------------------------------------
    // TEST 4: Admin authorized on /api/operations/hr
    // -------------------------------------------------------------------------
    await runTest('4. Admin role granted access to /api/operations/hr (HTTP 200)', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/hr?tab=staff`, {
        headers: { Authorization: `Bearer ${TOKENS.admin}` },
      });
      if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data.staff)) {
        throw new Error('Expected staff array in response body');
      }
    });

    // -------------------------------------------------------------------------
    // TEST 5: HR authorized on /api/operations/hr
    // -------------------------------------------------------------------------
    await runTest('5. HR role granted access to /api/operations/hr (HTTP 200)', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/hr?tab=staff`, {
        headers: { Authorization: `Bearer ${TOKENS.hr}` },
      });
      if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}`);
      }
    });

    // -------------------------------------------------------------------------
    // TEST 6: Employee 1 updating own task (HTTP 200)
    // -------------------------------------------------------------------------
    await runTest('6. Employee 1 updates own assigned task (task-test-emp1) -> HTTP 200', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/employee`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKENS.employee1}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_task_progress',
          taskId: 'task-test-emp1',
          status: 'completed',
        }),
      });
      if (res.status !== 200) {
        const body = await res.text();
        throw new Error(`Expected 200, got ${res.status}: ${body}`);
      }
      // Verify database mutation succeeded
      const check = await db.query('SELECT status FROM production_task_allocations WHERE id = $1', ['task-test-emp1']);
      if (check.rows[0]?.status !== 'completed') {
        throw new Error(`Database task status expected 'completed', got '${check.rows[0]?.status}'`);
      }
    });

    // -------------------------------------------------------------------------
    // TEST 7: Cross-employee task modification returns intentional HTTP 403 (NOT 500)
    //         AND database record remains completely unchanged
    // -------------------------------------------------------------------------
    await runTest('7. Cross-employee task tampering: Employee 1 attempts to modify Employee 2 task (task-test-emp2) -> HTTP 403 & No DB Mutation', async () => {
      // Capture state before tampering
      const before = await db.query('SELECT status, blocker_reason FROM production_task_allocations WHERE id = $1', ['task-test-emp2']);
      const originalStatus = before.rows[0]?.status;

      const res = await fetch(`${BASE_URL}/api/operations/employee`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKENS.employee1}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_task_progress',
          taskId: 'task-test-emp2',
          status: 'blocked',
          blockerReason: 'Tampered blocker message',
        }),
      });

      // MUST return 403, absolutely NEVER 500
      if (res.status !== 403) {
        const body = await res.text();
        throw new Error(`Expected intentional HTTP 403 Forbidden, but received HTTP ${res.status}: ${body}`);
      }

      // CRITICAL: Database integrity assertion - verify no side effects on denied mutation
      const after = await db.query('SELECT status, blocker_reason FROM production_task_allocations WHERE id = $1', ['task-test-emp2']);
      if (after.rows[0]?.status !== originalStatus || after.rows[0]?.blocker_reason === 'Tampered blocker message') {
        throw new Error(`Database integrity violated: Tampered task was modified despite rejection!`);
      }
    });

    // -------------------------------------------------------------------------
    // TEST 8: File Upload & Role-Scoped Download
    // -------------------------------------------------------------------------
    let testAttachmentId = '';
    await runTest('8. Secure file upload via privateStorage abstraction (HTTP 200)', async () => {
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      const fileContent = 'Sample private invoice/receipt text content for automated test.';
      const body =
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="test_receipt.png"\r\n` +
        `Content-Type: image/png\r\n\r\n` +
        `${fileContent}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="category"\r\n\r\n` +
        `receipt\r\n` +
        `--${boundary}--\r\n`;

      const res = await fetch(`${BASE_URL}/api/operations/files/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKENS.employee1}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      if (res.status !== 200) {
        const text = await res.text();
        throw new Error(`Expected 200, got ${res.status}: ${text}`);
      }
      const data = await res.json();
      testAttachmentId = data.attachmentId;
      if (!testAttachmentId) throw new Error('No attachment ID returned');
    });

    await runTest('9. Authorized file download by uploader Employee 1 (HTTP 200)', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/files/download?id=${testAttachmentId}`, {
        headers: { Authorization: `Bearer ${TOKENS.employee1}` },
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    await runTest('10. Authorized file download by Admin role (HTTP 200)', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/files/download?id=${testAttachmentId}`, {
        headers: { Authorization: `Bearer ${TOKENS.admin}` },
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    await runTest('11. Unauthorized file download by different Employee 2 is blocked (HTTP 403)', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/files/download?id=${testAttachmentId}`, {
        headers: { Authorization: `Bearer ${TOKENS.employee2}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for cross-employee file download, got ${res.status}`);
      }
    });

    // -------------------------------------------------------------------------
    // TEST 12: User Management Endpoint Authorization
    // -------------------------------------------------------------------------
    await runTest('12. User listing permitted for Admin (HTTP 200)', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/users`, {
        headers: { Authorization: `Bearer ${TOKENS.admin}` },
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.users)) throw new Error('Expected data.users array');
      if (!data.stats) throw new Error('Expected data.stats summary');
    });

    await runTest('13. User listing denied for Employee role (HTTP 403)', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/users`, {
        headers: { Authorization: `Bearer ${TOKENS.employee1}` },
      });
      if (res.status !== 403) throw new Error(`Expected 403 Forbidden for employee, got ${res.status}`);
    });

    await runTest('14. Admin role assignment update (PATCH /api/operations/users -> HTTP 200)', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/users`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${TOKENS.admin}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 105, // Catalog Editor
          role: 'editor',
          name: 'Updated Catalog Editor',
        }),
      });
      if (res.status !== 200) {
        const text = await res.text();
        throw new Error(`Expected 200, got ${res.status}: ${text}`);
      }
      const data = await res.json();
      if (data.user?.name !== 'Updated Catalog Editor') {
        throw new Error(`Expected name 'Updated Catalog Editor', got '${data.user?.name}'`);
      }
    });

    await runTest('15. Admin self-revocation protection prevents removing own admin role (HTTP 403)', async () => {
      const res = await fetch(`${BASE_URL}/api/operations/users`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${TOKENS.admin}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1, // Admin itself
          role: 'customer',
        }),
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden on self-revocation attempt, got ${res.status}`);
      }
      // Assert DB admin record role remains admin
      const check = await db.query('SELECT role FROM users WHERE id = 1');
      if (check.rows[0]?.role !== 'admin') {
        throw new Error(`Database corrupted: Admin role was modified!`);
      }
    });

  } finally {
    await db.end();
  }

  console.log('\n=== SUMMARY OF RBAC & INTEGRITY TEST RESULTS ===');
  console.table(results);
  const failed = results.filter(r => r.status === 'FAIL');
  if (failed.length > 0) {
    console.error(`\nSuite FAILED: ${failed.length} test(s) failed.`);
    process.exit(1);
  } else {
    console.log(`\nSuite PASSED: All ${results.length} tests passed successfully!`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
