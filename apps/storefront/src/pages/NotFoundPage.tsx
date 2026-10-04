import { type Page } from '../App';
import { ArrowRight, Home, Search } from 'lucide-react';
import { Button } from '../components/ui/button';

interface NotFoundPageProps {
  onNavigate?: (page: Page) => void;
}

export default function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="min-h-[80vh] bg-[#F8FAFC] flex items-center justify-center py-24 px-6">
      <div className="mx-auto max-w-[640px] text-center">
        <div className="inline-flex items-center gap-2 rounded-xl bg-[#FFF7ED] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#C2410C] border border-[#FED7AA] mb-6">
          <span>Error 404</span>
          <span>•</span>
          <span>Page Not Found</span>
        </div>

        <h1 className="font-['Outfit'] text-[36px] sm:text-[48px] font-bold leading-tight text-[#0F172A]">
          We couldn't find the page you're looking for.
        </h1>

        <p className="mt-4 font-['DM_Sans'] text-base sm:text-lg leading-relaxed text-[#64748B]">
          The link you followed may be broken, or the page may have been moved or removed. Explore our heavy-duty commercial BBQ grills, rocket stoves, and kitchen equipment catalog.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Button
            size="lg"
            className="rounded-xl px-6 font-bold bg-[#C2410C] hover:bg-[#9A3412]"
            onClick={() => onNavigate?.('products')}
          >
            <Search size={18} className="mr-2" /> Browse products catalog
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="rounded-xl px-6 border-[#CBD5E1] bg-white font-bold text-[#0F172A] hover:bg-[#F8FAFC]"
            onClick={() => onNavigate?.('home')}
          >
            <Home size={18} className="mr-2" /> Return to home
          </Button>
        </div>

        <div className="mt-12 rounded-2xl border border-[#E2E8F0] bg-white p-6 text-left shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] font-['Outfit'] mb-3">Popular destinations</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-['DM_Sans']">
            <button
              onClick={() => onNavigate?.('products')}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8FAFC] text-[#334155] hover:text-[#C2410C] transition-colors text-left"
            >
              <span>Commercial BBQ Grills</span>
              <ArrowRight size={14} className="text-[#94A3B8]" />
            </button>
            <button
              onClick={() => onNavigate?.('capabilities')}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8FAFC] text-[#334155] hover:text-[#C2410C] transition-colors text-left"
            >
              <span>Manufacturing Capabilities</span>
              <ArrowRight size={14} className="text-[#94A3B8]" />
            </button>
            <button
              onClick={() => onNavigate?.('about')}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8FAFC] text-[#334155] hover:text-[#C2410C] transition-colors text-left"
            >
              <span>About KitchenBots</span>
              <ArrowRight size={14} className="text-[#94A3B8]" />
            </button>
            <button
              onClick={() => onNavigate?.('contact')}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F8FAFC] text-[#334155] hover:text-[#C2410C] transition-colors text-left"
            >
              <span>Contact Engineering Team</span>
              <ArrowRight size={14} className="text-[#94A3B8]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
