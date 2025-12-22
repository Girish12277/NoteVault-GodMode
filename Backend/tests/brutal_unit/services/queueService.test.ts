// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    close: jest.fn(),
    getWaitingCount: jest.fn().mockResolvedValue(0),
    getActiveCount: jest.fn().mockResolvedValue(0),
    getCompletedCount: jest.fn().mockResolvedValue(0),
    getFailedCount: jest.fn().mockResolvedValue(0)
};

jest.mock('bullmq', () => ({
    Queue: jest.fn(() => mockQueue),
    QueueEvents: jest.fn(() => ({ on: jest.fn() })),
    Worker: jest.fn(() => ({ on: jest.fn(), close: jest.fn() }))
}));

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};
jest.mock('../../../src/services/logger', () => ({
    logger: mockLogger
}));

import { queueService, addBroadcastJob } from '../../../src/services/queueService';
// Import methods
// Note: queueService.ts exports functions like addEmailJob, etc.

describe('QueueService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('addEmailJob', () => {
        it('should add job to queue', async () => {
            const jobData = { to: 'a@b.com', subject: 'S', html: 'H' };
            await queueService.addEmailJob(jobData.to, jobData.subject, jobData.html);
            expect(mockQueue.add).toHaveBeenCalledWith('send-email', expect.objectContaining({
                to: jobData.to,
                subject: jobData.subject,
                html: jobData.html
            }), expect.anything());
        });
    });

    describe('addBroadcastJob', () => {
        it('should add broadcast job', async () => {
            await addBroadcastJob({ campaignId: 'c1' } as any);
            expect(mockQueue.add).toHaveBeenCalledWith('send-broadcast', expect.anything(), expect.anything());
        });
    });

    describe('addCloudinaryRetryJob', () => {
        it('should add retry job', async () => {
            await queueService.addCloudinaryRetry('p', 'id', 'auto');
            expect(mockQueue.add).toHaveBeenCalledWith('retry-upload', expect.anything(), expect.anything());
        });
    });
});
