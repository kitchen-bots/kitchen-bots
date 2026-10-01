import { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types/product';
import { fetchCatalogProducts, fetchCatalogProductById } from '../services/catalog';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';

export interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>(STATIC_PRODUCTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCatalogProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load products'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    refetch: loadProducts,
  };
}

export interface UseProductDetailResult {
  product: Product | null;
  loading: boolean;
  error: Error | null;
}

export function useProductDetail(productId: string | null): UseProductDetailResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(productId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      return;
    }

    let isMounted = true;
    fetchCatalogProductById(productId)
      .then((data) => {
        if (isMounted) {
          setProduct(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load product details'));
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  return {
    product: productId ? product : null,
    loading: productId ? loading : false,
    error: productId ? error : null,
  };
}
