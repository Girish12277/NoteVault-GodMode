import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, Code, FlaskConical, Calculator, Gavel, Stethoscope, Briefcase, Landmark, Loader2, Search, Zap, Atom, Globe, DraftingCompass, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

// Smart Icon Mapping
const getCategoryConfig = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('engineering')) return {
    icon: Code,
    gradient: "from-blue-600 to-cyan-400",
    shadow: "shadow-blue-500/20",
    bg: "bg-blue-500/10"
  };
  if (lower.includes('medical') || lower.includes('pharmacy')) return {
    icon: Stethoscope,
    gradient: "from-emerald-500 to-teal-400",
    shadow: "shadow-emerald-500/20",
    bg: "bg-emerald-500/10"
  };
  if (lower.includes('science') || lower.includes('physics')) return {
    icon: Atom,
    gradient: "from-violet-600 to-purple-400",
    shadow: "shadow-violet-500/20",
    bg: "bg-violet-500/10"
  };
  if (lower.includes('commerce') || lower.includes('business')) return {
    icon: Calculator,
    gradient: "from-amber-500 to-orange-400",
    shadow: "shadow-amber-500/20",
    bg: "bg-amber-500/10"
  };
  if (lower.includes('arts') || lower.includes('humanities')) return {
    icon: Globe,
    gradient: "from-rose-500 to-pink-400",
    shadow: "shadow-rose-500/20",
    bg: "bg-rose-500/10"
  };
  if (lower.includes('law')) return {
    icon: Gavel,
    gradient: "from-slate-700 to-slate-500",
    shadow: "shadow-slate-500/20",
    bg: "bg-slate-500/10"
  };
  if (lower.includes('management')) return {
    icon: Briefcase,
    gradient: "from-indigo-600 to-blue-500",
    shadow: "shadow-indigo-500/20",
    bg: "bg-indigo-500/10"
  };
  if (lower.includes('architecture')) return {
    icon: DraftingCompass,
    gradient: "from-stone-600 to-stone-400",
    shadow: "shadow-stone-500/20",
    bg: "bg-stone-500/10"
  };

  // Default fallback
  return {
    icon: BookOpen,
    gradient: "from-primary to-primary/60",
    shadow: "shadow-primary/20",
    bg: "bg-primary/10"
  };
};

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data || [];
    }
  });

  const filteredCategories = useMemo(() => {
    return categories.filter((cat: any) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  // Featured categories (first 3 or logic based) for the Bento Grid top row
  const featured = filteredCategories.slice(0, 3);
  const others = filteredCategories.slice(3);

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-20">

        {/* Cinematic Header */}
        <div className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/5 bg-[size:30px_30px] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />

          <div className="container relative z-10 text-center">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary backdrop-blur-sm px-4 py-1.5 text-sm uppercase tracking-wider font-semibold">
              <Zap className="w-3 H-3 mr-2 fill-current" /> Knowledge Hub
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70 mb-6">
              Explore by Topic
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Dive into our curated collection of notes across engineering, medical, arts, and more.
            </p>

            {/* Smart Search */}
            <div className="max-w-xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-500" />
              <div className="relative bg-background/80 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl flex items-center p-2 shadow-2xl">
                <Search className="ml-4 h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Find a category (e.g., Computer Science)..."
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 px-4 py-3 text-lg placeholder:text-muted-foreground/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground animate-pulse">Loading topics...</p>
            </div>
          ) : (
            <div className="space-y-10">

              {/* No Results */}
              {filteredCategories.length === 0 && (
                <div className="text-center py-16 bg-muted/30 rounded-3xl border-2 border-dashed border-border/50">
                  <div className="h-16 w-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                    <FlaskConical className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-lg">No topics found</h3>
                  <p className="text-muted-foreground">Try searching for something else like 'Engineering'</p>
                </div>
              )}

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((category: any, index: number) => {
                  const config = getCategoryConfig(category.name);
                  const Icon = config.icon;

                  // Make the first item large if on desktop
                  const isFeatured = index === 0;

                  return (
                    <Link
                      key={category.id}
                      to={`/browse?category=${category.id}`}
                      className={cn(
                        "group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl",
                        isFeatured ? "lg:col-span-2 lg:row-span-2 min-h-[300px]" : "min-h-[220px]",
                        "bg-card border border-border/50"
                      )}
                    >
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br",
                        config.gradient
                      )} />

                      <CardContent className="h-full p-8 flex flex-col justify-between relative z-10">
                        <div className="flex justify-between items-start">
                          <div className={cn(
                            "rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg",
                            isFeatured ? "h-20 w-20 text-4xl" : "h-14 w-14 text-2xl",
                            config.bg,
                            "text-foreground", // Icon color handled by parent usually, but component logic below handles it
                            config.shadow
                          )}>
                            {/* Apply gradient text effect to icon wrapper if possible, or just color */}
                            <Icon className={cn(
                              "text-primary",
                              isFeatured ? "h-10 w-10" : "h-7 w-7"
                            )} style={{ color: "var(--token-primary)" }} />
                          </div>

                          <div className="h-10 w-10 rounded-full bg-background/50 backdrop-blur border border-white/10 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            <ArrowRight className="h-5 w-5 text-foreground" />
                          </div>
                        </div>

                        <div>
                          <h3 className={cn(
                            "font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors",
                            isFeatured ? "text-3xl" : "text-xl"
                          )}>
                            {category.name}
                          </h3>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="bg-background/50 backdrop-blur hover:bg-background/80 transition-colors">
                              {category._count?.notes || 0} Notes
                            </Badge>
                            {isFeatured && (
                              <span className="text-xs font-bold uppercase tracking-widest text-primary/80 animate-pulse">
                                Top Category
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Abstract Background Decor */}
                        <div className={cn(
                          "absolute -bottom-10 -right-10 rounded-full blur-[60px] opacity-20 pointer-events-none transition-all duration-500 group-hover:opacity-40",
                          config.bg,
                          isFeatured ? "w-64 h-64" : "w-40 h-40"
                        )} />
                      </CardContent>
                    </Link>
                  );
                })}

                {/* Request New Category Card (Always ends the grid) */}
                <Link to="/contact" className="group min-h-[220px] rounded-3xl border-2 border-dashed border-primary/20 hover:border-primary/50 bg-primary/5 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:bg-primary/10">
                  <div className="bg-background rounded-full p-4 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Missing something?</h3>
                  <p className="text-sm text-muted-foreground">Request a new category</p>
                </Link>
              </div>

            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
