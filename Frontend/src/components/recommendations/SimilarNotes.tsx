/**
 * SIMILAR NOTES COMPONENT
 * 
 * Shows similar notes using Gorse item-to-item collaborative filtering
 * Phase 4: Frontend Integration
 */

import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { NoteCard } from '@/components/notes/NoteCard';
import api from '@/lib/api';

interface SimilarNotesProps {
    noteId: string;
}

export function SimilarNotes({ noteId }: SimilarNotesProps) {
    const { data: similarNotes = [], isLoading } = useQuery({
        queryKey: ['recommendations', 'similar', noteId],
        queryFn: async () => {
            try {
                const { data } = await api.get(`/recommendations/similar/${noteId}`, {
                    params: { limit: 4 }
                });
                return data.data || [];
            } catch (error) {
                console.warn('Similar notes API failed:', error);
                return [];
            }
        },
        enabled: !!noteId,
        staleTime: 30 * 60 * 1000  // 30 minutes (stable)
    });

    if (isLoading) {
        return (
            <section className="py-12 border-t">
                <div className="container">
                    <h3 className="text-2xl font-bold mb-6">Similar Notes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-96 rounded-xl bg-muted/50 animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (similarNotes.length === 0) {
        return null;  // Hide section if no similar notes
    }

    return (
        <section className="py-12 border-t bg-muted/10">
            <div className="container">
                <div className="flex items-center gap-2 mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <Sparkles className="h-3 w-3" />
                        <span>You Might Like</span>
                    </div>
                    <h3 className="text-2xl font-bold ml-2">Similar Notes</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {similarNotes.map((note: any) => (
                        <NoteCard key={note.id} note={note} />
                    ))}
                </div>
            </div>
        </section>
    );
}
