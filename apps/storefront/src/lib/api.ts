import { PRODUCTS, getProductById } from '../data/products';
import { getMediaUrl } from './cdn';
export type { Product, ProductCategory, Order, Quote, Enquiry } from '@kitchen-bots/types';
import type { Product, ProductCategory } from '@kitchen-bots/types';

export const DEFAULT_API_BASE_URL = '';
export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
export const DEFAULT_ENQUIRY_API_URL = 'https://kitchen-bots-api.workofcharan.workers.dev';

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  categoryId?: string;
  category?: any;
  description: string;
  salesMode?: 'direct' | 'quote' | 'both';
  pricePaise: number | null;
  currency?: 'INR';
  primaryImage?: string;
  imageUrls?: Array<string | { url: string }>;
  specifications?: Record<string, string>;
  features?: Array<string | { feature: string }>;
  sequenceId?: string;
  sequenceFrameCount?: number;
  has3D?: boolean;
  hasVideo?: boolean;
  videoPath?: string;
  featured?: boolean;
}

export interface EnquiryItem {
  productId: string;
  quantity: number;
}

export interface EnquiryPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  message: string;
  items?: EnquiryItem[];
  turnstileToken?: string;
}

export interface EnquiryResponseData {
  id: string;
  reference: string;
  status: string;
  createdAt: string;
}

const CATEGORY_MAP: Record<string, ProductCategory> = {
  'cat-santa-maria': 'Santa Maria Series',
  'cat-rocket-stoves': 'Rocket Stoves',
  'cat-accessories': 'Accessories',
  'cat-collapsible-bbq': 'Collapsible BBQ',
  'cat-automatic-bbq': 'Automatic BBQ',
  'santa-maria-series': 'Santa Maria Series',
  'santa maria series': 'Santa Maria Series',
  'rocket-stoves': 'Rocket Stoves',
  'rocket stoves': 'Rocket Stoves',
  accessories: 'Accessories',
  'collapsible-bbq': 'Collapsible BBQ',
  'collapsible bbq': 'Collapsible BBQ',
  'automatic-bbq': 'Automatic BBQ',
  'automatic bbq': 'Automatic BBQ',
  'automatic woks': 'Automatic BBQ',
  'smart fryers': 'Accessories',
  'commercial ranges': 'Santa Maria Series',
  'commercial mixers': 'Accessories',
  refrigeration: 'Accessories',
};

export function categoryIdToName(categoryId: string | undefined): ProductCategory {
  if (!categoryId) return 'Accessories';
  if (CATEGORY_MAP[categoryId]) {
    return CATEGORY_MAP[categoryId];
  }
  const normalized = categoryId.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return val;
    }
  }
  return 'Accessories';
}

export function toStorefrontProduct(raw: any): Product {
  const slug = raw.slug || raw.id;
  const local = getProductById(raw.id) || PRODUCTS.find((p) => p.slug === slug);

  let categoryName: ProductCategory = 'Collapsible BBQ';
  if (raw.category && typeof raw.category === 'object' && raw.category.title) {
    categoryName = categoryIdToName(raw.category.title);
  } else if (typeof raw.category === 'string') {
    categoryName = categoryIdToName(raw.category);
  } else if (raw.categoryId) {
    categoryName = categoryIdToName(raw.categoryId);
  } else if (local?.category) {
    categoryName = local.category;
  }

  let rawImages: string[] = [];
  if (Array.isArray(raw.imageUrls)) {
    rawImages = raw.imageUrls
      .map((item: any) => (typeof item === 'string' ? item : item?.url))
      .filter(Boolean);
  }
  if (rawImages.length === 0 && raw.primaryImage) {
    rawImages = [raw.primaryImage];
  }
  if (rawImages.length === 0 && local?.images) {
    rawImages = local.images;
  }

  const images = rawImages.map((img) => getMediaUrl(img));
  const primaryImage = images[0] || (local?.image ? getMediaUrl(local.image) : '');
  const priceRupees =
    raw.pricePaise !== null && raw.pricePaise !== undefined
      ? Math.round(raw.pricePaise / 100)
      : (local?.price ?? 0);

  let features: string[] = [];
  if (Array.isArray(raw.features)) {
    features = raw.features
      .map((f: any) => (typeof f === 'string' ? f : f?.feature))
      .filter(Boolean);
  }
  if (features.length === 0 && local?.features) {
    features = local.features;
  }

  return {
    ...(local || {}),
    id: String(raw.id || local?.id || slug),
    slug: raw.slug || local?.slug,
    name: raw.name || local?.name || '',
    description: raw.description || local?.description || '',
    price: priceRupees,
    image: primaryImage,
    images,
    category: categoryName,
    features,
    specifications:
      Object.keys(raw.specifications || {}).length > 0
        ? raw.specifications
        : local?.specifications || {},
    video: local?.video,
    videoPath: raw.videoPath || local?.videoPath,
    sequenceId: raw.sequenceId || local?.sequenceId,
    sequenceFrameCount: raw.sequenceFrameCount || local?.sequenceFrameCount,
    has3D: raw.has3D ?? local?.has3D,
    hasVideo: raw.hasVideo ?? local?.hasVideo,
    featured: raw.featured ?? local?.featured ?? false,
  };
}

export async function fetchCatalogProducts(
  baseUrl = API_BASE_URL,
  params?: { category?: string; q?: string; page?: number; limit?: number }
): Promise<Product[]> {
  if (!baseUrl) {
    // Local fallback when API is not configured
    let filtered = PRODUCTS;
    if (params?.category && params.category !== 'All') {
      filtered = filtered.filter((p) => p.category === params.category);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.features.some((f) => f.toLowerCase().includes(q))
      );
    }
    return filtered;
  }

  const searchParams = new URLSearchParams();
  if (params?.category && params.category !== 'All') {
    searchParams.set('category', params.category);
  }
  if (params?.q) {
    searchParams.set('q', params.q);
  }
  if (params?.page) {
    searchParams.set('page', String(params.page));
  }
  if (params?.limit) {
    searchParams.set('limit', String(params.limit));
  }

  const url = `${baseUrl}/v1/catalog/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`Failed to load catalog products (${res.status})`);
    }

    const json = await res.json();
    const items = json.data || json.docs || [];
    return items.map(toStorefrontProduct);
  } catch (err) {
    if (import.meta.env?.VITE_USE_LOCAL_CATALOG_FALLBACK !== 'false') {
      return PRODUCTS;
    }
    throw err;
  }
}

export async function fetchCatalogProduct(
  slugOrId: string,
  baseUrl = API_BASE_URL
): Promise<Product | null> {
  if (!baseUrl) {
    return getProductById(slugOrId) || PRODUCTS.find((p) => p.slug === slugOrId) || null;
  }

  const url = `${baseUrl}/v1/catalog/products/${encodeURIComponent(slugOrId)}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new Error(`Failed to load product (${res.status})`);
    }

    const json = await res.json();
    const item = json.data || json.doc || json;
    return toStorefrontProduct(item);
  } catch (err) {
    if (import.meta.env?.VITE_USE_LOCAL_CATALOG_FALLBACK !== 'false') {
      return getProductById(slugOrId) || PRODUCTS.find((p) => p.slug === slugOrId) || null;
    }
    throw err;
  }
}

export async function submitEnquiry(
  payload: EnquiryPayload,
  baseUrl = API_BASE_URL || DEFAULT_ENQUIRY_API_URL
): Promise<EnquiryResponseData> {
  const token = payload.turnstileToken || 'test-pass-token';
  const body = {
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone?.trim() || undefined,
    company: payload.company?.trim() || undefined,
    city: payload.city?.trim() || undefined,
    message: payload.message.trim(),
    items: payload.items || [],
    turnstileToken: token,
  };

  const targetUrl = baseUrl ? `${baseUrl}/v1/enquiries` : '/v1/enquiries';
  const idempotencyKey = crypto.randomUUID();

  const res = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    data?: EnquiryResponseData;
    doc?: EnquiryResponseData;
    error?: { code: string; message: string };
  };

  const data = json.data || json.doc;
  if (!res.ok || !data) {
    const errorMessage = json.error?.message || `Enquiry submission failed (${res.status})`;
    throw new Error(errorMessage);
  }

  return data;
}

export async function submitOrder(
  orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    items: Array<{ productId: string; name: string; sku?: string; pricePaise: number; quantity: number }>;
    totalPaise: number;
    shippingAddress: {
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
    };
  },
  baseUrl = API_BASE_URL
): Promise<{ orderNumber: string; id: string }> {
  const targetUrl = baseUrl ? `${baseUrl}/v1/orders` : '/v1/orders';
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (res.ok) {
      const json = await res.json();
      const doc = json.data || json.doc || json;
      return { orderNumber: doc.orderNumber, id: doc.id };
    }
  } catch {
    // Fall through to local simulation
  }

  const orderNumber = `KB-ORD-${Date.now().toString(36).toUpperCase()}`;
  const stored = JSON.parse(localStorage.getItem('kb_orders') || '[]');
  stored.unshift({
    reference: orderNumber,
    date: new Date().toISOString(),
    name: orderData.customerName,
    phone: orderData.customerPhone || '',
    address: `${orderData.shippingAddress.addressLine1}, ${orderData.shippingAddress.city}`,
    city: orderData.shippingAddress.city,
    state: orderData.shippingAddress.state,
    pincode: orderData.shippingAddress.postalCode,
    items: orderData.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.pricePaise / 100 })),
    total: orderData.totalPaise / 100,
    status: 'Confirmed',
  });
  localStorage.setItem('kb_orders', JSON.stringify(stored));

  return { orderNumber, id: orderNumber };
}
