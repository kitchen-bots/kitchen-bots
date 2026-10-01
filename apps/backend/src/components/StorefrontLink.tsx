import React from 'react';

export function StorefrontLink() {
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: 500,
        color: '#e4e4e7',
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '6px',
        padding: '6px 12px',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#27272a';
        e.currentTarget.style.borderColor = '#3f3f46';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#18181b';
        e.currentTarget.style.borderColor = '#27272a';
      }}
    >
      <span>Live Storefront</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

export default StorefrontLink;
