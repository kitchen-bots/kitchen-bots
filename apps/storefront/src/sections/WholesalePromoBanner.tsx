import { Package, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function WholesalePromoBanner() {
  return (
    <section className="w-full h-auto min-h-[200px] overflow-hidden relative">
      {/* Background with gradient and subtle pattern */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#1A2F1A] to-[#1E3A1E]"
        style={{ 
          backgroundImage: `linear-gradient(135deg, rgba(26, 47, 26, 0.95), rgba(30, 58, 30, 0.95)), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231A7A3C' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4v-4H4v4H0v2h4v4h2v-4h4v-2H6zM36 4v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
        }}
      />

      <div className="container mx-auto px-6 h-full relative z-10 flex flex-col md:flex-row items-center py-10 md:py-0 min-h-[200px]">
        {/* Left Content (60%) */}
        <div className="w-full md:w-[60%] flex flex-col justify-center text-center md:text-left mb-8 md:mb-0">
          <span 
            className="text-[11px] font-bold text-white tracking-[0.12em] uppercase mb-2"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            WHOLESALE & BULK ORDERS
          </span>
          <h2 
            className="text-[30px] md:text-[36px] font-bold text-white mb-3 leading-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Pricing Starts at 20 Units
          </h2>
          <p 
            className="text-white/80 text-[15px] max-w-lg mb-6"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Dealers, distributors and institutions - get exclusive pricing with GST invoice on bulk orders.
          </p>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Button 
              variant="outline"
              className="px-8 h-[48px] rounded-[6px] group"
            >
              Request Bulk Quote
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Button>
            <a 
              href="tel:+919490701421" 
              className="text-white text-[13px] underline underline-offset-4 hover:text-[var(--brand-300)] transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Or call: +91 9490701421
            </a>
          </div>
        </div>

        {/* Right Visual (40%) */}
        <div className="w-full md:w-[40%] flex justify-center md:justify-end items-center opacity-20 md:opacity-100">
          <div className="relative">
            <div className="w-32 h-32 md:w-48 md:h-48 bg-[var(--brand-300)]/10 rounded-full flex items-center justify-center animate-pulse-slow">
              <Package size={80} className="text-[var(--brand-300)] md:w-[120px] md:h-[120px]" />
            </div>
            {/* Abstract geometric elements */}
            <div className="absolute -top-4 -right-4 w-12 h-12 border-2 border-[var(--brand-300)]/20 rounded-lg rotate-12"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 border-2 border-[var(--brand-300)]/10 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
