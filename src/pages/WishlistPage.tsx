import { useWishlist } from '../hooks/use-wishlist';
import { PRODUCTS } from '../data/products';
import { Heart, ArrowRight, Trash2, ShoppingBag, Package } from 'lucide-react';
import type { Page } from '../App';
import { useCart } from '../hooks/use-cart';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import ProductImage from '../components/ProductImage';

interface WishlistPageProps {
  onProductClick: (id: string) => void;
  onNavigate: (page: Page) => void;
}

export default function WishlistPage({ onProductClick, onNavigate }: WishlistPageProps) {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const savedProducts = PRODUCTS.filter(p => wishlist.includes(p.id));

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      maximumFractionDigits: 0 
    }).format(price);

  return (
    <section className="pt-20 sm:pt-24 min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-6 md:px-[80px] pt-4 sm:pt-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* HEADER */}
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#F1F5F9] pb-8">
            <div>
              <div className="flex items-center gap-2 text-kb-tertiary mb-2 font-['Outfit'] font-bold text-[14px] uppercase tracking-widest">
                <Heart size={16} fill="currentColor" />
                Saved for later
              </div>
              <h1 className="text-[40px] md:text-[48px] font-bold text-[#111827] mb-3 font-['Outfit'] leading-tight">
                Your Wishlist
              </h1>
              <p className="text-[#64748B] font-['DM_Sans'] text-[16px]">
                You have <span className="text-[#111827] font-bold">{savedProducts.length} items</span> in your wishlist.
              </p>
            </div>
            <Button 
              onClick={() => onNavigate('products')}
              variant="outline"
              size="default"
            >
              Continue Shopping <ArrowRight size={18} />
            </Button>
          </header>

          {savedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-white rounded-[32px] border border-[#F1F5F9] overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-500"
                >
                  <div 
                    className="relative aspect-[4/3] bg-[#F8FAFC] cursor-pointer overflow-hidden p-8 flex items-center justify-center"
                    onClick={() => onProductClick(product.id)}
                  >
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                    />
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      variant="destructive"
                      size="icon"
                      className="absolute top-6 right-6 w-11 h-11 bg-white hover:bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2]"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                  
                  <div className="p-8">
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold text-kb-primary uppercase tracking-widest px-2 py-0.5 bg-[#F0FDF4] rounded-full font-['Outfit']">
                          {product.category}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-[#E2E8F0]" />
                        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest font-['Outfit']">
                          In Stock
                        </span>
                      </div>
                      <h3 className="text-[20px] font-bold text-[#111827] leading-tight font-['Outfit'] group-hover:text-kb-tertiary transition-colors">{product.name}</h3>
                    </div>
                    
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#F1F5F9]">
                      <div className="flex flex-col">
                        <span className="text-[12px] text-[#64748B] font-medium font-['DM_Sans']">Starting Price</span>
                        <span className="text-[24px] font-bold text-[#111827] font-['Outfit']">{formatPrice(product.price)}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                        });
                        showToast(`${product.name} added to cart`, 'View Cart →', () => onNavigate('cart'));
                      }}
                      variant="accent"
                      size="lg"
                      className="w-full"
                    >
                      <ShoppingBag size={20} />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[48px] border border-[#F1F5F9] p-20 text-center shadow-[0_30px_70px_rgba(0,0,0,0.03)] max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-[#F8FAFC] rounded-3xl flex items-center justify-center mx-auto mb-8 text-[#E2E8F0] rotate-[-10deg]">
                <Package size={48} />
              </div>
              <h2 className="text-[28px] font-bold text-[#111827] mb-4 font-['Outfit']">Your wishlist is empty</h2>
              <p className="text-[#64748B] mb-10 font-['DM_Sans'] text-[16px] leading-relaxed">
                Explore our premium collection of industrial kitchen equipment and save your favorites here.
              </p>
              <Button 
                onClick={() => onNavigate('products')}
                variant="secondary"
                size="lg"
                className="px-12"
              >
                Start Exploring
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
