import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const prismaAny = prisma as any;

export const notificationController = {
    /**
     * GET /api/notifications
     * List user notifications
     */
    list: async (req: AuthRequest, res: Response) => {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            const userId = req.user!.id;

            const [notifications, total, unreadCount] = await Promise.all([
                prismaAny.notifications.findMany({
                    where: { user_id: userId },
                    orderBy: { created_at: 'desc' },
                    skip,
                    take: limit
                }),
                prismaAny.notifications.count({ where: { user_id: userId } }),
                prismaAny.notifications.count({ where: { user_id: userId, is_read: false } })
            ]);

            return res.json({
                success: true,
                data: {
                    notifications: notifications.map((n: any) => ({
                        id: n.id,
                        userId: n.user_id,
                        type: n.type,
                        title: n.title,
                        message: n.message,
                        isRead: n.is_read,
                        createdAt: n.created_at
                    })),
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit)
                    },
                    unreadCount
                }
            });
        } catch (error: unknown) {
            console.error('List notifications error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications',
                code: 'FETCH_ERROR'
            });
        }
    },

    /**
     * PUT /api/notifications/read-all
     * Mark all notifications as read
     */
    markAllRead: async (req: AuthRequest, res: Response) => {
        try {
            await prismaAny.notifications.updateMany({
                where: { user_id: req.user!.id, is_read: false },
                data: { is_read: true }
            });

            return res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error: unknown) {
            console.error('Mark read error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update notifications',
                code: 'UPDATE_ERROR'
            });
        }
    },

    /**
     * PUT /api/notifications/:id/read
     * Mark single notification as read
     */
    markRead: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user!.id;

            await prismaAny.notifications.updateMany({
                where: { id, user_id: userId }, // Ensure ownership
                data: { is_read: true }
            });

            return res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error: unknown) {
            console.error('Mark read error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update notification',
                code: 'UPDATE_ERROR'
            });
        }
    },

    /**
     * GET /api/notifications/:id
     * Get single notification details (and mark read)
     */
    getById: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user!.id;

            const notification = await prismaAny.notifications.findFirst({
                where: { id, user_id: userId }
            });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found',
                    code: 'NOT_FOUND'
                });
            }

            // Mark as read if not already
            if (!notification.is_read) {
                await prismaAny.notifications.update({
                    where: { id },
                    data: { is_read: true }
                });
            }

            return res.json({
                success: true,
                data: {
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    isRead: true, // It's read now
                    createdAt: notification.created_at,
                    status: notification.status
                }
            });
        } catch (error: unknown) {
            console.error('Get notification error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch notification details',
                code: 'FETCH_ERROR'
            });
        }
    },

    /**
     * DELETE /api/notifications
     * Delete all notifications for the current user
     */
    clearAll: async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;

            await prismaAny.notifications.deleteMany({
                where: { user_id: userId }
            });

            return res.json({
                success: true,
                message: 'All notifications cleared'
            });
        } catch (error: unknown) {
            console.error('Clear all error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to clear notifications',
                code: 'DELETE_ERROR'
            });
        }
    },

    /**
     * POST /api/admin/notifications/preview
     * Dry-run for broadcasts/notifications
     */
    preview: async (req: AuthRequest, res: Response) => {
        try {
            const { type, title, message, userIds } = req.body;

            // security: sanitize input for preview
            // In a real implementation we would share the exact same sanitize function as the service
            const safeTitle = title.replace(/<[^>]*>/g, '');

            let targetCount = 0;
            let sampleUsers: string[] = [];

            if (userIds && userIds.length > 0) {
                // Targeted preview
                const users = await prismaAny.users.findMany({
                    where: { id: { in: userIds } },
                    select: { full_name: true },
                    take: 5
                });
                targetCount = userIds.length;
                sampleUsers = users.map((u: any) => u.full_name);
            } else {
                // Broadcast preview
                targetCount = await prismaAny.users.count({ where: { is_active: true } });
                const users = await prismaAny.users.findMany({
                    where: { is_active: true },
                    select: { full_name: true },
                    take: 5
                });
                sampleUsers = users.map((u: any) => u.full_name);
            }

            return res.json({
                success: true,
                data: {
                    preview: {
                        type,
                        title: safeTitle,
                        message: message, // Allow message formatting in preview usually, but sanitize locally
                    },
                    meta: {
                        targetCount,
                        sampleUsers,
                        isBroadcast: !userIds || userIds.length === 0
                    }
                }
            });
        } catch (error: unknown) {
            console.error('Preview error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate preview',
                code: 'PREVIEW_ERROR'
            });
        }
    }
};
