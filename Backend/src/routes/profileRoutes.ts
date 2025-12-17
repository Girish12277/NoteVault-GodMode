import { Router } from 'express';
import { prisma } from '../config/database';

const profileRouter = Router();
const prismaAny = prisma as any;

/**
 * GET /api/profile/:userId
 * Public endpoint to fetch seller profile, stats, notes, and reviews.
 */
profileRouter.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // 1. Fetch Basic User Info
        const user = await prismaAny.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                full_name: true,
                profile_picture_url: true,
                bio: true,
                created_at: true,
                university_id: true,
                college_name: true,
                is_seller: true,
                universities: {
                    select: { name: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 2. Fetch Aggregated Stats
        const [notesCount, reviewsStats] = await Promise.all([
            prismaAny.notes.count({
                where: { seller_id: userId, is_active: true, is_approved: true }
            }),
            prismaAny.reviews.aggregate({
                where: { notes: { seller_id: userId } },
                _count: true,
                _avg: { rating: true }
            })
        ]);

        const reviewCount = reviewsStats._count || 0;
        const avgRating = reviewsStats._avg.rating || 0;

        // Fetch Recent Notes
        const notes = await prismaAny.notes.findMany({
            where: { seller_id: userId, is_active: true, is_approved: true },
            orderBy: { created_at: 'desc' },
            take: 12,
            select: {
                id: true,
                title: true,
                cover_image: true, // Key for the "Instagram" look
                price_inr: true,
                average_rating: true
            }
        });

        // Fetch Posts
        const posts = await prismaAny.posts.findMany({
            where: { seller_id: userId },
            orderBy: { created_at: 'desc' },
            take: 20,
            include: {
                seller: { select: { full_name: true, profile_picture_url: true } }
            }
        });

        // 4. Fetch Recent Reviews
        const reviews = await prismaAny.reviews.findMany({
            where: { notes: { seller_id: userId } },
            orderBy: { created_at: 'desc' },
            take: 10,
            include: {
                users: {
                    select: {
                        full_name: true,
                        profile_picture_url: true
                    }
                },
                notes: {
                    select: {
                        title: true
                    }
                }
            }
        });

        return res.json({
            success: true,
            data: {
                user: {
                    ...user,
                    universityName: user.universities?.name
                },
                stats: {
                    notesCount,
                    reviewCount,
                    avgRating: Number(avgRating.toFixed(1))
                },
                notes,
                reviews,
                posts
            }
        });

    } catch (error) {
        console.error('Profile Fetch Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load profile' });
    }
});

export default profileRouter;
