/**
 * sequence-viewer.ts
 * Pure canvas rendering logic for 360° product viewers.
 * Decoupled from React - usable in any canvas context.
 */

/** Render a single frame onto a canvas, centered and aspect-fit. */
export function renderFrame(
    canvas: HTMLCanvasElement,
    images: (HTMLImageElement | undefined)[],
    index: number
): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || !images || images.length === 0) return;

    const total = images.length;
    const targetIndex = wrapIndex(Math.round(index), total);
    let img = images[targetIndex];

    // Fallback: If target frame is not loaded or missing, find nearest loaded frame
    if (!img || !img.complete || img.naturalWidth === 0) {
        for (let offset = 1; offset <= Math.floor(total / 2); offset++) {
            const forward = (targetIndex + offset) % total;
            const backward = (targetIndex - offset + total) % total;
            if (images[forward]?.complete && images[forward]?.naturalWidth) {
                img = images[forward];
                break;
            }
            if (images[backward]?.complete && images[backward]?.naturalWidth) {
                img = images[backward];
                break;
            }
        }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;

    ctx.drawImage(img, x, y, w, h);
}

/** Clamp index within valid range (wrapping). */
export function wrapIndex(index: number, total: number): number {
    if (total === 0) return 0;
    return ((Math.round(index) % total) + total) % total;
}

/** Shortest distance between two circular frame indices. */
export function shortestFrameDistance(from: number, to: number, total: number): number {
    if (total === 0) return 0;
    const diff = (to - from) % total;
    if (diff > total / 2) return diff - total;
    if (diff < -total / 2) return diff + total;
    return diff;
}

/** Drag/swipe state manager. Returns handlers to attach to a container. */
export interface DragState {
    isDragging: boolean;
    startX: number;
    startFrame: number;
}

export function createDragState(): DragState {
    return { isDragging: false, startX: 0, startFrame: 0 };
}

/** Calculate new frame index from drag delta. */
export function dragToFrame(
    drag: DragState,
    clientX: number,
    total: number,
    sensitivity = 8
): number {
    const delta = clientX - drag.startX;
    return wrapIndex(drag.startFrame + Math.round(delta / sensitivity), total);
}

/** Auto-rotate animation using requestAnimationFrame (returns cancel function). */
export function startAutoRotate(
    getFrame: () => number,
    setFrame: (f: number) => void,
    total: number,
    speed = 0.08 // frames per RAF tick
): () => void {
    let rafId: number;
    let running = true;

    function tick() {
        if (!running) return;
        setFrame(wrapIndex(getFrame() + speed, total));
        rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
        running = false;
        cancelAnimationFrame(rafId);
    };
}
