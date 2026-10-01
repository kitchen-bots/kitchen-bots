import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flame, Zap, Settings, ShieldCheck, Award, Gauge } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const engineeringPillars = [
    {
        icon: ShieldCheck,
        title: 'High-Grade Steel Construction',
        headline: 'Built Like Infrastructure',
        description:
            'Every KitchenBots unit is fabricated from ISI-certified mild steel plate and 304-grade food-safe stainless steel for all cooking surfaces. Thickness ranges from 1.6mm for portable models to 3.2mm for commercial-grade units. Every weld is MIG-welded and visually inspected before surface treatment.',
        spec: '1.6–3.2mm plate • MIG welded • ISI certified steel',
        color: '#4A4A4A',
    },
    {
        icon: Flame,
        title: 'Heat-Resistant Coating',
        headline: 'Rated to 1000°C',
        description:
            'External surfaces are treated with a two-stage heat-resistant ceramic coating that resists peeling, discolouration, and corrosion up to 1000°C. Internal surfaces are seasoned using our thermal cycling process - eliminating the need for paint in combustion zones and creating a naturally non-reactive cooking environment.',
        spec: '1000°C rated ceramic coating • Zero paint on cooking surfaces',
        color: '#156331',
    },
    {
        icon: Gauge,
        title: 'Engineered Airflow Design',
        headline: 'Combustion by Design',
        description:
            'Airflow is not an afterthought - it\'s the primary thermal engineering variable in every KitchenBots product. Adjustable primary air vents, secondary combustion pathways, and strategically positioned ash pans work together to maximise burn efficiency and give the cook precise temperature control.',
        spec: '40% fuel savings vs. standard grills • Adjustable primary + secondary air',
        color: '#0B351B',
    },
    {
        icon: Zap,
        title: 'Structural Rigidity Testing',
        headline: 'Stress-Tested Before You Cook',
        description:
            'Every new model undergoes a 200-hour accelerated thermal cycling protocol - 500 heating-and-cooling cycles between ambient temperature and maximum operating temperature. Physical load testing applies 3× the expected cooking weight. Only units that pass every cycle enter production.',
        spec: '500 thermal cycles • 3× load testing • Pre-production QC',
        color: '#7ECC89',
    },
    {
        icon: Settings,
        title: 'Modular Serviceability',
        headline: 'Engineered for Decades of Use',
        description:
            'A grill that can\'t be serviced ends up in landfill. Every KitchenBots component - grates, hinge pins, motor assemblies, skewers, drip pans - is individually catalogued, stocked, and available for order. We guarantee parts availability for a minimum of 10 years from product launch.',
        spec: '10-year parts guarantee • All components individually serviceable',
        color: '#4A4A4A',
    },
    {
        icon: Award,
        title: 'Made in India Excellence',
        headline: 'Precision. Manufactured in India.',
        description:
            'KitchenBots manufacturing combines precision CNC laser cutting, automated MIG welding cells, and traditional hand-finishing by skilled metal artisans. Our facility operates under ISO-compliant quality management procedures. Every unit carries a KitchenBots serial number and is individually quality-checked.',
        spec: 'CNC laser cut • MIG welded • ISO quality management',
        color: '#156331',
    },
];

export default function EngineeringSection() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const ctx = gsap.context(() => {
            const cards = section.querySelectorAll('.engineering-card');

            // 3D tilt on cards (Disabled on mobile)
            const isTouch = window.matchMedia('(hover: none)').matches;
            if (!isTouch) {
                cards.forEach((card) => {
                    const el = card as HTMLElement;
                    const handleMouseMove = (e: MouseEvent) => {
                        const rect = el.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 15;
                        const y = -((e.clientY - rect.top) / rect.height - 0.5) * 15;
                        gsap.to(el, { 
                            rotateY: x, 
                            rotateX: y, 
                            duration: 0.4, 
                            ease: 'power2.out', 
                            transformPerspective: 1000,
                            boxShadow: '0 25px 60px rgba(0,0,0,0.1)'
                        });
                    };
                    const handleMouseLeave = () => gsap.to(el, { 
                        rotateY: 0, 
                        rotateX: 0, 
                        duration: 0.6, 
                        ease: 'power2.out',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                    });
                    el.addEventListener('mousemove', handleMouseMove);
                    el.addEventListener('mouseleave', handleMouseLeave);
                });
            }
        }, section);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20 reveal">
                    <span className="inline-block text-[11px] font-bold tracking-[0.2em] text-[var(--kb-primary)] uppercase mb-4">
                        Manufacturing Protocol
                    </span>
                    <h2 className="text-4xl md:text-[56px] font-bold text-[var(--kb-charcoal)] leading-tight mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Engineering <span className="text-[var(--kb-primary)] italic">Excellence</span>
                    </h2>
                    <p className="text-lg text-[var(--kb-text-muted)] leading-relaxed">
                        The difference between a mass-produced product and a precision instrument is intent. 
                        Every weld, material choice, and airflow geometry is engineered for operational perfection.
                    </p>
                </div>

                {/* Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {engineeringPillars.map((pillar, index) => {
                        const Icon = pillar.icon;
                        return (
                            <div
                                key={index}
                                className={`engineering-card group relative p-10 rounded-[40px] border border-gray-100 bg-white transition-all duration-500 cursor-default reveal delay-${index * 100}`}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {/* Icon */}
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110"
                                    style={{ background: `var(--kb-surface)`, border: `1px solid var(--kb-primary-light)` }}
                                >
                                    <Icon className="w-7 h-7 text-[var(--kb-primary)]" />
                                </div>

                                {/* Content */}
                                <span className="text-[10px] font-bold tracking-[0.15em] text-[var(--kb-primary)] uppercase mb-3 block">
                                    {pillar.headline}
                                </span>
                                <h3 className="text-2xl font-bold text-[var(--kb-charcoal)] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    {pillar.title}
                                </h3>
                                <p className="text-[var(--kb-text-muted)] text-[15px] leading-relaxed mb-8">
                                    {pillar.description}
                                </p>

                                {/* Spec badge */}
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--kb-surface)] border border-gray-100 text-[11px] font-bold text-[var(--kb-charcoal)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--kb-primary)] animate-pulse" />
                                    {pillar.spec}
                                </div>

                                {/* Decorative Background Number */}
                                <div className="absolute top-10 right-10 text-[64px] font-black text-gray-400/5 select-none transition-colors group-hover:text-[var(--kb-primary-light)]">
                                    0{index + 1}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-4 mt-20 reveal">
                    {[
                        { text: 'ISI Certified Steel', color: 'var(--kb-green)' },
                        { text: 'Heat Tested: 1000°C', color: 'var(--kb-orange)' },
                        { text: '500-Cycle Thermal Test', color: 'var(--kb-primary)' },
                        { text: '10-Year Parts Guarantee', color: 'var(--kb-dark-green)' },
                    ].map((badge) => (
                        <div 
                            key={badge.text} 
                            className="flex items-center gap-3 px-6 py-3 rounded-full border border-gray-100 text-[var(--kb-charcoal)] text-[12px] font-bold tracking-brand bg-white shadow-premium-sm hover:border-[var(--kb-primary-light)] transition-colors"
                        >
                            <div className="w-2 h-2 rounded-full" style={{ background: badge.color }} />
                            {badge.text}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

