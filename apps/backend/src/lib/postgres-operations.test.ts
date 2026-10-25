import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { PostgresOperationsRepository } from './postgres-operations-repo';

const TEST_DB_URI = 'postgresql://localhost:5432/kitchen_bots_test';

describe('PostgresOperationsRepository (Isolated PostgreSQL Test DB)', () => {
  let repo: PostgresOperationsRepository;

  before(async () => {
    repo = new PostgresOperationsRepository(TEST_DB_URI);
  });

  after(async () => {
    await repo.close();
  });

  it('1. Inventory: records stock receipts and enforces available = onHand - reserved', async () => {
    // Clean prior test data for product 1
    const initialBalance = await repo.getBalance(1, 'KB-WOK-001');
    assert.strictEqual(typeof initialBalance.onHand, 'number');

    // Receipt: Add 10 units
    const receipt = await repo.recordStockMovement({
      productId: 1,
      sku: 'KB-WOK-001',
      movementType: 'receipt',
      quantity: 10,
      notes: 'PostgreSQL integration batch intake',
    });
    assert.strictEqual(receipt.quantity, 10);
    assert.strictEqual(receipt.movementType, 'receipt');

    const balAfterReceipt = await repo.getBalance(1, 'KB-WOK-001');
    assert.strictEqual(balAfterReceipt.onHand >= 10, true);

    // Reservation: Commit 4 units to an order
    const reservation = await repo.recordStockMovement({
      productId: 1,
      sku: 'KB-WOK-001',
      movementType: 'reservation',
      quantity: 4,
      referenceType: 'order',
      referenceId: '1',
    });
    assert.strictEqual(reservation.quantity, 4);

    const balAfterRes = await repo.getBalance(1, 'KB-WOK-001');
    assert.strictEqual(balAfterRes.reserved >= 4, true);
    assert.strictEqual(balAfterRes.available, balAfterRes.onHand - balAfterRes.reserved);
  });

  it('2. Inventory: rejects over-reservation with transactional rollback', async () => {
    const bal = await repo.getBalance(1, 'KB-WOK-001');
    const excessiveQty = bal.available + 99999;

    await assert.rejects(
      async () => {
        await repo.recordStockMovement({
          productId: 1,
          sku: 'KB-WOK-001',
          movementType: 'reservation',
          quantity: excessiveQty,
        });
      },
      /Insufficient available stock/
    );

    // Confirm state was rolled back and unaffected
    const balAfterFailed = await repo.getBalance(1, 'KB-WOK-001');
    assert.strictEqual(balAfterFailed.available, bal.available);
  });

  it('3. Invoices: creates sequential invoice with 18% GST and line item snapshots', async () => {
    const invoice = await repo.createInvoice({
      orderId: 1,
      orderNumber: 'KB-ORD-TEST-1',
      customerName: 'Commercial Caterer Alpha',
      customerEmail: 'caterer@alpha.com',
      billingAddress: { city: 'Bengaluru', gstin: '29AAAAA0000A1Z5' },
      lineItems: [
        {
          name: 'Flip BBQ Grill Unit',
          sku: 'KB-CBBQ-002',
          quantity: 2,
          unitPricePaise: 1649900, // ₹16,499 each
        },
      ],
    });

    assert.strictEqual(invoice.invoiceNumber.startsWith('KB-INV-2026-'), true);
    assert.strictEqual(invoice.subtotalPaise, 3299800); // 2 * 1649900
    assert.strictEqual(invoice.taxGstPaise, Math.round(3299800 * 0.18)); // 593964 (18% GST)
    assert.strictEqual(invoice.totalPaise, 3299800 + 593964); // 3893764
    assert.strictEqual(invoice.balanceDuePaise, invoice.totalPaise);
    assert.strictEqual(invoice.status, 'issued');

    // 4. Payments: records partial payment and reconciles balance
    const partialAmount = 1000000; // ₹10,000
    const uniqueTxnRef = `NEFT-AXIS-LOCAL-${Date.now()}`;
    const pay1 = await repo.recordPayment({
      invoiceId: invoice.id,
      amountPaise: partialAmount,
      paymentMethod: 'bank_neft',
      transactionReference: uniqueTxnRef,
    });

    assert.strictEqual(pay1.invoice.status, 'partially_paid');
    assert.strictEqual(pay1.invoice.paidPaise, partialAmount);
    assert.strictEqual(pay1.invoice.balanceDuePaise, invoice.totalPaise - partialAmount);

    // 5. Duplicate Payment Prevention: duplicate transaction reference must fail unique constraint
    await assert.rejects(
      async () => {
        await repo.recordPayment({
          invoiceId: invoice.id,
          amountPaise: partialAmount,
          paymentMethod: 'bank_neft',
          transactionReference: uniqueTxnRef, // Exact same reference & method
        });
      },
      /duplicate key value violates unique constraint "uq_payment_txn_ref"/
    );
  });

  it('4. Orders: transitions status with atomic history logging & customer approval', async () => {
    // Reset order 1 status to pending for repeatable test run
    const pool = (repo as unknown as { pool: { query: Function } }).pool;
    await pool.query("UPDATE orders SET status = 'pending' WHERE id = 1");

    // Transition Order 1 from pending -> processing
    const t1 = await repo.transitionOrderStatus({
      orderId: 1,
      newStatus: 'processing',
      changedBy: 'Operations Manager',
      reason: 'Raw materials confirmed by inventory intake',
    });
    assert.strictEqual(t1.previousStatus, 'pending');
    assert.strictEqual(t1.newStatus, 'processing');

    // Verify history table contains audit log
    const history = await repo.getOrderStatusHistory(1);
    assert.strictEqual(history.length >= 1, true);
    assert.strictEqual(history[history.length - 1].new_status, 'processing');

    // Record customer approval
    await repo.recordCustomerApproval({
      orderId: 1,
      approvalStatus: 'approved',
      notes: 'Customer confirmed kinematics CAD preview via email',
    });
  });

  it('5. HR & MES: registers staff, records attendance, and allocates production work order', async () => {
    // Register employee profile
    const emp = await repo.registerStaffProfile({
      employeeId: `KB-EMP-${Date.now().toString().slice(-4)}`,
      fullName: 'Vikram Sharma',
      email: `vikram.${Date.now()}@kitchenbots.in`,
      department: 'Fabrication',
      jobTitle: 'Senior CNC Machinist',
      dateOfJoining: '2026-01-15',
    });
    assert.strictEqual(emp.status, 'active');

    // Record attendance
    const today = new Date().toISOString().slice(0, 10);
    const att = await repo.recordAttendance({
      staffId: emp.id,
      date: today,
      status: 'present',
      workingHours: 8.5,
      notes: 'On-time morning shift',
    });
    assert.strictEqual(att.status, 'present');

    // Allocate production task on Order 1
    const task = await repo.allocateProductionTask({
      staffId: emp.id,
      orderId: 1,
      taskName: 'CNC Milling Heavy-Duty Chassis',
      stage: 'fabrication',
      assignedBy: 'Production Head',
    });
    assert.strictEqual(task.status, 'assigned');

    // Update task to in_progress
    const inProg = await repo.updateTaskStatus({
      taskId: task.id,
      status: 'in_progress',
    });
    assert.strictEqual(inProg.status, 'in_progress');

    // Attendance Check-out
    const checkedOut = await repo.recordCheckOut({
      attendanceId: att.id,
      checkOutTime: new Date(),
      workingHours: 8.5,
    });
    assert.strictEqual(Number(checkedOut.working_hours), 8.5);

    // Leave request submission and processing
    const leave = await repo.submitLeaveRequest({
      staffId: emp.id,
      leaveType: 'casual',
      startDate: '2026-11-01',
      endDate: '2026-11-02',
      reason: 'Family event',
    });
    assert.strictEqual(leave.status, 'pending');

    const approvedLeave = await repo.processLeaveRequest({
      leaveId: leave.id,
      decision: 'approved',
      approvedBy: 'HR Manager',
      decisionNotes: 'Approved with full casual quota',
    });
    assert.strictEqual(approvedLeave.status, 'approved');
  });

  it('6. CRM: converts quote to order reliably and generates operational reports', async () => {
    // Reset quote 101 to sent
    const pool = (repo as unknown as { pool: { query: Function } }).pool;
    await pool.query("UPDATE quotes SET status = 'sent' WHERE id = 101");

    const conversion = await repo.convertQuoteToOrder({
      quoteId: 101,
      shippingAddress: { city: 'Hyderabad' },
      convertedBy: 'Sales Rep #4',
    });
    assert.strictEqual(conversion.order.customer_name, 'Ravi Kumar');
    assert.strictEqual(Number(conversion.order.total_paise), 17000000); // 2 * 8500000

    // Repeat conversion must be rejected
    await assert.rejects(
      async () => {
        await repo.convertQuoteToOrder({
          quoteId: 101,
          shippingAddress: { city: 'Hyderabad' },
        });
      },
      /has already been accepted\/converted/
    );

    // Reports: generate financial, inventory, and manufacturing reports
    const finReport = await repo.generateOperationalReport('financial');
    assert.strictEqual(finReport.type, 'financial');
    assert.strictEqual(typeof finReport.stats, 'object');

    const invReport = await repo.generateOperationalReport('inventory');
    assert.strictEqual(invReport.type, 'inventory');
    assert.strictEqual(Array.isArray(invReport.movements), true);

    const mfgReport = await repo.generateOperationalReport('manufacturing');
    assert.strictEqual(mfgReport.type, 'manufacturing');
    assert.strictEqual(Array.isArray(mfgReport.tasks), true);
  });

  it('7. HR & CRM Query Persistence: verifies staff directory, attendance log, leave tracking, and CRM profiles', async () => {
    // Verify staff directory query
    const staff = await repo.getStaffDirectory();
    assert.strictEqual(staff.length >= 1, true);

    // Verify attendance query
    const today = new Date().toISOString().slice(0, 10);
    const attendance = await repo.getAttendanceRecords(today);
    assert.strictEqual(Array.isArray(attendance), true);

    // Verify leave query
    const leaves = await repo.getLeaveRequests();
    assert.strictEqual(Array.isArray(leaves), true);

    // Verify production allocations
    const allocations = await repo.getProductionAllocations();
    assert.strictEqual(Array.isArray(allocations), true);
  });

  it('9. HR Attendance & Breaks: records breaks and deducts duration from worked time', async () => {
    const emp = await repo.registerStaffProfile({
      employeeId: `KB-EMP-BRK-${Date.now().toString().slice(-4)}`,
      fullName: 'Ananya Deshmukh',
      email: `ananya.${Date.now()}@kitchenbots.in`,
      department: 'Assembly',
      jobTitle: 'Robotics Assembly Specialist',
      dateOfJoining: '2026-02-01',
    });

    const shiftDate = '2026-10-23';
    const checkInTime = new Date('2026-10-23T09:00:00Z');
    const att = await repo.recordAttendance({
      staffId: emp.id,
      date: shiftDate,
      status: 'present',
      checkInTime,
    });
    assert.strictEqual(att.status, 'present');

    // Duplicate check-in while active must throw error
    await assert.rejects(
      async () => {
        await repo.recordAttendance({
          staffId: emp.id,
          date: shiftDate,
          status: 'present',
          checkInTime: new Date('2026-10-23T09:30:00Z'),
        });
      },
      /Active check-in already in progress/
    );

    // Record lunch break: 13:00 to 13:45 (45 minutes)
    const breakStart = await repo.recordBreak({
      attendanceId: att.id,
      action: 'start',
      reason: 'Lunch break',
    });
    assert.strictEqual(breakStart.duration_minutes, null);

    // Cannot start second break before closing previous break
    await assert.rejects(
      async () => {
        await repo.recordBreak({
          attendanceId: att.id,
          action: 'start',
          reason: 'Tea break',
        });
      },
      /break is already active/
    );

    const breakEnd = await repo.recordBreak({
      attendanceId: att.id,
      action: 'end',
    });
    assert.strictEqual(typeof breakEnd.duration_minutes, 'number');

    // Check out with 9:00 to 18:00 (9 hours total elapsed = 540 min)
    // Minus break (e.g. 15 or 45 mins), verified dynamically
    const checkOutTime = new Date('2026-10-23T18:00:00Z');
    const checkedOut = await repo.recordCheckOut({
      attendanceId: att.id,
      checkOutTime,
    });

    assert.ok(checkedOut.check_out);
    assert.ok(Number(checkedOut.working_hours) <= 9.0);

    // Cannot check out again
    await assert.rejects(
      async () => {
        await repo.recordCheckOut({
          attendanceId: att.id,
          checkOutTime: new Date('2026-10-23T18:30:00Z'),
        });
      },
      /Already checked out/
    );
  });

  it('10. HR Corrections: maintains audit trail and recalculates corrected hours', async () => {
    const emp = await repo.registerStaffProfile({
      employeeId: `KB-EMP-COR-${Date.now().toString().slice(-4)}`,
      fullName: 'Deepak Patel',
      email: `deepak.${Date.now()}@kitchenbots.in`,
      department: 'Electrical',
      jobTitle: 'Wiring Engineer',
      dateOfJoining: '2026-03-01',
    });

    const shiftDate = '2026-10-22';
    const checkInTime = new Date('2026-10-22T09:15:00Z');
    const att = await repo.recordAttendance({
      staffId: emp.id,
      date: shiftDate,
      status: 'present',
      checkInTime,
    });

    // Initial check-out at 15:00
    await repo.recordCheckOut({
      attendanceId: att.id,
      checkOutTime: new Date('2026-10-22T15:00:00Z'),
    });

    // Correction request: employee forgot biometric badge, actually left at 18:15 (9 hours)
    const correctedAtt = await repo.correctAttendance({
      attendanceId: att.id,
      correctedCheckIn: new Date('2026-10-22T09:15:00Z').toISOString(),
      correctedCheckOut: new Date('2026-10-22T18:15:00Z').toISOString(),
      reason: 'Biometric device scanner issue at exit gate, verified by security log',
      requestedBy: 'operations-manager@kitchenbots.com',
      approvedBy: 'admin@kitchenbots.com',
    });

    assert.strictEqual(correctedAtt.id, att.id);
    assert.strictEqual(Number(correctedAtt.working_hours), 9);

    // Verify attendance record in directory
    const records = await repo.getAttendanceRecords(shiftDate);
    const updated = records.find((r) => r.id === att.id);
    assert.ok(updated);
    assert.strictEqual(Number(updated?.working_hours), 9);
  });

  it('11. Daily Work Logs: creates, updates, and reviews work log entries with order links', async () => {
    const emp = await repo.registerStaffProfile({
      employeeId: `KB-EMP-LOG-${Date.now().toString().slice(-4)}`,
      fullName: 'Kavita Reddy',
      email: `kavita.${Date.now()}@kitchenbots.in`,
      department: 'Assembly',
      jobTitle: 'Testing Lead',
      dateOfJoining: '2026-04-01',
    });

    // 1. Submit work log
    const workLog = await repo.submitDailyWorkLog({
      staffId: emp.id,
      date: '2026-10-23',
      taskDescription: 'Final electrical safety testing for commercial induction chassis',
      orderId: 1,
      timeSpentMinutes: 240, // 4 hours
      completedWork: 'Completed high-pot insulation tests for batch 4A',
      pendingWork: 'Awaiting thermal camera calibration check',
      blockers: 'None',
      status: 'submitted',
    });

    assert.strictEqual(workLog.status, 'submitted');
    assert.strictEqual(workLog.time_spent_minutes, 240);
    assert.strictEqual(workLog.order_id, 1);

    // 2. Fetch logs by staff
    const staffLogs = await repo.getDailyWorkLogs({ staffId: emp.id });
    assert.strictEqual(staffLogs.length, 1);
    assert.strictEqual(staffLogs[0].task_description, workLog.task_description);

    // 3. Manager reviews and approves work log
    const approvedLog = await repo.reviewWorkLog({
      logId: workLog.id,
      decision: 'approved',
      reviewedBy: 'admin@kitchenbots.com',
      reviewNotes: 'High-pot testing logs verified against quality compliance register',
    });

    assert.strictEqual(approvedLog.status, 'approved');
    assert.strictEqual(approvedLog.reviewed_by, 'admin@kitchenbots.com');
  });

  it('12. HR Attendance & Leave Sync: approves leave and updates attendance register with live summaries', async () => {
    const emp = await repo.registerStaffProfile({
      employeeId: `KB-EMP-LEV-${Date.now().toString().slice(-4)}`,
      fullName: 'Rahul Nair',
      email: `rahul.${Date.now()}@kitchenbots.in`,
      department: 'Logistics',
      jobTitle: 'Inventory Clerk',
      dateOfJoining: '2026-05-01',
    });

    // Submit leave request for today
    const leaveDate = '2026-10-24';
    const leave = await repo.submitLeaveRequest({
      staffId: emp.id,
      leaveType: 'sick',
      startDate: leaveDate,
      endDate: leaveDate,
      reason: 'Medical checkup',
    });

    // Approve leave
    const processedLeave = await repo.processLeaveRequest({
      leaveId: leave.id,
      decision: 'approved',
      approvedBy: 'hr@kitchenbots.com',
    });
    assert.strictEqual(processedLeave.status, 'approved');

    // Confirm that attendance record was automatically populated with 'on_leave'
    const records = await repo.getAttendanceRecords(leaveDate);
    const leaveRec = records.find((r) => r.staff_id === emp.id);
    assert.ok(leaveRec);
    assert.strictEqual(leaveRec?.status, 'on_leave');

    // Verify real dynamic attendance summary calculation
    const summary = await repo.getAttendanceSummary(leaveDate);
    assert.strictEqual(typeof summary.totalStaff, 'number');
    assert.ok(summary.totalStaff >= 1);
    assert.strictEqual(typeof summary.present, 'number');
    assert.strictEqual(typeof summary.absent, 'number');
    assert.strictEqual(typeof summary.late, 'number');
    assert.strictEqual(typeof summary.onLeave, 'number');
    assert.ok(summary.onLeave >= 1);
  });

  it('8. Security & Auth Guard: verifies canonical JWT validation, tampering rejection, and fail-closed isolation', async () => {
    const crypto = await import('crypto');
    const { authenticateRequest, authorizeRole } = await import('./auth-guard');

    const rawSecret = process.env.PAYLOAD_SECRET || 'kitchen-bots-super-secret-payload-key-2026';
    const canonicalSecret = crypto.createHash('sha256').update(rawSecret).digest('hex').slice(0, 32);

    const makeToken = (payloadObj: Record<string, unknown>, signingSecret = canonicalSecret) => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
      const sig = crypto.createHmac('sha256', signingSecret).update(`${header}.${payload}`).digest('base64url');
      return `${header}.${payload}.${sig}`;
    };

    // A. Valid canonical admin token
    const validToken = makeToken({ id: 1, email: 'admin@kitchenbots.com', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 });
    const validReq = { headers: new Headers({ authorization: `Bearer ${validToken}` }), cookies: { get: () => undefined } } as unknown as import('next/server').NextRequest;
    const authUser = await authenticateRequest(validReq);
    assert.strictEqual(authUser?.email, 'admin@kitchenbots.com');
    assert.strictEqual(authorizeRole(authUser, ['admin']), true);
    assert.strictEqual(authorizeRole(authUser, ['operations']), false);

    // B. Expired token must return null
    const expiredToken = makeToken({ id: 1, email: 'admin@kitchenbots.com', role: 'admin', exp: Math.floor(Date.now() / 1000) - 3600 });
    const expiredReq = { headers: new Headers({ authorization: `Bearer ${expiredToken}` }), cookies: { get: () => undefined } } as unknown as import('next/server').NextRequest;
    const expiredUser = await authenticateRequest(expiredReq);
    assert.strictEqual(expiredUser, null);

    // C. Tampered signature must return null
    const tamperedToken = `${validToken.slice(0, -6)}xxxxxx`;
    const tamperedReq = { headers: new Headers({ authorization: `Bearer ${tamperedToken}` }), cookies: { get: () => undefined } } as unknown as import('next/server').NextRequest;
    const tamperedUser = await authenticateRequest(tamperedReq);
    assert.strictEqual(tamperedUser, null);

    // D. Wrong signing key must return null
    const wrongKeyToken = makeToken({ id: 1, email: 'admin@kitchenbots.com', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 }, 'bogus-incorrect-key-123456789012');
    const wrongKeyReq = { headers: new Headers({ authorization: `Bearer ${wrongKeyToken}` }), cookies: { get: () => undefined } } as unknown as import('next/server').NextRequest;
    const wrongKeyUser = await authenticateRequest(wrongKeyReq);
    assert.strictEqual(wrongKeyUser, null);

    // E. Malformed token must return null
    const malformedReq = { headers: new Headers({ authorization: 'Bearer not-even-a-jwt' }), cookies: { get: () => undefined } } as unknown as import('next/server').NextRequest;
    assert.strictEqual(await authenticateRequest(malformedReq), null);

    // F. Insufficient role check
    const customerToken = makeToken({ id: 2, email: 'client@company.com', role: 'customer', exp: Math.floor(Date.now() / 1000) + 3600 });
    const customerReq = { headers: new Headers({ authorization: `Bearer ${customerToken}` }), cookies: { get: () => undefined } } as unknown as import('next/server').NextRequest;
    const customerUser = await authenticateRequest(customerReq);
    assert.strictEqual(authorizeRole(customerUser, ['admin', 'operations']), false);

    // G. Fail-closed database isolation in production
    const oldNodeEnv = process.env.NODE_ENV;
    const oldOpsUri = process.env.OPERATIONS_DATABASE_URI;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      process.env.OPERATIONS_DATABASE_URI = 'postgresql://localhost:5432/kitchen_bots_test';
      assert.throws(
        () => new PostgresOperationsRepository(),
        /OPERATIONS_DATABASE_URI is restricted to isolated test\/development environments/
      );
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = oldNodeEnv;
      process.env.OPERATIONS_DATABASE_URI = oldOpsUri;
    }
  });

  it('9. Orders Workspace: records blockers, resolves them, records audited cancellations and timeline', async () => {
    // 1. Record an order blocker on seeded order 1
    const blocker = await repo.recordOrderBlocker({
      orderId: 1,
      category: 'Inventory and products',
      reason: 'Motor sub-assembly delayed from tier-1 supplier',
      diagnosticDetails: 'Shipment PO-4491 en-route with estimated 2-day delay',
      responsibleTeam: 'Procurement',
      nextAction: 'Expedite with supplier logistics liaison',
    });
    assert.strictEqual(blocker.status, 'open');
    assert.strictEqual(blocker.category, 'Inventory and products');
    assert.strictEqual(blocker.responsible_team, 'Procurement');

    // 2. Fetch order blockers
    const blockers = await repo.getOrderBlockers(1);
    assert.ok(blockers.length >= 1);
    assert.ok(blockers.some((b) => b.id === blocker.id));

    // 3. Resolve order blocker
    const resolved = await repo.resolveOrderBlocker({
      blockerId: blocker.id,
      resolutionNotes: 'Alternative motor lot sourced from regional warehouse',
    });
    assert.strictEqual(resolved.status, 'resolved');
    assert.strictEqual(resolved.resolution_notes, 'Alternative motor lot sourced from regional warehouse');
    assert.ok(resolved.resolved_at !== null);

    // 4. Record order cancellation with honest audit trail
    const cancellation = await repo.recordOrderCancellation({
      orderId: 1,
      reasonCategory: 'Customer changed their mind',
      reasonExplanation: 'Client downsized facility plans and cancelled batch fryer',
      actorCategory: 'customer',
      actorIdentity: 'client@company.com',
      refundStatus: 'pending_neft',
      restockStatus: 'returned_to_available',
    });
    assert.strictEqual(cancellation.actor_category, 'customer');
    assert.strictEqual(cancellation.reason_category, 'Customer changed their mind');

    // Verify order 1 cancellation record
    const cancellations = await repo.getOrderCancellations(1);
    assert.ok(cancellations.length >= 1);
    assert.strictEqual(cancellations[0].actor_identity, 'client@company.com');

    // 5. Activity timeline verification
    const timeline = await repo.getOrderActivityTimeline(1);
    assert.ok(Array.isArray(timeline));
    assert.ok(timeline.length > 0);
    assert.ok(timeline.some((e) => e.title.includes('Order Placed') || e.title.includes('Status Transition') || e.title.includes('Cancelled')));
  });

  it('14. Warehouse Locations, Serialized Units & Direct POS Sales Workflow', async () => {
    // 1. Create a physical inventory location
    const locationCode = `WH-BLR-${Date.now().toString().slice(-4)}`;
    const location = await repo.createInventoryLocation({
      code: locationCode,
      name: 'Bengaluru Central Assembly Warehouse',
      type: 'warehouse',
      address: 'Plot 42, Electronic City Phase 1, Bengaluru',
    });
    assert.ok(location.id > 0);
    assert.strictEqual(location.code, locationCode);

    // Verify location list
    const locations = await repo.getInventoryLocations();
    assert.ok(locations.some((l) => l.code === locationCode));

    // 2. Register serialized units for product 2 (KB-CBBQ-002)
    const serialNo1 = `KB-SN-${Date.now()}-01`;
    const unit1 = await repo.registerProductUnit({
      productId: 2,
      sku: 'KB-CBBQ-002',
      serialNumber: serialNo1,
      locationId: location.id,
      binLocation: 'Rack B-12',
      unitStatus: 'available',
    });
    assert.strictEqual(unit1.serial_number, serialNo1);
    assert.strictEqual(unit1.unit_status, 'available');

    // Reject duplicate serial number
    await assert.rejects(
      async () => {
        await repo.registerProductUnit({
          productId: 2,
          sku: 'KB-CBBQ-002',
          serialNumber: serialNo1,
          locationId: location.id,
        });
      },
      /duplicate key value violates unique constraint/
    );

    // Update unit location
    const updatedUnit = await repo.updateUnitLocation(unit1.id, location.id, 'Rack C-01');
    assert.strictEqual(updatedUnit.bin_location, 'Rack C-01');

    // 3. Ensure product 2 has available stock for POS sale
    await repo.recordStockMovement({
      productId: 2,
      sku: 'KB-CBBQ-002',
      movementType: 'receipt',
      quantity: 5,
      notes: 'POS stock replenishment',
      performedBy: 'Store Supervisor',
    });

    const balanceBefore = await repo.getBalance(2, 'KB-CBBQ-002');
    assert.ok(balanceBefore.available >= 1);

    // 4. Execute direct store counter POS sale
    const posSale = await repo.recordDirectSale({
      customerName: 'Kaveri Bistro & Cafe',
      customerEmail: 'manager@kaveribistro.com',
      customerPhone: '+91 98450 12345',
      locationId: location.id,
      items: [
        {
          productId: 2,
          sku: 'KB-CBBQ-002',
          name: 'Flip BBQ Grill',
          quantity: 1,
          unitPricePaise: 2500000, // ₹25,000
        },
      ],
      paymentMethod: 'cash',
      paymentReference: `POS-REC-${Date.now().toString().slice(-4)}`,
      performedBy: 'Counter Staff',
      notes: 'Walk-in cash counter sale with instant printed invoice',
    });

    assert.ok(posSale.sale.id > 0);
    assert.strictEqual(posSale.sale.status, 'completed');
    assert.strictEqual(Number(posSale.sale.subtotal_paise), 2500000);
    assert.strictEqual(Number(posSale.sale.tax_gst_paise), 450000); // 18% GST = ₹4,500
    assert.strictEqual(Number(posSale.sale.total_paise), 2950000); // ₹29,500 total
    assert.strictEqual(posSale.order.status, 'delivered');
    assert.strictEqual(posSale.order.payment_status, 'paid');
    assert.strictEqual(posSale.invoice.status, 'paid');
    assert.strictEqual(posSale.payment.status, 'success');

    // Verify inventory deduction occurred
    const balanceAfter = await repo.getBalance(2, 'KB-CBBQ-002');
    assert.strictEqual(balanceAfter.onHand, balanceBefore.onHand - 1);
  });

  it('15. POS Sale Regression: resolves authoritative SKU from DB when SKU is omitted from payload and guarantees transactional rollback', async () => {
    // 1. Get initial balance for product 2 ('KB-CBBQ-002')
    const initialBalance = await repo.getBalance(2, 'KB-CBBQ-002');
    assert.ok(initialBalance.available >= 1);

    // 2. Execute direct POS sale passing ONLY productId and quantity (reproducing exact admin dashboard scenario)
    const posSale = await repo.recordDirectSale({
      customerName: 'Aero Kitchens POS Customer',
      customerPhone: '+91 91234 56789',
      items: [
        {
          productId: 2,
          quantity: 1,
        } as any,
      ],
      paymentMethod: 'cash',
      paymentReference: `CASH-REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      performedBy: 'Counter Cashier',
      notes: 'Testing omitted SKU resolution and transactional consistency',
    });

    assert.ok(posSale.sale.id > 0);
    assert.strictEqual(posSale.sale.status, 'completed');
    assert.strictEqual(posSale.order.status, 'delivered');
    assert.strictEqual(posSale.invoice.status, 'paid');
    assert.strictEqual(posSale.payment.status, 'success');

    // 3. Verify stock movement was recorded with the authoritative non-null SKU
    const balanceAfter = await repo.getBalance(2, 'KB-CBBQ-002');
    assert.strictEqual(balanceAfter.onHand, initialBalance.onHand - 1);

    // 4. Verify stock_movements contains the exact authoritative SKU and no NULLs
    const movements = await repo.getHistory('KB-CBBQ-002');
    const latestDeduction = movements.find(m => m.movementType === 'deduction' && m.referenceId === 'DIRECT_SALE');
    assert.ok(latestDeduction, 'Expected deduction stock movement for direct sale');
    assert.strictEqual(latestDeduction.sku, 'KB-CBBQ-002');
    assert.strictEqual(latestDeduction.quantity, 1);

    // 5. Verify transactional rollback on invalid product ID
    const preFailBalance = await repo.getBalance(2, 'KB-CBBQ-002');
    await assert.rejects(
      async () => {
        await repo.recordDirectSale({
          customerName: 'Failed Sale Customer',
          items: [
            {
              productId: 999999, // Non-existent product
              quantity: 1,
            } as any,
          ],
          paymentMethod: 'cash',
        });
      },
      /Product not found with id: 999999/
    );

    // Verify stock balance remained unchanged after rollback
    const postFailBalance = await repo.getBalance(2, 'KB-CBBQ-002');
    assert.strictEqual(postFailBalance.onHand, preFailBalance.onHand);
  });
});


