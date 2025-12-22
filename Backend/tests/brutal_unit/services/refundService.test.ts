import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import crypto from 'crypto';

// 1. Mock dependencies
const mockExecuteRaw = jest.fn<(...args: any[]) => Promise<any>>();
const mockQueryRaw = jest.fn<(...args: any[]) => Promise<any>>();

const mockPrismaClient = {
    $executeRaw: mockExecuteRaw,
    $queryRaw: mockQueryRaw,
};

// Mock @prisma/client
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrismaClient),
    // We shouldn't export Enums from the mock if we want to use the real ones from the imported module
    // But direct import of Enums from source is better as they are just values/objects.
}));

// Mock Razorpay
const mockRazorpayInstance = {
    payments: {
        refund: jest.fn(),
    }
};
jest.mock('razorpay', () => {
    return jest.fn(() => mockRazorpayInstance);
});

// Mock environment variables
process.env.RAZORPAY_KEY_ID = 'test_key';
process.env.RAZORPAY_KEY_SECRET = 'test_secret';

import { RefundService, RefundReason, RefundStatus } from '../../../src/services/refundService';

describe('Refund Service Brutal Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('initiateRefund', () => {
        const validRequest = {
            userId: 'user_1',
            transactionId: 'txn_1',
            reason: RefundReason.QUALITY_ISSUES,
            reasonDetails: 'Blurry content'
        };

        it('should successfully initiate a refund for valid request', async () => {
            // 1. validateRefundEligibility -> Transaction found
            mockQueryRaw.mockResolvedValueOnce([{
                id: 'txn_1',
                amount_inr: '100.00',
                razorpay_payment_id: 'pay_1',
                buyer_id: 'user_1', // Matches
                seller_id: 'seller_1',
                note_id: 'note_1',
                created_at: new Date().toISOString(), // Recent
                status: 'completed',
                purchase_id: 'purch_1'
            }]);

            // 2. Existing refund check -> None
            mockQueryRaw.mockResolvedValueOnce([]);

            // 3. Abuse check -> Not blocked
            mockQueryRaw.mockResolvedValueOnce([]);

            // 4. Create refund (INSERT) -> Success
            mockExecuteRaw.mockResolvedValue(1);

            // 5. Fetch created refund
            mockQueryRaw.mockResolvedValueOnce([{
                id: 'REF_123',
                status: 'PENDING',
                is_auto_approved: false
            }]);

            const result = await RefundService.initiateRefund(validRequest);

            expect(result.success).toBe(true);
            expect(result.refundId).toBeDefined();
            expect(result.status).toBe('PENDING');

            // Verify raw queries
            expect(mockQueryRaw).toHaveBeenCalledTimes(4);
            expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
        });

        it('should fail if transaction belongs to another user', async () => {
            mockQueryRaw.mockResolvedValueOnce([{
                id: 'txn_1',
                buyer_id: 'user_OTHER', // Mismatch
                created_at: new Date().toISOString()
            }]);

            await expect(RefundService.initiateRefund(validRequest))
                .rejects.toThrow('Unauthorized');
        });

        it('should fail if transaction is too old (Window Expired)', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 31); // 31 days ago

            mockQueryRaw.mockResolvedValueOnce([{
                id: 'txn_1',
                buyer_id: 'user_1',
                created_at: oldDate.toISOString()
            }]);
            // Existing refund check -> None
            mockQueryRaw.mockResolvedValueOnce([]);

            await expect(RefundService.initiateRefund(validRequest))
                .rejects.toThrow('Refund window expired');
        });

        it('should fail if user is blocked from refunds (Abuse)', async () => {
            // Transaction OK
            mockQueryRaw.mockResolvedValueOnce([{
                id: 'txn_1',
                buyer_id: 'user_1',
                amount_inr: '100',
                created_at: new Date().toISOString()
            }]);
            // No existing refund
            mockQueryRaw.mockResolvedValueOnce([]);

            // Abuse check -> Blocked
            mockQueryRaw.mockResolvedValueOnce([{
                is_blocked_from_refunds: true
            }]);

            await expect(RefundService.initiateRefund(validRequest))
                .rejects.toThrow('Refund blocked');
        });
    });

    describe('processRefund', () => {
        it('should process approved refund via Razorpay and update DB', async () => {
            // 1. Get Refund
            mockQueryRaw.mockResolvedValueOnce([{
                id: 'REF_1',
                status: 'APPROVED',
                razorpay_payment_id: 'pay_1',
                net_refund_inr: '90.00',
                amount_inr: '100.00',
                transaction_id: 'txn_1',
                seller_id: 'seller_1'
            }]);

            // Razorpay success
            (mockRazorpayInstance.payments.refund as jest.Mock<(...args: any[]) => Promise<any>>).mockResolvedValue({
                id: 'rf_123',
                status: 'processed'
            });

            // Seller wallet check
            mockQueryRaw.mockResolvedValueOnce([{
                available_balance_inr: '200.00' // Enough balance
            }]);

            const result = await RefundService.processRefund('REF_1');

            expect(result.success).toBe(true);
            expect(result.razorpayRefundId).toBe('rf_123');

            // Verify updates sequence
            // 1. Status -> PROCESSING
            // 2. Status -> COMPLETED
            // 3. Transactions -> refunded
            // 4. Purchases -> inactive
            // 5. Seller Wallet -> deduct
            expect(mockExecuteRaw).toHaveBeenCalledTimes(5);
        });

        it('should handle Razorpay failures', async () => {
            // 1. Get Refund
            mockQueryRaw.mockResolvedValueOnce([{
                id: 'REF_1',
                status: 'APPROVED',
                razorpay_payment_id: 'pay_1',
                net_refund_inr: '90.00'
            }]);

            // Razorpay fail
            (mockRazorpayInstance.payments.refund as jest.Mock<(...args: any[]) => Promise<any>>).mockRejectedValue(new Error('Gateway Error'));

            await expect(RefundService.processRefund('REF_1'))
                .rejects.toThrow('Gateway Error');

            // Should verify status update to FAILED
            expect(mockExecuteRaw).toHaveBeenCalledTimes(2); // 1. Processing, 2. Failed
            const failureCall = (mockExecuteRaw.mock.calls as any)[1];
            // Check arguments: [strings, error.message, refundId]
            expect(failureCall[1]).toContain('Gateway Error');
            expect(failureCall[2]).toBe('REF_1');
        });
    });

    describe('approveRefund', () => {
        it('should approve and immediately process refund', async () => {
            // Spy on processRefund
            const procesSpy = jest.spyOn(RefundService, 'processRefund')
                .mockResolvedValue({ success: true, status: 'COMPLETED' } as any);

            mockExecuteRaw.mockResolvedValue(1); // Update status to APPROVED

            const approval = { refundId: 'REF_1', adminId: 'admin_1' };
            await RefundService.approveRefund(approval);

            expect(mockExecuteRaw).toHaveBeenCalled(); // Update to APPROVED
            expect(procesSpy).toHaveBeenCalledWith('REF_1');
        });
    });
});
