import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockPrisma = {
    notifications: {
        findMany: jest.fn() as any,
        findFirst: jest.fn() as any,
        count: jest.fn() as any,
        updateMany: jest.fn() as any,
        update: jest.fn() as any,
        deleteMany: jest.fn() as any,
    },
    users: {
        findMany: jest.fn() as any,
        count: jest.fn() as any,
    },
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

// Import Controller
import { notificationController } from '../../../src/controllers/notificationController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('NotificationController - Brutal Unit Tests', () => {
    let req: Partial<Request> & { user?: any, params?: any, query?: any, body?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = { user: { id: 'user_123' } as any, params: {}, query: {}, body: {} };
        res = { status: statusMock as any, json: jsonMock as any };
    });

    describe('list', () => {
        it('should return paginated notifications with unread count', async () => {
            req.query = { page: '2', limit: '10' };

            const mockNotifications = [
                { id: 'n1', user_id: 'user_123', type: 'PURCHASE', title: 'New Purchase', message: 'You bought a note', is_read: false, created_at: new Date() },
                { id: 'n2', user_id: 'user_123', type: 'SALE', title: 'Sale', message: 'Your note sold', is_read: true, created_at: new Date() }
            ];

            (mockPrisma.notifications.findMany as any).mockResolvedValue(mockNotifications);
            (mockPrisma.notifications.count as any)
                .mockResolvedValueOnce(25) // Total
                .mockResolvedValueOnce(5);  // Unread

            await notificationController.list(req as any, res as Response);

            expect(mockPrisma.notifications.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { user_id: 'user_123' },
                    skip: 10, // (page 2 - 1) * limit 10
                    take: 10
                })
            );

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    notifications: expect.arrayContaining([expect.any(Object)]),
                    pagination: expect.objectContaining({
                        total: 25,
                        page: 2,
                        limit: 10,
                        totalPages: 3
                    }),
                    unreadCount: 5
                })
            }));
        });

        it('should use default pagination if not provided', async () => {
            req.query = {};

            (mockPrisma.notifications.findMany as any).mockResolvedValue([]);
            (mockPrisma.notifications.count as any)
                .mockResolvedValueOnce(0)
                .mockResolvedValueOnce(0);

            await notificationController.list(req as any, res as Response);

            expect(mockPrisma.notifications.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 0, // Default page 1
                    take: 20 // Default limit
                })
            );
        });

        it('should order by created_at desc', async () => {
            req.query = {};

            (mockPrisma.notifications.findMany as any).mockResolvedValue([]);
            (mockPrisma.notifications.count as any).mockResolvedValue(0);

            await notificationController.list(req as any, res as Response);

            expect(mockPrisma.notifications.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { created_at: 'desc' }
                })
            );
        });

        it('should return 500 on database error', async () => {
            (mockPrisma.notifications.findMany as any).mockRejectedValue(new Error('DB Error'));

            await notificationController.list(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'FETCH_ERROR'
            }));
        });
    });

    describe('markAllRead', () => {
        it('should mark all unread notifications as read', async () => {
            (mockPrisma.notifications.updateMany as any).mockResolvedValue({ count: 5 });

            await notificationController.markAllRead(req as any, res as Response);

            expect(mockPrisma.notifications.updateMany).toHaveBeenCalledWith({
                where: { user_id: 'user_123', is_read: false },
                data: { is_read: true }
            });

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('marked as read')
            }));
        });

        it('should return 500 on error', async () => {
            (mockPrisma.notifications.updateMany as any).mockRejectedValue(new Error('Update failed'));

            await notificationController.markAllRead(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('markRead', () => {
        it('should mark single notification as read', async () => {
            req.params = { id: 'notif_1' };

            (mockPrisma.notifications.updateMany as any).mockResolvedValue({});

            await notificationController.markRead(req as any, res as Response);

            expect(mockPrisma.notifications.updateMany).toHaveBeenCalledWith({
                where: { id: 'notif_1', user_id: 'user_123' }, // Ownership check
                data: { is_read: true }
            });

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true
            }));
        });

        it('should enforce user ownership via where clause', async () => {
            req.params = { id: 'other_user_notif' };
            req.user!.id = 'user_456';

            (mockPrisma.notifications.updateMany as any).mockResolvedValue({});

            await notificationController.markRead(req as any, res as Response);

            expect(mockPrisma.notifications.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ user_id: 'user_456' })
                })
            );
        });
    });

    describe('getById', () => {
        it('should return notification and mark as read', async () => {
            req.params = { id: 'notif_1' };

            const mockNotification = {
                id: 'notif_1',
                user_id: 'user_123',
                type: 'PURCHASE',
                title: 'Test',
                message: 'Message',
                is_read: false,
                created_at: new Date(),
                status: 'SENT'
            };

            (mockPrisma.notifications.findFirst as any).mockResolvedValue(mockNotification);
            (mockPrisma.notifications.update as any).mockResolvedValue({});

            await notificationController.getById(req as any, res as Response);

            expect(mockPrisma.notifications.update).toHaveBeenCalledWith({
                where: { id: 'notif_1' },
                data: { is_read: true }
            });

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    isRead: true // Always true after viewing
                })
            }));
        });

        it('should not update if already read', async () => {
            req.params = { id: 'notif_1' };

            (mockPrisma.notifications.findFirst as any).mockResolvedValue({
                id: 'notif_1',
                is_read: true,
                created_at: new Date()
            });

            await notificationController.getById(req as any, res as Response);

            expect(mockPrisma.notifications.update).not.toHaveBeenCalled();
        });

        it('should return 404 if notification not found', async () => {
            req.params = { id: 'nonexistent' };

            (mockPrisma.notifications.findFirst as any).mockResolvedValue(null);

            await notificationController.getById(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'NOT_FOUND'
            }));
        });

        it('should enforce ownership with findFirst where clause', async () => {
            req.params = { id: 'notif_1' };

            (mockPrisma.notifications.findFirst as any).mockResolvedValue(null);

            await notificationController.getById(req as any, res as Response);

            expect(mockPrisma.notifications.findFirst).toHaveBeenCalledWith({
                where: { id: 'notif_1', user_id: 'user_123' }
            });
        });
    });

    describe('clearAll', () => {
        it('should delete all user notifications', async () => {
            (mockPrisma.notifications.deleteMany as any).mockResolvedValue({ count: 10 });

            await notificationController.clearAll(req as any, res as Response);

            expect(mockPrisma.notifications.deleteMany).toHaveBeenCalledWith({
                where: { user_id: 'user_123' }
            });

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('cleared')
            }));
        });

        it('should return 500 on error', async () => {
            (mockPrisma.notifications.deleteMany as any).mockRejectedValue(new Error('Delete error'));

            await notificationController.clearAll(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'DELETE_ERROR'
            }));
        });
    });

    describe('preview (Admin)', () => {
        it('should generate targeted notification preview', async () => {
            req.body = {
                type: 'PROMOTION',
                title: 'Test <script>alert(1)</script>',
                message: 'Test message',
                userIds: ['user_1', 'user_2', 'user_3']
            };

            (mockPrisma.users.findMany as any).mockResolvedValue([
                { full_name: 'John' },
                { full_name: 'Jane' }
            ]);

            await notificationController.preview(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    preview: expect.objectContaining({
                        type: 'PROMOTION',
                        title: 'Test alert(1)', // <script></script> tags removed
                        message: 'Test message'
                    }),
                    meta: expect.objectContaining({
                        targetCount: 3,
                        sampleUsers: expect.arrayContaining(['John', 'Jane']),
                        isBroadcast: false
                    })
                })
            }));
        });

        it('should sanitize HTML in title', async () => {
            req.body = {
                type: 'TEST',
                title: 'Test <b>bold</b> text',
                message: 'Message',
                userIds: []
            };

            (mockPrisma.users.count as any).mockResolvedValue(100);
            (mockPrisma.users.findMany as any).mockResolvedValue([]);

            await notificationController.preview(req as any, res as Response);

            const call = jsonMock.mock.calls[0][0] as any;
            expect(call.data.preview.title).not.toContain('<b>');
            expect(call.data.preview.title).toBe('Test bold text'); // Tags removed, text preserved
        });

        it('should generate broadcast preview if no userIds', async () => {
            req.body = {
                type: 'BROADCAST',
                title: 'Broadcast',
                message: 'To all'
            };

            (mockPrisma.users.count as any).mockResolvedValue(500);
            (mockPrisma.users.findMany as any).mockResolvedValue([
                { full_name: 'User 1' },
                { full_name: 'User 2' }
            ]);

            await notificationController.preview(req as any, res as Response);

            expect(mockPrisma.users.count).toHaveBeenCalledWith({ where: { is_active: true } });
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    meta: expect.objectContaining({
                        targetCount: 500,
                        isBroadcast: true
                    })
                })
            }));
        });

        it('should limit sample users to 5', async () => {
            req.body = { type: 'TEST', title: 'Test', message: 'Test', userIds: [] };

            (mockPrisma.users.count as any).mockResolvedValue(1000);
            (mockPrisma.users.findMany as any).mockResolvedValue([]);

            await notificationController.preview(req as any, res as Response);

            expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: 5 })
            );
        });
    });
});
