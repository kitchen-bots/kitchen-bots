import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import type { Page } from '../App';

interface FooterProps {
  onNavigate?: (page: Page) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#1E293B] bg-[#0F172A] text-white font-['DM_Sans']">
      <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16 py-14 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          
          {/* Brand & Overview */}
          <div className="lg:col-span-3">
            <button
              onClick={() => onNavigate?.('home')}
              className="mb-6 inline-block text-left focus:outline-none group"
              aria-label="KitchenBots home"
            >
              <div className="inline-flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.02]">
                <img
                  src="/images/kitchenbots-logo-white.svg?v=2"
                  alt="KitchenBots"
                  className="h-8 md:h-9 w-auto object-contain"
                />
              </div>
            </button>
            <p className="max-w-sm text-sm leading-relaxed text-[#94A3B8]">
              Heavy-duty grills, rocket stoves, and outdoor cooking hardware engineered for backyard pitmasters, home chefs, and commercial foodservice operations.
            </p>
            <div className="mt-6">
              <a
                href="https://wa.me/919490701421"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#166534] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#14532D]"
              >
                <MessageCircle size={16} /> WhatsApp Sales Support
              </a>
            </div>
          </div>

          {/* Equipment Navigation */}
          <div className="lg:col-span-3">
            <h3 className="font-['Outfit'] text-sm font-bold uppercase tracking-wider text-white">
              Equipment Categories
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#94A3B8]">
              <li>
                <button
                  onClick={() => onNavigate?.('products')}
                  className="hover:text-white transition-colors"
                >
                  Santa Maria Grills
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('products')}
                  className="hover:text-white transition-colors"
                >
                  Rocket Stoves
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('products')}
                  className="hover:text-white transition-colors"
                >
                  Collapsible BBQ Units
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('products')}
                  className="hover:text-white transition-colors"
                >
                  Automatic BBQ Rotisseries
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('bulk-enquiry')}
                  className="hover:text-white transition-colors"
                >
                  Bulk Equipment Quotations
                </button>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="lg:col-span-3">
            <h3 className="font-['Outfit'] text-sm font-bold uppercase tracking-wider text-white">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#94A3B8]">
              <li>
                <button
                  onClick={() => onNavigate?.('about')}
                  className="hover:text-white transition-colors"
                >
                  About KitchenBots
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('capabilities')}
                  className="hover:text-white transition-colors"
                >
                  Engineering Capabilities
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('blog')}
                  className="hover:text-white transition-colors"
                >
                  Technical Articles
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact Desk
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('policies')}
                  className="hover:text-white transition-colors"
                >
                  Policies & Terms
                </button>
              </li>
            </ul>
          </div>

          {/* Verified Contact Details */}
          <div className="lg:col-span-3">
            <h3 className="font-['Outfit'] text-sm font-bold uppercase tracking-wider text-white">
              Verified Operations
            </h3>
            <div className="mt-4 space-y-3.5 text-sm text-[#94A3B8]">
              <div className="flex items-start gap-3">
                <Phone size={17} className="mt-0.5 shrink-0 text-[#C2410C]" />
                <a href="tel:+919490701421" className="hover:text-white font-medium text-white">
                  +91 94907 01421
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={17} className="mt-0.5 shrink-0 text-[#C2410C]" />
                <a href="mailto:info@kitchenbots.in" className="hover:text-white break-all font-medium text-white">
                  info@kitchenbots.in
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={17} className="mt-0.5 shrink-0 text-[#C2410C]" />
                <span>Hyderabad, Telangana, India</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-[#1E293B] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <p>© {currentYear} KitchenBots. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate?.('policies')}
              className="hover:text-[#94A3B8] transition-colors"
            >
              Privacy & Warranty Terms
            </button>
            <button
              onClick={() => onNavigate?.('contact')}
              className="hover:text-[#94A3B8] transition-colors"
            >
              Support
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
