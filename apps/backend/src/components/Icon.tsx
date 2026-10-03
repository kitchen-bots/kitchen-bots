import React from 'react';

export function Icon() {
  return (
    <img
      src="/images/kitchenbots-icon.svg"
      alt="Kitchen Bots"
      style={{
        width: '24px',
        height: '24px',
        objectFit: 'contain',
        display: 'block',
        borderRadius: '5px',
      }}
    />
  );
}

export default Icon;
