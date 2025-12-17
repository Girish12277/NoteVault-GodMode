import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prismaAny = prisma as any;

// GET /api/admin/analytics/sidebar-stats
router.get('/sidebar-stats', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const [
            usersCount,
            contentCount,
            disputesCount,
            unreadNotificationsCount,
            unreadMessagesCount
        ] = await Promise.all([
            prismaAny.users.count(),
            prismaAny.notes.count({ where: { is_active: true, is_deleted: false } }),
            prismaAny.Dispute.count({ where: { status: 'OPEN' } }),
            prismaAny.notifications.count({ where: { is_read: false, user_id: req.user?.id } }),
            prismaAny.ContactInquiry.count({ where: { status: 'NEW' } })
        ]);

        return res.json({
            success: true,
            data: {
                usersCount,
                contentCount,
                disputesCount,
                unreadNotificationsCount,
                unreadMessagesCount
            }
        });
    } catch (error: any) {
        console.error('Sidebar stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sidebar stats',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/admin/analytics/overview
router.get('/overview', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        // Calculate stats from existing data
        const [
            totalRevenue,
            totalUsers,
            totalNotes,
            totalPurchases,
            revenueData
        ] = await Promise.all([
            // Total revenue
            prismaAny.transactions.aggregate({
                where: { status: 'SUCCESS' },
                _sum: { final_amount_inr: true }
            }),
            // Total users
            prismaAny.users.count(),
            // Total notes
            prismaAny.notes.count({ where: { is_active: true, is_deleted: false } }),
            // Total purchases
            prismaAny.transactions.count({ where: { status: 'SUCCESS' } }),
            // Revenue by month (last 6 months)
            prismaAny.transactions.findMany({
                where: {
                    status: 'SUCCESS',
                    created_at: {
                        gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                    }
                },
                select: {
                    created_at: true,
                    final_amount_inr: true
                }
            })
        ]);

        // Group revenue by month
        const monthlyRevenue = revenueData.reduce((acc: any, transaction: any) => {
            const month = new Date(transaction.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month] += Number(transaction.final_amount_inr);
            return acc;
        }, {});

        const revenueChartData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
            month,
            revenue
        }));

        return res.json({
            success: true,
            data: {
                totalRevenue: Number(totalRevenue._sum.final_amount_inr || 0),
                totalUsers,
                totalNotes,
                totalPurchases,
                revenueChartData
            }
        });
    } catch (error: any) {
        console.error('Analytics overview error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/admin/analytics/top-subjects
router.get('/top-subjects', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        // Get top subjects by downloads/purchases
        const topSubjects = await prismaAny.notes.groupBy({
            by: ['subject'],
            where: {
                is_active: true,
                is_deleted: false
            },
            _count: {
                _all: true
            },
            _sum: {
                download_count: true,
                purchase_count: true
            },
            orderBy: {
                _sum: {
                    download_count: 'desc'
                }
            },
            take: 10
        });

        const formattedSubjects = topSubjects.map((subject: any) => ({
            name: subject.subject,
            noteCount: subject._count._all || 0,
            downloads: subject._sum?.download_count || 0,
            revenue: 0
        }));

        return res.json({
            success: true,
            data: formattedSubjects
        });
    } catch (error: any) {
        console.error('Top subjects error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch top subjects',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/admin/analytics/top-sellers
router.get('/top-sellers', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        // Get top sellers by calculating from transactions
        const sellerStats = await prismaAny.transactions.groupBy({
            by: ['seller_id'],
            where: {
                status: 'SUCCESS'
            },
            _count: {
                _all: true
            },
            _sum: {
                seller_earning_inr: true
            },
            orderBy: {
                _sum: {
                    seller_earning_inr: 'desc'
                }
            },
            take: 10
        });

        // Get seller details
        const sellerIds = sellerStats.map((s: any) => s.seller_id);
        const sellers = await prismaAny.users.findMany({
            where: {
                id: { in: sellerIds }
            },
            select: {
                id: true,
                full_name: true,
                email: true,
                _count: {
                    select: {
                        notes: true // Accessing relation count directly might vary in name
                    }
                }
            }
        });

        const sellersWithStats = sellerStats.map((stat: any) => {
            const seller = sellers.find((s: any) => s.id === stat.seller_id);
            if (!seller) return null;

            return {
                id: seller.id,
                name: seller.full_name,
                email: seller.email,
                notes: seller._count?.notes || 0, // Fallback
                downloads: stat._count._all || 0,
                earnings: Number(stat._sum.seller_earning_inr || 0),
                rating: 4.5
            };
        }).filter((s: any) => s !== null);

        return res.json({
            success: true,
            data: sellersWithStats
        });
    } catch (error: any) {
        console.error('Top sellers error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch top sellers',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/admin/analytics/universities
router.get('/universities', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        // Get university stats
        const universityStats = await prismaAny.universities.findMany({
            where: { is_active: true },
            include: {
                _count: {
                    select: {
                        users: true,
                        notes: true
                    }
                }
            },
            orderBy: {
                users: {
                    _count: 'desc'
                }
            },
            take: 10
        });

        const formattedStats = universityStats.map((uni: any) => ({
            name: uni.short_name || uni.name,
            students: uni._count?.users || 0,
            notes: uni._count?.notes || 0,
            city: uni.city,
            state: uni.state
        }));

        return res.json({
            success: true,
            data: formattedStats
        });
    } catch (error: any) {
        console.error('University stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch university stats',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
