import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  LayoutGrid,
  List,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  AlertCircle,
  RefreshCw,
  RotateCw,
  Film,
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import type { Page } from '../App';
import type { Product, ProductCategory } from '../types/product';
import { useCart } from '../hooks/use-cart';
import { MAX_ITEM_QUANTITY } from '../context/CartContextData';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import ProductImage from '../components/ProductImage';
import { fetchCatalogProducts } from '../lib/api';
import { getMediaUrl } from '../lib/cdn';

interface ProductsPageProps {
  onProductClick: (id: string) => void;
  onCartOpen?: () => void;
  onNavigate?: (page: Page, productId?: string) => void;
}

type ViewMode = 'grid' | 'list';
type CategoryFilter = ProductCategory | 'All';

const CATEGORIES: CategoryFilter[] = [
  'All',
  'Collapsible BBQ',
  'Rocket Stoves',
  'Automatic BBQ',
  'Santa Maria Series',
  'Suitcase BBQ',
];

const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(price);

export default function ProductsPage({ onProductClick, onCartOpen, onNavigate }: ProductsPageProps) {
  const params = new URLSearchParams(window.location.search);
  const requestedCategory = params.get('category');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(
    CATEGORIES.includes(requestedCategory as CategoryFilter) ? requestedCategory as CategoryFilter : 'All',
  );
  const [searchQuery, setSearchQuery] = useState(params.get('q') ?? '');
  const [view, setView] = useState<ViewMode>('grid');
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

  const { addToCart, items, updateQuantity } = useCart();
  const { showToast } = useToast();

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchCatalogProducts();
      setProducts(items.length ? items : PRODUCTS);
    } catch {
      // Fallback to local CMS data
      setProducts(PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Preload and decode secondary card images during idle so card hover preview is instantaneous
  useEffect(() => {
    if (!products || products.length === 0) return;
    const preload = () => {
      products.forEach(p => {
        if (p.images && p.images.length > 1) {
          const resolved = getMediaUrl(p.images[1]);
          if (resolved) {
            const link = new Image();
            link.src = resolved;
            if (typeof link.decode === 'function') {
              link.decode().catch(() => {});
            }
          }
        }
      });
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(preload);
    } else {
      setTimeout(preload, 150);
    }
  }, [products]);

  const filteredProducts = useMemo(() => {
    const terms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return products.filter(product => {
      const searchable = [
        product.name,
        product.description,
        product.shortDescription || '',
        product.category,
        product.material || '',
        ...(product.features || [])
      ].join(' ').toLowerCase();

      return (activeCategory === 'All' || product.category === activeCategory)
        && terms.every(term => searchable.includes(term));
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Unified Header & Catalog Controls (Seamless, no gap below navbar) */}
      <section className="border-b border-[#E2E8F0] bg-white pb-8 pt-20 sm:pt-24">
        <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
          <nav className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-[#94A3B8]" aria-label="Breadcrumb">
            <button className="hover:text-[#111827]" onClick={() => onNavigate?.('home')}>Home</button>
            <ChevronRight size={12} />
            <span className="text-[#C2410C]">Products</span>
          </nav>

          <div>
            <h1 className="font-['Outfit'] text-[32px] font-bold leading-tight text-[#111827] sm:text-[42px] md:text-[48px]">
              Product catalog
            </h1>
            <p className="mt-2 max-w-2xl font-['DM_Sans'] text-[15px] sm:text-[16px] leading-relaxed text-[#64748B]">
              Precision-engineered Santa Maria crank grills, secondary-combustion rocket stoves, synchronized rotisseries, and boltless flat-pack BBQs. Sourced directly from our factory floor.
            </p>
          </div>

          {/* Integrated Search & Filter Controls */}
          <div className="mt-6 flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C2410C]" size={18} />
              <label className="sr-only" htmlFor="catalog-search">Search products</label>
              <input
                id="catalog-search"
                type="search"
                placeholder="Search by product name, materials, features, or thermal specs..."
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="h-12 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] pl-12 pr-4 font-['DM_Sans'] text-[14px] outline-none transition-colors focus:border-[#C2410C] focus:bg-white focus:ring-1 focus:ring-[#C2410C]"
              />
            </div>

            {/* Category Pills & View Mode Row */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Category Pills */}
              <div className="flex w-full gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    className={`shrink-0 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                      activeCategory === category
                        ? 'bg-[#C2410C] text-white shadow-sm'
                        : 'border border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F8FAFC] hover:text-[#111827]'
                    }`}
                    onClick={() => setActiveCategory(category)}
                    aria-pressed={activeCategory === category}
                  >
                    {category === 'All' ? 'All products (12)' : category}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <Button
                type="button"
                variant="outline"
                className="change-view-button shrink-0 self-start rounded-xl border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] lg:self-auto"
                onClick={() => setView(current => current === 'grid' ? 'list' : 'grid')}
                aria-label={`Switch to ${view === 'grid' ? 'list' : 'grid'} view`}
              >
                {view === 'grid' ? <List size={18} className="text-[#C2410C]" /> : <LayoutGrid size={18} className="text-[#C2410C]" />}
                {view === 'grid' ? 'List view' : 'Grid view'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product List Content */}
      <section className="section-padding">
        <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
          {error && (
            <div className="mb-8 flex items-center justify-between rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-[#991B1B]">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-sm font-['DM_Sans']">{error}</p>
              </div>
              <Button size="sm" variant="outline" className="gap-2 shrink-0 rounded-xl font-bold" onClick={loadProducts}>
                <RefreshCw size={14} /> Retry
              </Button>
            </div>
          )}

          <div className="mb-6 flex items-center justify-between font-['DM_Sans'] text-sm text-[#64748B]">
            <p aria-live="polite">
              {isLoading ? 'Loading products...' : `Showing ${filteredProducts.length} of ${products.length} products`}
            </p>
            {activeCategory !== 'All' && (
              <button
                onClick={() => setActiveCategory('All')}
                className="text-xs font-bold text-[#C2410C] hover:underline"
              >
                Clear category filter
              </button>
            )}
          </div>

          {isLoading ? (
            <div className={view === 'grid' ? 'grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'grid gap-5'}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
                  <div className="aspect-square w-full rounded-2xl bg-[#F1F5F9] mb-6" />
                  <div className="h-6 w-3/4 rounded bg-[#F1F5F9] mb-3" />
                  <div className="h-4 w-full rounded bg-[#F1F5F9] mb-2" />
                  <div className="h-4 w-2/3 rounded bg-[#F1F5F9] mb-6" />
                  <div className="h-8 w-1/3 rounded bg-[#F1F5F9]" />
                </div>
              ))}
            </div>
          ) : (
            <div className={view === 'grid' ? 'grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'grid gap-5'}>
              {filteredProducts.map(product => {
                const cartItem = items.find(item => item.id === product.id);
                const quantityInCart = cartItem?.quantity ?? 0;
                const images = product.images?.length ? product.images : [product.image];
                const isHovered = hoveredProductId === product.id;
                const displayImage = isHovered && images.length > 1 ? images[1] : images[0];

                return (
                  <article
                    key={product.id}
                    onMouseEnter={() => setHoveredProductId(product.id)}
                    onMouseLeave={() => setHoveredProductId(null)}
                    className={view === 'grid'
                      ? 'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white transition-all duration-300 hover:border-[#CBD5E1] hover:shadow-xl'
                      : 'group relative grid overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white transition-all duration-300 hover:border-[#CBD5E1] hover:shadow-xl md:grid-cols-[300px_1fr]'}
                  >
                    {/* Thumbnail / Image Area */}
                    <div
                      className={view === 'grid'
                        ? 'relative aspect-square overflow-hidden bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] p-6 text-center'
                        : 'relative min-h-[260px] overflow-hidden bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] p-6 text-center'}
                    >
                      {/* Media Feature Badges */}
                      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5">
                        {product.sequenceId && (
                          <span className="flex items-center gap-1 rounded-lg bg-black/75 px-2 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                            <RotateCw size={11} className="text-[#FDBA74] animate-spin-slow" /> 360° 3D
                          </span>
                        )}
                        {product.video && (
                          <span className="flex items-center gap-1 rounded-lg bg-[#C2410C]/90 px-2 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
                            <Film size={11} /> Video
                          </span>
                        )}
                      </div>

                      {/* Main Image Clickable */}
                      <button
                        type="button"
                        onClick={() => onProductClick(product.id)}
                        className="h-full w-full flex items-center justify-center cursor-pointer outline-none"
                        aria-label={`View details for ${product.name}`}
                      >
                        <ProductImage
                          src={displayImage}
                          alt={product.name}
                          className="h-full w-full object-contain will-change-transform transition-transform duration-150 ease-out group-hover:scale-105"
                        />
                      </button>
                    </div>

                    {/* Product Info Block */}
                    <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-7">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C]">
                          {product.category}
                        </span>
                        {product.featured && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md border border-orange-200">
                            Featured
                          </span>
                        )}
                      </div>

                      <button type="button" className="text-left mt-1.5" onClick={() => onProductClick(product.id)}>
                        <h2 className="font-['Outfit'] text-[20px] font-bold leading-snug text-[#0F172A] hover:text-[#C2410C] transition-colors">
                          {product.name}
                        </h2>
                      </button>

                      <p className="mt-2 line-clamp-2 font-['DM_Sans'] text-[13px] sm:text-[14px] leading-relaxed text-[#64748B]">
                        {product.shortDescription || product.description}
                      </p>

                      {/* Key features bullets */}
                      <ul className="mt-4 grid gap-1.5 font-['DM_Sans'] text-[12px] text-[#475569]">
                        {product.features?.slice(0, 3).map(feature => (
                          <li key={feature} className="truncate">• {feature}</li>
                        ))}
                      </ul>

                      {/* Price & MRP */}
                      <div className="mt-5 flex items-baseline gap-2.5">
                        <span className="font-['Outfit'] text-[22px] sm:text-[24px] font-bold text-[#0F172A]">
                          {formatPrice(product.price)}
                        </span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-xs text-[#94A3B8] line-through font-medium">
                            MRP {formatPrice(product.mrp)}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons: Add to Cart & View Details */}
                      <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
                        {quantityInCart > 0 ? (
                          <div className="flex h-11 min-w-[130px] flex-1 items-center justify-between rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-1 shadow-xs">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(product.id, quantityInCart - 1);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0F172A] border border-[#E2E8F0] shadow-xs hover:bg-[#F1F5F9] active:scale-95 transition-all"
                              aria-label={`Decrease quantity of ${product.name}`}
                            >
                              <Minus size={14} className="stroke-[2.5]" />
                            </button>
                            <span className="font-['Outfit'] font-bold text-xs text-[#0F172A] select-none">
                              {quantityInCart} in cart
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(product.id, quantityInCart + 1);
                              }}
                              disabled={quantityInCart >= MAX_ITEM_QUANTITY}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C2410C] text-white shadow-xs hover:bg-[#9A3412] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-[#C2410C]"
                              aria-label={`Increase quantity of ${product.name}`}
                              title={quantityInCart >= MAX_ITEM_QUANTITY ? `Maximum limit of ${MAX_ITEM_QUANTITY} items per order` : undefined}
                            >
                              <Plus size={14} className="stroke-[2.5]" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            className="h-11 min-w-[130px] flex-1 rounded-xl font-bold bg-[#C2410C] hover:bg-[#9A3412]"
                            onClick={() => {
                              addToCart({ id: product.id, name: product.name, price: product.price, image: product.image });
                              showToast(`${product.name} added to cart`, 'View cart', () => onCartOpen?.());
                            }}
                          >
                            <ShoppingCart size={16} className="mr-1.5" /> Add to cart
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          className="h-11 min-w-[110px] flex-1 rounded-xl border-[#CBD5E1] font-bold text-[#0F172A] hover:bg-[#F8FAFC]"
                          onClick={() => onProductClick(product.id)}
                        >
                          Details <ArrowRight size={15} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!isLoading && filteredProducts.length === 0 && (
            <div className="py-24 text-center">
              <Search size={40} className="mx-auto mb-4 text-[#CBD5E1]" />
              <h2 className="font-['Outfit'] text-[24px] font-bold text-[#0F172A]">No matching products</h2>
              <p className="mt-2 font-['DM_Sans'] text-[#64748B]">
                We couldn't find any products matching "{searchQuery}". Try searching for another term or clear filters.
              </p>
              <Button
                className="mt-6 rounded-xl font-bold bg-[#C2410C] hover:bg-[#9A3412]"
                onClick={() => {
                  setActiveCategory('All');
                  setSearchQuery('');
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
