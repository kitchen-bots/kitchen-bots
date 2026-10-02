import React from 'react';

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
      <img
        src="/images/kitchenbots-logo-white.svg"
        alt="Kitchen Bots"
        style={{
          height: '34px',
          width: 'auto',
          maxWidth: '200px',
          objectFit: 'contain',
          display: 'block',
        }}
      />
      <span
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#f97316',
          backgroundColor: '#1c1917',
          border: '1px solid rgba(249, 115, 22, 0.35)',
          padding: '2px 6px',
          borderRadius: '4px',
          lineHeight: '1.2',
        }}
      >
        OPERATIONS
      </span>
    </div>
  );
}

export default Logo;
