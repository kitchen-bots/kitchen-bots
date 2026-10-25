import { NextRequest, NextResponse } from 'next/server';
import { PostgresOperationsRepository } from '@/lib/postgres-operations-repo';
import { authenticateRequest, authorizeRole } from '@/lib/auth-guard';

const repo = new PostgresOperationsRepository();

// GET /api/operations/hr?tab=staff|attendance|leaves|allocations|work_logs|summary&date=...&status=...&staffId=...
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations', 'editor'])) {
    return NextResponse.json({ error: 'Unauthorized: Operational role required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get('tab') || 'staff';
  const date = searchParams.get('date') || undefined;
  const status = searchParams.get('status') || undefined;
  const staffId = searchParams.get('staffId') || undefined;

  try {
    if (tab === 'attendance') {
      const records = await repo.getAttendanceRecords(date);
      return NextResponse.json({ records });
    }

    if (tab === 'summary') {
      const summary = await repo.getAttendanceSummary(date);
      return NextResponse.json({ summary });
    }

    if (tab === 'work_logs') {
      const logs = await repo.getDailyWorkLogs({ staffId, date, status });
      return NextResponse.json({ logs });
    }

    if (tab === 'leaves') {
      const leaves = await repo.getLeaveRequests(status);
      return NextResponse.json({ leaves });
    }

    if (tab === 'allocations') {
      const allocations = await repo.getProductionAllocations();
      return NextResponse.json({ allocations });
    }

    // Default: staff directory
    const staff = await repo.getStaffDirectory();
    return NextResponse.json({ staff });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'HR retrieval failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/operations/hr
// Action: 'register_staff' | 'check_in' | 'check_out' | 'record_break' | 'correct_attendance' | 'submit_work_log' | 'review_work_log' | 'request_leave' | 'process_leave' | 'allocate_task'
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!authorizeRole(user, ['admin', 'operations'])) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges for HR operations' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'register_staff') {
      const { employeeId, fullName, email, phone, department, jobTitle, dateOfJoining } = body;
      if (!employeeId || !fullName || !email || !department || !jobTitle || !dateOfJoining) {
        return NextResponse.json({ error: 'Missing required staff fields' }, { status: 400 });
      }
      const staff = await repo.registerStaffProfile({
        employeeId,
        fullName,
        email,
        phone,
        department,
        jobTitle,
        dateOfJoining,
      });
      return NextResponse.json({ success: true, staff }, { status: 201 });
    }

    if (action === 'check_in') {
      const { staffId, date, status, notes } = body;
      if (!staffId || !date) {
        return NextResponse.json({ error: 'staffId and date required' }, { status: 400 });
      }
      const attendance = await repo.recordAttendance({
        staffId,
        date,
        status: status || 'present',
        notes,
      });
      return NextResponse.json({ success: true, attendance }, { status: 201 });
    }

    if (action === 'check_out') {
      const { attendanceId } = body;
      if (!attendanceId) {
        return NextResponse.json({ error: 'attendanceId required' }, { status: 400 });
      }
      const attendance = await repo.recordCheckOut({
        attendanceId,
      });
      return NextResponse.json({ success: true, attendance });
    }

    if (action === 'record_break') {
      const { attendanceId, breakAction, reason } = body;
      if (!attendanceId || !breakAction) {
        return NextResponse.json({ error: 'attendanceId and breakAction (start/end) required' }, { status: 400 });
      }
      const brk = await repo.recordBreak({
        attendanceId,
        action: breakAction,
        reason,
      });
      return NextResponse.json({ success: true, break: brk });
    }

    if (action === 'correct_attendance') {
      const { attendanceId, correctedCheckIn, correctedCheckOut, reason } = body;
      if (!attendanceId || !reason) {
        return NextResponse.json({ error: 'attendanceId and reason required' }, { status: 400 });
      }
      const corrected = await repo.correctAttendance({
        attendanceId,
        correctedCheckIn,
        correctedCheckOut,
        reason,
        requestedBy: user?.email || 'HR Admin',
        approvedBy: user?.email || 'Operations Admin',
      });
      return NextResponse.json({ success: true, attendance: corrected });
    }

    if (action === 'submit_work_log') {
      const { staffId, date, taskDescription, orderId, taskAllocationId, timeSpentMinutes, completedWork, pendingWork, blockers } = body;
      if (!staffId || !date || !taskDescription || !timeSpentMinutes) {
        return NextResponse.json({ error: 'staffId, date, taskDescription and timeSpentMinutes required' }, { status: 400 });
      }
      const log = await repo.submitDailyWorkLog({
        staffId,
        date,
        taskDescription,
        orderId: orderId ? Number(orderId) : undefined,
        taskAllocationId,
        timeSpentMinutes: Number(timeSpentMinutes),
        completedWork,
        pendingWork,
        blockers,
        status: 'submitted',
      });
      return NextResponse.json({ success: true, workLog: log }, { status: 201 });
    }

    if (action === 'review_work_log') {
      const { logId, decision, reviewNotes } = body;
      if (!logId || !decision) {
        return NextResponse.json({ error: 'logId and decision (approved/returned) required' }, { status: 400 });
      }
      const log = await repo.reviewWorkLog({
        logId,
        decision,
        reviewedBy: user?.email || 'Manager',
        reviewNotes,
      });
      return NextResponse.json({ success: true, workLog: log });
    }

    if (action === 'request_leave') {
      const { staffId, leaveType, startDate, endDate, reason } = body;
      if (!staffId || !leaveType || !startDate || !endDate || !reason) {
        return NextResponse.json({ error: 'Missing required leave fields' }, { status: 400 });
      }
      const leave = await repo.submitLeaveRequest({
        staffId,
        leaveType,
        startDate,
        endDate,
        reason,
      });
      return NextResponse.json({ success: true, leave }, { status: 201 });
    }

    if (action === 'process_leave') {
      const { leaveId, decision, decisionNotes } = body;
      if (!leaveId || !decision) {
        return NextResponse.json({ error: 'leaveId and decision required' }, { status: 400 });
      }
      const leave = await repo.processLeaveRequest({
        leaveId,
        decision,
        approvedBy: user?.email || 'Operations Admin',
        decisionNotes,
      });
      return NextResponse.json({ success: true, leave });
    }

    if (action === 'allocate_task') {
      const { staffId, orderId, taskName, stage, deadline } = body;
      if (!staffId || !taskName || !stage) {
        return NextResponse.json({ error: 'staffId, taskName, and stage required' }, { status: 400 });
      }
      const task = await repo.allocateProductionTask({
        staffId,
        orderId: orderId ? Number(orderId) : undefined,
        taskName,
        stage,
        deadline: deadline ? new Date(deadline) : undefined,
        assignedBy: user?.email || 'Operations Lead',
      });
      return NextResponse.json({ success: true, task }, { status: 201 });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'HR operation failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
