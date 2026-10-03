import React from 'react';
import { KITCHENBOTS_ICON_DATA_URL } from './brandAssets';

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
      <img
        src={KITCHENBOTS_ICON_DATA_URL}
        alt="Kitchen Bots"
        style={{
          height: '38px',
          width: '38px',
          objectFit: 'contain',
          display: 'block',
          borderRadius: '8px',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#fafafa',
            }}
          >
            Kitchen Bots
          </span>
          <span
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#f97316',
              backgroundColor: 'rgba(249, 115, 22, 0.12)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              padding: '1px 5px',
              borderRadius: '4px',
              lineHeight: '1.2',
            }}
          >
            ADMIN
          </span>
        </div>
        <span
          style={{
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSize: '11px',
            color: '#71717a',
            marginTop: '1px',
          }}
        >
          Fleet Operations Management
        </span>
      </div>
    </div>
  );
}

export default Logo;
