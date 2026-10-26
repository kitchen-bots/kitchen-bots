'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  Search,
  Filter,
  UserCheck,
  UserPlus,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  IdCard,
  Edit2,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  Lock,
} from 'lucide-react';

interface ManagedUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  company: string | null;
  created_at: string;
  staff_id: string | null;
  employee_id: string | null;
  staff_name: string | null;
  staff_department: string | null;
  staff_job_title: string | null;
  staff_status: string | null;
}

interface UserStats {
  total: number;
  admins: number;
  operations: number;
  hr: number;
  finance: number;
  employees: number;
  customers: number;
  linkedProfiles: number;
}

interface StaffProfileOption {
  id: string;
  employee_id: string;
  full_name: string;
  department: string;
  job_title: string;
  user_id: number | null;
}

export const UserManagementWorkspace: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [staffDirectory, setStaffDirectory] = useState<StaffProfileOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedLinkStatus, setSelectedLinkStatus] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'name_asc' | 'role'>('date_desc');

  // Modal / Side Panel state
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formRole, setFormRole] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formStaffProfileId, setFormStaffProfileId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('employee');
  const [newPhone, setNewPhone] = useState('');
  const [newStaffProfileId, setNewStaffProfileId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedRole !== 'all') params.set('role', selectedRole);
      if (selectedLinkStatus !== 'all') params.set('linkedStatus', selectedLinkStatus);

      const res = await fetch(`/api/operations/users?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffProfiles = async () => {
    try {
      const res = await fetch('/api/operations/hr?tab=directory', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStaffDirectory(data.staff || []);
      }
    } catch {
      // Ignore staff directory load error
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStaffProfiles();
  }, [selectedRole, selectedLinkStatus]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sorting
  const sortedUsers = useMemo(() => {
    const list = [...users];
    if (sortBy === 'name_asc') {
      list.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
    } else if (sortBy === 'role') {
      list.sort((a, b) => a.role.localeCompare(b.role));
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [users, sortBy]);

  const handleEditClick = (u: ManagedUser) => {
    setEditingUser(u);
    setFormRole(u.role);
    setFormName(u.name || '');
    setFormPhone(u.phone || '');
    setFormCompany(u.company || '');
    setFormStaffProfileId(u.staff_id || '');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/operations/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: editingUser.id,
          role: formRole,
          name: formName,
          phone: formPhone,
          company: formCompany,
          staffProfileId: formStaffProfileId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccessToast(`User ${editingUser.email} updated successfully!`);
      setTimeout(() => setSuccessToast(null), 4000);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      setError('Email and initial password are required');
      return;
    }
    setIsCreating(true);
    setError(null);

    try {
      // 1. Create user in Payload CMS collection
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: newEmail.trim(),
          password: newPassword,
          name: newName.trim() || undefined,
          role: newRole,
          phone: newPhone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.errors?.[0]?.message || data.error || 'Failed to create user');
      }

      const createdUserId = data.doc?.id;
      // 2. If staff profile specified, link it
      if (createdUserId && newStaffProfileId) {
        await fetch('/api/operations/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: createdUserId,
            staffProfileId: newStaffProfileId,
          }),
        });
      }

      setSuccessToast(`User ${newEmail} created successfully!`);
      setTimeout(() => setSuccessToast(null), 4000);
      setShowAddModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewPhone('');
      setNewStaffProfileId('');
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Creation error');
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const r = role.toLowerCase();
    switch (r) {
      case 'admin':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', label: 'Admin' };
      case 'operations':
        return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', label: 'Operations' };
      case 'hr':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe', label: 'HR' };
      case 'finance':
        return { bg: '#dcfce7', text: '#166534', border: '#86efac', label: 'Finance' };
      case 'employee':
        return { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc', label: 'Employee' };
      case 'editor':
        return { bg: '#ede9fe', text: '#5b21b6', border: '#ddd6fe', label: 'Editor' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: 'Customer' };
    }
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (email || 'U').slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ padding: '24px 0', maxWidth: '1280px', margin: '0 auto', fontFamily: 'inherit' }}>
      {/* ── Top Header & Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={24} style={{ color: '#0284c7' }} />
            User Management & Access Control
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Manage staff accounts, assign granular role permissions, and link system logins with employee profiles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            style={{
              padding: '9px 14px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '9px 18px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(2, 132, 199, 0.2)',
            }}
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* ── Toasts & Alerts ── */}
      {successToast && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '13px', fontWeight: 500, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          {successToast}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '13px', fontWeight: 500, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── Summary Metrics Bar (Compact, Rich) ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Total Accounts</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{stats.total}</div>
            <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <UserCheck size={12} /> {stats.linkedProfiles} linked to staff
            </div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Administrators</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#991b1b' }}>{stats.admins}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Full system authority</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Operations & HR</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{(stats.operations || 0) + (stats.hr || 0)}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Ops: {stats.operations || 0} · HR: {stats.hr || 0}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Finance</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#166534' }}>{stats.finance || 0}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Invoices & payroll access</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Employees</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0284c7' }}>{stats.employees || 0}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Self-service workspace</div>
          </div>
        </div>
      )}

      {/* ── Search, Filters, and Sorting Bar ── */}
      <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flex: '1', minWidth: '260px', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px' }}>
          <Search size={16} style={{ color: '#94a3b8', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search users by name, email, company, or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', border: 'none', background: 'transparent', padding: '9px 0', fontSize: '13px', color: '#0f172a', outline: 'none' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
              <X size={14} style={{ color: '#94a3b8' }} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#ffffff', color: '#334155' }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="operations">Operations</option>
              <option value="hr">HR</option>
              <option value="finance">Finance</option>
              <option value="employee">Employee</option>
              <option value="editor">Editor</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Profile Link:</span>
            <select
              value={selectedLinkStatus}
              onChange={(e) => setSelectedLinkStatus(e.target.value as any)}
              style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#ffffff', color: '#334155' }}
            >
              <option value="all">All Statuses</option>
              <option value="linked">Linked to Staff</option>
              <option value="unlinked">Unlinked</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#ffffff', color: '#334155' }}
            >
              <option value="date_desc">Newest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="role">Role Grouping</option>
            </select>
          </div>

          {(selectedRole !== 'all' || selectedLinkStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedRole('all');
                setSelectedLinkStatus('all');
                setSearchQuery('');
              }}
              style={{ padding: '7px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#475569', cursor: 'pointer' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── User Listing: CARD / STRUCTURED LIST (STRICTLY NO DATA TABLE) ── */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block', color: '#0284c7' }} />
          Loading user accounts...
        </div>
      ) : sortedUsers.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1', padding: '60px 20px', textAlign: 'center' }}>
          <ShieldAlert size={36} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 6px 0' }}>No users match your criteria</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>Try adjusting your search terms or filter selections.</p>
          <button
            onClick={() => {
              setSelectedRole('all');
              setSelectedLinkStatus('all');
              setSearchQuery('');
            }}
            style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {sortedUsers.map((u) => {
            const badge = getRoleBadge(u.role);
            const initials = getInitials(u.name, u.email);

            return (
              <div
                key={u.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  position: 'relative',
                }}
              >
                <div>
                  {/* Top card bar: Avatar, Name, Role badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', lineHeight: '1.2' }}>
                          {u.name || 'Unnamed Account'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                          <Mail size={12} />
                          {u.email}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Account details snippet */}
                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px', color: '#475569' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Account ID:</span>
                      <strong style={{ color: '#1e293b' }}>#{u.id}</strong>
                    </div>

                    {u.phone && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>Phone:</span>
                        <strong style={{ color: '#1e293b' }}>{u.phone}</strong>
                      </div>
                    )}

                    {u.company && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>Company:</span>
                        <strong style={{ color: '#1e293b' }}>{u.company}</strong>
                      </div>
                    )}

                    {/* Linked Staff Profile Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '6px' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IdCard size={13} /> Staff Record:
                      </span>
                      {u.staff_id ? (
                        <span style={{ color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} /> {u.employee_id} ({u.staff_department || 'Staff'})
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not linked</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Added {new Date(u.created_at).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => handleEditClick(u)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#0284c7',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit2 size={12} />
                    Edit User & Role
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit User Modal / Drawer ── */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Edit User & Permissions</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Account: {editingUser.email} (ID #{editingUser.id})</span>
              </div>
              <button onClick={() => setEditingUser(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Assigned System Role *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff' }}
                >
                  <option value="admin">Admin (Full administrative & security authority)</option>
                  <option value="operations">Operations (Manufacturing, inventory, logistics)</option>
                  <option value="hr">HR (Staff profiles, attendance, leaves, payroll)</option>
                  <option value="finance">Finance (Invoices, payments, expense reimbursement)</option>
                  <option value="editor">Editor (Machinery catalog & content)</option>
                  <option value="employee">Employee (Self-service attendance, tasks, expenses)</option>
                  <option value="customer">Customer (Storefront ordering & quotes)</option>
                </select>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Role changes take effect immediately across all dashboard endpoints.
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Link to Staff Profile
                </label>
                <select
                  value={formStaffProfileId}
                  onChange={(e) => setFormStaffProfileId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff' }}
                >
                  <option value="">-- No staff profile linked --</option>
                  {staffDirectory.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} ({st.employee_id} - {st.department}) {st.user_id && st.user_id !== editingUser.id ? `[Linked to #${st.user_id}]` : ''}
                    </option>
                  ))}
                </select>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Required for employees to log attendance, check in/out, and access their payslips.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Full Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Company / Organization</label>
                <input
                  type="text"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{ padding: '9px 16px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ padding: '9px 20px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Provision New User</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Create an authenticated user account with designated privileges.</span>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@kitchenbots.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Assign Role *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff' }}
                >
                  <option value="employee">Employee (Self-service access)</option>
                  <option value="operations">Operations (Manufacturing & fulfillment)</option>
                  <option value="hr">HR (Personnel, payroll, attendance)</option>
                  <option value="finance">Finance (Invoicing & reimbursement)</option>
                  <option value="editor">Editor (Product catalog)</option>
                  <option value="admin">Admin (Full administrative privileges)</option>
                  <option value="customer">Customer (Storefront only)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Link to Staff Profile (Optional)
                </label>
                <select
                  value={newStaffProfileId}
                  onChange={(e) => setNewStaffProfileId(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff' }}
                >
                  <option value="">-- No staff profile linked --</option>
                  {staffDirectory.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} ({st.employee_id} - {st.department})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Full Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '9px 16px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{ padding: '9px 20px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isCreating ? 'Provisioning...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
