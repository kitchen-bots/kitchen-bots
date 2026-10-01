import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import ProductImage from '../components/ProductImage';
import { useCart } from '../modules/cart-system';
import { PRODUCTS } from '../data/products';

gsap.registerPlugin(ScrollTrigger);

const featuredProducts = PRODUCTS.filter(p => p.featured).slice(0, 6);

interface ProductCarouselProps {
  onProductClick: (id: string) => void;
}

export default function ProductCarousel({ onProductClick }: ProductCarouselProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    const section = sectionRef.current;
    const carousel = carouselRef.current;
    if (!section || !carousel) return;

    const ctx = gsap.context(() => {
      const title = section.querySelector('.section-title');
      const cards = carousel.querySelectorAll('.carousel-card');

      gsap.set(title, { opacity: 0, x: -100 });
      gsap.set(cards, { opacity: 0, x: 200, rotateY: 25 });

      ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        onEnter: () => {
          const tl = gsap.timeline();

          tl.to(title, {
            opacity: 1,
            x: 0,
            duration: 0.7,
            ease: 'expo.out',
          }).to(
            cards,
            {
              opacity: 1,
              x: 0,
              rotateY: 0,
              duration: 0.8,
              stagger: 0.15,
              ease: 'expo.out',
            },
            '-=0.4'
          );
        },
        once: true,
      });
    }, section);

    // Synchronize active dot with scroll position
    const handleScroll = () => {
      if (!carousel) return;
      const scrollPos = carousel.scrollLeft;
      const cardWidth = 320 + 24; // w-80 + gap-6
      const newIndex = Math.round(scrollPos / cardWidth);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < featuredProducts.length) {
        setActiveIndex(newIndex);
      }
    };

    carousel.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      ctx.revert();
      carousel.removeEventListener('scroll', handleScroll);
    };
  }, [activeIndex]);

  const scrollToCard = (index: number) => {
    setActiveIndex(index);
    const carousel = carouselRef.current;
    if (carousel) {
      const cardWidth = 320 + 24;
      carousel.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const handlePrev = () => {
    const newIndex = activeIndex === 0 ? featuredProducts.length - 1 : activeIndex - 1;
    scrollToCard(newIndex);
  };

  const handleNext = () => {
    const newIndex = activeIndex === featuredProducts.length - 1 ? 0 : activeIndex + 1;
    scrollToCard(newIndex);
  };

  const handleAddToCart = (product: typeof featuredProducts[0], e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });

    // Animate button
    const button = e.currentTarget as HTMLButtonElement;
    gsap.to(button, {
      scale: 1.2,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
    });
  };

  return (
    <section ref={sectionRef} className="py-24 bg-[#F7FAF7] overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="section-title">
            <span className="text-xs font-bold tracking-widest text-[var(--brand-800)] uppercase mb-2 block">Premium Selection</span>
            <h2 className="text-4xl md:text-5xl font-bold font-['Outfit'] text-[#4A4A4A]">
              Featured Grills
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon-lg"
              onClick={handlePrev}
              className="rounded-full shadow-lg hover:bg-accent hover:text-white transition-all duration-300"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              onClick={handleNext}
              className="rounded-full shadow-lg hover:bg-accent hover:text-white transition-all duration-300"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={carouselRef}
          className="relative"
          style={{ perspective: '1500px' }}
        >
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredProducts.map((product, index) => {
              const isActive = index === activeIndex;

              return (
                <div
                  key={product.id}
                  onClick={() => onProductClick(product.id)}
                  className={`carousel-card flex-shrink-0 w-80 snap-center cursor-pointer group`}
                  style={{
                    transform: isActive ? 'scale(1.05) translateZ(30px)' : 'scale(1) translateZ(-50px)',
                    transition: 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div
                    className="relative rounded-3xl overflow-hidden transition-all duration-400 border border-[#E0EAE0]"
                    style={{
                      background: 'white',
                      boxShadow: isActive
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
                        : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {/* Card Header */}
                    <div className="p-6 pb-0">
                      <h3 className="text-xl font-bold font-['Outfit'] text-[#4A4A4A] mb-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#4A4A4A]/40 font-medium">From</span>
                        <span className="text-2xl font-bold text-[#4A4A4A]">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Product Image */}
                    <div className="relative h-64 flex items-center justify-center p-6">
                      <ProductImage
                        src={product.image}
                        alt={`${product.name} - Premium BBQ Grill`}
                        loading="lazy"
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-xl"
                      />
                    </div>

                    {/* Add to Cart Button */}
                    <div className="p-6 pt-0">
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={(e) => handleAddToCart(product, e)}
                        className="w-full rounded-2xl flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5 stroke-[2.5px]" />
                        <span className="font-bold text-sm">Add to Cart</span>
                      </Button>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {featuredProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToCard(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${index === activeIndex
                ? 'w-8 bg-[var(--kb-primary)]'
                : 'bg-[#E0EAE0] hover:bg-[var(--brand-300)]/20'
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
