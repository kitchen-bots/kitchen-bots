import { LayoutGrid, Zap, ShieldCheck, PlugZap } from 'lucide-react';
import { getMediaUrl } from '../lib/cdn';

export default function WhyChooseSection() {
  return (
    <section className="py-12 lg:py-[60px] bg-[#EFF3EF]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12 lg:items-start">

          {/* LEFT COLUMN (45%) */}
          <div className="w-full lg:w-[45%]">
            <h2 className="text-[28px] font-bold text-[#111827] mb-4">
              Why Choose KitchenBots?
            </h2>
            <p className="text-[#6B7280] text-[14px] leading-relaxed mb-10">
              Pioneering automation in commercial kitchens, we offer advanced smart kitchen
              equipment designed to boost efficiency, enhance safety, and ensure consistent
              quality in culinary operations.
            </p>

            {/* THE 'KUCHENSTOCKY' WIDGET */}
            <div className="bg-white border border-[#9DD49D] rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <PlugZap size={20} className="text-kb-primary" />
                <h3 className="text-[14px] font-bold text-[#111827]">
                  Our Expertise
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                {/* Row 1 */}
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={getMediaUrl('/images/redesign/fryer.png')} alt="Deep Fryers" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#111827]">Deep Fryers</h4>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={getMediaUrl('/images/redesign/product-grid.png')} alt="Food Preparation" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#111827]">Food Preparation</h4>
                    <p className="text-[10px] text-[#6B7280] leading-tight">Smart preparation equipment</p>
                  </div>
                </div>
                {/* Row 2 */}
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={getMediaUrl('/images/redesign/hero-robot.png')} alt="Grilling Solutions" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#111827]">Grilling Solutions</h4>
                    <p className="text-[10px] text-[#6B7280] leading-tight">Robotic grilling technology</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={getMediaUrl('/images/redesign/product-grid.png')} alt="Custom Solutions" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[#111827]">Custom Solutions</h4>
                    <p className="text-[10px] text-[#6B7280] leading-tight">Tailored automation systems</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (55%) */}
          <div className="w-full lg:w-[55%]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Card 1 */}
              <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                <div className="w-10 h-10 rounded-full bg-[#EBF7F0] flex items-center justify-center mb-4 text-kb-primary">
                  <LayoutGrid size={20} />
                </div>
                <h3 className="text-[16px] font-bold text-[#111827] mb-2 leading-tight">High-Tech Automation</h3>
                <p className="text-[#6B7280] text-[13px] leading-relaxed">State-of-the-art robotic and automated kitchen solutions</p>
              </div>
              {/* Card 2 */}
              <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                <div className="w-10 h-10 rounded-full bg-[#EBF7F0] flex items-center justify-center mb-4 text-kb-primary">
                  <Zap size={20} />
                </div>
                <h3 className="text-[16px] font-bold text-[#111827] mb-2 leading-tight">Energy Efficient Design</h3>
                <p className="text-[#6B7280] text-[13px] leading-relaxed">Cutting-edge technology that minimises energy use</p>
              </div>
              {/* Card 3 */}
              <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                <div className="w-10 h-10 rounded-full bg-[#EBF7F0] flex items-center justify-center mb-4 text-kb-primary">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-[16px] font-bold text-[#111827] mb-2 leading-tight">Enhanced Safety Protocols</h3>
                <p className="text-[#6B7280] text-[13px] leading-relaxed">Comprehensive safety features for secure operations.</p>
              </div>
              {/* Card 4 */}
              <div className="bg-white rounded-xl p-6 border border-[#E5E7EB]">
                <div className="w-10 h-10 rounded-full bg-[#EBF7F0] flex items-center justify-center mb-4 text-kb-primary">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-[16px] font-bold text-[#111827] mb-2 leading-tight">Reliable Support</h3>
                <p className="text-[#6B7280] text-[13px] leading-relaxed">24/7 dedicated support for all your kitchen operations.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
