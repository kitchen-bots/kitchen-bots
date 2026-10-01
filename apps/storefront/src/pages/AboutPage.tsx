import { type Page } from '../App';
import { Phone, Mail, MapPin, Clock, ArrowRight, Flame, Shield, Wrench, Factory } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getMediaUrl } from '../lib/cdn';

interface AboutPageProps {
  onNavigate?: (page: Page) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 sm:pt-28">
      {/* 1. HERO SECTION */}
      <section className="border-b border-[#E2E8F0] bg-white py-14 lg:py-20">
        <div className="mx-auto max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h1 className="font-['Outfit'] text-[36px] font-bold leading-[1.08] text-[#111827] sm:text-[46px] lg:text-[54px]">
                Engineering heavy-duty cooking equipment for culinary enthusiasts and commercial kitchens.
              </h1>
              <p className="mt-6 font-['DM_Sans'] text-[17px] leading-relaxed text-[#475569] sm:text-[19px]">
                KitchenBots India Pvt. Ltd. manufactures precision BBQ grills, rocket stoves, and automated cooking hardware built for outdoor cooks, pitmasters, and demanding foodservice environments across India.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  onClick={() => onNavigate?.('products')}
                  size="lg"
                  className="rounded-xl px-7"
                >
                  Browse equipment <ArrowRight size={18} className="ml-1" />
                </Button>
                <Button
                  onClick={() => onNavigate?.('capabilities')}
                  variant="outline"
                  size="lg"
                  className="rounded-xl px-7 border-[#CBD5E1]"
                >
                  Manufacturing capabilities
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F1F5F9] shadow-md">
                <img
                  src={getMediaUrl('/images/redesign/capabilities-hero.png')}
                  alt="KitchenBots commercial cooking hardware"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHAT WE MANUFACTURE */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
          <div className="mb-12 max-w-3xl">
            <h2 className="font-['Outfit'] text-[30px] font-bold text-[#111827] sm:text-[38px]">
              What we manufacture
            </h2>
            <p className="mt-3 font-['DM_Sans'] text-[16px] text-[#64748B]">
              Purpose-built cooking systems engineered from heavy-gauge stainless steel for restaurants, caterers, and commercial food operators.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C2410C]">
                <Flame size={24} />
              </div>
              <h3 className="font-['Outfit'] text-[20px] font-bold text-[#111827]">
                Commercial BBQ Grills
              </h3>
              <p className="mt-3 font-['DM_Sans'] text-[15px] leading-relaxed text-[#64748B]">
                Santa Maria height-adjustable grills, automated multi-skewer rotisseries, and heavy-duty charcoal pits designed for high-capacity culinary shifts.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C2410C]">
                <Factory size={24} />
              </div>
              <h3 className="font-['Outfit'] text-[20px] font-bold text-[#111827]">
                High-Efficiency Rocket Stoves
              </h3>
              <p className="mt-3 font-['DM_Sans'] text-[15px] leading-relaxed text-[#64748B]">
                Precision insulated combustion channels that concentrate heat directly on cookware while significantly cutting solid fuel consumption.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C2410C]">
                <Shield size={24} />
              </div>
              <h3 className="font-['Outfit'] text-[20px] font-bold text-[#111827]">
                Collapsible & Modular Systems
              </h3>
              <p className="mt-3 font-['DM_Sans'] text-[15px] leading-relaxed text-[#64748B]">
                Heavy-duty portable BBQs and compact stoves designed for event catering and outdoor food pop-ups with tool-free assembly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OPERATORS SERVED & MANUFACTURING PHILOSOPHY */}
      <section className="border-y border-[#E2E8F0] bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-['Outfit'] text-[28px] font-bold text-[#111827] sm:text-[36px]">
                Built for demanding food service operations
              </h2>
              <p className="mt-4 font-['DM_Sans'] text-[16px] leading-relaxed text-[#475569]">
                Our equipment is designed around the real mechanical stresses of commercial culinary prep: intense heat cycles, heavy cookware weights, and continuous multi-hour shifts.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex gap-4">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#C2410C]" />
                  <div>
                    <h4 className="font-['Outfit'] text-[16px] font-bold text-[#111827]">Commercial Restaurants & Dhabas</h4>
                    <p className="font-['DM_Sans'] text-[14px] text-[#64748B]">Reliable open-fire and automated turning equipment built for rapid table turns.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#C2410C]" />
                  <div>
                    <h4 className="font-['Outfit'] text-[16px] font-bold text-[#111827]">Live-Fire & Event Caterers</h4>
                    <p className="font-['DM_Sans'] text-[14px] text-[#64748B]">Transport-ready collapsible equipment with verified structural load ratings.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#C2410C]" />
                  <div>
                    <h4 className="font-['Outfit'] text-[16px] font-bold text-[#111827]">Outdoor & Cloud Kitchens</h4>
                    <p className="font-['DM_Sans'] text-[14px] text-[#64748B]">Fuel-efficient rocket stoves and griddles engineered for consistent thermal output.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-8 lg:p-10">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 text-[#C2410C]">
                  <Wrench size={22} />
                  <span className="font-['Outfit'] text-sm font-bold uppercase tracking-wider">Manufacturing Standards</span>
                </div>
                <h3 className="font-['Outfit'] text-[24px] font-bold text-[#111827]">
                  Precision fabrication & rigorous tolerances
                </h3>
                <p className="mt-4 font-['DM_Sans'] text-[15px] leading-relaxed text-[#64748B]">
                  We utilize commercial grade stainless steel, reinforced joint welds, and thermal protection barriers to ensure every piece of equipment operates safely and reliably under high load.
                </p>
              </div>

              <div className="mt-8 border-t border-[#E2E8F0] pt-6">
                <Button
                  onClick={() => onNavigate?.('capabilities')}
                  variant="outline"
                  className="rounded-xl border-[#CBD5E1]"
                >
                  Review technical capabilities <ArrowRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CONTACT & OPERATIONS INFO */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="font-['Outfit'] text-[28px] font-bold text-[#111827] sm:text-[34px]">
                Work directly with our manufacturing team
              </h2>
              <p className="mt-3 font-['DM_Sans'] text-[16px] leading-relaxed text-[#64748B]">
                Whether you need standard catalog units or custom kitchen equipment dimensions, our sales engineers are available to review your operational requirements.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  onClick={() => onNavigate?.('contact')}
                  size="lg"
                  className="rounded-xl px-8"
                >
                  Contact sales team
                </Button>
                <Button
                  onClick={() => onNavigate?.('bulk-enquiry')}
                  variant="outline"
                  size="lg"
                  className="rounded-xl px-8 border-[#CBD5E1]"
                >
                  Submit bulk enquiry
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
                <h3 className="font-['Outfit'] text-[18px] font-bold text-[#111827]">Verified Company Details</h3>
                <div className="mt-6 space-y-4 font-['DM_Sans'] text-[14px]">
                  <div className="flex items-center gap-3 text-[#475569]">
                    <Phone size={18} className="shrink-0 text-[#C2410C]" />
                    <a href="tel:+919490701421" className="hover:text-[#111827] font-semibold">+91 94907 01421</a>
                  </div>
                  <div className="flex items-center gap-3 text-[#475569]">
                    <Mail size={18} className="shrink-0 text-[#C2410C]" />
                    <a href="mailto:info@kitchenbots.in" className="hover:text-[#111827] font-semibold">info@kitchenbots.in</a>
                  </div>
                  <div className="flex items-center gap-3 text-[#475569]">
                    <MapPin size={18} className="shrink-0 text-[#C2410C]" />
                    <span>Hyderabad, Telangana, India</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#475569]">
                    <Clock size={18} className="shrink-0 text-[#C2410C]" />
                    <span>Monday to Saturday, 9:00 AM – 6:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
