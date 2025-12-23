import { Link } from 'react-router-dom';
import { Note } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, GraduationCap, Calendar, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface RelatedNotesProps {
    currentNote: Note;
    relatedNotes?: Note[];
    className?: string;
}

/**
 * Related Notes Widget for Internal Linking
 * Shows notes from same degree, semester, subject, or university
 * Improves SEO through contextual internal linking
 */
export function RelatedNotes({ currentNote, relatedNotes = [], className = '' }: RelatedNotesProps) {
    if (!relatedNotes || relatedNotes.length === 0) {
        return null;
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Students Also Viewed
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {relatedNotes.slice(0, 5).map((note) => (
                        <Link
                            key={note.id}
                            to={`/notes/${note.id}`}
                            className="block group hover:bg-muted/50 p-3 rounded-lg transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                        {note.title}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        {note.degree && (
                                            <Badge variant="secondary" className="text-xs">
                                                <GraduationCap className="w-3 h-3 mr-1" />
                                                {note.degree}
                                            </Badge>
                                        )}
                                        {note.semester && (
                                            <Badge variant="outline" className="text-xs">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                Sem {note.semester}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="font-bold text-primary text-sm">
                                        {formatCurrency(note.price)}
                                    </div>
                                    {note.rating && (
                                        <div className="text-xs text-muted-foreground">
                                            ⭐ {note.rating.toFixed(1)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Contextual Links */}
                <div className="mt-4 pt-4 border-t space-y-2">
                    <Link
                        to={`/browse?degree=${currentNote.degree}`}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        <GraduationCap className="w-4 h-4" />
                        View all {currentNote.degree} notes
                    </Link>
                    {currentNote.semester && (
                        <Link
                            to={`/browse?degree=${currentNote.degree}&semester=${currentNote.semester}`}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            <Calendar className="w-4 h-4" />
                            View Semester {currentNote.semester} notes
                        </Link>
                    )}
                    {currentNote.subject && (
                        <Link
                            to={`/browse?subject=${encodeURIComponent(currentNote.subject)}`}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            <BookOpen className="w-4 h-4" />
                            View all {currentNote.subject} notes
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
