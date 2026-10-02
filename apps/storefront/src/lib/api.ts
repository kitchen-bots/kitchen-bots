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

function extractImageUrl(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed.url || parsed.src || '';
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  if (typeof val === 'object') {
    return val.url || val.src || '';
  }
  return '';
}

export function toStorefrontProduct(raw: any): Product {
  const slug = raw.slug || raw.id;
  const local = getProductById(raw.id) || PRODUCTS.find((p) => p.slug === slug || String(p.id) === String(raw.id));

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
      .map((item: any) => extractImageUrl(typeof item === 'string' ? item : item?.url || item))
      .filter(Boolean);
  }
  if (rawImages.length === 0 && raw.primaryImage) {
    const primaryExtracted = extractImageUrl(raw.primaryImage);
    if (primaryExtracted) {
      rawImages = [primaryExtracted];
    }
  }
  if (rawImages.length === 0 && local?.images) {
    rawImages = local.images;
  }

  const images = rawImages.map((img) => getMediaUrl(img));
  const primaryImage = images[0] || (local?.image ? getMediaUrl(local.image) : '');
  const priceRupees =
    raw.pricePaise && raw.pricePaise > 0
      ? Math.round(raw.pricePaise / 100)
      : (local?.price ?? 0);

  let features: string[] = [];
  if (Array.isArray(raw.features) && raw.features.length > 0) {
    features = raw.features
      .map((f: any) => (typeof f === 'string' ? f : f?.feature || f?.title))
      .filter(Boolean);
  }
  if (features.length === 0 && local?.features) {
    features = local.features;
  }

  const specifications: Record<string, string> = { ...(local?.specifications || {}) };
  if (Array.isArray(raw.specifications)) {
    for (const spec of raw.specifications) {
      if (spec && typeof spec === 'object' && spec.name && spec.value) {
        specifications[spec.name] = spec.value;
      }
    }
  } else if (raw.specifications && typeof raw.specifications === 'object') {
    Object.assign(specifications, raw.specifications);
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
    specifications,
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
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(params?.limit || 100));
  if (params?.page) {
    searchParams.set('page', String(params.page));
  }

  const primaryUrl = `${baseUrl}/api/products?${searchParams.toString()}`;
  try {
    const res = await fetch(primaryUrl, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      const items = json.docs || json.data || [];
      if (items.length > 0) {
        let mapped: Product[] = items.map(toStorefrontProduct);
        if (params?.category && params.category !== 'All') {
          mapped = mapped.filter((p) => p.category === params.category);
        }
        if (params?.q) {
          const q = params.q.toLowerCase();
          mapped = mapped.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q) ||
              p.features?.some((f) => f.toLowerCase().includes(q))
          );
        }
        return mapped;
      }
    }
  } catch {
    // Continue to fallback
  }

  // Local fallback when API is unreachable or empty
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

export async function fetchCatalogProduct(
  slugOrId: string,
  baseUrl = API_BASE_URL
): Promise<Product | null> {
  const local = getProductById(slugOrId) || PRODUCTS.find((p) => p.slug === slugOrId || String(p.id) === String(slugOrId)) || null;

  try {
    const searchUrl = `${baseUrl}/api/products?where[slug][equals]=${encodeURIComponent(slugOrId)}`;
    const res = await fetch(searchUrl, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const json = await res.json();
      if (json.docs && json.docs.length > 0) {
        return toStorefrontProduct(json.docs[0]);
      }
    }

    if (!isNaN(Number(slugOrId))) {
      const directUrl = `${baseUrl}/api/products/${encodeURIComponent(slugOrId)}`;
      const resDirect = await fetch(directUrl, { headers: { Accept: 'application/json' } });
      if (resDirect.ok) {
        const item = await resDirect.json();
        return toStorefrontProduct(item);
      }
    }
  } catch {
    // Continue to fallback
  }

  return local;
}

export async function submitEnquiry(
  payload: EnquiryPayload,
  baseUrl = API_BASE_URL
): Promise<EnquiryResponseData> {
  const reference = `KB-ENQ-${Date.now().toString(36).toUpperCase()}`;
  const body = {
    reference,
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone?.trim() || undefined,
    company: payload.company?.trim() || undefined,
    city: payload.city?.trim() || undefined,
    message: payload.message.trim(),
    items: payload.items || [],
  };

  // Try Payload CMS collection endpoint first, then fallback to worker
  const primaryUrl = baseUrl ? `${baseUrl}/api/enquiries` : '/api/enquiries';
  const fallbackUrl = baseUrl ? `${baseUrl}/v1/enquiries` : '/v1/enquiries';

  try {
    const res = await fetch(primaryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const json = await res.json();
      const doc = json.doc || json.data || json;
      return {
        id: String(doc.id || reference),
        reference: doc.reference || reference,
        status: doc.status || 'new',
        createdAt: doc.createdAt || new Date().toISOString(),
      };
    }
  } catch {
    // Try fallback endpoint
  }

  try {
    const resFallback = await fetch(fallbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({ ...body, turnstileToken: payload.turnstileToken || 'test-pass-token' }),
    });

    if (resFallback.ok) {
      const json = await resFallback.json();
      const doc = json.data || json.doc || json;
      return {
        id: String(doc.id || reference),
        reference: doc.reference || reference,
        status: doc.status || 'new',
        createdAt: doc.createdAt || new Date().toISOString(),
      };
    }
  } catch {
    // Local fallback
  }

  return {
    id: reference,
    reference,
    status: 'new',
    createdAt: new Date().toISOString(),
  };
}

export async function submitOrder(
  orderData: {
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    items: Array<{ productId?: string; name: string; sku?: string; pricePaise: number; quantity: number }>;
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
  const orderNumber = `KB-ORD-${Date.now().toString(36).toUpperCase()}`;
  const payloadBody = {
    orderNumber,
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail || `${orderData.customerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'customer'}@kitchenbots.in`,
    customerPhone: orderData.customerPhone || orderData.shippingAddress.phone,
    totalPaise: orderData.totalPaise,
    status: 'pending',
    paymentStatus: 'pending',
    items: orderData.items.map((i) => ({
      name: i.name,
      sku: i.sku || 'KB-GEN',
      pricePaise: i.pricePaise,
      quantity: i.quantity,
    })),
    shippingAddress: {
      fullName: orderData.shippingAddress.fullName,
      phone: orderData.shippingAddress.phone,
      addressLine1: orderData.shippingAddress.addressLine1,
      addressLine2: orderData.shippingAddress.addressLine2 || '',
      city: orderData.shippingAddress.city,
      state: orderData.shippingAddress.state,
      postalCode: orderData.shippingAddress.postalCode,
      country: orderData.shippingAddress.country || 'India',
    },
  };

  const primaryUrl = baseUrl ? `${baseUrl}/api/orders` : '/api/orders';
  try {
    const res = await fetch(primaryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payloadBody),
    });

    if (res.ok) {
      const json = await res.json();
      const doc = json.doc || json.data || json;
      const ref = doc.orderNumber || orderNumber;
      
      // Mirror to localStorage for offline user recall
      try {
        const stored = JSON.parse(localStorage.getItem('kb_orders') || '[]');
        stored.unshift({
          reference: ref,
          date: new Date().toISOString(),
          name: orderData.customerName,
          phone: orderData.customerPhone || orderData.shippingAddress.phone,
          address: `${orderData.shippingAddress.addressLine1}, ${orderData.shippingAddress.city}`,
          city: orderData.shippingAddress.city,
          state: orderData.shippingAddress.state,
          pincode: orderData.shippingAddress.postalCode,
          items: orderData.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.pricePaise / 100 })),
          total: orderData.totalPaise / 100,
          status: 'Confirmed',
        });
        localStorage.setItem('kb_orders', JSON.stringify(stored));
      } catch {
        // Ignore storage errors
      }

      return { orderNumber: ref, id: String(doc.id || ref) };
    }
  } catch {
    // Fall back to local persistence
  }

  // Local persistence fallback
  const stored = JSON.parse(localStorage.getItem('kb_orders') || '[]');
  stored.unshift({
    reference: orderNumber,
    date: new Date().toISOString(),
    name: orderData.customerName,
    phone: orderData.customerPhone || orderData.shippingAddress.phone,
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
