/**
 * scroll-video-controller.ts
 * React hook that ties scroll position to a frame index
 * using IntersectionObserver + scroll events (no GSAP dependency).
 */

import { useEffect, useRef, useState, type RefObject } from 'react';

interface ScrollVideoOptions {
    /** Total number of frames */
    frameCount: number;
    /** How many scroll pixels drive a full loop through all frames. Default 1200. */
    scrollRange?: number;
    /** Smoothing factor 0–1. Lower = smoother but more lag. Default 0.12. */
    lerp?: number;
}

interface ScrollVideoState {
    /** Current (interpolated) frame index - use this to render */
    frame: number;
    /** Whether the element is currently in the viewport */
    isVisible: boolean;
}

/**
 * useScrollVideoController
 * Attach containerRef to the scroll-tracked element.
 * Returns current frame index (smoothly interpolated).
 *
 * Usage:
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const { frame } = useScrollVideoController(containerRef, { frameCount: 40 });
 */
export function useScrollVideoController(
    containerRef: RefObject<HTMLElement | null>,
    { frameCount, scrollRange = 1200, lerp = 0.12 }: ScrollVideoOptions
): ScrollVideoState {
    const [frame, setFrame] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const targetFrameRef = useRef(0);
    const currentFrameRef = useRef(0);
    const rafRef = useRef<number>(0);
    const isVisibleRef = useRef(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Intersection observer to know when to scroll-drive
        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting;
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0 }
        );
        observer.observe(el);

        // Track scroll and map to frame
        const onScroll = () => {
            if (!isVisibleRef.current) return;
            const rect = el.getBoundingClientRect();
            const scrolled = -rect.top; // how far past the top we are
            const clamped = Math.max(0, Math.min(1, scrolled / scrollRange));
            targetFrameRef.current = clamped * (frameCount - 1);
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        // RAF loop for smooth lerp
        function tick() {
            const diff = targetFrameRef.current - currentFrameRef.current;
            if (Math.abs(diff) > 0.01) {
                currentFrameRef.current += diff * lerp;
                setFrame(Math.round(currentFrameRef.current));
            }
            rafRef.current = requestAnimationFrame(tick);
        }
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(rafRef.current);
        };
    }, [containerRef, frameCount, scrollRange, lerp]);

    return { frame, isVisible };
}
