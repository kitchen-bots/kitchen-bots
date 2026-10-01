import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface ProductVideoPlayerProps {
  src: string;
  poster?: string;
  productName: string;
  className?: string;
  autoPlay?: boolean;
}

export default function ProductVideoPlayer({
  src,
  poster,
  productName,
  className = '',
  autoPlay = true,
}: ProductVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (autoPlay) {
      video.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [src, autoPlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        setHasEnded(false);
      }).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (hasError && poster) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-[#F8FAFC] ${className}`}>
        <img src={poster} alt={productName} className="h-full w-full object-contain" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-medium text-sm">
          Video preview unavailable
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`group relative flex items-center justify-center overflow-hidden rounded-2xl border border-[#E2E8F0] bg-black select-none ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        muted={isMuted}
        loop
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setHasEnded(true)}
        onError={() => setHasError(true)}
        onClick={togglePlay}
        className="h-full w-full object-contain cursor-pointer"
        aria-label={`Video presentation of ${productName}`}
      />

      {/* Floating Center Play Button When Paused */}
      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs transition-opacity"
          aria-label="Play video"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C2410C] text-white shadow-xl transition-transform hover:scale-110 active:scale-95">
            <Play size={28} className="translate-x-0.5 fill-current" />
          </div>
        </button>
      )}

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
        {/* Scrubber Bar */}
        <div
          onClick={handleSeek}
          className="mb-3 h-1.5 w-full cursor-pointer rounded-full bg-white/30 overflow-hidden"
          role="slider"
          aria-valuenow={progress}
          aria-label="Video timeline"
        >
          <div
            className="h-full bg-[#C2410C] transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-lg"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-lg"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </Button>

            <span className="font-['DM_Sans'] font-medium text-white/90 text-xs">
              HD Turntable Video
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {hasEnded && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20 rounded-lg"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                    setIsPlaying(true);
                  }
                }}
                aria-label="Replay"
              >
                <RotateCcw size={15} />
              </Button>
            )}

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-lg"
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
            >
              <Maximize2 size={15} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
