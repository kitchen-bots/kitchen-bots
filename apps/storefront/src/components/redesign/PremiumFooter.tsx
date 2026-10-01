import React from 'react';

const PremiumFooter: React.FC = () => {
  return (
    <footer className="bg-[#1E2329] text-white pt-24 pb-12 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Newsletter Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24 pb-24 border-b border-white/10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">Join the Revolution</h2>
            <p className="text-gray-400 text-lg font-body">Subscribe to get early access to new releases and exclusive kitchen technology insights.</p>
          </div>
          <div className="relative">
            <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#00A884] transition-colors"
                required
              />
              <button className="bg-[#00A884] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#00D1A7] transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-[#00A884]/20">
                Subscribe
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-4">By subscribing, you agree to our Privacy Policy and Terms of Service.</p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-24">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#00A884] rounded-xl flex items-center justify-center shadow-lg shadow-[#00A884]/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight font-display">Kitchen Bots</span>
            </div>
            <p className="text-gray-400 mb-8 max-w-sm font-body leading-relaxed">
              We're on a mission to automate every kitchen on the planet, bringing professional-grade precision and efficiency to every home and restaurant.
            </p>
            <div className="flex gap-4">
              {['twitter', 'instagram', 'facebook', 'linkedin'].map((social) => (
                <a key={social} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#00A884] transition-colors group">
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors">
                    <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-8">Products</h4>
            <ul className="space-y-4">
              {['Pizza Ovens', 'Deep Fryers', 'Grill Systems', 'Accessories', 'New Releases'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 hover:text-[#00A884] transition-colors font-body">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-8">Company</h4>
            <ul className="space-y-4">
              {['About Us', 'Careers', 'Technology', 'Sustainability', 'Newsroom'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 hover:text-[#00A884] transition-colors font-body">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-8">Support</h4>
            <ul className="space-y-4">
              {['Help Center', 'Safety Services', 'Product Recalls', 'Warranty', 'Contact Us'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 hover:text-[#00A884] transition-colors font-body">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 text-sm text-gray-500">
          <p className="mb-4 md:mb-0">&copy; 2026 Kitchen Bots Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookies Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PremiumFooter;
