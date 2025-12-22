import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import crypto from 'crypto';

const mockPrisma = {
    broadcast_campaigns: {
        create: jest.fn() as any,
        update: jest.fn() as any,
        findUnique: jest.fn() as any,
        findMany: jest.fn() as any
    },
    broadcast_batches: {
        create: jest.fn() as any
    },
    users: {
        findMany: jest.fn() as any
    }
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

const mockQueueService = {
    addBroadcastJob: jest.fn(),
    addBroadcastBatchJob: jest.fn()
};

jest.mock('../../../src/services/queueService', () => mockQueueService);

import { broadcastService } from '../../../src/services/broadcastService';

describe('BroadcastService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendCustomMessage', () => {
        it('should create campaign and queue job', async () => {
            mockPrisma.broadcast_campaigns.create.mockResolvedValue({ id: 'camp1' });

            const result = await broadcastService.sendCustomMessage({
                userIds: ['u1', 'u2'],
                channels: ['email'],
                message: 'Test',
                adminId: 'admin1'
            });

            expect(result.success).toBe(true);
            expect(result.campaignId).toBe('camp1');
            expect(mockPrisma.broadcast_campaigns.create).toHaveBeenCalled();
            expect(mockQueueService.addBroadcastJob).toHaveBeenCalled();
        });

        it('should return error on failure', async () => {
            mockPrisma.broadcast_campaigns.create.mockRejectedValue(new Error('Fail'));
            const result = await broadcastService.sendCustomMessage({} as any);
            expect(result.success).toBe(false);
        });
    });

    describe('createCampaign', () => {
        it('should create campaign and segments', async () => {
            mockPrisma.users.findMany.mockResolvedValue([{ id: 'u1' }]);
            mockPrisma.broadcast_campaigns.create.mockResolvedValue({ id: 'camp1' });
            mockPrisma.broadcast_batches.create.mockResolvedValue({ id: 'batch1' });
            mockPrisma.broadcast_campaigns.update.mockResolvedValue({});

            const result = await broadcastService.createCampaign({
                name: 'Test Camp',
                channels: ['email'],
                message: 'Msg',
                adminId: 'admin',
                segmentation: { type: 'all' }
            });

            expect(result.success).toBe(true);
            expect(mockPrisma.users.findMany).toHaveBeenCalled(); // Segmentation
            expect(mockPrisma.broadcast_campaigns.create).toHaveBeenCalled();
            expect(mockQueueService.addBroadcastBatchJob).toHaveBeenCalled();
        });

        it('should fail if no users found', async () => {
            mockPrisma.users.findMany.mockResolvedValue([]);
            const result = await broadcastService.createCampaign({
                name: 'Test',
                channels: ['email'],
                message: 'Msg',
                adminId: 'admin',
                segmentation: { type: 'all' }
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('No users found');
        });
    });

    describe('getCampaignStatus', () => {
        it('should return status', async () => {
            mockPrisma.broadcast_campaigns.findUnique.mockResolvedValue({ id: 'c1', name: 'N' });
            const status = await broadcastService.getCampaignStatus('c1');
            expect(status).toBeDefined();
            expect(status?.id).toBe('c1');
        });

        it('should return null if not found', async () => {
            mockPrisma.broadcast_campaigns.findUnique.mockResolvedValue(null);
            const status = await broadcastService.getCampaignStatus('c1');
            expect(status).toBeNull();
        });
    });

    describe('updateCampaignProgress', () => {
        it('should update progress', async () => {
            mockPrisma.broadcast_campaigns.findUnique.mockResolvedValue({
                id: 'c1', total_users: 100, processed_users: 0,
                succeeded_users: 0, failed_users: 0, status: 'queued'
            });

            await broadcastService.updateCampaignProgress('c1', 10, 10, 0);

            expect(mockPrisma.broadcast_campaigns.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'c1' },
                    data: expect.objectContaining({
                        processed_users: 10,
                        status: 'processing'
                    })
                })
            );
        });

        it('should mark completed', async () => {
            mockPrisma.broadcast_campaigns.findUnique.mockResolvedValue({
                id: 'c1', total_users: 10, processed_users: 0,
                succeeded_users: 0, failed_users: 0, status: 'processing'
            });

            await broadcastService.updateCampaignProgress('c1', 10, 10, 0);

            expect(mockPrisma.broadcast_campaigns.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'c1' },
                    data: expect.objectContaining({
                        status: 'completed',
                        progress_percent: '100.00'
                    })
                })
            );
        });
    });

    describe('cancelCampaign', () => {
        it('should cancel', async () => {
            mockPrisma.broadcast_campaigns.update.mockResolvedValue({});
            const result = await broadcastService.cancelCampaign('c1');
            expect(result).toBe(true);
        });
    });

    describe('getCampaigns', () => {
        it('should list campaigns', async () => {
            mockPrisma.broadcast_campaigns.findMany.mockResolvedValue([]);
            const list = await broadcastService.getCampaigns({ status: 'queued' });
            expect(list).toEqual([]);
            expect(mockPrisma.broadcast_campaigns.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { status: 'queued' } })
            );
        });
    });
});
