import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ShoppingBag,
  PhoneCall,
  Truck,
  MapPin,
  PackageCheck,
  X,
  ArrowRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import type { Page } from '../App';
import { Button } from './ui/button';

export interface CompletedOrderData {
  reference: string;
  date: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status?: string;
}

interface OrderCompletionModalProps {
  isOpen: boolean;
  order: CompletedOrderData | null;
  onClose: () => void;
  onNavigate: (page: Page) => void;
}

export default function OrderCompletionModal({
  isOpen,
  order,
  onClose,
  onNavigate,
}: OrderCompletionModalProps) {
  const [copied, setCopied] = useState(false);

  // Keyboard accessibility: ESC key to close and body scroll freezing
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order || typeof document === 'undefined') {
    return null;
  }

  const handleCopyReference = async () => {
    try {
      await navigator.clipboard.writeText(order.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = order.reference;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTrackInAccount = () => {
    onClose();
    onNavigate('login');
  };

  const handleContinueShopping = () => {
    onClose();
    onNavigate('products');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-success-title"
      aria-describedby="order-success-desc"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm transition-opacity duration-300 touch-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        id="order-completion-printable"
        className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] my-auto overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#15803D]">
              Commercial Order Confirmed
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kb-primary"
            aria-label="Close order completion popup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Success Banner */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#16A34A]" />
            </div>

            <div>
              <h2
                id="order-success-title"
                className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight"
              >
                Order Placed Successfully!
              </h2>
              <p
                id="order-success-desc"
                className="mt-1 text-sm text-[#64748B] font-['DM_Sans'] max-w-md mx-auto leading-relaxed"
              >
                Thank you, <span className="font-semibold text-[#0F172A]">{order.name}</span>. Your equipment request has been logged. Our dispatch desk has initiated order fulfillment.
              </p>
            </div>
          </div>

          {/* Reference & Status Card */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block font-['Outfit']">
                Order Reference Number
              </span>
              <div className="flex items-center gap-2.5 mt-1">
                <span className="font-mono text-lg sm:text-xl font-bold text-[#0F172A] tracking-wide">
                  {order.reference}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  Active
                </span>
              </div>
              <span className="text-xs text-[#64748B] font-['DM_Sans'] mt-1 block">
                Placed on {order.date}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyReference}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] hover:border-[#94A3B8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kb-primary cursor-pointer"
                aria-label="Copy order reference"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span className="text-[#15803D] font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A] hover:border-[#94A3B8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kb-primary cursor-pointer print:hidden"
                aria-label="Print order summary"
              >
                <Printer className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Fulfillment Roadmap / What Happens Next */}
          <div className="border border-[#E2E8F0] rounded-xl p-4 sm:p-5 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#475569]">
                Fulfillment Process
              </h3>
              <span className="text-[11px] text-[#15803D] font-medium font-['DM_Sans'] flex items-center gap-1">
                <Clock className="w-3 h-3" /> Step 1 of 3 Complete
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7]">
                <div className="w-7 h-7 rounded-lg bg-[#16A34A] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0F172A] font-['Outfit']">1. Order Logged</p>
                  <p className="text-[11px] text-[#15803D] font-['DM_Sans'] mt-0.5 leading-snug">
                    Equipment reserved in warehouse queue.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="w-7 h-7 rounded-lg bg-[#E2E8F0] text-[#0F172A] flex items-center justify-center shrink-0 mt-0.5">
                  <PhoneCall className="w-4 h-4 text-[#2D6B2F]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0F172A] font-['Outfit']">2. Verification</p>
                  <p className="text-[11px] text-[#64748B] font-['DM_Sans'] mt-0.5 leading-snug">
                    Representative contacts you within 24h.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="w-7 h-7 rounded-lg bg-[#E2E8F0] text-[#64748B] flex items-center justify-center shrink-0 mt-0.5">
                  <Truck className="w-4 h-4 text-[#475569]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0F172A] font-['Outfit']">3. Freight &amp; GST</p>
                  <p className="text-[11px] text-[#64748B] font-['DM_Sans'] mt-0.5 leading-snug">
                    Commercial invoice and live transit link.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Summary: Items List & Delivery Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Items Breakdown */}
            <div className="border border-[#E2E8F0] rounded-xl p-4 bg-[#F8FAFC] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] mb-3">
                  <span className="font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#475569]">
                    Ordered Equipment ({order.items.reduce((acc, i) => acc + i.quantity, 0)})
                  </span>
                  <ShoppingBag className="w-4 h-4 text-[#64748B]" />
                </div>

                <ul className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-start text-xs font-['DM_Sans']">
                      <div className="pr-2 min-w-0">
                        <span className="font-medium text-[#0F172A] block truncate">{item.name}</span>
                        <span className="text-[#64748B]">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="font-['Outfit'] font-bold text-[#0F172A] shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] mt-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#475569]">
                    Estimated Subtotal
                  </span>
                  <span className="font-['Outfit'] text-lg font-bold text-[#15803D]">
                    ₹{order.total.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[10px] text-[#94A3B8] font-['DM_Sans'] mt-0.5">
                  No online payment charged. Freight &amp; GST confirmed on invoice.
                </p>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="border border-[#E2E8F0] rounded-xl p-4 bg-[#F8FAFC] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] mb-3">
                  <span className="font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#475569]">
                    Shipping Destination
                  </span>
                  <MapPin className="w-4 h-4 text-[#64748B]" />
                </div>

                <div className="space-y-2 text-xs font-['DM_Sans'] text-[#334155]">
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Recipient</span>
                    <span className="font-semibold text-[#0F172A]">{order.name}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Primary Contact</span>
                    <span className="font-medium text-[#0F172A]">{order.phone}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Delivery Address</span>
                    <p className="text-[#0F172A] leading-snug">
                      {order.address}, {order.city}, {order.state} - {order.pincode}
                    </p>
                  </div>
                  {order.notes && (
                    <div>
                      <span className="text-[#64748B] block text-[11px]">Instructions</span>
                      <p className="text-[#475569] italic">{order.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#E2E8F0] mt-3 flex items-center gap-1.5 text-[11px] text-[#15803D]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Standard warranty and logistics support included</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20">
          <Button
            type="button"
            variant="outline"
            onClick={handleContinueShopping}
            className="w-full sm:w-auto font-medium text-xs border-[#CBD5E1] text-[#334155] hover:bg-white cursor-pointer"
          >
            Continue Shopping
          </Button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              onClick={handleTrackInAccount}
              className="w-full sm:w-auto font-bold text-xs bg-kb-primary hover:bg-[#145e2e] text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              Track in My Account
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
