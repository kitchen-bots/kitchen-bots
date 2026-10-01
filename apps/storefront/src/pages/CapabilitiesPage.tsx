import { type Page } from '../App';
import { Settings, Flame, RotateCw, Box, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getMediaUrl } from '../lib/cdn';

interface CapabilitiesPageProps {
  onNavigate?: (page: Page) => void;
}

export default function CapabilitiesPage({ onNavigate }: CapabilitiesPageProps) {
  const capabilities = [
    {
      icon: Settings,
      title: 'Mechanical Design & Heavy Fabrication',
      description: 'We engineer commercial cooking equipment using heavy-gauge 304 stainless steel, reinforced framing, and precision welds designed to withstand high-volume restaurant service.',
      specs: [
        'Heavy-gauge stainless steel construction',
        'Reinforced framing and thermal expansion joints',
        'Precision laser-cut grates and fireboxes',
      ],
      image: getMediaUrl('/images/redesign/cap-1.png'),
    },
    {
      icon: Flame,
      title: 'Thermal Dynamics & Airflow Geometry',
      description: 'Our rocket stoves and open-fire cooking units utilize controlled draft geometry to extract maximum heat value from charcoal and solid biomass, reducing fuel consumption.',
      specs: [
        'Targeted combustion chambers for high efficiency',
        'Calibrated oxygen intake channels',
        'Even heat diffusion across cooking surfaces',
      ],
      image: getMediaUrl('/images/redesign/cap-2.png'),
    },
    {
      icon: RotateCw,
      title: 'Automated Turning & Rotisserie Systems',
      description: 'KitchenBots integrates continuous motor-driven mechanisms for even roasting and turning, reducing operator oversight during busy kitchen shifts.',
      specs: [
        'High-torque geared rotisserie drives',
        'Balanced multi-skewer turning assemblies',
        'Thermal-shielded motor housings',
      ],
      image: getMediaUrl('/images/redesign/cap-3.png'),
    },
    {
      icon: Box,
      title: 'Modular & Transport-Ready Engineering',
      description: 'Designed for commercial caterers and outdoor food operators, our collapsible BBQ units offer quick assembly and breakdown without sacrificing structural rigidity.',
      specs: [
        'Interlocking tool-free frame joints',
        'Compact transport footprints with carry cases',
        'Tested weight capacities for high-volume batches',
      ],
      image: getMediaUrl('/images/redesign/cap-4.png'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 sm:pt-28">
      {/* HERO SECTION */}
      <section className="border-b border-[#E2E8F0] bg-white py-12 lg:py-20">
        <div className="mx-auto max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              <h1 className="font-['Outfit'] text-[38px] font-bold leading-[1.08] text-[#111827] sm:text-[48px] lg:text-[56px]">
                Engineering & Manufacturing <span className="text-kb-tertiary">Capabilities</span>
              </h1>
              <p className="mt-5 font-['DM_Sans'] text-[17px] leading-relaxed text-[#475569] sm:text-[18px]">
                KitchenBots designs and manufactures heavy-duty cooking hardware, solid-fuel combustion systems, and automated grilling equipment for food enthusiasts, commercial hospitality, and catering operations.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  onClick={() => onNavigate?.('contact')}
                  size="lg"
                  className="rounded-xl px-7"
                >
                  Contact engineering team <ArrowRight size={18} className="ml-1" />
                </Button>
                <Button
                  onClick={() => onNavigate?.('products')}
                  variant="outline"
                  size="lg"
                  className="rounded-xl px-7 border-[#CBD5E1]"
                >
                  Explore equipment
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F1F5F9] shadow-lg">
                <img
                  src={getMediaUrl('/images/redesign/capabilities-hero.png')}
                  alt="KitchenBots commercial equipment manufacturing"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
          <div className="mb-14 max-w-3xl">
            <h2 className="font-['Outfit'] text-[32px] font-bold text-[#111827] sm:text-[40px]">
              Manufacturing and engineering disciplines
            </h2>
            <p className="mt-3 font-['DM_Sans'] text-[16px] text-[#64748B]">
              Every unit is built from verified commercial specifications for high reliability in active kitchen environments.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <article key={cap.title} className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="aspect-[16/9] w-full overflow-hidden bg-[#F1F5F9]">
                    <img
                      src={cap.image}
                      alt={cap.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-8">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C2410C]">
                      <Icon size={24} />
                    </div>
                    <h3 className="font-['Outfit'] text-[22px] font-bold text-[#111827]">
                      {cap.title}
                    </h3>
                    <p className="mt-3 font-['DM_Sans'] text-[15px] leading-relaxed text-[#64748B]">
                      {cap.description}
                    </p>
                    <ul className="mt-6 space-y-2 border-t border-[#F1F5F9] pt-6 font-['DM_Sans'] text-[14px] text-[#475569]">
                      {cap.specs.map((spec, sIdx) => (
                        <li key={sIdx} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#C2410C]" />
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="pb-20 lg:pb-28">
        <div className="mx-auto max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
          <div className="rounded-3xl border border-[#334155]/80 bg-[#0F172A] p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#EA580C]/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#F97316] border border-[#EA580C]/30">
              Custom Engineering & Bulk Orders
            </div>
            <h2 className="font-['Outfit'] text-[28px] font-bold leading-tight sm:text-[38px] lg:text-[42px] text-white">
              Require custom dimensions or specialized equipment?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-['DM_Sans'] text-[16px] text-[#94A3B8] sm:text-[18px] leading-relaxed">
              Speak directly with our engineering team to review kitchen layouts, unit dimensions, and bulk manufacturing schedules.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={() => onNavigate?.('contact')}
                size="lg"
                className="rounded-xl px-8 py-6 text-base font-semibold bg-[#C2410C] hover:bg-[#9A3412] text-white shadow-lg shadow-[#C2410C]/25 transition-all"
              >
                Submit equipment enquiry
              </Button>
              <Button
                onClick={() => onNavigate?.('bulk-enquiry')}
                variant="outline"
                size="lg"
                className="rounded-xl px-8 py-6 text-base font-semibold bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm transition-all"
              >
                Request bulk quotation
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
