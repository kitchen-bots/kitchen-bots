import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RotateCw, Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { preloadFrames } from '../modules/media-loader';
import { renderFrame, wrapIndex, shortestFrameDistance, type DragState } from '../modules/sequence-viewer';
import { cn } from '../lib/utils';

interface Product360ViewerProps {
  sequenceId: string;
  frameCount: number;
  productName: string;
  posterImage?: string;
  className?: string;
}

export default function Product360Viewer({
  sequenceId,
  frameCount,
  productName,
  posterImage,
  className = '',
}: Product360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | undefined)[]>([]);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragStateRef = useRef<DragState>({ isDragging: false, startX: 0, startFrame: 0 });
  const frameRef = useRef(0);

  useEffect(() => {
    frameRef.current = currentFrame;
  }, [currentFrame]);

  // Draw current frame on canvas with automatic dimension fallback
  const draw = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width === 0 || canvas.height === 0) {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
    }
    renderFrame(canvas, imagesRef.current, index);
  }, []);

  const [prevSequenceId, setPrevSequenceId] = useState(sequenceId);

  if (sequenceId !== prevSequenceId) {
    setPrevSequenceId(sequenceId);
    setIsLoading(true);
    setLoadError(false);
  }

  // Preload frames progressively with caching
  useEffect(() => {
    let isCancelled = false;

    preloadFrames(
      sequenceId,
      frameCount,
      6, // Priority frames for instant first render
      () => {
        if (!isCancelled) {
          setIsLoading(false);
          draw(frameRef.current);
        }
      }
    )
      .then((loadedImages) => {
        if (isCancelled) return;
        imagesRef.current = loadedImages;
        setIsLoading(false);
        draw(frameRef.current);
      })
      .catch((err) => {
        console.error('Failed to load 360 sequence:', err);
        if (!isCancelled) {
          setLoadError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [sequenceId, frameCount, draw]);

  // Adjust canvas size for crisp HiDPI rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        draw(frameRef.current);
      }
    });

    resizeObserver.observe(canvas);
    if (container) resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [draw]);

  // Redraw when currentFrame updates
  useEffect(() => {
    draw(currentFrame);
  }, [currentFrame, draw]);

  // Unified Pointer Drag Handlers with pointer capture
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, [data-no-drag="true"]')) {
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored if pointer capture is not supported
    }

    setHasInteracted(true);
    setIsDragging(true);
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startFrame: frameRef.current,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDragging) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const width = rect?.width || 400;
    const pixelsPerFrame = Math.max(4, width / frameCount);
    const deltaX = e.clientX - dragStateRef.current.startX;
    const framesDelta = Math.round(deltaX / pixelsPerFrame);
    const newFrame = wrapIndex(dragStateRef.current.startFrame + framesDelta, frameCount);
    setCurrentFrame(newFrame);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current.isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
      dragStateRef.current.isDragging = false;
      setIsDragging(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setHasInteracted(true);
      setCurrentFrame((prev) => wrapIndex(prev - (e.shiftKey ? 5 : 1), frameCount));
    } else if (e.key === 'ArrowRight') {
      setHasInteracted(true);
      setCurrentFrame((prev) => wrapIndex(prev + (e.shiftKey ? 5 : 1), frameCount));
    }
  };

  // Degrees calculated from current frame (0 to 359)
  const degrees = Math.round((currentFrame / frameCount) * 360) % 360;

  // Cardinal view direction label
  const cardinalLabel = useMemo(() => {
    if (degrees >= 345 || degrees <= 15) return 'Front';
    if (degrees >= 75 && degrees <= 105) return 'Right';
    if (degrees >= 165 && degrees <= 195) return 'Back';
    if (degrees >= 255 && degrees <= 285) return 'Left';
    return null;
  }, [degrees]);

  // Snap to next 90° angle quadrant when clicking degree badge
  const snapToNextQuarter = () => {
    const currentQuarter = Math.floor((degrees + 45) / 90) % 4;
    const nextQuarter = (currentQuarter + 1) % 4;
    const targetDegrees = nextQuarter * 90;
    const targetFrame = wrapIndex(Math.round((targetDegrees / 360) * frameCount), frameCount);

    setHasInteracted(true);

    const start = frameRef.current;
    const diff = shortestFrameDistance(start, targetFrame, frameCount);
    const startTime = performance.now();
    const duration = 280;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const nextF = wrapIndex(Math.round(start + diff * ease), frameCount);
      setCurrentFrame(nextF);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentFrame(targetFrame);
      }
    };
    requestAnimationFrame(animate);
  };

  if (loadError && posterImage) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-[#F8FAFC] ${className}`}>
        <img src={posterImage} alt={productName} className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label={`360 interactive turntable view of ${productName}`}
      aria-valuenow={degrees}
      aria-valuemin={0}
      aria-valuemax={360}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#E2E8F0] bg-gradient-to-b from-[#FFFFFF] to-[#F8FAFC] select-none outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] touch-none',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 360 Degree Canvas */}
      <canvas
        ref={canvasRef}
        className="h-full w-full object-contain pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs transition-opacity z-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#C2410C]" />
          <p className="mt-2 font-['DM_Sans'] text-xs font-semibold text-[#64748B]">Loading 3D Turntable...</p>
        </div>
      )}

      {/* Interactive Guidance Hint Pill */}
      {!hasInteracted && !isLoading && (
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 animate-pulse flex items-center gap-1.5 rounded-full bg-black/75 px-3.5 py-1 text-xs font-medium text-white shadow-md backdrop-blur-md z-10">
          <RotateCw size={13} className="text-[#FDBA74]" />
          <span>Drag or swipe to rotate 360°</span>
        </div>
      )}

      {/* Degree Badge Pill (Interactive: click to snap to next 90° angle) */}
      <button
        type="button"
        data-no-drag="true"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={snapToNextQuarter}
        title="Click to snap to next 90° view"
        className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-[#1E293B] shadow-sm backdrop-blur-md border border-[#E2E8F0]/80 transition-all active:scale-95 hover:border-[#FDBA74] hover:bg-white select-none cursor-pointer"
      >
        <Sparkles size={13} className="text-[#C2410C] shrink-0" />
        <span>{degrees}° view</span>
        {cardinalLabel && (
          <span className="text-[#C2410C] font-semibold text-[11px] bg-[#FFF7ED] px-1.5 py-0.5 rounded-md border border-[#FFEDD5]">
            {cardinalLabel}
          </span>
        )}
        <span className="text-[#94A3B8] font-medium">({currentFrame + 1}/{frameCount})</span>
      </button>

      {/* Manual Step Controls (Bottom Right) */}
      <div
        className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-xl bg-white/95 p-1 shadow-sm backdrop-blur-md border border-[#E2E8F0]/80"
        data-no-drag="true"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            setHasInteracted(true);
            setCurrentFrame((prev) => wrapIndex(prev - 2, frameCount));
          }}
          title="Rotate left"
          aria-label="Rotate left"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] hover:text-[#C2410C] hover:bg-[#FFF7ED] transition-colors cursor-pointer active:scale-90"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="h-3.5 w-px bg-[#E2E8F0]" />
        <button
          type="button"
          onClick={() => {
            setHasInteracted(true);
            setCurrentFrame((prev) => wrapIndex(prev + 2, frameCount));
          }}
          title="Rotate right"
          aria-label="Rotate right"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] hover:text-[#C2410C] hover:bg-[#FFF7ED] transition-colors cursor-pointer active:scale-90"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
