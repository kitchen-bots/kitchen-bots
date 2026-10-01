/** Product category marketing content for KitchenBots */

export interface CategoryContent {
    id: string;
    name: string;
    headline: string;
    intro: string;
    technicalExplanation: string;
    usageScenarios: string[];
    highlight: string;
}

export const CATEGORY_CONTENT: CategoryContent[] = [
    {
        id: 'collapsible-bbq',
        name: 'Collapsible BBQ',
        headline: 'Flat-Pack Performance. Zero Compromise.',
        intro:
            'The KitchenBots Collapsible BBQ range is engineered for people who demand professional-grade grilling without a permanent installation. Each unit folds completely flat in under 60 seconds, fits in the boot of any hatchback, and opens into a full-sized, high-heat cooking station.',
        technicalExplanation:
            'Constructed from precision-laser-cut mild steel with heat-resistant ceramic coating, our collapsible grills use an interlocking panel system that creates a rigid structural frame when open - without a single bolt. Internal airflow channels direct oxygen from the base through the charcoal bed to the cooking surface, achieving cooking temperatures of 250°C–400°C.',
        usageScenarios: [
            'Backyard weekend BBQs and family gatherings',
            'Rooftop and terrace cooking events',
            'Camping, trekking, and beach cookouts',
            'Catering events and outdoor food stalls',
            'Commercial kitchen overflow capacity',
        ],
        highlight: 'Folds to 90mm flat. Sets up in under 60 seconds.',
    },
    {
        id: 'rocket-stoves',
        name: 'Rocket Stoves',
        headline: 'Maximum Heat. Minimum Fuel. Zero Smoke.',
        intro:
            'Rocket stoves are the most thermally efficient cooking technology ever designed for solid-fuel combustion. The KitchenBots Rocket Stove takes this concept to its engineering limit - delivering intense, consistent, low-smoke heat from a fraction of the wood or charcoal used by traditional open fires.',
        technicalExplanation:
            'Our rocket stoves use an L-shaped combustion chamber with a precision-engineered cross-section ratio. Preheated combustion air enters from the fuel feed, surrounds the burning material, and is directed vertically through the insulated riser. The result: secondary combustion of gases that would otherwise escape as smoke - a 60–75% improvement in thermal efficiency over open-fire cooking.',
        usageScenarios: [
            'Off-grid outdoor cooking and jungle camping',
            'Commercial tandoor and wok cooking stations',
            'Agricultural and rural kitchen setups',
            'Disaster relief and emergency field kitchens',
            'Eco-conscious home outdoor cooking',
        ],
        highlight: 'Up to 75% less fuel than open fires. Rated to 1100°C.',
    },
    {
        id: 'automatic-bbq',
        name: 'Automatic BBQ',
        headline: 'Set It. Forget It. Serve Perfect Every Time.',
        intro:
            'The KitchenBots Automatic BBQ series introduces motorised rotation technology to Indian outdoor cooking. Dual-speed AC/DC motors keep multiple skewers at optimal distance from the charcoal bed - delivering uniform browning without manual attention.',
        technicalExplanation:
            'The motorised spit system operates on a 240V AC mains power with an optional 12V DC battery adapter for off-grid events. The rotation speed is engineered to create a continuous Maillard reaction across the entire surface of the food - eliminating hot spots and cold zones. Built entirely from 304-grade food-safe stainless steel with no painted internal surfaces.',
        usageScenarios: [
            'Commercial restaurant rotisserie and shawarma counters',
            'Event catering and banquet services',
            'High-volume public cooking events',
            'Professional outdoor kitchens',
            'Wedding and hospitality catering',
        ],
        highlight: 'Feeds 20–30 people simultaneously. Food-grade SS throughout.',
    },
    {
        id: 'santa-maria',
        name: 'Santa Maria Series',
        headline: 'Argentinian Fire Mastery. Indian Engineering.',
        intro:
            'The Santa Maria Series is KitchenBots\' flagship live-fire cooking system - inspired by the traditional Argentinian asado grill. A precision crank-wheel elevation mechanism lets the cook control cooking temperature by adjusting grate height above the fire, achieving results impossible with any other grill design.',
        technicalExplanation:
            'The elevation system uses a ratchet-lock wheel with 24 discrete positions across a 400mm height range. V-groove grates capture and redirect meat drip as flavour smoke rather than causing flare-ups. The main structure is constructed from heavy-gauge 3mm mild steel plate, stress-relieved by heat treatment after fabrication for maximum dimensional stability.',
        usageScenarios: [
            'Centrepiece outdoor kitchen installation',
            'Live-fire cooking demonstrations and restaurants',
            'Large family gatherings and social events',
            'Luxury catering and event hire',
            'Serious home cook installations',
        ],
        highlight: 'Crank-wheel elevation. V-groove grates. 400mm height range.',
    },
    {
        id: 'suitcase-bbq',
        name: 'Suitcase BBQ',
        headline: 'The World\'s Most Portable Serious Grill.',
        intro:
            'The Suitcase BBQ is engineered for people who refuse to compromise on quality when cooking away from home. It folds to a slim 70–90mm profile with carry handles, and opens into a fully rigid BBQ station in under 30 seconds - no tools required.',
        technicalExplanation:
            'A proprietary dual-hinge folding system allows the entire unit - including the charcoal tray, cooking grate, and windshield panels - to collapse into a single flat case. The internal locking mechanism generates a structural rigidity equivalent to a fixed-base unit, distributing load evenly across the welded frame.',
        usageScenarios: [
            'Adventure travel and road trips',
            'Beach and riverside cookouts',
            'Balcony and apartment terrace cooking',
            'Picnics, parks, and campsite grilling',
            'Gift for the serious outdoor cook',
        ],
        highlight: 'Folds to 70mm. Sets up in 30 seconds. No tools required.',
    },
    {
        id: 'accessories',
        name: 'Accessories',
        headline: 'The Right Tools for the Perfect Cook.',
        intro:
            'Every KitchenBots accessory is designed specifically to complement our grill systems. From heavy-duty grate brushes to stainless skewer sets and insulated carry covers - our accessories are built to the same standard as the grills themselves.',
        technicalExplanation:
            'KitchenBots accessories are manufactured from food-safe 304 stainless steel or premium heat-treated mild steel. All products are tested for compatibility with our full grill range. Where applicable, accessories carry the same heat-resistance certification as the main units.',
        usageScenarios: [
            'Extending the functionality of an existing KitchenBots grill',
            'Professional catering toolkit',
            'Gifting and retail bundling',
            'Replacement parts for extended product life',
        ],
        highlight: 'Engineered for KitchenBots. Compatible across the range.',
    },
];
