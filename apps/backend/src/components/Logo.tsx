import React from 'react';

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="32" height="32" rx="8" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
        {/* Robotic precision flame mark */}
        <path
          d="M16 6C16 11 11 13 11 18C11 20.7614 13.2386 23 16 23C18.7614 23 21 20.7614 21 18C21 15 18.5 13.5 18 10C17.5 12 16.5 13 16 14C15.5 12.5 16 9 16 6Z"
          fill="#f97316"
        />
        <circle cx="16" cy="18" r="2.5" fill="#facc15" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#fafafa',
            lineHeight: 1.1,
          }}
        >
          KITCHEN<span style={{ color: '#f97316' }}>BOTS</span>
        </span>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '9px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#71717a',
            marginTop: '2px',
          }}
        >
          MANAGEMENT SYSTEM
        </span>
      </div>
    </div>
  );
}

export default Logo;
