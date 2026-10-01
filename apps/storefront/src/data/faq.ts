/** FAQs for KitchenBots ecommerce website */

export interface FAQ {
    question: string;
    answer: string;
    category: 'assembly' | 'fuel' | 'cleaning' | 'delivery' | 'warranty' | 'ordering';
}

export const FAQ_CATEGORIES = [
    { id: 'all', label: 'All Questions' },
    { id: 'assembly', label: 'Assembly & Setup' },
    { id: 'fuel', label: 'Fuel & Cooking' },
    { id: 'cleaning', label: 'Cleaning & Care' },
    { id: 'delivery', label: 'Delivery & Shipping' },
    { id: 'warranty', label: 'Warranty & Returns' },
    { id: 'ordering', label: 'Orders & Wholesale' },
] as const;

export const FAQS: FAQ[] = [
    // ASSEMBLY
    {
        category: 'assembly',
        question: 'How long does it take to set up a KitchenBots grill?',
        answer:
            'Most of our collapsible and suitcase models set up in under 60 seconds with no tools required. The interlocking panel system creates a rigid structure instantly. Our Rocket Stoves require only placing the grate on top of the stove body - about 10 seconds. The Santa Maria and Automatic BBQ require a one-time 15–20 minute setup using the included wrench and hardware.',
    },
    {
        category: 'assembly',
        question: 'Do KitchenBots grills come pre-assembled?',
        answer:
            'Our Collapsible BBQ and Suitcase BBQ models come 100% pre-assembled - you simply unfold and begin cooking. The Santa Maria Grill and Automatic BBQ require a one-time assembly of the base frame, which takes approximately 20–30 minutes using the included hardware kit and illustrated manual.',
    },
    {
        category: 'assembly',
        question: 'Are spare parts available if I need to replace something?',
        answer:
            'Yes. KitchenBots is built on the principle of repairability. Spare grates, hinge pins, cooking grate sections, and motor components for the Automatic BBQ are available to order directly through our website or through our wholesale partners. We aim to keep every component available for a minimum of 10 years after product launch.',
    },
    {
        category: 'assembly',
        question: 'Can I use KitchenBots grill in small spaces or on a balcony?',
        answer:
            'Yes - our Suitcase BBQ Compact and single-burner Rocket Stoves are specifically designed for balcony use. However, always ensure adequate ventilation and keep a minimum clearance of 60cm from walls, railings, and overhead structures. Never use any charcoal grill in an enclosed or indoor space.',
    },

    // FUEL
    {
        category: 'fuel',
        question: 'What fuel can I use in a KitchenBots grill?',
        answer:
            'Our BBQ grills are designed for natural lump charcoal and charcoal briquettes. The Rocket Stoves are optimised for small-diameter wood pieces (hardwood preferred) and dry biomass. We do not recommend using petroleum-based fire starters - use natural coconut shell fire starters instead. Never use accelerants.',
    },
    {
        category: 'fuel',
        question: 'How much charcoal do I need for a typical cook?',
        answer:
            'For a standard 2-hour cook at medium heat (around 200–250°C), our collapsible BBQs use approximately 1–1.5kg of natural lump charcoal. The Rocket Stoves use even less - approximately 300–500g of dry hardwood per hour. Using a chimney starter reduces lighting time and overall charcoal consumption by up to 30%.',
    },
    {
        category: 'fuel',
        question: 'How hot can KitchenBots grills get?',
        answer:
            'Our BBQ grills can reach grate-level temperatures of 250°C–400°C depending on charcoal quantity and airflow. The Rocket Stoves generate combustion chamber temperatures up to 1100°C. The Santa Maria Grill, with a full wood fire, can sustain open-fire temperatures above 500°C at the fuel level, with grate temperatures controlled via the elevation wheel.',
    },
    {
        category: 'fuel',
        question: 'Can I use wood instead of charcoal in a BBQ grill?',
        answer:
            'You can use small hardwood logs or wood chunks in our BBQ grills for additional flavour. However, for sustained high-heat cooking, natural lump charcoal is recommended. Wood produces more smoke and ash, which can require more frequent airflow management. Our Santa Maria Grill is specifically designed for full log fires.',
    },

    // CLEANING
    {
        category: 'cleaning',
        question: 'How do I clean a KitchenBots grill after use?',
        answer:
            'Allow the grill to cool completely before cleaning. Remove the cooking grate and brush off food residue with a stiff steel bristle brush. Wipe the interior surfaces with a dry cloth to remove ash. For stubborn residue, use a solution of hot water and mild dish soap on the cooking grate only - never on the main body, as this can break down the heat coating. Allow all parts to air dry completely before storage.',
    },
    {
        category: 'cleaning',
        question: 'Can I put the grill grates in a dishwasher?',
        answer:
            'We recommend hand washing all cooking grates with hot soapy water and a steel brush. Dishwashers can cause accelerated rusting of the mild steel grate wires. After washing, dry the grate immediately and apply a light coat of cooking oil before storage to prevent surface oxidation.',
    },
    {
        category: 'cleaning',
        question: 'My grill has developed surface rust. What should I do?',
        answer:
            'Surface oxidation on mild steel is normal and does not affect performance. Remove rust with a wire brush or steel wool, then season the surface by applying a thin layer of cooking oil and heating the grill to 200°C for 15 minutes. This creates a protective oxide layer. For stainless steel components (Santa Maria, Automatic BBQ), use a stainless steel cleaner and a microfibre cloth - avoid steel wool, which can scratch.',
    },
    {
        category: 'cleaning',
        question: 'How should I store my KitchenBots grill?',
        answer:
            'Store your grill in a cool, dry location - ideally indoors or under an outdoor cover. Before storage, ensure the grill is completely ash-free and the grate is lightly oiled. Our collapsible and suitcase models come with a carry bag or protective sleeve. Extended outdoor storage without a cover can lead to surface oxidation, particularly in coastal or high-humidity regions.',
    },

    // DELIVERY
    {
        category: 'delivery',
        question: 'How long does delivery take?',
        answer:
            'We deliver across India through our express logistics network. Typical timelines: Metro cities (Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata) - 3–5 business days. Tier 2 cities - 4–7 business days. Remote and rural locations - 7–10 business days. You will receive a tracking link within 24 hours of dispatch.',
    },
    {
        category: 'delivery',
        question: 'Do you deliver to my PIN code?',
        answer:
            'We deliver to over 19,000 PIN codes across India. To confirm delivery availability at your location, enter your PIN code during checkout. If we are unable to deliver directly, we will suggest the nearest authorised pickup point or dealer.',
    },
    {
        category: 'delivery',
        question: 'How are grills packaged for delivery?',
        answer:
            'All KitchenBots products are double-boxed in heavy-duty corrugated packaging with foam corner protection. Fragile components are individually wrapped. The Santa Maria Grill and Automatic BBQ are shipped in reinforced wooden crates for maximum transit protection. All packaging is recyclable.',
    },
    {
        category: 'delivery',
        question: 'What happens if my product arrives damaged?',
        answer:
            'If your product arrives with visible transit damage, do not sign for the delivery - return it to the courier immediately and contact us within 24 hours at support@kitchenbots.in. If damage is discovered after opening, photograph the damage and contact us within 48 hours of receipt. We will arrange a replacement shipment at no charge.',
    },

    // WARRANTY
    {
        category: 'warranty',
        question: 'What warranty do KitchenBots products carry?',
        answer:
            'All KitchenBots products carry a 12-month manufacturing defect warranty covering welding failures, hinge defects, and surface coating separation. The Santa Maria Series and Rocket Stove 150MM additionally carry a 10-year structural frame warranty. The Automatic BBQ motor assembly is covered for 2 years. Normal surface oxidation, cosmetic wear, and damage from misuse are excluded.',
    },
    {
        category: 'warranty',
        question: 'How do I make a warranty claim?',
        answer:
            'Email support@kitchenbots.in with your order number, purchase date, photographs of the defect, and a description of the issue. Our warranty team will respond within 48 hours with a resolution. Where replacement is required, we ship the replacement unit before requesting return of the defective product in most cases.',
    },
    {
        category: 'warranty',
        question: 'Can I return a product if I\'m not satisfied?',
        answer:
            'Yes. We offer a 7-day no-questions-asked return policy on all products, provided the product is in its original, unused condition and original packaging. To initiate a return, contact support@kitchenbots.in within 7 days of delivery. Refunds are processed within 7 business days of receiving the returned product. Note: products that have been used (first fire completed) are not eligible for standard returns, but are covered under the warranty policy if a defect is identified.',
    },

    // ORDERING
    {
        category: 'ordering',
        question: 'Do you offer bulk or wholesale pricing?',
        answer:
            'Yes. KitchenBots offers structured wholesale pricing for orders of 5 units or more. Pricing tiers are available for retailers, distributors, restaurant chains, and catering companies. GST invoicing is available for all B2B orders. Apply through our Wholesale Programme page or contact wholesale@kitchenbots.in.',
    },
    {
        category: 'ordering',
        question: 'Do you accept custom or commercial specifications?',
        answer:
            'Yes. We offer custom fabrication for commercial kitchens, restaurant chains, and institutional buyers. Custom options include: non-standard dimensions, branded laser engraving, modified cooking surface materials, and custom motor configurations for the Automatic BBQ. Minimum order quantity for custom units is 10 pieces. Lead time is 4–6 weeks.',
    },
    {
        category: 'ordering',
        question: 'Can I become an authorised KitchenBots dealer?',
        answer:
            'We are actively expanding our authorised dealer network across India. Dealerships offer preferential pricing, marketing support, display material, and priority stock allocation. Minimum opening order applies. Apply via the Wholesale Programme page or contact wholesale@kitchenbots.in with your business details.',
    },
    {
        category: 'ordering',
        question: 'Are your products available on Amazon and Flipkart?',
        answer:
            'Yes. KitchenBots products are available across Amazon India, Flipkart, Zepto, Blinkit, IndiaMART, JioMart, Tata Neu, and Swiggy Instamart. However, the widest range and best pricing is always available directly on our website, and direct purchases include full manufacturer warranty and support.',
    },
];
