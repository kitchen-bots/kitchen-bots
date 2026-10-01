import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ToastContext, type Toast } from './ToastContextData';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, actionLabel?: string, onAction?: () => void) => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, message, actionLabel, onAction }]);

    // Auto-dismiss after 3.2s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container: Positioned above floating WhatsApp button (bottom-24) to avoid collision */}
      <div 
        className="fixed bottom-24 right-6 z-[99999] flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-3rem)]"
        aria-live="polite"
      >
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      gsap.fromTo(elementRef.current, 
        { y: 20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div 
      ref={elementRef}
      className="pointer-events-auto flex items-center gap-3.5 bg-[#0F172A] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-[#334155]/80 min-w-[300px] max-w-[420px]"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#22C55E]/15 text-[#22C55E]">
        <Check size={16} strokeWidth={2.5} />
      </div>
      <div className="flex-1 font-['DM_Sans'] text-[13px] font-medium leading-snug text-white">
        {toast.message}
      </div>
      {toast.actionLabel && (
        <button 
          onClick={toast.onAction}
          className="flex items-center gap-1 shrink-0 rounded-lg bg-white/10 px-3 py-1.5 font-['Outfit'] text-[12px] font-bold uppercase tracking-wider text-[#F97316] hover:bg-white/15 hover:text-[#FB923C] transition-colors"
        >
          {toast.actionLabel}
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}
