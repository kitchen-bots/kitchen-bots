import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';

gsap.registerPlugin(ScrollTrigger);

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const orbs = section.querySelectorAll('.gradient-orb');
      const content = section.querySelector('.cta-content');
      const contentChildren = content?.children || [];

      gsap.set(orbs, { opacity: 0, scale: 0.5 });
      gsap.set(contentChildren, { opacity: 0, y: 30 });

      ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        onEnter: () => {
          const tl = gsap.timeline();

          // Animate orbs
          tl.to(orbs[0], {
            opacity: 0.6,
            scale: 1,
            duration: 1,
            ease: 'expo.out',
          })
            .to(
              orbs[1],
              {
                opacity: 0.4,
                scale: 1,
                duration: 1,
                ease: 'expo.out',
              },
              '-=0.8'
            )
            .to(
              orbs[2],
              {
                opacity: 0.5,
                scale: 1,
                duration: 1,
                ease: 'expo.out',
              },
              '-=0.8'
            );

          // Animate content
          tl.to(
            contentChildren,
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.1,
              ease: 'expo.out',
            },
            '-=0.5'
          );
        },
        once: true,
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#F7FAF7]">
      <div className="container mx-auto px-6">
        <div className="relative bg-[#4A4A4A] rounded-[40px] overflow-hidden py-20 px-8 md:px-16">
          {/* Gradient Orbs */}
          <div
            className="gradient-orb absolute w-96 h-96 rounded-full blur-[100px] animate-orb-1"
            style={{
              background: 'radial-gradient(circle, var(--brand-300) 0%, transparent 70%)',
              top: '-20%',
              left: '-10%',
            }}
          />
          <div
            className="gradient-orb absolute w-80 h-80 rounded-full blur-[100px] animate-orb-2"
            style={{
              background: 'radial-gradient(circle, var(--brand-600) 0%, transparent 70%)',
              bottom: '-20%',
              right: '10%',
            }}
          />
          <div
            className="gradient-orb absolute w-64 h-64 rounded-full blur-[80px]"
            style={{
              background: 'radial-gradient(circle, var(--brand-300) 0%, transparent 70%)',
              top: '30%',
              right: '-5%',
              animation: 'orb-drift-1 18s linear infinite reverse',
            }}
          />

          {/* Content */}
          <div className="cta-content relative z-10 text-center max-w-xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold font-['Outfit'] text-white mb-4">
              Experience KitchenBots Today
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Get in touch to explore the world of premium outdoor cooking systems - engineered for high heat.
            </p>
            <Button
              variant="accent"
              size="lg"
              className="inline-flex items-center gap-3 rounded-full"
            >
              <MessageSquare className="w-5 h-5" />
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
