import { Settings, Receipt, Truck, Headset } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { Page } from '../App';

interface KeyFeaturesSectionProps {
  onNavigate?: (page: Page) => void;
}

export default function KeyFeaturesSection({ onNavigate }: KeyFeaturesSectionProps) {
  const featureCards = [
    {
      icon: Settings,
      title: 'Made in Hyderabad',
      sub: 'All products fabricated at our own facility in Hyderabad',
    },
    {
      icon: Receipt,
      title: 'GST Invoice on Every Order',
      sub: 'Registered under GST. 18% GST applied. Invoice for every sale.',
    },
    {
      icon: Truck,
      title: 'Pan India Delivery',
      sub: 'Shipped via Delhivery and trusted partners across all 28 states',
    },
    {
      icon: Headset,
      title: 'Direct Business Support',
      sub: 'Call or WhatsApp us Mon–Sat, 9AM–5PM on +91 9490701421',
    },
  ];

  const categoryChips = [
    { label: 'BBQ Grills', id: 'bbq-grills' },
    { label: 'Rocket Stoves', id: 'rocket-stoves' },
    { label: 'Food Processing', id: 'food-processing' },
    { label: 'Custom Solutions', id: 'custom' },
  ];

  return (
    <section className="bg-white py-[80px]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          
          {/* LEFT COLUMN (45%) */}
          <div className="w-full lg:w-[45%]">
            <span 
              className="inline-block text-[11px] font-bold tracking-[0.1em] text-[var(--kb-primary)] uppercase mb-4"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              WHY KITCHENBOTS
            </span>
            <h2 
              className="text-[36px] font-bold text-[#1E2329] leading-tight mb-6"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Why Choose KitchenBots?
            </h2>
            <p 
              className="text-[16px] leading-[1.6] text-[#6B7280] mb-8"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              We manufacture commercial kitchen equipment built for real Indian business conditions. 
              From street food stalls to hotel kitchens - our products are steel-built, 
              GST-ready, and backed by real human support.
            </p>

            {/* Category Chips */}
            <div className="flex flex-wrap gap-2">
              {categoryChips.map((chip) => (
                <Button
                  key={chip.id}
                  variant="outline"
                  onClick={() => onNavigate && onNavigate('products')}
                  className="h-auto px-[14px] py-[6px] border-[var(--kb-primary)] text-[var(--kb-primary)] bg-transparent rounded-full text-[13px] font-medium transition-all duration-200 hover:bg-[var(--kb-primary)] hover:text-white"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {chip.label} →
                </Button>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN (55%) */}
          <div className="w-full lg:w-[55%]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {featureCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className="p-6 bg-white border border-[#E5E7EB] rounded-[12px] flex flex-col items-start text-left shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="w-[48px] h-[48px] rounded-[10px] bg-[var(--brand-50)] flex items-center justify-center mb-5">
                      <Icon size={24} className="text-[var(--kb-primary)]" />
                    </div>
                    <h3 
                      className="text-[18px] font-bold text-[#1E2329] mb-2"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {card.title}
                    </h3>
                    <p 
                      className="text-[14px] text-[#6B7280] leading-relaxed"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {card.sub}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
