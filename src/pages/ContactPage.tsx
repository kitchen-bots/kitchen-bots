import { useState, useRef } from 'react';
import { Phone, Mail, Clock, MapPin, Send, CheckCircle, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import TurnstileWidget, { type TurnstileWidgetRef } from '../components/TurnstileWidget';
import { submitEnquiry } from '../lib/api';

const CONTACT_CHANNELS = [
  {
    icon: Phone,
    title: 'Phone Consultation',
    primary: '+91 94907 01421',
    description: 'Direct sales and equipment enquiries',
    href: 'tel:+919490701421',
  },
  {
    icon: Mail,
    title: 'Email Correspondence',
    primary: 'info@kitchenbots.in',
    description: 'Technical specs, blueprints, and proposals',
    href: 'mailto:info@kitchenbots.in',
  },
  {
    icon: MapPin,
    title: 'Headquarters & Manufacturing',
    primary: 'Hyderabad, Telangana, India',
    description: 'Commercial fabrication and dispatch facility',
    href: null,
  },
  {
    icon: Clock,
    title: 'Operational Schedule',
    primary: 'Monday to Saturday, 9:00 AM - 6:00 PM',
    description: 'Indian Standard Time (IST)',
    href: null,
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    city: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setErrorMessage('Please complete the security verification.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await submitEnquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        city: formData.city.trim() || undefined,
        message: formData.message.trim(),
        items: [],
        turnstileToken: turnstileToken,
      });

      setSubmittedRef(response.reference || response.id);
      setFormData({ name: '', email: '', phone: '', company: '', city: '', message: '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to submit enquiry. Please try again.';
      setErrorMessage(message);
      setTurnstileToken('');
      turnstileRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 sm:pt-28">
      {/* Header */}
      <section className="border-b border-[#F1F5F9] bg-white pb-12 pt-8 lg:pb-16">
        <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
          <h1 className="font-['Outfit'] text-[34px] font-bold leading-tight text-[#111827] sm:text-[44px] md:text-[52px]">
            Contact our engineering & support team
          </h1>
          <p className="mt-4 max-w-2xl font-['DM_Sans'] text-[17px] leading-relaxed text-[#64748B]">
            Reach out for standard product questions, custom kitchen equipment requirements, or bulk quotation requests.
          </p>
        </div>
      </section>

      {/* Main Content: Two-column desktop layout */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1480px] px-6 lg:px-12 2xl:px-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            
            {/* Left Column: Verified contact channels */}
            <div className="space-y-4 lg:col-span-5">
              <h2 className="font-['Outfit'] text-[22px] font-bold text-[#111827]">
                Direct communication
              </h2>
              <p className="font-['DM_Sans'] text-sm text-[#64748B] mb-6">
                Our team assists commercial kitchens, caterers, and restaurant owners across India.
              </p>

              <div className="space-y-4">
                {CONTACT_CHANNELS.map((channel) => {
                  const Icon = channel.icon;
                  const cardContent = (
                    <div className="flex items-start gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:border-[#CBD5E1] hover:shadow-md">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C2410C]">
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">
                          {channel.title}
                        </span>
                        <span className="mt-0.5 block break-words font-['Outfit'] text-[16px] font-bold text-[#111827]">
                          {channel.primary}
                        </span>
                        <span className="mt-1 block font-['DM_Sans'] text-xs text-[#64748B]">
                          {channel.description}
                        </span>
                      </div>
                    </div>
                  );

                  return channel.href ? (
                    <a key={channel.title} href={channel.href} className="block focus:outline-none">
                      {cardContent}
                    </a>
                  ) : (
                    <div key={channel.title}>{cardContent}</div>
                  );
                })}
              </div>

              {/* Verified WhatsApp Card */}
              <div className="mt-6 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#166534] text-white">
                    <MessageCircle size={22} />
                  </div>
                  <div>
                    <h3 className="font-['Outfit'] text-[16px] font-bold text-[#14532D]">Fast WhatsApp support</h3>
                    <p className="font-['DM_Sans'] text-xs text-[#166534]">Quick equipment queries and catalogue photos</p>
                  </div>
                </div>
                <a
                  href="https://wa.me/919490701421"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532D]"
                >
                  <MessageCircle size={18} /> Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Right Column: Enquiry Form */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-7 sm:p-10 shadow-sm">
                <h2 className="font-['Outfit'] text-[24px] font-bold text-[#111827]">
                  Equipment enquiry form
                </h2>
                <p className="mt-1 font-['DM_Sans'] text-sm text-[#64748B] mb-8">
                  Submit your required specifications, models, or questions. Our engineering desk will respond with details.
                </p>

                {submittedRef ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#C2410C]">
                      <CheckCircle size={36} />
                    </div>
                    <h3 className="font-['Outfit'] text-2xl font-bold text-[#111827]">Enquiry received</h3>
                    <p className="mt-2 font-['Outfit'] text-base font-bold text-[#C2410C]">
                      Reference number: {submittedRef}
                    </p>
                    <p className="mx-auto mt-3 max-w-md font-['DM_Sans'] text-sm leading-relaxed text-[#64748B]">
                      Your enquiry has been logged in our system. An equipment specialist will review your requirements and reach out directly.
                    </p>
                    <Button
                      onClick={() => setSubmittedRef(null)}
                      variant="outline"
                      className="mt-6 rounded-xl border-[#CBD5E1] font-semibold"
                    >
                      Submit another enquiry
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5 font-['DM_Sans']">
                    {errorMessage && (
                      <div className="flex items-start gap-3 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-[#991B1B]">
                        <AlertCircle className="mt-0.5 shrink-0" size={18} />
                        <div className="text-sm">
                          <p className="font-semibold">Submission failed</p>
                          <p>{errorMessage}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#111827]" htmlFor="contact-name">
                          Full Name <span className="text-[#C2410C]">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#111827]" htmlFor="contact-email">
                          Email Address <span className="text-[#C2410C]">*</span>
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          placeholder="name@restaurant.com"
                          className="w-full rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#111827]" htmlFor="contact-phone">
                          Phone Number
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center rounded-l-xl border border-r-0 border-[#CBD5E1] bg-[#F8FAFC] px-3.5 text-sm font-medium text-[#64748B]">
                            +91
                          </span>
                          <input
                            id="contact-phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="9490701421"
                            className="flex-1 rounded-r-xl border border-[#CBD5E1] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#111827]" htmlFor="contact-company">
                          Company / Kitchen Name
                        </label>
                        <input
                          id="contact-company"
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          placeholder="e.g. Copper Smoke Grillhouse"
                          className="w-full rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#111827]" htmlFor="contact-city">
                        Delivery City / State
                      </label>
                      <input
                        id="contact-city"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        placeholder="e.g. Mumbai, Bengaluru, Hyderabad"
                        className="w-full rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#111827]" htmlFor="contact-message">
                        Equipment Requirements <span className="text-[#C2410C]">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        rows={4}
                        placeholder="Detail equipment types, sizes, custom fabrication needs, or delivery timelines..."
                        className="w-full rounded-xl border border-[#CBD5E1] p-4 text-sm outline-none transition-colors focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C] disabled:opacity-50 resize-y"
                      />
                    </div>

                    <div className="py-1">
                      <TurnstileWidget
                        ref={turnstileRef}
                        onVerify={(token) => {
                          setTurnstileToken(token);
                          setErrorMessage(null);
                        }}
                        onError={() => {
                          setTurnstileToken('');
                          setErrorMessage('Security verification failed. Please refresh and try again.');
                        }}
                        onExpire={() => {
                          setTurnstileToken('');
                        }}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !turnstileToken}
                      className="w-full rounded-xl py-6 text-base font-semibold bg-[#C2410C] hover:bg-[#9A3412] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting enquiry...
                        </>
                      ) : (
                        <>
                          <Send size={18} className="mr-2" /> Submit equipment enquiry
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
