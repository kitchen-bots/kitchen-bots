import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCatalogProduct,
  fetchCatalogProducts,
  submitEnquiry,
  toStorefrontProduct,
  type ApiProduct,
} from './api';
import { getMediaUrl } from './cdn';

const mockApiProduct: ApiProduct = {
  id: 'prod-1',
  slug: 'commercial-bbq-grill',
  name: 'Commercial BBQ Grill',
  categoryId: 'cat-santa-maria',
  description: 'Stainless steel commercial grill.',
  salesMode: 'both',
  pricePaise: 1_800_000,
  currency: 'INR',
  imageUrls: ['https://assets.example.com/grill.webp'],
  specifications: { Material: 'Stainless Steel' },
  features: ['Heavy Duty', 'Stainless Steel'],
};

describe('Storefront API Client', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('toStorefrontProduct converts paise to INR rupees and maps category', () => {
    const product = toStorefrontProduct(mockApiProduct);
    expect(product.id).toBe('prod-1');
    expect(product.name).toBe('Commercial BBQ Grill');
    expect(product.price).toBe(18000);
    expect(product.image).toBe('https://assets.example.com/grill.webp');
    expect(product.images).toEqual(['https://assets.example.com/grill.webp']);
    expect(product.category).toBe('Santa Maria Series');
  });

  it('toStorefrontProduct normalizes ImageItem[] to string[] and SpecificationItem[] to Record<string, string>', () => {
    const rawApiProduct = {
      id: 'prod-1',
      name: 'Commercial BBQ Grill',
      price: 1382,
      images: [
        { id: 'img-1', url: '/images/img1.jpg', isPrimary: true },
        { id: 'img-2', url: '/images/img2.jpg', isPrimary: false }
      ],
      specifications: [
        { id: 'spec-1', name: 'Material', value: '304 Stainless Steel' },
        { id: 'spec-2', label: 'Grate Type', value: 'V-Groove Grate' }
      ],
      features: ['Heavy Duty']
    };

    const product = toStorefrontProduct(rawApiProduct);
    expect(product.images).toEqual([getMediaUrl('/images/img1.jpg'), getMediaUrl('/images/img2.jpg')]);
    expect(product.image).toBe(getMediaUrl('/images/img1.jpg'));
    expect(product.specifications).toEqual({
      Material: '304 Stainless Steel',
      'Grate Type': 'V-Groove Grate'
    });
  });

  it('fetchCatalogProducts fetches from API when API_BASE_URL is set', async () => {
    const mockResponse = {
      data: [mockApiProduct],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const products = await fetchCatalogProducts('https://api.kitchenbots.in');
    expect(products).toHaveLength(1);
    expect(products[0].price).toBe(18000);
    expect(products[0].name).toBe('Commercial BBQ Grill');
  });

  it('fetchCatalogProduct fetches single product by slug or id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockApiProduct }),
    });

    const product = await fetchCatalogProduct('commercial-bbq-grill', 'https://api.kitchenbots.in');
    expect(product).not.toBeNull();
    expect(product?.slug).toBe('commercial-bbq-grill');
    expect(product?.price).toBe(18000);
  });

  it('submitEnquiry posts payload and returns real reference', async () => {
    const mockResult = {
      data: {
        id: 'enq-123',
        reference: 'ENQ-2026-AB12CD',
        status: 'new',
        createdAt: '2026-09-22T12:00:00.000Z',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResult,
    });

    const result = await submitEnquiry(
      {
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        phone: '+919490701421',
        message: 'Looking for commercial kitchen equipment quotes.',
        items: [{ productId: 'prod-1', quantity: 2 }],
        turnstileToken: 'test-pass-token',
      },
      'https://api.kitchenbots.in'
    );

    expect(result.reference).toBe('ENQ-2026-AB12CD');
    expect(result.id).toBe('enq-123');
  });

  it('submitEnquiry throws descriptive error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email address provided.',
        },
      }),
    });

    await expect(
      submitEnquiry(
        {
          name: 'Rahul',
          email: 'invalid-email',
          message: 'Short message',
          turnstileToken: 'token',
        },
        'https://api.kitchenbots.in'
      )
    ).rejects.toThrow('Invalid email address provided.');
  });

  it('submitEnquiry throws error when turnstileToken is missing', async () => {
    await expect(
      submitEnquiry(
        {
          name: 'Rahul',
          email: 'rahul@example.com',
          message: 'Short message',
        },
        'https://api.kitchenbots.in'
      )
    ).rejects.toThrow('Please complete the security verification.');
  });
});
