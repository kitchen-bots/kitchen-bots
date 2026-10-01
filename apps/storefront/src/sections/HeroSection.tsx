import type { Page } from '../App';
import { ArrowRight, Wrench } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getMediaUrl } from '../lib/cdn';

export default function HeroSection({ onNavigate }: { onNavigate?: (page: Page) => void }) {
  return (
    <section className="relative flex min-h-[640px] lg:min-h-[780px] 2xl:min-h-[840px] w-full items-center overflow-hidden bg-[#F8FAFC]">
      {/* Background Image & Controlled Overlays */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src={getMediaUrl('/images/redesign/hero-robot.png')}
          alt=""
          className="h-full w-full object-cover object-center lg:object-[center_right]"
        />
        {/* Controlled gradient fade across screen */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/30 lg:via-white/70 lg:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16 pt-28 pb-20 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-28">
        <div className="max-w-2xl 2xl:max-w-3xl rounded-2xl bg-white/70 lg:bg-transparent p-6 sm:p-8 lg:p-0 backdrop-blur-sm lg:backdrop-blur-none border border-white/60 lg:border-none shadow-sm lg:shadow-none">
          <h1 className="font-['Outfit'] text-[38px] font-bold leading-[1.08] tracking-[-0.02em] text-[#112329] sm:text-[54px] lg:text-[68px] 2xl:text-[76px]">
            Heavy-duty grills & outdoor cooking gear
            <span className="mt-2 block text-kb-tertiary">for home pitmasters & commercial kitchens.</span>
          </h1>

          <p className="mt-6 mb-8 max-w-xl font-['DM_Sans'] text-[17px] leading-relaxed text-[#475569] sm:text-[19px] 2xl:text-[21px]">
            Precision-engineered Santa Maria grills, high-efficiency rocket stoves, and automated BBQ rotisseries. Available for direct individual purchase across India or custom bulk manufacturing for restaurants.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              onClick={() => onNavigate?.('products')}
              className="rounded-xl px-8 py-6 text-base font-semibold shadow-md shadow-kb-tertiary/20"
            >
              Browse products <ArrowRight size={20} className="ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate?.('capabilities')}
              className="rounded-xl px-7 py-6 text-base font-semibold bg-white/80 hover:bg-white border-[#CBD5E1]"
            >
              <Wrench size={18} className="mr-2 text-kb-tertiary" />
              View capabilities
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
