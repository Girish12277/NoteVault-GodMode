import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const prismaAny = prisma as any;

export const wishlistController = {
    /**
     * POST /api/wishlist/toggle/:noteId
     * Toggle wishlist status for a note
     */
    toggle: async (req: AuthRequest, res: Response) => {
        try {
            const { noteId } = req.params;
            const userId = req.user!.id;

            // Check if exists using camelCase fields as per schema Model 'Wishlist'
            const existing = await prismaAny.wishlist.findUnique({
                where: {
                    userId_noteId: { userId, noteId } // Compound unique match
                }
            });

            if (existing) {
                // Remove
                await prismaAny.wishlist.delete({
                    where: { id: existing.id }
                });
                return res.json({
                    success: true,
                    message: 'Removed from wishlist',
                    data: { isWishlisted: false }
                });
            } else {
                // Add
                await prismaAny.wishlist.create({
                    data: { userId, noteId }
                });
                return res.json({
                    success: true,
                    message: 'Added to wishlist',
                    data: { isWishlisted: true }
                });
            }
        } catch (error: unknown) {
            console.error('Wishlist toggle error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update wishlist',
                code: 'UPDATE_ERROR'
            });
        }
    },

    /**
     * GET /api/wishlist
     * Get user wishlist
     */
    list: async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const { page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const [items, total] = await Promise.all([
                prismaAny.wishlist.findMany({
                    where: { userId },
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: 'desc' },
                    include: {
                        notes: {
                            include: {
                                users: { select: { full_name: true } },
                                universities: { select: { name: true } }
                            }
                        }
                    }
                }),
                prismaAny.wishlist.count({ where: { userId } })
            ]);

            return res.json({
                success: true,
                data: {
                    items: items.map((item: any) => ({
                        ...item,
                        note: item.notes
                    })),
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error: unknown) {
            console.error('List wishlist error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch wishlist'
            });
        }
    }
};
