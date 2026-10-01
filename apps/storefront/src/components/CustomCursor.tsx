import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const followerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Detect touch device or small screen
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window) || navigator.maxTouchPoints > 0);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const cursor = cursorRef.current;
        const follower = followerRef.current;
        if (!cursor || !follower || isMobile) return;

        const xCursor = gsap.quickSetter(cursor, 'x', 'px');
        const yCursor = gsap.quickSetter(cursor, 'y', 'px');
        const xFollower = gsap.quickSetter(follower, 'x', 'px');
        const yFollower = gsap.quickSetter(follower, 'y', 'px');

        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            xCursor(mouseX);
            yCursor(mouseY);
        };

        const render = () => {
            followerX += (mouseX - followerX) * 0.15;
            followerY += (mouseY - followerY) * 0.15;
            xFollower(followerX);
            yFollower(followerY);
            requestAnimationFrame(render);
        };

        requestAnimationFrame(render);
        window.addEventListener('mousemove', onMouseMove);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName.toLowerCase() === 'a' ||
                target.tagName.toLowerCase() === 'button' ||
                target.closest('a') ||
                target.closest('button') ||
                target.classList.contains('cursor-pointer')
            ) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, [isMobile]);

    useEffect(() => {
        const follower = followerRef.current;
        if (!follower || isMobile) return;

        if (isHovering) {
            // Glassmorph outline: scale up, show blurred glass ring, no background fill
            gsap.to(cursorRef.current, { scale: 0, duration: 0.2 });
            gsap.to(follower, {
                scale: 1.6,
                borderColor: '#ff6b5b',
                duration: 0.3,
                ease: 'power2.out',
                onStart: () => {
                    follower.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    follower.style.backdropFilter = 'blur(6px)';
                    follower.style.setProperty('-webkit-backdrop-filter', 'blur(6px)');
                    follower.style.boxShadow = '0 0 0 1px rgba(255,107,91,0.3), inset 0 0 12px rgba(255,255,255,0.1)';
                },
            });
        } else {
            gsap.to(cursorRef.current, { scale: 1, duration: 0.2 });
            gsap.to(follower, {
                scale: 1,
                borderColor: 'rgba(255, 107, 91, 0.5)',
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    follower.style.backgroundColor = 'transparent';
                    follower.style.backdropFilter = '';
                    follower.style.removeProperty('-webkit-backdrop-filter');
                    follower.style.boxShadow = '';
                },
            });
        }
    }, [isHovering, isMobile]);

    if (isMobile) return null;

    return (
        <>
            {/* Small dot */}
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 w-2 h-2 bg-[#ff6b5b] rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
            />
            {/* Glassmorph outline ring */}
            <div
                ref={followerRef}
                className="fixed top-0 left-0 w-10 h-10 border-2 border-[#ff6b5b]/50 rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2"
                style={{ willChange: 'transform', transition: 'border-color 0.3s ease' }}
            />
        </>
    );
}
