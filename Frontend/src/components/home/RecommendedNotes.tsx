import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, User, ChevronLeft, ChevronRight, Lock, Zap, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteCard } from '@/components/notes/NoteCard';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

// Demo notes for the "Teaser Blur" effect
const DEMO_NOTES = [
  { id: 'd1', title: 'Advanced Thermodynamics', subject: 'Physics', price: 299, author: { name: 'Dr. S. Physics' }, rating: 4.8, university: 'IIT Delhi' },
  { id: 'd2', title: 'Data Structures Algo', subject: 'Computer Science', price: 199, author: { name: 'Code Master' }, rating: 4.9, university: 'BITS Pilani' },
  { id: 'd3', title: 'Organic Chemistry II', subject: 'Chemistry', price: 249, author: { name: 'Chem Whiz' }, rating: 4.7, university: 'Delhi University' },
  { id: 'd4', title: 'Calculus III Notes', subject: 'Mathematics', price: 150, author: { name: 'Math Gen' }, rating: 4.5, university: 'Anna University' },
];

export function RecommendedNotes() {
  const { user, isAuthenticated } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: recommendedNotes = [], isLoading } = useQuery({
    queryKey: ['notes', 'recommended', user?.id],
    queryFn: async () => {
      if (isAuthenticated && user) {
        const params: any = { limit: 8 }; // Increased limit for carousel
        if (user.degree) params.degree = user.degree;
        if (user.universityId) params.universityId = user.universityId;

        const { data } = await api.get('/notes', { params });
        return data.data.notes;
      }
      return [];
    },
    enabled: !!isAuthenticated && !!user
  });

  // Responsive Scroll Logic (80% of view width)
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 1. Unauthenticated Teaser View
  if (!isAuthenticated) {
    return (
      <section className="py-16 bg-background relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-64 bg-primary/5 blur-3xl pointer-events-none" />

        <div className="container relative">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Unlock Your <span className="text-primary">Personalized Feed</span>
            </h2>
            <p className="text-muted-foreground mt-2">
              See what students in your course are reading right now.
            </p>
          </div>

          <div className="relative">
            {/* The Blurred Content */}
            <div className="flex gap-6 overflow-hidden blur-sm opacity-50 select-none pointer-events-none mask-image-linear-gradient">
              {DEMO_NOTES.map((note, i) => (
                <div key={note.id} className="min-w-[280px] sm:min-w-[320px] transform scale-95">
                  <div className="h-[380px] rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-4">
                    <div className="h-40 rounded-lg bg-muted/50 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-muted/50 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* The Overlay CTA */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-card/80 backdrop-blur-md border border-primary/20 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4 animate-in fade-in zoom-in duration-500">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Hidden for Privacy</h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  Sign in to verify your university and access notes tailored to your curriculum.
                </p>
                <Link to="/auth">
                  <Button size="lg" className="w-full shadow-lg shadow-primary/20">
                    <User className="mr-2 h-4 w-4" /> Sign In to Reveal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. Authenticated Empty State (Fallback - Never Hide)
  if (recommendedNotes.length === 0 && !isLoading) {
    return (
      <section className="py-12 border-b border-border/40">
        <div className="container text-center py-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Start Your Collection</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            We're still learning about your preferences. Explore subjects to get better recommendations.
          </p>
          <Link to="/browse">
            <Button variant="outline">Browse All Notes</Button>
          </Link>
        </div>
      </section>
    );
  }

  // 3. Authenticated Carousel View
  return (
    <section className="py-16 bg-muted/20 relative overflow-hidden group/section">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <Sparkles className="w-64 h-64 text-primary" />
      </div>

      <div className="container relative">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
              <Zap className="h-3 w-3" />
              <span>Tailored For You</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Top Picks for <span className="text-primary">{user?.degree || 'Students'}</span>
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Highly rated notes from {user?.universityName || 'your university'} and related courses.
            </p>
          </div>

          {/* Scroll Controls */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => scroll('left')} className="rounded-full h-10 w-10 border-primary/20 hover:border-primary hover:bg-primary/5">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scroll('right')} className="rounded-full h-10 w-10 border-primary/20 hover:border-primary hover:bg-primary/5">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Fade Gradients for Scroll Hint */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 md:hidden pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 md:hidden pointer-events-none" />

          {/* FIX: Increased top padding (pt-8) to prevent clipping of the Match Badge */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 pt-10 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {recommendedNotes.map((note: any, index: number) => (
              <div
                key={note.id}
                className="min-w-[280px] sm:min-w-[320px] snap-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 rounded-xl"
              >
                <div className="relative">
                  {/* Match Badge Logic (Visual Simulation) */}
                  <div className="absolute -top-3 left-4 z-20 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 border border-emerald-400">
                    <Sparkles className="h-2 w-2 text-white" /> 9{8 - index}% Match
                  </div>
                  <NoteCard note={note} />
                </div>
              </div>
            ))}

            {/* "View All" End Card - REDESIGNED as Glass Stack */}
            <div className="min-w-[280px] sm:min-w-[320px] flex items-center justify-center snap-center p-1">
              <Link to="/browse" className="w-full h-full">
                <div className="group relative w-full h-[400px] flex flex-col items-center justify-center text-center">
                  {/* Stack Effect Cards */}
                  <div className="absolute inset-x-8 top-10 bottom-10 bg-card/60 border border-border rounded-2xl rotate-3 scale-95 transition-transform group-hover:rotate-6 group-hover:scale-95 shadow-sm" />
                  <div className="absolute inset-x-6 top-8 bottom-12 bg-card/80 border border-border rounded-2xl -rotate-2 scale-95 transition-transform group-hover:-rotate-4 group-hover:scale-100 shadow-md" />

                  {/* Main Interactive Card */}
                  <div className="relative w-full h-full bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl flex flex-col items-center justify-center gap-6 p-8 transition-all duration-300 group-hover:bg-primary/5 group-hover:border-primary/20 shadow-xl">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
                      <Layers className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Discover More</h4>
                      <p className="text-sm text-muted-foreground px-4">
                        Explore thousands of notes tailored to your curriculum.
                      </p>
                    </div>
                    <Button className="rounded-full px-6 shadow-md shadow-primary/20">
                      View Full Library <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}