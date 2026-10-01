import { describe, expect, it } from 'vitest';
import { getPortalUrl } from './portal';

describe('getPortalUrl', () => {
  it('uses the separately configured customer portal', () => {
    expect(getPortalUrl('https://portal.kitchenbots.in')).toBe('https://portal.kitchenbots.in');
  });

  it('falls back to storefront login when the portal is not configured', () => {
    expect(getPortalUrl(undefined)).toBe('/login');
    expect(getPortalUrl('   ')).toBe('/login');
  });
});
