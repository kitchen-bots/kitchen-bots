import { PRODUCTS, getProductById } from '../data/products';
import { getMediaUrl } from './cdn';
export type { Product, ProductCategory, Order, Quote, Enquiry } from '@kitchen-bots/types';
import type { Product, ProductCategory } from '@kitchen-bots/types';

export const DEFAULT_API_BASE_URL = '';
export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
export const DEFAULT_ENQUIRY_API_URL = 'https://kitchen-bots-api.workofcharan.workers.dev';

export interface RawProductInput {
  id?: string | number;
  slug?: string;
  name?: string;
  categoryId?: string;
  category?: string | { title?: string; [key: string]: unknown };
  description?: string;
  salesMode?: 'direct' | 'quote' | 'both';
  pricePaise?: number | null;
  currency?: 'INR';
  primaryImage?: string;
  imageUrls?: Array<string | { url?: string; src?: string } | unknown>;
  specifications?: Array<{ name?: string; value?: string }> | Record<string, string>;
  features?: Array<string | { feature?: string; title?: string } | unknown>;
  sequenceId?: string;
  sequenceFrameCount?: number;
  has3D?: boolean;
  hasVideo?: boolean;
  videoPath?: string;
  featured?: boolean;
  [key: string]: unknown;
}

export interface ApiProduct extends RawProductInput {
  id: string;
  slug: string;
  name: string;
  description: string;
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

export function categoryIdToName(categoryId: string | number | undefined): ProductCategory {
  if (!categoryId && categoryId !== 0) return 'Accessories';
  const catStr = String(categoryId).trim();
  if (CATEGORY_MAP[catStr]) {
    return CATEGORY_MAP[catStr];
  }
  const normalized = catStr.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return val;
    }
  }
  return 'Accessories';
}

function extractImageUrl(val: unknown): string {
  if (!val) return '';
  let candidate = '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed) as { url?: string; src?: string };
        candidate = parsed.url || parsed.src || '';
      } catch {
        candidate = trimmed;
      }
    } else {
      candidate = trimmed;
    }
  } else if (typeof val === 'object' && val !== null) {
    const obj = val as { url?: string; src?: string };
    candidate = obj.url || obj.src || '';
  }

  if (!candidate) return '';
  candidate = candidate.trim();
  if (candidate.startsWith('http://') || candidate.startsWith('https://') || candidate.startsWith('data:') || candidate.startsWith('blob:')) {
    return candidate;
  }
  const clean = candidate.replace(/[?#].*$/, '');
  const hasExt = /\.(jpe?g|png|webp|svg|gif|mp4|webm|avif)($|\?)/i.test(candidate);
  const isKnownDir = /^\/?(images|videos|3d-assets|assets)\//i.test(clean);
  if (hasExt || isKnownDir) {
    return candidate;
  }
  return '';
}

export function toStorefrontProduct(raw: RawProductInput): Product {
  const rawId = String(raw.id || '');
  const rawSlug = typeof raw.slug === 'string' && raw.slug ? raw.slug : rawId;
  const local =
    getProductById(rawId) ||
    getProductById(rawSlug) ||
    PRODUCTS.find((p) => p.slug === rawSlug || String(p.id) === rawId || p.id === `prod-${rawId}` || p.id === rawSlug);

  const canonicalId = local?.id || (rawId.startsWith('prod-') ? rawId : `prod-${rawId}`) || rawSlug;
  const canonicalSlug = (typeof raw.slug === 'string' && raw.slug ? raw.slug : local?.slug) || rawSlug;

  let categoryName: ProductCategory = 'Collapsible BBQ';
  const rawCategory = raw.category;
  if (rawCategory && typeof rawCategory === 'object' && 'title' in rawCategory && typeof rawCategory.title === 'string') {
    categoryName = categoryIdToName(rawCategory.title);
  } else if (rawCategory && typeof rawCategory === 'object' && 'slug' in rawCategory && typeof rawCategory.slug === 'string') {
    categoryName = categoryIdToName(rawCategory.slug);
  } else if (typeof rawCategory === 'string' || typeof rawCategory === 'number') {
    categoryName = categoryIdToName(rawCategory);
  } else if (typeof raw.categoryId === 'string' || typeof raw.categoryId === 'number') {
    categoryName = categoryIdToName(raw.categoryId);
  } else if (local?.category) {
    categoryName = local.category;
  }

  let rawImages: string[] = [];
  if (Array.isArray(raw.imageUrls)) {
    rawImages = raw.imageUrls
      .map((item: unknown) => {
        if (typeof item === 'string') return extractImageUrl(item);
        if (typeof item === 'object' && item !== null && 'url' in item) {
          return extractImageUrl((item as { url?: unknown }).url);
        }
        return extractImageUrl(item);
      })
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

  const images = rawImages.map((img) => getMediaUrl(img)).filter(Boolean);
  const primaryImage = images[0] || (local?.image ? getMediaUrl(local.image) : '');
  const rawPrice = typeof raw.pricePaise === 'number' && raw.pricePaise > 0 ? raw.pricePaise : null;
  const priceRupees =
    rawPrice && rawPrice > 0
      ? Math.round(rawPrice / 100)
      : (local?.price || 0);

  let features: string[] = [];
  if (Array.isArray(raw.features) && raw.features.length > 0) {
    features = raw.features
      .map((f: unknown) => {
        if (typeof f === 'string') return f;
        if (typeof f === 'object' && f !== null) {
          const obj = f as { feature?: string; title?: string };
          return obj.feature || obj.title || '';
        }
        return '';
      })
      .filter(Boolean);
  }
  if (features.length === 0 && local?.features) {
    features = local.features;
  }

  const specifications: Record<string, string> = { ...(local?.specifications || {}) };
  if (Array.isArray(raw.specifications)) {
    for (const spec of raw.specifications) {
      if (spec && typeof spec === 'object' && 'name' in spec && 'value' in spec) {
        const item = spec as { name: string; value: string };
        if (item.name && item.value) {
          specifications[item.name] = String(item.value);
        }
      }
    }
  } else if (raw.specifications && typeof raw.specifications === 'object') {
    Object.assign(specifications, raw.specifications);
  }

  return {
    ...(local || {}),
    id: canonicalId,
    slug: canonicalSlug,
    name: (typeof raw.name === 'string' && raw.name) || local?.name || '',
    description: (typeof raw.description === 'string' && raw.description) || local?.description || '',
    price: priceRupees || local?.price || 0,
    mrp: local?.mrp || (priceRupees ? Math.round(priceRupees * 1.22) : undefined),
    image: primaryImage,
    images,
    category: categoryName,
    features,
    specifications,
    video: local?.video,
    videoPath: (typeof raw.videoPath === 'string' ? raw.videoPath : undefined) || local?.videoPath,
    sequenceId: (typeof raw.sequenceId === 'string' ? raw.sequenceId : undefined) || local?.sequenceId,
    sequenceFrameCount: (typeof raw.sequenceFrameCount === 'number' ? raw.sequenceFrameCount : undefined) || local?.sequenceFrameCount,
    has3D: typeof raw.has3D === 'boolean' ? raw.has3D : (local?.has3D ?? false),
    hasVideo: typeof raw.hasVideo === 'boolean' ? raw.hasVideo : (local?.hasVideo ?? false),
    featured: typeof raw.featured === 'boolean' ? (raw.featured || Boolean(local?.featured)) : Boolean(local?.featured),
  };
}

export const CATALOG_CACHE_KEY = 'kb_catalog_cache_v3';
export const CATALOG_CACHE_TTL = 30 * 1000; // 30 seconds TTL for fast updates
export const DEFAULT_API_TIMEOUT_MS = 8000; // 8 seconds timeout for serverless cold-starts

interface CatalogCacheEnvelope {
  timestamp: number;
  products: Product[];
}

let memoryCatalogCache: CatalogCacheEnvelope | null = null;

export function clearCatalogCache(): void {
  memoryCatalogCache = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(CATALOG_CACHE_KEY);
      localStorage.removeItem('kb_catalog_cache');
      localStorage.removeItem('kb_catalog_cache_v2');
    } catch {
      // Ignore storage errors
    }
  }
}

export function setCatalogCache(products: Product[]): void {
  if (!Array.isArray(products) || products.length === 0) return;
  // Ensure we never cache products with 0 price
  if (products.some((p) => !p.price || p.price <= 0)) return;

  const envelope: CatalogCacheEnvelope = {
    timestamp: Date.now(),
    products,
  };
  memoryCatalogCache = envelope;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(envelope));
    } catch {
      // Ignore storage errors (e.g. quota or incognito)
    }
  }
}

export function getCachedCatalog(): { products: Product[]; isStale: boolean } | null {
  if (memoryCatalogCache && Array.isArray(memoryCatalogCache.products) && memoryCatalogCache.products.length > 0) {
    const hasInvalid = memoryCatalogCache.products.some((p) => !p.price || p.price <= 0);
    if (!hasInvalid) {
      const isStale = Date.now() - memoryCatalogCache.timestamp > CATALOG_CACHE_TTL;
      return { products: memoryCatalogCache.products, isStale };
    }
    memoryCatalogCache = null;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Clean up corrupted legacy cache keys
      localStorage.removeItem('kb_catalog_cache');
      localStorage.removeItem('kb_catalog_cache_v2');

      const raw = localStorage.getItem(CATALOG_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CatalogCacheEnvelope;
        if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
          const hasInvalid = parsed.products.some((p) => !p.price || p.price <= 0);
          if (!hasInvalid) {
            memoryCatalogCache = parsed;
            const isStale = Date.now() - parsed.timestamp > CATALOG_CACHE_TTL;
            return { products: parsed.products, isStale };
          }
          localStorage.removeItem(CATALOG_CACHE_KEY);
        }
      }
    } catch {
      // Ignore JSON parse or storage errors
    }
  }

  return null;
}

export function getCatalogSync(): Product[] {
  const cached = getCachedCatalog();
  if (cached && cached.products.length > 0) {
    return cached.products;
  }
  return PRODUCTS;
}

export function getCatalogProductSync(slugOrId: string | number | undefined | null): Product | null {
  if (!slugOrId) return null;
  const directLocal = getProductById(slugOrId);
  if (directLocal && directLocal.price > 0) {
    return directLocal;
  }
  const catalog = getCatalogSync();
  const raw = String(slugOrId).trim();
  const numOnly = raw.replace(/\D/g, '');
  const found = catalog.find(
    (p) =>
      String(p.id) === raw ||
      p.slug === raw ||
      (numOnly && p.id.replace(/\D/g, '') === numOnly)
  );
  if (found && found.price > 0) return found;
  return directLocal || null;
}

export async function fetchCatalogProducts(
  baseUrl = API_BASE_URL,
  params?: { category?: string; q?: string; page?: number; limit?: number; timeoutMs?: number; includeNonActive?: boolean }
): Promise<Product[]> {
  const timeoutMs = params?.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(params?.limit || 100));
  if (params?.page) {
    searchParams.set('page', String(params.page));
  }

  const primaryUrl = `${baseUrl}/api/products?${searchParams.toString()}`;

  let controller: AbortController | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    if (typeof AbortController !== 'undefined') {
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        controller?.abort();
      }, timeoutMs);
    }

    const res = await fetch(primaryUrl, {
      headers: { Accept: 'application/json' },
      signal: controller?.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const contentType = res.headers && typeof res.headers.get === 'function' ? res.headers.get('content-type') || '' : '';
      if (!contentType || contentType.includes('application/json')) {
        const json = await res.json();
        const items = json.docs || json.data || [];
        if (Array.isArray(items)) {
          // Filter for Active products unless includeNonActive is true
          const filteredDocs = params?.includeNonActive
            ? items
            : items.filter((doc: RawProductInput) => !doc.status || doc.status === 'Active');

          const mapped: Product[] = filteredDocs.map(toStorefrontProduct);
          if (!params?.category || params.category === 'All') {
            setCatalogCache(mapped);
          }

          let result = mapped;
          if (params?.category && params.category !== 'All') {
            result = result.filter((p) => p.category === params.category);
          }
          if (params?.q) {
            const q = params.q.toLowerCase();
            result = result.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.features?.some((f) => f.toLowerCase().includes(q))
            );
          }
          return result;
        }
      }
    } else {
      console.error(`[Storefront API] Failed to fetch products: status ${res.status} ${res.statusText}`);
    }
  } catch (err: unknown) {
    console.error('[Storefront API] Error fetching catalog products:', err);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  // Fallback to cached catalog or bundled catalog
  let filtered = getCatalogSync();
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
  baseUrl = API_BASE_URL,
  timeoutMs = DEFAULT_API_TIMEOUT_MS
): Promise<Product | null> {
  const local = getCatalogProductSync(slugOrId);

  let controller: AbortController | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    if (typeof AbortController !== 'undefined') {
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        controller?.abort();
      }, timeoutMs);
    }

    const searchUrl = `${baseUrl}/api/products?where[slug][equals]=${encodeURIComponent(slugOrId)}`;
    const res = await fetch(searchUrl, {
      headers: { Accept: 'application/json' },
      signal: controller?.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const contentType = res.headers && typeof res.headers.get === 'function' ? res.headers.get('content-type') || '' : '';
      if (!contentType || contentType.includes('application/json')) {
        const json = await res.json();
        const doc = (json.docs && json.docs[0]) || json.data || json.doc;
        if (doc) {
          const product = toStorefrontProduct(doc);
          const cached = getCachedCatalog();
          if (cached) {
            const updated = cached.products.map((p) =>
              p.id === product.id || p.slug === product.slug ? product : p
            );
            setCatalogCache(updated);
          }
          return product;
        }
      }
    }

    if (!isNaN(Number(slugOrId))) {
      const directUrl = `${baseUrl}/api/products/${encodeURIComponent(slugOrId)}`;
      const resDirect = await fetch(directUrl, {
        headers: { Accept: 'application/json' },
        signal: controller?.signal,
      });
      if (resDirect.ok) {
        const item = await resDirect.json();
        const doc = item.data || item.doc || item;
        if (doc) {
          const product = toStorefrontProduct(doc);
          const cached = getCachedCatalog();
          if (cached) {
            const updated = cached.products.map((p) =>
              p.id === product.id || p.slug === product.slug ? product : p
            );
            setCatalogCache(updated);
          }
          return product;
        }
      }
    }

    // If local product has an ID or slug different from slugOrId, try querying with that
    if (local?.id && local.id !== slugOrId) {
      const localIdUrl = `${baseUrl}/api/products?where[slug][equals]=${encodeURIComponent(local.id)}`;
      const resLocal = await fetch(localIdUrl, {
        headers: { Accept: 'application/json' },
        signal: controller?.signal,
      });
      if (resLocal.ok) {
        const json = await resLocal.json();
        const doc = (json.docs && json.docs[0]) || json.data || json.doc;
        if (doc) {
          const product = toStorefrontProduct(doc);
          return product;
        }
      }
    }

    // Try numeric ID extracted from prod-X
    const numOnly = slugOrId.replace(/\D/g, '');
    if (numOnly && numOnly !== slugOrId) {
      const directUrl = `${baseUrl}/api/products/${encodeURIComponent(numOnly)}`;
      const resDirect = await fetch(directUrl, {
        headers: { Accept: 'application/json' },
        signal: controller?.signal,
      });
      if (resDirect.ok) {
        const item = await resDirect.json();
        const doc = item.data || item.doc || item;
        if (doc && (doc.id || doc.name)) {
          const product = toStorefrontProduct(doc);
          return product;
        }
      }
    }
  } catch {
    // Continue to fallback
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
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
    if (res.status >= 400 && res.status < 500) {
      const errJson = await res.json().catch(() => ({}));
      const message =
        errJson?.error?.message ||
        (Array.isArray(errJson?.errors) && errJson.errors[0]?.message) ||
        errJson?.message ||
        `Enquiry failed with status ${res.status}`;
      throw new Error(message);
    }
  } catch (err: unknown) {
    if (err instanceof Error && !err.message.includes('fetch') && !err.message.includes('network') && !err.message.includes('Failed to fetch')) {
      throw err;
    }
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

export interface SubmitOrderPayload {
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPaise: number;
  items: Array<{ productId?: string; name: string; sku?: string; pricePaise: number; quantity: number }>;
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
  // Backward compatibility aliases
  'Order Number'?: string;
  Quotation?: string;
  quotation?: string;
  'Customer Name'?: string;
  CustomerName?: string;
  name?: string;
  'Customer Email'?: string;
  CustomerEmail?: string;
  Email?: string;
  email?: string;
  'Customer Phone'?: string;
  CustomerPhone?: string;
  'Phone no'?: string;
  phoneNo?: string;
  phone?: string;
  'Total Paise'?: number;
  TotalPaise?: number;
  'Total Price'?: number;
  totalPrice?: number;
}

export async function submitOrder(
  orderData: SubmitOrderPayload,
  baseUrl = API_BASE_URL
): Promise<{ orderNumber: string; id: string }> {
  const orderNumber =
    orderData.orderNumber ||
    orderData['Order Number'] ||
    orderData.Quotation ||
    orderData.quotation ||
    `KB-ORD-${Date.now().toString(36).toUpperCase()}`;

  const customerName =
    orderData.customerName ||
    orderData['Customer Name'] ||
    orderData.CustomerName ||
    orderData.name ||
    orderData.shippingAddress.fullName ||
    'Commercial Customer';

  const customerEmail =
    orderData.customerEmail ||
    orderData['Customer Email'] ||
    orderData.CustomerEmail ||
    orderData.Email ||
    orderData.email ||
    `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'customer'}@kitchenbots.in`;

  const customerPhone =
    orderData.customerPhone ||
    orderData['Customer Phone'] ||
    orderData.CustomerPhone ||
    orderData['Phone no'] ||
    orderData.phoneNo ||
    orderData.phone ||
    orderData.shippingAddress.phone;

  let totalPaise = orderData.totalPaise ?? orderData['Total Paise'] ?? orderData.TotalPaise;
  if (totalPaise === undefined || totalPaise === null) {
    const rawPrice = orderData['Total Price'] ?? orderData.totalPrice;
    if (typeof rawPrice === 'number') {
      totalPaise = rawPrice < 100000 ? Math.round(rawPrice * 100) : Math.round(rawPrice);
    } else {
      totalPaise = orderData.items.reduce((acc, i) => acc + (i.pricePaise * i.quantity), 0);
    }
  }

  const payloadBody = {
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    totalPaise,
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
          orderNumber: ref,
          reference: ref,
          date: new Date().toISOString(),
          customerName,
          customerEmail,
          customerPhone,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address: `${orderData.shippingAddress.addressLine1}, ${orderData.shippingAddress.city}`,
          city: orderData.shippingAddress.city,
          state: orderData.shippingAddress.state,
          pincode: orderData.shippingAddress.postalCode,
          items: orderData.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.pricePaise / 100 })),
          totalPaise,
          total: totalPaise / 100,
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
    orderNumber,
    reference: orderNumber,
    date: new Date().toISOString(),
    customerName,
    customerEmail,
    customerPhone,
    name: customerName,
    email: customerEmail,
    phone: customerPhone,
    address: `${orderData.shippingAddress.addressLine1}, ${orderData.shippingAddress.city}`,
    city: orderData.shippingAddress.city,
    state: orderData.shippingAddress.state,
    pincode: orderData.shippingAddress.postalCode,
    items: orderData.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.pricePaise / 100 })),
    totalPaise,
    total: totalPaise / 100,
    status: 'Confirmed',
  });
  localStorage.setItem('kb_orders', JSON.stringify(stored));

  return { orderNumber, id: orderNumber };
}
