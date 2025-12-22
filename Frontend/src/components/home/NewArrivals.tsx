import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Star, Sparkles, Upload, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from '@/lib/formatters';

export function NewArrivals() {
  const { data: recentNotes = [] } = useQuery({
    queryKey: ['notes', 'new-arrivals'],
    queryFn: async () => {
      const { data } = await api.get('/notes?limit=6&sort=newest');
      return data.data?.notes || data.data || [];
    }
  });

  const formatTimeAgo = (date: Date) => {
    try {
      const diff = Date.now() - new Date(date).getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      return `${Math.floor(days / 7)}w ago`;
    } catch (e) {
      return '';
    }
  };

  return (
    <section className="py-8 lg:py-20 bg-background border-t border-border/40">
      <div className="container">
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              Live Feed
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Just <span className="text-primary/90">Arrived</span>
            </h2>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Fresh notes uploaded by students across the country in real-time.
            </p>
          </div>
          <Link to="/browse?sort=newest" className="hidden sm:inline-block">
            <Button variant="outline" size="sm" className="h-9">
              View Full Feed <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Column: Timeline Feed */}
          <div className="lg:col-span-2 space-y-4">
            {recentNotes.map((note: any, index: number) => {
              const isFirst = index === 0;
              return (
                <Link
                  key={note.id || index}
                  to={`/notes/${note.id}`}
                  className={cn(
                    "group flex sm:items-center gap-4 p-4 rounded-xl border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/30",
                    isFirst ? "border-primary/40 bg-primary/5 ring-1 ring-primary/10" : "border-border/60"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-none rounded-lg overflow-hidden bg-muted">
                    {isFirst && (
                      <div className="absolute top-0 right-0 z-10 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-bl-lg">
                        NEW
                      </div>
                    )}
                    <img
                      src={note.fileUrl?.endsWith('.pdf') ? 'https://placehold.co/200?text=PDF' : (note.coverImage || 'https://placehold.co/200?text=Note')}
                      alt={note.title}
                      onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/200?text=Note'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                      <span className="font-medium text-foreground">{note.subject}</span>
                      <span>•</span>
                      <span>{note.university?.name || note.universityName || 'University'}</span>
                    </div>
                    <h3 className="font-semibold text-foreground text-base sm:text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={note.author?.avatar} />
                        <AvatarFallback className="text-xs">{note.author?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate max-w-[100px]">{note.author?.name}</span>

                      {/* Rating Badge */}
                      <div className="hidden sm:flex items-center gap-1 text-xs bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">
                        <Star className="h-3 w-3 fill-current" /> {note.rating || 'New'}
                      </div>
                    </div>
                  </div>

                  {/* Action / Meta */}
                  <div className="flex flex-col items-end justify-between self-stretch py-1 pl-4 border-l border-border/50 ml-2">
                    <div className={cn("text-xs font-medium flex items-center gap-1", isFirst ? "text-primary" : "text-muted-foreground")}>
                      {isFirst && <Zap className="h-3 w-3 fill-current animate-pulse" />}
                      {formatTimeAgo(note.createdAt)}
                    </div>

                    <div className="mt-auto">
                      <span className="block text-lg font-bold text-foreground text-right">{formatCurrency(note.price || note.priceInr || 0)}</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Buy Now</span>
                    </div>
                  </div>
                </Link>
              );
            })}

            <Link to="/browse?sort=newest" className="flex sm:hidden mt-6">
              <Button variant="secondary" className="w-full">
                Load More Notes
              </Button>
            </Link>
          </div>

          {/* Right Column: Seller CTA */}
          <div className="space-y-6">
            <div className="sticky top-24 rounded-2xl border border-border bg-gradient-to-b from-card to-background p-6 shadow-sm overflow-hidden relative group">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 p-12 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />

              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-bold mb-2">Have notes?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Turn your hard work into passive income. Upload your study materials and earn every time a student downloads them.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                      <DollarSign className="h-3.5 w-3.5" />
                    </div>
                    <span>Set your own prices</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                    <span>Track real-time earnings</span>
                  </div>
                </div>

                <Link to="/seller" className="block">
                  <Button className="w-full shadow-lg shadow-primary/20 group-hover:shadow-primary/30">
                    Start Selling Today
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}