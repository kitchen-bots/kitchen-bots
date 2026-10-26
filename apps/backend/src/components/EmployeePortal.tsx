'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Clock,
  Briefcase,
  Calendar,
  Receipt,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  RefreshCw,
  Mail,
  Phone,
  Building,
  DollarSign,
  Send,
  X,
  CreditCard,
  Check,
  ChevronRight,
  ShieldAlert,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Download,
} from 'lucide-react';
import { SecureFileUpload } from './SecureFileUpload';

interface EmployeePortalProps {
  currentTheme?: {
    primary: string;
    secondary?: string;
    lightBg: string;
    [key: string]: any;
  };
  onSwitchToAdmin?: () => void;
  isAdminUser?: boolean;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  currentTheme = { primary: '#0284c7', lightBg: 'rgba(2, 132, 199, 0.08)' },
  onSwitchToAdmin,
  isAdminUser = false,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'work_logs' | 'tasks' | 'leaves' | 'expenses' | 'tickets' | 'profile'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Employee Dataset
  const [profile, setProfile] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  // Task & Ticket Modals / State
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Hardware / Equipment');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketAttachment, setTicketAttachment] = useState<string | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const [ticketReplyText, setTicketReplyText] = useState('');
  const [ticketReplyAttachment, setTicketReplyAttachment] = useState<string | null>(null);
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState<string | null>(null);

  // Modals
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [punchCategory, setPunchCategory] = useState('Manufacturing');
  const [punchNotes, setPunchNotes] = useState('');
  const [isSubmittingPunch, setIsSubmittingPunch] = useState(false);

  const [isWorkLogModalOpen, setIsWorkLogModalOpen] = useState(false);
  const [workLogDate, setWorkLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [workLogDesc, setWorkLogDesc] = useState('');
  const [workLogHours, setWorkLogHours] = useState('8');
  const [workLogCompleted, setWorkLogCompleted] = useState('');
  const [workLogPending, setWorkLogPending] = useState('');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<'casual' | 'sick' | 'earned' | 'unpaid'>('casual');
  const [leaveStartDate, setLeaveStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [leaveEndDate, setLeaveEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<'Employee expenses' | 'Travel' | 'Food and meals' | 'Accommodation' | 'Transport' | 'Other operational expenses'>('Employee expenses');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expenseDesc, setExpenseDesc] = useState('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Fetch Employee Data
  const loadEmployeeData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/operations/employee', { credentials: 'include' });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { message: rawText || 'Invalid response from server' };
      }

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required. Please sign in to view your employee portal.');
        }
        throw new Error(data.message || data.error || `Server error (${res.status})`);
      }
      setProfile(data.profile);
      setTodayAttendance(data.todayAttendance);
      setAttendanceHistory(data.attendanceHistory || []);
      setWorkLogs(data.workLogs || []);
      setLeaves(data.leaves || []);
      setExpenses(data.expenses || []);
      setPayslips(data.payslips || []);
      setTasks(data.tasks || []);
      setTickets(data.tickets || []);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const formatINR = (paise?: number | null) => {
    if (!paise) return '₹0';
    return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const pendingLeavesCount = useMemo(() => leaves.filter((l) => l.status === 'pending').length, [leaves]);
  const approvedLeavesCount = useMemo(() => leaves.filter((l) => l.status === 'approved').length, [leaves]);
  const pendingWorkLogsCount = useMemo(() => workLogs.filter((w) => w.status === 'submitted').length, [workLogs]);
  const pendingExpensesPaise = useMemo(
    () => expenses.filter((e) => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount_paise || 0), 0),
    [expenses]
  );

  if (isLoading) {
    return (
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '40px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: currentTheme.primary }} />
        <div style={{ fontWeight: 600, color: '#0f172a' }}>Loading your employee profile & records...</div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Connecting to PostgreSQL enterprise services</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '36px', border: '1px solid #fecaca', textAlign: 'center' }}>
        <ShieldAlert size={32} style={{ margin: '0 auto 12px', color: '#dc2626' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: '#991b1b' }}>Employee Profile Unlinked</h3>
        <p style={{ fontSize: '13px', color: '#475569', maxWidth: '520px', margin: '0 auto 16px' }}>
          {errorMsg}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={loadEmployeeData}
            style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Retry Connection
          </button>
          {isAdminUser && onSwitchToAdmin && (
            <button
              onClick={onSwitchToAdmin}
              style={{ padding: '8px 16px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Switch to Admin Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
            <span>Kitchen Bots Employee Portal</span>
            <span>/</span>
            <span style={{ color: currentTheme.primary, fontWeight: 600 }}>{profile?.department || 'Operations'}</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Welcome, {profile?.full_name}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            ID: <span style={{ fontWeight: 600, color: '#0f172a' }}>{profile?.employee_id}</span> · Role: {profile?.job_title} · Status: <span style={{ color: '#16a34a', fontWeight: 600 }}>Active</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAdminUser && onSwitchToAdmin && (
            <button
              onClick={onSwitchToAdmin}
              style={{
                padding: '7px 12px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              Admin View ↗
            </button>
          )}
          <button
            onClick={loadEmployeeData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: notification.type === 'success' ? '#166534' : '#991b1b',
          }}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '2px', marginBottom: '24px', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'My Dashboard', icon: User },
          { id: 'tasks', label: 'My Tasks', icon: CheckSquare, count: tasks.filter((t) => t.status !== 'completed').length },
          { id: 'attendance', label: 'My Attendance', icon: Clock },
          { id: 'work_logs', label: 'My Work Logs', icon: Briefcase, count: pendingWorkLogsCount },
          { id: 'leaves', label: 'Apply for Leave', icon: Calendar, count: pendingLeavesCount },
          { id: 'expenses', label: 'My Expenses', icon: Receipt },
          { id: 'tickets', label: 'Helpdesk & Tickets', icon: MessageSquare, count: tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length },
          { id: 'profile', label: 'My Profile & Payslips', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                border: 'none',
                borderBottom: isActive ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
                backgroundColor: isActive ? currentTheme.lightBg : 'transparent',
                color: isActive ? currentTheme.primary : '#64748b',
                fontWeight: isActive ? 700 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                borderRadius: '6px 6px 0 0',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span style={{ fontSize: '10px', backgroundColor: '#f59e0b', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: MY DASHBOARD
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Quick Status KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {/* Today Shift Card */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Today Shift Status</div>
              <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: todayAttendance?.check_in && !todayAttendance?.check_out ? '#15803d' : '#0f172a' }}>
                {todayAttendance?.check_in && !todayAttendance?.check_out
                  ? 'Clocked In'
                  : todayAttendance?.check_out
                  ? 'Clocked Out'
                  : 'Not Clocked In'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                {todayAttendance?.check_in ? `In: ${new Date(todayAttendance.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Shift not started'}
              </div>
            </div>

            {/* Pending Leave Requests */}
            <div
              onClick={() => setActiveTab('leaves')}
              style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>Pending Leave Claims</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#b45309', marginTop: '4px' }}>{pendingLeavesCount}</div>
              <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>{approvedLeavesCount} approved this cycle →</div>
            </div>

            {/* Daily Work Logs */}
            <div
              onClick={() => setActiveTab('work_logs')}
              style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Daily Work Logs</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>{workLogs.length}</div>
              <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px' }}>{pendingWorkLogsCount} awaiting manager review →</div>
            </div>

            {/* Pending Expenses */}
            <div
              onClick={() => setActiveTab('expenses')}
              style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pending Reimbursement</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{formatINR(pendingExpensesPaise)}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{expenses.length} claims submitted →</div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Self-Service Quick Actions</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {!todayAttendance?.check_in ? (
                <button
                  onClick={() => setIsPunchModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Clock size={14} /> Clock In Now
                </button>
              ) : !todayAttendance?.check_out ? (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/operations/employee', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ action: 'check_out' }),
                      });
                      const d = await res.json();
                      if (!res.ok) throw new Error(d.error || 'Clock out failed');
                      setNotification({ type: 'success', message: 'Shift ended. Clock-out recorded.' });
                      await loadEmployeeData();
                    } catch (err: any) {
                      setNotification({ type: 'error', message: err.message });
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#e11d48', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Clock size={14} /> Clock Out for Today
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: '#64748b', padding: '8px 12px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  ✓ Shift completed for today
                </span>
              )}

              <button
                onClick={() => setIsWorkLogModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={14} /> Submit Daily Work Log
              </button>

              <button
                onClick={() => setIsLeaveModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Calendar size={14} /> Apply for Leave
              </button>

              <button
                onClick={() => setIsExpenseModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Receipt size={14} /> Claim Expense
              </button>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Recent Work Logs */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>My Recent Work Logs</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Latest 5</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {workLogs.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '16px' }}>No daily logs submitted yet.</div>
                ) : (
                  workLogs.slice(0, 5).map((w) => (
                    <div key={w.id} style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{w.date ? String(w.date).slice(0, 10) : 'Today'}</span>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            backgroundColor: w.status === 'approved' ? '#dcfce7' : w.status === 'submitted' ? '#e0f2fe' : '#fee2e2',
                            color: w.status === 'approved' ? '#15803d' : w.status === 'submitted' ? '#0369a1' : '#b91c1c',
                          }}
                        >
                          {w.status}
                        </span>
                      </div>
                      <div style={{ color: '#334155', marginTop: '2px' }}>{w.task_description}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Leave Requests */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>My Leave Status</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Latest 5</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leaves.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '16px' }}>No leave applications on file.</div>
                ) : (
                  leaves.slice(0, 5).map((l) => (
                    <div key={l.id} style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span style={{ textTransform: 'capitalize' }}>{l.leave_type} Leave</span>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            backgroundColor: l.status === 'approved' ? '#dcfce7' : l.status === 'pending' ? '#fef3c7' : '#fee2e2',
                            color: l.status === 'approved' ? '#15803d' : l.status === 'pending' ? '#b45309' : '#b91c1c',
                          }}
                        >
                          {l.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {String(l.start_date).slice(0, 10)} → {String(l.end_date).slice(0, 10)}
                      </div>
                      <div style={{ color: '#334155', marginTop: '2px' }}>{l.reason}</div>
                      {l.decision_notes && (
                        <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                          HR note: {l.decision_notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: MY TASKS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'tasks' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#0f172a' }}>My Assigned Tasks</h3>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                Operational & production tasks assigned to you by leads and managers.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '10px 12px' }}>Task Name</th>
                  <th style={{ padding: '10px 12px' }}>Stage</th>
                  <th style={{ padding: '10px 12px' }}>Deadline</th>
                  <th style={{ padding: '10px 12px' }}>Assigned By</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Blocker Reason</th>
                  <th style={{ padding: '10px 12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
                      No tasks currently assigned to you.
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                        {t.task_name}
                        {t.order_id && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#64748b' }}>Order #{t.order_id}</span>}
                      </td>
                      <td style={{ padding: '10px 12px' }}>{t.stage || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {t.deadline ? String(t.deadline).slice(0, 10) : 'No deadline'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{t.assigned_by || 'Manager'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            backgroundColor:
                              t.status === 'completed' ? '#dcfce7' :
                              t.status === 'in_progress' ? '#dbeafe' :
                              t.status === 'blocked' ? '#fee2e2' : '#fef3c7',
                            color:
                              t.status === 'completed' ? '#15803d' :
                              t.status === 'in_progress' ? '#1d4ed8' :
                              t.status === 'blocked' ? '#b91c1c' : '#b45309',
                          }}
                        >
                          {t.status || 'assigned'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#dc2626', fontSize: '11px', maxWidth: '200px' }}>
                        {t.blocker_reason || '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {t.status !== 'completed' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {t.status !== 'in_progress' && (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/operations/employee', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ action: 'update_task_progress', taskId: t.id, status: 'in_progress' }),
                                    });
                                    if (!res.ok) throw new Error('Failed to update task');
                                    setNotification({ type: 'success', message: 'Task marked in progress.' });
                                    await loadEmployeeData();
                                  } catch (err: any) {
                                    setNotification({ type: 'error', message: err.message });
                                  }
                                }}
                                style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Start
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch('/api/operations/employee', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ action: 'update_task_progress', taskId: t.id, status: 'completed' }),
                                  });
                                  if (!res.ok) throw new Error('Failed to complete task');
                                  setNotification({ type: 'success', message: 'Task marked as completed.' });
                                  await loadEmployeeData();
                                } catch (err: any) {
                                  setNotification({ type: 'error', message: err.message });
                                }
                              }}
                              style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Complete
                            </button>
                            <button
                              onClick={async () => {
                                const reason = prompt('State the blocker reason:');
                                if (!reason) return;
                                try {
                                  const res = await fetch('/api/operations/employee', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ action: 'update_task_progress', taskId: t.id, status: 'blocked', blockerReason: reason }),
                                  });
                                  if (!res.ok) throw new Error('Failed to report blocker');
                                  setNotification({ type: 'success', message: 'Task marked as blocked.' });
                                  await loadEmployeeData();
                                } catch (err: any) {
                                  setNotification({ type: 'error', message: err.message });
                                }
                              }}
                              style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Block
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Done</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: MY ATTENDANCE
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#0f172a' }}>My Clock-In / Clock-Out History</h3>
            {!todayAttendance?.check_in ? (
              <button
                onClick={() => setIsPunchModalOpen(true)}
                style={{ padding: '6px 14px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Record Check-In
              </button>
            ) : !todayAttendance?.check_out ? (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/operations/employee', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ action: 'check_out' }),
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || 'Clock out failed');
                    setNotification({ type: 'success', message: 'Shift ended. Clock-out recorded.' });
                    await loadEmployeeData();
                  } catch (err: any) {
                    setNotification({ type: 'error', message: err.message });
                  }
                }}
                style={{ padding: '6px 14px', backgroundColor: '#e11d48', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Record Check-Out
              </button>
            ) : null}
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Check In</th>
                  <th style={{ padding: '10px 12px' }}>Check Out</th>
                  <th style={{ padding: '10px 12px' }}>Duration</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No attendance records found.</td>
                  </tr>
                ) : (
                  attendanceHistory.map((att) => {
                    let durationStr = '—';
                    if (att.check_in && att.check_out) {
                      const diff = new Date(att.check_out).getTime() - new Date(att.check_in).getTime();
                      durationStr = `${(diff / (1000 * 60 * 60)).toFixed(1)} hrs`;
                    } else if (att.check_in) {
                      durationStr = 'Shift in progress';
                    }

                    return (
                      <tr key={att.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                          {att.date ? String(att.date).slice(0, 10) : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>
                          {att.check_in ? new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>
                          {att.check_out ? new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#0f172a' }}>{durationStr}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              backgroundColor: att.status === 'present' ? '#dcfce7' : att.status === 'on_leave' ? '#fef3c7' : '#f1f5f9',
                              color: att.status === 'present' ? '#15803d' : att.status === 'on_leave' ? '#b45309' : '#475569',
                            }}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{att.notes || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: MY DAILY WORK LOGS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'work_logs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#0f172a' }}>My Daily Task Logs & History</h3>
            <button
              onClick={() => setIsWorkLogModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={14} /> Submit New Work Log
            </button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Task Description</th>
                  <th style={{ padding: '10px 12px' }}>Time Spent</th>
                  <th style={{ padding: '10px 12px' }}>Completed Work</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Review Notes</th>
                </tr>
              </thead>
              <tbody>
                {workLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No work logs found.</td>
                  </tr>
                ) : (
                  workLogs.map((w) => (
                    <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{w.date ? String(w.date).slice(0, 10) : '—'}</td>
                      <td style={{ padding: '10px 12px', maxWidth: '240px', color: '#0f172a' }}>{w.task_description}</td>
                      <td style={{ padding: '10px 12px' }}>{(Number(w.time_spent_minutes || 0) / 60).toFixed(1)} hrs</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{w.completed_work || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            backgroundColor: w.status === 'approved' ? '#dcfce7' : w.status === 'submitted' ? '#e0f2fe' : '#fee2e2',
                            color: w.status === 'approved' ? '#15803d' : w.status === 'submitted' ? '#0369a1' : '#b91c1c',
                          }}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>
                        {w.review_notes ? `${w.review_notes} (${w.reviewed_by || 'Manager'})` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: APPLY FOR LEAVE
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'leaves' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#0f172a' }}>My Leave Applications & Entitlement</h3>
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Calendar size={14} /> Submit Leave Request
            </button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '10px 12px' }}>Leave Type</th>
                  <th style={{ padding: '10px 12px' }}>Duration</th>
                  <th style={{ padding: '10px 12px' }}>Days</th>
                  <th style={{ padding: '10px 12px' }}>Reason</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>HR Decision Notes</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No leave applications submitted.</td>
                  </tr>
                ) : (
                  leaves.map((l) => {
                    const start = new Date(l.start_date).getTime();
                    const end = new Date(l.end_date).getTime();
                    const days = isNaN(start) || isNaN(end) ? 1 : Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

                    return (
                      <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', textTransform: 'capitalize', fontWeight: 600, color: '#0f172a' }}>
                          {l.leave_type} Leave
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>
                          {String(l.start_date).slice(0, 10)} → {String(l.end_date).slice(0, 10)}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{days} {days === 1 ? 'day' : 'days'}</td>
                        <td style={{ padding: '10px 12px', maxWidth: '240px', color: '#334155' }}>{l.reason}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              backgroundColor: l.status === 'approved' ? '#dcfce7' : l.status === 'pending' ? '#fef3c7' : '#fee2e2',
                              color: l.status === 'approved' ? '#15803d' : l.status === 'pending' ? '#b45309' : '#b91c1c',
                            }}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>
                          {l.decision_notes ? `${l.decision_notes} (${l.approved_by || 'HR'})` : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 5: MY EXPENSES
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'expenses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#0f172a' }}>My Reimbursement Claims</h3>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Receipt size={14} /> Submit Expense Claim
            </button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '10px 12px' }}>Claim ID</th>
                  <th style={{ padding: '10px 12px' }}>Category</th>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Description</th>
                  <th style={{ padding: '10px 12px' }}>Amount</th>
                  <th style={{ padding: '10px 12px' }}>Receipt</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Decision & Payment Details</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No expense claims recorded.</td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{exp.expense_id || exp.id}</td>
                      <td style={{ padding: '10px 12px' }}>{exp.category}</td>
                      <td style={{ padding: '10px 12px' }}>{exp.expense_date ? String(exp.expense_date).slice(0, 10) : '—'}</td>
                      <td style={{ padding: '10px 12px', maxWidth: '240px', color: '#334155' }}>{exp.description}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{formatINR(exp.amount_paise)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {exp.receipt_url ? (
                          <a
                            href={exp.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: currentTheme.primary, fontWeight: 600, textDecoration: 'none' }}
                          >
                            <Paperclip size={12} /> Receipt
                          </a>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            backgroundColor:
                              exp.status === 'reimbursed' ? '#dbeafe' :
                              exp.status === 'approved' ? '#dcfce7' :
                              exp.status === 'pending' ? '#fef3c7' : '#fee2e2',
                            color:
                              exp.status === 'reimbursed' ? '#1d4ed8' :
                              exp.status === 'approved' ? '#15803d' :
                              exp.status === 'pending' ? '#b45309' : '#b91c1c',
                          }}
                        >
                          {exp.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '11px' }}>
                        {exp.status === 'reimbursed' ? (
                          <div>
                            <span style={{ color: '#1d4ed8', fontWeight: 600 }}>Ref: {exp.reimbursement_ref || 'Paid'}</span>
                            <div style={{ fontSize: '10px' }}>{exp.reimbursed_at ? String(exp.reimbursed_at).slice(0, 10) : ''}</div>
                          </div>
                        ) : (
                          exp.review_notes ? `${exp.review_notes} (${exp.reviewed_by || 'HR/Finance'})` : '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: HELPDESK & TICKETS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'tickets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#0f172a' }}>Employee Support & Helpdesk Tickets</h3>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                Raise queries or report issues regarding payroll, IT equipment, HR policy, or workplace facilities.
              </p>
            </div>
            <button
              onClick={() => {
                setTicketSubject('');
                setTicketDescription('');
                setTicketAttachment(null);
                setIsTicketModalOpen(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={14} /> Raise Ticket
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1fr' : '1fr', gap: '16px' }}>
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '10px 12px' }}>Ticket #</th>
                    <th style={{ padding: '10px 12px' }}>Category</th>
                    <th style={{ padding: '10px 12px' }}>Subject</th>
                    <th style={{ padding: '10px 12px' }}>Priority</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Created</th>
                    <th style={{ padding: '10px 12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No tickets raised yet.</td>
                    </tr>
                  ) : (
                    tickets.map((tkt) => (
                      <tr key={tkt.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: selectedTicket?.id === tkt.id ? 'rgba(2, 132, 199, 0.04)' : 'transparent' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>{tkt.ticket_number}</td>
                        <td style={{ padding: '10px 12px' }}>{tkt.category}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155', maxWidth: '200px' }}>{tkt.subject}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: tkt.priority === 'urgent' ? '#dc2626' : tkt.priority === 'high' ? '#ea580c' : '#475569' }}>
                            {tkt.priority}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              backgroundColor:
                                tkt.status === 'resolved' || tkt.status === 'closed' ? '#dcfce7' :
                                tkt.status === 'in_progress' ? '#dbeafe' : '#fef3c7',
                              color:
                                tkt.status === 'resolved' || tkt.status === 'closed' ? '#15803d' :
                                tkt.status === 'in_progress' ? '#1d4ed8' : '#b45309',
                            }}
                          >
                            {tkt.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>
                          {tkt.created_at ? String(tkt.created_at).slice(0, 10) : '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/operations/hr?tab=ticket_details&ticketId=${tkt.id}`, { credentials: 'include' });
                                if (res.ok) {
                                  const d = await res.json();
                                  setSelectedTicket(d.ticket || tkt);
                                } else {
                                  setSelectedTicket(tkt);
                                }
                              } catch {
                                setSelectedTicket(tkt);
                              }
                            }}
                            style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Selected Ticket Conversation Drawer */}
            {selectedTicket && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', height: '520px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{selectedTicket.ticket_number} · {selectedTicket.category}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{selectedTicket.subject}</div>
                  </div>
                  <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={16} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Original Issue:</div>
                    <div style={{ fontSize: '12px', color: '#0f172a', whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</div>
                    {selectedTicket.attachment_url && (
                      <div style={{ marginTop: '8px' }}>
                        <a href={selectedTicket.attachment_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: currentTheme.primary, textDecoration: 'none', fontWeight: 600 }}>
                          <Paperclip size={12} /> Attachment
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Messages Thread */}
                  {selectedTicket.messages && selectedTicket.messages.map((m: any) => {
                    const isSelf = m.sender_type === 'employee';
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isSelf ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          backgroundColor: isSelf ? 'rgba(2, 132, 199, 0.08)' : '#f1f5f9',
                          border: `1px solid ${isSelf ? 'rgba(2, 132, 199, 0.2)' : '#cbd5e1'}`,
                          borderRadius: '6px',
                          padding: '10px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                          <span>{m.sender_name} {isSelf ? '(You)' : '(Support)'}</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#0f172a', whiteSpace: 'pre-wrap' }}>{m.message}</div>
                        {m.attachment_url && (
                          <div style={{ marginTop: '6px' }}>
                            <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: currentTheme.primary, textDecoration: 'none', fontWeight: 600 }}>
                              <Paperclip size={12} /> Attachment
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <textarea
                    rows={2}
                    placeholder="Write your reply..."
                    value={ticketReplyText}
                    onChange={(e) => setTicketReplyText(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', resize: 'none' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <SecureFileUpload
                      label=""
                      category="ticket"
                      onUploadSuccess={(f) => setTicketReplyAttachment(f.url)}
                      onRemove={() => setTicketReplyAttachment(null)}
                    />
                    <button
                      disabled={isSendingReply || !ticketReplyText.trim()}
                      onClick={async () => {
                        try {
                          setIsSendingReply(true);
                          const res = await fetch('/api/operations/employee', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              action: 'reply_ticket',
                              ticketId: selectedTicket.id,
                              message: ticketReplyText.trim(),
                              attachmentUrl: ticketReplyAttachment || undefined,
                            }),
                          });
                          const d = await res.json();
                          if (!res.ok) throw new Error(d.error || 'Failed to send reply');
                          setTicketReplyText('');
                          setTicketReplyAttachment(null);
                          // Refresh ticket thread
                          const refRes = await fetch(`/api/operations/hr?tab=ticket_details&ticketId=${selectedTicket.id}`, { credentials: 'include' });
                          if (refRes.ok) {
                            const refD = await refRes.json();
                            setSelectedTicket(refD.ticket);
                          }
                          await loadEmployeeData();
                        } catch (err: any) {
                          setNotification({ type: 'error', message: err.message });
                        } finally {
                          setIsSendingReply(false);
                        }
                      }}
                      style={{ padding: '6px 14px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {isSendingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 6: MY PROFILE & PAYSLIPS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left: Contact & Employment Card */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 14px', color: '#0f172a' }}>Personal & Employment Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Full Name</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{profile?.full_name}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Official Email</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{profile?.email}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Phone</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{profile?.phone || 'Not registered'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Department & Designation</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{profile?.department} · {profile?.job_title}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Date of Joining</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{profile?.date_of_joining ? String(profile.date_of_joining).slice(0, 10) : '—'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Bank Account (Masked)</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>
                  {profile?.bank_details?.accountNumber || 'Not configured'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Payslip History */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 14px', color: '#0f172a' }}>My Issued Payslips</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {payslips.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '24px' }}>
                  No payslips generated for your profile yet.
                </div>
              ) : (
                payslips.map((ps) => (
                  <div key={ps.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{ps.month_year}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Net: {formatINR(ps.net_paise || ps.net_salary_paise)} · Gross: {formatINR(ps.gross_paise)}
                      </div>
                    </div>
                    <div>
                      {ps.document_url ? (
                        <a
                          href={ps.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: currentTheme.primary,
                            textDecoration: 'none',
                          }}
                        >
                          <Download size={12} /> Download PDF
                        </a>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>PDF Pending</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. Modal: Record Clock-In */}
      {isPunchModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '400px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Record Shift Clock-In</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Work Category</label>
                <select
                  value={punchCategory}
                  onChange={(e) => setPunchCategory(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Products">Products</option>
                  <option value="Shipping">Shipping</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Starting machine calibration"
                  value={punchNotes}
                  onChange={(e) => setPunchNotes(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button disabled={isSubmittingPunch} onClick={() => setIsPunchModalOpen(false)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                disabled={isSubmittingPunch}
                onClick={async () => {
                  try {
                    setIsSubmittingPunch(true);
                    const res = await fetch('/api/operations/employee', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ action: 'check_in', workCategory: punchCategory, notes: punchNotes }),
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || 'Clock in failed');
                    setNotification({ type: 'success', message: 'Clock-in successfully recorded!' });
                    setIsPunchModalOpen(false);
                    await loadEmployeeData();
                  } catch (err: any) {
                    setNotification({ type: 'error', message: err.message });
                  } finally {
                    setIsSubmittingPunch(false);
                  }
                }}
                style={{ padding: '6px 14px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                {isSubmittingPunch ? 'Saving...' : 'Confirm Clock-In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Submit Daily Work Log */}
      {isWorkLogModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '440px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Submit Daily Work Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Date</label>
                  <input
                    type="date"
                    value={workLogDate}
                    onChange={(e) => setWorkLogDate(e.target.value)}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Hours Worked</label>
                  <input
                    type="number"
                    value={workLogHours}
                    onChange={(e) => setWorkLogHours(e.target.value)}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Task Summary *</label>
                <input
                  type="text"
                  placeholder="e.g. Assembled 10 heating element chassis"
                  value={workLogDesc}
                  onChange={(e) => setWorkLogDesc(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Completed Work</label>
                <textarea
                  placeholder="Milestones finished today..."
                  value={workLogCompleted}
                  onChange={(e) => setWorkLogCompleted(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '60px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Pending / Blockers</label>
                <input
                  type="text"
                  placeholder="e.g. Awaiting sheet metal delivery"
                  value={workLogPending}
                  onChange={(e) => setWorkLogPending(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button disabled={isSubmittingLog} onClick={() => setIsWorkLogModalOpen(false)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                disabled={isSubmittingLog}
                onClick={async () => {
                  if (!workLogDesc.trim()) {
                    setNotification({ type: 'error', message: 'Task summary is required' });
                    return;
                  }
                  try {
                    setIsSubmittingLog(true);
                    const res = await fetch('/api/operations/employee', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        action: 'submit_work_log',
                        date: workLogDate,
                        taskDescription: workLogDesc.trim(),
                        timeSpentMinutes: (parseFloat(workLogHours) || 8) * 60,
                        completedWork: workLogCompleted,
                        pendingWork: workLogPending,
                      }),
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || 'Work log submission failed');
                    setNotification({ type: 'success', message: 'Daily work log submitted for manager review.' });
                    setIsWorkLogModalOpen(false);
                    setWorkLogDesc('');
                    setWorkLogCompleted('');
                    setWorkLogPending('');
                    await loadEmployeeData();
                  } catch (err: any) {
                    setNotification({ type: 'error', message: err.message });
                  } finally {
                    setIsSubmittingLog(false);
                  }
                }}
                style={{ padding: '6px 14px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                {isSubmittingLog ? 'Submitting...' : 'Submit Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Apply for Leave */}
      {isLeaveModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '420px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Submit Leave Application</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Start Date</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>End Date</label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Reason *</label>
                <input
                  type="text"
                  placeholder="e.g. Personal family event"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button disabled={isSubmittingLeave} onClick={() => setIsLeaveModalOpen(false)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                disabled={isSubmittingLeave}
                onClick={async () => {
                  if (!leaveReason.trim()) {
                    setNotification({ type: 'error', message: 'Leave reason is required' });
                    return;
                  }
                  if (new Date(leaveEndDate) < new Date(leaveStartDate)) {
                    setNotification({ type: 'error', message: 'End date cannot precede start date' });
                    return;
                  }
                  try {
                    setIsSubmittingLeave(true);
                    const res = await fetch('/api/operations/employee', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        action: 'request_leave',
                        leaveType,
                        startDate: leaveStartDate,
                        endDate: leaveEndDate,
                        reason: leaveReason.trim(),
                      }),
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || 'Leave request failed');
                    setNotification({ type: 'success', message: 'Leave application submitted in pending status.' });
                    setIsLeaveModalOpen(false);
                    setLeaveReason('');
                    await loadEmployeeData();
                  } catch (err: any) {
                    setNotification({ type: 'error', message: err.message });
                  } finally {
                    setIsSubmittingLeave(false);
                  }
                }}
                style={{ padding: '6px 14px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                {isSubmittingLeave ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Submit Expense Claim */}
      {isExpenseModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '420px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Submit Expense Claim</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="Employee expenses">Employee expenses</option>
                  <option value="Travel">Travel</option>
                  <option value="Food and meals">Food and meals</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Transport">Transport</option>
                  <option value="Other operational expenses">Other operational expenses</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 450"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Expense Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Bus fare to client site"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
              <SecureFileUpload
                label="Receipt / Bill (Optional JPG, PNG, PDF)"
                category="receipt"
                onUploadSuccess={(file) => setExpenseReceiptUrl(file.url)}
                onRemove={() => setExpenseReceiptUrl(null)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button disabled={isSubmittingExpense} onClick={() => { setIsExpenseModalOpen(false); setExpenseReceiptUrl(null); }} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                disabled={isSubmittingExpense}
                onClick={async () => {
                  if (!expenseDesc.trim() || !expenseAmount) {
                    setNotification({ type: 'error', message: 'Amount and description are required' });
                    return;
                  }
                  try {
                    setIsSubmittingExpense(true);
                    const res = await fetch('/api/operations/employee', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        action: 'submit_expense',
                        category: expenseCategory,
                        amountRupees: expenseAmount,
                        expenseDate,
                        description: expenseDesc.trim(),
                        receiptUrl: expenseReceiptUrl || undefined,
                      }),
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || 'Expense claim failed');
                    setNotification({ type: 'success', message: 'Expense claim submitted for finance review.' });
                    setIsExpenseModalOpen(false);
                    setExpenseAmount('');
                    setExpenseDesc('');
                    setExpenseReceiptUrl(null);
                    await loadEmployeeData();
                  } catch (err: any) {
                    setNotification({ type: 'error', message: err.message });
                  } finally {
                    setIsSubmittingExpense(false);
                  }
                }}
                style={{ padding: '6px 14px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                {isSubmittingExpense ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Raise Helpdesk Ticket */}
      {isTicketModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '440px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Raise Helpdesk Ticket</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Category *</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="Hardware / Equipment">Hardware / Equipment</option>
                  <option value="Payroll & Expenses">Payroll & Expenses</option>
                  <option value="HR & Leave Policy">HR & Leave Policy</option>
                  <option value="Facility & Kitchen Workspace">Facility & Kitchen Workspace</option>
                  <option value="IT Access & Software">IT Access & Software</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Priority</label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Subject *</label>
                <input
                  type="text"
                  placeholder="e.g. Robot assembly bay pneumatic tool malfunction"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Description *</label>
                <textarea
                  rows={3}
                  placeholder="Provide detailed description of the problem or request..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'none' }}
                />
              </div>

              <SecureFileUpload
                label="Attachment / Screenshot (Optional JPG, PNG, PDF)"
                category="ticket"
                onUploadSuccess={(file) => setTicketAttachment(file.url)}
                onRemove={() => setTicketAttachment(null)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                disabled={isSubmittingTicket}
                onClick={() => {
                  setIsTicketModalOpen(false);
                  setTicketAttachment(null);
                }}
                style={{ padding: '6px 12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingTicket}
                onClick={async () => {
                  if (!ticketSubject.trim() || !ticketDescription.trim()) {
                    setNotification({ type: 'error', message: 'Subject and description are required' });
                    return;
                  }
                  try {
                    setIsSubmittingTicket(true);
                    const res = await fetch('/api/operations/employee', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        action: 'create_ticket',
                        category: ticketCategory,
                        priority: ticketPriority,
                        subject: ticketSubject.trim(),
                        description: ticketDescription.trim(),
                        attachmentUrl: ticketAttachment || undefined,
                      }),
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || 'Failed to raise ticket');
                    setNotification({ type: 'success', message: 'Helpdesk ticket raised successfully.' });
                    setIsTicketModalOpen(false);
                    setTicketSubject('');
                    setTicketDescription('');
                    setTicketAttachment(null);
                    await loadEmployeeData();
                  } catch (err: any) {
                    setNotification({ type: 'error', message: err.message });
                  } finally {
                    setIsSubmittingTicket(false);
                  }
                }}
                style={{ padding: '6px 14px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                {isSubmittingTicket ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
