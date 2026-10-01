/**
 * Device and connection utilities for adaptive performance
 */

export const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
};

interface NetworkConnection {
    effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
    saveData?: boolean;
}

export const isSlowConnection = () => {
    if (typeof window === 'undefined') return false;
    const nav = navigator as Navigator & {
        connection?: NetworkConnection;
        mozConnection?: NetworkConnection;
        webkitConnection?: NetworkConnection;
    };
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (!conn) return false;

    // Treat '2g' or '3g' or 'save-data' as slow
    return (
        conn.effectiveType === '2g' ||
        conn.effectiveType === '3g' ||
        conn.saveData === true
    );
};

/**
 * Recommends a frame count based on network/device
 */
export const getRecommendedFrameCount = (target: number) => {
    if (isSlowConnection()) return Math.min(20, target);
    if (isMobile()) return Math.min(30, target);
    return target;
};
