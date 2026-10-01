import { ShieldCheck, Truck, Award, HeadphonesIcon } from 'lucide-react';

export default function TrustBadgeBar() {
  const badges = [
    {
      icon: <ShieldCheck className="w-[28px] h-[28px]" style={{ color: 'var(--kb-dark-green)' }} />,
      label: 'GST Invoice Provided',
      sublabel: 'On every order',
    },
    {
      icon: <Truck className="w-[28px] h-[28px]" style={{ color: 'var(--kb-dark-green)' }} />,
      label: 'Pan India Delivery',
      sublabel: 'All 28 states',
    },
    {
      icon: <Award className="w-[28px] h-[28px]" style={{ color: 'var(--kb-dark-green)' }} />,
      label: '1 Year Warranty',
      sublabel: 'All products',
    },
    {
      icon: <HeadphonesIcon className="w-[28px] h-[28px]" style={{ color: 'var(--kb-dark-green)' }} />,
      label: 'Mon–Sat Support',
      sublabel: '9AM–5PM',
    },
  ];

  return (
    <div className="w-full bg-[#FFFFFF] border-y border-[#E5E7EB]">
      <div className="container mx-auto px-4">
        {/* Desktop Layout: 4 items in a row with dividers */}
        <div className="hidden md:flex items-center justify-between h-[84px] py-[20px]">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center flex-1 justify-center relative">
              <div className="flex items-center gap-4">
                {badge.icon}
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[#1E2329] text-[13px] leading-tight" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {badge.label}
                  </span>
                  <span className="text-[#6B7280] text-[11px] leading-tight mt-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {badge.sublabel}
                  </span>
                </div>
              </div>
              {/* Vertical divider aligned right, except for last item */}
              {index < badges.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-[40px] bg-[#E5E7EB]"></div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Layout: Horizontal scrollable badges */}
        <div className="md:hidden py-[16px] overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center gap-8 min-w-max px-2">
            {badges.map((badge, index) => (
              <div key={index} className="flex items-center gap-3 shrink-0">
                <div className="w-[40px] h-[40px] rounded-full bg-[var(--brand-50)] flex items-center justify-center shrink-0">
                  {badge.icon}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[#1E2329] text-[13px] leading-tight" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {badge.label}
                  </span>
                  <span className="text-[#6B7280] text-[10px] leading-tight mt-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {badge.sublabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
