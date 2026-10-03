import React from 'react';
import { KITCHENBOTS_ICON_DATA_URL } from './brandAssets';

export function Icon() {
  return (
    <img
      src={KITCHENBOTS_ICON_DATA_URL}
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
