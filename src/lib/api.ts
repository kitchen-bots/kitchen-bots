import { PRODUCTS, getProductById } from '../data/products';
import { getMediaUrl } from './cdn';
import type { Product, ProductCategory } from '../types/product';
export const DEFAULT_API_BASE_URL = '';
export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
export const DEFAULT_ENQUIRY_API_URL = 'https://kitchen-bots-api.workofcharan.workers.dev';

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  description: string;
  salesMode: 'direct' | 'quote' | 'both';
  pricePaise: number | null;
  currency: 'INR';
  imageUrls: string[];
  specifications: Record<string, string>;
  features: string[];
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
  'rocket-stoves': 'Rocket Stoves',
  accessories: 'Accessories',
  'collapsible-bbq': 'Collapsible BBQ',
  'automatic-bbq': 'Automatic BBQ',
};

export function categoryIdToName(categoryId: string): ProductCategory {
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

export function toStorefrontProduct(apiProduct: ApiProduct): Product {
  const local = getProductById(apiProduct.id) || PRODUCTS.find((p) => p.slug === apiProduct.slug);
  const rawImages = apiProduct.imageUrls && apiProduct.imageUrls.length > 0
    ? apiProduct.imageUrls
    : (local?.images || []);
  const images = rawImages.map(img => getMediaUrl(img));
  const primaryImage = images[0] || (local?.image ? getMediaUrl(local.image) : '');
  const priceRupees =
    apiProduct.pricePaise !== null && apiProduct.pricePaise !== undefined
      ? Math.round(apiProduct.pricePaise / 100)
      : (local?.price ?? 0);

  return {
    ...(local || {}),
    id: apiProduct.id,
    slug: apiProduct.slug || local?.slug,
    name: apiProduct.name || local?.name || '',
    description: apiProduct.description || local?.description || '',
    price: priceRupees,
    image: primaryImage,
    images,
    category: categoryIdToName(apiProduct.categoryId) || local?.category || 'Collapsible BBQ',
    features: (apiProduct.features && apiProduct.features.length > 0) ? apiProduct.features : (local?.features || []),
    specifications: Object.keys(apiProduct.specifications || {}).length > 0 ? apiProduct.specifications : (local?.specifications || {}),
    video: local?.video,
    videoPath: local?.videoPath,
    sequenceId: local?.sequenceId,
    sequenceFrameCount: local?.sequenceFrameCount,
    has3D: local?.has3D,
    hasVideo: local?.hasVideo,
    featured: local?.featured ?? false,
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
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to load catalog products (${res.status})`);
    }

    const json = (await res.json()) as {
      data: ApiProduct[];
      pagination: { total: number };
    };

    return json.data.map(toStorefrontProduct);
  } catch (err) {
    // If fallback is enabled in dev or deployment, fall back to local fixtures
    if (import.meta.env?.VITE_USE_LOCAL_CATALOG_FALLBACK !== 'false') {
      console.warn('Falling back to local product catalog:', err);
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
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to load product (${res.status})`);
    }

    const json = (await res.json()) as { data: ApiProduct };
    return toStorefrontProduct(json.data);
  } catch (err) {
    if (import.meta.env?.VITE_USE_LOCAL_CATALOG_FALLBACK !== 'false') {
      console.warn('Falling back to local product lookup:', err);
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
    error?: { code: string; message: string };
  };

  if (!res.ok || !json.data) {
    const errorMessage = json.error?.message || `Enquiry submission failed (${res.status})`;
    throw new Error(errorMessage);
  }

  return json.data;
}

export interface OrderItemPayload {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderPayload {
  reference: string;
  customerName: string;
  phone: string;
  email?: string;
  shippingAddress: {
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  items: OrderItemPayload[];
  totalPrice: number;
  paymentMethod?: string;
}

export interface OrderResponseData {
  id: string;
  orderNumber?: string;
  status: string;
  createdAt: string;
}

export async function submitOrder(
  payload: OrderPayload,
  baseUrl = API_BASE_URL || DEFAULT_ENQUIRY_API_URL
): Promise<OrderResponseData | null> {
  const targetUrl = baseUrl ? `${baseUrl}/v1/orders` : '/v1/orders';
  const body = {
    orderNumber: payload.reference,
    contactPerson: payload.customerName.trim(),
    companyName: payload.customerName.trim(),
    phone: payload.phone.trim(),
    email: payload.email?.trim() || `${payload.phone.replace(/\D/g, '')}@customer.kitchenbots.in`,
    items: payload.items.map((it) => ({
      productId: it.productId || 'prod-1',
      name: it.name,
      quantity: it.quantity,
      price: it.price,
    })),
    shippingAddress: payload.shippingAddress,
    billingAddress: payload.shippingAddress,
    totalPrice: payload.totalPrice,
    paymentMethod: payload.paymentMethod || 'Online Direct',
  };

  const res = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    success?: boolean;
    data?: OrderResponseData;
    error?: { message?: string };
    message?: string;
  };

  if (!res.ok || json.success === false) {
    const errorMsg = json.error?.message || json.message || `Order submission failed (${res.status})`;
    throw new Error(errorMsg);
  }

  return json.data || null;
}
