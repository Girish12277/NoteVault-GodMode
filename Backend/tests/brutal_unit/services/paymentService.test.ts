import { PaymentService, paymentService } from '../../../src/services/paymentService';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Use a distinct mock for Razorpay
jest.mock('razorpay');

describe('Brutal Payment Service Testing', () => {
    // Save original env
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv }; // Reset env
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('Static Class: PaymentService (Refunds)', () => {
        it('should process refund successfully', async () => {
            const result = await PaymentService.processRefund('tx_123', 500, 'key_123');
            expect(result.success).toBe(true);
            expect(result.gatewayRef).toBeDefined();
        });

        it('should fail refund for specific test amount 999.99', async () => {
            const result = await PaymentService.processRefund('tx_123', 999.99, 'key_123');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Insufficient funds');
        });

        it('should return true for verifyTransaction', async () => {
            const result = await PaymentService.verifyTransaction('ref_123');
            expect(result).toBe(true);
        });
    });

    describe('Singleton: paymentService', () => {

        describe('calculateCommission', () => {
            it('should calculate 20% commission correctly', () => {
                const result = paymentService.calculateCommission(1000, 10);
                expect(result.commissionAmountInr).toBe(200);
                expect(result.sellerEarningInr).toBe(800);
            });

            it('should handle rounding if needed', () => {
                // 1005 * 0.20 = 201
                const result = paymentService.calculateCommission(1005, 10);
                expect(result.commissionAmountInr).toBe(201);
            });
        });

        describe('createOrder (Development Mode)', () => {
            it('should create mock order if keys missing in DEV', async () => {
                process.env.NODE_ENV = 'development';
                process.env.RAZORPAY_KEY_ID = '';
                process.env.RAZORPAY_KEY_SECRET = '';

                // Re-instantiate or access logic. The singleton is already created on import.
                // We rely on the logic inside createOrder checking instance/env at runtime for some parts,
                // but instance is set at strict construction time.
                // NOTE: Since singleton is created at module load, we can't easily "reset" the constructor state 
                // without advanced mocking or jest.isolateModules. 
                // However, the `createOrder` method checks `if (!this.instance)`. 
                // If keys were present during initial load (setup.ts loads .env), instance exists.
                // We need to bypass the instance for this test or assume instance is missing.

                // HACK: Force instance to null to simulate missing keys
                (paymentService as any).instance = null;

                const result = await paymentService.createOrder(100, 'rcpt_1', 'user_1');
                expect(result.id).toMatch(/^order_mock_/);
                expect(result.status).toBe('created');
            });
        });

        describe('createOrder (Production Mode)', () => {
            it('should THROW ERROR if keys missing in PROD', async () => {
                process.env.NODE_ENV = 'production';
                (paymentService as any).instance = null; // Force missing instance

                await expect(paymentService.createOrder(100, 'rcpt_1', 'user_1'))
                    .rejects
                    .toThrow('Payment Service Unavailable: Configuration Missing');
            });
        });

        describe('verifyPayment', () => {
            // We need to properly mock crypto for HMAC verification test

            it('should return valid true for correct signature', () => {
                // Setup instance with a secret
                (paymentService as any).instance = {};
                (paymentService as any).keySecret = 'test_secret';

                const orderId = 'order_123';
                const paymentId = 'pay_123';
                // correct signature for 'order_123|pay_123' with secret 'test_secret'
                // verified via external tool or using actual crypto here
                const generatedSignature = crypto
                    .createHmac('sha256', 'test_secret')
                    .update(`${orderId}|${paymentId}`)
                    .digest('hex');

                const result = paymentService.verifyPayment(orderId, paymentId, generatedSignature);
                expect(result.isValid).toBe(true);
            });

            it('should return valid false for incorrect signature', () => {
                (paymentService as any).instance = {};
                (paymentService as any).keySecret = 'test_secret';

                const result = paymentService.verifyPayment('order_1', 'pay_1', 'wrong_sig');
                expect(result.isValid).toBe(false);
                expect(result.error).toBe('Signature Length Mismatch'); // Or invalid signature
            });

            it('should fail closed in PROD if instance missing', () => {
                process.env.NODE_ENV = 'production';
                (paymentService as any).instance = null;

                const result = paymentService.verifyPayment('order_1', 'pay_1', 'sig');
                expect(result.isValid).toBe(false);
                expect(result.error).toBe('Payment Service Misconfigured');
            });

            it('should fail for mock orders in PROD', () => {
                process.env.NODE_ENV = 'production';
                (paymentService as any).instance = {}; // Instance exists

                const result = paymentService.verifyPayment('order_mock_123', 'pay_1', 'sig');
                expect(result.isValid).toBe(false);
                expect(result.error).toBe('Mock orders not allowed');
            });
        });
    });
});
