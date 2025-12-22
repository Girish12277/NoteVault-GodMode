/**
 * TRENDING NOTES COMPONENT
 * 
 * Shows popular/trending notes using FREE Gorse recommendation engine
 * Phase 4: Frontend Integration
 */

import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteCard } from '@/components/notes/NoteCard';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function TrendingNotes() {
    const { data: trendingNotes = [], isLoading } = useQuery({
        queryKey: ['recommendations', 'popular'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/recommendations/popular', {
                    params: { limit: 6 }
                });
                return data.data || [];
            } catch (error) {
                console.warn('Trending API failed:', error);
                return [];
            }
        },
        staleTime: 10 * 60 * 1000  // 10 minutes
    });

    if (isLoading) {
        return (
            <section className="py-12 bg-muted/20">
                <div className="container">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <h2 className="text-2xl font-bold">Trending Now</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-96 rounded-xl bg-muted/50 animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (trendingNotes.length === 0) {
        return null;  // Hide section if no trending notes
    }

    return (
        <section className="py-12 bg-muted/20">
            <div className="container">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <TrendingUp className="h-3 w-3" />
                            <span>Hot This Week</span>
                        </div>
                        <h2 className="text-3xl font-bold ml-2">Trending Notes</h2>
                    </div>

                    <Link to="/browse?sort=popular">
                        <Button variant="outline" className="hidden md:flex">
                            View All <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingNotes.slice(0, 6).map((note: any) => (
                        <NoteCard key={note.id} note={note} />
                    ))}
                </div>

                <div className="mt-6 text-center md:hidden">
                    <Link to="/browse?sort=popular">
                        <Button variant="outline" className="w-full">
                            View All Trending <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
