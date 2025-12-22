import { jest, describe, it, expect, beforeEach, beforeAll, afterEach } from '@jest/globals';
import { Request, Response } from 'express';
import crypto from 'crypto';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockPaymentService = {
    isEnabled: jest.fn(),
    getPublicKey: jest.fn(),
    calculateCommission: jest.fn(),
    verifyPayment: jest.fn(),
};

const mockPaymentIdempotencyService = {
    reservePayment: jest.fn(),
    processPayment: jest.fn(),
};

const mockInvoiceService = {
    generateInvoice: jest.fn(),
};

const mockPrisma = {
    payment_orders: {
        findUnique: jest.fn() as any,
        update: jest.fn() as any,
    },
    notes: {
        findMany: jest.fn() as any,
        update: jest.fn() as any,
    },
    purchases: {
        findMany: jest.fn() as any, // Fixed: Added this
        create: jest.fn() as any,
    },
    transactions: {
        create: jest.fn() as any,
        findMany: jest.fn() as any,
        updateMany: jest.fn() as any,
        update: jest.fn() as any,
    },
    seller_wallets: {
        upsert: jest.fn() as any,
    },
    notifications: {
        create: jest.fn() as any,
    },
    $transaction: jest.fn((cb: any) => cb(mockPrisma)) as any,
};

jest.mock('../../../src/services/paymentService', () => ({
    __esModule: true,
    paymentService: mockPaymentService
}));

jest.mock('../../../src/services/paymentIdempotencyService', () => ({
    __esModule: true,
    PaymentIdempotencyService: mockPaymentIdempotencyService
}));

jest.mock('../../../src/services/invoiceService', () => ({
    __esModule: true,
    invoiceService: mockInvoiceService
}));

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

jest.mock('../../../src/services/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn() }
}));

// Import Controller
import { paymentController } from '../../../src/controllers/paymentController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Payment Controller - Brutal Unit Tests', () => {
    let req: Partial<Request> & { headers: Record<string, string>, user?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = {
            method: 'POST',
            headers: {},
            body: {},
            user: {
                id: 'user_1',
                email: 'test@example.com',
                fullName: 'Test User',
                isSeller: false,
                isAdmin: false,
                phone: '9999999999',
                is_active: true
            } as any
        };

        res = {
            status: statusMock as any,
            json: jsonMock as any,
            setHeader: jest.fn() as any,
            send: jest.fn() as any,
        };

        // Defaults
        (mockPaymentService.isEnabled as any).mockReturnValue(true);
        (mockPaymentService.getPublicKey as any).mockReturnValue('rzp_test_123');
    });

    // ------------------------------------------------------------------
    // CREATE ORDER
    // ------------------------------------------------------------------
    describe('createOrder', () => {
        it('should return 503 if payment service is disabled', async () => {
            (mockPaymentService.isEnabled as any).mockReturnValue(false);
            await paymentController.createOrder(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(503);
        });

        it('should return 400 if no noteIds provided', async () => {
            req.body = { noteIds: [] };
            await paymentController.createOrder(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should handle Idempotent Request (Order already exists)', async () => {
            req.body = { noteIds: ['note_1'] };

            // Mock Idempotency Service returning 'reserved: false' (meaning found existing)
            (mockPaymentIdempotencyService.reservePayment as any).mockResolvedValue({
                reserved: false,
                existingPaymentId: 'pay_order_1'
            });

            // Mock DB finding the existing order
            (mockPrisma.payment_orders.findUnique as any).mockResolvedValue({
                id: 'pay_order_1',
                status: 'CREATED',
                razorpay_order_id: 'order_rzp_1',
                total_amount: 100
            });

            await paymentController.createOrder(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('already exists')
            }));
            expect(mockPrisma.notes.findMany).not.toHaveBeenCalled(); // Should skip logic
        });

        it('should reject if Notes are Unavailable', async () => {
            req.body = { noteIds: ['note_1', 'note_2'] };

            (mockPaymentIdempotencyService.reservePayment as any).mockResolvedValue({
                reserved: true,
                paymentId: 'pay_order_new'
            });

            // Only find one note (note_2 missing or inactive)
            (mockPrisma.notes.findMany as any).mockResolvedValue([
                { id: 'note_1', is_active: true }
            ]);

            await paymentController.createOrder(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ code: 'NOTES_UNAVAILABLE' }));
            // Verify Fail Status Update
            expect(mockPrisma.payment_orders.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'pay_order_new' },
                    data: expect.objectContaining({ status: 'FAILED' })
                })
            );
        });

        it('should reject Self Purchase', async () => {
            req.body = { noteIds: ['note_1'] };
            req.user!.id = 'seller_1'; // User matches Seller

            (mockPaymentIdempotencyService.reservePayment as any).mockResolvedValue({ reserved: true, paymentId: 'p1' });

            (mockPrisma.notes.findMany as any).mockResolvedValue([
                { id: 'note_1', seller_id: 'seller_1', price_inr: 100 }
            ]);
            (mockPrisma.purchases.findMany as any).mockResolvedValue([]); // Not bought yet

            await paymentController.createOrder(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ code: 'SELF_PURCHASE_NOT_ALLOWED' }));
        });

        it('should create order successfully', async () => {
            req.body = { noteIds: ['note_1'] };

            (mockPaymentIdempotencyService.reservePayment as any).mockResolvedValue({ reserved: true, paymentId: 'p1' });

            (mockPrisma.notes.findMany as any).mockResolvedValue([
                { id: 'note_1', seller_id: 'seller_2', price_inr: 100, total_pages: 10 }
            ]);
            (mockPrisma.purchases.findMany as any).mockResolvedValue([]);

            // Commission Mock
            (mockPaymentService.calculateCommission as any).mockReturnValue({
                commissionAmountInr: 10,
                sellerEarningInr: 90
            });

            // Process Payment Mock
            (mockPaymentIdempotencyService.processPayment as any).mockResolvedValue({
                razorpayOrderId: 'rzp_order_new'
            });

            await paymentController.createOrder(req as Request, res as Response);

            // 1. Transaction Creation
            expect(mockPrisma.transactions.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        payment_gateway_order_id: 'rzp_order_new',
                        amount_inr: 100,
                        seller_earning_inr: 90
                    })
                })
            );

            // 2. Success Response
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ orderId: 'rzp_order_new' })
            }));
        });
    });

    // ------------------------------------------------------------------
    // VERIFY PAYMENT
    // ------------------------------------------------------------------
    describe('verifyPayment', () => {
        const verifyBody = {
            razorpayOrderId: 'order_123',
            razorpayPaymentId: 'pay_123',
            razorpaySignature: 'sig_123'
        };

        it('should return 404 if order not found', async () => {
            req.body = verifyBody;
            (mockPrisma.transactions.findMany as any).mockResolvedValue([]);

            await paymentController.verifyPayment(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });

        it('should return 400 if signature invalid (and mark transactions FAILED)', async () => {
            req.body = verifyBody;

            // Found transactions
            (mockPrisma.transactions.findMany as any).mockResolvedValue([
                { id: 'tx_1', status: 'PENDING', buyer_id: 'user_1', notes: {} }
            ]);

            // Mock Verify Fail
            (mockPaymentService.verifyPayment as any).mockReturnValue({ isValid: false, error: 'Bad Sig' });

            await paymentController.verifyPayment(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);

            // Verify DB Update to FAILED
            expect(mockPrisma.transactions.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { payment_gateway_order_id: 'order_123' },
                    data: expect.objectContaining({ status: 'FAILED' })
                })
            );
        });

        it('should process successful atomic verification', async () => {
            req.body = verifyBody;

            const mockTxn = {
                id: 'tx_1',
                status: 'PENDING',
                buyer_id: 'user_1',
                note_id: 'note_1',
                seller_id: 'seller_1',
                seller_earning_inr: 90,
                amount_inr: 100,
                notes: {
                    title: 'Test Note',
                    file_url: 'http://s3.com/file'
                }
            };

            (mockPrisma.transactions.findMany as any).mockResolvedValue([mockTxn]);
            (mockPaymentService.verifyPayment as any).mockReturnValue({ isValid: true });

            // Atomic blocks... logic mimics webhook slightly but triggered by Client
            await paymentController.verifyPayment(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

            // Verify Atomic Updates
            expect(mockPrisma.transactions.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ status: 'SUCCESS' }) })
            );
            expect(mockPrisma.purchases.create).toHaveBeenCalled();
            expect(mockPrisma.seller_wallets.upsert).toHaveBeenCalled();
        });
    });
});
