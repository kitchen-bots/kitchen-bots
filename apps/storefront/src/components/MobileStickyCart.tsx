import { ShoppingBag } from 'lucide-react';
import { useCart } from '../hooks/use-cart';
import { Button } from './ui/button';

interface MobileStickyCartProps {
  onOpenCart: () => void;
}

export default function MobileStickyCart({ onOpenCart }: MobileStickyCartProps) {
  const { totalItems } = useCart();

  if (totalItems === 0) return null;

  return (
    <Button
      variant="ghost"
      onClick={onOpenCart}
      className="md:hidden fixed bottom-28 right-6 z-[60] flex items-center justify-center animate-bounce-in bg-transparent hover:bg-transparent p-0"
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-kb-tertiary rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
        <div className="relative w-16 h-16 bg-[#111827] text-white rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl transition-transform active:scale-90 overflow-hidden">
          <ShoppingBag size={24} />
          
          {/* Badge */}
          <div className="absolute top-3 right-3 w-5 h-5 bg-kb-tertiary text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-[#111827] animate-pulse-subtle">
            {totalItems}
          </div>
          
          {/* Decorative shine */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 skew-y-[-45deg] -translate-y-full group-hover:translate-y-full transition-transform duration-700" />
        </div>
      </div>
    </Button>
  );
}
