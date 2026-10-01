import { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, ChevronDown } from 'lucide-react';
import type { Page } from '../App';

interface FooterProps {
  onNavigate?: (page: Page) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <footer className="border-t border-[#1E293B] bg-[#0F172A] text-white font-['DM_Sans']">
      <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1480px] px-5 sm:px-6 lg:px-12 2xl:px-16 py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-8 lg:grid-cols-12 lg:gap-10">
          
          {/* Brand & Overview */}
          <div className="pb-3 md:pb-0 lg:col-span-3">
            <button
              onClick={() => onNavigate?.('home')}
              className="mb-3 md:mb-6 inline-block text-left focus:outline-none group"
              aria-label="KitchenBots home"
            >
              <div className="inline-flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.02]">
                <img
                  src="/images/kitchenbots-logo-white.svg?v=2"
                  alt="KitchenBots"
                  className="h-7 md:h-9 w-auto object-contain"
                />
              </div>
            </button>
            <p className="max-w-sm text-xs md:text-sm leading-relaxed text-[#94A3B8]">
              Heavy-duty grills, rocket stoves, and outdoor cooking hardware engineered for backyard pitmasters, home chefs, and commercial foodservice operations.
            </p>
            <div className="mt-4 md:mt-6">
              <a
                href="https://wa.me/919490701421"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#166534] px-3.5 py-1.5 md:px-4 md:py-2 text-xs font-bold text-white transition-colors hover:bg-[#14532D]"
              >
                <MessageCircle size={15} /> WhatsApp Sales Support
              </a>
            </div>
          </div>

          {/* Equipment Navigation */}
          <div className="border-t border-[#1E293B] pt-3.5 md:border-t-0 md:pt-0 lg:col-span-3">
            {/* Mobile accordion toggle */}
            <button
              type="button"
              onClick={() => toggleSection('equipment')}
              className="flex w-full items-center justify-between text-left md:hidden py-1"
              aria-expanded={!!openSections.equipment}
            >
              <span className="font-['Outfit'] text-xs font-bold uppercase tracking-wider text-white">
                Equipment Categories
              </span>
              <ChevronDown
                size={16}
                className={`text-[#94A3B8] transition-transform duration-200 ${
                  openSections.equipment ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Desktop static heading */}
            <h3 className="hidden font-['Outfit'] text-sm font-bold uppercase tracking-wider text-white md:block">
              Equipment Categories
            </h3>

            {/* Links list */}
            <div
              className={`overflow-hidden transition-all duration-300 md:block md:max-h-none md:opacity-100 ${
                openSections.equipment ? 'max-h-80 opacity-100 pt-2.5 pb-2' : 'max-h-0 opacity-0 md:pt-4 md:pb-0'
              }`}
            >
              <ul className="space-y-2 md:space-y-2.5 text-xs md:text-sm text-[#94A3B8]">
                <li>
                  <button
                    onClick={() => onNavigate?.('products')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Santa Maria Grills
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('products')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Rocket Stoves
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('products')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Collapsible BBQ Units
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('products')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Automatic BBQ Rotisseries
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('bulk-enquiry')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Bulk Equipment Quotations
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Company & Support */}
          <div className="border-t border-[#1E293B] pt-3.5 md:border-t-0 md:pt-0 lg:col-span-3">
            {/* Mobile accordion toggle */}
            <button
              type="button"
              onClick={() => toggleSection('company')}
              className="flex w-full items-center justify-between text-left md:hidden py-1"
              aria-expanded={!!openSections.company}
            >
              <span className="font-['Outfit'] text-xs font-bold uppercase tracking-wider text-white">
                Company
              </span>
              <ChevronDown
                size={16}
                className={`text-[#94A3B8] transition-transform duration-200 ${
                  openSections.company ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Desktop static heading */}
            <h3 className="hidden font-['Outfit'] text-sm font-bold uppercase tracking-wider text-white md:block">
              Company
            </h3>

            {/* Links list */}
            <div
              className={`overflow-hidden transition-all duration-300 md:block md:max-h-none md:opacity-100 ${
                openSections.company ? 'max-h-80 opacity-100 pt-2.5 pb-2' : 'max-h-0 opacity-0 md:pt-4 md:pb-0'
              }`}
            >
              <ul className="space-y-2 md:space-y-2.5 text-xs md:text-sm text-[#94A3B8]">
                <li>
                  <button
                    onClick={() => onNavigate?.('about')}
                    className="hover:text-white transition-colors text-left"
                  >
                    About KitchenBots
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('capabilities')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Engineering Capabilities
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('blog')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Technical Articles
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('contact')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Contact Desk
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.('policies')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Policies & Terms
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Verified Contact Details */}
          <div className="border-t border-[#1E293B] pt-3.5 md:border-t-0 md:pt-0 lg:col-span-3">
            {/* Mobile accordion toggle */}
            <button
              type="button"
              onClick={() => toggleSection('operations')}
              className="flex w-full items-center justify-between text-left md:hidden py-1"
              aria-expanded={!!openSections.operations}
            >
              <span className="font-['Outfit'] text-xs font-bold uppercase tracking-wider text-white">
                Verified Operations
              </span>
              <ChevronDown
                size={16}
                className={`text-[#94A3B8] transition-transform duration-200 ${
                  openSections.operations ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Desktop static heading */}
            <h3 className="hidden font-['Outfit'] text-sm font-bold uppercase tracking-wider text-white md:block">
              Verified Operations
            </h3>

            {/* Contact details */}
            <div
              className={`overflow-hidden transition-all duration-300 md:block md:max-h-none md:opacity-100 ${
                openSections.operations ? 'max-h-80 opacity-100 pt-2.5 pb-2' : 'max-h-0 opacity-0 md:pt-4 md:pb-0'
              }`}
            >
              <div className="space-y-2.5 md:space-y-3.5 text-xs md:text-sm text-[#94A3B8]">
                <div className="flex items-start gap-2.5 md:gap-3">
                  <Phone size={15} className="mt-0.5 shrink-0 text-[#C2410C]" />
                  <a href="tel:+919490701421" className="hover:text-white font-medium text-white">
                    +91 94907 01421
                  </a>
                </div>
                <div className="flex items-start gap-2.5 md:gap-3">
                  <Mail size={15} className="mt-0.5 shrink-0 text-[#C2410C]" />
                  <a href="mailto:info@kitchenbots.in" className="hover:text-white break-all font-medium text-white">
                    info@kitchenbots.in
                  </a>
                </div>
                <div className="flex items-start gap-2.5 md:gap-3">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[#C2410C]" />
                  <span>Hyderabad, Telangana, India</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-[#1E293B] pt-4 md:mt-12 md:pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-[#64748B]">
          <p>© {currentYear} KitchenBots. All rights reserved.</p>
          <div className="flex items-center gap-5 sm:gap-6">
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
