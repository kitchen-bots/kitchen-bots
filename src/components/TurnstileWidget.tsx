import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: (error?: string | number) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
        }
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const DEFAULT_PROD_TURNSTILE_SITE_KEY = '0x4AAAAAAFAluzMr-1qmVr1-';
const CLOUDFLARE_TEST_SITE_KEY = '1x00000000000000000000AA';

function getResolvedTurnstileSiteKey(explicitKey?: string): string {
  if (explicitKey) return explicitKey;
  if (import.meta.env.VITE_TURNSTILE_SITE_KEY) {
    return import.meta.env.VITE_TURNSTILE_SITE_KEY;
  }
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0');

  if (import.meta.env.DEV || isLocalhost) {
    return CLOUDFLARE_TEST_SITE_KEY;
  }
  return DEFAULT_PROD_TURNSTILE_SITE_KEY;
}

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  siteKey?: string;
  className?: string;
}

const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(function TurnstileWidget(
  { onVerify, onError, onExpire, siteKey, className = '' },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
  }, [onVerify, onError, onExpire]);

  const resolvedSiteKey = getResolvedTurnstileSiteKey(siteKey);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // Ignore reset errors
        }
      }
    },
  }));

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let isMounted = true;

    function renderWidget() {
      if (!isMounted || !window.turnstile || !containerRef.current) return;
      if (widgetIdRef.current) return;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: resolvedSiteKey,
          callback: (token: string) => {
            if (isMounted) onVerifyRef.current?.(token);
          },
          'error-callback': () => {
            if (isMounted) onErrorRef.current?.();
          },
          'expired-callback': () => {
            if (isMounted) {
              onExpireRef.current?.();
              if (widgetIdRef.current && window.turnstile) {
                try {
                  window.turnstile.reset(widgetIdRef.current);
                } catch {
                  // Ignore
                }
              }
            }
          },
          theme: 'light',
        });
      } catch (err) {
        console.warn('Turnstile render notice:', err);
      }
    }

    if (typeof window !== 'undefined') {
      if (window.turnstile) {
        renderWidget();
      } else {
        const existingScript = document.getElementById('cf-turnstile-script');
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = 'cf-turnstile-script';
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.async = true;
          script.defer = true;
          script.onload = () => {
            renderWidget();
          };
          document.head.appendChild(script);
        } else {
          timer = setInterval(() => {
            if (window.turnstile) {
              if (timer) clearInterval(timer);
              renderWidget();
            }
          }, 150);
        }
      }
    }

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [resolvedSiteKey]);

  return <div ref={containerRef} className={`my-2 min-h-[65px] ${className}`} />;
});

export default TurnstileWidget;