import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Heart,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  AlertCircle,
  RefreshCw,
  ZoomIn,
  Shield,
  Truck,
  RotateCw,
  Film,
  Camera,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import { PRODUCTS, getProductById } from '../data/products';
import type { Page } from '../App';
import type { Product } from '../types/product';
import { useCart } from '../hooks/use-cart';
import { MAX_ITEM_QUANTITY } from '../context/CartContextData';
import { useWishlist } from '../hooks/use-wishlist';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import ProductImage from '../components/ProductImage';
import Product360Viewer from '../components/Product360Viewer';
import ProductVideoPlayer from '../components/ProductVideoPlayer';
import { cn } from '../lib/utils';
import { fetchCatalogProduct } from '../lib/api';

interface ProductDetailPageProps {
  productId: string;
  onBack: () => void;
  onNavigate?: (page: Page, productId?: string) => void;
}

type MediaMode = 'photos' | '360' | 'video';
type Tab = 'Description' | 'Specifications' | 'Usage' | 'Warranty';

const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(price);

export default function ProductDetailPage({ productId, onBack, onNavigate }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(() => getProductById(productId) || null);
  const [isLoading, setIsLoading] = useState(!product);
  const [error, setError] = useState<string | null>(null);

  const [activeMediaMode, setActiveMediaMode] = useState<MediaMode>('photos');
  const [activeImage, setActiveImage] = useState(0);
  const [tab, setTab] = useState<Tab>('Description');
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const zoomImageRef = useRef<HTMLDivElement>(null);
  const containerRectRef = useRef<DOMRect | null>(null);

  const { addToCart, items, updateQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = zoomContainerRef.current;
    const image = zoomImageRef.current;
    if (!container || !image) return;

    const rect = container.getBoundingClientRect();
    containerRectRef.current = rect;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    image.style.transformOrigin = `${x}% ${y}%`;
    image.style.transition = 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1)';
    image.style.transform = 'scale(2.2)';
    setIsZoomed(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const image = zoomImageRef.current;
    if (!image) return;

    let rect = containerRectRef.current;
    if (!rect) {
      const container = zoomContainerRef.current;
      if (!container) return;
      rect = container.getBoundingClientRect();
      containerRectRef.current = rect;
    }

    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    image.style.transformOrigin = `${x}% ${y}%`;

    if (!isZoomed) {
      image.style.transition = 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1)';
      image.style.transform = 'scale(2.2)';
      setIsZoomed(true);
    }
  };

  const handleMouseLeave = () => {
    containerRectRef.current = null;
    const image = zoomImageRef.current;
    if (image) {
      image.style.transition = 'transform 120ms ease-out';
      image.style.transform = 'scale(1)';
    }
    setIsZoomed(false);
  };

  useEffect(() => {
    containerRectRef.current = null;
    const image = zoomImageRef.current;
    if (image) {
      image.style.transition = 'none';
      image.style.transform = 'scale(1)';
      image.style.transformOrigin = '50% 50%';
    }
    setIsZoomed(false);
  }, [activeImage, activeMediaMode, productId]);

  const loadProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const local = getProductById(productId);
      if (local) {
        setProduct(local);
        setIsLoading(false);
      }
      const item = await fetchCatalogProduct(productId);
      if (item) {
        setProduct(item);
      }
    } catch {
      const local = getProductById(productId);
      if (local) {
        setProduct(local);
      } else {
        setError('Failed to load product details.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
    setActiveMediaMode('photos');
    setActiveImage(0);
  }, [loadProduct]);

  if (isLoading && !product) {
    return (
      <section className="min-h-screen bg-[#F8FAFC] pb-24 pt-28">
        <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
          <div className="animate-pulse grid gap-12 lg:grid-cols-2">
            <div className="aspect-square bg-[#E2E8F0] rounded-2xl" />
            <div className="space-y-6 pt-4">
              <div className="h-10 bg-[#E2E8F0] rounded-xl w-3/4" />
              <div className="h-5 bg-[#E2E8F0] rounded-lg w-full" />
              <div className="h-5 bg-[#E2E8F0] rounded-lg w-2/3" />
              <div className="h-12 bg-[#E2E8F0] rounded-xl w-1/3 mt-8" />
              <div className="h-12 bg-[#E2E8F0] rounded-xl w-full mt-6" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="min-h-[60vh] bg-[#F8FAFC] px-6 py-32 text-center">
        <h1 className="font-['Outfit'] text-3xl font-bold text-[#111827]">Product not found</h1>
        <p className="mt-3 font-['DM_Sans'] text-[#64748B]">This product link is invalid or no longer available.</p>
        <Button className="mt-7 rounded-xl" onClick={onBack}><ArrowLeft size={18} /> Back to products</Button>
      </section>
    );
  }

  const images = product.images?.length ? product.images : [product.image];
  const specifications = Object.entries(product.specifications || {});

  const addProduct = () => {
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image });
    setAdded(true);
    showToast(`${product.name} added to cart`);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const share = async () => {
    const shareUrl = `${window.location.origin}/?page=product-detail&id=${encodeURIComponent(product.id)}`;

    // 1. Mobile Native Share Sheet
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || product.description,
          url: shareUrl,
        });
        showToast('Shared successfully!');
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // 2. Modern Clipboard API
    let copiedSuccess = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copiedSuccess = true;
      } catch {
        copiedSuccess = false;
      }
    }

    // 3. Fallback textarea copy
    if (!copiedSuccess) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copiedSuccess = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        copiedSuccess = false;
      }
    }

    if (copiedSuccess) {
      setCopied(true);
      showToast('Product link copied to clipboard!');
      window.setTimeout(() => setCopied(false), 2200);
    } else {
      window.prompt('Copy product link:', shareUrl);
    }
  };

  const cartItem = items.find(item => item.id === product.id);
  const quantityInCart = cartItem?.quantity ?? 0;

  return (
    <section className="min-h-screen overflow-x-hidden bg-[#FAFAFA] pb-24 pt-24 sm:pt-28">
      <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-[#991B1B]">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-['DM_Sans']">{error}</p>
            </div>
            <Button size="sm" variant="outline" className="gap-2 shrink-0 rounded-xl font-bold" onClick={loadProduct}>
              <RefreshCw size={14} /> Retry
            </Button>
          </div>
        )}

        {/* Breadcrumb & Navigation */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8]" aria-label="Breadcrumb">
            <button className="hover:text-[#111827] transition-colors" onClick={() => onNavigate?.('home')}>Home</button>
            <ChevronRight size={13} />
            <button className="hover:text-[#111827] transition-colors" onClick={onBack}>Products</button>
            <ChevronRight size={13} />
            <span className="text-[#C2410C] truncate max-w-[200px] sm:max-w-none">{product.name}</span>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'rounded-xl border-[#CBD5E1] bg-white transition-all hover:bg-[#F8FAFC]',
                copied && 'border-green-400 bg-green-50 text-green-700'
              )}
              onClick={share}
              aria-label="Share product"
              title={copied ? 'Link copied!' : 'Share product'}
            >
              {copied ? <Check size={17} className="text-green-600" /> : <Share2 size={17} />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn('rounded-xl border-[#CBD5E1] bg-white hover:bg-[#F8FAFC]', isInWishlist(product.id) && 'border-red-200 bg-red-50 text-red-600')}
              onClick={() => toggleWishlist(product.id)}
              aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={17} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
            </Button>
          </div>
        </div>

        {/* Main Grid: Left Stage (Media), Right Stage (Product Info) */}
        <div className="grid gap-10 lg:grid-cols-12 xl:gap-16">
          {/* Left Column: Media Stage (7 cols) */}
          <div className="flex flex-col lg:col-span-7">
            {/* Media Mode Switcher Tabs */}
            <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Product Media Options">
              <button
                type="button"
                role="tab"
                id="media-tab-photos"
                aria-selected={activeMediaMode === 'photos'}
                aria-controls="media-panel-photos"
                onClick={() => setActiveMediaMode('photos')}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all select-none',
                  activeMediaMode === 'photos'
                    ? 'bg-[#C2410C] text-white shadow-md shadow-[#C2410C]/20 border border-[#C2410C]'
                    : 'bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#FFF7ED]/50 hover:text-[#C2410C] hover:border-[#FDBA74]'
                )}
              >
                <Camera size={16} /> Photos & Angles ({images.length})
              </button>

              {product.sequenceId && (
                <button
                  type="button"
                  role="tab"
                  id="media-tab-360"
                  aria-selected={activeMediaMode === '360'}
                  aria-controls="media-panel-360"
                  onClick={() => setActiveMediaMode('360')}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all select-none',
                    activeMediaMode === '360'
                      ? 'bg-[#C2410C] text-white shadow-md shadow-[#C2410C]/20 border border-[#C2410C]'
                      : 'bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#FFF7ED]/50 hover:text-[#C2410C] hover:border-[#FDBA74]'
                  )}
                >
                  <RotateCw size={16} /> Interactive 360° 3D
                </button>
              )}

              {product.video && (
                <button
                  type="button"
                  role="tab"
                  id="media-tab-video"
                  aria-selected={activeMediaMode === 'video'}
                  aria-controls="media-panel-video"
                  onClick={() => setActiveMediaMode('video')}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all select-none',
                    activeMediaMode === 'video'
                      ? 'bg-[#C2410C] text-white shadow-md shadow-[#C2410C]/20 border border-[#C2410C]'
                      : 'bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#FFF7ED]/50 hover:text-[#C2410C] hover:border-[#FDBA74]'
                  )}
                >
                  <Film size={16} /> HD Turntable Video
                </button>
              )}
            </div>

            {/* Media Display Container */}
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm">
              <div
                id="media-panel-photos"
                role="tabpanel"
                aria-labelledby="media-tab-photos"
                className={cn('h-full w-full', activeMediaMode === 'photos' ? 'block' : 'hidden')}
              >
                <div
                  ref={zoomContainerRef}
                  className="relative h-full w-full cursor-crosshair select-none"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                  role="region"
                  aria-label={`Interactive zoom for ${product.name}`}
                >
                  <div
                    ref={zoomImageRef}
                    className="h-full w-full"
                    style={{
                      transform: 'scale(1)',
                      transformOrigin: '50% 50%',
                      willChange: 'transform, transform-origin',
                    }}
                  >
                    <ProductImage
                      src={images[activeImage]}
                      alt={product.name}
                      className="h-full w-full object-contain pointer-events-none"
                    />
                  </div>

                  <div className={`pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-md transition-opacity duration-200 ${isZoomed ? 'opacity-0' : 'opacity-85'}`}>
                    <ZoomIn size={14} /> Hover to zoom
                  </div>
                </div>
              </div>

              {product.sequenceId && (
                <div
                  id="media-panel-360"
                  role="tabpanel"
                  aria-labelledby="media-tab-360"
                  className={cn('h-full w-full', activeMediaMode === '360' ? 'block' : 'hidden')}
                >
                  <Product360Viewer
                    sequenceId={product.sequenceId}
                    frameCount={product.sequenceFrameCount || 40}
                    productName={product.name}
                    posterImage={product.image}
                    className="h-full w-full border-0"
                  />
                </div>
              )}

              {product.video && (
                <div
                  id="media-panel-video"
                  role="tabpanel"
                  aria-labelledby="media-tab-video"
                  className={cn('h-full w-full', activeMediaMode === 'video' ? 'block' : 'hidden')}
                >
                  <ProductVideoPlayer
                    src={product.video}
                    poster={product.image}
                    productName={product.name}
                    className="h-full w-full border-0"
                    autoPlay={activeMediaMode === 'video'}
                  />
                </div>
              )}
            </div>

            {/* Gallery Thumbnails (active under photos mode, or click to switch to photos) */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => {
                      setActiveImage(index);
                      setActiveMediaMode('photos');
                    }}
                    aria-pressed={activeMediaMode === 'photos' && activeImage === index}
                    title={`View photo ${index + 1}`}
                    className={cn(
                      'h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-white p-1.5 transition-all cursor-pointer',
                      activeMediaMode === 'photos' && activeImage === index
                        ? 'border-[#C2410C] shadow-sm scale-105'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1]',
                    )}
                  >
                    <ProductImage src={image} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Commercial Specifications & Actions (5 cols) */}
          <div className="flex flex-col lg:col-span-5">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#FFF7ED] px-2.5 py-1 text-xs font-bold text-[#C2410C] border border-[#FFEDD5]">
                {product.category}
              </span>
              {product.featured && (
                <span className="flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2.5 py-1 text-xs font-bold text-[#334155]">
                  <Award size={13} className="text-[#C2410C]" /> Flagship Model
                </span>
              )}
            </div>

            <h1 className="mt-3 font-['Outfit'] text-3xl font-bold leading-tight text-[#0F172A] sm:text-4xl lg:text-[42px]">
              {product.name}
            </h1>

            <p className="mt-3 font-['DM_Sans'] text-base leading-relaxed text-[#64748B]">
              {product.shortDescription || product.description}
            </p>

            {/* Price block */}
            <div className="mt-6 flex items-baseline gap-4 border-y border-[#E2E8F0] py-5">
              <div className="font-['Outfit'] text-3xl sm:text-4xl font-bold text-[#0F172A]">
                {formatPrice(product.price)}
              </div>
              {product.mrp && product.mrp > product.price && (
                <div className="text-base text-[#94A3B8] line-through font-medium">
                  MRP {formatPrice(product.mrp)}
                </div>
              )}
            </div>

            {/* Engineering Highlights Quick Grid */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 text-xs font-['DM_Sans']">
              {product.material && (
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xs">
                  <span className="block text-[11px] font-bold uppercase text-[#94A3B8]">Material</span>
                  <span className="mt-0.5 font-bold text-[#0F172A] block">{product.material}</span>
                </div>
              )}
              {product.heatResistance && (
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xs">
                  <span className="block text-[11px] font-bold uppercase text-[#94A3B8]">Thermal Rating</span>
                  <span className="mt-0.5 font-bold text-[#0F172A] block flex items-center gap-1">
                    <Flame size={14} className="text-[#C2410C]" /> {product.heatResistance}
                  </span>
                </div>
              )}
              {product.dimensions && (
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xs">
                  <span className="block text-[11px] font-bold uppercase text-[#94A3B8]">Assembled Size</span>
                  <span className="mt-0.5 font-bold text-[#0F172A] block">{product.dimensions}</span>
                </div>
              )}
              {product.weight && (
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xs">
                  <span className="block text-[11px] font-bold uppercase text-[#94A3B8]">Total Weight</span>
                  <span className="mt-0.5 font-bold text-[#0F172A] block">{product.weight}</span>
                </div>
              )}
            </div>

            {/* Key Features List */}
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {product.features.map(feature => (
                <li key={feature} className="flex items-start gap-2 font-['DM_Sans'] text-xs sm:text-sm font-medium text-[#334155]">
                  <Check size={16} className="mt-0.5 shrink-0 text-[#C2410C]" /> {feature}
                </li>
              ))}
            </ul>

            {/* Cart & Quote Action Bar */}
            <div className="mt-8 flex flex-wrap gap-3">
              {quantityInCart > 0 ? (
                <div className="flex h-[52px] min-w-[200px] flex-1 items-center justify-between rounded-xl border border-[#CBD5E1] bg-white p-1.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantityInCart - 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F1F5F9] active:scale-95 transition-all"
                    aria-label={`Decrease quantity of ${product.name}`}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="font-['Outfit'] font-bold text-base text-[#0F172A] px-3 select-none">
                    {quantityInCart} in cart
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantityInCart + 1)}
                    disabled={quantityInCart >= MAX_ITEM_QUANTITY}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C2410C] text-white shadow-xs hover:bg-[#9A3412] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-[#C2410C]"
                    aria-label={`Increase quantity of ${product.name}`}
                    title={quantityInCart >= MAX_ITEM_QUANTITY ? `Maximum limit of ${MAX_ITEM_QUANTITY} items per order` : undefined}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ) : (
                <Button size="lg" className="h-[52px] min-w-[200px] flex-1 rounded-xl font-bold bg-[#C2410C] hover:bg-[#9A3412]" onClick={addProduct}>
                  {added ? <><Check size={20} className="mr-2" /> Added to cart</> : <><ShoppingCart size={20} className="mr-2" /> Add to cart</>}
                </Button>
              )}

              <Button
                size="lg"
                variant="outline"
                className="h-[52px] min-w-[160px] flex-1 rounded-xl border-[#CBD5E1] bg-white font-bold text-[#0F172A] hover:bg-[#F8FAFC]"
                onClick={() => {
                  if (quantityInCart === 0) {
                    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image });
                  }
                  if (onNavigate) {
                    onNavigate('bulk-enquiry', product.id);
                  } else {
                    window.location.href = '/bulk-enquiry';
                  }
                }}
              >
                Request Quote
              </Button>
            </div>

            {quantityInCart >= MAX_ITEM_QUANTITY && (
              <p className="mt-2.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200/70 px-3 py-1.5 rounded-lg inline-block font-['DM_Sans']">
                Maximum limit of {MAX_ITEM_QUANTITY} units per order reached for this product.
              </p>
            )}

            {/* Direct purchase & delivery guarantees */}
            <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-[#E2E8F0] bg-white p-4 text-xs text-[#475569] shadow-xs">
              <div className="flex items-center gap-2.5">
                <Truck size={17} className="text-[#C2410C] shrink-0" />
                <span className="font-medium">Direct doorstep freight delivery across all 19,000+ PIN codes in India</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Shield size={17} className="text-[#16A34A] shrink-0" />
                <span className="font-medium">{product.warranty || '1-Year comprehensive factory warranty with genuine spare parts support'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs: Specifications, Description, Usage, Warranty */}
        <section className="mt-16 rounded-3xl border border-[#E2E8F0] bg-white p-6 sm:p-10 shadow-sm">
          <div className="flex gap-6 overflow-x-auto border-b border-[#E2E8F0]">
            {(['Description', 'Specifications', 'Usage', 'Warranty'] as Tab[]).map(item => (
              <button
                key={item}
                className={cn(
                  'shrink-0 border-b-2 px-1 pb-3 text-sm sm:text-base font-bold transition-all',
                  tab === item ? 'border-[#C2410C] text-[#C2410C]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]',
                )}
                onClick={() => setTab(item)}
                aria-pressed={tab === item}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="py-8 font-['DM_Sans'] text-[15px] leading-relaxed text-[#475569]">
            {tab === 'Description' && (
              <div className="max-w-3xl space-y-4">
                <p className="text-base text-[#1E293B] leading-relaxed">{product.description}</p>
                <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 mt-6">
                  <h3 className="font-['Outfit'] text-lg font-bold text-[#0F172A] mb-2">Engineering Standard</h3>
                  <p className="text-sm text-[#64748B]">
                    Engineered from industrial-grade Indian steel, laser cut to 0.1mm tolerances, and heat-treated for maximum dimensional stability under extreme cyclic thermal loading.
                  </p>
                </div>
              </div>
            )}

            {tab === 'Specifications' && (
              <div className="grid gap-8 lg:grid-cols-2">
                <dl className="space-y-0 rounded-2xl border border-[#E2E8F0] overflow-hidden">
                  {specifications.map(([label, value], idx) => (
                    <div
                      key={label}
                      className={cn(
                        'grid grid-cols-[160px_1fr] sm:grid-cols-[200px_1fr] gap-4 p-4 text-sm',
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'
                      )}
                    >
                      <dt className="font-bold text-[#0F172A]">{label}</dt>
                      <dd className="text-[#475569]">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex flex-col justify-center rounded-2xl bg-[#FFF7ED]/50 border border-[#FFEDD5] p-6 sm:p-8">
                  <h3 className="font-['Outfit'] text-xl font-bold text-[#9A3412] mb-3">Live Engineering Support</h3>
                  <p className="text-sm text-[#7C2D12] leading-relaxed mb-6">
                    Need customized mounting dimensions, industrial kitchen integration specs, or LPG/natural gas conversion kits? Our engineering team provides direct CAD drawings and commercial technical support.
                  </p>
                  <Button
                    className="self-start rounded-xl font-bold bg-[#C2410C] hover:bg-[#9A3412]"
                    onClick={() => onNavigate?.('contact')}
                  >
                    Speak with an Engineer
                  </Button>
                </div>
              </div>
            )}

            {tab === 'Usage' && (
              <div className="max-w-3xl space-y-4">
                <p className="text-base text-[#1E293B] leading-relaxed">
                  {product.usage || 'Refer to the included quick-start manual for complete assembly and lighting instructions.'}
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <span className="block font-['Outfit'] text-lg font-bold text-[#C2410C]">01. Setup</span>
                    <p className="mt-1 text-xs text-[#64748B]">Interlock base panels on firm ground without tools or bolts.</p>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <span className="block font-['Outfit'] text-lg font-bold text-[#C2410C]">02. Ignite</span>
                    <p className="mt-1 text-xs text-[#64748B]">Load hardwood lump charcoal or wood briquettes into the ventilated bed.</p>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <span className="block font-['Outfit'] text-lg font-bold text-[#C2410C]">03. Maintain</span>
                    <p className="mt-1 text-xs text-[#64748B]">Allow unit to cool after cook, dispose ash safely, and store dry.</p>
                  </div>
                </div>
              </div>
            )}

            {tab === 'Warranty' && (
              <div className="max-w-3xl space-y-4">
                <p className="text-base text-[#1E293B]">
                  {product.warranty || '1 Year Standard Manufacturer Warranty against fabrication or material defects.'}
                </p>
                <p className="text-sm text-[#64748B]">
                  KitchenBots India guarantees all laser-welded structural components against burn-through and structural failure. Replacement parts and modular components are permanently stocked for immediate dispatch from our manufacturing hub.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Related Products Section */}
        <section className="mt-20 border-t border-[#E2E8F0] pt-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-['Outfit'] text-2xl font-bold text-[#0F172A]">Related products in {product.category}</h2>
              <p className="mt-1 font-['DM_Sans'] text-sm text-[#64748B]">Engineered outdoor cooking hardware</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-[#CBD5E1]"
              onClick={onBack}
            >
              View catalog <ChevronRight size={15} />
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.filter(item => item.id !== product.id && item.category === product.category).slice(0, 4).map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate ? onNavigate('product-detail', item.id) : (window.location.href = `/product-detail?id=${encodeURIComponent(item.id)}`)}
                className="group overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white text-left transition-all duration-200 hover:border-[#CBD5E1] hover:shadow-md"
              >
                <div className="aspect-[4/3] bg-[#F8FAFC] p-5 text-center">
                  <ProductImage src={item.image} alt={item.name} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]" />
                </div>
                <div className="p-4">
                  <span className="block font-['Outfit'] font-bold text-[#0F172A] group-hover:text-[#C2410C] transition-colors">{item.name}</span>
                  <span className="mt-1 block font-['Outfit'] text-sm font-bold text-[#64748B]">{formatPrice(item.price)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
