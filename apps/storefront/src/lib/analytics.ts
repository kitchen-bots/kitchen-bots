/**
 * analytics.ts
 * ─────────────────────────────────────────────────────────────────
 * Typed analytics event stubs.
 *
 * HOW TO ACTIVATE:
 *   1. Uncomment the GA4 / Meta Pixel / Google Ads snippets in index.html
 *   2. Replace your measurement IDs in the snippet
 *   3. This module will automatically detect and call window.gtag / window.fbq
 *
 * All functions are safe to call even before the scripts load - they
 * short-circuit gracefully when trackers are absent.
 */

// ── Type declarations ──────────────────────────────────────────────────
declare global {
    interface Window {
        /** Google Analytics / Google Ads */
        gtag?: (...args: unknown[]) => void;
        /** Meta Pixel */
        fbq?: (...args: unknown[]) => void;
    }
}

// ── Core helper ───────────────────────────────────────────────────────
function pushGtag(event: string, params?: Record<string, unknown>): void {
    window.gtag?.('event', event, params);
}

function pushFbq(event: string, params?: Record<string, unknown>): void {
    window.fbq?.('track', event, params);
}

// ── Public events ─────────────────────────────────────────────────────

/** Fire when a user views a product detail page */
export function trackViewProduct(payload: {
    productId: string;
    productName: string;
    category: string;
    price: number;
}): void {
    pushGtag('view_item', {
        currency: 'INR',
        value: payload.price,
        items: [
            {
                item_id: payload.productId,
                item_name: payload.productName,
                item_category: payload.category,
                price: payload.price,
            },
        ],
    });
    pushFbq('ViewContent', {
        content_ids: [payload.productId],
        content_name: payload.productName,
        content_type: 'product',
        value: payload.price,
        currency: 'INR',
    });
}

/** Fire when a user adds an item to the cart */
export function trackAddToCart(payload: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
}): void {
    pushGtag('add_to_cart', {
        currency: 'INR',
        value: payload.price * payload.quantity,
        items: [
            {
                item_id: payload.productId,
                item_name: payload.productName,
                price: payload.price,
                quantity: payload.quantity,
            },
        ],
    });
    pushFbq('AddToCart', {
        content_ids: [payload.productId],
        content_name: payload.productName,
        value: payload.price,
        currency: 'INR',
    });
}

/** Fire when a user opens or initiates checkout */
export function trackBeginCheckout(payload: {
    totalValue: number;
    itemCount: number;
}): void {
    pushGtag('begin_checkout', {
        currency: 'INR',
        value: payload.totalValue,
    });
    pushFbq('InitiateCheckout', {
        value: payload.totalValue,
        currency: 'INR',
        num_items: payload.itemCount,
    });
}

/** Fire when a purchase is completed (backend integration will provide these) */
export function trackPurchase(payload: {
    orderId: string;
    totalValue: number;
    items: Array<{ productId: string; productName: string; price: number; quantity: number }>;
}): void {
    pushGtag('purchase', {
        transaction_id: payload.orderId,
        currency: 'INR',
        value: payload.totalValue,
        items: payload.items.map((i) => ({
            item_id: i.productId,
            item_name: i.productName,
            price: i.price,
            quantity: i.quantity,
        })),
    });
    pushFbq('Purchase', {
        value: payload.totalValue,
        currency: 'INR',
    });
}
