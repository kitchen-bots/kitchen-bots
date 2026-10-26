'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Receipt,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Building,
  Mail,
  Phone,
  DollarSign,
  FileText,
  Lock,
  Unlock,
  Download,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  X,
  FileCheck,
  Tag,
  CreditCard,
  UserCheck,
  Send,
  RefreshCw,
} from 'lucide-react';
import { SecureFileUpload } from './SecureFileUpload';

export interface StaffRecord {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  department: string;
  job_title: string;
  employee_type?: 'full-time' | 'part-time' | 'contract' | 'temporary' | string;
  employment_status?: 'active' | 'on_leave' | 'inactive' | 'terminated' | string;
  status: string;
  date_of_joining: string;
  tags?: string[];
  avatar_url?: string | null;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  salary_details?: {
    currency?: string;
    monthly_base_paise?: number;
    allowances_paise?: number;
    deductions_paise?: number;
    history?: Array<{ effective_date: string; amount_paise: number; notes?: string }>;
  };
  bank_details?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    beneficiaryName?: string;
  };
  payslips?: Array<{
    id: string;
    month_year: string;
    gross_paise: number;
    net_paise: number;
    document_url?: string | null;
    issued_at: string;
  }>;
}

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  working_hours?: number | string | null;
  status: 'present' | 'absent' | 'half_day' | 'holiday' | 'late' | 'on_leave';
  work_category?: 'Manufacturing' | 'Products' | 'Shipping' | 'Sales' | 'Operations' | 'Other' | string;
  notes?: string | null;
  full_name?: string;
  employee_id?: string;
  department?: string;
  job_title?: string;
}

export interface WorkLogRecord {
  id: string;
  staff_id: string;
  date: string;
  task_description: string;
  order_id?: number | null;
  task_allocation_id?: string | null;
  time_spent_minutes: number;
  completed_work?: string | null;
  pending_work?: string | null;
  blockers?: string | null;
  status: 'submitted' | 'approved' | 'returned';
  work_category?: string;
  full_name?: string;
  employee_id?: string;
  order_number?: string | null;
  review_notes?: string | null;
}

export interface LeaveRecord {
  id: string;
  staff_id: string;
  leave_type: 'casual' | 'sick' | 'earned' | 'unpaid';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: string | null;
  decision_notes?: string | null;
  full_name?: string;
  employee_id?: string;
  department?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseRecord {
  id: string;
  expense_id: string;
  staff_id?: string | null;
  claimant_name: string;
  category: 'Employee expenses' | 'Travel' | 'Food and meals' | 'Accommodation' | 'Transport' | 'Other operational expenses';
  amount_paise: number;
  currency: string;
  expense_date: string;
  description: string;
  receipt_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_by?: string | null;
  review_notes?: string | null;
  employee_id?: string | null;
}

interface HrWorkspaceProps {
  currentTheme: {
    primary: string;
    lightBg: string;
    [key: string]: any;
  };
  staffList: any[];
  attendanceList: any[];
  workLogsList: any[];
  leaveList: any[];
  onRefreshData: () => Promise<void>;
}

export const HrWorkspace: React.FC<HrWorkspaceProps> = ({
  currentTheme,
  staffList = [],
  attendanceList = [],
  workLogsList = [],
  leaveList = [],
  onRefreshData,
}) => {
  // ── PRIMARY TABS ──
  const [primaryTab, setPrimaryTab] = useState<'employees' | 'working' | 'leaves' | 'expenses'>('employees');

  // Common Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ──────────────────────────────────────────────────────────
  // TAB 1: EMPLOYEES STATE
  // ──────────────────────────────────────────────────────────
  const [empSearch, setEmpSearch] = useState('');
  const [empTypeFilter, setEmpTypeFilter] = useState('all');
  const [empDeptFilter, setEmpDeptFilter] = useState('all');
  const [empStatusFilter, setEmpStatusFilter] = useState('all');

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [staffDetailData, setStaffDetailData] = useState<StaffRecord | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [revealBankDetails, setRevealBankDetails] = useState(false);

  // Add / Edit Employee Modal State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    department: 'Fabrication',
    jobTitle: '',
    employeeType: 'full-time',
    employmentStatus: 'active',
    dateOfJoining: new Date().toISOString().slice(0, 10),
    tags: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    monthlySalary: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    beneficiaryName: '',
  });

  // ──────────────────────────────────────────────────────────
  // TAB 2: WORKING STATE
  // ──────────────────────────────────────────────────────────
  const [workingDate, setWorkingDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [workingStatusFilter, setWorkingStatusFilter] = useState('all');
  const [workingCategoryFilter, setWorkingCategoryFilter] = useState('all');
  const [workingEmpFilter, setWorkingEmpFilter] = useState('all');

  // Check-In / Check-Out Modal
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInStaffId, setCheckInStaffId] = useState('');
  const [checkInStatus, setCheckInStatus] = useState<'present' | 'late' | 'half_day'>('present');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkInWorkCategory, setCheckInWorkCategory] = useState('Operations');

  // Daily Work Log Modal
  const [isWorkLogModalOpen, setIsWorkLogModalOpen] = useState(false);
  const [workLogStaffId, setWorkLogStaffId] = useState('');
  const [workLogTaskDesc, setWorkLogTaskDesc] = useState('');
  const [workLogHours, setWorkLogHours] = useState('4');
  const [workLogCompleted, setWorkLogCompleted] = useState('');
  const [workLogPending, setWorkLogPending] = useState('');
  const [workLogBlockers, setWorkLogBlockers] = useState('');

  // Apply Leave Modal
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);
  const [leaveStaffId, setLeaveStaffId] = useState('');
  const [leaveType, setLeaveType] = useState<'casual' | 'sick' | 'earned' | 'unpaid'>('casual');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Leave Approvals Filter & Action State
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [leaveStaffFilter, setLeaveStaffFilter] = useState('all');
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────────
  // TAB 3: EXPENSES STATE
  // ──────────────────────────────────────────────────────────
  const [expensesList, setExpensesList] = useState<ExpenseRecord[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState('all');
  const [expenseStaffFilter, setExpenseStaffFilter] = useState('all');
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState({
    staffId: '',
    claimantName: '',
    category: 'Employee expenses' as const,
    amountRupees: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    description: '',
    receiptUrl: '',
  });

  // Load Expenses on mount and tab switch
  const fetchExpenses = async () => {
    setExpensesLoading(true);
    try {
      const res = await fetch('/api/operations/hr?tab=expenses', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setExpensesList(d.expenses || []);
      }
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setExpensesLoading(false);
    }
  };

  useEffect(() => {
    if (primaryTab === 'expenses') {
      fetchExpenses();
    }
  }, [primaryTab]);

  // Load staff detail when modal opens or revealBank changes
  const fetchStaffDetail = async (id: string, revealBank: boolean = false) => {
    setIsDetailLoading(true);
    try {
      const res = await fetch(`/api/operations/hr?tab=staff_detail&staffId=${id}&reveal_bank=${revealBank}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const d = await res.json();
        setStaffDetailData(d.staff);
      }
    } catch (err) {
      console.error('Failed to load staff detail', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleOpenDetailModal = (staffId: string) => {
    setSelectedStaffId(staffId);
    setRevealBankDetails(false);
    fetchStaffDetail(staffId, false);
  };

  // Open Edit Employee Modal
  const handleOpenEditModal = (st: StaffRecord) => {
    setEditingStaffId(st.id);
    setEmployeeFormData({
      employeeId: st.employee_id || '',
      fullName: st.full_name || '',
      email: st.email || '',
      phone: st.phone || '',
      department: st.department || 'Fabrication',
      jobTitle: st.job_title || '',
      employeeType: st.employee_type || 'full-time',
      employmentStatus: st.employment_status || st.status || 'active',
      dateOfJoining: st.date_of_joining ? String(st.date_of_joining).slice(0, 10) : new Date().toISOString().slice(0, 10),
      tags: Array.isArray(st.tags) ? st.tags.join(', ') : '',
      street: st.address?.street || '',
      city: st.address?.city || '',
      state: st.address?.state || '',
      postalCode: st.address?.postalCode || '',
      country: st.address?.country || 'India',
      monthlySalary: st.salary_details?.monthly_base_paise ? String(st.salary_details.monthly_base_paise / 100) : '',
      bankName: st.bank_details?.bankName || '',
      accountNumber: st.bank_details?.accountNumber || '',
      ifscCode: st.bank_details?.ifscCode || '',
      beneficiaryName: st.bank_details?.beneficiaryName || '',
    });
    setIsEmployeeModalOpen(true);
  };

  // Save Employee (Create or Update)
  const handleSaveEmployee = async () => {
    if (!employeeFormData.fullName.trim() || !employeeFormData.email.trim() || !employeeFormData.employeeId.trim()) {
      setNotification({ type: 'error', message: 'Full name, unique Employee ID, and Email are required.' });
      return;
    }

    try {
      const payload: any = {
        action: editingStaffId ? 'update_staff' : 'register_staff',
        employeeId: employeeFormData.employeeId.trim(),
        fullName: employeeFormData.fullName.trim(),
        email: employeeFormData.email.trim(),
        phone: employeeFormData.phone.trim() || null,
        department: employeeFormData.department,
        jobTitle: employeeFormData.jobTitle.trim() || 'Machinery Specialist',
        employeeType: employeeFormData.employeeType,
        employmentStatus: employeeFormData.employmentStatus,
        dateOfJoining: employeeFormData.dateOfJoining,
        tags: employeeFormData.tags ? employeeFormData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        address: {
          street: employeeFormData.street,
          city: employeeFormData.city,
          state: employeeFormData.state,
          postalCode: employeeFormData.postalCode,
          country: employeeFormData.country,
        },
        salaryDetails: {
          monthly_base_paise: employeeFormData.monthlySalary ? Math.round(Number(employeeFormData.monthlySalary) * 100) : 0,
          currency: 'INR',
        },
        bankDetails: {
          bankName: employeeFormData.bankName,
          accountNumber: employeeFormData.accountNumber,
          ifscCode: employeeFormData.ifscCode,
          beneficiaryName: employeeFormData.beneficiaryName,
        },
      };

      if (editingStaffId) {
        payload.staffId = editingStaffId;
      }

      const res = await fetch('/api/operations/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save employee profile');
      }

      setNotification({
        type: 'success',
        message: editingStaffId ? 'Employee updated successfully.' : 'New employee registered successfully.',
      });
      setIsEmployeeModalOpen(false);
      setEditingStaffId(null);
      await onRefreshData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error saving employee' });
    }
  };

  // ──────────────────────────────────────────────────────────
  // FILTERED EMPLOYEES & KPIS
  // ──────────────────────────────────────────────────────────
  // Deduplicate staff list by unique employee_id to guarantee clean records even if tests inserted duplicates
  const uniqueStaffList = useMemo(() => {
    const seen = new Set<string>();
    const list: StaffRecord[] = [];
    for (const st of staffList) {
      const code = st.employee_id || st.id;
      if (!seen.has(code)) {
        seen.add(code);
        list.push(st);
      }
    }
    return list;
  }, [staffList]);

  const activeEmployeeCount = useMemo(() => {
    return uniqueStaffList.filter((s) => (s.employment_status || s.status) === 'active').length;
  }, [uniqueStaffList]);

  const onLeaveEmployeeCount = useMemo(() => {
    return uniqueStaffList.filter((s) => (s.employment_status || s.status) === 'on_leave').length;
  }, [uniqueStaffList]);

  const inactiveEmployeeCount = useMemo(() => {
    return uniqueStaffList.filter((s) => (s.employment_status || s.status) === 'inactive' || (s.employment_status || s.status) === 'terminated').length;
  }, [uniqueStaffList]);

  const currentlyWorkingCount = useMemo(() => {
    return attendanceList.filter((a) => a.check_in && !a.check_out).length;
  }, [attendanceList]);

  const pendingLeavesCount = useMemo(() => {
    return leaveList.filter((l) => l.status === 'pending').length;
  }, [leaveList]);

  const filteredLeaves = useMemo(() => {
    return leaveList.filter((l) => {
      if (leaveStatusFilter !== 'all' && l.status !== leaveStatusFilter) return false;
      if (leaveStaffFilter !== 'all' && l.staff_id !== leaveStaffFilter) return false;
      return true;
    });
  }, [leaveList, leaveStatusFilter, leaveStaffFilter]);

  const filteredEmployees = useMemo(() => {
    return uniqueStaffList.filter((st) => {
      if (empTypeFilter !== 'all' && (st.employee_type || 'full-time') !== empTypeFilter) return false;
      if (empDeptFilter !== 'all' && st.department !== empDeptFilter) return false;
      if (empStatusFilter !== 'all' && (st.employment_status || st.status) !== empStatusFilter) return false;
      if (empSearch.trim()) {
        const q = empSearch.toLowerCase();
        const m =
          st.full_name.toLowerCase().includes(q) ||
          st.employee_id.toLowerCase().includes(q) ||
          st.department.toLowerCase().includes(q) ||
          st.job_title.toLowerCase().includes(q) ||
          (st.email && st.email.toLowerCase().includes(q));
        if (!m) return false;
      }
      return true;
    });
  }, [uniqueStaffList, empTypeFilter, empDeptFilter, empStatusFilter, empSearch]);

  // Departments list for filter
  const departments = useMemo(() => {
    const s = new Set<string>();
    uniqueStaffList.forEach((st) => {
      if (st.department) s.add(st.department);
    });
    return Array.from(s);
  }, [uniqueStaffList]);

  // Format INR Helper
  const formatINR = (paise?: number | null) => {
    if (!paise) return '₹0';
    return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
      {/* ── Top Header & Notification ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
            <span>Operations Console</span>
            <span>/</span>
            <span style={{ color: currentTheme.primary, fontWeight: 600 }}>Human Resources</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Personnel, Operations & Expense Workspace
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            PostgreSQL-backed employee directory, live shop floor work tracking, and audited expense reimbursement desk.
          </p>
        </div>

        {/* Global Refresh Button */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={async () => {
              await onRefreshData();
              if (primaryTab === 'expenses') await fetchExpenses();
              setNotification({ type: 'success', message: 'HR records refreshed from PostgreSQL database.' });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
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

      {/* ── PRIMARY TABS NAVIGATION ── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '2px', marginBottom: '24px' }}>
        {[
          { id: 'employees', label: '1. EMPLOYEES', icon: Users, count: uniqueStaffList.length },
          { id: 'working', label: '2. WORKING', icon: Briefcase, count: currentlyWorkingCount },
          { id: 'leaves', label: '3. LEAVE APPROVALS', icon: Calendar, count: pendingLeavesCount },
          { id: 'expenses', label: '4. EXPENSES', icon: Receipt, count: expensesList.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = primaryTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setPrimaryTab(tab.id as typeof primaryTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                border: 'none',
                borderBottom: isActive ? `3px solid ${currentTheme.primary}` : '3px solid transparent',
                backgroundColor: isActive ? currentTheme.lightBg : 'transparent',
                color: isActive ? currentTheme.primary : '#64748b',
                fontWeight: isActive ? 700 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                borderRadius: '6px 6px 0 0',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span
                style={{
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: isActive ? currentTheme.primary : '#e2e8f0',
                  color: isActive ? '#ffffff' : '#475569',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PRIMARY TAB 1: EMPLOYEES
      ══════════════════════════════════════════════════════════════ */}
      {primaryTab === 'employees' && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Employees</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{uniqueStaffList.length}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Verified active profiles</div>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Currently Working</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>{currentlyWorkingCount}</div>
              <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px' }}>Active clock-in on shift</div>
            </div>
            <div
              onClick={() => setPrimaryTab('leaves')}
              style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', cursor: 'pointer', transition: 'all 0.15s ease' }}
              title="Click to view Leave Approvals"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>Employees On Leave</div>
                {pendingLeavesCount > 0 && (
                  <span style={{ fontSize: '10px', backgroundColor: '#f59e0b', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                    {pendingLeavesCount} Pending
                  </span>
                )}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#b45309', marginTop: '4px' }}>{onLeaveEmployeeCount}</div>
              <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                Approved on shift · View {pendingLeavesCount} Pending Requests →
              </div>
            </div>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Inactive Employees</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#b91c1c', marginTop: '4px' }}>{inactiveEmployeeCount}</div>
              <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '2px' }}>Terminated or inactive</div>
            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search name, ID, role, dept..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              {/* Type Filter */}
              <select
                value={empTypeFilter}
                onChange={(e) => setEmpTypeFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#334155' }}
              >
                <option value="all">All Types</option>
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
              </select>

              {/* Department Filter */}
              <select
                value={empDeptFilter}
                onChange={(e) => setEmpDeptFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#334155' }}
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={empStatusFilter}
                onChange={(e) => setEmpStatusFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#334155' }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            {/* Add Employee Button */}
            <button
              onClick={() => {
                setEditingStaffId(null);
                setEmployeeFormData({
                  employeeId: `KB-EMP-${Math.floor(1000 + Math.random() * 9000)}`,
                  fullName: '',
                  email: '',
                  phone: '',
                  department: 'Fabrication',
                  jobTitle: '',
                  employeeType: 'full-time',
                  employmentStatus: 'active',
                  dateOfJoining: new Date().toISOString().slice(0, 10),
                  tags: '',
                  street: '',
                  city: '',
                  state: '',
                  postalCode: '',
                  country: 'India',
                  monthlySalary: '',
                  bankName: '',
                  accountNumber: '',
                  ifscCode: '',
                  beneficiaryName: '',
                });
                setIsEmployeeModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: currentTheme.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <UserPlus size={15} /> Add Employee
            </button>
          </div>

          {/* Employee Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px 14px' }}>Employee</th>
                  <th style={{ padding: '12px 14px' }}>Type</th>
                  <th style={{ padding: '12px 14px' }}>Role & Dept</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Tags</th>
                  <th style={{ padding: '12px 14px' }}>Joining Date</th>
                  <th style={{ padding: '12px 14px' }}>Contact</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                      <Users size={32} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>No employees found</div>
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>Try adjusting your filters or click "+ Add Employee" to create one.</div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((st) => (
                    <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: currentTheme.lightBg,
                              color: currentTheme.primary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '11px',
                            }}
                          >
                            {st.full_name ? st.full_name.slice(0, 2).toUpperCase() : 'KB'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{st.full_name}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>{st.employee_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ textTransform: 'capitalize', color: '#475569', fontWeight: 500 }}>
                          {st.employee_type || 'full-time'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{st.job_title}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{st.department}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            backgroundColor:
                              (st.employment_status || st.status) === 'active'
                                ? '#dcfce7'
                                : (st.employment_status || st.status) === 'on_leave'
                                ? '#fef3c7'
                                : '#fee2e2',
                            color:
                              (st.employment_status || st.status) === 'active'
                                ? '#15803d'
                                : (st.employment_status || st.status) === 'on_leave'
                                ? '#b45309'
                                : '#b91c1c',
                          }}
                        >
                          {st.employment_status || st.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {st.tags && st.tags.length > 0 ? (
                            st.tags.map((tg, idx) => (
                              <span key={idx} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                                {tg}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#64748b' }}>
                        {st.date_of_joining ? String(st.date_of_joining).slice(0, 10) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: '#0f172a' }}>{st.email}</div>
                        {st.phone && <div style={{ fontSize: '11px', color: '#64748b' }}>{st.phone}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenDetailModal(st.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Eye size={12} /> View Details
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(st)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: currentTheme.primary,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                        </div>
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
          PRIMARY TAB 2: WORKING
      ══════════════════════════════════════════════════════════════ */}
      {primaryTab === 'working' && (
        <div>
          {/* Header Controls for Working */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Date Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>DATE</label>
                <input
                  type="date"
                  value={workingDate}
                  onChange={(e) => setWorkingDate(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              {/* Status Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>STATUS</label>
                <select
                  value={workingStatusFilter}
                  onChange={(e) => setWorkingStatusFilter(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="working">Working (Active)</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="on_leave">On Leave</option>
                  <option value="not_checked_in">Not Checked In</option>
                </select>
              </div>

              {/* Work Category Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>WORK CATEGORY</label>
                <select
                  value={workingCategoryFilter}
                  onChange={(e) => setWorkingCategoryFilter(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                >
                  <option value="all">All Categories</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Products">Products</option>
                  <option value="Shipping">Shipping</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Employee Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>EMPLOYEE</label>
                <select
                  value={workingEmpFilter}
                  onChange={(e) => setWorkingEmpFilter(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                >
                  <option value="all">All Employees</option>
                  {uniqueStaffList.map((st) => (
                    <option key={st.id} value={st.id}>{st.full_name} ({st.employee_id})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions: Check-In, Work Log, Apply Leave */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setCheckInStaffId(uniqueStaffList[0]?.id || '');
                  setIsCheckInModalOpen(true);
                }}
                style={{
                  padding: '7px 12px',
                  backgroundColor: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Clock size={14} /> Record Check-In
              </button>
              <button
                onClick={() => {
                  setWorkLogStaffId(uniqueStaffList[0]?.id || '');
                  setIsWorkLogModalOpen(true);
                }}
                style={{
                  padding: '7px 12px',
                  backgroundColor: currentTheme.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={14} /> Submit Work Log
              </button>
              <button
                onClick={() => {
                  setLeaveStaffId(uniqueStaffList[0]?.id || '');
                  setIsApplyLeaveModalOpen(true);
                }}
                style={{
                  padding: '7px 12px',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Calendar size={14} /> Apply for Leave
              </button>
            </div>
          </div>

          {/* Working Status Grid / Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px 14px' }}>Employee & Role</th>
                  <th style={{ padding: '12px 14px' }}>Current Status</th>
                  <th style={{ padding: '12px 14px' }}>Work Category</th>
                  <th style={{ padding: '12px 14px' }}>Check-In</th>
                  <th style={{ padding: '12px 14px' }}>Check-Out</th>
                  <th style={{ padding: '12px 14px' }}>Hours Worked</th>
                  <th style={{ padding: '12px 14px' }}>Assigned Task / Order</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {uniqueStaffList
                  .filter((st) => workingEmpFilter === 'all' || st.id === workingEmpFilter)
                  .map((st) => {
                    const att = attendanceList.find((a) => a.staff_id === st.id);
                    const workLogs = workLogsList.filter((w) => w.staff_id === st.id);
                    const latestLog = workLogs[0];

                    // Derive current status
                    let statusLabel = 'Not Checked In';
                    let statusColor = '#64748b';
                    let statusBg = '#f1f5f9';

                    if ((st.employment_status || st.status) === 'on_leave') {
                      statusLabel = 'On Leave';
                      statusColor = '#b45309';
                      statusBg = '#fef3c7';
                    } else if (att?.check_in && !att.check_out) {
                      statusLabel = 'Working';
                      statusColor = '#15803d';
                      statusBg = '#dcfce7';
                    } else if (att?.check_out) {
                      statusLabel = 'Checked Out';
                      statusColor = '#475569';
                      statusBg = '#e2e8f0';
                    }

                    // Apply status filter
                    if (workingStatusFilter === 'working' && statusLabel !== 'Working') return null;
                    if (workingStatusFilter === 'checked_out' && statusLabel !== 'Checked Out') return null;
                    if (workingStatusFilter === 'on_leave' && statusLabel !== 'On Leave') return null;
                    if (workingStatusFilter === 'not_checked_in' && statusLabel !== 'Not Checked In') return null;

                    // Apply category filter
                    const category = att?.work_category || (latestLog?.work_category || 'Manufacturing');
                    if (workingCategoryFilter !== 'all' && category !== workingCategoryFilter) return null;

                    // Calculate hours worked
                    let hoursWorkedStr = '—';
                    if (att?.check_in && att?.check_out) {
                      const diffMs = new Date(att.check_out).getTime() - new Date(att.check_in).getTime();
                      hoursWorkedStr = `${(diffMs / (1000 * 60 * 60)).toFixed(1)} hrs`;
                    } else if (att?.check_in) {
                      const diffMs = Date.now() - new Date(att.check_in).getTime();
                      hoursWorkedStr = `${Math.max(0, (diffMs / (1000 * 60 * 60))).toFixed(1)} hrs (in progress)`;
                    }

                    return (
                      <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{st.full_name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{st.job_title} · {st.employee_id}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: statusBg, color: statusColor }}>
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 500 }}>
                          {category}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#0f172a' }}>
                          {att?.check_in ? new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#0f172a' }}>
                          {att?.check_out ? new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                          {hoursWorkedStr}
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: '280px' }}>
                          {latestLog ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{latestLog.task_description}</div>
                              {latestLog.order_number && <div style={{ fontSize: '11px', color: currentTheme.primary }}>Order #{latestLog.order_number}</div>}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>No task logged today</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {att?.check_in && !att?.check_out ? (
                            <button
                              onClick={async () => {
                                const res = await fetch('/api/operations/hr', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ action: 'check_out', attendanceId: att.id }),
                                });
                                if (res.ok) {
                                  setNotification({ type: 'success', message: `Checked out ${st.full_name}.` });
                                  await onRefreshData();
                                } else {
                                  setNotification({ type: 'error', message: 'Failed to record check-out' });
                                }
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#e11d48',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Check Out
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setCheckInStaffId(st.id);
                                setIsCheckInModalOpen(true);
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#f1f5f9',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Check In
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Daily Work Logs & Leave Approvals Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Left: Work Logs Review */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                  Submitted Daily Work Logs ({workLogsList.length})
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>PostgreSQL Audited</span>
              </div>
              <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {workLogsList.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                    No daily work logs submitted.
                  </div>
                ) : (
                  workLogsList.map((log) => (
                    <div key={log.id} style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#0f172a' }}>
                        <span>{log.full_name}</span>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            backgroundColor: log.status === 'approved' ? '#dcfce7' : log.status === 'submitted' ? '#e0f2fe' : '#fee2e2',
                            color: log.status === 'approved' ? '#15803d' : log.status === 'submitted' ? '#0369a1' : '#b91c1c',
                          }}
                        >
                          {log.status}
                        </span>
                      </div>
                      <div style={{ color: '#334155', marginTop: '4px' }}>{log.task_description}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                        <span>{(log.time_spent_minutes / 60).toFixed(1)} hrs spent</span>
                        {log.status === 'submitted' && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={async () => {
                                const res = await fetch('/api/operations/hr', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ action: 'review_work_log', logId: log.id, decision: 'approved', reviewNotes: 'Verified' }),
                                });
                                if (res.ok) {
                                  setNotification({ type: 'success', message: 'Work log approved.' });
                                  await onRefreshData();
                                }
                              }}
                              style={{ padding: '2px 8px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                const notes = prompt('Reason for returning work log:', 'Please provide component details');
                                if (!notes) return;
                                const res = await fetch('/api/operations/hr', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ action: 'review_work_log', logId: log.id, decision: 'returned', reviewNotes: notes }),
                                });
                                if (res.ok) {
                                  setNotification({ type: 'success', message: 'Work log returned for correction.' });
                                  await onRefreshData();
                                }
                              }}
                              style={{ padding: '2px 8px', backgroundColor: '#e11d48', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}
                            >
                              Return
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Leave Requests & Approvals */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                    Leave Approvals Desk ({pendingLeavesCount} Pending)
                  </span>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    PostgreSQL audited · Total Records: {leaveList.length}
                  </div>
                </div>
                <button
                  onClick={() => setPrimaryTab('leaves')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: currentTheme.lightBg,
                    color: currentTheme.primary,
                    border: `1px solid ${currentTheme.primary}`,
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Full Leave Desk →
                </button>
              </div>

              {/* Quick List: Pending on top, then approved/rejected */}
              <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leaveList.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                    No leave requests found in database.
                  </div>
                ) : (
                  [...leaveList]
                    .sort((a, b) => {
                      if (a.status === 'pending' && b.status !== 'pending') return -1;
                      if (a.status !== 'pending' && b.status === 'pending') return 1;
                      return new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime();
                    })
                    .slice(0, 25)
                    .map((l) => {
                      const startDateStr = String(l.start_date).slice(0, 10);
                      const endDateStr = String(l.end_date).slice(0, 10);
                      const sTime = new Date(startDateStr).getTime();
                      const eTime = new Date(endDateStr).getTime();
                      const daysCount = isNaN(sTime) || isNaN(eTime)
                        ? 1
                        : Math.max(1, Math.round((eTime - sTime) / (1000 * 60 * 60 * 24)) + 1);

                      return (
                        <div key={l.id} style={{ padding: '10px 12px', backgroundColor: l.status === 'pending' ? '#fffdf7' : '#f8fafc', borderRadius: '6px', border: `1px solid ${l.status === 'pending' ? '#fde68a' : '#e2e8f0'}`, fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#0f172a' }}>
                            <div>
                              <span>{l.full_name || 'Staff Member'}</span>
                              <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>({l.employee_id || 'ID N/A'})</span>
                              <span style={{ marginLeft: '6px', textTransform: 'uppercase', fontSize: '10px', color: currentTheme.primary, fontWeight: 700 }}>
                                · {l.leave_type} Leave ({daysCount} {daysCount === 1 ? 'day' : 'days'})
                              </span>
                            </div>
                            <span
                              style={{
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                backgroundColor: l.status === 'approved' ? '#dcfce7' : l.status === 'pending' ? '#fef3c7' : '#fee2e2',
                                color: l.status === 'approved' ? '#15803d' : l.status === 'pending' ? '#b45309' : '#b91c1c',
                              }}
                            >
                              {l.status}
                            </span>
                          </div>
                          <div style={{ color: '#64748b', fontSize: '11px', marginTop: '3px' }}>
                            Duration: {startDateStr} to {endDateStr} · Submitted: {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}
                          </div>
                          <div style={{ color: '#334155', marginTop: '4px' }}>Reason: {l.reason}</div>
                          {l.decision_notes && (
                            <div style={{ color: '#64748b', fontSize: '11px', fontStyle: 'italic', marginTop: '2px' }}>
                              Review note: {l.decision_notes} ({l.approved_by || 'HR'})
                            </div>
                          )}
                          {l.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '8px' }}>
                              <button
                                disabled={processingLeaveId === l.id}
                                onClick={async () => {
                                  try {
                                    setProcessingLeaveId(l.id);
                                    const res = await fetch('/api/operations/hr', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ action: 'process_leave', leaveId: l.id, decision: 'approved' }),
                                    });
                                    const d = await res.json();
                                    if (res.ok) {
                                      setNotification({ type: 'success', message: `Leave for ${l.full_name || 'employee'} approved and attendance synced.` });
                                      await onRefreshData();
                                    } else {
                                      setNotification({ type: 'error', message: `Approval failed: ${d.error || 'Server error'}` });
                                    }
                                  } catch (err: any) {
                                    setNotification({ type: 'error', message: err.message });
                                  } finally {
                                    setProcessingLeaveId(null);
                                  }
                                }}
                                style={{ padding: '4px 10px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: processingLeaveId === l.id ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 600, opacity: processingLeaveId === l.id ? 0.7 : 1 }}
                              >
                                {processingLeaveId === l.id ? 'Saving...' : 'Approve'}
                              </button>
                              <button
                                disabled={processingLeaveId === l.id}
                                onClick={async () => {
                                  const notes = prompt('Enter rejection reason (optional):', 'Operational conflict / schedule requirements');
                                  try {
                                    setProcessingLeaveId(l.id);
                                    const res = await fetch('/api/operations/hr', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ action: 'process_leave', leaveId: l.id, decision: 'rejected', decisionNotes: notes || undefined }),
                                    });
                                    const d = await res.json();
                                    if (res.ok) {
                                      setNotification({ type: 'success', message: `Leave application for ${l.full_name || 'employee'} rejected.` });
                                      await onRefreshData();
                                    } else {
                                      setNotification({ type: 'error', message: `Rejection failed: ${d.error || 'Server error'}` });
                                    }
                                  } catch (err: any) {
                                    setNotification({ type: 'error', message: err.message });
                                  } finally {
                                    setProcessingLeaveId(null);
                                  }
                                }}
                                style={{ padding: '4px 10px', backgroundColor: '#e11d48', color: '#fff', border: 'none', borderRadius: '4px', cursor: processingLeaveId === l.id ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 600, opacity: processingLeaveId === l.id ? 0.7 : 1 }}
                              >
                                {processingLeaveId === l.id ? 'Saving...' : 'Reject'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PRIMARY TAB 3: LEAVE APPROVALS DESK
      ══════════════════════════════════════════════════════════════ */}
      {primaryTab === 'leaves' && (
        <div>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>Pending Approvals</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#b45309', marginTop: '4px' }}>{pendingLeavesCount}</div>
              <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>Awaiting HR action</div>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Approved Leaves</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>
                {leaveList.filter((l) => l.status === 'approved').length}
              </div>
              <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px' }}>Attendance automatically marked</div>
            </div>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Rejected Leaves</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#b91c1c', marginTop: '4px' }}>
                {leaveList.filter((l) => l.status === 'rejected').length}
              </div>
              <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '2px' }}>Declined requests</div>
            </div>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Leave Applications</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{leaveList.length}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Historical PostgreSQL records</div>
            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Status Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>STATUS</label>
                <select
                  value={leaveStatusFilter}
                  onChange={(e) => setLeaveStatusFilter(e.target.value as any)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#334155' }}
                >
                  <option value="pending">Pending Review ({pendingLeavesCount})</option>
                  <option value="all">All Applications ({leaveList.length})</option>
                  <option value="approved">Approved ({leaveList.filter((l) => l.status === 'approved').length})</option>
                  <option value="rejected">Rejected ({leaveList.filter((l) => l.status === 'rejected').length})</option>
                </select>
              </div>

              {/* Employee Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>EMPLOYEE</label>
                <select
                  value={leaveStaffFilter}
                  onChange={(e) => setLeaveStaffFilter(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#334155' }}
                >
                  <option value="all">All Employees</option>
                  {uniqueStaffList.map((st) => (
                    <option key={st.id} value={st.id}>{st.full_name} ({st.employee_id})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Apply for Leave Button */}
            <button
              onClick={() => {
                setLeaveStaffId(uniqueStaffList[0]?.id || '');
                setIsApplyLeaveModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: currentTheme.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Calendar size={15} /> Apply for Leave
            </button>
          </div>

          {/* Full Leave Applications Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px 14px' }}>Employee & ID</th>
                  <th style={{ padding: '12px 14px' }}>Leave Type</th>
                  <th style={{ padding: '12px 14px' }}>Duration</th>
                  <th style={{ padding: '12px 14px' }}>Days</th>
                  <th style={{ padding: '12px 14px' }}>Reason</th>
                  <th style={{ padding: '12px 14px' }}>Submission Date</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Reviewer & Stamp</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                      <AlertCircle size={24} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                      <div style={{ fontWeight: 600, color: '#334155' }}>No leave applications match this filter</div>
                      <div style={{ fontSize: '11px', marginTop: '2px' }}>
                        {leaveStatusFilter === 'pending'
                          ? 'Zero pending applications currently awaiting approval.'
                          : 'Try selecting a different status or employee filter.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((l) => {
                    const startDateStr = String(l.start_date).slice(0, 10);
                    const endDateStr = String(l.end_date).slice(0, 10);
                    const sTime = new Date(startDateStr).getTime();
                    const eTime = new Date(endDateStr).getTime();
                    const daysCount = isNaN(sTime) || isNaN(eTime)
                      ? 1
                      : Math.max(1, Math.round((eTime - sTime) / (1000 * 60 * 60 * 24)) + 1);

                    return (
                      <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: l.status === 'pending' ? '#fffdf7' : 'transparent' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{l.full_name || 'Staff Member'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{l.employee_id || 'ID N/A'} · {l.department || 'Operations'}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 600, color: currentTheme.primary }}>
                            {l.leave_type} Leave
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#0f172a' }}>
                          {startDateStr} → {endDateStr}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                          {daysCount} {daysCount === 1 ? 'day' : 'days'}
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: '240px', color: '#334155' }}>
                          {l.reason}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '11px' }}>
                          {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: l.status === 'approved' ? '#dcfce7' : l.status === 'pending' ? '#fef3c7' : '#fee2e2',
                              color: l.status === 'approved' ? '#15803d' : l.status === 'pending' ? '#b45309' : '#b91c1c',
                            }}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '11px', color: '#64748b' }}>
                          {l.approved_by ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{l.approved_by}</div>
                              {l.decision_notes && <div style={{ fontStyle: 'italic' }}>{l.decision_notes}</div>}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Awaiting review</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {l.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                disabled={processingLeaveId === l.id}
                                onClick={async () => {
                                  try {
                                    setProcessingLeaveId(l.id);
                                    const res = await fetch('/api/operations/hr', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ action: 'process_leave', leaveId: l.id, decision: 'approved' }),
                                    });
                                    const d = await res.json();
                                    if (res.ok) {
                                      setNotification({ type: 'success', message: `Leave for ${l.full_name || 'employee'} approved and attendance synced.` });
                                      await onRefreshData();
                                    } else {
                                      setNotification({ type: 'error', message: `Approval failed: ${d.error || 'Server error'}` });
                                    }
                                  } catch (err: any) {
                                    setNotification({ type: 'error', message: err.message });
                                  } finally {
                                    setProcessingLeaveId(null);
                                  }
                                }}
                                style={{
                                  padding: '4px 10px',
                                  backgroundColor: '#059669',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: processingLeaveId === l.id ? 'not-allowed' : 'pointer',
                                  opacity: processingLeaveId === l.id ? 0.7 : 1,
                                }}
                              >
                                {processingLeaveId === l.id ? 'Saving...' : 'Approve'}
                              </button>
                              <button
                                disabled={processingLeaveId === l.id}
                                onClick={async () => {
                                  const notes = prompt('Enter rejection reason (optional):', 'Operational conflict / schedule requirements');
                                  try {
                                    setProcessingLeaveId(l.id);
                                    const res = await fetch('/api/operations/hr', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ action: 'process_leave', leaveId: l.id, decision: 'rejected', decisionNotes: notes || undefined }),
                                    });
                                    const d = await res.json();
                                    if (res.ok) {
                                      setNotification({ type: 'success', message: `Leave application for ${l.full_name || 'employee'} rejected.` });
                                      await onRefreshData();
                                    } else {
                                      setNotification({ type: 'error', message: `Rejection failed: ${d.error || 'Server error'}` });
                                    }
                                  } catch (err: any) {
                                    setNotification({ type: 'error', message: err.message });
                                  } finally {
                                    setProcessingLeaveId(null);
                                  }
                                }}
                                style={{
                                  padding: '4px 10px',
                                  backgroundColor: '#e11d48',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: processingLeaveId === l.id ? 'not-allowed' : 'pointer',
                                  opacity: processingLeaveId === l.id ? 0.7 : 1,
                                }}
                              >
                                {processingLeaveId === l.id ? 'Saving...' : 'Reject'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>Processed</span>
                          )}
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
          PRIMARY TAB 4: EXPENSES
      ══════════════════════════════════════════════════════════════ */}
      {primaryTab === 'expenses' && (
        <div>
          {/* Summary KPIs for Expenses */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Expenses</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                {formatINR(expensesList.reduce((acc, e) => acc + Number(e.amount_paise || 0), 0))}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{expensesList.length} total claims</div>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Approved & Reimbursable</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>
                {formatINR(expensesList.filter((e) => e.status === 'approved').reduce((acc, e) => acc + Number(e.amount_paise || 0), 0))}
              </div>
              <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px' }}>
                {expensesList.filter((e) => e.status === 'approved').length} claims approved
              </div>
            </div>
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>Pending Approvals</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#b45309', marginTop: '4px' }}>
                {formatINR(expensesList.filter((e) => e.status === 'pending').reduce((acc, e) => acc + Number(e.amount_paise || 0), 0))}
              </div>
              <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                {expensesList.filter((e) => e.status === 'pending').length} claims awaiting review
              </div>
            </div>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Rejected Claims</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#b91c1c', marginTop: '4px' }}>
                {formatINR(expensesList.filter((e) => e.status === 'rejected').reduce((acc, e) => acc + Number(e.amount_paise || 0), 0))}
              </div>
              <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '2px' }}>
                {expensesList.filter((e) => e.status === 'rejected').length} claims denied
              </div>
            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Category Filter */}
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#334155' }}
              >
                <option value="all">All Categories</option>
                <option value="Employee expenses">Employee expenses</option>
                <option value="Travel">Travel</option>
                <option value="Food and meals">Food and meals</option>
                <option value="Accommodation">Accommodation</option>
                <option value="Transport">Transport</option>
                <option value="Other operational expenses">Other operational expenses</option>
              </select>

              {/* Status Filter */}
              <select
                value={expenseStatusFilter}
                onChange={(e) => setExpenseStatusFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#334155' }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Employee Filter */}
              <select
                value={expenseStaffFilter}
                onChange={(e) => setExpenseStaffFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#334155' }}
              >
                <option value="all">All Claimants</option>
                {uniqueStaffList.map((st) => (
                  <option key={st.id} value={st.id}>{st.full_name}</option>
                ))}
              </select>
            </div>

            {/* Submit Expense Button */}
            <button
              onClick={() => {
                setExpenseFormData({
                  staffId: uniqueStaffList[0]?.id || '',
                  claimantName: uniqueStaffList[0]?.full_name || '',
                  category: 'Employee expenses',
                  amountRupees: '',
                  expenseDate: new Date().toISOString().slice(0, 10),
                  description: '',
                  receiptUrl: '',
                });
                setIsAddExpenseModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: currentTheme.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Submit Expense Claim
            </button>
          </div>

          {/* Expenses Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px 14px' }}>Expense ID</th>
                  <th style={{ padding: '12px 14px' }}>Claimant / Staff</th>
                  <th style={{ padding: '12px 14px' }}>Category</th>
                  <th style={{ padding: '12px 14px' }}>Expense Date</th>
                  <th style={{ padding: '12px 14px' }}>Description</th>
                  <th style={{ padding: '12px 14px' }}>Amount</th>
                  <th style={{ padding: '12px 14px' }}>Receipt</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Review Actions</th>
                </tr>
              </thead>
              <tbody>
                {expensesList
                  .filter((exp) => {
                    if (expenseCategoryFilter !== 'all' && exp.category !== expenseCategoryFilter) return false;
                    if (expenseStatusFilter !== 'all' && exp.status !== expenseStatusFilter) return false;
                    if (expenseStaffFilter !== 'all' && exp.staff_id !== expenseStaffFilter) return false;
                    return true;
                  })
                  .map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600, color: currentTheme.primary }}>
                        {exp.expense_id}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                        {exp.claimant_name}
                        {exp.employee_id && <div style={{ fontSize: '10px', color: '#64748b' }}>{exp.employee_id}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>
                        {exp.category}
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#64748b' }}>
                        {String(exp.expense_date).slice(0, 10)}
                      </td>
                      <td style={{ padding: '12px 14px', maxWidth: '240px' }}>
                        <div style={{ color: '#0f172a' }}>{exp.description}</div>
                        {exp.review_notes && <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>Note: {exp.review_notes}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                        {formatINR(exp.amount_paise)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {exp.receipt_url ? (
                          <a
                            href={exp.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: currentTheme.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                          >
                            <FileText size={12} /> View
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            backgroundColor:
                              (exp.status as any) === 'reimbursed' ? '#dbeafe' :
                              exp.status === 'approved' ? '#dcfce7' :
                              exp.status === 'pending' ? '#fef3c7' : '#fee2e2',
                            color:
                              (exp.status as any) === 'reimbursed' ? '#1d4ed8' :
                              exp.status === 'approved' ? '#15803d' :
                              exp.status === 'pending' ? '#b45309' : '#b91c1c',
                          }}
                        >
                          {exp.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        {exp.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={async () => {
                                const notes = prompt('Approval notes (optional):', 'Approved for reimbursement');
                                const res = await fetch('/api/operations/hr', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ action: 'review_expense', expenseId: exp.id, decision: 'approved', reviewNotes: notes }),
                                });
                                if (res.ok) {
                                  setNotification({ type: 'success', message: `Expense ${exp.expense_id} approved.` });
                                  await fetchExpenses();
                                } else {
                                  const d = await res.json();
                                  setNotification({ type: 'error', message: d.error || 'Approval failed' });
                                }
                              }}
                              style={{ padding: '3px 8px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                const notes = prompt('Rejection reason:', 'Receipt image illegible or missing GST break-up');
                                if (!notes) return;
                                const res = await fetch('/api/operations/hr', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ action: 'review_expense', expenseId: exp.id, decision: 'rejected', reviewNotes: notes }),
                                });
                                if (res.ok) {
                                  setNotification({ type: 'success', message: `Expense ${exp.expense_id} rejected.` });
                                  await fetchExpenses();
                                } else {
                                  const d = await res.json();
                                  setNotification({ type: 'error', message: d.error || 'Rejection failed' });
                                }
                              }}
                              style={{ padding: '3px 8px', backgroundColor: '#e11d48', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : exp.status === 'approved' ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={async () => {
                                const ref = prompt('Enter payment/NEFT/UPI reference number:', `PAY-REF-${Date.now().toString().slice(-6)}`);
                                if (!ref) return;
                                const res = await fetch('/api/operations/hr', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ action: 'reimburse_expense', expenseId: exp.id, reimbursementRef: ref.trim() }),
                                });
                                if (res.ok) {
                                  setNotification({ type: 'success', message: `Expense ${exp.expense_id} marked as reimbursed.` });
                                  await fetchExpenses();
                                } else {
                                  const d = await res.json();
                                  setNotification({ type: 'error', message: d.error || 'Reimbursement failed' });
                                }
                              }}
                              style={{ padding: '3px 8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 600 }}
                            >
                              Mark Reimbursed
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {(exp.status as any) === 'reimbursed' ? 'Reimbursed' : 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: VIEW EMPLOYEE DETAILS
      ══════════════════════════════════════════════════════════════ */}
      {selectedStaffId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  {staffDetailData?.full_name || 'Employee Profile'}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', color: currentTheme.primary }}>{staffDetailData?.employee_id}</span>
                  <span>·</span>
                  <span>{staffDetailData?.job_title}</span>
                  <span>·</span>
                  <span>{staffDetailData?.department}</span>
                </div>
              </div>
              <button onClick={() => setSelectedStaffId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            {isDetailLoading ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>Loading employee records...</div>
            ) : staffDetailData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '12px' }}>
                {/* 1. Personal & Contact Info */}
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px', fontSize: '13px' }}>1. Personal & Contact Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>Email: <strong style={{ color: '#0f172a' }}>{staffDetailData.email}</strong></div>
                    <div>Phone: <strong style={{ color: '#0f172a' }}>{staffDetailData.phone || 'Not provided'}</strong></div>
                    <div>Employee Type: <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{staffDetailData.employee_type || 'Full-time'}</strong></div>
                    <div>Status: <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{staffDetailData.employment_status || staffDetailData.status}</strong></div>
                    <div>Date of Joining: <strong style={{ color: '#0f172a' }}>{String(staffDetailData.date_of_joining).slice(0, 10)}</strong></div>
                  </div>
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                    Address: <strong style={{ color: '#0f172a' }}>
                      {staffDetailData.address?.street
                        ? `${staffDetailData.address.street}, ${staffDetailData.address.city}, ${staffDetailData.address.state} - ${staffDetailData.address.postalCode}`
                        : 'No physical address recorded'}
                    </strong>
                  </div>
                </div>

                {/* 2. Salary Details & History */}
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px', fontSize: '13px' }}>2. Compensation & Salary Records</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      Monthly Base Compensation: <strong style={{ color: '#059669', fontSize: '14px' }}>
                        {staffDetailData.salary_details?.monthly_base_paise ? formatINR(staffDetailData.salary_details.monthly_base_paise) : 'Not specified'}
                      </strong>
                    </div>
                    <div>Currency: <strong style={{ color: '#0f172a' }}>{staffDetailData.salary_details?.currency || 'INR'}</strong></div>
                  </div>
                </div>

                {/* 3. Salary Slips / Payslips */}
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px', fontSize: '13px' }}>3. Salary Slips & Payslips</div>
                  {!staffDetailData.payslips || staffDetailData.payslips.length === 0 ? (
                    <div style={{ color: '#64748b', fontStyle: 'italic', padding: '8px 0' }}>
                      No generated payslips on file for this employee.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {staffDetailData.payslips.map((ps) => (
                        <div key={ps.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          <span>Payslip for <strong>{ps.month_year}</strong> ({formatINR(ps.net_paise)})</span>
                          {ps.document_url ? (
                            <a href={ps.document_url} target="_blank" rel="noopener noreferrer" style={{ color: currentTheme.primary, fontWeight: 600 }}>Download PDF</a>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Archived</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Bank Account Details (Protected & Masked) */}
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>4. Bank Account Details (Strict Access)</div>
                    <button
                      onClick={() => {
                        const next = !revealBankDetails;
                        setRevealBankDetails(next);
                        fetchStaffDetail(staffDetailData.id, next);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: '#fff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: revealBankDetails ? '#e11d48' : currentTheme.primary,
                      }}
                    >
                      {revealBankDetails ? <Lock size={12} /> : <Unlock size={12} />}
                      {revealBankDetails ? 'Mask Bank Info' : 'Authorize & Reveal'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>Bank Name: <strong style={{ color: '#0f172a' }}>{staffDetailData.bank_details?.bankName || 'Not recorded'}</strong></div>
                    <div>Account Number: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{staffDetailData.bank_details?.accountNumber || '••••••••'}</strong></div>
                    <div>IFSC Code: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{staffDetailData.bank_details?.ifscCode || 'Not recorded'}</strong></div>
                    <div>Beneficiary: <strong style={{ color: '#0f172a' }}>{staffDetailData.bank_details?.beneficiaryName || staffDetailData.full_name}</strong></div>
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedStaffId(null)}
                style={{ padding: '8px 16px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: ADD / EDIT EMPLOYEE
      ══════════════════════════════════════════════════════════════ */}
      {isEmployeeModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                {editingStaffId ? 'Edit Employee Profile' : 'Onboard New Employee'}
              </h3>
              <button onClick={() => setIsEmployeeModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Employee ID *</label>
                  <input
                    type="text"
                    value={employeeFormData.employeeId}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, employeeId: e.target.value })}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={employeeFormData.fullName}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, fullName: e.target.value })}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@kitchenbots.in"
                    value={employeeFormData.email}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={employeeFormData.phone}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Department</label>
                  <select
                    value={employeeFormData.department}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="Fabrication">Fabrication</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Sales">Sales</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Designation / Job Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. CNC Lead Machinist"
                    value={employeeFormData.jobTitle}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, jobTitle: e.target.value })}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Employee Type</label>
                  <select
                    value={employeeFormData.employeeType}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, employeeType: e.target.value })}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Employment Status</label>
                  <select
                    value={employeeFormData.employmentStatus}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, employmentStatus: e.target.value })}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Date of Joining</label>
                <input
                  type="date"
                  value={employeeFormData.dateOfJoining}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, dateOfJoining: e.target.value })}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. CNC, Heavy Machinery, Night Shift"
                  value={employeeFormData.tags}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, tags: e.target.value })}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              {/* Bank Details section */}
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Bank Account & Compensation Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Monthly Base Salary (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 45000"
                      value={employeeFormData.monthlySalary}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, monthlySalary: e.target.value })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank"
                      value={employeeFormData.bankName}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, bankName: e.target.value })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 5010049281928"
                      value={employeeFormData.accountNumber}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, accountNumber: e.target.value })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '2px' }}>IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={employeeFormData.ifscCode}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, ifscCode: e.target.value })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                style={{ padding: '8px 16px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmployee}
                style={{ padding: '8px 18px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                {editingStaffId ? 'Save Changes' : 'Create Employee Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: RECORD CHECK-IN
      ══════════════════════════════════════════════════════════════ */}
      {isCheckInModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '440px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Record Employee Check-In</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Employee *</label>
                <select
                  value={checkInStaffId}
                  onChange={(e) => setCheckInStaffId(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  {uniqueStaffList.map((st) => (
                    <option key={st.id} value={st.id}>{st.full_name} ({st.employee_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Work Category *</label>
                <select
                  value={checkInWorkCategory}
                  onChange={(e) => setCheckInWorkCategory(e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Status</label>
                <select
                  value={checkInStatus}
                  onChange={(e) => setCheckInStatus(e.target.value as any)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="present">Present (On Time)</option>
                  <option value="late">Late Arrival</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Shift Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Shop floor induction unit QA shift"
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setIsCheckInModalOpen(false)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px' }}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/operations/hr', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        action: 'check_in',
                        staffId: checkInStaffId,
                        date: workingDate,
                        status: checkInStatus,
                        notes: checkInNotes,
                      }),
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || 'Check-in failed');
                    setNotification({ type: 'success', message: 'Check-in recorded with server timestamp.' });
                    setIsCheckInModalOpen(false);
                    await onRefreshData();
                  } catch (err: any) {
                    setNotification({ type: 'error', message: err.message });
                  }
                }}
                style={{ padding: '6px 14px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}
              >
                Confirm Check-In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: SUBMIT DAILY WORK LOG
      ══════════════════════════════════════════════════════════════ */}
      {isWorkLogModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '480px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Submit Daily Work Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Employee *</label>
                <select
                  value={workLogStaffId}
                  onChange={(e) => setWorkLogStaffId(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  {uniqueStaffList.map((st) => (
                    <option key={st.id} value={st.id}>{st.full_name} ({st.employee_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Task Description & Progress *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. CNC fabrication for commercial blender base plates"
                  value={workLogTaskDesc}
                  onChange={(e) => setWorkLogTaskDesc(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Hours Spent *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={workLogHours}
                    onChange={(e) => setWorkLogHours(e.target.value)}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Completed Output</label>
                  <input
                    type="text"
                    placeholder="e.g. 12 units inspected"
                    value={workLogCompleted}
                    onChange={(e) => setWorkLogCompleted(e.target.value)}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Pending Work & Blockers</label>
                <input
                  type="text"
                  placeholder="e.g. Awaiting wiring harnesses from warehouse"
                  value={workLogBlockers}
                  onChange={(e) => setWorkLogBlockers(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setIsWorkLogModalOpen(false)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px' }}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/operations/hr', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        action: 'submit_work_log',
                        staffId: workLogStaffId,
                        date: workingDate,
                        taskDescription: workLogTaskDesc,
                        timeSpentMinutes: Math.round(Number(workLogHours) * 60),
                        completedWork: workLogCompleted,
                        blockers: workLogBlockers,
                      }),
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || 'Work log submission failed');
                    setNotification({ type: 'success', message: 'Work log submitted for manager review.' });
                    setIsWorkLogModalOpen(false);
                    await onRefreshData();
                  } catch (err: any) {
                    setNotification({ type: 'error', message: err.message });
                  }
                }}
                style={{ padding: '6px 14px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}
              >
                Submit Work Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: APPLY FOR LEAVE
      ══════════════════════════════════════════════════════════════ */}
      {isApplyLeaveModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '440px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Apply for Leave</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Employee *</label>
                <select
                  value={leaveStaffId}
                  onChange={(e) => setLeaveStaffId(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  {uniqueStaffList.map((st) => (
                    <option key={st.id} value={st.id}>{st.full_name} ({st.employee_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Leave Type *</label>
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
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Start Date *</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>End Date *</label>
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
                  placeholder="e.g. Family medical emergency"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                disabled={isSubmittingLeave}
                onClick={() => setIsApplyLeaveModalOpen(false)}
                style={{ padding: '6px 12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingLeave}
                onClick={async () => {
                  if (!leaveReason.trim()) {
                    setNotification({ type: 'error', message: 'Leave reason is required.' });
                    return;
                  }
                  if (new Date(leaveEndDate) < new Date(leaveStartDate)) {
                    setNotification({ type: 'error', message: 'End date cannot be earlier than start date.' });
                    return;
                  }
                  try {
                    setIsSubmittingLeave(true);
                    const res = await fetch('/api/operations/hr', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        action: 'request_leave',
                        staffId: leaveStaffId,
                        leaveType,
                        startDate: leaveStartDate,
                        endDate: leaveEndDate,
                        reason: leaveReason.trim(),
                      }),
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || 'Leave request failed');
                    setNotification({ type: 'success', message: `Leave application for ${d.leave?.id || 'employee'} submitted in pending status.` });
                    setIsApplyLeaveModalOpen(false);
                    setLeaveReason('');
                    await onRefreshData();
                  } catch (err: any) {
                    setNotification({ type: 'error', message: err.message });
                  } finally {
                    setIsSubmittingLeave(false);
                  }
                }}
                style={{
                  padding: '6px 14px',
                  backgroundColor: currentTheme.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: isSubmittingLeave ? 'not-allowed' : 'pointer',
                  opacity: isSubmittingLeave ? 0.7 : 1,
                }}
              >
                {isSubmittingLeave ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: SUBMIT EXPENSE CLAIM
      ══════════════════════════════════════════════════════════════ */}
      {isAddExpenseModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '480px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>Submit Expense Claim</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Claimant / Employee *</label>
                <select
                  value={expenseFormData.staffId}
                  onChange={(e) => {
                    const st = uniqueStaffList.find((s) => s.id === e.target.value);
                    setExpenseFormData({
                      ...expenseFormData,
                      staffId: e.target.value,
                      claimantName: st ? st.full_name : '',
                    });
                  }}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  {uniqueStaffList.map((st) => (
                    <option key={st.id} value={st.id}>{st.full_name} ({st.employee_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Expense Category *</label>
                <select
                  value={expenseFormData.category}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value as any })}
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
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 2450"
                    value={expenseFormData.amountRupees}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, amountRupees: e.target.value })}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Date of Expense *</label>
                  <input
                    type="date"
                    value={expenseFormData.expenseDate}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, expenseDate: e.target.value })}
                    style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Taxi travel to client factory for machine installation"
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                  style={{ width: '100%', padding: '7px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <SecureFileUpload
                label="Receipt / Bill (Optional JPG, PNG, PDF)"
                category="receipt"
                currentFileUrl={expenseFormData.receiptUrl || undefined}
                onUploadSuccess={(file) => setExpenseFormData({ ...expenseFormData, receiptUrl: file.url })}
                onRemove={() => setExpenseFormData({ ...expenseFormData, receiptUrl: '' })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setIsAddExpenseModalOpen(false)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '6px' }}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!expenseFormData.amountRupees || !expenseFormData.description) {
                    setNotification({ type: 'error', message: 'Amount and description are required.' });
                    return;
                  }
                  try {
                    const res = await fetch('/api/operations/hr', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        action: 'create_expense',
                        staffId: expenseFormData.staffId,
                        claimantName: expenseFormData.claimantName || 'Staff Member',
                        category: expenseFormData.category,
                        amountPaise: Math.round(Number(expenseFormData.amountRupees) * 100),
                        currency: 'INR',
                        expenseDate: expenseFormData.expenseDate,
                        description: expenseFormData.description,
                        receiptUrl: expenseFormData.receiptUrl || undefined,
                      }),
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || 'Expense claim creation failed');
                    setNotification({ type: 'success', message: 'Expense submitted for manager approval.' });
                    setIsAddExpenseModalOpen(false);
                    await fetchExpenses();
                  } catch (err: any) {
                    setNotification({ type: 'error', message: err.message });
                  }
                }}
                style={{ padding: '6px 14px', backgroundColor: currentTheme.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}
              >
                Submit Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
