import { useState } from 'react';
import { FileText, Truck, RotateCcw, ShieldCheck, Lock } from 'lucide-react';

const tabs = [
    { id: 'shipping', label: 'Shipping Policy', icon: Truck },
    { id: 'returns', label: 'Returns & Refunds', icon: RotateCcw },
    { id: 'warranty', label: 'Warranty', icon: ShieldCheck },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: Lock },
] as const;

type TabId = typeof tabs[number]['id'];

const policies: Record<TabId, { title: string; content: string[] }> = {
    shipping: {
        title: 'Shipping Policy',
        content: [
            '## Shipping Coverage\n\nKitchenBots delivers to over 19,000 PIN codes across India through our express logistics partners. We currently deliver to all states and union territories of India.',

            '## Dispatch Timeline\n\nAll in-stock orders are dispatched within 1 business day of confirmed payment. Custom and made-to-order products have a production lead time of 4–6 weeks, which will be communicated clearly at the time of order.',

            '## Delivery Timeline\n\n**Metro Cities** (Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad): 3–5 business days.\n\n**Tier 2 Cities**: 4–7 business days.\n\n**Remote and Rural PIN Codes**: 7–10 business days.\n\nAll timelines are estimates and may be affected by logistics disruptions, weather, or public holidays.',

            '## Tracking\n\nYou will receive a dispatch confirmation email with a tracking link within 24 hours of dispatch. You can also track your order through your account on the KitchenBots website.',

            '## Shipping Charges\n\nShipping is free on all orders above ₹2,000. Orders below ₹2,000 attract a flat shipping fee of ₹149, automatically calculated at checkout.',

            '## Damaged in Transit\n\nIf your product arrives with visible transit damage:\n1. Do not accept the delivery - return to the courier immediately.\n2. Photograph all visible damage and contact us within 48 hours at info@kitchenbots.in.\n3. We will arrange a replacement shipment at no additional cost.',
        ],
    },
    returns: {
        title: 'Returns & Refund Policy',
        content: [
            '## 7-Day No-Questions Return\n\nKitchenBots offers a 7-day return window from the date of delivery. To be eligible for a return, the product must be unused, in its original condition, and in original packaging.',

            '## How to Initiate a Return\n\n1. Email info@kitchenbots.in with your order number and reason for return within 7 days of delivery.\n2. Our support team will confirm eligibility and provide a return shipping label.\n3. Pack the product securely in its original packaging.\n4. Drop off at the designated courier point or schedule a pickup.',

            '## Refund Processing\n\nOnce we receive and inspect the returned product, refunds are processed within 7 business days to the original payment method. UPI and bank transfer refunds typically appear within 3 business days. Credit card refunds may take 5–10 business days depending on your bank.',

            '## Non-Returnable Items\n\nThe following are not eligible for standard returns:\n- Products that have been used (i.e., first fire has been completed)\n- Custom or made-to-order products\n- Products damaged by misuse, incorrect assembly, or use of non-recommended fuels\n- Products purchased from third-party platforms (Amazon, Flipkart, etc.) - contact the respective platform for their own return policy.',

            '## Exchange Policy\n\nIf you received a wrong product or a product with a manufacturing defect, we will ship a replacement at no charge. Contact info@kitchenbots.in within 48 hours of delivery with photographs.',
        ],
    },
    warranty: {
        title: 'Warranty Policy',
        content: [
            '## Standard Warranty - 12 Months\n\nAll KitchenBots products carry a 12-month manufacturing defect warranty from the date of purchase. This covers:\n- Weld failures\n- Hinge pin breakage\n- Surface coating separation (on non-cooking surfaces)\n- Motor failures on Automatic BBQ models (within normal operating conditions)',

            '## Extended Structural Warranty\n\nThe following products carry an extended 10-year structural frame warranty:\n- Rocket Stove 150MM\n- Santa Maria Grill (Medium and Large)\n\nThis covers the main structural frame only, and does not include grates, cooking surfaces, or mechanical components.',

            '## Motor Warranty - Automatic BBQ\n\nThe Automatic BBQ motor assembly carries a 24-month warranty covering motor failure, gearbox malfunction, and circuit board defects under normal residential and commercial use.',

            '## What the Warranty Does Not Cover\n\n- Normal surface oxidation (rust)\n- Cosmetic wear (heat discolouration)\n- Damage caused by incorrect fuel use (petroleum-based accelerants)\n- Damage caused by incorrect assembly\n- Accidental physical damage\n- Products purchased from unauthorised resellers',

            '## Making a Warranty Claim\n\n1. Email info@kitchenbots.in with your order number, purchase date, and photographs of the defect.\n2. Our warranty team will respond within 48 hours.\n3. Where replacement is required, we aim to ship the replacement before requesting return of the defective unit.',

            '## Parts Availability Guarantee\n\nKitchenBots guarantees parts availability for a minimum of 10 years from the launch date of each product. This ensures that your grill can be serviced and maintained indefinitely rather than being discarded.',
        ],
    },
    terms: {
        title: 'Terms and Conditions',
        content: [
            '## Acceptance of Terms\n\nBy placing an order with KitchenBots, you agree to these Terms and Conditions in full. If you do not agree, please do not place an order.',

            '## Product Use\n\nKitchenBots products are designed for outdoor use only. The use of any KitchenBots grill or stove in an enclosed or indoor space is strictly prohibited and dangerous. KitchenBots accepts no liability for injury, property damage, or loss arising from indoor use of our cooking systems.',

            '## Pricing\n\nAll prices are listed in Indian Rupees (₹) inclusive of GST. Prices are subject to change without prior notice. The price at the time of order confirmation is binding.',

            '## Payment\n\nWe accept UPI (GPay, PhonePe, Paytm), net banking, major credit and debit cards, and EMI options via RazorPay and PayU. All transactions are secured by SSL encryption. KitchenBots does not store payment credentials.',

            '## Limitation of Liability\n\nTo the maximum extent permitted by Indian law, KitchenBots\'s total liability to any customer in respect of any claim arising out of a product purchase shall not exceed the price paid for the relevant product.',

            '## Governing Law\n\nThese terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana, India.',

            '## Changes to Terms\n\nKitchenBots reserves the right to modify these terms at any time. Updated terms take effect upon posting to the website. Continued use of the website constitutes acceptance of the revised terms.',
        ],
    },
    privacy: {
        title: 'Privacy Policy',
        content: [
            '## Data We Collect\n\nWhen you use the KitchenBots website or place an order, we collect: your name, email address, phone number, shipping address, and payment transaction reference. We do not collect or store full payment credentials.',

            '## How We Use Your Data\n\n- To process and fulfil your orders\n- To send order confirmations and tracking updates\n- To provide warranty and after-sales support\n- To send marketing communications (only with your explicit consent)\n- To improve our products and website (anonymised analytics data)',

            '## Data Sharing\n\nWe share your data only with:\n- Our logistics partners (name, phone, and delivery address only)\n- Our payment gateway provider (transaction data only)\n- Legal authorities if required by court order or government mandate\n\nWe do not sell, rent, or trade your personal data to third parties for marketing purposes.',

            '## Cookies\n\nThe KitchenBots website uses essential cookies for session management and preference storage, and optional analytics cookies (Google Analytics, Meta Pixel). You can opt out of analytics cookies by declining in the cookie consent banner.',

            '## Your Rights\n\nUnder the Information Technology (Amendment) Act, 2008, you have the right to:\n- Request access to the personal data we hold about you\n- Request correction of inaccurate data\n- Request deletion of your personal data\n- Withdraw consent to marketing communications at any time\n\nTo exercise any of these rights, contact info@kitchenbots.in.',

            '## Data Retention\n\nOrder and customer data is retained for 7 years for GST and accounting compliance. Marketing preference data is deleted upon unsubscription.',

            '## Contact\n\nFor privacy queries: info@kitchenbots.in',
        ],
    },
};

function PolicyContent({ items }: { items: string[] }) {
    return (
        <div className="prose prose-gray max-w-none">
            {items.map((section, index) => {
                return (
                    <div key={index} className="mb-8">
                        {section.split('\n').map((line, lineIdx) => {
                            if (line.startsWith('## ')) {
                                return <h3 key={lineIdx} className="text-xl font-bold font-['Outfit'] text-[#4A4A4A] mt-6 mb-3 first:mt-0">{line.replace('## ', '')}</h3>;
                            }
                            if (line.startsWith('**')) {
                                return <p key={lineIdx} className="text-[#4A4A4A]/90 leading-relaxed mb-3"><strong>{line.replace(/\*\*/g, '')}</strong></p>;
                            }
                            if (line.startsWith('- ')) {
                                return <li key={lineIdx} className="text-[#4A4A4A]/80 ml-4 mb-1">{line.replace('- ', '')}</li>;
                            }
                            if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                                return <li key={lineIdx} className="text-[#4A4A4A]/80 ml-4 mb-1 list-decimal">{line.replace(/^\d\. /, '')}</li>;
                            }
                            if (line.trim() === '') return <br key={lineIdx} />;
                            return <p key={lineIdx} className="text-[#4A4A4A]/80 leading-relaxed mb-3">{line}</p>;
                        })}
                    </div>
                );
            })}
        </div>
    );
}

export default function PoliciesPage() {
    const [activeTab, setActiveTab] = useState<TabId>('shipping');
    const currentPolicy = policies[activeTab];

    return (
        <section className="pt-24 sm:pt-28 bg-[#F7FAF7] min-h-screen">
            <div className="container mx-auto px-6 md:px-[80px] py-12 md:py-20">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-block text-xs font-bold tracking-[0.2em] text-kb-primary uppercase mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        LEGAL & POLICIES
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold font-['Outfit'] text-[#1E2329] mb-4">
                        Policies & Legal Info
                    </h1>
                    <p className="text-[#6B7280]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        Complete transparency for our commercial and residential partners.
                    </p>
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-[#E0EAE0] rounded-3xl p-4 sticky top-24">
                            <p className="text-xs font-bold tracking-widest text-[#1E2329]/40 uppercase px-3 mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>Documents</p>
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm font-bold transition-all duration-200 mb-1 font-['Outfit'] ${activeTab === tab.id
                                                ? 'bg-[#1E2329] text-white shadow-lg'
                                                : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white border border-[#E0EAE0] rounded-3xl p-8 md:p-12">
                            <h2 className="text-2xl font-bold font-['Outfit'] text-[#4A4A4A] mb-2">
                                {currentPolicy.title}
                            </h2>
                            <p className="text-xs text-[#4A4A4A]/40 mb-8">Last updated: March 2025</p>
                            <PolicyContent items={currentPolicy.content} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
