import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Worker } from 'bullmq';

const mockWorker = jest.fn();

jest.mock('bullmq', () => ({
    Worker: jest.fn().mockImplementation((name, processor, opts) => {
        return {
            name,
            processor, // Store processor to test
            on: jest.fn(),
            close: jest.fn()
        };
    })
}));

const mockMultiEmailService = {
    send: jest.fn() as any
};
jest.mock('../../../src/services/multiProviderEmailService', () => ({
    multiEmailService: mockMultiEmailService
}));

const mockWhatsappService = {
    sendMessage: jest.fn() as any
};
jest.mock('../../../src/services/whatsappService', () => ({
    whatsappService: mockWhatsappService
}));

const mockPrisma = {
    broadcast_batches: {
        update: jest.fn() as any
    },
    users: {
        findMany: jest.fn() as any
    },
    broadcast_deliveries: {
        create: jest.fn() as any
    },
    $transaction: jest.fn((cb: any) => cb({}))
};
jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

const mockBroadcastService = {
    updateCampaignProgress: jest.fn()
};
jest.mock('../../../src/services/broadcastService', () => ({
    broadcastService: mockBroadcastService
}));

import { broadcastBatchWorker, broadcastWorker } from '../../../src/services/broadcastWorkers';

describe('BroadcastWorkers - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('broadcastBatchWorker', () => {
        it('should process email batch', async () => {
            // Access the processor function from the mocked Worker constructor call?
            // Actually, `broadcastBatchWorker` IS the mock instance returned.
            // But my mock returns an object.
            // I attached `processor` to it.
            const worker: any = broadcastBatchWorker;
            const processor = worker.processor;

            mockPrisma.users.findMany.mockResolvedValue([
                { id: 'u1', email: 'test@t.com' }
            ]);
            mockMultiEmailService.send.mockResolvedValue({ success: true, messageId: 'msg1' });
            mockPrisma.broadcast_batches.update.mockResolvedValue({});

            const job = {
                id: 'j1',
                data: {
                    campaignId: 'c1',
                    batchId: 'b1',
                    userIds: ['u1'],
                    channel: 'email',
                    subject: 'Subj',
                    message: 'Msg'
                }
            };

            const result = await processor(job);

            expect(result.succeeded).toBe(1);
            expect(mockMultiEmailService.send).toHaveBeenCalled();
            expect(mockPrisma.broadcast_deliveries.create).toHaveBeenCalled();
        });

        it('should process whatsapp batch', async () => {
            const worker: any = broadcastBatchWorker;
            const processor = worker.processor;

            mockPrisma.users.findMany.mockResolvedValue([
                { id: 'u1', phone: '123' }
            ]);
            mockWhatsappService.sendMessage.mockResolvedValue({ success: true, messageSid: 'sid' });

            const job = {
                id: 'j1',
                data: {
                    campaignId: 'c1',
                    batchId: 'b1',
                    userIds: ['u1'],
                    channel: 'whatsapp',
                    message: 'Msg'
                }
            };

            const result = await processor(job);

            expect(result.succeeded).toBe(1);
            expect(mockWhatsappService.sendMessage).toHaveBeenCalled();
        });
    });

    describe('broadcastWorker', () => {
        it('should process single broadcast', async () => {
            const worker: any = broadcastWorker;
            const processor = worker.processor;

            mockPrisma.users.findMany.mockResolvedValue([{ id: 'u1', email: 'a' }]);
            mockMultiEmailService.send.mockResolvedValue({ success: true });

            const job = {
                id: 'j2',
                data: {
                    campaignId: 'c2',
                    userIds: ['u1'],
                    channels: ['email'],
                    message: 'Hi'
                }
            };

            const result = await processor(job);

            expect(result.succeeded).toBe(1);
        });
    });
});
