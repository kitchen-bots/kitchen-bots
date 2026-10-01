import { useState, useEffect } from 'react';
import { X, ShoppingCart, Minus, Plus, ArrowRight, Camera, RotateCw, Film, Shield, Truck } from 'lucide-react';
import type { Product } from '../types/product';
import { useCart } from '../hooks/use-cart';
import { MAX_ITEM_QUANTITY } from '../context/CartContextData';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import ProductImage from './ProductImage';
import Product360Viewer from './Product360Viewer';
import ProductVideoPlayer from './ProductVideoPlayer';
import { cn } from '../lib/utils';

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

  if (product && product.id !== prevProductId) {
    setPrevProductId(product.id);
    setActiveMediaTab('photos');
    setActiveImageIdx(0);
  }

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

  if (!isOpen || !product) return null;

  const images = product.images?.length ? product.images : [product.image];
  const cartItem = items.find(item => item.id === product.id);
  const quantityInCart = cartItem?.quantity ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-scale-up"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#475569] shadow-sm backdrop-blur-md transition-all hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="grid flex-1 overflow-y-auto lg:grid-cols-12">
          {/* Media Section (Left 7 cols) */}
          <div className="flex flex-col border-b border-[#E2E8F0] bg-[#F8FAFC] p-6 lg:col-span-7 lg:border-b-0 lg:border-r">
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
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
              <div
                id="quick-panel-photos"
                role="tabpanel"
                aria-labelledby="quick-tab-photos"
                className={cn('h-full w-full flex items-center justify-center', activeMediaTab === 'photos' ? 'block' : 'hidden')}
              >
                <ProductImage
                  src={images[activeImageIdx]}
                  alt={product.name}
                  loading="eager"
                  fetchPriority="high"
                  className="h-full w-full object-contain"
                />
              </div>

              {product.sequenceId && (
                <div
                  id="quick-panel-360"
                  role="tabpanel"
                  aria-labelledby="quick-tab-360"
                  className={cn('h-full w-full', activeMediaTab === '360' ? 'block' : 'hidden')}
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
          <div className="flex flex-col p-6 sm:p-8 lg:col-span-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C2410C]">
              {product.category}
            </span>
            <h2 id="quick-view-title" className="mt-1 font-['Outfit'] text-2xl font-bold leading-tight text-[#0F172A] sm:text-3xl">
              {product.name}
            </h2>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-['Outfit'] text-3xl font-bold text-[#0F172A]">
                {formatPrice(product.price)}
              </span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-sm font-medium text-[#94A3B8] line-through">
                  MRP {formatPrice(product.mrp)}
                </span>
              )}
            </div>

            <p className="mt-4 font-['DM_Sans'] text-sm leading-relaxed text-[#64748B]">
              {product.shortDescription || product.description}
            </p>

            {/* Quick Specs Matrix */}
            <div className="mt-6 grid grid-cols-2 gap-2 text-xs font-['DM_Sans']">
              {product.material && (
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                  <span className="block text-[11px] font-bold uppercase text-[#94A3B8]">Material</span>
                  <span className="font-semibold text-[#1E293B] truncate block">{product.material}</span>
                </div>
              )}
              {product.weight && (
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                  <span className="block text-[11px] font-bold uppercase text-[#94A3B8]">Weight</span>
                  <span className="font-semibold text-[#1E293B] truncate block">{product.weight}</span>
                </div>
              )}
              {product.dimensions && (
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                  <span className="block text-[11px] font-bold uppercase text-[#94A3B8]">Assembled Size</span>
                  <span className="font-semibold text-[#1E293B] truncate block">{product.dimensions}</span>
                </div>
              )}
              {product.heatResistance && (
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                  <span className="block text-[11px] font-bold uppercase text-[#94A3B8]">Heat Rating</span>
                  <span className="font-semibold text-[#1E293B] truncate block">{product.heatResistance}</span>
                </div>
              )}
            </div>

            {/* Guarantees */}
            <div className="mt-5 flex flex-col gap-1.5 border-t border-[#E2E8F0] pt-4 text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-[#C2410C]" />
                <span>Pan-India doorstep delivery to 19,000+ pin codes</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#16A34A]" />
                <span>{product.warranty || '1 Year Manufacturer Warranty'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto flex flex-col gap-3 pt-6">
              {quantityInCart > 0 ? (
                <div className="space-y-2">
                  <div className="flex h-12 w-full items-center justify-between rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-1.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantityInCart - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#0F172A] border border-[#E2E8F0] shadow-xs hover:bg-[#F1F5F9]"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-['Outfit'] font-bold text-sm text-[#0F172A]">
                      {quantityInCart} in cart
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantityInCart + 1)}
                      disabled={quantityInCart >= MAX_ITEM_QUANTITY}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C2410C] text-white shadow-xs hover:bg-[#9A3412] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#C2410C]"
                      aria-label="Increase quantity"
                      title={quantityInCart >= MAX_ITEM_QUANTITY ? `Maximum limit of ${MAX_ITEM_QUANTITY} items per order` : undefined}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {quantityInCart >= MAX_ITEM_QUANTITY && (
                    <p className="text-center text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200/70 py-1 px-2 rounded-lg font-['DM_Sans']">
                      Maximum limit of {MAX_ITEM_QUANTITY} units reached
                    </p>
                  )}
                </div>
              ) : (
                <Button
                  className="h-12 w-full rounded-xl font-bold"
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
                  <ShoppingCart size={18} className="mr-2" /> Add to cart
                </Button>
              )}

              <Button
                variant="outline"
                className="h-12 w-full rounded-xl border-[#CBD5E1] font-bold text-[#0F172A] hover:bg-[#F8FAFC]"
                onClick={() => {
                  onClose();
                  onViewDetails(product.id);
                }}
              >
                View full specifications & 3D <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
