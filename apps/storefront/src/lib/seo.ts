import type { Product } from '../types/product';
import { getMediaUrl } from './cdn';

/** Per-page SEO metadata */
export interface SEOMeta {
    title: string;
    description: string;
    ogImage?: string;
    ogType?: string;
    canonical?: string;
}

const DEFAULT_OG_IMAGE = getMediaUrl('/images/redesign/hero-robot.png');

/** Default SEO for each static page */
export const PAGE_SEO: Record<string, SEOMeta> = {
    home: {
        title: 'KitchenBots India | Commercial BBQ Grills & Kitchen Equipment',
        description:
            'KitchenBots India Pvt. Ltd. manufactures heavy-duty commercial BBQ grills, rocket stoves, and industrial kitchen equipment. Pan India delivery. Call: +91 9490701421',
        ogImage: DEFAULT_OG_IMAGE,
        ogType: 'website',
    },
    products: {
        title: 'Industrial Kitchen Products | KitchenBots India',
        description:
            'Explore our high-performance fleet: Automatic BBQ Grills, Santa Maria Series, Rocket Stoves, and more. Built for commercial excellence.',
        ogImage: getMediaUrl('/images/products/kb-commercial-bbq.webp'),
        ogType: 'website',
    },
    about: {
        title: 'About Us | KitchenBots India',
        description:
            'Manufacturer of heavy-duty commercial cooking systems in India. Learn about our precision fabrication, solid-fuel technology, and equipment design.',
        ogImage: getMediaUrl('/images/redesign/capabilities-hero.png'),
        ogType: 'website',
    },
    contact: {
        title: 'Get a Quote | KitchenBots India',
        description:
            'Request a quote for your commercial kitchen. Directly contact our manufacturing team in Hyderabad for product specifications and delivery timelines.',
        ogImage: DEFAULT_OG_IMAGE,
        ogType: 'website',
    },
    policies: {
        title: 'Customer Policies | KitchenBots India',
        description:
            'Shipping, Warranty, and Return policies for KitchenBots India. Transparency and reliability for every customer.',
        ogImage: DEFAULT_OG_IMAGE,
        ogType: 'website',
    },
    capabilities: {
        title: 'Manufacturing Capabilities | KitchenBots India',
        description:
            'From heavy-gauge stainless steel fabrication to automated turning mechanisms, review our commercial kitchen engineering capabilities.',
        ogImage: getMediaUrl('/images/redesign/capabilities-hero.png'),
        ogType: 'website',
    },
    blog: {
        title: 'Journal & Insights | KitchenBots India',
        description:
            'Commercial cooking guidance, maintenance protocols, and thermal engineering insights from the KitchenBots team.',
        ogImage: DEFAULT_OG_IMAGE,
        ogType: 'website',
    },
    login: {
        title: 'Account Access | KitchenBots India',
        description: 'Login to manage your commercial orders and wishlist.',
        ogImage: DEFAULT_OG_IMAGE,
        ogType: 'website',
    },
    cart: {
        title: 'Shopping Cart | KitchenBots India',
        description: 'Review selected equipment and submit a confirmed quotation request with KitchenBots India.',
        ogImage: DEFAULT_OG_IMAGE,
        ogType: 'website',
    },
    'bulk-enquiry': {
        title: 'Bulk Equipment Enquiry | KitchenBots India',
        description: 'Submit high-volume commercial kitchen requirements and get a detailed manufacturing quotation.',
        ogImage: DEFAULT_OG_IMAGE,
        ogType: 'website',
    },
};

/** Returns SEO metadata for a product detail page */
export function getProductSEO(product: Product): SEOMeta {
    return {
        title: `${product.name} | KitchenBots India`,
        description: product.shortDescription || product.description || '',
        ogImage: product.thumbnail ?? product.image,
        ogType: 'product',
        canonical: `/products/${product.id}`,
    };
}

/** Returns a JSON-LD Product schema string for injection into <script> tags */
export function getProductJsonLd(product: Product): string {
    const schema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: [product.thumbnail ?? product.image],
        description: product.description || product.shortDescription || '',
        sku: product.id,
        brand: {
            '@type': 'Brand',
            name: 'KitchenBots India',
        },
        offers: {
            '@type': 'Offer',
            url: `https://kitchenbots.in/products/${product.id}`,
            priceCurrency: 'INR',
            price: product.price,
            availability: 'https://schema.org/InStock',
            seller: {
                '@type': 'Organization',
                name: 'KitchenBots India',
            },
        },
    };
    return JSON.stringify(schema, null, 2);
}
