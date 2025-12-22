import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockQueueService = {
    addEmailJob: jest.fn() as any,
};

jest.mock('../../../src/services/queueService', () => ({
    __esModule: true,
    queueService: mockQueueService
}));

import { RefundEmailService } from '../../../src/services/refundEmailService';

describe('RefundEmailService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockData = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        refundId: 'REF123',
        transactionId: 'TXN123',
        noteTitle: 'Test Note',
        amount: '500',
        reason: 'duplicate_purchase'
    };

    it('should send refund initiated email', async () => {
        await RefundEmailService.sendRefundInitiatedEmail(mockData);
        expect(mockQueueService.addEmailJob).toHaveBeenCalledWith(
            mockData.userEmail,
            expect.stringContaining('Refund Requested'),
            expect.any(String),
            undefined,
            'refund_initiated'
        );
    });

    it('should send refund approved email', async () => {
        await RefundEmailService.sendRefundApprovedEmail(mockData);
        expect(mockQueueService.addEmailJob).toHaveBeenCalledWith(
            mockData.userEmail,
            expect.stringContaining('Refund Approved'),
            expect.any(String),
            undefined,
            'refund_approved'
        );
    });

    it('should send refund rejected email', async () => {
        await RefundEmailService.sendRefundRejectedEmail(mockData);
        expect(mockQueueService.addEmailJob).toHaveBeenCalledWith(
            mockData.userEmail,
            expect.stringContaining('Refund Request Update'),
            expect.any(String),
            undefined,
            'refund_rejected'
        );
    });

    it('should send refund completed email', async () => {
        await RefundEmailService.sendRefundCompletedEmail(mockData);
        expect(mockQueueService.addEmailJob).toHaveBeenCalledWith(
            mockData.userEmail,
            expect.stringContaining('Refund Completed'),
            expect.any(String),
            undefined,
            'refund_completed'
        );
    });
});
