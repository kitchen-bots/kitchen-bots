import { useEffect, useRef, useState } from 'react';

interface ViewportVideoProps {
    src: string;
    poster?: string;
    className?: string;
    style?: React.CSSProperties;
}

export default function ViewportVideo({ src, poster, className = '', style }: ViewportVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasError, setHasError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
                if (entry.isIntersecting && !hasError) {
                    video.play().catch(() => {
                        // Silently handle autoplay restrictions if any
                    });
                } else {
                    video.pause();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(video);

        return () => {
            observer.unobserve(video);
            observer.disconnect();
        };
    }, [hasError]);

    if (hasError && poster) {
        return (
            <div className={`w-full h-full ${className}`} style={style}>
                <img src={poster} alt="Video Fallback" className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            src={src}
            poster={poster}
            className={`w-full h-full object-cover ${className}`}
            style={style}
            muted
            loop
            playsInline
            preload={isVisible ? "auto" : "none"}
            onError={() => setHasError(true)}
        />
    );
}
