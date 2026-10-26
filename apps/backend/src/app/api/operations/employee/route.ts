import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';

const repo = new PostgresOperationsRepository();

/**
 * GET /api/operations/employee
 * Returns ONLY the authenticated employee's own records:
 * - Profile details (contact, department, role, employment dates)
 * - Attendance history & today's punch status
 * - Submitted Daily Work Logs
 * - Leave Applications
 * - Expense Claims
 * - Payslips
 */
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  // Resolve employee identity linked to this user
  const staff = await repo.getStaffProfileByAuth(user.id, user.email);
  if (!staff) {
    return NextResponse.json(
      {
        error: 'Employee profile not linked',
        message: 'No staff record found matching authenticated user account. Please contact HR.',
        user: { id: user.id, email: user.email, role: user.role },
      },
      { status: 404 }
    );
  }

  const staffId = staff.id;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [attendanceHistory, workLogs, leaves, expenses, payslips, tasks, tickets, todayAttendance] = await Promise.all([
      repo.getEmployeeAttendanceHistory(staffId, 30),
      repo.getDailyWorkLogs({ staffId }),
      repo.getLeaveRequests(undefined, staffId),
      repo.getExpenses({ staffId }),
      repo.getEmployeePayslips(staffId),
      repo.getEmployeeTasks(staffId),
      repo.getEmployeeTickets({ staffId }),
      repo.getAttendanceRecords(today),
    ]);

    const myTodayRecord = todayAttendance.find((a: any) => a.staff_id === staffId) || null;

    // Mask sensitive account number for security
    const sanitizedProfile = { ...staff };
    if (sanitizedProfile.bank_details && typeof sanitizedProfile.bank_details === 'object') {
      const bank = { ...sanitizedProfile.bank_details };
      if (bank.accountNumber) {
        const acc = String(bank.accountNumber);
        bank.accountNumber = acc.length > 4 ? `••••••••${acc.slice(-4)}` : '••••••••';
      }
      sanitizedProfile.bank_details = bank;
    }

    return NextResponse.json({
      success: true,
      profile: sanitizedProfile,
      todayAttendance: myTodayRecord,
      attendanceHistory,
      workLogs,
      leaves,
      expenses,
      payslips,
      tasks,
      tickets,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Employee retrieval failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/operations/employee
 * Self-service actions for employees strictly bound to session identity:
 * - check_in: Clock into shift
 * - check_out: Clock out of shift
 * - submit_work_log: Submit daily log
 * - request_leave: Submit leave request
 * - submit_expense: Submit reimbursement claim
 * - update_task_progress: Update assigned task status/blocker
 * - create_ticket: Raise helpdesk ticket
 * - reply_ticket: Reply to an existing ticket
 */
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  // Derive employee identity from session
  const staff = await repo.getStaffProfileByAuth(user.id, user.email);
  if (!staff) {
    return NextResponse.json(
      { error: 'Forbidden: No linked employee record found for authenticated user' },
      { status: 403 }
    );
  }

  const staffId = staff.id;

  try {
    const body = await req.json();
    const { action } = body;

    // 1. Employee Clock In
    if (action === 'check_in') {
      const { workCategory = 'Operations', notes } = body;
      const today = new Date().toISOString().slice(0, 10);
      try {
        const record = await repo.recordAttendance({
          staffId,
          date: today,
          status: 'present',
          notes: notes ? `[Self Check-In] ${notes}` : `[Self Check-In] Category: ${workCategory}`,
        });
        return NextResponse.json({ success: true, record });
      } catch (checkInErr: any) {
        if (checkInErr.message && checkInErr.message.includes('Active check-in already in progress')) {
          return NextResponse.json({ error: 'You are already clocked in for today.' }, { status: 400 });
        }
        throw checkInErr;
      }
    }

    // 2. Employee Clock Out
    if (action === 'check_out') {
      const today = new Date().toISOString().slice(0, 10);
      const records = await repo.getAttendanceRecords(today);
      const myRecord = records.find((a: any) => a.staff_id === staffId);
      if (!myRecord) {
        return NextResponse.json({ error: 'No active check-in record found for today' }, { status: 400 });
      }
      if (myRecord.check_out) {
        return NextResponse.json({ error: 'Check-out already recorded for today' }, { status: 400 });
      }
      const record = await repo.recordCheckOut(myRecord.id);
      return NextResponse.json({ success: true, record });
    }

    // 3. Employee Submit Daily Work Log
    if (action === 'submit_work_log') {
      const { date, taskDescription, timeSpentMinutes = 480, completedWork, pendingWork, blockers, orderId } = body;
      if (!taskDescription || !taskDescription.trim()) {
        return NextResponse.json({ error: 'Task description is required' }, { status: 400 });
      }
      const log = await repo.submitDailyWorkLog({
        staffId, // Enforced server-side
        date: date || new Date().toISOString().slice(0, 10),
        taskDescription: taskDescription.trim(),
        timeSpentMinutes: Number(timeSpentMinutes) || 480,
        completedWork,
        pendingWork,
        blockers,
        orderId,
      });
      return NextResponse.json({ success: true, workLog: log }, { status: 201 });
    }

    // 4. Employee Request Leave
    if (action === 'request_leave') {
      const { leaveType, startDate, endDate, reason } = body;
      if (!leaveType || !startDate || !endDate || !reason?.trim()) {
        return NextResponse.json({ error: 'All leave application fields are required' }, { status: 400 });
      }
      if (new Date(endDate) < new Date(startDate)) {
        return NextResponse.json({ error: 'End date cannot be earlier than start date' }, { status: 400 });
      }

      // Normalize leaveType to allowed database check values: 'casual' | 'sick' | 'earned' | 'unpaid'
      const rawType = String(leaveType).toLowerCase().trim();
      let normalizedType: 'casual' | 'sick' | 'earned' | 'unpaid' = 'casual';
      if (rawType.includes('sick')) normalizedType = 'sick';
      else if (rawType.includes('earned') || rawType.includes('annual')) normalizedType = 'earned';
      else if (rawType.includes('unpaid') || rawType.includes('loss')) normalizedType = 'unpaid';
      else normalizedType = 'casual';

      const leave = await repo.submitLeaveRequest({
        staffId, // Enforced server-side
        leaveType: normalizedType,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      return NextResponse.json({ success: true, leave }, { status: 201 });
    }

    // 5. Employee Submit Expense Claim
    if (action === 'submit_expense') {
      const { category, amountRupees, expenseDate, description, receiptUrl } = body;
      if (!category || !amountRupees || !expenseDate || !description?.trim()) {
        return NextResponse.json({ error: 'Category, amount, date, and description required' }, { status: 400 });
      }
      const parsedAmount = parseFloat(amountRupees);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: 'Valid expense amount required' }, { status: 400 });
      }
      const expense = await repo.createExpense({
        staffId, // Enforced server-side
        claimantName: staff.full_name,
        category,
        amountPaise: Math.round(parsedAmount * 100),
        currency: 'INR',
        expenseDate,
        description: description.trim(),
        receiptUrl,
      });
      return NextResponse.json({ success: true, expense }, { status: 201 });
    }

    // 6. Employee Update Assigned Task Progress
    if (action === 'update_task_progress') {
      const { taskId, status, blockerReason } = body;
      if (!taskId || !status) {
        return NextResponse.json({ error: 'Task ID and status required' }, { status: 400 });
      }
      if (!['in_progress', 'completed', 'blocked'].includes(status)) {
        return NextResponse.json({ error: 'Invalid task status. Must be in_progress, completed, or blocked.' }, { status: 400 });
      }
      try {
        const updated = await repo.updateTaskStatusForEmployee({
          taskId,
          staffId, // Server enforces task belongs to caller
          status,
          blockerReason,
        });
        return NextResponse.json({ success: true, task: updated });
      } catch (taskErr: unknown) {
        const taskMsg = taskErr instanceof Error ? taskErr.message : 'Task update failed';
        if (taskMsg.includes('not assigned') || taskMsg.includes('not found')) {
          return NextResponse.json({ error: `Forbidden: ${taskMsg}` }, { status: 403 });
        }
        throw taskErr;
      }
    }

    // 7. Employee Raise Support Ticket
    if (action === 'create_ticket') {
      const { category, subject, description, priority = 'medium', attachmentUrl } = body;
      if (!category || !subject?.trim() || !description?.trim()) {
        return NextResponse.json({ error: 'Category, subject, and description are required' }, { status: 400 });
      }
      const ticket = await repo.createEmployeeTicket({
        staffId, // Enforced server-side
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        attachmentUrl,
      });
      return NextResponse.json({ success: true, ticket }, { status: 201 });
    }

    // 8. Employee Reply to Ticket
    if (action === 'reply_ticket') {
      const { ticketId, message, attachmentUrl } = body;
      if (!ticketId || !message?.trim()) {
        return NextResponse.json({ error: 'Ticket ID and message are required' }, { status: 400 });
      }
      // Verify ownership before replying
      const ticket = await repo.getTicketWithMessages(ticketId, staffId);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found or unauthorized' }, { status: 404 });
      }
      const reply = await repo.addTicketMessage({
        ticketId,
        senderType: 'employee',
        senderId: staffId,
        senderName: staff.full_name,
        message: message.trim(),
        attachmentUrl,
      });
      return NextResponse.json({ success: true, message: reply }, { status: 201 });
    }

    return NextResponse.json({ error: `Unknown employee action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Operation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
