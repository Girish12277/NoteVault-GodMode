import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import crypto from 'crypto';

// 1. Mock dependencies BEFORE importing the service
const mockPrisma = {
    notifications: {
        findMany: jest.fn(),
        createMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(), // Added update
    },
    notification_broadcasts: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(), // Added findMany
    },
    users: {
        findMany: jest.fn(),
        count: jest.fn(),
    },
    audit: {
        create: jest.fn(),
    },
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
};

// Mock config/database to return our mockPrisma
jest.mock('../../../src/config/database', () => ({
    prisma: mockPrisma,
}));

// Mock dynamic imports for sanitization
jest.mock('jsdom', () => ({
    JSDOM: class {
        window = {};
    }
}));

jest.mock('dompurify', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        sanitize: (str: string) => str.replace(/<[^>]*>?/gm, '') // Simple strip tags mock
    }))
}));

// Mock crypto if needed (though authentic crypto is usually fine, we might want deterministic UUIDs)
// For now, let's keep real crypto but mock randomUUID if we need to assert specific IDs.

import { notificationService } from '../../../src/services/notificationService';

describe('Notification Service Brutal Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default transaction mock: execute callback with mockPrisma
        (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
            return callback(mockPrisma);
        });
    });

    describe('sendToUsers (Direct Notifications)', () => {
        const validPayload = {
            userIds: ['user_1', 'user_2'],
            type: 'SYSTEM_ALERT',
            title: 'Test Notification',
            message: 'This is a test',
            adminId: 'admin_1',
            requestMeta: { ip: '127.0.0.1' }
        };

        it('should send notifications successfully to valid users', async () => {
            // Mock Idempotency check (none found)
            (mockPrisma.notifications.findMany as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue([]);

            // Mock User existence check
            (mockPrisma.users.findMany as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue([
                { id: 'user_1' }, { id: 'user_2' }
            ]);

            // Mock createMany and audit
            (mockPrisma.notifications.createMany as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ count: 2 });
            (mockPrisma.audit.create as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ id: 'audit_1' });

            const result = await notificationService.sendToUsers(validPayload);

            expect(result.success).toBe(true);
            expect(result.sent).toBe(2);
            expect(result.failed).toBe(0);

            // Verify transaction flow
            expect(mockPrisma.$transaction).toHaveBeenCalled();
            expect(mockPrisma.notifications.createMany).toHaveBeenCalledTimes(1);
            expect(mockPrisma.audit.create).toHaveBeenCalledTimes(1);
        });

        it('should detect and skip duplicate requests (Idempotency)', async () => {
            (mockPrisma.notifications.findMany as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue([{ id: 'existing_1' }]);

            const result = await notificationService.sendToUsers(validPayload);

            expect(result.success).toBe(true);
            expect(result.skipped).toBe(true);
            // Should NOT proceed to user check or transaction
            expect(mockPrisma.users.findMany).not.toHaveBeenCalled();
            expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        });

        it('should handle partial failures (some users invalid)', async () => {
            (mockPrisma.notifications.findMany as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue([]);
            // Only user_1 exists
            (mockPrisma.users.findMany as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue([{ id: 'user_1' }]);

            const result = await notificationService.sendToUsers(validPayload);

            expect(result.success).toBe(true);
            expect(result.sent).toBe(1);
            expect(result.failed).toBe(1); // user_2 missing
        });

        it('should fail if NO valid users found', async () => {
            (mockPrisma.notifications.findMany as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue([]);
            (mockPrisma.users.findMany as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue([]);

            const result = await notificationService.sendToUsers(validPayload);

            expect(result.success).toBe(false);
            expect(result.message).toContain('No valid active users');
        });

        it('should throw error for invalid content (Control Characters)', async () => {
            const badPayload = { ...validPayload, title: 'Bad \x00 Title' };
            await expect(notificationService.sendToUsers(badPayload))
                .rejects.toThrow('Invalid characters');
        });

        it('should throw error for oversized content', async () => {
            const hugeTitle = 'a'.repeat(500); // Limit is 400 bytes
            const badPayload = { ...validPayload, title: hugeTitle };
            await expect(notificationService.sendToUsers(badPayload))
                .rejects.toThrow('exceeds maximum byte size');
        });
    });

    describe('queueBroadcast', () => {
        const broadcastPayload = {
            type: 'ANNOUNCEMENT',
            title: 'Global News',
            message: 'Hello World',
            adminId: 'admin_1',
            idempotencyKey: 'broadcast_key_1'
        };

        it('should successfully queue a broadcast', async () => {
            // No existing broadcast
            (mockPrisma.notification_broadcasts.findUnique as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(null);

            // Total users count
            (mockPrisma.users.count as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(100);

            // Mock creation
            (mockPrisma.notification_broadcasts.create as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
                id: 'broad_1',
                status: 'PENDING'
            });

            const result = await notificationService.queueBroadcast(broadcastPayload);

            expect(result.success).toBe(true);
            expect(result.broadcastId).toBe('broad_1');
            expect(result.targetCount).toBe(100);
            expect(mockPrisma.notification_broadcasts.create).toHaveBeenCalled();
            expect(mockPrisma.audit.create).toHaveBeenCalled(); // Audit check
        });

        it('should return existing broadcast if idempotent', async () => {
            (mockPrisma.notification_broadcasts.findUnique as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
                id: 'broad_existing',
                status: 'PROCESSING'
            });

            const result = await notificationService.queueBroadcast(broadcastPayload);

            expect(result.skipped).toBe(true);
            expect(result.broadcastId).toBe('broad_existing');
            expect(mockPrisma.notification_broadcasts.create).not.toHaveBeenCalled();
        });
    });

    describe('processPendingBroadcasts (Complex)', () => {
        it('should do nothing if no broadcast claimed', async () => {
            (mockPrisma.$executeRaw as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(0); // 0 rows updated
            // Stub handleStuckBroadcasts to avoid complex interactions in this test
            // We can spy on it
            const handleStuckSpy = jest.spyOn(notificationService, 'handleStuckBroadcasts').mockResolvedValue(undefined);

            const result = await notificationService.processPendingBroadcasts();

            expect(result.processed).toBe(0);
            expect(handleStuckSpy).toHaveBeenCalled();
        });

        it('should process a claimed broadcast in batches', async () => {
            // 1. Claim success
            (mockPrisma.$executeRaw as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(1);

            // 2. Fetch broadcast
            (mockPrisma.notification_broadcasts.findFirst as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
                id: 'broad_1',
                status: 'PROCESSING',
                admin_id: 'admin_1',
                type: 'INFO',
                title: 'Info',
                message: 'Msg',
                last_cursor_id: null
            });

            // 3. Loop: Batch 1 (2 users)
            (mockPrisma.users.findMany as jest.Mock<(...args: any[]) => Promise<any>>)
                .mockResolvedValueOnce([{ id: 'u1' }, { id: 'u2' }]) // Batch 1
                .mockResolvedValueOnce([]); // Batch 2 (End)

            // 4. Batch Processing (createMany)
            (mockPrisma.notifications.createMany as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({ count: 2 });

            const result = await notificationService.processPendingBroadcasts();

            expect(result.processed).toBe(2);

            // Verify updates
            expect(mockPrisma.notification_broadcasts.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'broad_1' },
                data: expect.objectContaining({
                    status: 'COMPLETED'
                })
            }));
        });

        it('should handle batch errors gracefully and log valid errors', async () => {
            (mockPrisma.$executeRaw as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue(1);
            (mockPrisma.notification_broadcasts.findFirst as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
                id: 'broad_fail',
                status: 'PROCESSING'
            });

            // Mock Error during batch fetch
            (mockPrisma.users.findMany as jest.Mock<(...args: any[]) => Promise<any>>).mockRejectedValue(new Error('DB Connection Lost'));

            const result = await notificationService.processPendingBroadcasts();

            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('DB Connection Lost');

            // Should mark broadcast as FAILED
            expect(mockPrisma.notification_broadcasts.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ status: 'FAILED' })
            }));
        });
    });
});
