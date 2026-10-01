import React from 'react';
import { motion } from 'framer-motion';
import { getMediaUrl } from '../../lib/cdn';

const UpcomingProductsSection: React.FC = () => {
  const upcomingProducts = [
    {
      id: 1,
      name: "Neo-Pizza Oven Pro",
      tagline: "AI-Controlled Precision Baking",
      description: "Experience the perfect crust every time with our patented thermal sensing technology and automated rotation system.",
      image: getMediaUrl('/images/redesign/upcoming-pizza-oven.png'),
      releaseDate: "Q3 2026",
      features: ["Voice Control", "Remote Monitoring", "Self-Cleaning Mode"]
    },
    {
      id: 2,
      name: "Smart Thermal Fryer V2",
      tagline: "Healthier Frying, Smarter Control",
      description: "Reducing oil usage by 40% while maintaining the perfect crunch. Integrated with KitchenSync OS for total control.",
      image: getMediaUrl('/images/redesign/fryer.png'),
      releaseDate: "Q4 2026",
      features: ["Nutrient Tracking", "Zero-Waste Filter", "Rapid Heat Tech"]
    },
    {
      id: 3,
      name: "Autonomous Grill System",
      tagline: "Chef-Level Grilling, Automated",
      description: "Multi-zone temperature management and robotic flipping capabilities for high-volume kitchen operations.",
      image: getMediaUrl('/images/redesign/robogrill.png'),
      releaseDate: "Q1 2027",
      features: ["Flipping Robotic Arm", "Flare-up Detection", "Smoke Infuser"]
    }
  ];

  return (
    <section className="upcoming-products py-24 bg-white overflow-hidden" id="upcoming">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 bg-[#E6F4F1] text-[#00A884] rounded-full text-sm font-semibold mb-4 tracking-wider uppercase"
          >
            Future of Cooking
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-[#1E2329] mb-6 font-display"
          >
            In the Lab: Upcoming Innovations
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto font-body"
          >
            Our engineers are pushing the boundaries of what's possible in the kitchen.
            Be the first to experience the next generation of robotic appliances.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {upcomingProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative group h-full flex flex-col"
            >
              <div className="relative mb-8 rounded-3xl overflow-hidden shadow-premium-lg bg-gray-50 h-80">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-white/95 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1E2329] border border-[#E2E8F0] shadow-sm">
                    {product.releaseDate}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E2329]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              <div className="flex-grow flex flex-col">
                <h3 className="text-2xl font-bold text-[#1E2329] mb-2 font-display">
                  {product.name}
                </h3>
                <p className="text-[#00A884] font-semibold text-sm mb-4 uppercase tracking-wide">
                  {product.tagline}
                </p>
                <p className="text-gray-600 mb-6 font-body leading-relaxed">
                  {product.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {product.features.map((feature, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-500 rounded-md text-xs font-medium">
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="mt-auto">
                  <button className="w-full py-3.5 bg-[#1E2329] text-white rounded-lg font-bold hover:bg-kb-tertiary transition-colors duration-200 shadow-sm flex items-center justify-center gap-2">
                    Request Information
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        .upcoming-products {
          position: relative;
        }
        .upcoming-products::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #E5E5E5, transparent);
        }
      `}</style>
    </section>
  );
};

export default UpcomingProductsSection;
