import { Phone, Mail, MessageCircle, FileText } from 'lucide-react';
import type { Page } from '../App';
import { Button } from '../components/ui/button';

interface ContactBannerProps {
  onNavigate?: (page: Page) => void;
}

export default function ContactBanner({ onNavigate }: ContactBannerProps) {
  const phone = '+91 9490701421';
  const email = 'info@kitchenbots.in';

  return (
    <section className="bg-[#F3F4F6] w-full border-y border-[#E5E7EB] z-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between min-h-[72px] py-4 md:py-0 gap-4 md:gap-0">
          
          {/* LEFT GROUP: Contact Info */}
          <div className="flex items-center gap-4 text-[#1E2329]">
            <a 
              href={`tel:${phone.replace(/\s+/g, '')}`} 
              className="flex items-center gap-2 group hover:text-[var(--kb-primary)] transition-colors"
            >
              <Phone size={18} className="text-[var(--kb-primary)]" />
              <span className="text-[18px] font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {phone}
              </span>
            </a>
            
            <span className="hidden md:block text-[#D1D5DB] text-[20px] font-light">|</span>
            
            <a 
              href={`mailto:${email}`} 
              className="hidden md:flex items-center gap-2 group hover:text-[var(--kb-primary)] transition-colors"
            >
              <Mail size={16} className="text-[var(--kb-primary)]" />
              <span className="text-[16px] font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {email}
              </span>
            </a>
          </div>

          {/* RIGHT GROUP: Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              asChild
              className="flex-1 md:flex-none bg-[#25D366] hover:bg-[#1fb355] text-white h-[44px] px-6 rounded-[6px]"
            >
              <a
                href="https://wa.me/919490701421"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} />
                WhatsApp Us
              </a>
            </Button>
            
            <Button
              onClick={() => onNavigate && onNavigate('contact')}
              variant="default"
              className="flex-1 md:flex-none h-[44px] px-6 rounded-[6px]"
            >
              <FileText size={18} />
              Get Bulk Quote
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
