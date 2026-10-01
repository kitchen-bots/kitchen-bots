import { describe, expect, it } from 'vitest';

import { getMediaUrl } from './cdn';

describe('getMediaUrl', () => {
  it('serves relative product assets from the public CDN by default', () => {
    expect(getMediaUrl('/images/products/kb-commercial-bbq.webp')).toBe(
      'https://pub-a4b0711cb441484fbb54bc792d2312b5.r2.dev/images/products/kb-commercial-bbq.webp',
    );
  });

  it.each([
    'https://example.com/product.webp',
    'http://example.com/product.webp',
    'data:image/webp;base64,AAAA',
    'blob:https://example.com/asset-id',
  ])('does not rewrite absolute media URL %s', (url) => {
    expect(getMediaUrl(url)).toBe(url);
  });

  it('returns an empty string for missing media', () => {
    expect(getMediaUrl(undefined)).toBe('');
    expect(getMediaUrl(null)).toBe('');
  });

  it('serves relative redesign assets from the public CDN', () => {
    expect(getMediaUrl('/images/redesign/hero-robot.png')).toBe(
      'https://pub-a4b0711cb441484fbb54bc792d2312b5.r2.dev/images/redesign/hero-robot.png',
    );
    expect(getMediaUrl('/images/redesign/capabilities-hero.png')).toBe(
      'https://pub-a4b0711cb441484fbb54bc792d2312b5.r2.dev/images/redesign/capabilities-hero.png',
    );
  });

  it('regression: ensures no unrouted raw src="/images/redesign/..." exists in JSX files', () => {
    const rawFiles = import.meta.glob<string>('../**/*.{tsx,jsx}', {
      query: '?raw',
      import: 'default',
      eager: true,
    });

    const violations: string[] = [];
    for (const [file, content] of Object.entries(rawFiles)) {
      if (/src=["']\/images\/redesign\//.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });
});
