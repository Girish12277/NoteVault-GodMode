import { Link } from 'react-router-dom';
import { ArrowRight, Download, Flame, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatCurrency } from '@/lib/formatters';

export function MostDownloaded() {
  const { data: topDownloaded = [] } = useQuery({
    queryKey: ['notes', 'most-downloaded'],
    queryFn: async () => {
      const { data } = await api.get('/notes?limit=5&sort=popular');
      return data.data.notes;
    }
  });

  const getRankStyles = (index: number) => {
    switch (index) {
      case 0: return {
        text: "bg-gradient-to-br from-amber-300 to-amber-600 bg-clip-text text-transparent",
        glow: "shadow-amber-500/20 hover:shadow-amber-500/30 border-amber-500/20",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Trophy,
        label: "Gold"
      };
      case 1: return {
        text: "bg-gradient-to-br from-slate-300 to-slate-500 bg-clip-text text-transparent",
        glow: "shadow-slate-500/20 hover:shadow-slate-500/30 border-slate-500/20",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        icon: Trophy,
        label: "Silver"
      };
      case 2: return {
        text: "bg-gradient-to-br from-orange-400 to-orange-700 bg-clip-text text-transparent",
        glow: "shadow-orange-500/20 hover:shadow-orange-500/30 border-orange-500/20",
        badge: "bg-orange-100 text-orange-800 border-orange-200",
        icon: Trophy,
        label: "Bronze"
      };
      default: return {
        text: "text-muted-foreground/40",
        glow: "hover:shadow-primary/5 border-border/50",
        badge: "bg-muted text-muted-foreground border-border",
        icon: null,
        label: null
      };
    }
  };

  // Calculate relative stats for the "Heat Bar" calculation
  const maxDownloads = topDownloaded.length > 0 ? (topDownloaded[0].totalDownloads || 100) : 100;

  return (
    <section className="py-8 lg:py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container">

        {/* Header Center Aligned */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-sm font-semibold text-orange-600 mb-3 md:mb-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <Flame className="h-4 w-4 fill-orange-600" />
            <span>Viral Favorites</span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-3 md:mb-4">
            Most <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Downloaded</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            The most trusted notes on the platform, ranked by real-time student demand.
          </p>
        </div>

        {/* Leaderboard Layout: Mobile Carousel -> Desktop Stack */}
        <div className="relative group/container max-w-4xl mx-auto">
          {/* Mobile Scroll Hints */}
          <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-background to-transparent z-10 md:hidden pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-background to-transparent z-10 md:hidden pointer-events-none" />

          {/* Added scroll-pl-4 for Start Padding */}
          <div className="flex md:flex-col gap-4 overflow-x-auto snap-x snap-mandatory pb-8 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 scroll-pl-4">
            {topDownloaded.map((note: any, index: number) => {
              const rankStyle = getRankStyles(index);

              const downloads = note.totalDownloads || 0;
              // Heat Bar Logic: If downloads < 5, show minimal "New" bar (5%), else calculate true percentage
              const percentage = downloads < 5 ? 5 : Math.round((downloads / (maxDownloads || 1)) * 100);
              const showHeatBar = true; // Always show structure, but style differently for low count

              return (
                <Link
                  key={note.id}
                  to={`/notes/${note.id}`}
                  className={cn(
                    "group relative flex-none w-[280px] md:w-full snap-center md:snap-align-none", // Mobile: Card width, Desktop: Full width
                    "flex flex-col md:flex-row items-center gap-4 md:gap-6 p-5 rounded-2xl bg-card border transition-all duration-300",
                    "hover:-translate-y-1 hover:shadow-lg",
                    rankStyle.glow
                  )}
                >
                  {/* 1. Rank Number (Absolute on Mobile, Left on Desktop) */}
                  {/* FIX: Pos left-5 (Balanced), Z-20, w-20, Padding Right/Left to fix italic clipping */}
                  <div className="absolute top-4 left-5 md:static md:w-20 md:flex-none flex items-center justify-center z-20 md:relative">
                    <span className={cn(
                      "font-display text-5xl md:text-5xl font-black italic tracking-tight transition-all duration-500 pr-2 pl-1", // Changed tracking-tighter to tight, added padding
                      rankStyle.text
                    )}>
                      {index + 1}
                    </span>
                  </div>

                  {/* 2. Thumbnail */}
                  {/* Added shrink-0 and relative z-10 contexts */}
                  <div className="relative h-40 w-full md:h-16 md:w-16 md:flex-none rounded-xl overflow-hidden bg-muted shadow-sm group-hover:shadow-md transition-all shrink-0 z-10">
                    <img
                      src={note.fileUrl?.endsWith('.pdf') ? 'https://placehold.co/100?text=PDF' : (note.coverImage || 'https://placehold.co/100?text=Note')}
                      alt={note.title}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=Note'}
                    />
                    {/* Badge Overlay for Top 3 */}
                    {index < 3 && (
                      <div className="absolute top-2 right-2 md:hidden">
                        <Badge variant="secondary" className={cn("font-bold shadow-sm backdrop-blur-md", rankStyle.badge)}>
                          #{index + 1} Trending
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* 3. Content Info */}
                  <div className="flex-1 w-full min-w-0 flex flex-col items-start text-left z-10">
                    {/* Added 'break-all' and 'line-clamp-1' for Anti-Explosion */}
                    <h3 className="font-semibold text-foreground text-lg line-clamp-1 break-all group-hover:text-primary transition-colors w-full">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 w-full">
                      <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium text-foreground/80 whitespace-nowrap">{note.subject}</span>
                      <span className="truncate">by {note.author?.name}</span>
                    </div>
                  </div>

                  {/* 4. Metrics & Heat Bar */}
                  <div className="w-full md:w-48 flex flex-col gap-2 mt-2 md:mt-0 md:items-end shrink-0 z-10">
                    <div className="flex items-center justify-between w-full md:justify-end gap-2 text-sm font-medium">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        {downloads > 5 ? (
                          <>{formatNumber(downloads)} <span className="text-muted-foreground font-normal">downloads</span></>
                        ) : (
                          <span className="text-muted-foreground font-normal">Just Started</span>
                        )}
                      </span>
                      <span className="md:hidden font-bold text-primary">{formatCurrency(note.price || note.priceInr || 0)}</span>
                    </div>

                    {/* Heat Bar */}
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000 ease-out",
                          downloads < 5 ? "bg-muted-foreground/30" : "bg-gradient-to-r",
                          (downloads >= 5 && index === 0) ? "from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : (downloads >= 5 ? "from-primary/60 to-primary" : "")
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Desktop Price & Arrow */}
                  {/* Added shrink-0 and transition for hover-hide */}
                  <div className="hidden md:flex flex-col items-end gap-1 w-24 text-right pl-4 border-l border-border/50 shrink-0 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none z-10">
                    <span className="font-bold text-lg text-primary">{formatCurrency(note.price || note.priceInr || 0)}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Get Now</span>
                  </div>

                  {/* Hover Reveal Arrow */}
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden md:flex items-center justify-center bg-primary/10 w-10 h-10 rounded-full z-20">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>
                </Link>
              );
            })}

            {/* Mobile "See All" Card */}
            <div className="flex-none w-[150px] snap-center md:hidden flex items-center justify-center">
              <Link to="/browse?sort=popular" className="group flex flex-col items-center gap-3 p-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="font-medium text-sm text-foreground">View Top 50</span>
              </Link>
            </div>

          </div>
        </div>

        <div className="mt-12 text-center hidden md:block">
          <Link to="/browse?sort=popular">
            <Button variant="outline" size="lg" className="rounded-full px-8 border-primary/20 hover:border-primary hover:bg-primary/5 group">
              See Full Leaderboard
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}