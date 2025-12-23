import { Note } from '@/types';

/**
 * Internal Linking Utility for SEO
 * Generates contextual links for hub-spoke model
 */

export interface RelatedLinks {
    sameDegree: string;
    sameSemester: string;
    sameSubject: string;
    hub: string;
}

/**
 * Generate related links for a note
 * Used for automated internal linking
 */
export const generateRelatedLinks = (note: Note): RelatedLinks => {
    const degree = note.degree || '';
    const semester = note.semester || '';
    const subject = note.subject || '';

    return {
        sameDegree: `/browse?degree=${encodeURIComponent(degree)}`,
        sameSemester: `/browse?degree=${encodeURIComponent(degree)}&semester=${semester}`,
        sameSubject: `/browse?subject=${encodeURIComponent(subject)}`,
        hub: `/hub/${degree.toLowerCase()}`,
    };
};

/**
 * Generate contextual anchor text for internal links
 */
export const generateAnchorText = (note: Note, linkType: keyof RelatedLinks): string => {
    switch (linkType) {
        case 'sameDegree':
            return `${note.degree} notes`;
        case 'sameSemester':
            return `${note.degree} Semester ${note.semester} notes`;
        case 'sameSubject':
            return `${note.subject} study material`;
        case 'hub':
            return `${note.degree} Notes Hub`;
        default:
            return 'related notes';
    }
};

/**
 * Get breadcrumb path for a note
 */
export const getNoteBreadcrumbs = (note: Note) => {
    return [
        { name: 'Home', url: '/' },
        { name: 'Browse', url: '/browse' },
        { name: note.degree || 'Notes', url: `/browse?degree=${encodeURIComponent(note.degree || '')}` },
        { name: note.title, url: `/notes/${note.id}` },
    ];
};

/**
 * Calculate internal link priority
 * Higher score = more important link
 */
export const calculateLinkPriority = (note: Note, targetNote: Note): number => {
    let score = 0;

    // Same degree: +3
    if (note.degree === targetNote.degree) score += 3;

    // Same semester: +2
    if (note.semester === targetNote.semester) score += 2;

    // Same subject: +5 (highest priority)
    if (note.subject === targetNote.subject) score += 5;

    // Same university: +1
    if (note.university === targetNote.university) score += 1;

    return score;
};

/**
 * Sort notes by relevance for "Related Notes" widget
 */
export const sortNotesByRelevance = (currentNote: Note, notes: Note[]): Note[] => {
    return notes
        .filter((note) => note.id !== currentNote.id) // Exclude current note
        .map((note) => ({
            note,
            priority: calculateLinkPriority(currentNote, note),
        }))
        .sort((a, b) => b.priority - a.priority) // Highest priority first
        .map((item) => item.note);
};
