import { Link } from 'react-router-dom';
import { ArrowRight, Star, Quote, CheckCircle2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';

export function TopRatedNotes() {
  const { data: topRated = [] } = useQuery({
    queryKey: ['notes', 'top-rated-section'],
    queryFn: async () => {
      const { data } = await api.get('/notes?limit=4&sort=rating');
      return data.data.notes;
    }
  });

  return (
    <section className="py-16 lg:py-24 bg-muted/30 border-t border-border/50">
      <div className="container">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-yellow-600 mb-3 uppercase tracking-wider">
              <Star className="h-4 w-4 fill-current" />
              Hall of Fame
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl leading-tight">
              Student <span className="text-primary italic">Favorites</span>
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Don't just take our word for it. Explore the highest-rated resources that successfully helped thousands of students ace their exams.
            </p>
          </div>
          <Link to="/browse?sort=rating">
            <Button className="hidden md:flex rounded-full px-6 h-12 shadow-md hover:shadow-lg transition-all" variant="default">
              View Hall of Fame <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Testimonial Wall Grid - Mobile Carousel / Desktop Grid */}
        <div className="relative group/container">
          {/* Mobile Scroll Hints */}
          <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-muted/30 to-transparent z-10 md:hidden pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-muted/30 to-transparent z-10 md:hidden pointer-events-none" />

          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto snap-x snap-mandatory pb-8 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {topRated.map((note: any, index: number) => {
              // Defensive: Ensure rating is a number
              const rating = typeof note.averageRating === 'number' ? note.averageRating : 5;
              const price = note.priceInr || note.price || 0;

              return (
                <Link
                  key={note.id}
                  to={`/notes/${note.id}`}
                  className="group relative flex-none w-[300px] md:w-auto snap-center"
                >
                  <div
                    className="flex flex-col justify-between h-full min-h-[320px] rounded-3xl bg-card p-6 border border-border/50 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 relative overflow-hidden"
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    {/* Decorative Quote Icon */}
                    <Quote className="absolute top-6 right-6 h-12 w-12 text-primary/5 -scale-x-100 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6" />

                    {/* 1. Review Content */}
                    <div className="relative z-10 mb-6 flex-1">
                      <div className="flex gap-0.5 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("h-4 w-4 fill-yellow-400 text-yellow-400", i >= Math.round(rating) && "text-muted fill-muted/20")} />
                        ))}
                      </div>

                      <h3 className="text-xl font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2 break-words">
                        "Essential resource for {note.subject || 'Exams'}."
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 break-words">
                        Highly rated by students from <span className="font-medium text-foreground">{note.university?.name || note.university || 'Top Universities'}</span>. Clear concepts and great diagrams.
                      </p>
                    </div>

                    {/* 2. Reviewer Profile */}
                    <div className="relative z-10 flex items-center gap-3 mb-6 pt-4 border-t border-dashed border-border/60 shrink-0">
                      <Avatar className="h-9 w-9 border border-background shadow-sm shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-bold">VS</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-foreground flex items-center gap-1 whitespace-nowrap">
                          Verified Student <CheckCircle2 className="h-3 w-3 text-blue-500 fill-blue-500/10 shrink-0" />
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">Verified Purchase</span>
                      </div>
                    </div>

                    {/* 3. Attached Note (Product Anchor) */}
                    <div className="relative z-10 mt-auto shrink-0">
                      <div className="flex items-center gap-3 p-2 pr-3 rounded-xl bg-muted/50 border border-transparent group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                        <div className="h-10 w-10 flex-none rounded-lg overflow-hidden bg-background">
                          <img
                            src={note.fileUrl?.endsWith('.pdf') ? 'https://placehold.co/100?text=PDF' : (note.coverImage || 'https://placehold.co/100?text=Note')}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground line-clamp-1 break-all group-hover:text-primary transition-colors">
                            {note.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {price > 0 ? `₹${price}` : 'FREE'} • View Note
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 flex-none text-muted-foreground group-hover:text-primary -translate-x-1 group-hover:translate-x-0 transition-transform opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile View All */}
        <div className="md:hidden mt-0 text-center">
          <Link to="/browse?sort=rating">
            <Button variant="outline" className="w-full h-12">
              View Hall of Fame <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}