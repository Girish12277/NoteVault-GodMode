import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockRefundService = {
    initiateRefund: jest.fn() as any,
    getUserRefunds: jest.fn() as any,
    getRefund: jest.fn() as any,
    getPendingRefunds: jest.fn() as any,
    approveRefund: jest.fn() as any,
    rejectRefund: jest.fn() as any,
};

jest.mock('../../../src/services/refundService', () => ({
    __esModule: true,
    RefundService: mockRefundService
}));

// Import Controller
import { RefundController } from '../../../src/controllers/refundController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Refund Controller - Brutal Unit Tests', () => {
    let req: Partial<Request> & { user?: any, params?: any, ip?: string };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = {
            method: 'POST',
            body: {},
            params: {},
            ip: '127.0.0.1',
            user: {
                id: 'user_1',
                email: 'user@test.com',
                fullName: 'Test User',
                phone: '9999999999',
                isSeller: false,
                isAdmin: false,
                is_admin: false,
                is_active: true
            } as any,
            get: jest.fn().mockReturnValue('Mozilla/5.0') as any
        };

        res = {
            status: statusMock as any,
            json: jsonMock as any,
        };
    });

    // ------------------------------------------------------------------
    // INITIATE REFUND
    // ------------------------------------------------------------------
    describe('initiateRefund', () => {
        it('should return 400 if validation fails (missing transactionId)', async () => {
            req.body = { reason: 'FILE_CORRUPTION' }; // Missing transactionId

            await RefundController.initiateRefund(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Invalid request data'
            }));
        });

        it('should return 400 if invalid reason provided', async () => {
            req.body = {
                transactionId: 'txn_1',
                reason: 'INVALID_REASON'
            };

            await RefundController.initiateRefund(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should initiate refund successfully for valid request', async () => {
            req.body = {
                transactionId: 'txn_valid',
                reason: 'FILE_CORRUPTION',
                reasonDetails: 'PDF is corrupted'
            };

            mockRefundService.initiateRefund.mockResolvedValue({
                id: 'refund_1',
                status: 'PENDING'
            });

            await RefundController.initiateRefund(req as Request, res as Response);

            expect(mockRefundService.initiateRefund).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user_1',
                    transactionId: 'txn_valid',
                    reason: 'FILE_CORRUPTION'
                })
            );
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should handle service error (e.g., transaction not found)', async () => {
            req.body = {
                transactionId: 'txn_invalid',
                reason: 'FILE_CORRUPTION'
            };

            mockRefundService.initiateRefund.mockRejectedValue(
                new Error('Transaction not found or already refunded')
            );

            await RefundController.initiateRefund(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Transaction not found or already refunded'
            }));
        });
    });

    // ------------------------------------------------------------------
    // AUTHORIZATION TESTS
    // ------------------------------------------------------------------
    describe('getRefund - Authorization', () => {
        it('should allow user to view their own refund', async () => {
            req.params = { refundId: 'ref_1' };
            req.user!.id = 'user_1';
            req.user!.is_admin = false;

            mockRefundService.getRefund.mockResolvedValue({
                id: 'ref_1',
                user_id: 'user_1',
                status: 'PENDING'
            });

            await RefundController.getRefund(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should return 403 if User A tries to view User B refund', async () => {
            req.params = { refundId: 'ref_2' };
            req.user!.id = 'user_1';
            req.user!.is_admin = false;

            mockRefundService.getRefund.mockResolvedValue({
                id: 'ref_2',
                user_id: 'user_2', // Different user
                status: 'PENDING'
            });

            await RefundController.getRefund(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Unauthorized access'
            }));
        });

        it('should allow admin to view any refund', async () => {
            req.params = { refundId: 'ref_2' };
            req.user!.id = 'admin_1';
            req.user!.is_admin = true;

            mockRefundService.getRefund.mockResolvedValue({
                id: 'ref_2',
                user_id: 'user_2',
                status: 'PENDING'
            });

            await RefundController.getRefund(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
        });
    });

    // ------------------------------------------------------------------
    // ADMIN PRIVILEGE ESCALATION TESTS
    // ------------------------------------------------------------------
    describe('approveRefund - Admin Only', () => {
        it('should return 403 if non-admin tries to approve', async () => {
            req.params = { refundId: 'ref_1' };
            req.user!.id = 'user_1';
            req.user!.is_admin = false;

            await RefundController.approveRefund(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Admin access required'
            }));
            expect(mockRefundService.approveRefund).not.toHaveBeenCalled();
        });

        it('should allow admin to approve refund', async () => {
            req.params = { refundId: 'ref_1' };
            req.user!.id = 'admin_1';
            req.user!.is_admin = true;
            req.body = { adminNotes: 'Approved due to valid reason' };

            mockRefundService.approveRefund.mockResolvedValue({
                id: 'ref_1',
                status: 'APPROVED'
            });

            await RefundController.approveRefund(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(mockRefundService.approveRefund).toHaveBeenCalledWith(
                expect.objectContaining({
                    refundId: 'ref_1',
                    adminId: 'admin_1',
                    adminNotes: 'Approved due to valid reason'
                })
            );
        });
    });

    describe('rejectRefund - Admin Only', () => {
        it('should return 403 if non-admin tries to reject', async () => {
            req.params = { refundId: 'ref_1' };
            req.user!.id = 'user_1';
            req.user!.is_admin = false;

            await RefundController.rejectRefund(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(mockRefundService.rejectRefund).not.toHaveBeenCalled();
        });

        it('should allow admin to reject refund', async () => {
            req.params = { refundId: 'ref_1' };
            req.user!.id = 'admin_1';
            req.user!.is_admin = true;
            req.body = { adminNotes: 'Rejected - insufficient evidence' };

            mockRefundService.rejectRefund.mockResolvedValue({
                id: 'ref_1',
                status: 'REJECTED'
            });

            await RefundController.rejectRefund(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(mockRefundService.rejectRefund).toHaveBeenCalledWith(
                'ref_1',
                'admin_1',
                'Rejected - insufficient evidence'
            );
        });
    });

    // ------------------------------------------------------------------
    // STATE TRANSITIONS
    // ------------------------------------------------------------------
    describe('State Transitions', () => {
        it('should handle Pending -> Approved transition', async () => {
            req.params = { refundId: 'ref_pending' };
            req.user!.id = 'admin_1';
            req.user!.is_admin = true;
            req.body = {};

            mockRefundService.approveRefund.mockResolvedValue({
                id: 'ref_pending',
                status: 'APPROVED',
                razorpay_refund_id: 'rfnd_123'
            });

            await RefundController.approveRefund(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('approved')
            }));
        });

        it('should handle Pending -> Rejected transition', async () => {
            req.params = { refundId: 'ref_pending' };
            req.user!.id = 'admin_1';
            req.user!.is_admin = true;
            req.body = {};

            mockRefundService.rejectRefund.mockResolvedValue({
                id: 'ref_pending',
                status: 'REJECTED'
            });

            await RefundController.rejectRefund(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Refund rejected'
            }));
        });
    });

    // ------------------------------------------------------------------
    // GET PENDING REFUNDS (Admin)
    // ------------------------------------------------------------------
    describe('getPendingRefunds', () => {
        it('should return 403 if non-admin tries to access', async () => {
            req.user!.id = 'user_1';
            req.user!.is_admin = false;

            await RefundController.getPendingRefunds(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
        });

        it('should return pending refunds for admin', async () => {
            req.user!.id = 'admin_1';
            req.user!.is_admin = true;

            mockRefundService.getPendingRefunds.mockResolvedValue([
                { id: 'ref_1', status: 'PENDING' },
                { id: 'ref_2', status: 'PENDING' }
            ]);

            await RefundController.getPendingRefunds(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ status: 'PENDING' })
                ])
            }));
        });
    });
});
