import { apiClient, ApiError } from '../lib/api-client';
import { PRODUCTS as STATIC_PRODUCTS, getProductById as getStaticProductById } from '../data/products';
import { getMediaUrl } from '../lib/cdn';
import type { Product } from '../types/product';

/**
 * Normalizes product object to ensure image URLs pass through CDN resolver.
 */
function normalizeProduct(p: Product): Product {
  return {
    ...p,
    image: getMediaUrl(p.image),
    images: (p.images || []).map(img => getMediaUrl(img)),
    thumbnail: p.thumbnail ? getMediaUrl(p.thumbnail) : undefined,
  };
}

/**
 * Normalizes raw API response payload into array of Product objects.
 */
function normalizeProductArray(payload: unknown): Product[] {
  let list: Product[] = [];
  if (Array.isArray(payload)) {
    list = payload as Product[];
  } else if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.products)) {
      list = obj.products as Product[];
    } else if (Array.isArray(obj.data)) {
      list = obj.data as Product[];
    }
  }
  return list.map(normalizeProduct);
}

/**
 * Fetch all published products from live catalog API.
 * Falls back to static fixtures in local development if VITE_API_URL is missing or fails.
 */
export async function fetchCatalogProducts(): Promise<Product[]> {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    return STATIC_PRODUCTS;
  }

  try {
    const response = await apiClient<unknown>('/v1/catalog/products');
    const products = normalizeProductArray(response);
    if (products.length === 0 && !import.meta.env.PROD) {
      return STATIC_PRODUCTS;
    }
    return products;
  } catch (error) {
    // In production, throw error if live API fails to prevent silent fallback to stale fixture data.
    if (import.meta.env.PROD) {
      console.error('Failed to fetch catalog from live API:', error);
      throw error;
    }
    console.warn('Live catalog API unavailable, using local dev fallback:', error);
    return STATIC_PRODUCTS;
  }
}

/**
 * Fetch a single product by ID or slug from live catalog API.
 */
export async function fetchCatalogProductById(idOrSlug: string): Promise<Product | null> {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    return getStaticProductById(idOrSlug) || null;
  }

  try {
    const response = await apiClient<unknown>(`/v1/catalog/products/${encodeURIComponent(idOrSlug)}`);
    if (response && typeof response === 'object') {
      const obj = response as Record<string, unknown>;
      const rawProduct = (obj.product || obj.data || obj) as Product;
      if (rawProduct && rawProduct.id) {
        return normalizeProduct(rawProduct);
      }
    }
    return null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    if (import.meta.env.PROD) {
      console.error(`Failed to fetch product ${idOrSlug} from live API:`, error);
      throw error;
    }
    return getStaticProductById(idOrSlug) || null;
  }
}
