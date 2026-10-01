import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const brands = [
  'Amazon India',
  'Flipkart',
  'Zepto',
  'Blinkit',
  'Zomato B2B',
  'Swiggy Instamart',
  'Jindal Steel',
  'Tata Enterprise',
];

export default function BrandMarquee() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        section,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 bg-[#F7FAF7] overflow-hidden">
      <div className="container mx-auto px-6 mb-8">
        <p className="text-center text-sm text-[#4A4A4A]/60 uppercase tracking-widest">
          Trusted Partners & Retailers
        </p>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F7FAF7] to-transparent z-10" />

        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F7FAF7] to-transparent z-10" />

        {/* Row 1 - Moving Left */}
        <div className="flex animate-marquee-left mb-6">
          {[...brands, ...brands].map((brand, index) => (
            <div
              key={`row1-${index}`}
              className="flex-shrink-0 mx-8 px-8 py-4 bg-white border border-[#E0EAE0] rounded-full hover:bg-[var(--kb-primary)] hover:border-[var(--kb-primary)] hover:text-white transition-all duration-300 group cursor-pointer"
            >
              <span className="text-lg font-medium font-['Outfit'] text-[#4A4A4A] group-hover:text-white transition-colors duration-300 whitespace-nowrap">
                {brand}
              </span>
            </div>
          ))}
        </div>

        {/* Row 2 - Moving Right */}
        <div className="flex animate-marquee-right">
          {[...brands.reverse(), ...brands].map((brand, index) => (
            <div
              key={`row2-${index}`}
              className="flex-shrink-0 mx-8 px-8 py-4 bg-white border border-[#E0EAE0] rounded-full hover:bg-[var(--kb-primary)] hover:text-white transition-all duration-300 group cursor-pointer"
            >
              <span className="text-lg font-medium font-['Outfit'] text-[#4A4A4A] group-hover:text-white transition-colors duration-300 whitespace-nowrap">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
