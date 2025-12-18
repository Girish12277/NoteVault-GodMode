import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Star, Clock, Crown, Flame, Zap, Award, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';

export function FeaturedNotes() {
  const fetchNotes = async (sort: string) => {
    // Fetch 5 to fill Hero (1) + Sidebar (4)
    const { data } = await api.get(`/notes?limit=5&sort=${sort}`);
    return data.data.notes;
  };

  const { data: trendingNotes = [], isLoading: isTrendingLoading } = useQuery({
    queryKey: ['notes', 'trending'],
    queryFn: () => fetchNotes('popular')
  });

  const { data: topRatedNotes = [], isLoading: isRatedLoading } = useQuery({
    queryKey: ['notes', 'top-rated'],
    queryFn: () => fetchNotes('rating')
  });

  const { data: recentNotes = [], isLoading: isRecentLoading } = useQuery({
    queryKey: ['notes', 'recent'],
    queryFn: () => fetchNotes('newest')
  });

  // Smart Skeleton Component for Magazine Layout matches exactly the content shape
  const MagazineSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 lg:gap-8 h-full">
      <Skeleton className="w-full h-[500px] rounded-3xl" />
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="w-full h-24 rounded-xl" />
        ))}
        <Skeleton className="w-full h-10 mt-auto" />
      </div>
    </div>
  );

  const isLoading = isTrendingLoading || isRatedLoading || isRecentLoading;

  // Reusable Magazine Layout Renderer
  const MagazineLayout = ({ notes, type }: { notes: any[], type: 'trending' | 'rated' | 'recent' }) => {
    if (!notes || notes.length === 0) return <div className="text-center py-10 text-muted-foreground">No notes found.</div>;

    const heroNote = notes[0];
    const sidebarNotes = notes.slice(1, 5);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 lg:gap-8 h-full">
        {/* Left: The "Hero" Editor's Choice */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative h-full min-h-[400px] lg:min-h-[500px] rounded-3xl border bg-card p-0 overflow-hidden flex flex-col shadow-lg transition-all hover:shadow-2xl">
            {/* Hero Image/Preview Area */}
            <div className="relative h-[250px] bg-muted/50 overflow-hidden group/image">
              {heroNote.previewUrl ? (
                <img src={heroNote.previewUrl} alt={heroNote.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-muted to-muted/50">
                  <img src="/placeholder-note.png" className="w-24 h-32 opacity-20" alt="No Preview" />
                </div>
              )}
              {/* Badge Overlay */}
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-primary/90 hover:bg-primary text-primary-foreground px-3 py-1 text-sm shadow-lg backdrop-blur-md border-0">
                  {type === 'trending' && <><Flame className="w-3 h-3 mr-1 fill-current" /> #1 Trending</>}
                  {type === 'rated' && <><Crown className="w-3 h-3 mr-1 fill-current" /> Editor's Choice</>}
                  {type === 'recent' && <><Zap className="w-3 h-3 mr-1 fill-current" /> Fresh Drop</>}
                </Badge>
              </div>

              {/* Quick Action Overlay */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md backdrop-blur-md bg-background/80 hover:bg-background">
                  <Bookmark className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {/* Hero Content Area */}
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-b from-card to-muted/5">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">{heroNote.subject}</span>
                  <span>•</span>
                  <span>{heroNote.university || 'University'}</span>
                </div>
                <Link to={`/notes/${heroNote.id}`}>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {heroNote.title}
                  </h3>
                </Link>
                <p className="text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
                  {heroNote.description || "Unlock comprehensive insights with this top-tier study resource. Perfect for exam preparation and deep diving into core concepts."}
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    <AvatarImage src={heroNote.author?.avatar} />
                    <AvatarFallback>{heroNote.author?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{heroNote.author?.name}</span>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Star className="w-3 h-3 text-amber-500 fill-current mr-1" />
                      {heroNote.averageRating || 'New'} ({heroNote.totalReviews || 0})
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">₹{heroNote.price}</div>
                  <Link to={`/notes/${heroNote.id}`}>
                    <Button size="sm" className="mt-1 rounded-full px-5 h-8">View Note</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: The Sidebar List - IMPROVED VISUALS */}
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
            <Award className="w-4 h-4 mr-2" /> Top Picks
          </h4>
          {sidebarNotes.map((note, idx) => (
            <Link key={note.id} to={`/notes/${note.id}`} className="group/item">
              <div className="flex gap-4 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-all hover:border-primary/30 hover:shadow-md items-start">

                {/* 1. Subtle Rank Number */}
                <div className="flex-none flex items-center justify-center w-6 pt-1 text-sm font-bold text-muted-foreground/40 font-display">
                  0{idx + 2}
                </div>

                {/* 2. Visual Thumbnail (New) */}
                <div className="flex-none w-16 h-16 rounded-lg bg-muted overflow-hidden border border-border/50 relative">
                  {note.previewUrl ? (
                    <img src={note.previewUrl} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* 3. Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-16 py-0.5">
                  <div>
                    <h5 className="font-semibold text-foreground truncate group-hover/item:text-primary transition-colors text-sm sm:text-base">
                      {note.title}
                    </h5>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="bg-muted px-1.5 py-0.5 rounded">{note.subject}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="flex items-center text-xs text-muted-foreground">
                      <Star className="w-3 h-3 text-amber-500 mr-1 fill-current" /> {note.averageRating || 0}
                    </span>
                    <span className="font-bold text-primary text-sm">₹{note.price}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          <Link to="/browse" className="mt-auto pt-4">
            <Button variant="outline" className="w-full border-dashed">
              Browse All Collection <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <section className="py-12 lg:py-24 bg-background">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl leading-tight">
              Featured <span className="text-primary">Collections</span>
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Handpicked selections. Whether it's viral hits or faculty favorites, find the best notes here.
            </p>
          </div>

          {/* Desktop "View All" */}
          <Link to="/browse">
            <Button variant="ghost" className="hidden md:flex group">
              View All Notes
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="w-full md:w-auto inline-flex h-12 items-center justify-start rounded-full bg-muted/50 p-1 text-muted-foreground mb-8">
            <TabsTrigger
              value="trending"
              className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm font-medium"
            >
              <TrendingUp className="mr-2 h-4 w-4 text-orange-500" />
              Trending Now
            </TabsTrigger>
            <TabsTrigger
              value="top-rated"
              className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm font-medium"
            >
              <Crown className="mr-2 h-4 w-4 text-yellow-500" />
              Editor's Choice
            </TabsTrigger>
            <TabsTrigger
              value="recent"
              className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm font-medium"
            >
              <Clock className="mr-2 h-4 w-4 text-blue-500" />
              New Arrivals
            </TabsTrigger>
          </TabsList>

          {/* Content Area with Loading State Handling */}
          <div className="min-h-[500px]">
            {isLoading ? (
              <MagazineSkeleton />
            ) : (
              <>
                <TabsContent value="trending" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <MagazineLayout notes={trendingNotes} type="trending" />
                </TabsContent>

                <TabsContent value="top-rated" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <MagazineLayout notes={topRatedNotes} type="rated" />
                </TabsContent>

                <TabsContent value="recent" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <MagazineLayout notes={recentNotes} type="recent" />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </section>
  );
}
