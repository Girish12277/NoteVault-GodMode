import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import crypto from 'crypto';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockPrisma = {
    $executeRawUnsafe: jest.fn() as any,
    payment_orders: {
        findUnique: jest.fn() as any,
        create: jest.fn() as any,
        update: jest.fn() as any,
        updateMany: jest.fn() as any,
    },
};

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

const mockPaymentService = {
    createOrder: jest.fn() as any,
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

jest.mock('../../../src/services/logger', () => ({
    __esModule: true,
    logger: mockLogger
}));

jest.mock('../../../src/services/paymentService', () => ({
    __esModule: true,
    paymentService: mockPaymentService
}));

// Import Service AFTER mocks
import { PaymentIdempotencyService } from '../../../src/services/paymentIdempotencyService';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('PaymentIdempotencyService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ------------------------------------------------------------------
    // LOCK ID GENERATION (Critical for uniqueness)
    // ------------------------------------------------------------------
    describe('idempotencyKeyToLockId (Private - Tested via Public Methods)', () => {
        it('should generate consistent lock IDs for same key', async () => {
            const key = 'test_key_123';

            // Reserve twice with same key
            mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined); // Lock acquired
            mockPrisma.payment_orders.findUnique.mockResolvedValueOnce({
                id: 'existing_payment',
                status: 'RESERVED'
            });
            mockPrisma.payment_orders.findUnique.mockResolvedValueOnce({
                id: 'existing_payment',
                status: 'RESERVED'
            });

            await PaymentIdempotencyService.reservePayment(key, 'user1', ['note1']);

            const firstLockCall = mockPrisma.$executeRawUnsafe.mock.calls[0][0];

            // Clear and retry
            jest.clearAllMocks();
            mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined);
            mockPrisma.payment_orders.findUnique.mockResolvedValue({ id: 'existing_payment' });

            await PaymentIdempotencyService.reservePayment(key, 'user1', ['note1']);

            const secondLockCall = mockPrisma.$executeRawUnsafe.mock.calls[0][0];

            // Same key must produce same lock ID
            expect(firstLockCall).toBe(secondLockCall);
        });

        it('should generate different lock IDs for different keys', async () => {
            mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined);
            mockPrisma.payment_orders.findUnique.mockResolvedValue({ id: 'existing' });

            await PaymentIdempotencyService.reservePayment('key1', 'user1', ['note1']);
            const lock1 = mockPrisma.$executeRawUnsafe.mock.calls[0][0];

            jest.clearAllMocks();
            mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined);
            mockPrisma.payment_orders.findUnique.mockResolvedValue({ id: 'existing' });

            await PaymentIdempotencyService.reservePayment('key2', 'user1', ['note1']);
            const lock2 = mockPrisma.$executeRawUnsafe.mock.calls[0][0];

            expect(lock1).not.toBe(lock2);
        });
    });

    // ------------------------------------------------------------------
    // RESERVE PAYMENT (Core Logic)
    // ------------------------------------------------------------------
    describe('reservePayment', () => {
        const idempotencyKey = 'test_idempotency_key';
        const userId = 'user_123';
        const noteIds = ['note_1', 'note_2'];

        it('should acquire lock, create payment, and release lock on new reservation', async () => {
            mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined); // Lock/unlock success
            mockPrisma.payment_orders.findUnique.mockResolvedValue(null); // No existing
            mockPrisma.payment_orders.create.mockResolvedValue({
                id: 'payment_new',
                status: 'RESERVED'
            });

            const result = await PaymentIdempotencyService.reservePayment(
                idempotencyKey,
                userId,
                noteIds
            );

            // 1. Lock acquired
            expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
                expect.stringContaining('pg_advisory_lock')
            );

            // 2. Payment created
            expect(mockPrisma.payment_orders.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        idempotency_key: idempotencyKey,
                        user_id: userId,
                        note_ids: noteIds,
                        status: 'RESERVED'
                    })
                })
            );

            // 3. Lock released
            expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
                expect.stringContaining('pg_advisory_unlock')
            );

            // 4. Result
            expect(result).toEqual({
                reserved: true,
                paymentId: 'payment_new'
            });
        });

        it('should return existing payment if already reserved (idempotency)', async () => {
            mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined);
            mockPrisma.payment_orders.findUnique.mockResolvedValue({
                id: 'existing_payment_id',
                status: 'RESERVED'
            });

            const result = await PaymentIdempotencyService.reservePayment(
                idempotencyKey,
                userId,
                noteIds
            );

            expect(result).toEqual({
                reserved: false,
                existingPaymentId: 'existing_payment_id'
            });

            // Should NOT create new payment
            expect(mockPrisma.payment_orders.create).not.toHaveBeenCalled();

            // But MUST release lock
            expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
                expect.stringContaining('pg_advisory_unlock')
            );
        });

        it('should release lock even if payment creation fails', async () => {
            mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined);
            mockPrisma.payment_orders.findUnique.mockResolvedValue(null);
            mockPrisma.payment_orders.create.mockRejectedValue(new Error('DB Error'));

            await expect(
                PaymentIdempotencyService.reservePayment(idempotencyKey, userId, noteIds)
            ).rejects.toThrow('DB Error');

            // CRITICAL: Lock must be released in finally block
            expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
                expect.stringContaining('pg_advisory_unlock')
            );
        });

        it('should handle lock release failure gracefully', async () => {
            mockPrisma.$executeRawUnsafe
                .mockResolvedValueOnce(undefined) // Lock acquire success
                .mockRejectedValueOnce(new Error('Lock release failed')); // Unlock fails

            mockPrisma.payment_orders.findUnique.mockResolvedValue({
                id: 'existing_payment'
            });

            // Should NOT throw despite unlock failure
            const result = await PaymentIdempotencyService.reservePayment(
                idempotencyKey,
                userId,
                noteIds
            );

            expect(result.reserved).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to release lock'),
                expect.any(Object)
            );
        });

        it('should set 5-minute expiry on reservation', async () => {
            mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined);
            mockPrisma.payment_orders.findUnique.mockResolvedValue(null);
            mockPrisma.payment_orders.create.mockResolvedValue({ id: 'pay_1' });

            const beforeTime = Date.now();
            await PaymentIdempotencyService.reservePayment(idempotencyKey, userId, noteIds);
            const afterTime = Date.now();

            const createCall = mockPrisma.payment_orders.create.mock.calls[0][0];
            const reservedUntil = new Date(createCall.data.reserved_until).getTime();
            const reservedAt = new Date(createCall.data.reserved_at).getTime();

            // Verify 5-minute window (300000ms)
            const expiryDuration = reservedUntil - reservedAt;
            expect(expiryDuration).toBeGreaterThanOrEqual(299000); // Allow 1s margin
            expect(expiryDuration).toBeLessThanOrEqual(301000);
        });
    });

    // ------------------------------------------------------------------
    // PROCESS PAYMENT (Razorpay Integration)
    // ------------------------------------------------------------------
    describe('processPayment', () => {
        const paymentId = 'payment_123';
        const amount = 1000;

        it('should process RESERVED payment and create Razorpay order', async () => {
            mockPrisma.payment_orders.findUnique.mockResolvedValue({
                id: paymentId,
                status: 'RESERVED',
                user_id: 'user_1'
            });

            mockPaymentService.createOrder.mockResolvedValue({
                id: 'rzp_order_ABC123',
                amount: amount
            });

            mockPrisma.payment_orders.update.mockResolvedValue({});

            const result = await PaymentIdempotencyService.processPayment(paymentId, amount);

            expect(mockPaymentService.createOrder).toHaveBeenCalledWith(
                amount,
                expect.stringContaining('ord_'),
                'user_1'
            );

            expect(mockPrisma.payment_orders.update).toHaveBeenCalledWith({
                where: { id: paymentId },
                data: expect.objectContaining({
                    razorpay_order_id: 'rzp_order_ABC123',
                    total_amount: amount,
                    status: 'PENDING'
                })
            });

            expect(result).toEqual({
                razorpayOrderId: 'rzp_order_ABC123',
                amount,
                status: 'PENDING'
            });
        });

        it('should return existing Razorpay order if already PENDING', async () => {
            mockPrisma.payment_orders.findUnique.mockResolvedValue({
                id: paymentId,
                status: 'PENDING',
                razorpay_order_id: 'rzp_existing_123',
                total_amount: amount
            });

            const result = await PaymentIdempotencyService.processPayment(paymentId, amount);

            expect(result).toEqual({
                razorpayOrderId: 'rzp_existing_123',
                amount,
                status: 'PENDING'
            });

            // Should NOT call Razorpay again
            expect(mockPaymentService.createOrder).not.toHaveBeenCalled();
        });

        it('should throw if payment not found', async () => {
            mockPrisma.payment_orders.findUnique.mockResolvedValue(null);

            await expect(
                PaymentIdempotencyService.processPayment(paymentId, amount)
            ).rejects.toThrow('Payment order not found');
        });

        it('should throw if payment in invalid state (e.g., FAILED)', async () => {
            mockPrisma.payment_orders.findUnique.mockResolvedValue({
                id: paymentId,
                status: 'FAILED'
            });

            await expect(
                PaymentIdempotencyService.processPayment(paymentId, amount)
            ).rejects.toThrow('Invalid payment state: FAILED');
        });

        it('should mark payment as FAILED if Razorpay call fails', async () => {
            mockPrisma.payment_orders.findUnique.mockResolvedValue({
                id: paymentId,
                status: 'RESERVED',
                user_id: 'user_1'
            });

            mockPaymentService.createOrder.mockRejectedValue(new Error('Razorpay API Error'));
            mockPrisma.payment_orders.update.mockResolvedValue({});

            await expect(
                PaymentIdempotencyService.processPayment(paymentId, amount)
            ).rejects.toThrow('Razorpay API Error');

            expect(mockPrisma.payment_orders.update).toHaveBeenCalledWith({
                where: { id: paymentId },
                data: expect.objectContaining({
                    status: 'FAILED',
                    error_message: 'Razorpay API Error'
                })
            });
        });
    });

    // ------------------------------------------------------------------
    // CLEANUP EXPIRED RESERVATIONS (Cron Job)
    // ------------------------------------------------------------------
    describe('cleanupExpiredReservations', () => {
        it('should expire old RESERVED payments', async () => {
            mockPrisma.payment_orders.updateMany.mockResolvedValue({ count: 3 });

            const count = await PaymentIdempotencyService.cleanupExpiredReservations();

            expect(count).toBe(3);
            expect(mockPrisma.payment_orders.updateMany).toHaveBeenCalledWith({
                where: {
                    status: 'RESERVED',
                    reserved_until: {
                        lt: expect.any(Date)
                    }
                },
                data: expect.objectContaining({
                    status: 'EXPIRED'
                })
            });
        });

        it('should return 0 if no expired reservations', async () => {
            mockPrisma.payment_orders.updateMany.mockResolvedValue({ count: 0 });

            const count = await PaymentIdempotencyService.cleanupExpiredReservations();

            expect(count).toBe(0);
        });

        it('should only target RESERVED status payments', async () => {
            mockPrisma.payment_orders.updateMany.mockResolvedValue({ count: 1 });

            await PaymentIdempotencyService.cleanupExpiredReservations();

            const whereClause = mockPrisma.payment_orders.updateMany.mock.calls[0][0].where;
            expect(whereClause.status).toBe('RESERVED');
        });
    });
});
