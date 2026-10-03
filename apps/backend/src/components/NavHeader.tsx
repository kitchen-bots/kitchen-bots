'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KITCHENBOTS_ICON_DATA_URL } from './brandAssets';

export function NavHeader() {
  const pathname = usePathname();
  const isDashboardActive = pathname === '/admin' || pathname === '/admin/';

  return (
    <div className="kb-nav-header">
      {/* Brand Header */}
      <div className="kb-nav-brand">
        <Link href="/admin" className="kb-nav-brand-link" title="Kitchen Bots Admin">
          <img
            src={KITCHENBOTS_ICON_DATA_URL}
            alt="Kitchen Bots"
            className="kb-nav-brand-icon-img"
          />
          <div className="kb-nav-brand-info">
            <div className="kb-nav-brand-title">
              <span className="kb-nav-brand-name">Kitchen Bots</span>
              <span className="kb-nav-brand-badge">ADMIN</span>
            </div>
          </div>
        </Link>
        <div className="kb-nav-brand-status">
          <span className="kb-nav-status-dot" />
          <span className="kb-nav-status-text">Fleet Operations</span>
        </div>
      </div>

      {/* Quick Nav Links */}
      <div className="kb-nav-quick">
        <Link
          href="/admin"
          className={`kb-nav-quick-item ${isDashboardActive ? 'active' : ''}`}
        >
          <svg
            className="kb-nav-quick-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
          <span className="kb-nav-quick-label">Overview Dashboard</span>
          <span className="kb-nav-quick-tag">Live</span>
        </Link>
      </div>

      <div className="kb-nav-divider" />
    </div>
  );
}

export default NavHeader;
