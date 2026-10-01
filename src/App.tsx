import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import HeroSection from './sections/HeroSection';
import ProductFleetSection from './sections/ProductFleetSection';
import CategorySection from './components/CategorySection';
import CategoriesContactSection from './sections/CategoriesContactSection';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import PoliciesPage from './pages/PoliciesPage';
import CapabilitiesPage from './pages/CapabilitiesPage';
import BulkEnquiryPage from './pages/BulkEnquiryPage';
import CartDrawer from './components/CartDrawer';
import MobileStickyCart from './components/MobileStickyCart';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import WishlistPage from './pages/WishlistPage';

import SEOHead from './components/SEOHead';
import { PAGE_SEO, getProductSEO } from './lib/seo';
import { getProductById } from './data/products';
import './App.css';

import BlogPage from './pages/BlogPage';
import CartPage from './pages/CartPage';

gsap.registerPlugin(ScrollTrigger);

export type Page = 'home' | 'products' | 'product-detail' | 'contact' | 'about' | 'policies' | 'capabilities' | 'blog' | 'login' | 'forgot-password' | 'cart' | 'wishlist' | 'bulk-enquiry';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [catalogKey, setCatalogKey] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Sync state with URL on initial load and back/forward
  useEffect(() => {
    const handleLocationChange = () => {
      setSelectedProductId(new URLSearchParams(window.location.search).get('id'));
      setCatalogKey(key => key + 1);
      const rawPath = window.location.pathname.replace('/', '');
      const path = rawPath as Page;
      const validPages: Page[] = ['home', 'products', 'product-detail', 'contact', 'about', 'policies', 'capabilities', 'blog', 'login', 'forgot-password', 'cart', 'wishlist', 'bulk-enquiry'];
      
      if (rawPath === '' || rawPath === 'home') {
        setCurrentPage('home');
      } else if (validPages.includes(path)) {
        setCurrentPage(path);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    // Reveal animation observer
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    // Scroll to top visibility
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      revealElements.forEach(el => observer.unobserve(el));
    };
  }, [currentPage]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const navigateTo = (page: Page, productId?: string) => {
    setCurrentPage(page);
    if (productId) {
      setSelectedProductId(productId);
    }
    const path = page === 'home'
      ? '/'
      : page === 'product-detail' && productId
        ? `/product-detail?${new URLSearchParams({ id: productId })}`
        : `/${page}`;
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };

  const browseCatalog = (query = '', category = 'All') => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category !== 'All') params.set('category', category);
    window.history.pushState({}, '', `/products${params.size ? `?${params}` : ''}`);
    setCurrentPage('products');
    setCatalogKey(key => key + 1);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'capabilities':
        return <CapabilitiesPage onNavigate={navigateTo} />;
      case 'blog':
        return <BlogPage />;
      case 'products':
        return <ProductsPage key={catalogKey} onProductClick={(id) => navigateTo('product-detail', id)} onCartOpen={() => setIsCartOpen(true)} onNavigate={navigateTo} />;
      case 'product-detail':
        return selectedProductId ? (
          <ProductDetailPage
            productId={selectedProductId}
            onBack={() => navigateTo('products')}
            onNavigate={navigateTo}
          />
        ) : (
          <ProductsPage
            onProductClick={(id) => navigateTo('product-detail', id)}
            onCartOpen={() => setIsCartOpen(true)}
            onNavigate={navigateTo}
          />
        );
      case 'contact':
        return <ContactPage />;
      case 'about':
        return <AboutPage onNavigate={navigateTo} />;
      case 'policies':
        return <PoliciesPage />;
      case 'login':
        return <LoginPage onNavigate={navigateTo} />;
      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={navigateTo} />;
      case 'cart':
        return <CartPage onNavigate={navigateTo} />;
      case 'wishlist':
        return <WishlistPage onProductClick={(id) => navigateTo('product-detail', id)} onNavigate={navigateTo} />;
      case 'bulk-enquiry':
        return <BulkEnquiryPage onNavigate={navigateTo} selectedProductId={selectedProductId} />;
      case 'home':
      default:
        return (
          <>
            <HeroSection onNavigate={navigateTo} />
            <ProductFleetSection 
              onBrowse={() => browseCatalog()}
              onProductClick={(id) => navigateTo('product-detail', id)} 
              onCartOpen={() => setIsCartOpen(true)} 
            />
            <CategorySection onCatalog={category => browseCatalog('', category)} />
            <CategoriesContactSection onCatalog={category => browseCatalog('', category)} />
          </>
        );
    }
  };

  return (
    <>
      <SEOHead {...(currentPage === 'product-detail' && selectedProductId && getProductById(selectedProductId)
        ? { ...getProductSEO(getProductById(selectedProductId)!), canonical: `/product-detail?id=${encodeURIComponent(selectedProductId)}` }
        : PAGE_SEO[currentPage] ?? PAGE_SEO['home'])} />
      <AuthProvider>
        <ToastProvider>
          <WishlistProvider>
            <CartProvider>
            <div className="min-h-screen bg-white">
              <Navigation
                currentPage={currentPage}
                onNavigate={navigateTo}
                onCatalog={browseCatalog}
                onCartClick={() => {
                  setIsCartOpen(false);
                  navigateTo('cart');
                }}
              />
              
              <main>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentPage === 'product-detail' ? `detail-${selectedProductId}` : currentPage}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {renderPage()}
                  </motion.div>
                </AnimatePresence>
              </main>

              {currentPage !== 'contact' && <Footer onNavigate={navigateTo} />}
              
              <CartDrawer 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                onNavigate={navigateTo}
              />
              
              <MobileStickyCart onOpenCart={() => {
                setIsCartOpen(false);
                navigateTo('cart');
              }} />

              {/* Scroll to Top Button */}
              <button
                onClick={scrollToTop}
                className={`fixed bottom-[104px] right-[24px] z-[999] flex items-center justify-center w-[48px] h-[48px] rounded-full text-white transition-all duration-300 shadow-xl ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
                style={{ background: 'var(--kb-tertiary)' }}
                aria-label="Scroll to top"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
              </button>
              {/* Floating WhatsApp Button */}
              <a
                href="https://wa.me/919490701421"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                title="Chat with us on WhatsApp"
                className="fixed bottom-[32px] right-[24px] z-[999] flex items-center justify-center w-[56px] h-[56px] rounded-full text-white transition-transform hover:scale-110 shadow-2xl"
                style={{ background: '#25D366' }}
              >
                <svg className="w-[30px] h-[30px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.097.541 4.17 1.573 6.015L0 24l6.174-1.545A11.927 11.927 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.005-1.373l-.36-.213-3.682.921.985-3.575-.234-.369A9.818 9.818 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182c5.421 0 9.818 4.398 9.818 9.818 0 5.421-4.397 9.818-9.818 9.818z"/>
                </svg>
              </a>
            </div>
            </CartProvider>
          </WishlistProvider>
        </ToastProvider>
      </AuthProvider>
    </>
  );
}

export default App;
