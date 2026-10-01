import { PRODUCTS, getProductById } from '../data/products';
import { getMediaUrl } from './cdn';
import type { Product, ProductCategory } from '../types/product';
export const DEFAULT_API_BASE_URL = '';
export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
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

const VALID_CATEGORIES: ProductCategory[] = [
  'Collapsible BBQ',
  'Rocket Stoves',
  'Automatic BBQ',
  'Santa Maria Series',
  'Suitcase BBQ',
  'Accessories',
];

export function categoryIdToName(categoryId?: string): ProductCategory {
  if (!categoryId) return 'Collapsible BBQ';
  if (VALID_CATEGORIES.includes(categoryId as ProductCategory)) {
    return categoryId as ProductCategory;
  }
  if (CATEGORY_MAP[categoryId]) {
    return CATEGORY_MAP[categoryId];
  }
  const normalized = categoryId.toLowerCase();
  for (const cat of VALID_CATEGORIES) {
    if (normalized.includes(cat.toLowerCase()) || cat.toLowerCase().includes(normalized)) {
      return cat;
    }
  }
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return val;
    }
  }
  return 'Collapsible BBQ';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toStorefrontProduct(apiProduct: any): Product {
  const local = getProductById(apiProduct.id) || PRODUCTS.find((p) => p.slug === apiProduct.slug);
  const rawImages = (Array.isArray(apiProduct.images) && apiProduct.images.length > 0)
    ? apiProduct.images
    : ((Array.isArray(apiProduct.imageKeys) && apiProduct.imageKeys.length > 0)
      ? apiProduct.imageKeys
      : (Array.isArray(apiProduct.imageUrls) && apiProduct.imageUrls.length > 0
        ? apiProduct.imageUrls
        : (local?.images || [])));

  const extractedImageUrls: string[] = rawImages
    .map((img: unknown) => {
      if (typeof img === 'string') return img;
      if (img && typeof img === 'object' && 'url' in img && typeof (img as { url?: string }).url === 'string') {
        return (img as { url: string }).url;
      }
      return '';
    })
    .filter(Boolean);

  const images = extractedImageUrls.map((img) => getMediaUrl(img));

  const primaryImage = (typeof apiProduct.image === 'string' && apiProduct.image)
    ? getMediaUrl(apiProduct.image)
    : (images[0] || (local?.image ? getMediaUrl(local.image) : ''));

  let specifications: Record<string, string> = {};
  if (Array.isArray(apiProduct.specifications) && apiProduct.specifications.length > 0) {
    for (const spec of apiProduct.specifications) {
      if (spec && typeof spec === 'object') {
        const specObj = spec as Record<string, unknown>;
        const key = typeof specObj.name === 'string'
          ? specObj.name
          : (typeof specObj.label === 'string' ? specObj.label : (typeof specObj.key === 'string' ? specObj.key : ''));
        if (key && specObj.value !== undefined && specObj.value !== null) {
          specifications[key] = String(specObj.value);
        }
      }
    }
  } else if (apiProduct.specifications && typeof apiProduct.specifications === 'object' && !Array.isArray(apiProduct.specifications) && Object.keys(apiProduct.specifications).length > 0) {
    specifications = apiProduct.specifications as Record<string, string>;
  } else {
    specifications = local?.specifications || {};
  }
  const priceRupees =
    apiProduct.price !== undefined && apiProduct.price !== null
      ? Number(apiProduct.price)
      : (apiProduct.pricePaise !== undefined && apiProduct.pricePaise !== null
        ? Math.round(Number(apiProduct.pricePaise) / 100)
        : (local?.price ?? 0));

  const rawCat = apiProduct.category || apiProduct.categoryId;
  const resolvedCategory = rawCat ? categoryIdToName(rawCat) : (local?.category || 'Collapsible BBQ');

  return {
    ...(local || {}),
    id: apiProduct.id,
    slug: apiProduct.slug || local?.slug || apiProduct.id,
    name: apiProduct.name || local?.name || '',
    description: apiProduct.description || local?.description || '',
    price: priceRupees,
    image: primaryImage,
    images: images.length > 0 ? images : (local?.images || [primaryImage]),
    category: resolvedCategory,
    features: (Array.isArray(apiProduct.features) && apiProduct.features.length > 0) ? apiProduct.features : (local?.features || []),
    specifications,
    video: local?.video,
    videoPath: local?.videoPath,
    sequenceId: local?.sequenceId,
    sequenceFrameCount: local?.sequenceFrameCount,
    has3D: local?.has3D,
    hasVideo: local?.hasVideo,
    featured: apiProduct.isFeatured ?? apiProduct.featured ?? local?.featured ?? false,
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
  const token = payload.turnstileToken;
  if (!token) {
    throw new Error('Please complete the security verification.');
  }

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
    message?: string;
    success?: boolean;
    reference?: string;
    id?: string;
  };

  if (!res.ok || (!json.data && !json.id)) {
    const errorMessage = json.error?.message || json.message || `Enquiry submission failed (${res.status})`;
    throw new Error(errorMessage);
  }

  const data = json.data || {
    id: json.id || '',
    reference: json.reference || json.id || '',
    status: 'New',
    createdAt: new Date().toISOString(),
  };

  return {
    ...data,
    reference: data.reference || data.id,
  };
}
