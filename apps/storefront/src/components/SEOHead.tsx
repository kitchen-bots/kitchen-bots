import { useEffect } from 'react';
import type { SEOMeta } from '../lib/seo';

interface SEOHeadProps extends SEOMeta {
    jsonLd?: string;
}

/**
 * SEOHead
 * ────────────────────────────────────────────────────────────────
 * Imperatively updates <head> meta tags for the current page.
 * This works because the app is SPA-rendered and we control the DOM.
 * For SSR, replace with react-helmet-async.
 */
export default function SEOHead({ title, description, ogImage, ogType, canonical, jsonLd }: SEOHeadProps) {
    useEffect(() => {
        // ── Title ─────────────────────────────────────────────────────
        document.title = title;

        // ── Helper ────────────────────────────────────────────────────
        const setMeta = (selector: string, attr: string, value: string) => {
            let el = document.head.querySelector<HTMLMetaElement>(selector);
            if (!el) {
                el = document.createElement('meta');
                document.head.appendChild(el);
            }
            el.setAttribute(attr, value);
        };

        const setLink = (rel: string, href: string) => {
            let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
            if (!el) {
                el = document.createElement('link');
                el.rel = rel;
                document.head.appendChild(el);
            }
            el.href = href;
        };

        // ── Standard meta ─────────────────────────────────────────────
        setMeta('meta[name="description"]', 'content', description);

        // ── Open Graph ────────────────────────────────────────────────
        setMeta('meta[property="og:title"]', 'content', title);
        setMeta('meta[property="og:description"]', 'content', description);
        setMeta('meta[property="og:type"]', 'content', ogType ?? 'website');
        if (ogImage) setMeta('meta[property="og:image"]', 'content', ogImage);

        // ── Twitter / X ───────────────────────────────────────────────
        setMeta('meta[name="twitter:title"]', 'content', title);
        setMeta('meta[name="twitter:description"]', 'content', description);
        setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
        if (ogImage) setMeta('meta[name="twitter:image"]', 'content', ogImage);

        // ── Canonical ─────────────────────────────────────────────────
        if (canonical) setLink('canonical', `https://kitchenbots.in${canonical}`);

        // ── JSON-LD structured data ───────────────────────────────────
        const existingLd = document.head.querySelector<HTMLScriptElement>('script[data-rh="ld+json"]');
        if (jsonLd) {
            const script = existingLd ?? document.createElement('script');
            script.type = 'application/ld+json';
            script.dataset.rh = 'ld+json';
            script.textContent = jsonLd;
            if (!existingLd) document.head.appendChild(script);
        } else if (existingLd) {
            existingLd.remove();
        }

        return () => {
            // Cleanup structured data on unmount
            document.head.querySelector<HTMLScriptElement>('script[data-rh="ld+json"]')?.remove();
        };
    }, [title, description, ogImage, ogType, canonical, jsonLd]);

    // This component renders nothing into the DOM tree
    return null;
}
