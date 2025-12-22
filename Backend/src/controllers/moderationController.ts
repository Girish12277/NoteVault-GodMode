import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { contentModerationService } from '../services/contentModerationService';
import { z } from 'zod';

/**
 * GOD-LEVEL MODERATION ADMIN CONTROLLER
 * Ultra-safe content deletion with automatic refunds
 * 
 * Admin-only endpoints for content moderation
 */

// Validation schemas
const safeDeleteNoteSchema = z.object({
    noteId: z.string().min(1),
    reason: z.string().min(10).max(1000),
    reasonCategory: z.enum(['COPYRIGHT', 'SPAM', 'FAKE', 'QUALITY', 'OTHER']).optional(),
});

const copyrightClaimSchema = z.object({
    noteId: z.string().min(1),
    claimantEmail: z.string().email(),
    claimantName: z.string().optional(),
    claimantOrganization: z.string().optional(),
    description: z.string().min(50).max(2000),
    proofUrl: z.string().url().optional(),
    originalWorkUrl: z.string().url().optional(),
});

const appealSchema = z.object({
    moderationActionId: z.string().min(1),
    appealReason: z.string().min(50).max(2000),
    evidenceUrl: z.string().url().optional(),
    additionalNotes: z.string().max(1000).optional(),
});

export const moderationController = {
    /**
     * POST /api/admin/moderation/delete-note
     * Safely delete note with automatic refunds
     */
    async safeDeleteNote(req: AuthRequest, res: Response) {
        try {
            const validation = safeDeleteNoteSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: validation.error.issues,
                });
            }

            const { noteId, reason, reasonCategory } = validation.data;
            const adminId = req.user!.id;

            console.log(`🔒 Admin ${adminId} initiating safe delete for note ${noteId}`);

            const result = await contentModerationService.safeDeleteNote({
                noteId,
                adminId,
                reason,
                reasonCategory,
            });

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error || 'Failed to delete note safely',
                });
            }

            return res.json({
                success: true,
                data: {
                    purchasesRefunded: result.purchasesRefunded,
                    totalRefunded: result.totalRefunded,
                },
                message: 'Note deleted safely with automatic refunds',
            });
        } catch (error: any) {
            console.error('Safe delete error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to delete note',
            });
        }
    },

    /**
     * POST /api/admin/moderation/copyright-claim
     * File copyright/DMCA claim
     */
    async fileCopyrightClaim(req: AuthRequest, res: Response) {
        try {
            const validation = copyrightClaimSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: validation.error.issues,
                });
            }

            const result = await contentModerationService.handleCopyrightClaim(validation.data);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error || 'Failed to file copyright claim',
                });
            }

            return res.json({
                success: true,
                data: { claimId: result.claimId },
                message: 'Copyright claim filed successfully',
            });
        } catch (error: any) {
            console.error('Copyright claim error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to file copyright claim',
            });
        }
    },

    /**
     * GET /api/admin/moderation/stats
     * Get moderation statistics
     */
    async getStats(req: AuthRequest, res: Response) {
        try {
            const stats = await contentModerationService.getModerationStats();

            if (!stats) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch moderation statistics',
                });
            }

            return res.json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            console.error('Get moderation stats error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch statistics',
            });
        }
    },

    /**
     * POST /api/seller/moderation/appeal
     * Submit appeal (seller endpoint)
     */
    async submitAppeal(req: AuthRequest, res: Response) {
        try {
            const validation = appealSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: validation.error.issues,
                });
            }

            const sellerId = req.user!.id;

            const result = await contentModerationService.submitAppeal({
                ...validation.data,
                sellerId,
            });

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error || 'Failed to submit appeal',
                });
            }

            return res.json({
                success: true,
                data: { appealId: result.appealId },
                message: 'Appeal submitted successfully',
            });
        } catch (error: any) {
            console.error('Submit appeal error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to submit appeal',
            });
        }
    },

    /**
     * GET /api/admin/moderation/pending-reports
     * Get pending content reports
     */
    async getPendingReports(req: AuthRequest, res: Response) {
        try {
            const { prisma } = await import('../config/database');

            const reports = await (prisma as any).Report.findMany({
                where: { status: 'PENDING' },
                include: {
                    notes: { select: { id: true, title: true, seller_id: true } },
                    users: { select: { id: true, full_name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });

            return res.json({
                success: true,
                data: reports,
            });
        } catch (error: any) {
            console.error('Get pending reports error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch pending reports',
            });
        }
    },
};
