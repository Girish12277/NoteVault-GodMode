import { jest, describe, it, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { Request, Response } from 'express';
import crypto from 'crypto';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

// 1. Mock Alert Service
const mockAlertService = {
    critical: jest.fn(),
    high: jest.fn(),
    warning: jest.fn(),
};

// 2. Mock Prisma
const mockPrisma = {
    webhook_logs: {
        findFirst: jest.fn() as any,
        create: jest.fn() as any,
    },
    transactions: {
        findMany: jest.fn() as any,
        updateMany: jest.fn() as any,
    },
    purchases: {
        create: jest.fn() as any,
    },
    notes: {
        update: jest.fn() as any,
    },
    seller_wallets: {
        upsert: jest.fn() as any,
    },
    notifications: {
        create: jest.fn() as any,
    },
    $transaction: jest.fn((callback: any) => callback(mockPrisma)) as any,
};

// Hoist mocks
jest.mock('../../../src/services/alertService', () => ({
    __esModule: true,
    alertService: mockAlertService
}));

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

// Import Controller AFTER Mocks
import { webhookController } from '../../../src/controllers/webhookController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Webhook Controller - Brutal Unit Tests', () => {
    let req: Partial<Request> & { headers: Record<string, string> };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    const WEBHOOK_SECRET = 'test_secret_123';

    beforeAll(() => {
        process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
        process.env.NODE_ENV = 'test';
    });

    beforeEach(() => {
        jest.clearAllMocks();

        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = {
            method: 'POST',
            ip: '127.0.0.1',
            headers: {},
            body: {}
        };

        res = {
            status: statusMock as any,
            json: jsonMock as any,
        };
    });

    const generateSignature = (body: any, secret: string = WEBHOOK_SECRET) => {
        return crypto.createHmac('sha256', secret)
            .update(JSON.stringify(body))
            .digest('hex');
    };

    describe('Security: Signature Verification', () => {
        it('should return 500 if WEBHOOK_SECRET is not configured', async () => {
            const temp = process.env.RAZORPAY_WEBHOOK_SECRET;
            delete process.env.RAZORPAY_WEBHOOK_SECRET;

            try {
                await webhookController.handleRazorpay(req as Request, res as Response);
                expect(statusMock).toHaveBeenCalledWith(500);
            } finally {
                process.env.RAZORPAY_WEBHOOK_SECRET = temp;
            }
        });

        it('should return 400 if signature header is missing', async () => {
            await webhookController.handleRazorpay(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(mockAlertService.warning).toHaveBeenCalledWith(
                'WEBHOOK_MISSING_SIGNATURE',
                expect.any(String),
                expect.any(Object)
            );
        });

        it('should return 401 if signature is invalid', async () => {
            req.body = { foo: 'bar', event: 'test.event' };
            // SHA256 hex is 64 chars. We need 64 chars to avoid 500 in crypto.timingSafeEqual
            req.headers['x-razorpay-signature'] = 'a'.repeat(64);

            await webhookController.handleRazorpay(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(mockAlertService.critical).toHaveBeenCalled();
        });

        it('should accept valid signature', async () => {
            // NOTE: Logic will proceed to timestamp check, so signature passed if we get past 401
            req.body = {
                created_at: Math.floor(Date.now() / 1000),
                event: 'payment.authorized',
                payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } }
            };
            req.headers['x-razorpay-signature'] = generateSignature(req.body);

            // Mock dependencies to avoid crashes later in the flow
            mockPrisma.webhook_logs.findFirst.mockResolvedValue(null);
            mockPrisma.transactions.findMany.mockResolvedValue([]);

            await webhookController.handleRazorpay(req as Request, res as Response);

            // Expect NOT 401/400 (Signature passed)
            // It will fail at 'Order not found' likely (404), which is fine for this test scope
            expect(statusMock).not.toHaveBeenCalledWith(401);
            expect(statusMock).not.toHaveBeenCalledWith(400);
        });
    });

    describe('Security: Replay Attacks (Timestamp)', () => {
        it('should reject events older than 5 minutes', async () => {
            const oldTime = Math.floor(Date.now() / 1000) - (6 * 60); // 6 mins ago
            req.body = {
                created_at: oldTime,
                event: 'test',
                payload: { payment: { entity: { id: 'pay_old' } } }
            };
            req.headers['x-razorpay-signature'] = generateSignature(req.body);

            await webhookController.handleRazorpay(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: 'Event too old' }));
            expect(mockAlertService.warning).toHaveBeenCalledWith(
                'WEBHOOK_EVENT_EXPIRED',
                expect.any(String),
                expect.any(Object)
            );
        });
    });

    describe('Idempotency & Processing', () => {
        const payload = {
            created_at: Math.floor(Date.now() / 1000),
            event: 'payment.authorized',
            payload: { payment: { entity: { id: 'pay_123', order_id: 'order_123', amount: 1000 } } },
        };

        beforeEach(() => {
            req.body = payload;
            req.headers['x-razorpay-signature'] = generateSignature(payload);
        });

        it('should ignore non-payment.authorized events', async () => {
            req.body = { ...payload, event: 'payment.captured' };
            req.headers['x-razorpay-signature'] = generateSignature(req.body);

            await webhookController.handleRazorpay(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith({ received: true, processed: false });
        });

        it('should detect duplicate duplicate events via DB check', async () => {
            mockPrisma.webhook_logs.findFirst.mockResolvedValue({ id: 'log_1' }); // Found existing

            await webhookController.handleRazorpay(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith({ received: true, already_processed: true });
            expect(mockPrisma.transactions.findMany).not.toHaveBeenCalled();
        });

        it('should handle "Order Not Found" (404)', async () => {
            mockPrisma.webhook_logs.findFirst.mockResolvedValue(null);
            mockPrisma.transactions.findMany.mockResolvedValue([]); // Empty

            await webhookController.handleRazorpay(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(mockPrisma.webhook_logs.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ status: 'ORDER_NOT_FOUND' }) })
            );
        });

        it('should handle "Already Processed Transactions" (status != PENDING)', async () => {
            mockPrisma.webhook_logs.findFirst.mockResolvedValue(null);
            mockPrisma.transactions.findMany.mockResolvedValue([
                { id: 'txn_1', status: 'SUCCESS' }
            ]);

            await webhookController.handleRazorpay(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith({ received: true, already_processed: true });
        });

        it('should process valid transaction atomically', async () => {
            mockPrisma.webhook_logs.findFirst.mockResolvedValue(null);

            // Valid Pending transaction
            const mockTxn = {
                id: 'txn_1',
                status: 'PENDING',
                buyer_id: 'user_1',
                seller_id: 'seller_1',
                note_id: 'note_1',
                seller_earning_inr: 90,
                notes: {
                    id: 'note_1',
                    title: 'Test Note',
                    file_url: 'http://file.com'
                }
            };
            mockPrisma.transactions.findMany.mockResolvedValue([mockTxn]);

            // Mock Transaction Block
            mockPrisma.$transaction.mockImplementation(async (callback: any) => {
                await callback(mockPrisma);
            });

            await webhookController.handleRazorpay(req as Request, res as Response);

            // VERIFY ATOMIC OPERATIONS
            // 1. Update Transactions
            expect(mockPrisma.transactions.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { payment_gateway_order_id: 'order_123' },
                    data: expect.objectContaining({ status: 'SUCCESS' })
                })
            );

            // 2. Create Purchase
            expect(mockPrisma.purchases.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ user_id: 'user_1', note_id: 'note_1' })
                })
            );

            // 3. Update Seller Wallet
            expect(mockPrisma.seller_wallets.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { seller_id: 'seller_1' },
                    create: expect.objectContaining({ pending_balance_inr: 90 }),
                    update: expect.objectContaining({ pending_balance_inr: { increment: 90 } })
                })
            );

            // 4. Notifications (Seller & Buyer)
            expect(mockPrisma.notifications.create).toHaveBeenCalledTimes(2);

            // 5. Final Alert
            expect(mockAlertService.warning).toHaveBeenCalledWith(
                'WEBHOOK_PAYMENT_SUCCESS',
                expect.stringContaining('processed'),
                expect.any(Object)
            );

            // Response
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ received: true, processed: true });
        });

        it('should rollback and alert on partial failure (simulated)', async () => {
            mockPrisma.webhook_logs.findFirst.mockResolvedValue(null);
            mockPrisma.transactions.findMany.mockResolvedValue([
                { id: 'txn_1', status: 'PENDING', notes: {} }
            ]);

            // Simulate Integrity Error inside transaction
            mockPrisma.$transaction.mockRejectedValue(new Error('Simulated DB Deadlock'));

            await webhookController.handleRazorpay(req as Request, res as Response);

            expect(mockAlertService.critical).toHaveBeenCalledWith(
                'WEBHOOK_PROCESSING_ERROR',
                expect.stringContaining('Simulated DB Deadlock'),
                expect.any(Object)
            );
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});
