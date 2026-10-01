import { useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../hooks/use-cart';
import { MAX_ITEM_QUANTITY } from '../context/CartContextData';
import type { Page } from '../App';
import { Button } from './ui/button';
import ProductImage from './ProductImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: Page) => void;
}

export default function CartDrawer({ isOpen, onClose, onNavigate }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1E2329]/40 backdrop-blur-md z-[2000] transition-opacity duration-500 touch-none"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-[480px] bg-white/80 backdrop-blur-2xl border-l border-white/60 z-[2001] shadow-2xl flex flex-col transform transition-transform duration-500 ease-out overscroll-contain ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-[#F1F5F9]/80 bg-white/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-transparent flex items-center justify-center text-kb-primary">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#111827] font-['Outfit']">Your Selection</h2>
              <p className="text-[12px] text-[#94A3B8] font-bold uppercase tracking-widest font-['DM_Sans']">
                {totalItems} Industrial Item{totalItems !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={onClose}
            className="hover:bg-white/60 rounded-full group"
          >
            <X className="text-[#94A3B8] group-hover:text-[#111827]" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide overscroll-contain">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-white/50 backdrop-blur-md rounded-[32px] flex items-center justify-center mb-8 text-[#94A3B8] border border-white/80">
                <ShoppingBag size={48} />
              </div>
              <h3 className="text-[24px] font-bold text-[#111827] mb-3 font-['Outfit']">Cart is Clear</h3>
              <p className="text-[15px] text-[#64748B] mb-10 font-['DM_Sans'] leading-relaxed">
                Ready to optimize your kitchen? <br /> Browse our fleet of intelligent equipment.
              </p>
              <Button 
                onClick={() => { onClose(); onNavigate?.('products'); }}
                size="lg"
                className="uppercase tracking-widest text-[12px]"
              >
                Browse Catalog
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className="flex gap-6 p-6 bg-white/70 backdrop-blur-md border border-white/80 rounded-[32px] group hover:shadow-premium hover:bg-white/80 transition-all duration-300"
                >
                  <div className="w-24 h-24 bg-transparent rounded-2xl flex items-center justify-center p-2 shrink-0 overflow-hidden">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-bold text-[#111827] truncate font-['Outfit'] text-[16px]">{item.name}</h4>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-[#94A3B8] hover:text-[#EF4444]"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    
                    <p className="text-[18px] font-bold text-[#111827] mb-4 font-['Outfit']">
                      ₹{item.price.toLocaleString('en-IN')}
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3 bg-white/80 border border-[#E2E8F0] w-fit rounded-lg overflow-hidden h-[36px]">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 hover:bg-[#E2E8F0]"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus size={12} />
                        </Button>
                        <span className="text-[13px] font-bold w-4 text-center font-['Outfit']">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= MAX_ITEM_QUANTITY}
                          className="w-8 hover:bg-[#E2E8F0] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          aria-label={`Increase quantity of ${item.name}`}
                          title={item.quantity >= MAX_ITEM_QUANTITY ? `Maximum limit of ${MAX_ITEM_QUANTITY} items per order` : undefined}
                        >
                          <Plus size={12} />
                        </Button>
                      </div>
                      {item.quantity >= MAX_ITEM_QUANTITY && (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded font-['DM_Sans']">
                          Max limit ({MAX_ITEM_QUANTITY})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-8 border-t border-[#F1F5F9]/80 bg-white/60 backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-widest font-['Outfit']">Estimated Total</span>
                <div className="text-[32px] font-bold text-[#111827] font-['Outfit'] leading-tight">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={() => { onClose(); onNavigate?.('bulk-enquiry'); }}
                variant="accent"
                size="lg"
                className="w-full text-[16px] uppercase tracking-wider gap-3"
              >
                Request an Order Quote <ArrowRight size={20} />
              </Button>
              
              <Button
                onClick={() => { onClose(); onNavigate?.('cart'); }}
                variant="ghost"
                size="lg"
                className="w-full text-[12px] uppercase tracking-widest text-[#64748B] hover:text-[#111827] hover:bg-white/80 border border-[#E2E8F0]"
              >
                View Full Cart
              </Button>
            </div>
            
            <p className="text-center text-[12px] text-[#94A3B8] mt-6 font-['DM_Sans']">
              Final pricing, shipping, and taxes are confirmed in your quote.
            </p>
          </div>
        )}

      </div>
    </>
  );
}
