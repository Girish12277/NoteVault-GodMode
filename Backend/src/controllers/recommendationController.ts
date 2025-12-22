/**
 * RECOMMENDATION CONTROLLER
 * 
 * Provides API endpoints for personalized recommendations
 * Integrates with Gorse recommendation engine + caching
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { gorseService } from '../services/gorseRecommendationService';
import { prisma } from '../config/database';
import { cacheService } from '../services/cacheService';

const prismaAny = prisma as any;

// Cache TTLs
const CACHE_TTL = {
    personalized: 5 * 60,      // 5 minutes
    similar: 30 * 60,          // 30 minutes (stable)
    popular: 10 * 60,          // 10 minutes
    latest: 2 * 60             // 2 minutes (changes frequently)
};

export const recommendationController = {
    /**
     * GET /api/recommendations
     * Get personalized recommendations for authenticated user
     */
    getPersonalized: async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const limit = parseInt(req.query.limit as string) || 20;

            // Check cache
            const cacheKey = `recommendations:user:${userId}:${limit}`;
            const cached = await cacheService.get<any>(cacheKey);
            if (cached) {
                return res.json({ success: true, data: cached, cached: true });
            }

            // Get recommendations from Gorse
            const noteIds = await gorseService.getRecommendationsForUser(userId, limit);

            if (noteIds.length === 0) {
                // Fallback: Popular notes
                const fallbackIds = await gorseService.getPopularNotes(undefined, limit);
                const fallbackNotes = await fetchNoteDetails(fallbackIds);

                return res.json({
                    success: true,
                    data: fallbackNotes,
                    message: 'Showing popular notes (personalized recommendations building...)',
                    fallback: true
                });
            }

            // Fetch note details from database
            const notes = await fetchNoteDetails(noteIds);

            // Cache results
            await cacheService.set(cacheKey, notes, CACHE_TTL.personalized);

            return res.json({
                success: true,
                data: notes,
                count: notes.length
            });

        } catch (error: any) {
            console.error('❌ Personalized recommendations error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch recommendations',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    /**
     * GET /api/recommendations/similar/:noteId
     * Get similar notes (item-to-item recommendations)
     */
    getSimilar: async (req: AuthRequest, res: Response) => {
        try {
            const { noteId } = req.params;
            const limit = parseInt(req.query.limit as string) || 10;

            // Check cache
            const cacheKey = `recommendations:similar:${noteId}:${limit}`;
            const cached = await cacheService.get<any>(cacheKey);
            if (cached) {
                return res.json({ success: true, data: cached, cached: true });
            }

            // Get similar notes from Gorse
            const similarNoteIds = await gorseService.getSimilarNotes(noteId, limit);

            if (similarNoteIds.length === 0) {
                // Fallback: Same subject notes
                const sourceNote = await prismaAny.notes.findUnique({
                    where: { id: noteId },
                    select: { subject: true, degree: true }
                });

                if (sourceNote) {
                    const fallbackNotes = await prismaAny.notes.findMany({
                        where: {
                            subject: sourceNote.subject,
                            degree: sourceNote.degree,
                            id: { not: noteId },
                            is_active: true,
                            is_approved: true,
                            is_deleted: false
                        },
                        take: limit,
                        orderBy: { purchase_count: 'desc' }
                    });

                    const formatted = fallbackNotes.map(formatNoteBasic);
                    return res.json({
                        success: true,
                        data: formatted,
                        fallback: true,
                        message: 'Showing notes from same subject'
                    });
                }

                return res.json({ success: true, data: [], message: 'No similar notes found' });
            }

            // Fetch note details
            const notes = await fetchNoteDetails(similarNoteIds);

            // Cache results (longer TTL - similarity is stable)
            await cacheService.set(cacheKey, notes, CACHE_TTL.similar);

            return res.json({
                success: true,
                data: notes,
                count: notes.length
            });

        } catch (error: any) {
            console.error('❌ Similar notes error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch similar notes',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    /**
     * GET /api/recommendations/popular
     * Get trending/popular notes
     */
    getPopular: async (req: AuthRequest, res: Response) => {
        try {
            const category = req.query.category as string | undefined;
            const limit = parseInt(req.query.limit as string) || 20;

            // Check cache
            const cacheKey = `recommendations:popular:${category || 'all'}:${limit}`;
            const cached = await cacheService.get<any>(cacheKey);
            if (cached) {
                return res.json({ success: true, data: cached, cached: true });
            }

            // Get popular notes from Gorse
            const noteIds = await gorseService.getPopularNotes(category, limit);

            if (noteIds.length === 0) {
                // Fallback: Database popular query
                const fallbackNotes = await prismaAny.notes.findMany({
                    where: {
                        is_active: true,
                        is_approved: true,
                        is_deleted: false,
                        ...(category && { degree: category })
                    },
                    take: limit,
                    orderBy: [
                        { purchase_count: 'desc' },
                        { view_count: 'desc' }
                    ]
                });

                const formatted = fallbackNotes.map(formatNoteBasic);

                return res.json({
                    success: true,
                    data: formatted,
                    fallback: true
                });
            }

            // Fetch note details
            const notes = await fetchNoteDetails(noteIds);

            // Cache results
            await cacheService.set(cacheKey, notes, CACHE_TTL.popular);

            return res.json({
                success: true,
                data: notes,
                count: notes.length
            });

        } catch (error: any) {
            console.error('❌ Popular notes error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch popular notes',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    /**
     * GET /api/recommendations/latest
     * Get recently added notes
     */
    getLatest: async (req: AuthRequest, res: Response) => {
        try {
            const category = req.query.category as string | undefined;
            const limit = parseInt(req.query.limit as string) || 20;

            // Check cache
            const cacheKey = `recommendations:latest:${category || 'all'}:${limit}`;
            const cached = await cacheService.get<any>(cacheKey);
            if (cached) {
                return res.json({ success: true, data: cached, cached: true });
            }

            // Get latest notes from Gorse
            const noteIds = await gorseService.getLatestNotes(category, limit);

            if (noteIds.length === 0) {
                // Fallback: Database query
                const fallbackNotes = await prismaAny.notes.findMany({
                    where: {
                        is_active: true,
                        is_approved: true,
                        is_deleted: false,
                        ...(category && { degree: category })
                    },
                    take: limit,
                    orderBy: { created_at: 'desc' }
                });

                const formatted = fallbackNotes.map(formatNoteBasic);

                return res.json({
                    success: true,
                    data: formatted,
                    fallback: true
                });
            }

            // Fetch note details
            const notes = await fetchNoteDetails(noteIds);

            // Cache results (short TTL - changes frequently)
            await cacheService.set(cacheKey, notes, CACHE_TTL.latest);

            return res.json({
                success: true,
                data: notes,
                count: notes.length
            });

        } catch (error: any) {
            console.error('❌ Latest notes error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch latest notes',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

/**
 * Helper: Fetch note details from database
 */
async function fetchNoteDetails(noteIds: string[]) {
    if (noteIds.length === 0) return [];

    const notes = await prismaAny.notes.findMany({
        where: {
            id: { in: noteIds },
            is_active: true,
            is_approved: true,
            is_deleted: false
        },
        include: {
            users: {
                select: {
                    id: true,
                    full_name: true,
                    profile_picture_url: true
                }
            },
            universities: {
                select: {
                    name: true,
                    short_name: true
                }
            }
        }
    });

    // Preserve Gorse's ranking order
    const noteMap = new Map(notes.map((n: any) => [n.id, n]));
    const orderedNotes = noteIds
        .map(id => noteMap.get(id))
        .filter(Boolean);

    return orderedNotes.map(formatNoteBasic);
}

/**
 * Helper: Format note for API response
 */
function formatNoteBasic(note: any) {
    return {
        id: note.id,
        title: note.title,
        description: note.description,
        subject: note.subject,
        degree: note.degree,
        semester: note.semester,
        price: parseFloat(note.price_inr.toString()),
        pages: note.total_pages,
        rating: note.average_rating,
        reviewCount: note.total_reviews,
        coverImage: note.cover_image || (note.preview_pages?.[0]),
        sellerId: note.seller_id,
        sellerName: note.users?.full_name,
        sellerImage: note.users?.profile_picture_url,
        university: note.universities?.short_name || note.universities?.name,
        createdAt: note.created_at
    };
}
