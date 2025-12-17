import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, requireSeller, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import emailService from '../services/emailService';

const sellerRouter = Router();
const adminRouter = Router();
const cartRouter = Router();
const orderRouter = Router();

const prismaAny = prisma as any;

// ========================================
// SELLER ROUTES
// ========================================

/**
 * GET /api/seller/dashboard
 * Get seller dashboard with real stats
 */
sellerRouter.get('/dashboard', authenticate, requireSeller, async (req: AuthRequest, res) => {
    try {
        const sellerId = req.user!.id;

        const wallet = await prismaAny.seller_wallets.findUnique({
            where: { seller_id: sellerId }
        });

        const notesStats = await prismaAny.notes.aggregate({
            where: { seller_id: sellerId, is_deleted: false },
            _count: true,
            _sum: { view_count: true, purchase_count: true }
        });

        const ratingStats = await prismaAny.reviews.aggregate({
            where: {
                notes: { seller_id: sellerId }, // Fixed relation name from 'note' to 'notes'
                is_approved: true
            },
            _avg: { rating: true },
            _count: true
        });

        const recentTransactions = await prismaAny.transactions.findMany({
            where: { seller_id: sellerId, status: 'SUCCESS' },
            orderBy: { created_at: 'desc' },
            take: 5,
            select: {
                id: true,
                amount_inr: true,
                seller_earning_inr: true,
                created_at: true,
                notes: { select: { title: true } } // Note relation is 'notes'
            }
        });

        return res.json({
            success: true,
            data: {
                earnings: {
                    totalEarned: Number(wallet?.total_earned_inr || 0),
                    availableBalance: Number(wallet?.available_balance_inr || 0),
                    pendingBalance: Number(wallet?.pending_balance_inr || 0),
                    totalWithdrawn: Number(wallet?.total_withdrawn_inr || 0)
                },
                notes: {
                    total: notesStats._count || 0,
                    totalViews: notesStats._sum?.view_count || 0,
                    totalSales: notesStats._sum?.purchase_count || 0
                },
                reviews: {
                    averageRating: Math.round((ratingStats._avg?.rating || 0) * 10) / 10,
                    totalReviews: ratingStats._count || 0
                },
                recentTransactions: recentTransactions.map((t: any) => ({
                    id: t.id,
                    amountInr: t.amount_inr,
                    sellerEarningInr: t.seller_earning_inr,
                    createdAt: t.created_at,
                    note: t.notes // Map back to frontend expected structure
                }))
            }
        });
    } catch (error: unknown) {
        console.error('Seller dashboard error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * GET /api/seller/notes
 * Get seller's uploaded notes
 */
sellerRouter.get('/notes', authenticate, requireSeller, async (req: AuthRequest, res) => {
    try {
        const sellerId = req.user!.id;
        const { page = '1', limit = '20', status = 'all' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: Record<string, unknown> = { seller_id: sellerId, is_deleted: false };
        if (status === 'approved') where.is_approved = true;
        if (status === 'pending') where.is_approved = false;
        if (status === 'active') { where.is_approved = true; where.is_active = true; }

        const [notes, total] = await Promise.all([
            prismaAny.notes.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip,
                take: Number(limit),
                include: {
                    categories: { select: { name: true } },
                    universities: { select: { id: true, name: true } }, // university name not directly available in some schemas, check relation
                    _count: { select: { reviews: true, purchases: true } }
                }
            }),
            prismaAny.notes.count({ where })
        ]);

        return res.json({
            success: true,
            data: {
                notes: notes.map((n: any) => ({
                    id: n.id,
                    title: n.title,
                    subject: n.subject,
                    semester: n.semester,
                    priceInr: n.price_inr,
                    coverImage: n.cover_image,
                    previewPages: n.preview_pages,
                    viewCount: n.view_count,
                    downloadCount: n.download_count,
                    rating: n.average_rating,
                    isApproved: n.is_approved,
                    isActive: n.is_active,
                    createdAt: n.created_at,
                    category: n.categories,
                    university: n.universities
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
        console.error('Seller notes error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch notes',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * GET /api/seller/wallet
 * Get seller wallet details
 */
sellerRouter.get('/wallet', authenticate, requireSeller, async (req: AuthRequest, res) => {
    try {
        const wallet = await prismaAny.seller_wallets.findUnique({
            where: { seller_id: req.user!.id }
        });

        if (!wallet) {
            return res.json({
                success: true,
                data: {
                    availableBalance: 0,
                    pendingBalance: 0,
                    totalEarned: 0,
                    totalWithdrawn: 0,
                    minimumWithdrawal: 100
                }
            });
        }

        return res.json({
            success: true,
            data: {
                availableBalance: Number(wallet.available_balance_inr),
                pendingBalance: Number(wallet.pending_balance_inr),
                totalEarned: Number(wallet.total_earned_inr),
                totalWithdrawn: Number(wallet.total_withdrawn_inr),
                minimumWithdrawal: Number(wallet.minimum_withdrawal_amount)
            }
        });
    } catch (error: unknown) {
        console.error('Seller wallet error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch wallet',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * GET /api/seller/payouts
 * Get payout history
 */
sellerRouter.get('/payouts', authenticate, requireSeller, async (req: AuthRequest, res) => {
    try {
        const payouts = await prismaAny.payout_requests.findMany({
            where: { seller_id: req.user!.id },
            orderBy: { created_at: 'desc' }
        });

        return res.json({
            success: true,
            data: payouts
        });
    } catch (error: unknown) {
        console.error('Seller payouts error:', error);
        // Fallback if payout_requests model name is different? usually snake_case
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch payouts',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * POST /api/seller/payouts/request
 * Request a payout
 */
sellerRouter.post('/payouts/request', authenticate, requireSeller, async (req: AuthRequest, res) => {
    try {
        const { amount, bankDetails } = req.body;
        const sellerId = req.user!.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount',
                code: 'INVALID_AMOUNT'
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            const txAny = tx as any;
            const wallet = await txAny.seller_wallets.findUnique({ where: { seller_id: sellerId } });

            if (!wallet) {
                throw new Error('Wallet not found');
            }
            if (Number(wallet.available_balance_inr) < amount) {
                throw new Error('Insufficient available balance');
            }
            if (amount < Number(wallet.minimum_withdrawal_amount)) {
                throw new Error(`Minimum withdrawal amount is ₹${wallet.minimum_withdrawal_amount}`);
            }

            await txAny.seller_wallets.update({
                where: { seller_id: sellerId },
                data: {
                    available_balance_inr: { decrement: amount },
                    updated_at: new Date()
                }
            });

            return await txAny.payout_requests.create({
                data: {
                    id: require('crypto').randomUUID(),
                    seller_id: sellerId,
                    amount_inr: amount,
                    bank_details: JSON.stringify(bankDetails),
                    status: 'PENDING',
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
        });

        return res.json({
            success: true,
            message: 'Payout requested successfully',
            data: result
        });
    } catch (error: any) {
        console.error('Payout request error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to request payout',
            code: 'PAYOUT_ERROR'
        });
    }
});

// ========================================
// ADMIN ROUTES
// ========================================

/**
 * GET /api/admin/dashboard
 * Get admin dashboard - FIXED to count ALL users
 */
adminRouter.get('/dashboard', authenticate, requireAdmin, async (_req, res) => {
    try {

        // Helper dates
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        // Parallel heavy fetching
        const [
            totalUsers,
            usersToday,
            usersYesterday,

            totalNotes,
            approvedNotes,
            notesToday,
            notesYesterday,

            totalDisputes,
            pendingDisputes,

            totalTransactions,
            totalRevenueAgg,
            revenueTodayAgg,
            revenueYesterdayAgg,

            recentOrders,
            topNotesRaw
        ] = await Promise.all([
            // Users
            prismaAny.users.count(),
            prismaAny.users.count({ where: { created_at: { gte: startOfToday } } }),
            prismaAny.users.count({ where: { created_at: { gte: startOfYesterday, lt: startOfToday } } }),

            // Notes
            prismaAny.notes.count(),
            prismaAny.notes.count({ where: { is_approved: true } }),
            prismaAny.notes.count({ where: { is_approved: true, created_at: { gte: startOfToday } } }),
            prismaAny.notes.count({ where: { is_approved: true, created_at: { gte: startOfYesterday, lt: startOfToday } } }),

            // Disputes
            prismaAny.dispute ? prismaAny.dispute.count() : 0,
            prismaAny.dispute ? prismaAny.dispute.count({ where: { status: 'OPEN' } }) : 0,

            // Transactions & Revenue
            prismaAny.transactions.count(),
            prismaAny.transactions.aggregate({ _sum: { amount_inr: true }, where: { status: 'SUCCESS' } }),
            prismaAny.transactions.aggregate({ _sum: { amount_inr: true }, where: { status: 'SUCCESS', created_at: { gte: startOfToday } } }),
            prismaAny.transactions.aggregate({ _sum: { amount_inr: true }, where: { status: 'SUCCESS', created_at: { gte: startOfYesterday, lt: startOfToday } } }),

            // Recent Orders (5)
            prismaAny.transactions.findMany({
                where: { status: 'SUCCESS' },
                take: 5,
                orderBy: { created_at: 'desc' },
                include: {
                    users_transactions_buyer_idTousers: { select: { full_name: true } },
                    notes: { select: { title: true } }
                }
            }),

            // Top Notes (by purchases) - approximation since we don't have purchase_count on notes in all schemas, checking aggregates
            prismaAny.notes.findMany({
                where: { is_approved: true },
                take: 5,
                orderBy: { purchases: { _count: 'desc' } }, // Assuming relation 'purchases'
                include: { _count: { select: { purchases: true } } }
            })
            // Fallback if relation sort fails: orderBy: { view_count: 'desc' }
        ]);

        const revenueTotal = Number(totalRevenueAgg._sum?.amount_inr || 0);
        const revenueToday = Number(revenueTodayAgg._sum?.amount_inr || 0);
        const revenueYesterday = Number(revenueYesterdayAgg._sum?.amount_inr || 0);

        // Helper for growth %
        const calcGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const topNotes = topNotesRaw.map((n: any) => ({
            title: n.title,
            downloads: n._count?.purchases || 0,
            revenue: (n._count?.purchases || 0) * Number(n.price_inr || 0)
        }));

        const formattedRecentOrders = recentOrders.map((o: any) => ({
            id: o.id,
            buyer: o.users_transactions_buyer_idTousers?.full_name || 'Unknown',
            note: o.notes?.title || 'Unknown Note',
            amount: Number(o.amount_inr),
            status: 'completed' // queries are filtered by SUCCESS
        }));

        return res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    newToday: usersToday
                },
                notes: {
                    total: totalNotes,
                    approved: approvedNotes
                },
                revenue: {
                    totalRevenue: revenueTotal,
                    today: revenueToday
                },
                growthStats: {
                    users: calcGrowth(usersToday, usersYesterday),
                    notes: calcGrowth(notesToday, notesYesterday),
                    revenue: calcGrowth(revenueToday, revenueYesterday)
                },
                recentOrders: formattedRecentOrders,
                topNotes: topNotes,

                // Extra metadata
                disputes: {
                    total: totalDisputes,
                    pending: pendingDisputes
                }
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
});

/**
 * GET /api/admin/users
 * List users with pagination and filtering
 */
adminRouter.get('/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const { page = '1', limit = '50', role = 'all', status = 'all', search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: Record<string, unknown> = {};
        if (role === 'seller') where.is_seller = true;
        if (role === 'admin') where.is_admin = true;
        if (status === 'active') where.is_active = true;
        if (status === 'suspended') where.is_active = false;

        if (search) {
            const searchStr = String(search).trim();
            where.OR = [
                { full_name: { contains: searchStr, mode: 'insensitive' } },
                { email: { contains: searchStr, mode: 'insensitive' } }
            ];
        }

        const [users, total] = await Promise.all([
            prismaAny.users.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip,
                take: Number(limit),
                select: {
                    id: true,
                    email: true,
                    full_name: true,
                    is_seller: true,
                    is_admin: true,
                    is_active: true,
                    is_verified: true,
                    created_at: true,
                    _count: { select: { notes: true, purchases: true } }
                }
            }),
            prismaAny.users.count({ where })
        ]);

        return res.json({
            success: true,
            data: {
                users: users.map((u: any) => ({
                    id: u.id,
                    email: u.email,
                    fullName: u.full_name,
                    isSeller: u.is_seller,
                    isAdmin: u.is_admin,
                    isActive: u.is_active,
                    isVerified: u.is_verified,
                    createdAt: u.created_at,
                    _count: u._count
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
        console.error('Admin users error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * GET /api/admin/notes/pending
 * Get pending notes for approval
 */
adminRouter.get('/notes/pending', authenticate, requireAdmin, async (req, res) => {
    try {
        const { page = '1', limit = '20' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [notes, total] = await Promise.all([
            prismaAny.notes.findMany({
                where: { is_approved: false, is_deleted: false },
                orderBy: { created_at: 'desc' },
                skip,
                take: Number(limit),
                include: {
                    users: { select: { full_name: true, email: true } },
                    categories: { select: { name: true } },
                    universities: { select: { name: true } }
                }
            }),
            prismaAny.notes.count({ where: { is_approved: false, is_deleted: false } })
        ]);

        return res.json({
            success: true,
            data: {
                notes: notes.map((n: any) => ({
                    ...n,
                    seller: n.users,
                    category: n.categories,
                    university: n.universities
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
        console.error('Admin pending notes error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pending notes',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * PUT /api/admin/notes/:id/approve
 * Approve a note
 */
adminRouter.put('/notes/:id/approve', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const note = await prismaAny.notes.update({
            where: { id },
            data: {
                is_approved: true,
                updated_at: new Date()
            },
            include: { users: { select: { email: true, full_name: true } } }
        });

        // Notifications & Email
        const sellerEmail = note.users?.email;
        const sellerName = note.users?.full_name || 'Partner';

        if (sellerEmail) {
            emailService.sendNoteApprovedEmail(sellerEmail, {
                sellerName,
                noteTitle: note.title,
                noteId: note.id
            }).catch(err => console.error('Failed to send note approved email:', err));
        }

        await prismaAny.notifications.create({
            data: {
                id: require('crypto').randomUUID(),
                user_id: note.seller_id,
                type: 'APPROVAL',
                title: 'Note Approved',
                message: `Your note "${note.title}" has been approved and is now live.`,
                created_at: new Date()
            }
        });

        return res.json({
            success: true,
            message: 'Note approved successfully',
            data: { noteId: note.id }
        });
    } catch (error: unknown) {
        console.error('Admin approve note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to approve note',
            code: 'APPROVE_ERROR'
        });
    }
});

/**
 * PUT /api/admin/notes/:id/reject
 * Reject a note
 */
adminRouter.put('/notes/:id/reject', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason: _reason } = req.body;

        const note = await prismaAny.notes.update({
            where: { id },
            data: {
                is_approved: false,
                updated_at: new Date()
            },
            include: { users: { select: { email: true, full_name: true } } }
        });

        const sellerEmail = note.users?.email;
        const sellerName = note.users?.full_name || 'Partner';

        if (sellerEmail) {
            emailService.sendNoteRejectedEmail(sellerEmail, {
                sellerName,
                noteTitle: note.title,
                reason: _reason || 'Content policy violation'
            }).catch(err => console.error('Failed to send note rejected email:', err));
        }

        await prismaAny.notifications.create({
            data: {
                id: require('crypto').randomUUID(),
                user_id: note.seller_id,
                type: 'ERROR',
                title: 'Note Rejected',
                message: `Your note "${note.title}" was rejected. Reason: ${_reason || 'Policy violation'}`,
                created_at: new Date()
            }
        });

        return res.json({
            success: true,
            message: 'Note rejected'
        });
    } catch (error: unknown) {
        console.error('Admin reject note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reject note',
            code: 'REJECT_ERROR'
        });
    }
});

/**
 * POST /api/admin/transactions/:id/refund
 * Process refund with audit log
 */
adminRouter.post('/transactions/:id/refund', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const adminId = req.user!.id;
    const { reason } = req.body;

    try {
        const { PaymentService } = require('../services/paymentService');

        const result = await prisma.$transaction(async (tx) => {
            const txAny = tx as any;

            // 1. Get Transaction
            const transaction = await txAny.transactions.findUnique({
                where: { id }
            });

            if (!transaction) throw new Error('Transaction not found');
            if (transaction.status === 'REFUNDED') throw new Error('Already refunded');

            // 2. Process Refund via Gateway
            const refundResult = await PaymentService.processRefund(
                transaction.transaction_id,
                Number(transaction.amount_inr),
                `ref_${id}`
            );

            if (!refundResult.success) {
                throw new Error(refundResult.error || 'Gateway refund failed');
            }

            // 3. Update Transaction Status
            const updatedTx = await txAny.transactions.update({
                where: { id },
                data: {
                    status: 'REFUNDED',
                    updated_at: new Date()
                }
            });

            // 4. Create Audit Log (CRITICAL)
            await txAny.auditLog.create({ // Assuming auditLog model exists, or audit_logs
                data: {
                    actorId: adminId,
                    action: 'REFUND',
                    targetType: 'TRANSACTION',
                    targetId: id,
                    payload: JSON.stringify({ reason, amount: transaction.amount_inr, gatewayRef: refundResult.gatewayRef }),
                    result: 'SUCCESS',
                    createdAt: new Date()
                }
            });

            return updatedTx;
        });

        return res.json({
            success: true,
            message: 'Refund processed successfully',
            data: result
        });

    } catch (error: any) {
        console.error('Refund error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Refund failed',
            code: 'REFUND_ERROR'
        });
    }
});

/**
 * DELETE /api/admin/notes/:id
 * Force delete a note
 */
adminRouter.delete('/notes/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await prismaAny.notes.update({
            where: { id },
            data: {
                is_deleted: true,
                updated_at: new Date()
            }
        });

        return res.json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error: unknown) {
        console.error('Admin delete note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete note',
            code: 'DELETE_ERROR'
        });
    }
});

// ========================================
// ADMIN NOTIFICATION ROUTES
// ========================================

import { notificationService } from '../services/notificationService';
import { notificationController } from '../controllers/notificationController';
import { adminNotificationLimiter, broadcastLimiter } from '../middleware/rateLimiter';
import { validate, validateQuery, schemas } from '../middleware/validation';

/**
 * POST /api/admin/notifications/send
 * Send notification to specific users (max 100)
 * 
 * Rate limit: 10 requests/minute per admin
 */
adminRouter.post(
    '/notifications/send',
    authenticate,
    requireAdmin,
    adminNotificationLimiter,
    validate(schemas.sendNotification),
    async (req: AuthRequest, res) => {
        try {
            const { userIds, type, title, message, idempotencyKey } = req.body;
            const adminId = req.user!.id;

            // Capture request metadata for audit
            const requestMeta = {
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('User-Agent'),
                jwtId: (req as any).jwtId  // If JWT has jti claim
            };

            const result = await notificationService.sendToUsers({
                userIds,
                type,
                title,
                message,
                adminId,
                idempotencyKey,
                requestMeta
            });

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message,
                    code: 'SEND_FAILED'
                });
            }

            return res.status(result.skipped ? 200 : 201).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            console.error('Send notification error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to send notifications',
                code: 'NOTIFICATION_SEND_ERROR'
            });
        }
    }
);

/**
 * POST /api/admin/notifications/broadcast
 * Queue broadcast to all users (async)
 * 
 * Rate limit: 1 request per 5 minutes per admin
 * Requires idempotency key
 */
adminRouter.post(
    '/notifications/broadcast',
    authenticate,
    requireAdmin,
    broadcastLimiter,
    validate(schemas.broadcastNotification),
    async (req: AuthRequest, res) => {
        try {
            const { type, title, message, idempotencyKey, confirmationToken } = req.body;
            const adminId = req.user!.id;

            // Capture request metadata for audit
            const requestMeta = {
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('User-Agent'),
                jwtId: (req as any).jwtId
            };

            const result = await notificationService.queueBroadcast({
                type,
                title,
                message,
                adminId,
                idempotencyKey,
                confirmationToken,
                requestMeta
            });

            // 202 Accepted for new broadcasts, 200 OK for idempotent hits
            return res.status(result.skipped ? 200 : 202).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            console.error('Broadcast error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to queue broadcast',
                code: 'BROADCAST_ERROR'
            });
        }
    }
);

/**
 * GET /api/admin/notifications
 * List admin notification history (broadcasts)
 */
adminRouter.get(
    '/notifications',
    authenticate,
    requireAdmin,
    validateQuery(schemas.notificationListQuery),
    async (req: AuthRequest, res) => {
        try {
            const { page, limit, type, status } = req.query as any;

            const result = await notificationService.listAdminNotifications({
                page: Number(page) || 1,
                limit: Number(limit) || 20,
                type,
                status
            });

            return res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            console.error('List notifications error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications',
                code: 'FETCH_ERROR'
            });
        }
    }
);

/**
 * GET /api/admin/notifications/broadcasts/:id
 * Get broadcast status with progress
 */
adminRouter.get(
    '/notifications/broadcasts/:id',
    authenticate,
    requireAdmin,
    async (req: AuthRequest, res) => {
        try {
            const { id } = req.params;

            const broadcast = await notificationService.getBroadcastStatus(id);

            if (!broadcast) {
                return res.status(404).json({
                    success: false,
                    message: 'Broadcast not found',
                    code: 'NOT_FOUND'
                });
            }

            return res.json({
                success: true,
                data: broadcast
            });
        } catch (error: any) {
            console.error('Get broadcast status error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch broadcast',
                code: 'FETCH_ERROR'
            });
        }
    }
);

// ========================================
// CART & ORDER ROUTES (Placeholder)
// ========================================

/**
 * GET /api/orders
 * Get user's purchases (orders)
 */
orderRouter.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const limit = parseInt((req.query.limit as string) || '100');

        const purchases = await prismaAny.purchases.findMany({
            where: {
                user_id: userId,
                is_active: true
            },
            include: {
                notes: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        subject: true,
                        file_url: true,
                        cover_image: true,
                        price_inr: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: limit
        });

        return res.json({
            success: true,
            data: purchases.map((p: any) => ({
                id: p.id,
                note: p.notes,
                watermarkedFileUrl: p.watermarked_file_url,
                downloadCount: p.download_count || 0,
                purchasedAt: p.created_at
            }))
        });

    } catch (error: any) {
        console.error('❌ GET /api/orders ERROR:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export { sellerRouter, adminRouter, cartRouter, orderRouter };
