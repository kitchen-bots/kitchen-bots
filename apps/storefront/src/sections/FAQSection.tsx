import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const CATEGORIES = [
  "All Questions",
  "Assembly & Setup",
  "Fast & Cooking",
  "Cleaning & Care",
  "Delivery & Shipping",
  "Warranty & Returns",
  "Orders & Wholesale"
];

const FAQS: FAQItem[] = [
  {
    category: "Assembly & Setup",
    question: "How long does it take to assemble the BBQ Grill?",
    answer: "Most of our standard commercial BBQ grills come 90% pre-assembled. Final setup typically takes 15-20 minutes and requires only basic tools which are included in the package."
  },
  {
    category: "Assembly & Setup",
    question: "Do I need a professional technician for installation?",
    answer: "For standalone units like rocket stoves and portable grills, no professional help is needed. For large-scale multi-unit commercial kitchen installations, we recommend using our certified installation partners to ensure proper ventilation and safety compliance."
  },
  {
    category: "Fast & Cooking",
    question: "How fast does the Rocket Stove heat up?",
    answer: "Thanks to our patented insulated combustion chamber, the KitchenBots Rocket Stove reaching cooking temperatures in under 2 minutes using 40% less fuel than traditional wood stoves."
  },
  {
    category: "Fast & Cooking",
    question: "Can I use both charcoal and wood in the BBQ grills?",
    answer: "Yes, our heavy-duty steel grills are engineered to handle both charcoal and firewood. The high-grade stainless steel interior prevents warping even under intense dual-fuel heat."
  },
  {
    category: "Cleaning & Care",
    question: "How do I clean the stainless steel surfaces?",
    answer: "Use warm soapy water and a soft cloth for regular cleaning. For tough grease, a commercial-grade stainless steel cleaner or a mixture of vinegar and baking soda works best. Avoid using steel wool as it can scratch the finish."
  },
  {
    category: "Cleaning & Care",
    question: "Is the equipment rust-proof for outdoor use?",
    answer: "We use high-grade 304 stainless steel and weather-resistant powder coating. While highly resistant to rust, we recommend using a protective cover when the equipment is not in use for extended periods, especially during monsoon season."
  },
  {
    category: "Delivery & Shipping",
    question: "How is the equipment packaged for shipping?",
    answer: "All industrial units are shipped in high-impact wooden crates with internal shock-absorbing foam. This ensures your equipment arrives in perfect condition even during long-distance transit across India."
  },
  {
    category: "Delivery & Shipping",
    question: "What are the shipping charges for bulk orders?",
    answer: "Shipping is FREE for orders above ₹10,000. For bulk wholesale orders (20+ units), we provide discounted freight rates through our dedicated logistics partners."
  },
  {
    category: "Warranty & Returns",
    question: "What does the 12-month warranty cover?",
    answer: "The warranty covers all manufacturing defects and structural failures under normal operating conditions. It includes repair or replacement of defective parts. Consumable items like grill grates have a 6-month limited wear warranty."
  },
  {
    category: "Warranty & Returns",
    question: "Can I return the product if I'm not satisfied?",
    answer: "We offer a 7-day inspection period for unused equipment. If the product doesn't meet your business requirements, you can return it in its original packaging for a full refund (minus return shipping costs)."
  },
  {
    category: "Orders & Wholesale",
    question: "How do I place a wholesale order?",
    answer: "Wholesale pricing kicks in at 20 units. You can click the 'Get Bulk Quote' button or contact our sales team directly at +91 9490701421 to receive a customized proforma invoice."
  },
  {
    category: "Orders & Wholesale",
    question: "Do you provide GST invoices for input tax credit?",
    answer: "Yes, we are a GST-registered company. A valid tax invoice with your business GSTIN will be provided with every order, allowing you to claim full input tax credit."
  },
  {
    category: "Cleaning & Care",
    question: "How often should I deep clean my commercial grill?",
    answer: "For high-volume commercial use, we recommend a daily wipe-down and a thorough deep clean once a week to maintain optimal hygiene and equipment longevity."
  },
  {
    category: "Fast & Cooking",
    question: "What is the maximum temperature the BBQ grill can reach?",
    answer: "Our heavy-duty commercial grills can reach sustained temperatures of up to 450°C (842°F), perfect for high-speed searing and traditional tandoor-style cooking."
  },
  {
    category: "Assembly & Setup",
    question: "Is the height of the grills adjustable?",
    answer: "Yes, our 'Pro' series grills feature adjustable leg levels to ensure stability on uneven surfaces and high-low grate positioning for temperature control."
  }
];

export default function FAQSection() {
  const [activeTab, setActiveTab] = useState("All Questions");
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default
  const [showAll, setShowAll] = useState(false);

  const filteredFaqs = useMemo(() => {
    if (activeTab === "All Questions") return FAQS;
    return FAQS.filter(faq => faq.category === activeTab);
  }, [activeTab]);

  const visibleFaqs = useMemo(() => {
    return showAll ? filteredFaqs : filteredFaqs.slice(0, 6);
  }, [filteredFaqs, showAll]);

  const handleTabChange = (cat: string) => {
    setActiveTab(cat);
    setOpenIndex(0);
    setShowAll(false);
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="max-w-[760px] mx-auto text-center mb-16">
          <span 
            className="inline-block text-[11px] font-bold tracking-[0.15em] text-[var(--kb-primary)] uppercase mb-4"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            COMMON QUESTIONS
          </span>
          <h2 
            className="text-[36px] md:text-[42px] font-bold text-[#1E2329] mb-6 leading-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Everything You Need to Know
          </h2>
          <p 
            className="text-[#6B7280] text-[16px] md:text-[18px] leading-[1.6]"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            From first-time buyers to wholesale customers - answers to what we hear most.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="max-w-5xl mx-auto mb-10 overflow-hidden">
          <div className="flex border-b border-[#E5E7EB] overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant="ghost"
                onClick={() => handleTabChange(cat)}
                className={`h-auto px-6 py-4 text-[14px] transition-all duration-300 border-b-2 rounded-none outline-none bg-transparent hover:bg-transparent ${
                  activeTab === cat 
                    ? 'border-[var(--kb-primary)] text-[#1E2329] font-semibold' 
                    : 'border-transparent text-[#6B7280] hover:text-[var(--kb-primary)]'
                }`}
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        <div className="max-w-4xl mx-auto mb-12">
          {visibleFaqs.length > 0 ? (
            <div className="divide-y divide-[#E5E7EB]">
              {visibleFaqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div key={idx} className="group">
                    <Button
                      variant="ghost"
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full h-auto text-left py-6 flex items-center justify-between gap-6 transition-all bg-transparent hover:bg-transparent rounded-none px-0"
                    >
                      <span 
                        className={`text-[16px] md:text-[17px] font-medium transition-colors duration-300 ${
                          isOpen ? 'text-[var(--kb-primary)]' : 'text-[#1E2329] group-hover:text-[var(--kb-primary)]'
                        }`}
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {faq.question}
                      </span>
                      <ChevronDown 
                        size={20} 
                        className={`text-gray-400 transform transition-transform duration-300 ease-in-out ${
                          isOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </Button>
                    
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-[500px] pb-6' : 'max-h-0'
                      }`}
                    >
                      <p 
                        className="text-[15px] md:text-[16px] text-[#6B7280] leading-[1.6]"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No questions found in this category.
            </div>
          )}
        </div>

        {/* Show More Button */}
        {filteredFaqs.length > 6 && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 border-[var(--kb-primary)] text-[var(--kb-primary)] hover:bg-[var(--kb-primary)] hover:text-white"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {showAll ? (
                <>Show less <span className="transform rotate-180">▾</span></>
              ) : (
                <>Show all {filteredFaqs.length} questions ▾</>
              )}
            </Button>
          </div>
        )}

      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
