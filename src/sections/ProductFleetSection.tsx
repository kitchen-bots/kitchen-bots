import { useState } from 'react';
import { ArrowRight, Minus, Plus, ShoppingCart, Eye, RotateCw, Film } from 'lucide-react';
import { useCart } from '../hooks/use-cart';
import { MAX_ITEM_QUANTITY } from '../context/CartContextData';
import { useToast } from '../hooks/use-toast';
import { PRODUCTS } from '../data/products';
import type { Product } from '../types/product';
import { Button } from '../components/ui/button';
import ProductImage from '../components/ProductImage';
import QuickViewModal from '../components/QuickViewModal';

interface ProductFleetSectionProps {
  onBrowse?: () => void;
  onCartOpen?: () => void;
  onProductClick?: (id: string) => void;
}

const FEATURED_PRODUCTS = PRODUCTS.filter(product => product.featured).slice(0, 4);

const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(price);

export default function ProductFleetSection({ onBrowse, onProductClick, onCartOpen }: ProductFleetSectionProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { addToCart, items, updateQuantity } = useCart();
  const { showToast } = useToast();

  return (
    <section className="relative z-20 pb-24 lg:pb-32">
      <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <h2 className="font-['Outfit'] text-[34px] font-bold leading-tight text-[#111827] sm:text-[42px] lg:text-[48px]">
              Featured gear & equipment
            </h2>
            <p className="mt-3 font-['DM_Sans'] text-[#64748B] sm:text-[17px]">
              Heavy-duty Santa Maria grills, rocket stoves, and BBQ rotisseries for home pitmasters and commercial operations.
            </p>
          </div>
          <Button variant="outline" onClick={onBrowse} className="rounded-xl border-[#CBD5E1] font-semibold text-[#111827] hover:bg-[#F8FAFC]">
            View all products <ArrowRight size={18} className="ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_PRODUCTS.map(product => {
            const cartItem = items.find(item => item.id === product.id);
            const quantityInCart = cartItem?.quantity ?? 0;

            return (
              <article key={product.id} className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white transition-all duration-200 hover:border-[#CBD5E1] hover:shadow-xl">
                {/* Media Container with Badges & Quick View Action */}
                <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] p-6 text-center">
                  {/* Media Badges */}
                  <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 pointer-events-none">
                    {product.sequenceId && (
                      <span className="flex items-center gap-1 rounded-lg bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-md">
                        <RotateCw size={10} className="text-[#FDBA74] animate-spin-slow" /> 360° 3D
                      </span>
                    )}
                    {product.video && (
                      <span className="flex items-center gap-1 rounded-lg bg-[#C2410C]/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-md">
                        <Film size={10} /> Video
                      </span>
                    )}
                  </div>

                  {/* Corner Quick View Icon Button (touch-friendly & instant click) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickViewProduct(product);
                    }}
                    title={`Quick View ${product.name}`}
                    aria-label={`Quick View ${product.name}`}
                    className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#475569] shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-[#C2410C] hover:scale-110 active:scale-95 cursor-pointer opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Eye size={15} />
                  </button>

                  {/* Clickable Product Image */}
                  <button
                    type="button"
                    className="h-full w-full flex items-center justify-center cursor-pointer outline-none"
                    onClick={() => setQuickViewProduct(product)}
                    aria-label={`Quick View ${product.name}`}
                  >
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain will-change-transform transition-transform duration-200 group-hover:scale-105"
                    />
                  </button>

                  {/* Floating Quick View Bar on Hover */}
                  <div className="absolute inset-x-3 bottom-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickViewProduct(product);
                      }}
                      className="w-full rounded-xl bg-white/95 backdrop-blur-md border-[#CBD5E1] text-[#0F172A] font-bold shadow-md hover:bg-white active:scale-98 text-xs py-2 h-9"
                    >
                      <Eye size={14} className="mr-1.5 text-[#C2410C]" /> Quick View (360° / Video)
                    </Button>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <button type="button" className="text-left" onClick={() => setQuickViewProduct(product)}>
                    <h3 className="font-['Outfit'] text-[18px] font-bold leading-snug text-[#111827] hover:text-kb-tertiary transition-colors">{product.name}</h3>
                  </button>
                  <p className="mt-2.5 line-clamp-2 font-['DM_Sans'] text-sm leading-relaxed text-[#64748B]">{product.description}</p>
                  <div className="mt-5 font-['Outfit'] text-[20px] font-bold text-[#111827]">{formatPrice(product.price)}</div>

                  {quantityInCart > 0 ? (
                    <div className="mt-6 flex h-[48px] md:h-[52px] w-full items-center justify-between rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-1.5 shadow-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(product.id, quantityInCart - 1);
                        }}
                        className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-white text-[#0F172A] border border-[#E2E8F0] shadow-xs hover:bg-[#F1F5F9] active:scale-95 transition-all"
                        aria-label={`Decrease quantity of ${product.name}`}
                      >
                        <Minus size={15} className="stroke-[2.5]" />
                      </button>
                      <span className="font-['Outfit'] font-bold text-sm md:text-[15px] text-[#0F172A] select-none">
                        {quantityInCart} in cart
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(product.id, quantityInCart + 1);
                        }}
                        disabled={quantityInCart >= MAX_ITEM_QUANTITY}
                        className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[#C2410C] text-white shadow-xs hover:bg-[#9A3412] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-[#C2410C]"
                        aria-label={`Increase quantity of ${product.name}`}
                        title={quantityInCart >= MAX_ITEM_QUANTITY ? `Maximum limit of ${MAX_ITEM_QUANTITY} items per order` : undefined}
                      >
                        <Plus size={15} className="stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      className="mt-6 w-full rounded-xl font-semibold"
                      onClick={() => {
                        addToCart({ id: product.id, name: product.name, price: product.price, image: product.image });
                        showToast(`${product.name} added to cart`, 'View cart', () => onCartOpen?.());
                      }}
                    >
                      <ShoppingCart size={17} className="mr-1.5" /> Add to cart
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Quick View Interactive Turntable & Zoom Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onViewDetails={(id) => {
          setQuickViewProduct(null);
          onProductClick?.(id);
        }}
        onCartOpen={onCartOpen}
      />
    </section>
  );
}
