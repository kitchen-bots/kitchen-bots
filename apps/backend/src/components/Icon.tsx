import React from 'react';

export function Icon() {
  return (
    <img
      src="/images/logo-colored.png"
      alt="Kitchen Bots"
      style={{
        width: '24px',
        height: '24px',
        objectFit: 'contain',
        display: 'block',
        borderRadius: '4px',
      }}
    />
  );
}

export default Icon;
