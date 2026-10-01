import { useState } from 'react';
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Mail,
  Lock,
  Building2,
  LogOut,
  Clock,
  Wrench,
  PhoneCall,
  User,
  ShoppingBag,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import type { Page } from '../App';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (page: Page) => void;
}

interface UserAccount {
  name: string;
  email: string;
  company: string;
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

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const { showToast } = useToast();
  const { login, logout } = useAuth();
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Load existing session if any
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem('kb_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          name: parsed.name || 'Customer',
          email: parsed.email || '',
          company: parsed.company || 'Direct Customer',
        };
      }
      return null;
    } catch {
      return null;
    }
  });

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

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = loginEmail.trim() || 'operator@commercialkitchens.in';
    const namePart = emailToUse.split('@')[0];
    const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    
    const account: UserAccount = {
      name: capitalized,
      email: emailToUse,
      company: 'Direct Customer',
    };

    login(account.email, account.name);
    setCurrentUser(account);
    showToast(`Welcome back, ${account.name}!`);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const account: UserAccount = {
      name: signupName.trim() || 'Kitchen Customer',
      email: signupEmail.trim() || 'customer@kitchenbots.in',
      company: signupCompany.trim() || 'Direct Customer',
    };

    login(account.email, account.name);
    setCurrentUser(account);
    showToast(`Account created for ${account.name}!`);
  };

  const handleSignOut = () => {
    logout();
    setCurrentUser(null);
    showToast('Signed out successfully');
  };

  const handleDemoSignIn = () => {
    const demoAccount: UserAccount = {
      name: 'Operations Director',
      email: 'operations@commercialkitchens.in',
      company: 'AeroBake Commercial Facilities',
    };
    login(demoAccount.email, demoAccount.name);
    setCurrentUser(demoAccount);
    showToast('Signed in with Demo Engineering Account');
  };

  // If user is logged in, show the Customer Portal
  if (currentUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-28">
        <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-12">
          {/* Header Profile Bar */}
          <div className="flex flex-col justify-between gap-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0F172A] text-white">
                <User size={26} className="text-[#C2410C]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-['Outfit'] text-2xl font-bold text-[#0F172A]">{currentUser.name}</h1>
                  <span className="rounded-md bg-[#F0FDF4] px-2 py-0.5 text-xs font-bold text-[#16A34A] border border-[#DCFCE7]">
                    Verified Customer
                  </span>
                </div>
                <p className="mt-1 font-['DM_Sans'] text-sm text-[#64748B]">
                  {currentUser.email} • {currentUser.company}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
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

          {/* Quick Action Navigation */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              onClick={() => onNavigate('cart')}
              className="flex items-start gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 text-left transition-all hover:border-[#CBD5E1] hover:shadow-sm"
            >
              <div className="rounded-xl bg-[#F8FAFC] p-3 text-[#0F172A] border border-[#E2E8F0]">
                <Clock size={22} />
              </div>
              <div>
                <h3 className="font-['Outfit'] text-base font-bold text-[#0F172A]">Current Cart</h3>
                <p className="mt-1 font-['DM_Sans'] text-xs text-[#64748B]">Review selected hardware and finalize purchase order.</p>
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
          <div className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm">
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
                  Browse Products
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

  // If not logged in, render minimal, premium Sign In / Create Account container
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-28">
      <div className="mx-auto w-full max-w-[960px] px-6">
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] md:grid md:grid-cols-[380px_1fr]">

          {/* LEFT SIDE - BRANDING */}
          <div className="flex flex-col justify-between bg-[#0F172A] p-8 text-white md:p-10">
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/15">
                <ShieldCheck size={24} className="text-[#C2410C]" />
              </div>
              <h1 className="font-['Outfit'] text-2xl font-bold leading-tight text-white md:text-3xl">
                Customer & Commercial Orders Portal
              </h1>
              <p className="mt-4 font-['DM_Sans'] text-sm leading-relaxed text-slate-300">
                Track order shipments, review equipment quotations, and coordinate directly with KitchenBots engineering.
              </p>
            </div>

            <div className="mt-10 border-t border-white/10 pt-6">
              <p className="font-['DM_Sans'] text-xs text-slate-400">
                Direct commercial sales & tech support:
              </p>
              <p className="mt-1 font-['DM_Sans'] text-sm font-semibold text-white">
                +91 94907 01421 • info@kitchenbots.in
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - FORM */}
          <div className="p-8 sm:p-10 md:p-12">
            {/* TABS */}
            <div className="mb-8 flex gap-8 border-b border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`relative pb-3 font-['Outfit'] text-sm font-bold uppercase tracking-wider transition-colors ${
                  activeTab === 'login' ? 'text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#0F172A]'
                }`}
              >
                Sign In
                {activeTab === 'login' && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#C2410C] rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className={`relative pb-3 font-['Outfit'] text-sm font-bold uppercase tracking-wider transition-colors ${
                  activeTab === 'signup' ? 'text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#0F172A]'
                }`}
              >
                Create Account
                {activeTab === 'signup' && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#C2410C] rounded-full" />
                )}
              </button>
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={17} />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@organization.com"
                      className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-4 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => onNavigate('forgot-password')}
                      className="font-['DM_Sans'] text-xs font-semibold text-[#C2410C] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={17} />
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-10 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                      aria-label={showLoginPass ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full rounded-xl font-semibold">
                  Sign In to Portal <ArrowRight size={17} className="ml-1.5" />
                </Button>

                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E2E8F0]" />
                  </div>
                  <span className="relative bg-white px-2 text-xs text-[#94A3B8] font-['DM_Sans']">or</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDemoSignIn}
                  className="w-full rounded-xl border-[#CBD5E1] font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  Quick Sign In with Demo Account
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Enter full name"
                    className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Organization or City (Optional)
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={17} />
                    <input
                      type="text"
                      value={signupCompany}
                      onChange={(e) => setSignupCompany(e.target.value)}
                      placeholder="Company, restaurant, or city"
                      className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-4 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={17} />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="name@organization.com"
                      className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-4 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-['Outfit'] text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={17} />
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-4 font-['DM_Sans'] text-sm text-[#0F172A] outline-none transition-colors focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full rounded-xl font-semibold">
                  Create Commercial Account <ArrowRight size={17} className="ml-1.5" />
                </Button>

                <p className="pt-1 text-center font-['DM_Sans'] text-xs text-[#94A3B8]">
                  By registering, you agree to our commercial warranty and privacy terms.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
