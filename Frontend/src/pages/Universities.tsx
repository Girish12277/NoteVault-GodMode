import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MapPin, ArrowRight, Loader2, Plus, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface University {
  id: string;
  name: string;
  location: string;
  colleges?: any[];
}

const getGradient = (name: string) => {
  const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  // Strict 3-Color Palette Rotation (Primary, Secondary, Accent)
  const gradients = [
    "from-primary/10 to-primary/5 text-primary border-primary/20",       // Primary (Orange)
    "from-secondary/10 to-secondary/5 text-secondary border-secondary/20", // Secondary (Navy)
    "from-accent/10 to-accent/5 text-accent border-accent/20",             // Accent (Green)
  ];
  return gradients[sum % gradients.length];
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export default function Universities() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: universities = [], isLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const { data } = await api.get('/universities');
      return data.data as University[];
    }
  });

  const filteredUniversities = useMemo(() => {
    if (!universities) return [];
    return universities.filter((uni: University) =>
      uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (uni.location && uni.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [universities, searchQuery]);

  const groupedUniversities = useMemo(() => {
    if (searchQuery || !universities) return null;

    const groups: Record<string, University[]> = {};
    universities.forEach((uni: University) => {
      const letter = uni.name.charAt(0).toUpperCase();
      if (/[A-Z]/.test(letter)) {
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(uni);
      } else {
        if (!groups['#']) groups['#'] = [];
        groups['#'].push(uni);
      }
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [universities, searchQuery]);

  const alphabet = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`section-${letter}`);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-12">
        {/* Dynamic Hero Section */}
        <div className="relative bg-slate-900 overflow-hidden py-16 md:py-24">
          {/* Abstract Background */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

          <div className="container relative z-10 text-center">
            <Badge variant="secondary" className="mb-4 bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-sm">
              Directory
            </Badge>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-white mb-6">
              Find Your University
            </h1>
            <p className="text-white/60 max-w-xl mx-auto mb-10 text-lg">
              Explore notes from top institutions. From assignments to exam papers, everything is here.
            </p>

            {/* Mega Search Bar */}
            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-colors opacity-50" />
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 flex items-center shadow-2xl">
                <Search className="h-6 w-6 text-white/50 ml-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search 50+ Universities..."
                  className="w-full bg-transparent border-none text-white placeholder:text-white/40 focus:outline-none focus:ring-0 text-lg px-4 py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="hidden sm:flex items-center gap-2 pr-2 text-xs text-white/40 font-mono border-l border-white/10 pl-4">
                  <span>CTRL</span>
                  <span>K</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Loading directory...</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_60px] gap-8">
              {/* Main Content */}
              <div className="space-y-12">
                {/* Search Mode (Flat List) */}
                {searchQuery ? (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-muted-foreground">
                      Found {filteredUniversities.length} result{filteredUniversities.length !== 1 && 's'}
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredUniversities.map((uni) => (
                        <UniversityCard key={uni.id} university={uni} />
                      ))}
                    </div>
                  </div>
                ) : (
                  // Directory Mode (Grouped A-Z)
                  groupedUniversities?.map(([letter, unis]) => (
                    <div key={letter} id={`section-${letter}`} className="relative scroll-mt-28">
                      <div className="flex items-center gap-4 mb-6 sticky top-20 bg-background/95 backdrop-blur py-2 z-10 border-b border-border/50">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-display font-bold text-xl text-primary">
                          {letter}
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">
                          {unis.length} {unis.length === 1 ? 'University' : 'Universities'}
                        </span>
                      </div>
                      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {unis.map((uni) => (
                          <UniversityCard key={uni.id} university={uni} />
                        ))}
                      </div>
                    </div>
                  ))
                )}

                {/* Empty State / Ghost Card */}
                {(!isLoading && filteredUniversities.length === 0 && searchQuery) && (
                  <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
                    <div className="h-16 w-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold text-lg">No universities found</h3>
                    <p className="text-muted-foreground">We couldn't find "{searchQuery}"</p>
                  </div>
                )}

                {/* "Add New" Request Section (Always at bottom) */}
                <div className="mt-12 py-8 border-t border-border">
                  <Link to="/contact">
                    <div className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/20 hover:border-primary/50 bg-primary/5 p-8 text-center transition-all duration-300 hover:bg-primary/10">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mb-2 font-display text-xl font-bold">Don't see your university?</h3>
                      <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                        We are adding new institutions every week. Request yours and we'll notify you when it's live.
                      </p>
                      <span className="inline-flex items-center font-semibold text-primary">
                        Request Addition <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              {/* A-Z Sidebar (Desktop Only) */}
              {!searchQuery && (
                <div className="hidden lg:block relative">
                  <div className="sticky top-24 right-0 flex flex-col gap-1 items-center bg-muted/30 p-2 rounded-full border border-border/50 max-h-[calc(100vh-8rem)] overflow-y-auto w-10 no-scrollbar">
                    {alphabet.map((letter) => (
                      <button
                        key={letter}
                        onClick={() => scrollToLetter(letter)}
                        className={cn(
                          "w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full transition-all hover:bg-primary hover:text-primary-foreground",
                          "text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        )}
                        disabled={!groupedUniversities?.some(([l]) => l === letter)}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function UniversityCard({ university }: { university: University }) {
  const gradient = useMemo(() => getGradient(university.name), [university.name]);
  const initials = useMemo(() => getInitials(university.name), [university.name]);

  return (
    <Link to={`/browse?university=${encodeURIComponent(university.name)}`} className="group block h-full">
      <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "h-14 w-14 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm border bg-gradient-to-br",
                gradient
              )}>
                {initials}
              </div>
              <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm border border-border">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </div>

            <h3 className="font-display font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {university.name}
            </h3>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{university.location}</span>
            </div>
          </div>

          {/* Decorative Footer stripe */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardContent>
      </Card>
    </Link>
  );
}
