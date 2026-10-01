import { Search, Calendar, User, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getMediaUrl } from '../lib/cdn';

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      category: 'Technology',
      date: '18 June, 2024',
      author: 'Ramesh Kumar',
      title: 'Commercial Cooking Equipment: Temperature Precision in High-Volume Kitchens',
      excerpt: 'How precise thermal engineering and solid-fuel heat dynamics keep food service running consistently during peak rush hours.',
      image: getMediaUrl('/images/redesign/blog-1.png')
    },
    {
      id: 2,
      category: 'Automation',
      date: '26 May, 2024',
      author: 'KitchenBots Engineering',
      title: 'Operational Benefits of Automated Rotisserie and Turning Systems',
      excerpt: 'Automating continuous rotation reduces operator fatigue and produces uniform crust and moisture retention across commercial batches.',
      image: getMediaUrl('/images/redesign/blog-2.png')
    },
    {
      id: 3,
      category: 'Thermal Design',
      date: '10 June, 2024',
      author: 'KitchenBots Engineering',
      title: 'Combustion Geometry: Maximizing Rocket Stove Heat Efficiency',
      excerpt: 'Explore how targeted airflow and insulated burn chambers extract maximum caloric value from solid biomass and charcoal fuel.',
      image: getMediaUrl('/images/redesign/blog-3.png')
    },
    {
      id: 4,
      category: 'Fabrication',
      date: '31 May, 2024',
      author: 'Manufacturing Team',
      title: 'Stainless Steel Grades for Commercial Food Service Equipment',
      excerpt: 'Understanding the metallurgical differences between 304 and 430 stainless steel when exposed to direct flame and continuous moisture.',
      image: getMediaUrl('/images/redesign/blog-4.png')
    },
    {
      id: 5,
      category: 'Equipment',
      date: '21 May, 2024',
      author: 'KitchenBots Engineering',
      title: 'Santa Maria Grilling: The Mechanics of Adjustable-Grate Fire Cooking',
      excerpt: 'A mechanical breakdown of cable-lift mechanisms, crank ratchets, and heat control in traditional live-fire commercial cooking.',
      image: getMediaUrl('/images/redesign/blog-5.png')
    },
    {
      id: 6,
      category: 'Field Guide',
      date: '10 June, 2024',
      author: 'Operations Team',
      title: 'Maintenance Protocols for Commercial Charcoal and Gas BBQ Units',
      excerpt: 'Daily clean-down procedures and seasonal inspections that extend equipment lifespan in demanding restaurant environments.',
      image: getMediaUrl('/images/redesign/blog-6.png')
    }
  ];

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-white">
        <div className="container mx-auto px-6 lg:px-[80px]">
          <div className="max-w-3xl">
            <h1 className="text-[48px] md:text-[64px] font-bold text-[#111827] leading-[1.1] mb-6 font-['Outfit']">
              Insights & <span className="text-kb-tertiary">Innovations</span>
            </h1>
            <p className="text-[18px] text-[#475569] leading-relaxed mb-8 font-['DM_Sans']">
              Explore our latest articles and stay updated with the newest trends, engineering breakthroughs, and advancements in smart kitchen technology.
            </p>

            <div className="flex items-center max-w-md bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-1 focus-within:border-kb-tertiary focus-within:bg-white transition-all shadow-sm">
              <Search className="ml-4 text-[#94A3B8]" size={20} />
              <input
                type="text"
                placeholder="Search articles..."
                className="flex-grow h-[52px] px-4 bg-transparent outline-none text-[15px] font-['DM_Sans']"
              />
              <Button size="sm" className="rounded-xl uppercase tracking-widest text-[12px]">
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Subtle background element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#F8FAFC] -z-10 rounded-l-[100px]" />
      </section>

      {/* FEATURED POST (Placeholder for first item) */}
      <section className="py-12 container mx-auto px-6 lg:px-[80px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-[40px] border border-[#F1F5F9] overflow-hidden flex flex-col group shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] transition-all duration-500"
            >
              {/* Image Wrap */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md text-[#111827] text-[11px] font-bold uppercase px-4 py-1.5 rounded-full tracking-widest z-10 shadow-sm font-['Outfit']">
                  {post.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-[12px] text-[#64748B] mb-4 font-['DM_Sans']">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-kb-tertiary" />
                    {post.date}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-[#E2E8F0]" />
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-kb-primary" />
                    {post.author}
                  </div>
                </div>

                <h3 className="text-[20px] font-bold text-[#111827] mb-4 leading-tight font-['Outfit'] group-hover:text-kb-tertiary transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-[14px] text-[#475569] leading-relaxed mb-8 line-clamp-3 font-['DM_Sans'] flex-grow">
                  {post.excerpt}
                </p>

                <Button
                  variant="outline"
                  className="w-fit group/btn"
                >
                  Read Full Article <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LOAD MORE */}
      <div className="text-center py-24">
        <Button
          variant="outline"
          size="lg"
          className="mx-auto"
        >
          Load More Insights <BookOpen size={20} />
        </Button>
      </div>

      {/* NEWSLETTER CTA */}
      <section className="pb-24 container mx-auto px-6 lg:px-[80px]">
        <div className="bg-[#112329] rounded-3xl p-10 md:p-16 text-center relative overflow-hidden shadow-xl">
          <h2 className="text-[28px] md:text-[38px] font-bold text-white mb-4 font-['Outfit'] leading-tight">
            Commercial Kitchen Equipment Insights
          </h2>
          <p className="text-white/70 text-[16px] max-w-xl mx-auto mb-8 font-['DM_Sans']">
            Receive updates on new cooking equipment releases, fabrication techniques, and maintenance best practices.
          </p>

          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow h-[52px] px-5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15 font-['DM_Sans'] text-sm"
            />
            <Button variant="accent" size="lg" className="rounded-xl px-7">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
