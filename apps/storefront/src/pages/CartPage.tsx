import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../hooks/use-cart';
import { MIN_ITEM_QUANTITY } from '../context/CartContextData';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle, MapPin, Phone, User, Mail, ChevronUp, X, Loader2, AlertCircle } from 'lucide-react';
import type { Page } from '../App';
import { Button } from '../components/ui/button';
import ProductImage from '../components/ProductImage';
import { submitOrder } from '../lib/api';
import OrderCompletionModal from '../components/OrderCompletionModal';

interface CartPageProps {
  onNavigate: (page: Page) => void;
}

interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
}

interface PlacedOrder {
  orderNumber: string;
  reference: string;
  date: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  totalPaise: number;
  status: string;
}

/**
 * Safely renders configuration values as React content based on runtime type.
 * Prevents errors when objects, arrays, booleans, or nullish values are present.
 */
function renderConfigValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)))
      .join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}


export default function CartPage({ onNavigate }: CartPageProps) {
  const { items, removeFromCart, updateQuantity, clearCart, totalPaise, totalPrice, totalItems } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<PlacedOrder | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<CheckoutForm>>({});
  const [form, setForm] = useState<CheckoutForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });

  // Freeze background scroll and handle Escape key when checkout modal is active
  useEffect(() => {
    if (!showCheckout) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCheckout(false);
        setFormErrors({});
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCheckout]);

  const summaryRef = useRef<HTMLDivElement>(null);
  const [summaryHeight, setSummaryHeight] = useState<number | undefined>(undefined);

  // Equalize cart items list container height with Order Summary sidebar on desktop
  useEffect(() => {
    if (!summaryRef.current) return;
    const updateHeight = () => {
      if (summaryRef.current && window.innerWidth >= 1024) {
        setSummaryHeight(summaryRef.current.offsetHeight);
      } else {
        setSummaryHeight(undefined);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(summaryRef.current);
    window.addEventListener('resize', updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (!Number.isFinite(newQuantity)) return;
    const sanitized = Math.floor(newQuantity);
    if (sanitized < MIN_ITEM_QUANTITY) {
      removeFromCart(id);
    } else {
      updateQuantity(id, sanitized);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<CheckoutForm> = {};
    if (!form.name.trim()) errors.name = 'Customer Name is required';
    if (!form.email.trim()) {
      errors.email = 'Customer Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) errors.phone = 'Enter a valid 10-digit Indian mobile number';
    if (!form.address.trim()) errors.address = 'Address is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (!form.state.trim()) errors.state = 'State is required';
    if (!/^\d{6}$/.test(form.pincode)) errors.pincode = 'Enter a valid 6-digit pincode';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const orderTotalPaise = totalPaise ?? Math.round(totalPrice * 100);

    try {
      const res = await submitOrder({
        customerName: form.name.trim(),
        customerEmail: form.email.trim(),
        customerPhone: form.phone.trim(),
        totalPaise: orderTotalPaise,
        items: items.map((i) => ({
          productId: i.id,
          name: i.name,
          pricePaise: Math.round(i.price * 100),
          quantity: i.quantity,
        })),
        shippingAddress: {
          fullName: form.name.trim(),
          phone: form.phone.trim(),
          addressLine1: form.address.trim(),
          addressLine2: form.notes.trim() || undefined,
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.pincode.trim(),
          country: 'India',
        },
      });

      const order: PlacedOrder = {
        orderNumber: res.orderNumber,
        reference: res.orderNumber,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        notes: form.notes.trim() || undefined,
        items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: totalPrice,
        totalPaise: orderTotalPaise,
        status: 'Order Confirmed',
      };

      clearCart();
      setConfirmedOrder(order);
      setShowCheckout(false);
      setShowSuccessPopup(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to place order right now. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Order Confirmed Screen ───────────────────────────────────────────────
  if (confirmedOrder) {
    return (
      <>
        <OrderCompletionModal
          isOpen={showSuccessPopup}
          order={confirmedOrder}
          onClose={() => setShowSuccessPopup(false)}
          onNavigate={onNavigate}
        />

        <main className="min-h-screen bg-[#FAFAFA] pt-20 sm:pt-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 md:pb-16">
            <div className="max-w-xl mx-auto">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 sm:p-10 shadow-sm text-center">
                <div className="w-16 h-16 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-[#16A34A]" />
                </div>
                <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-[#111827] mb-1">
                  Order Placed Successfully
                </h1>
                <p className="text-[#64748B] font-['DM_Sans'] text-sm mb-6">
                  We will contact you within 24 hours to confirm delivery and logistics details.
                </p>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 text-left mb-6 space-y-3 text-sm font-['DM_Sans']">
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Order Number</span>
                    <span className="font-mono font-bold text-[#0F172A]">{confirmedOrder.orderNumber || confirmedOrder.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Date</span>
                    <span className="text-[#0F172A]">{confirmedOrder.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Customer Name</span>
                    <span className="text-[#0F172A] font-medium">{confirmedOrder.name}</span>
                  </div>
                  {confirmedOrder.email && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Customer Email</span>
                      <span className="text-[#0F172A]">{confirmedOrder.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Customer Phone</span>
                    <span className="text-[#0F172A]">{confirmedOrder.phone}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#64748B] shrink-0">Delivery to</span>
                    <span className="text-[#0F172A] text-right">{confirmedOrder.address}, {confirmedOrder.city}, {confirmedOrder.state} - {confirmedOrder.pincode}</span>
                  </div>
                  {confirmedOrder.notes && (
                    <div className="flex justify-between gap-4">
                      <span className="text-[#64748B] shrink-0">Order notes</span>
                      <span className="text-[#475569] text-right italic">{confirmedOrder.notes}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#E2E8F0]">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#475569]">Total Paise</span>
                      <span className="text-[#111827] font-['Outfit'] text-base">{(confirmedOrder.totalPaise ?? Math.round(confirmedOrder.total * 100)).toLocaleString('en-IN')} paise (₹{confirmedOrder.total.toLocaleString('en-IN')})</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1">Final amount confirmed on invoice. GST &amp; delivery calculated separately.</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Button
                    onClick={() => setShowSuccessPopup(true)}
                    variant="outline"
                    className="w-full rounded-xl font-bold border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC]"
                    size="lg"
                  >
                    View Order Confirmation Popup
                  </Button>
                  <Button
                    onClick={() => onNavigate('login')}
                    className="w-full rounded-xl font-bold bg-kb-primary hover:bg-[#145e2e] text-white"
                    size="lg"
                  >
                    Track Order in My Account
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => onNavigate('products')}
                    className="w-full rounded-xl font-medium text-[#64748B] hover:text-[#0F172A]"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ─── Empty Cart ───────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] pt-20 sm:pt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 md:pb-16">
          <div className="max-w-lg mx-auto bg-white border border-[#E2E8F0] rounded-xl p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl flex items-center justify-center mx-auto mb-5 text-kb-primary">
              <ShoppingBag className="w-8 h-8" aria-hidden="true" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] font-['Outfit'] mb-2">
              Your cart is empty
            </h1>
            <p className="text-[#64748B] text-sm sm:text-base font-['DM_Sans'] mb-8">
              You have not added any products yet. Browse our grills, rocket stoves, and cooking equipment to get started.
            </p>
            <Button
              onClick={() => onNavigate('products')}
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto bg-kb-primary hover:bg-[#145e2e] text-white focus-visible:ring-2 focus-visible:ring-kb-primary focus-visible:ring-offset-2"
            >
              Browse Products
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ─── Cart with items ──────────────────────────────────────────────────────
  return (
    <main
      className={`min-h-screen bg-[#FAFAFA] pt-20 sm:pt-22 transition-opacity duration-300 ${
        showCheckout ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'
      }`}
      aria-hidden={showCheckout}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-8 sm:pb-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="hover:text-[#111827] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kb-primary rounded px-1.5 py-2 min-h-[44px] inline-flex items-center"
          >
            Home
          </button>
          <span aria-hidden="true" className="text-[#CBD5E1]">/</span>
          <button
            type="button"
            onClick={() => onNavigate('products')}
            className="hover:text-[#111827] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kb-primary rounded px-1.5 py-2 min-h-[44px] inline-flex items-center"
          >
            Products
          </button>
          <span aria-hidden="true" className="text-[#CBD5E1]">/</span>
          <span className="text-[#111827] px-1.5 py-2 min-h-[44px] inline-flex items-center" aria-current="page">
            Cart
          </span>
        </nav>

        {/* Page Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#E2E8F0] pb-5">
          <div>
            <h1 className="font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111827]">
              Shopping Cart
            </h1>
            <p className="mt-1 text-sm text-[#64748B] font-['DM_Sans']">
              Review your items, then place an order or request a commercial quote.
            </p>
          </div>
          <span className="text-sm font-medium text-[#64748B] shrink-0">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <section
            aria-label="Cart items"
            style={summaryHeight ? { maxHeight: `${summaryHeight}px` } : undefined}
            className="lg:col-span-2 max-h-[460px] overflow-y-auto pr-2 sm:pr-3 space-y-2.5 sm:space-y-3 thin-scrollbar"
          >
            {items.map((item) => {
              const itemSubtotal = item.price * item.quantity;
              const hasConfig = Boolean(
                item.configuration &&
                typeof item.configuration === 'object' &&
                Object.keys(item.configuration).length > 0
              );

              return (
                <article
                  key={item.id}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row gap-3 sm:gap-4 shadow-xs hover:border-[#CBD5E1] transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9] p-1.5 sm:p-2 shrink-0 flex items-center justify-center overflow-hidden mx-auto sm:mx-0">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
                        <h2 className="font-['Outfit'] text-sm sm:text-base font-bold text-[#111827] leading-snug break-words min-w-0">
                          {item.name}
                        </h2>
                        <div className="text-left sm:text-right shrink-0">
                          <span className="font-['Outfit'] text-sm sm:text-base font-bold text-[#111827] whitespace-nowrap">
                            ₹{itemSubtotal.toLocaleString('en-IN')}
                          </span>
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-[#64748B] whitespace-nowrap">
                              ₹{item.price.toLocaleString('en-IN')} each
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Product Configuration Display (if supported) */}
                      {hasConfig && item.configuration && (
                        <div className="mt-1.5 text-xs text-[#64748B] space-y-0.5 bg-[#F8FAFC] border border-[#F1F5F9] rounded-md p-2">
                          <span className="font-semibold text-[#475569] uppercase tracking-wider text-[10px]">
                            Configuration:
                          </span>
                          <div className="space-y-0.5 mt-0.5">
                            {Object.entries(item.configuration).map(([key, val]) => (
                              <div key={key} className="flex flex-wrap items-baseline gap-1.5 text-xs break-words">
                                <span className="font-medium text-[#475569] shrink-0">{key}:</span>
                                <span className="text-[#1E293B] break-all">{renderConfigValue(val)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quantity & Removal Controls */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F1F5F9]">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-[#64748B]">Qty:</span>
                          <div className="flex items-center border border-[#CBD5E1] rounded-lg bg-[#F8FAFC] overflow-hidden h-8">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= MIN_ITEM_QUANTITY}
                              aria-label={`Decrease quantity of ${item.name}`}
                              title={item.quantity <= MIN_ITEM_QUANTITY ? `Minimum order is ${MIN_ITEM_QUANTITY} units` : undefined}
                              className="w-8 h-full flex items-center justify-center text-[#475569] hover:text-[#111827] hover:bg-[#E2E8F0] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kb-primary disabled:opacity-40 disabled:cursor-not-allowed hover:disabled:bg-transparent hover:disabled:text-[#475569]"
                            >
                              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <span
                              aria-label={`Current quantity: ${item.quantity}`}
                              className="w-8 text-center font-['Outfit'] text-xs font-semibold text-[#111827] select-none"
                            >
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              aria-label={`Increase quantity of ${item.name}`}
                              className="w-8 h-full flex items-center justify-center text-[#475569] hover:text-[#111827] hover:bg-[#E2E8F0] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kb-primary"
                            >
                              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] h-8 px-2.5 text-xs font-medium gap-1 focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Order Summary Sidebar */}
          <aside aria-label="Order summary" className="lg:col-span-1">
            <div ref={summaryRef} className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-xs lg:sticky lg:top-28">
              <h2 className="font-['Outfit'] text-xl font-bold text-[#111827] mb-5">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-[#475569]">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                  <span className="font-['Outfit'] font-semibold text-[#111827]">
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#475569]">
                  <span>Shipping &amp; freight</span>
                  <span className="font-medium text-[#1E293B]">On invoice</span>
                </div>
                <div className="flex justify-between items-center text-[#475569]">
                  <span>Taxes &amp; GST</span>
                  <span className="font-medium text-[#1E293B]">On invoice</span>
                </div>

                <div className="h-px bg-[#E2E8F0] my-4" />

                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <span className="font-['Outfit'] text-base font-bold text-[#111827] block">
                      Total Paise
                    </span>
                    <span className="text-[11px] text-[#64748B] font-['DM_Sans']">
                      {(Math.round(totalPrice * 100)).toLocaleString('en-IN')} paise
                    </span>
                  </div>
                  <span className="font-['Outfit'] text-2xl font-bold text-[#111827]">
                    ₹{totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#92400E] leading-relaxed">
                Prices in INR. Final freight, taxes, and GST are confirmed on invoice.
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <Button
                  onClick={() => setShowCheckout(true)}
                  size="lg"
                  className="w-full text-base font-bold flex items-center justify-center gap-2 bg-kb-primary hover:bg-[#145e2e] text-white focus-visible:ring-2 focus-visible:ring-kb-primary focus-visible:ring-offset-2"
                >
                  Place Order
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>

                <Button
                  onClick={() => onNavigate('bulk-enquiry')}
                  variant="outline"
                  size="default"
                  className="w-full text-sm font-medium border-[#CBD5E1] focus-visible:ring-2 focus-visible:ring-kb-primary focus-visible:ring-offset-2"
                >
                  Request Commercial Quote
                </Button>
              </div>
            </div>
          </aside>
        </div>

        {/* ─── Direct Checkout Panel Modal ─────────────────────────────────────── */}
        {showCheckout && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 overscroll-contain animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Delivery Details"
          >
            {/* Backdrop: Hides and obscures background, covering header and floating buttons */}
            <div
              className="fixed inset-0 bg-[#0B0F19]/85 backdrop-blur-md transition-opacity duration-300 touch-none"
              onClick={() => { setShowCheckout(false); setFormErrors({}); }}
              aria-hidden="true"
            />

            <div
              className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh] overscroll-contain animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F1F5F9]">
                <div>
                  <h2 className="font-['Outfit'] text-xl font-bold text-[#111827]">Delivery Details</h2>
                  <p className="text-xs text-[#64748B] font-['DM_Sans'] mt-0.5">
                    No payment required now. We will contact you to confirm.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowCheckout(false); setFormErrors({}); }}
                  className="text-[#94A3B8] hover:text-[#475569] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors"
                  aria-label="Close checkout"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Order mini-summary */}
              <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#F1F5F9]">
                <div className="flex justify-between items-baseline text-sm font-['DM_Sans']">
                  <div>
                    <span className="font-['Outfit'] font-bold text-xs uppercase tracking-wider text-[#64748B] block">Total Paise</span>
                    <span className="text-[#64748B] text-xs">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-['Outfit'] font-bold text-[#111827]">{(Math.round(totalPrice * 100)).toLocaleString('en-IN')} paise</span>
                    <span className="block text-[11px] text-[#64748B]">₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <ul className="mt-2 space-y-1">
                  {items.map((i) => (
                    <li key={i.id} className="text-xs text-[#475569]">
                      {i.name} × {i.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Form */}
              <form onSubmit={handlePlaceOrder} className="px-6 py-5 space-y-4" noValidate>
                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]" htmlFor="co-name">
                    Customer Name <span className="text-[#C2410C]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                    <input
                      id="co-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Your full name"
                      className={`h-11 w-full rounded-xl border pl-10 pr-4 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors focus:ring-1 ${formErrors.name ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#CBD5E1] focus:border-[#C2410C] focus:ring-[#C2410C]'}`}
                    />
                  </div>
                  {formErrors.name && <p className="text-xs text-[#DC2626]">{formErrors.name}</p>}
                </div>

                {/* Customer Email */}
                <div className="space-y-1">
                  <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]" htmlFor="co-email">
                    Customer Email <span className="text-[#C2410C]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                    <input
                      id="co-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="e.g. procurement@restaurant.com"
                      className={`h-11 w-full rounded-xl border pl-10 pr-4 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors focus:ring-1 ${formErrors.email ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#CBD5E1] focus:border-[#C2410C] focus:ring-[#C2410C]'}`}
                    />
                  </div>
                  {formErrors.email && <p className="text-xs text-[#DC2626]">{formErrors.email}</p>}
                </div>

                {/* Customer Phone */}
                <div className="space-y-1">
                  <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]" htmlFor="co-phone">
                    Customer Phone <span className="text-[#C2410C]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                    <input
                      id="co-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="10-digit mobile number"
                      className={`h-11 w-full rounded-xl border pl-10 pr-4 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors focus:ring-1 ${formErrors.phone ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#CBD5E1] focus:border-[#C2410C] focus:ring-[#C2410C]'}`}
                    />
                  </div>
                  {formErrors.phone && <p className="text-xs text-[#DC2626]">{formErrors.phone}</p>}
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]" htmlFor="co-address">
                    Street Address <span className="text-[#C2410C]">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 text-[#94A3B8]" size={16} />
                    <textarea
                      id="co-address"
                      required
                      autoComplete="street-address"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="Door no., street, locality"
                      rows={2}
                      className={`w-full rounded-xl border pl-10 pr-4 py-2.5 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors resize-none focus:ring-1 ${formErrors.address ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#CBD5E1] focus:border-[#C2410C] focus:ring-[#C2410C]'}`}
                    />
                  </div>
                  {formErrors.address && <p className="text-xs text-[#DC2626]">{formErrors.address}</p>}
                </div>

                {/* City / State / Pincode */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]" htmlFor="co-city">
                      City <span className="text-[#C2410C]">*</span>
                    </label>
                    <input
                      id="co-city"
                      type="text"
                      required
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="City"
                      className={`h-11 w-full rounded-xl border px-4 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors focus:ring-1 ${formErrors.city ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#CBD5E1] focus:border-[#C2410C] focus:ring-[#C2410C]'}`}
                    />
                    {formErrors.city && <p className="text-xs text-[#DC2626]">{formErrors.city}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]" htmlFor="co-pincode">
                      Pincode <span className="text-[#C2410C]">*</span>
                    </label>
                    <input
                      id="co-pincode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      autoComplete="postal-code"
                      value={form.pincode}
                      onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      placeholder="6-digit code"
                      className={`h-11 w-full rounded-xl border px-4 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors focus:ring-1 ${formErrors.pincode ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#CBD5E1] focus:border-[#C2410C] focus:ring-[#C2410C]'}`}
                    />
                    {formErrors.pincode && <p className="text-xs text-[#DC2626]">{formErrors.pincode}</p>}
                  </div>
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]" htmlFor="co-state">
                    State <span className="text-[#C2410C]">*</span>
                  </label>
                  <input
                    id="co-state"
                    type="text"
                    required
                    autoComplete="address-level1"
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    placeholder="State"
                    className={`h-11 w-full rounded-xl border px-4 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors focus:ring-1 ${formErrors.state ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#CBD5E1] focus:border-[#C2410C] focus:ring-[#C2410C]'}`}
                  />
                  {formErrors.state && <p className="text-xs text-[#DC2626]">{formErrors.state}</p>}
                </div>

                {/* Notes (optional) */}
                <div className="space-y-1">
                  <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]" htmlFor="co-notes">
                    Order Notes <span className="text-[#94A3B8] normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="co-notes"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Special delivery instructions, preferred contact time, etc."
                    rows={2}
                    className="w-full rounded-xl border border-[#CBD5E1] px-4 py-2.5 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors resize-none focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]"
                  />
                </div>

                {submitError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-[#991B1B] text-xs font-['DM_Sans']">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p>{submitError}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-[#F1F5F9]">
                  <p className="text-xs text-[#64748B] font-['DM_Sans'] mb-4 leading-relaxed">
                    By placing this order, you agree to our{' '}
                    <button type="button" onClick={() => onNavigate('policies')} className="underline text-[#C2410C]">
                      shipping and warranty terms
                    </button>
                    . No advance payment required.
                  </p>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full font-bold rounded-xl bg-kb-primary hover:bg-[#145e2e] text-white disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Confirming Order...
                      </>
                    ) : (
                      <>
                        Confirm Order
                        <ChevronUp className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </main>
  );
}
