import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ChevronDown, LogOut, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useCart } from '../hooks/use-cart';
import { PRODUCTS } from '../data/products';
import type { Page } from '../App';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onCartClick: () => void;
  onCatalog: (query?: string, category?: string) => void;
}

const CATEGORIES = ['All', ...new Set(PRODUCTS.map(product => product.category))];

export default function Navigation({ currentPage, onNavigate, onCartClick, onCatalog }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const productMenu = useRef<HTMLDivElement>(null);
  const productButton = useRef<HTMLButtonElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const userMenu = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!productMenu.current?.contains(event.target as Node)) {
        setProductsOpen(false);
      }
      if (!userMenu.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setProductsOpen(true);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setProductsOpen(false);
    }, 150);
  };

  const navigate = (page: Page) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setMobileOpen(false);
    setProductsOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
    onNavigate(page);
  };

  const browse = (category = 'All') => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setMobileOpen(false);
    setProductsOpen(false);
    setSearchOpen(false);
    onCatalog('', category);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearchOpen(false);
    setMobileOpen(false);
    onCatalog(query);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('home');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1480px] px-3 sm:px-4 lg:px-6 pt-3 sm:pt-3.5">
        <div
          className="pointer-events-auto mx-auto flex h-16 w-full items-center justify-between gap-4 sm:gap-6 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/60 shadow-[0_10px_35px_rgba(0,0,0,0.06)] px-5 sm:px-8"
        >
          <button onClick={() => navigate('home')} aria-label="KitchenBots home" className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kb-tertiary">
            <img src="/images/kitchenbots-logo.svg" alt="KitchenBots" className="h-9 md:h-10 w-auto object-contain" />
          </button>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            <button
              className="nav-link"
              aria-current={currentPage === 'home' ? 'page' : undefined}
              onClick={() => navigate('home')}
            >
              Home
            </button>

            <div
              ref={productMenu}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onFocus={handleMouseEnter}
              onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setProductsOpen(false);
                }
              }}
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  setProductsOpen(false);
                  productButton.current?.focus();
                }
              }}
            >
              <button
                ref={productButton}
                className={`nav-link flex items-center gap-1.5 transition-colors ${productsOpen ? 'text-[#C2410C]' : ''}`}
                aria-expanded={productsOpen}
                aria-haspopup="menu"
                aria-controls="product-menu"
                onClick={() => {
                  if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                  setProductsOpen(open => !open);
                }}
                onKeyDown={event => {
                  if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setProductsOpen(true);
                    requestAnimationFrame(() => {
                      productMenu.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
                    });
                  }
                }}
              >
                Products <ChevronDown size={15} className={`transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`} />
              </button>

              {productsOpen && (
                <div
                  className="absolute left-0 top-full pt-2 z-50"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    id="product-menu"
                    role="menu"
                    aria-label="Product categories"
                    className="w-64 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-xl"
                  >
                    <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Product categories</p>
                    {CATEGORIES.map(category => (
                      <button
                        key={category}
                        role="menuitem"
                        tabIndex={0}
                        className="block w-full rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold text-[#334155] transition-colors hover:bg-[#FFF7ED] hover:text-[#C2410C] focus:bg-[#FFF7ED] focus:text-[#C2410C] focus-visible:outline-none"
                        onClick={() => browse(category)}
                        onKeyDown={event => {
                          if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            const next = (event.currentTarget.nextElementSibling as HTMLButtonElement);
                            if (next && next.getAttribute('role') === 'menuitem') next.focus();
                          } else if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            const prev = (event.currentTarget.previousElementSibling as HTMLButtonElement);
                            if (prev && prev.getAttribute('role') === 'menuitem') {
                              prev.focus();
                            } else {
                              productButton.current?.focus();
                            }
                          }
                        }}
                      >
                        {category === 'All' ? 'All products' : category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              className="nav-link"
              aria-current={currentPage === 'capabilities' ? 'page' : undefined}
              onClick={() => navigate('capabilities')}
            >
              Capabilities
            </button>
            <button
              className="nav-link"
              aria-current={currentPage === 'about' ? 'page' : undefined}
              onClick={() => navigate('about')}
            >
              About
            </button>
            <button
              className="nav-link"
              aria-current={currentPage === 'contact' ? 'page' : undefined}
              onClick={() => navigate('contact')}
            >
              Contact
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              ref={searchButton}
              variant="ghost"
              size="icon"
              className="rounded-xl text-[#334155] hover:text-[#111827] hover:bg-[#F1F5F9]"
              aria-label="Search products"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(open => !open)}
            >
              <Search size={20} />
            </Button>

            {/* Desktop: Account / User Menu */}
            {user ? (
              <div ref={userMenu} className="relative hidden sm:block">
                <Button
                  variant="ghost"
                  className="rounded-xl flex items-center gap-2 text-[#334155] hover:text-[#111827] hover:bg-[#F1F5F9]"
                  onClick={() => setUserMenuOpen(o => !o)}
                  aria-expanded={userMenuOpen}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C2410C] text-white text-xs font-bold uppercase shrink-0">
                    {user.name.charAt(0)}
                  </span>
                  <span className="max-w-[100px] truncate text-sm font-semibold text-[#334155]">{user.name}</span>
                  <ChevronDown size={14} className="text-[#94A3B8]" />
                </Button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 border border-[#E2E8F0] bg-white shadow-xl rounded-xl p-1 z-50">
                    <div className="px-3 py-2 border-b border-[#F1F5F9] mb-1">
                      <p className="text-xs font-bold text-[#111827] truncate">{user.name}</p>
                      <p className="text-[11px] text-[#64748B] truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button asChild variant="ghost" className="hidden rounded-xl sm:flex text-[#334155] hover:text-[#111827] hover:bg-[#F1F5F9]">
                <a
                  href="#login"
                  onClick={(e) => { e.preventDefault(); navigate('login'); }}
                >
                  <User size={18} /> Login
                </a>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl text-[#334155] hover:text-[#111827] hover:bg-[#F1F5F9]"
              onClick={onCartClick}
              aria-label={`View cart, ${totalItems} items`}
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-md bg-[#C2410C] px-1 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl lg:hidden text-[#334155] hover:text-[#111827]"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </Button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="pointer-events-auto absolute right-3 sm:right-6 lg:right-10 top-[calc(100%+8px)] w-[min(560px,calc(100%-1.5rem))] rounded-2xl border border-[#E2E8F0] bg-white/95 backdrop-blur-xl p-4 shadow-2xl">
          <form role="search" className="flex gap-2" onSubmit={submitSearch} onKeyDown={event => {
            if (event.key === 'Escape') {
              setSearchOpen(false);
              searchButton.current?.focus();
            }
          }}>
            <label className="sr-only" htmlFor="navbar-search">Search products</label>
            <input
              ref={searchInput}
              id="navbar-search"
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search grills, rocket stoves, features..."
              className="min-w-0 flex-1 rounded-xl border border-[#CBD5E1] px-4 py-2.5 outline-none font-['DM_Sans'] text-sm focus:border-[#C2410C] focus:ring-1 focus:ring-[#C2410C]"
            />
            <Button type="submit" className="rounded-xl"><Search size={17} /> Search</Button>
          </form>
        </div>
      )}

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-[60] lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}>
        <button
          className={`absolute inset-0 bg-[#0F172A]/40 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
        <div className={`absolute bottom-0 right-0 top-0 w-[min(88%,360px)] bg-white shadow-2xl transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-[#F1F5F9] p-5">
            <img src="/images/kitchenbots-logo.svg" alt="KitchenBots" className="h-10 w-auto" />
            <Button variant="ghost" size="icon" className="rounded-xl text-[#64748B]" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></Button>
          </div>

          {/* Mobile user badge */}
          {user && (
            <div className="mx-4 mt-4 mb-1 flex items-center gap-3 rounded-xl bg-[#FFF7ED] px-4 py-3 border border-[#FED7AA]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C2410C] text-white text-sm font-bold uppercase">
                {user.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#111827] truncate">{user.name}</p>
                <p className="text-[11px] text-[#64748B] truncate">{user.email}</p>
              </div>
            </div>
          )}

          <nav className="flex flex-col gap-1 p-4 font-['DM_Sans']" aria-label="Mobile navigation">
            <button
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${currentPage === 'home' ? 'bg-[#FFF7ED] text-[#C2410C]' : 'text-[#334155] hover:bg-[#F8FAFC]'}`}
              onClick={() => navigate('home')}
            >
              Home
            </button>

            <div className="my-2 border-t border-[#F1F5F9] pt-2">
              <p className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#64748B] font-['Outfit']">Product Categories</p>
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-[#475569] transition-colors hover:bg-[#FFF7ED] hover:text-[#C2410C]"
                  onClick={() => browse(category)}
                >
                  {category === 'All' ? 'All products' : category}
                </button>
              ))}
            </div>

            <div className="border-t border-[#F1F5F9] pt-2">
              <button
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${currentPage === 'capabilities' ? 'bg-[#FFF7ED] text-[#C2410C]' : 'text-[#334155] hover:bg-[#F8FAFC]'}`}
                onClick={() => navigate('capabilities')}
              >
                Capabilities
              </button>
              <button
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${currentPage === 'about' ? 'bg-[#FFF7ED] text-[#C2410C]' : 'text-[#334155] hover:bg-[#F8FAFC]'}`}
                onClick={() => navigate('about')}
              >
                About
              </button>
              <button
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${currentPage === 'contact' ? 'bg-[#FFF7ED] text-[#C2410C]' : 'text-[#334155] hover:bg-[#F8FAFC]'}`}
                onClick={() => navigate('contact')}
              >
                Contact
              </button>
              <button
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors flex items-center justify-between ${currentPage === 'cart' ? 'bg-[#FFF7ED] text-[#C2410C]' : 'text-[#334155] hover:bg-[#F8FAFC]'}`}
                onClick={() => navigate('cart')}
              >
                <span className="flex items-center gap-2.5">
                  <ShoppingBag size={18} /> Cart
                </span>
                {totalItems > 0 && (
                  <span className="rounded-md bg-[#C2410C] px-2 py-0.5 text-[11px] font-bold text-white">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-4 border-t border-[#F1F5F9] pt-4">
              {user ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-xl text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                  onClick={handleLogout}
                >
                  <LogOut size={16} className="mr-2" /> Logout
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full rounded-xl">
                  <a href="#login" onClick={(e) => { e.preventDefault(); navigate('login'); }}>
                    <User size={18} className="mr-2" /> Login / Sign Up
                  </a>
                </Button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
