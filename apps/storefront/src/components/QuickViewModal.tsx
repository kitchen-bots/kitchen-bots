import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingCart, Minus, Plus, ArrowRight, Camera, RotateCw, Film, Shield, Truck } from 'lucide-react';
import type { Product } from '../types/product';
import { useCart } from '../hooks/use-cart';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import ProductImage from './ProductImage';
import Product360Viewer from './Product360Viewer';
import ProductVideoPlayer from './ProductVideoPlayer';
import { cn } from '../lib/utils';
import { getMediaUrl } from '../lib/cdn';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: (id: string) => void;
  onCartOpen?: () => void;
}

type MediaTab = 'photos' | '360' | 'video';

const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(price);

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  onViewDetails,
  onCartOpen,
}: QuickViewModalProps) {
  const [activeMediaTab, setActiveMediaTab] = useState<MediaTab>('photos');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [prevProductId, setPrevProductId] = useState(product?.id);

  // Ultra-fast zero-latency direct DOM zoom engine for Quick View
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const zoomImageRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = zoomContainerRef.current;
    const target = zoomImageRef.current;
    if (!container || !target) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    target.style.transition = 'none';
    target.style.transformOrigin = `${x.toFixed(2)}% ${y.toFixed(2)}%`;
    void target.offsetHeight;
    target.style.transition = 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1)';
    target.style.transform = 'scale(2.4)';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = zoomContainerRef.current;
    const target = zoomImageRef.current;
    if (!container || !target) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    target.style.transformOrigin = `${x.toFixed(2)}% ${y.toFixed(2)}%`;
    if (target.style.transform !== 'scale(2.4)') {
      target.style.transition = 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1)';
      target.style.transform = 'scale(2.4)';
    }
  };

  const handleMouseLeave = () => {
    const target = zoomImageRef.current;
    if (target) {
      target.style.transition = 'transform 150ms ease-out';
      target.style.transform = 'scale(1)';
      target.style.transformOrigin = '50% 50%';
    }
  };

  // Reset zoom on product, photo, or tab change
  useEffect(() => {
    const target = zoomImageRef.current;
    if (target) {
      target.style.transition = 'none';
      target.style.transform = 'scale(1)';
      target.style.transformOrigin = '50% 50%';
    }
  }, [activeImageIdx, product?.id, activeMediaTab]);

  if (product && product.id !== prevProductId) {
    setPrevProductId(product.id);
    setActiveMediaTab('photos');
    setActiveImageIdx(0);
  }

  // Preload and hardware-decode all product gallery photos on modal open to eliminate zoom and preview delay
  useEffect(() => {
    if (!isOpen || !product) return;
    const gallery = product.images?.length ? product.images : [product.image];
    gallery.forEach(img => {
      const resolved = getMediaUrl(img);
      if (resolved) {
        const link = new Image();
        link.src = resolved;
        if (typeof link.decode === 'function') {
          link.decode().catch(() => {});
        }
      }
    });
  }, [isOpen, product]);

  const { addToCart, items, updateQuantity } = useCart();
  const { showToast } = useToast();

  // Handle ESC key to close and lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product || typeof document === 'undefined') return null;

  const images = product.images?.length ? product.images : [product.image];
  const cartItem = items.find(item => item.id === product.id);
  const quantityInCart = cartItem?.quantity ?? 0;
  const discountPercent = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-5 md:p-6 lg:p-8 animate-fade-in overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        className="relative z-10 my-auto flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-scale-up border border-[#E2E8F0]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#475569] shadow-md border border-[#E2E8F0] backdrop-blur-md transition-all hover:bg-[#F1F5F9] hover:text-[#0F172A] hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="grid flex-1 overflow-y-auto lg:grid-cols-12">
          {/* Media Section (Left 7 cols) */}
          <div className="flex flex-col border-b border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:p-6 lg:col-span-7 lg:border-b-0 lg:border-r">
            {/* Media Mode Tabs */}
            <div className="mb-4 flex items-center gap-2" role="tablist" aria-label="Quick View Media Options">
              <button
                type="button"
                role="tab"
                id="quick-tab-photos"
                aria-selected={activeMediaTab === 'photos'}
                aria-controls="quick-panel-photos"
                onClick={() => setActiveMediaTab('photos')}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all select-none',
                  activeMediaTab === 'photos'
                    ? 'bg-[#C2410C] text-white shadow-sm border border-[#C2410C]'
                    : 'bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#FFF7ED]/50 hover:text-[#C2410C] hover:border-[#FDBA74]'
                )}
              >
                <Camera size={14} /> Photos ({images.length})
              </button>

              {product.sequenceId && (
                <button
                  type="button"
                  role="tab"
                  id="quick-tab-360"
                  aria-selected={activeMediaTab === '360'}
                  aria-controls="quick-panel-360"
                  onClick={() => setActiveMediaTab('360')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all select-none',
                    activeMediaTab === '360'
                      ? 'bg-[#C2410C] text-white shadow-sm border border-[#C2410C]'
                      : 'bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#FFF7ED]/50 hover:text-[#C2410C] hover:border-[#FDBA74]'
                  )}
                >
                  <RotateCw size={14} /> Interactive 360° 3D
                </button>
              )}

              {product.video && (
                <button
                  type="button"
                  role="tab"
                  id="quick-tab-video"
                  aria-selected={activeMediaTab === 'video'}
                  aria-controls="quick-panel-video"
                  onClick={() => setActiveMediaTab('video')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all select-none',
                    activeMediaTab === 'video'
                      ? 'bg-[#C2410C] text-white shadow-sm border border-[#C2410C]'
                      : 'bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#FFF7ED]/50 hover:text-[#C2410C] hover:border-[#FDBA74]'
                  )}
                >
                  <Film size={14} /> HD Turntable Video
                </button>
              )}
            </div>

            {/* Media Stage */}
            <div className="relative aspect-[4/3] max-h-[340px] sm:max-h-[380px] w-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs mx-auto flex items-center justify-center">
              <div
                id="quick-panel-photos"
                role="tabpanel"
                aria-labelledby="quick-tab-photos"
                ref={zoomContainerRef}
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={cn(
                  'relative h-full w-full flex items-center justify-center overflow-hidden cursor-zoom-in select-none group',
                  activeMediaTab === 'photos' ? 'block' : 'hidden'
                )}
              >
                <div
                  ref={zoomImageRef}
                  className="h-full w-full will-change-transform flex items-center justify-center select-none"
                >
                  <ProductImage
                    src={images[activeImageIdx]}
                    alt={product.name}
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    className="h-full w-full object-contain pointer-events-none"
                  />
                </div>
              </div>

              {product.sequenceId && (
                <div
                  id="quick-panel-360"
                  role="tabpanel"
                  aria-labelledby="quick-tab-360"
                  className={cn('h-full w-full', activeMediaTab === '360' ? 'block' : 'hidden')}
                >
                  {activeMediaTab === '360' && (
                    <Product360Viewer
                      sequenceId={product.sequenceId}
                      frameCount={product.sequenceFrameCount || 40}
                      productName={product.name}
                      posterImage={product.image}
                      className="h-full w-full border-0"
                    />
                  )}
                </div>
              )}

              {product.video && (
                <div
                  id="quick-panel-video"
                  role="tabpanel"
                  aria-labelledby="quick-tab-video"
                  className={cn('h-full w-full', activeMediaTab === 'video' ? 'block' : 'hidden')}
                >
                  <ProductVideoPlayer
                    src={product.video}
                    poster={product.image}
                    productName={product.name}
                    className="h-full w-full border-0"
                    autoPlay={activeMediaTab === 'video'}
                  />
                </div>
              )}
            </div>

            {/* Thumbnail Rail */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => {
                      setActiveImageIdx(i);
                      setActiveMediaTab('photos');
                    }}
                    title={`View photo ${i + 1}`}
                    className={cn(
                      'h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition-all cursor-pointer',
                      activeMediaTab === 'photos' && activeImageIdx === i
                        ? 'border-[#C2410C] shadow-xs scale-105'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                    )}
                  >
                    <ProductImage src={img} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section (Right 5 cols) */}
          <div className="flex flex-col p-6 sm:p-7 lg:col-span-5">
            <div className="pr-12">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C] bg-[#FFF7ED] px-2.5 py-0.5 rounded-md border border-[#FED7AA]">
                  {product.category}
                </span>
                {product.featured && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md border border-orange-200">
                    Featured
                  </span>
                )}
              </div>
              <h2 id="quick-view-title" className="mt-2 font-['Outfit'] text-2xl font-bold leading-snug text-[#0F172A] sm:text-3xl">
                {product.name}
              </h2>
            </div>

            <div className="mt-3.5 flex flex-wrap items-baseline gap-2.5">
              <span className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-[#0F172A]">
                {formatPrice(product.price)}
              </span>
              {product.mrp && product.mrp > product.price && (
                <>
                  <span className="text-sm font-medium text-[#94A3B8] line-through">
                    MRP {formatPrice(product.mrp)}
                  </span>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="mt-3 font-['DM_Sans'] text-sm leading-relaxed text-[#64748B] line-clamp-3">
              {product.shortDescription || product.description}
            </p>

            {/* Quick Specs Matrix */}
            <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-['DM_Sans']">
              {product.material && (
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                  <span className="block text-[10px] font-bold uppercase text-[#94A3B8]">Material</span>
                  <span className="font-semibold text-[#1E293B] truncate block">{product.material}</span>
                </div>
              )}
              {product.weight && (
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                  <span className="block text-[10px] font-bold uppercase text-[#94A3B8]">Weight</span>
                  <span className="font-semibold text-[#1E293B] truncate block">{product.weight}</span>
                </div>
              )}
              {product.dimensions && (
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                  <span className="block text-[10px] font-bold uppercase text-[#94A3B8]">Assembled Size</span>
                  <span className="font-semibold text-[#1E293B] truncate block">{product.dimensions}</span>
                </div>
              )}
              {product.heatResistance && (
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                  <span className="block text-[10px] font-bold uppercase text-[#94A3B8]">Heat Rating</span>
                  <span className="font-semibold text-[#1E293B] truncate block">{product.heatResistance}</span>
                </div>
              )}
            </div>

            {/* Guarantees */}
            <div className="mt-4 flex flex-col gap-1.5 border-t border-[#E2E8F0] pt-3 text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-[#C2410C] shrink-0" />
                <span>Pan-India doorstep delivery to 19,000+ pin codes</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#16A34A] shrink-0" />
                <span>{product.warranty || '1 Year Manufacturer Warranty'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto flex flex-col gap-2.5 pt-5">
              {quantityInCart > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex h-11 w-full items-center justify-between rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-1.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantityInCart - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0F172A] border border-[#E2E8F0] shadow-xs hover:bg-[#F1F5F9] cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="font-['Outfit'] font-bold text-sm text-[#0F172A]">
                      {quantityInCart} in cart
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantityInCart + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C2410C] text-white shadow-xs hover:bg-[#9A3412] cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  className="h-11 w-full rounded-xl font-bold text-sm"
                  onClick={() => {
                    addToCart({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                    });
                    showToast(`${product.name} added to cart`, 'View cart', () => onCartOpen?.());
                  }}
                >
                  <ShoppingCart size={17} className="mr-2" /> Add to cart
                </Button>
              )}

              <Button
                variant="outline"
                className="h-11 w-full rounded-xl border-[#CBD5E1] font-bold text-xs sm:text-sm text-[#0F172A] hover:bg-[#F8FAFC]"
                onClick={() => {
                  onClose();
                  onViewDetails(product.id);
                }}
              >
                View full specifications & 3D <ArrowRight size={15} className="ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
