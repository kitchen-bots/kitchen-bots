/**
 * media-loader.ts
 * Handles progressive/lazy loading of image sequences and product images.
 */

/**
 * Preload the first `priorityCount` frames immediately, rest lazily.
 * Returns array of Image elements indexed by frame number.
 */
import { getMediaUrl } from '../lib/cdn';

const sequenceCache = new Map<string, HTMLImageElement[]>();
const loadingPromises = new Map<string, Promise<HTMLImageElement[]>>();

export async function preloadFrames(
    productId: string,
    frameCount: number,
    priorityCount = 6,
    onFirstBatch?: () => void
): Promise<HTMLImageElement[]> {
    if (sequenceCache.has(productId)) {
        const cached = sequenceCache.get(productId)!;
        onFirstBatch?.();
        return cached;
    }

    if (loadingPromises.has(productId)) {
        const existingPromise = loadingPromises.get(productId)!;
        onFirstBatch?.();
        return existingPromise;
    }

    const loadPromise = (async () => {
        const images: HTMLImageElement[] = new Array(frameCount);

        const encodedId = encodeURIComponent(productId);
        const makeUrl = (i: number) =>
            getMediaUrl(`/3d-assets/sequences/${encodedId}/${String(i).padStart(3, '0')}.webp`);

        // Load first `priorityCount` frames synchronously (await all at once)
        const priorityPromises = Array.from({ length: Math.min(priorityCount, frameCount) }, (_, i) =>
            loadImage(makeUrl(i)).then((img) => { images[i] = img; })
        );
        await Promise.all(priorityPromises);
        onFirstBatch?.();

        // Load rest progressively in the background
        for (let i = priorityCount; i < frameCount; i++) {
            loadImage(makeUrl(i)).then((img) => { images[i] = img; });
        }

        sequenceCache.set(productId, images);
        loadingPromises.delete(productId);
        return images;
    })();

    loadingPromises.set(productId, loadPromise);
    return loadPromise;
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img); // resolve anyway to not block
        img.src = src;
    });
}

/**
 * Lazy-loads an <img> element using IntersectionObserver.
 * Pass the real src as `data-src` attribute and call this once on mount.
 */
export function lazyLoadImage(
    el: HTMLImageElement,
    src: string,
    options?: IntersectionObserverInit
): () => void {
    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    el.src = src;
                    obs.disconnect();
                }
            });
        },
        { rootMargin: '200px', threshold: 0, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
}

/**
 * React hook – lazy loads an image when it scrolls into view.
 * Usage: const imgRef = useLazyImage('/images/products/foo.webp');
 */
import { useEffect, useRef } from 'react';

export function useLazyImage(src: string) {
    const ref = useRef<HTMLImageElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        const resolvedSrc = getMediaUrl(src);
        // If already in viewport or src is preloaded, set directly
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 200) {
            el.src = resolvedSrc;
            return;
        }
        return lazyLoadImage(el, resolvedSrc);
    }, [src]);
    return ref;
}
