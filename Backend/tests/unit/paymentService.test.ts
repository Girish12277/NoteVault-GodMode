
import { paymentService } from '../../src/services/paymentService';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Mock Razorpay
jest.mock('razorpay');

describe('Payment Service', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        jest.clearAllMocks();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('createOrder', () => {
        it('should return mock order in development if keys missing', async () => {
            process.env.NODE_ENV = 'development';
            (paymentService as any).instance = null; // Force null

            const order = await paymentService.createOrder(100, 'rec_123', 'user_123');
            expect(order.id).toContain('order_mock_');
            expect(order.status).toBe('created');
        });

        it('should THROW in production if keys missing', async () => {
            process.env.NODE_ENV = 'production';
            (paymentService as any).instance = null;

            await expect(paymentService.createOrder(100, 'rec_123', 'user_123'))
                .rejects.toThrow('Payment Service Unavailable');
        });
    });

    describe('verifyPayment', () => {
        it('should FAIL verification in production if keys missing', () => {
            process.env.NODE_ENV = 'production';
            (paymentService as any).instance = null;

            const result = paymentService.verifyPayment('ord_123', 'pay_123', 'sig_123');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Payment Service Misconfigured');
        });

        it('should REJECT mock orders in production', () => {
            process.env.NODE_ENV = 'production';
            (paymentService as any).instance = { key_secret: 'secret' };

            const result = paymentService.verifyPayment('order_mock_123', 'pay_123', 'sig_123');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Mock orders not allowed');
        });

        it('should verify valid signature correctness', () => {
            process.env.NODE_ENV = 'production';
            (paymentService as any).instance = {};
            (paymentService as any).keySecret = 'secret';

            const orderId = 'order_123';
            const paymentId = 'pay_123';
            const validSig = crypto.createHmac('sha256', 'secret')
                .update(`${orderId}|${paymentId}`)
                .digest('hex');

            const result = paymentService.verifyPayment(orderId, paymentId, validSig);
            expect(result.isValid).toBe(true);
        });

        it('should reject invalid signature', () => {
            process.env.NODE_ENV = 'production';
            (paymentService as any).instance = {};
            (paymentService as any).keySecret = 'secret';

            const result = paymentService.verifyPayment('order_123', 'pay_123', 'wrong_sig');
            expect(result.isValid).toBe(false);
        });
    });
});
