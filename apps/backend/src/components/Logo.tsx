import React from 'react';
import { KITCHENBOTS_LOGO_WHITE_DATA_URL } from './brandAssets';

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
      <img
        src={KITCHENBOTS_LOGO_WHITE_DATA_URL}
        alt="KitchenBots India Pvt. Ltd."
        style={{
          height: '46px',
          width: 'auto',
          maxWidth: '220px',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}

export default Logo;
