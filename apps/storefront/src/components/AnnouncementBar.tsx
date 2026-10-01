import { Phone, Truck, Package } from 'lucide-react';

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar w-full px-4 text-white">
      {/* Desktop View */}
      <div className="hidden md:flex items-center justify-center gap-6 text-[12px] font-medium tracking-wide">
        <div className="flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-white/70" />
          <span>Pan-India Delivery</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-white/70" />
          <span>Bulk Wholesale Pricing Available</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-[var(--kb-green)]" />
          <span>+91 9490701421 <span className="text-white/40 mx-1">·</span> Mon-Sat 9AM-5PM</span>
        </div>
      </div>

      {/* Mobile View - Simplified */}
      <div className="flex md:hidden items-center justify-between w-full max-w-sm text-[11px] font-bold">
        <div className="flex items-center gap-1.5 uppercase tracking-tighter">
          <Truck className="w-3 h-3 text-white/70" />
          <span>Free Delivery &gt;₹10k</span>
        </div>
        <a href="tel:+919490701421" className="flex items-center gap-1.5 text-[var(--kb-green)]">
          <Phone className="w-3 h-3" />
          <span>9490701421</span>
        </a>
      </div>
    </div>
  );
}

