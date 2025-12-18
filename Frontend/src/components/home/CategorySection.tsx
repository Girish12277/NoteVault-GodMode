import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Code, Terminal, FlaskRound as Flask, Briefcase, Calculator, Globe, HeartPulse, Palette, Music, Gavel, Building2, Leaf, MoveRight, Cpu, Microscope, Stethoscope, Scale, Lightbulb, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

// --- CONFIGURATION ---

// Expanded Icon Map with WCAG-Compliant Colors (600 series text / 500/10 bg)
const categoryIconMap: Record<string, { icon: any; iconColor: string; bgColor: string; description: string; tags: string[] }> = {
  'computer-science': {
    icon: Terminal,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    description: 'Algorithms, AI, Web Dev & more',
    tags: ['AI', 'Data', 'Web']
  },
  'engineering': {
    icon: Code,
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10',
    description: 'Core concepts for future builders',
    tags: ['Civil', 'Mech', 'Elec']
  },
  'medical': {
    icon: Stethoscope,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-500/10',
    description: 'Anatomy, Pharma & Clinical studies',
    tags: ['MBBS', 'Dental']
  },
  'business': {
    icon: Briefcase,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    description: 'Management, Finance & Strategy',
    tags: ['MBA', 'Finance']
  },
  'mathematics': {
    icon: Calculator,
    iconColor: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
    description: 'Calculus, Algebra & Stats',
    tags: ['Stats', 'Alg']
  },
  'science': {
    icon: Flask,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-500/10',
    description: 'Physics, Chemistry & Biology',
    tags: ['Phy', 'Chem']
  },
  'arts': {
    icon: Palette,
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-500/10',
    description: 'History, Design & Philosophy',
    tags: ['Hist', 'Phil']
  },
  'humanities': {
    icon: Globe,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    description: 'Social Sciences & Languages',
    tags: ['Soc', 'Lang']
  },
  'law': {
    icon: Scale,
    iconColor: 'text-stone-600',
    bgColor: 'bg-stone-500/10',
    description: 'Civil, Criminal & Corporate Law',
    tags: ['Civil', 'Corp']
  },
  'architecture': {
    icon: Building2,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    description: 'Design & Structure',
    tags: ['Des', 'Urb']
  },
  'music': {
    icon: Music,
    iconColor: 'text-rose-600',
    bgColor: 'bg-rose-500/10',
    description: 'Theory & Composition',
    tags: ['Th', 'Comp']
  },
  'environment': {
    icon: Leaf,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    description: 'Ecology & Sustainability',
    tags: ['Eco', 'Sus']
  },
};

// Deterministic Fallback Generator
// Generates a stable color/style for unmapped categories based on their name
const generateFallbackConfig = (name: string) => {
  const colors = [
    { text: 'text-teal-600', bg: 'bg-teal-500/10' },
    { text: 'text-violet-600', bg: 'bg-violet-500/10' },
    { text: 'text-fuchsia-600', bg: 'bg-fuchsia-500/10' },
    { text: 'text-lime-600', bg: 'bg-lime-500/10' },
    { text: 'text-sky-600', bg: 'bg-sky-500/10' },
  ];

  // Simple hash for stability
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const config = colors[colorIndex];

  return {
    icon: BookOpen, // Default safe icon
    iconColor: config.text,
    bgColor: config.bg,
    description: 'Explore this collection',
    tags: ['Notes']
  };
};


export function CategorySection() {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data;
    }
  });

  return (
    <section className="py-12 lg:py-20 bg-muted/20 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <Code className="w-64 h-64 text-primary" />
      </div>

      <div className="container relative z-10">
        <div className="flex items-end justify-between mb-8 sm:mb-12">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Explore by <span className="text-primary">Subject</span>
            </h2>
            <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
              Curated collections organized by your field of study. Dive into specific topics or browse broad categories.
            </p>
          </div>
          <Link to="/categories" className="hidden sm:inline-flex">
            <Button variant="ghost" className="group">
              View All Categories
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Categories Layout: Mobile Horizontal Scroll / Desktop Bento Grid */}
        <div className="relative group/container">
          {/* Mobile Scroll Indicators */}
          <div className="absolute left-0 top-0 bottom-6 w-12 bg-gradient-to-r from-background to-transparent z-10 md:hidden opacity-0 transition-opacity pointer-events-none data-[visible=true]:opacity-100" />
          <div className="absolute right-0 top-0 bottom-6 w-12 bg-gradient-to-l from-background to-transparent z-10 md:hidden pointer-events-none" />

          <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto pb-6 md:pb-0 snap-x snap-mandatory scroll-pl-4 scrollbar-hide md:auto-rows-[180px]">
            {categories.slice(0, 8).map((category: any, index: number) => {
              const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');

              // Smart Configuration Strategy
              const mappedConfig = categoryIconMap[slug];
              const config = mappedConfig || generateFallbackConfig(category.name);
              const IconComponent = config.icon;

              // Bento Grid Logic: First 2 items span 2 columns on desktop
              // IMPROVEMENT: Ensure layout stability even with few items
              const isLarge = index < 2;

              return (
                <Link
                  key={category.id}
                  to={`/browse?categoryId=${category.id}`}
                  className={cn(
                    "group relative flex-none w-[280px] md:w-auto h-[160px] md:h-auto snap-start rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1",
                    isLarge ? "md:col-span-2" : "md:col-span-1"
                  )}
                >
                  <div className="flex flex-col h-full justify-between relative z-10">
                    <div className="flex justify-between items-start">
                      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm", config.bgColor)}>
                        <IconComponent className={cn("h-6 w-6", config.iconColor)} />
                      </div>

                      {/* Hover Interactions: Arrow Reveal */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <MoveRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 group-hover:text-foreground/80 transition-colors">
                        {isLarge ? config.description : `${category.count || category._count?.notes || 0} notes`}
                      </p>

                      {/* Tags (Only for Large Cards - Enhanced) */}
                      {isLarge && config.tags && (
                        <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                          {config.tags.map(tag => (
                            <span key={tag} className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border border-transparent", config.bgColor, config.iconColor)}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subtle Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-6 sm:hidden">
          <Link to="/categories">
            <Button variant="outline" className="w-full h-12 text-base">
              Explore All Subjects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
