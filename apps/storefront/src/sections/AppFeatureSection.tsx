import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Flame, ShieldCheck, Truck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const productShowcases = [
  {
    icon: Flame,
    label: 'NEW',
    title: 'Suitcase BBQ',
    subtitle: 'Compact · ₹3,999',
    tagline: 'Fold. Carry. Cook.',
    color: 'bg-[var(--brand-600)]',
    gradient: 'from-[var(--brand-600)] to-[var(--brand-700)]',
  },
  {
    icon: ShieldCheck,
    label: 'BESTSELLER',
    title: 'Rocket Stove',
    subtitle: '150mm · ₹3,499',
    tagline: '75% Fuel Savings',
    color: 'bg-[var(--brand-800)]',
    gradient: 'from-[var(--brand-800)] to-[var(--brand-900)]',
  },
  {
    icon: Truck,
    label: 'COMMERCIAL',
    title: 'Automatic BBQ',
    subtitle: 'Stainless · ₹12,999',
    tagline: 'Feeds 30 People',
    color: 'bg-[#4A4A4A]',
    gradient: 'from-[#4A4A4A] to-[#5A5A5A]',
  },
];

import { type Page } from '../App';

interface AppFeatureSectionProps {
  onNavigate?: (page: Page) => void;
}

export default function AppFeatureSection({ onNavigate }: AppFeatureSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const cards = cardsRef.current;

    if (!section || !content || !cards) return;

    const ctx = gsap.context(() => {
      const contentElements = content.querySelectorAll('.animate-item');
      const cardElements = cards.querySelectorAll('.product-showcase-card');

      gsap.set(contentElements, { opacity: 0, y: 30 });
      gsap.set(cardElements, { opacity: 0, y: 60, rotateX: 15 });

      ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        onEnter: () => {
          const tl = gsap.timeline();

          tl.to(cardElements, {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: 'expo.out',
          }).to(
            contentElements,
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.1,
              ease: 'expo.out',
            },
            '-=0.3'
          );
        },
        once: true,
      });

      // Subtle parallax on scroll
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          gsap.set(content, { y: -30 * self.progress });
        },
      });

      // 3D tilt on cards
      cardElements.forEach((card) => {
        const el = card as HTMLElement;
        const handleMove = (e: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
          const y = -((e.clientY - rect.top) / rect.height - 0.5) * 16;
          gsap.to(el, { rotateY: x, rotateX: y, duration: 0.3, ease: 'power2.out', transformPerspective: 800 });
        };
        const handleLeave = () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power2.out' });
        el.addEventListener('mousemove', handleMove);
        el.addEventListener('mouseleave', handleLeave);
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#F7FAF7] overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Product Showcase Cards */}
          <div
            ref={cardsRef}
            className="relative h-[500px] flex items-center justify-center"
            style={{ perspective: '1200px' }}
          >
            {productShowcases.map((item, index) => {
              const Icon = item.icon;
              const offsets = ['-translate-x-12 -translate-y-8 rotate-[-8deg]', '-translate-x-4 translate-y-2 rotate-[-3deg]', 'translate-x-10 translate-y-10 rotate-[3deg]'];
              const zIndexes = [1, 2, 3];

              return (
                <div
                  key={index}
                  className={`product-showcase-card absolute ${offsets[index]}`}
                  style={{
                    zIndex: zIndexes[index],
                    transformStyle: 'preserve-3d',
                    animation: `float ${5 + index}s ease-in-out infinite`,
                    animationDelay: `${index * 0.8}s`,
                  }}
                >
                  <div className="w-56 h-72 bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E0EAE0]"
                    style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}>
                    {/* Card Top  - gradient */}
                    <div className={`h-36 bg-gradient-to-br ${item.gradient} flex items-center justify-center relative`}>
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>
                      {/* Label badge */}
                      <span className="absolute top-3 right-3 bg-white/20 text-white text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {item.label}
                      </span>
                    </div>
                    {/* Card Content */}
                    <div className="p-4">
                      <p className="text-xs font-bold text-[var(--brand-800)] tracking-widest mb-0.5">{item.tagline}</p>
                      <h4 className="text-lg font-bold font-['Outfit'] text-[#4A4A4A] mb-0.5">{item.title}</h4>
                      <p className="text-sm text-[#4A4A4A]/60">{item.subtitle}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-[#F7FAF7] rounded-full" />
                        <div className="w-6 h-6 bg-[var(--brand-600)] rounded-full flex items-center justify-center">
                          <ArrowRight className="w-3 h-3 text-white" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div ref={contentRef} className="lg:pl-8">
            <span className="animate-item inline-block text-xs font-medium tracking-widest text-[var(--brand-800)] uppercase mb-4">
              Commercial-Grade Quality
            </span>

            <h2 className="animate-item text-4xl md:text-5xl font-bold font-['Outfit'] text-[#4A4A4A] mb-6">
              Engineered in India
            </h2>

            <p className="animate-item text-lg text-[#4A4A4A]/80 leading-relaxed mb-8">
              Experience the difference of precision manufacturing. Our BBQ grills and rocket stoves
              are built to deliver exceptional thermal performance - designed for passionate home cooks
              and demanding commercial environments alike.
            </p>

            <ul className="animate-item space-y-4 mb-8" aria-label="Product highlights">
              {[
                'High-grade steel construction rated to 1000°C',
                'Modular designs for easy upgrades and servicing',
                'Engineered airflow for 40% fuel savings',
                'Nationwide delivery with manufacturer warranty',
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[var(--brand-300)] rounded-full flex-shrink-0" aria-hidden="true" />
                  <span className="text-[#4A4A4A]/80">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className="animate-item btn-primary"
              onClick={() => onNavigate && onNavigate('products')}
              aria-label="Explore all KitchenBots products"
            >
              Explore Products
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
