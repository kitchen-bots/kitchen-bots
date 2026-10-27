'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Layers,
  Users,
  Factory,
  Wrench,
  FileText,
  Receipt,
  CreditCard,
  UserCheck,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  Palette,
  FolderOpen,
  Warehouse,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  tab?: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', href: '/admin', exact: true, icon: LayoutDashboard },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { id: 'orders', label: 'Orders', href: '/admin?tab=orders', tab: 'orders', icon: ShoppingCart },
      { id: 'products', label: 'Machinery Catalog', href: '/admin?tab=products', tab: 'products', icon: Boxes },
      { id: 'inventory', label: 'Machinery Inventory', href: '/admin?tab=inventory', tab: 'inventory', icon: Warehouse },
      { id: 'ledger', label: 'Inventory Ledger', href: '/admin?tab=ledger', tab: 'ledger', icon: FileText },
      { id: 'crm', label: 'CRM & Customer Requests', href: '/admin?tab=crm', tab: 'crm', icon: Users },
      { id: 'enquiries', label: 'Inquiries', href: '/admin?tab=enquiries', tab: 'enquiries', icon: FolderOpen },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'manufacturing', label: 'Manufacturing & Fulfillment', href: '/admin?tab=manufacturing', tab: 'manufacturing', icon: Factory },
      { id: 'services', label: 'Service & Support', href: '/admin?tab=services', tab: 'services', icon: Wrench },
      { id: 'documents', label: 'Documents & Reports', href: '/admin?tab=documents', tab: 'documents', icon: FileText },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'invoices', label: 'Invoices', href: '/admin?tab=invoicing', tab: 'invoicing', icon: Receipt },
      { id: 'payments', label: 'Payment Records', href: '/admin?tab=payments', tab: 'payments', icon: CreditCard },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'hr', label: 'HR & Attendance', href: '/admin?tab=hr', tab: 'hr', icon: UserCheck },
      { id: 'employee', label: 'Employee Self-Service', href: '/admin?tab=employee', tab: 'employee', icon: Users },
      { id: 'users', label: 'User Management & Permissions', href: '/admin?tab=users', tab: 'users', icon: ShieldCheck },
    ],
  },
];

const HR_NAV_GROUPS: NavGroup[] = [
  {
    label: 'People & Attendance',
    items: [
      { id: 'hr', label: 'HR Workspace & Staff', href: '/admin?tab=hr', tab: 'hr', icon: UserCheck },
      { id: 'employee', label: 'My Self-Service', href: '/admin?tab=employee', tab: 'employee', icon: Users },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'documents', label: 'Documents & Reports', href: '/admin?tab=documents', tab: 'documents', icon: FileText },
    ],
  },
];

const FINANCE_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Finance & Invoicing',
    items: [
      { id: 'invoices', label: 'Invoices', href: '/admin?tab=invoicing', tab: 'invoicing', icon: Receipt },
      { id: 'payments', label: 'Payment Records', href: '/admin?tab=payments', tab: 'payments', icon: CreditCard },
      { id: 'hr', label: 'Payroll & Expenses', href: '/admin?tab=hr', tab: 'hr', icon: UserCheck },
    ],
  },
  {
    label: 'Self-Service',
    items: [
      { id: 'employee', label: 'My Workspace', href: '/admin?tab=employee', tab: 'employee', icon: Users },
    ],
  },
];

const EMPLOYEE_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Self-Service Portal',
    items: [
      { id: 'employee', label: 'My Workspace', href: '/admin?tab=employee', tab: 'employee', icon: UserCheck },
    ],
  },
];

export const CustomNav: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [activePalette, setActivePalette] = useState('ocean');
  const [userProfile, setUserProfile] = useState<{ email?: string; name?: string; role?: string } | null>(null);
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);
  const [currentSearch, setCurrentSearch] = useState('');

  // Track search query and location changes
  useEffect(() => {
    const updateSearch = () => {
      setCurrentSearch(window.location.search);
    };

    updateSearch();
    window.addEventListener('popstate', updateSearch);
    window.addEventListener('kb-tab-change', updateSearch);

    return () => {
      window.removeEventListener('popstate', updateSearch);
      window.removeEventListener('kb-tab-change', updateSearch);
    };
  }, [pathname]);

  // Load persistence
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('kb_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setCollapsed(savedCollapsed === 'true');
      }
      const savedPal = localStorage.getItem('kb_admin_palette');
      if (savedPal) {
        setActivePalette(savedPal);
      }
    } catch {
      // ignore
    }

    // Fetch active session user info
    fetch('/api/users/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUserProfile({
            email: data.user.email,
            name: data.user.name || 'Admin',
            role: data.user.role || 'operations',
          });
        }
      })
      .catch(() => {
        // fallback
      });
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('kb_sidebar_collapsed', String(next));
      document.body.classList.toggle('kb-sidebar-collapsed', next);
    } catch {
      // ignore
    }
  };

  const changePalette = (pal: string) => {
    setActivePalette(pal);
    setShowPaletteMenu(false);
    try {
      localStorage.setItem('kb_admin_palette', pal);
      document.documentElement.setAttribute('data-palette', pal);
    } catch {
      // ignore
    }
  };

  const isItemActive = (item: NavItem) => {
    // If item specifies a tab query on /admin
    if (item.tab) {
      if (pathname === '/admin') {
        const params = new URLSearchParams(currentSearch);
        return params.get('tab') === item.tab;
      }
      return false;
    }

    // Exact match for Overview (/admin with no tab or tab=overview)
    if (item.exact) {
      if (pathname === '/admin') {
        const params = new URLSearchParams(currentSearch);
        const tab = params.get('tab');
        return !tab || tab === 'overview';
      }
      return false;
    }

    return pathname?.startsWith(item.href);
  };

  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    // If already on /admin and navigating to a tab, update history and notify without full page reload
    if (pathname === '/admin' && (item.tab || item.exact)) {
      e.preventDefault();
      const url = new URL(window.location.href);
      if (item.tab) {
        url.searchParams.set('tab', item.tab);
      } else {
        url.searchParams.delete('tab');
      }
      window.history.pushState({}, '', url.toString());
      setCurrentSearch(url.search);
      window.dispatchEvent(new Event('popstate'));
      window.dispatchEvent(new Event('kb-tab-change'));
    }
  };

  return (
    <aside
      className={`kb-chatgpt-sidebar ${collapsed ? 'kb-chatgpt-sidebar--collapsed' : ''}`}
      style={{
        width: collapsed ? '68px' : '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        boxShadow: '1px 0 3px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* ── Top Header / Brand Row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '16px 8px' : '16px 14px',
          borderBottom: '1px solid #f1f5f9',
          minHeight: '64px',
        }}
      >
        {!collapsed ? (
          <Link
            href="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              overflow: 'hidden',
            }}
          >
            <img
              src="/images/kitchenbots-logo-white.svg"
              alt="Kitchen Bots"
              style={{
                height: '24px',
                width: 'auto',
                filter: 'invert(1)', // Black logo for light mode
                display: 'block',
              }}
            />
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                fontFamily: 'monospace',
                backgroundColor: 'var(--kb-accent-light, #eff6ff)',
                color: 'var(--kb-accent-primary, #2563eb)',
                border: '1px solid var(--kb-accent-border, #bfdbfe)',
                padding: '2px 5px',
                borderRadius: '4px',
                letterSpacing: '0.08em',
              }}
            >
              OPS
            </span>
          </Link>
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'var(--kb-accent-primary, #2563eb)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
            }}
          >
            KB
          </div>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            background: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            backgroundColor: '#f8fafc',
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* ── Scrollable Navigation Items ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: collapsed ? '12px 6px' : '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {(() => {
          const role = userProfile?.role;
          let groups = NAV_GROUPS;
          if (role === 'employee') groups = EMPLOYEE_NAV_GROUPS;
          else if (role === 'hr') groups = HR_NAV_GROUPS;
          else if (role === 'finance') groups = FINANCE_NAV_GROUPS;
          return groups;
        })().map((group) => (
          <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {!collapsed && (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#94a3b8',
                  paddingInline: '10px',
                  paddingBlock: '4px',
                }}
              >
                {group.label}
              </div>
            )}

            {group.items.map((item) => {
              const active = isItemActive(item);
              const IconComp = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: '10px',
                    padding: collapsed ? '8px' : '8px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: active ? 600 : 500,
                    textDecoration: 'none',
                    color: active ? 'var(--kb-accent-primary, #2563eb)' : '#334155',
                    backgroundColor: active ? 'var(--kb-accent-light, #eff6ff)' : 'transparent',
                    border: active
                      ? '1px solid var(--kb-accent-border, #bfdbfe)'
                      : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <IconComp
                    size={17}
                    style={{
                      color: active ? 'var(--kb-accent-primary, #2563eb)' : '#64748b',
                      flexShrink: 0,
                    }}
                  />
                  {!collapsed && (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Bottom Anchored Account & Settings (ChatGPT Layout) ── */}
      <div
        style={{
          borderTop: '1px solid #f1f5f9',
          padding: collapsed ? '12px 6px' : '12px 10px',
          backgroundColor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {/* Storefront Link */}
        <a
          href={
            process.env.NEXT_PUBLIC_STOREFRONT_URL ||
            (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
              ? 'http://localhost:5173'
              : 'https://kitchen-bots.vercel.app')
          }
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? 'Live Storefront' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px',
            padding: collapsed ? '6px' : '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#64748b',
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={15} />
          {!collapsed && <span>Live Storefront</span>}
        </a>

        {/* Theme Palette Quick Selector */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowPaletteMenu(!showPaletteMenu)}
            title={collapsed ? 'Palette Theme' : undefined}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '8px',
              padding: collapsed ? '6px' : '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#334155',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Palette size={15} style={{ color: 'var(--kb-accent-primary, #2563eb)' }} />
            {!collapsed && <span style={{ textTransform: 'capitalize' }}>Theme: {activePalette}</span>}
          </button>

          {showPaletteMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: collapsed ? '60px' : '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                width: '160px',
                zIndex: 100,
              }}
            >
              {[
                { id: 'ocean', color: '#2563eb', label: 'Ocean' },
                { id: 'emerald', color: '#059669', label: 'Emerald' },
                { id: 'violet', color: '#7c3aed', label: 'Violet' },
                { id: 'amber', color: '#d97706', label: 'Amber' },
                { id: 'rose', color: '#e11d48', label: 'Rose' },
                { id: 'teal', color: '#0f766e', label: 'Teal' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => changePalette(p.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                    border: activePalette === p.id ? '2px solid #0f172a' : '1px solid #e2e8f0',
                    background: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: p.color,
                      display: 'block',
                      marginBottom: '2px',
                    }}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>{p.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Account / Signout row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            paddingTop: '8px',
            borderTop: '1px solid #e2e8f0',
            marginTop: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--kb-accent-primary, #2563eb)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {(userProfile?.name?.[0] || userProfile?.email?.[0] || 'A').toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {userProfile?.name || 'Administrator'}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {userProfile?.role || 'Admin'}
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <a
              href="/admin/logout"
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
            >
              <LogOut size={15} />
            </a>
          )}
        </div>
      </div>
    </aside>
  );
};

export default CustomNav;
