import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Building2,
  ShieldCheck,
  LogOut,
  ShoppingBag,
  FileText,
  Clock,
  Wrench,
  PhoneCall,
  ArrowRight,
  Shield
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import type { Page } from '../App';
import { useAuth } from '../context/AuthContext';

interface ProfilePageProps {
  onNavigate: (page: Page) => void;
  scrollToOrders?: boolean;
}

interface StoredEnquiry {
  reference: string;
  date: string;
  name: string;
  company: string;
  items: string[];
  status: string;
}

interface StoredOrder {
  reference: string;
  date: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
}

export default function ProfilePage({ onNavigate, scrollToOrders }: ProfilePageProps) {
  const { showToast } = useToast();
  const { user, logout } = useAuth();

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      onNavigate('login');
    }
  }, [user, onNavigate]);

  useEffect(() => {
    if (scrollToOrders || window.location.pathname === '/orders') {
      const el = document.getElementById('direct-orders-section');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [scrollToOrders]);

  // Load stored customer enquiries
  const [enquiries] = useState<StoredEnquiry[]>(() => {
    try {
      const stored = localStorage.getItem('kb_enquiries');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Load placed direct orders
  const [orders] = useState<StoredOrder[]>(() => {
    try {
      const stored = localStorage.getItem('kb_orders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleSignOut = () => {
    logout();
    showToast('Signed out successfully');
    onNavigate('home');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-28 flex items-center justify-center">
        <p className="font-['DM_Sans'] text-sm text-[#64748B]">Redirecting to login...</p>
      </div>
    );
  }

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-28">
      <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-12">
        {/* Header Profile Bar */}
        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#C2410C] text-white font-['Outfit'] text-2xl font-bold uppercase shadow-sm">
              {initial}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-['Outfit'] text-2xl font-bold text-[#0F172A]">{user.name}</h1>
                <span className="rounded-md bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-bold text-[#16A34A] border border-[#DCFCE7]">
                  Verified Account
                </span>
                {user.role && (
                  <span className="rounded-md bg-[#FFF7ED] px-2.5 py-0.5 text-xs font-mono font-bold uppercase text-[#C2410C] border border-[#FFEDD5]">
                    {user.role}
                  </span>
                )}
              </div>
              <p className="mt-1 font-['DM_Sans'] text-sm text-[#64748B]">
                {user.email} {user.company ? `• ${user.company}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(user.role === 'admin' || user.role === 'operations') && (
              <a
                href="/admin"
                className="flex items-center gap-2 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] px-4 py-2.5 text-sm font-semibold text-[#C2410C] hover:bg-[#FFEDD5] transition-colors"
              >
                <ShieldCheck size={16} /> Admin Operations
              </a>
            )}
            <Button
              variant="outline"
              className="rounded-xl border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]"
              onClick={() => onNavigate('bulk-enquiry')}
            >
              <FileText size={16} className="mr-1.5 text-[#C2410C]" /> New Enquiry
            </Button>
            <Button
              variant="ghost"
              className="rounded-xl text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2]"
              onClick={handleSignOut}
            >
              <LogOut size={16} className="mr-1.5" /> Sign out
            </Button>
          </div>
        </div>

        {/* User Info & Details Card */}
        <div className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="font-['Outfit'] text-lg font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-4">
            Account Details
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3 rounded-xl bg-[#F8FAFC] p-4 border border-[#F1F5F9]">
              <div className="rounded-lg bg-white p-2.5 text-[#C2410C] border border-[#E2E8F0] shadow-2xs">
                <User size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-['Outfit'] text-xs font-bold uppercase text-[#64748B]">Full Name</p>
                <p className="mt-0.5 font-['DM_Sans'] text-sm font-semibold text-[#0F172A] truncate">{user.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-[#F8FAFC] p-4 border border-[#F1F5F9]">
              <div className="rounded-lg bg-white p-2.5 text-[#C2410C] border border-[#E2E8F0] shadow-2xs">
                <Mail size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-['Outfit'] text-xs font-bold uppercase text-[#64748B]">Email Address</p>
                <p className="mt-0.5 font-['DM_Sans'] text-sm font-semibold text-[#0F172A] truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-[#F8FAFC] p-4 border border-[#F1F5F9]">
              <div className="rounded-lg bg-white p-2.5 text-[#C2410C] border border-[#E2E8F0] shadow-2xs">
                <Shield size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-['Outfit'] text-xs font-bold uppercase text-[#64748B]">Account Role</p>
                <p className="mt-0.5 font-['DM_Sans'] text-sm font-semibold text-[#0F172A] capitalize">
                  {user.role || 'Customer'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-[#F8FAFC] p-4 border border-[#F1F5F9]">
              <div className="rounded-lg bg-white p-2.5 text-[#C2410C] border border-[#E2E8F0] shadow-2xs">
                <Building2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-['Outfit'] text-xs font-bold uppercase text-[#64748B]">Organization / Company</p>
                <p className="mt-0.5 font-['DM_Sans'] text-sm font-semibold text-[#0F172A] truncate">
                  {user.company || 'Direct Customer'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => onNavigate('products')}
            className="flex items-start gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 text-left transition-all hover:border-[#CBD5E1] hover:shadow-sm"
          >
            <div className="rounded-xl bg-[#FFF7ED] p-3 text-[#C2410C]">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h3 className="font-['Outfit'] text-base font-bold text-[#0F172A]">Equipment Catalog</h3>
              <p className="mt-1 font-['DM_Sans'] text-xs text-[#64748B]">Browse Santa Maria grills, rocket stoves & rotisseries.</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('bulk-enquiry')}
            className="flex items-start gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 text-left transition-all hover:border-[#CBD5E1] hover:shadow-sm"
          >
            <div className="rounded-xl bg-[#F0FDF4] p-3 text-[#16A34A]">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="font-['Outfit'] text-base font-bold text-[#0F172A]">Request Quote</h3>
              <p className="mt-1 font-['DM_Sans'] text-xs text-[#64748B]">Submit custom specifications and multi-unit requirements.</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('contact')}
            className="flex items-start gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 text-left transition-all hover:border-[#CBD5E1] hover:shadow-sm"
          >
            <div className="rounded-xl bg-[#EFF6FF] p-3 text-[#2563EB]">
              <Wrench size={22} />
            </div>
            <div>
              <h3 className="font-['Outfit'] text-base font-bold text-[#0F172A]">Engineering Desk</h3>
              <p className="mt-1 font-['DM_Sans'] text-xs text-[#64748B]">Speak with production engineers for custom sizing.</p>
            </div>
          </button>
        </div>

        {/* Machinery Enquiries & Tracking Section */}
        <div className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-[#F1F5F9] pb-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-['Outfit'] text-xl font-bold text-[#0F172A]">Equipment Enquiries & Quotations</h2>
              <p className="mt-1 font-['DM_Sans'] text-sm text-[#64748B]">
                Track production status, engineering reviews, and quotations submitted under this account.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="self-start rounded-xl font-semibold sm:self-auto border-[#CBD5E1] hover:bg-[#F8FAFC]"
              onClick={() => onNavigate('bulk-enquiry')}
            >
              Submit New Request
            </Button>
          </div>

          {enquiries.length > 0 ? (
            <div className="mt-6 space-y-4">
              {enquiries.map((enq) => (
                <div
                  key={enq.reference}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 transition-all md:flex-row md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[#0F172A]">{enq.reference}</span>
                      <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold text-[#92400E]">
                        {enq.status || 'Under Engineering Review'}
                      </span>
                      <span className="text-xs text-[#94A3B8]">{enq.date}</span>
                    </div>
                    <p className="mt-2 font-['DM_Sans'] text-sm text-[#475569]">
                      <span className="font-semibold text-[#0F172A]">Equipment:</span> {enq.items?.join(', ') || 'Custom Kitchen Equipment'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg border-[#CBD5E1] bg-white text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9]"
                      onClick={() => onNavigate('contact')}
                    >
                      <PhoneCall size={14} className="mr-1.5 text-[#C2410C]" /> Contact Desk
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-[#CBD5E1] bg-[#FAFAFA] p-8 text-center sm:p-12">
              <Clock size={36} className="mx-auto text-[#94A3B8]" />
              <h3 className="mt-3 font-['Outfit'] text-lg font-bold text-[#0F172A]">No active equipment enquiries</h3>
              <p className="mx-auto mt-2 max-w-md font-['DM_Sans'] text-sm text-[#64748B]">
                Submit a bulk enquiry or equipment consultation to track specifications, engineering review status, and manufacturing schedules here.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button className="rounded-xl font-semibold" onClick={() => onNavigate('bulk-enquiry')}>
                  Request Bulk Quotation
                </Button>
                <Button variant="outline" className="rounded-xl border-[#CBD5E1] font-semibold" onClick={() => onNavigate('products')}>
                  Browse Catalog
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Direct Orders Tracking Section */}
        <div id="direct-orders-section" className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-[#F1F5F9] pb-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-['Outfit'] text-xl font-bold text-[#0F172A]">Direct Orders</h2>
              <p className="mt-1 font-['DM_Sans'] text-sm text-[#64748B]">
                Orders placed directly from your cart. We will contact you to confirm delivery.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="self-start rounded-xl font-semibold sm:self-auto border-[#CBD5E1] hover:bg-[#F8FAFC]"
              onClick={() => onNavigate('cart')}
            >
              Go to Cart
            </Button>
          </div>

          {orders.length > 0 ? (
            <div className="mt-6 space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.reference}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 transition-all md:flex-row md:items-start"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[#0F172A]">{ord.reference}</span>
                      <span className="rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-semibold text-[#16A34A] border border-[#DCFCE7]">
                        {ord.status || 'Order Confirmed'}
                      </span>
                      <span className="text-xs text-[#94A3B8]">{ord.date}</span>
                    </div>
                    <p className="mt-2 font-['DM_Sans'] text-sm text-[#475569]">
                      <span className="font-semibold text-[#0F172A]">Items:</span>{' '}
                      {ord.items?.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                    </p>
                    <p className="mt-1 font-['DM_Sans'] text-sm text-[#475569]">
                      <span className="font-semibold text-[#0F172A]">Delivery to:</span>{' '}
                      {ord.city}, {ord.state} - {ord.pincode}
                    </p>
                    <p className="mt-1 font-['Outfit'] text-sm font-bold text-[#0F172A]">
                      ₹{ord.total?.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg border-[#CBD5E1] bg-white text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9]"
                      onClick={() => onNavigate('contact')}
                    >
                      <PhoneCall size={14} className="mr-1.5 text-[#C2410C]" /> Contact Desk
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-[#CBD5E1] bg-[#FAFAFA] p-8 text-center sm:p-10">
              <ShoppingBag size={32} className="mx-auto text-[#94A3B8]" />
              <h3 className="mt-3 font-['Outfit'] text-base font-bold text-[#0F172A]">No direct orders yet</h3>
              <p className="mx-auto mt-2 max-w-sm font-['DM_Sans'] text-sm text-[#64748B]">
                Add products to your cart and place a direct order to track them here.
              </p>
              <Button className="mt-5 rounded-xl font-semibold" onClick={() => onNavigate('products')}>
                Browse Products <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Warranty & Engineering Support Card */}
        <div className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-['Outfit'] text-lg font-bold text-[#0F172A]">Commercial Warranty & Technical Support</h3>
              <p className="mt-1.5 max-w-2xl font-['DM_Sans'] text-sm text-[#64748B]">
                All KitchenBots commercial equipment includes our standard 1-year commercial warranty, parts replacement, and direct telephone support from Hyderabad fabrication engineers.
              </p>
              <p className="mt-3 font-['DM_Sans'] text-sm font-semibold text-[#0F172A]">
                Hotline: +91 94907 01421 • Email: info@kitchenbots.in
              </p>
            </div>
            <Button
              variant="outline"
              className="shrink-0 rounded-xl border-[#CBD5E1] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
              onClick={() => onNavigate('contact')}
            >
              <Wrench size={16} className="mr-1.5 text-[#C2410C]" /> Request Tech Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
