import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, Users, Shield, Sparkles, ArrowRight, Star, TrendingUp, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';
import { Skeleton } from '@/components/ui/skeleton';

interface HeroSectionProps {
  headline?: string;
  subheadline?: string;
}

const FLIP_WORDS = ["Success", "Grades", "Future", "Career"];
const UNIVERSITIES = ["IIT Delhi", "BITS Pilani", "Delhi University", "Anna University", "VIT", "Mumbai University"];

export function HeroSection({
  headline: defaultHeadline = "Your Academic Notes,",
  subheadline: defaultSubheadline = "India's largest marketplace for quality academic notes. Join 50,000+ students acing their exams.",
}: HeroSectionProps) {
  const [flipIndex, setFlipIndex] = useState(0);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['content', 'home-hero'],
    queryFn: () => contentApi.get('home-hero'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const content = data || {};
  const displayHeadline = content.headline || defaultHeadline;
  const displaySubheadline = content.subheadline || defaultSubheadline;

  // Kinetic Typography Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setFlipIndex((prev) => (prev + 1) % FLIP_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <section className="relative h-[600px] flex items-center justify-center bg-background">
        <Skeleton className="h-12 w-3/4 max-w-2xl" />
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-background pt-6 pb-12 lg:pt-20 lg:pb-32">
      {/* 1. Aurora Background & Noise */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-blue-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[40%] translate-x-[-50%] translate-y-[-50%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[80px]" />

        {/* Grain Texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}></div>
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">

          {/* Left Column: Visuals & Text */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-8">
            {/* Greeting / Market Pill */}
            {isAuthenticated && user ? (
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                <span>Welcome back, {user.name}</span>
              </div>
            ) : (
              <div className="inline-flex items-center rounded-full border border-border bg-background/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                <span className="font-semibold text-foreground mr-1">500+</span> notes added today
              </div>
            )}

            {/* Kinetic Composition */}
            <div className="space-y-6 max-w-2xl">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]">
                {displayHeadline.split(',')[0]} <br />
                <span className="text-primary relative inline-block">
                  {/* Flip Word */}
                  <span className="relative z-10">{FLIP_WORDS[flipIndex]}</span>
                  <span className="absolute -bottom-2 left-0 w-full h-3 bg-primary/20 -z-10 -rotate-1"></span>
                </span>
              </h1>
              <p className="mx-auto lg:mx-0 max-w-[600px] text-muted-foreground md:text-xl leading-relaxed">
                {displaySubheadline}
              </p>
            </div>

            {/* DUAL CTA BUTTONS (Replacing Search) */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-2">
              <Link to="/browse" className="w-full sm:flex-1">
                <Button size="lg" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]">
                  <BookOpen className="mr-2 h-5 w-5" /> Explore Notes
                </Button>
              </Link>
              <Link to={isAuthenticated ? "/seller" : "/auth"} className="w-full sm:flex-1">
                <Button size="lg" variant="outline" className="w-full h-12 text-base font-semibold bg-background/60 backdrop-blur-sm border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all hover:scale-[1.02]">
                  <Upload className="mr-2 h-5 w-5" /> Sell Notes
                </Button>
              </Link>
            </div>

            {/* Social Proof (Avatar Stack) */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <Avatar key={i} className="border-2 border-background w-8 h-8 ring-1 ring-border">
                    <AvatarImage src={`https://i.pravatar.cc/100?img=${i + 10}`} />
                    <AvatarFallback>S{i}</AvatarFallback>
                  </Avatar>
                ))}
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-background bg-muted text-xs font-bold ring-1 ring-border">
                  +2k
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <div className="h-4 w-[1px] bg-border mx-1"></div>
                <span className="font-medium text-foreground">Top Rated</span> by students
              </div>
            </div>
          </div>

          {/* Right Column: 3D Visual Application (Web Design Concept) */}
          <div className="hidden lg:block relative perspective-[2000px] h-[500px]">
            {/* Abstract Floating Cards */}
            <div className="absolute top-10 left-10 w-64 h-80 bg-background rounded-2xl shadow-2xl border border-border p-4 transform rotate-y-12 rotate-z-6 animate-float z-20">
              <div className="h-4 w-32 bg-muted rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-muted/50 rounded"></div>
                <div className="h-2 w-5/6 bg-muted/50 rounded"></div>
                <div className="h-2 w-4/6 bg-muted/50 rounded"></div>
              </div>
              <div className="mt-8 flex gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10"></div>
                <div className="h-8 flex-1 bg-muted/30 rounded"></div>
              </div>
            </div>

            <div className="absolute top-24 left-48 w-64 h-80 bg-primary/5 backdrop-blur-md rounded-2xl shadow-xl border border-primary/10 p-4 transform -rotate-y-12 -rotate-z-3 animate-float-delayed z-10">
              {/* Decorative content */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="h-3 w-20 bg-primary/20 rounded mb-1"></div>
                  <div className="h-2 w-12 bg-primary/10 rounded"></div>
                </div>
              </div>
              <div className="h-32 w-full bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-primary/5 border-dashed flex items-center justify-center">
                <span className="text-xs text-primary/40 font-mono">CHEM_101.pdf</span>
              </div>
            </div>
          </div>
        </div>

        {/* University Ticker (Footer of Hero) */}
        <div className="mt-12 pt-6 border-t border-border/40">
          <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">Trusted by students from</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {UNIVERSITIES.map((name) => (
              <div key={name} className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Shield className="h-4 w-4" /> {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotateY(12deg) rotateZ(6deg); }
          50% { transform: translateY(-20px) rotateY(12deg) rotateZ(6deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotateY(-12deg) rotateZ(-3deg); }
          50% { transform: translateY(-15px) rotateY(-12deg) rotateZ(-3deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; animation-delay: 1s; }
      `}</style>
    </section>
  );
}
