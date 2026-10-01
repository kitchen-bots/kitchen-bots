import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';

export default function ContactSection() {
  const contactInfo = [
    {
      icon: MapPin,
      label: 'Visit Our Facility',
      value: 'Madhapur, Hyderabad, Telangana, India',
      sub: 'Manufacturing & Workshop',
    },
    {
      icon: Phone,
      label: 'Call Sales Representative',
      value: '+91 94907 01421',
      sub: 'Mon–Sat, 9AM–6PM',
    },
    {
      icon: Mail,
      label: 'Send an Enquiry',
      value: 'info@kitchenbots.in',
      sub: 'Response within 24 hours',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp Business',
      value: '+91 94907 01421',
      sub: 'Instant Support Available',
    },
  ];

  return (
    <section className="py-[80px] bg-[#FAFAFA]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Contact Header */}
          <div>
            <span 
              className="inline-block text-[11px] font-bold tracking-[0.1em] text-[var(--kb-primary)] uppercase mb-4"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              GET IN TOUCH
            </span>
            <h2 
              className="text-[36px] font-bold text-[#1E2329] mb-6 leading-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Ready to Gear Up Your Kitchen?
            </h2>
            <p 
              className="text-[#6B7280] text-[16px] leading-[1.6] mb-8 max-w-lg"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Whether you need a single rocket stove for your backyard or a complete commercial grill setup for a restaurant chain, we're here to help. Contact us for bulk pricing and custom dimensions.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://wa.me/919490701421"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#25D366] text-white font-bold rounded-[6px] transition-all hover:bg-[#1fb355] text-[15px]"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <MessageCircle size={20} />
                WhatsApp Now
              </a>
              <a
                href="mailto:info@kitchenbots.in"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border border-[#E5E7EB] text-[#1E2329] font-bold rounded-[6px] transition-all hover:bg-gray-50 text-[15px]"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <Mail size={20} />
                Send Email
              </a>
            </div>
          </div>

          {/* Right: Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contactInfo.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="p-6 bg-white border border-[#E5E7EB] rounded-[12px] shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-[40px] h-[40px] rounded-[8px] bg-[var(--brand-50)] flex items-center justify-center mb-4">
                    <Icon size={20} className="text-[var(--kb-primary)]" />
                  </div>
                  <h4 
                    className="text-[13px] font-bold text-[var(--kb-primary)] uppercase tracking-wider mb-1"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {item.label}
                  </h4>
                  <p 
                    className="text-[16px] font-bold text-[#1E2329] mb-1"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {item.value}
                  </p>
                  <p 
                    className="text-[13px] text-[#6B7280]"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {item.sub}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
