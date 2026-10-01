import { describe, it, expect, vi } from 'vitest';
import {
  wrapIndex,
  shortestFrameDistance,
  dragToFrame,
  renderFrame,
} from '../sequence-viewer';

describe('sequence-viewer module', () => {
  describe('wrapIndex', () => {
    it('wraps positive and negative indices correctly', () => {
      expect(wrapIndex(0, 40)).toBe(0);
      expect(wrapIndex(39, 40)).toBe(39);
      expect(wrapIndex(40, 40)).toBe(0);
      expect(wrapIndex(41, 40)).toBe(1);
      expect(wrapIndex(-1, 40)).toBe(39);
      expect(wrapIndex(-40, 40)).toBe(0);
    });

    it('returns 0 when total is 0', () => {
      expect(wrapIndex(5, 0)).toBe(0);
    });
  });

  describe('shortestFrameDistance', () => {
    it('calculates direct forward and backward distance around circle', () => {
      expect(shortestFrameDistance(0, 10, 40)).toBe(10);
      expect(shortestFrameDistance(10, 0, 40)).toBe(-10);
      expect(shortestFrameDistance(35, 2, 40)).toBe(7);
      expect(shortestFrameDistance(2, 35, 40)).toBe(-7);
      expect(shortestFrameDistance(0, 20, 40)).toBe(20);
    });
  });

  describe('dragToFrame', () => {
    it('converts drag delta into frame index with sensitivity', () => {
      const drag = { isDragging: true, startX: 100, startFrame: 10 };
      // Move right by 80px (sensitivity 8 -> 10 frames advance)
      expect(dragToFrame(drag, 180, 40, 8)).toBe(20);
      // Move left by 80px (sensitivity 8 -> 10 frames back)
      expect(dragToFrame(drag, 20, 40, 8)).toBe(0);
      // Move left past 0 wraps around
      expect(dragToFrame(drag, 0, 40, 8)).toBe(38); // -100/8 = -12.5 -> Math.round is -12 => wrapIndex(10 - 12, 40) = 38
    });
  });

  describe('renderFrame', () => {
    it('renders on canvas and uses nearest loaded frame if target frame not loaded', () => {
      const mockCtx = {
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
      };
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(mockCtx),
        width: 800,
        height: 600,
      } as unknown as HTMLCanvasElement;

      const loadedImg = {
        complete: true,
        naturalWidth: 400,
        naturalHeight: 300,
      } as HTMLImageElement;

      // Frame 0 is missing, but Frame 1 is loaded
      const images: (HTMLImageElement | undefined)[] = [undefined, loadedImg];

      renderFrame(mockCanvas, images, 0);

      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockCtx.drawImage).toHaveBeenCalledWith(loadedImg, 0, 0, 800, 600);
      expect(mockCtx.imageSmoothingEnabled).toBe(true);
      expect(mockCtx.imageSmoothingQuality).toBe('high');
    });
  });
});
