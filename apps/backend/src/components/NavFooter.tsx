'use client';

import React from 'react';

export function NavFooter() {
  return (
    <div className="kb-nav-footer">
      <div className="kb-nav-divider" />

      {/* Live Storefront Quick Launcher */}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="kb-nav-storefront-btn"
      >
        <div className="kb-nav-storefront-left">
          <svg
            className="kb-nav-storefront-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>Live Storefront</span>
        </div>
        <svg
          className="kb-nav-external-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>

      {/* System Status Pill */}
      <div className="kb-nav-system-status">
        <div className="kb-nav-system-row">
          <span className="kb-nav-system-dot" />
          <span className="kb-nav-system-label">PostgreSQL & S3</span>
        </div>
        <span className="kb-nav-system-ver">v1.0.0</span>
      </div>
    </div>
  );
}

export default NavFooter;
