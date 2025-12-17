import Razorpay from 'razorpay';
import { config } from '../config/env';
import crypto from 'crypto';

/**
 * PaymentService.ts
 * 
 * Combined implementation:
 * 1. 'PaymentService' Class - For Admin/Dispute flows (Refunds)
 * 2. 'paymentService' Singleton - For Payment Controller (Checkout)
 */

interface CommissionResult {
    commissionAmountInr: number;
    sellerEarningInr: number;
}

interface VerificationResult {
    isValid: boolean;
    error?: string;
}

interface RefundResult {
    success: boolean;
    gatewayRef?: string;
    error?: string;
}

// ============================================
// 1. Static Class for Admin/Disputes
// ============================================
export class PaymentService {
    /**
     * Process a refund for a transaction.
     * @param transactionId - The transaction to refund
     * @param amount - Amount to refund
     * @param idempotencyKey - Unique key to prevent double processing
     */
    static async processRefund(
        transactionId: string,
        amount: number,
        idempotencyKey: string
    ): Promise<RefundResult> {
        console.log(`[PaymentGateway] Processing refund for ${transactionId} amount: ${amount} key: ${idempotencyKey}`);

        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 800));

        // SIMULATION: Fail if amount is oddly specific (e.g. 999.99) for testing
        if (amount === 999.99) {
            return {
                success: false,
                error: 'GATEWAY_ERROR_SIMULATED: Insufficient funds in merchant account'
            };
        }

        // SIMULATION: Success scenario
        const mockGatewayRef = `rf_${Math.random().toString(36).substring(7)}_${Date.now()}`;

        return {
            success: true,
            gatewayRef: mockGatewayRef
        };
    }

    /**
     * Verify a transaction status with the gateway.
     */
    static async verifyTransaction(gatewayRef: string): Promise<boolean> {
        // Mock verification
        return true;
    }
}

// ============================================
// 2. Singleton Object for Controller
// ============================================
class PaymentServiceSingleton {
    private instance: Razorpay | null = null;
    private keyId: string = process.env.RAZORPAY_KEY_ID || '';
    private keySecret: string = process.env.RAZORPAY_KEY_SECRET || '';

    constructor() {
        if (this.keyId && this.keySecret) {
            this.instance = new Razorpay({
                key_id: this.keyId,
                key_secret: this.keySecret
            });
        }
    }

    public isEnabled(): boolean {
        // Return true if mock or real keys are present
        // For development, we might force true even if keys are dummy
        return !!(this.keyId && this.keySecret) || process.env.NODE_ENV === 'development';
    }

    public getPublicKey(): string {
        return this.keyId || 'rzp_test_mock_key';
    }

    public calculateCommission(amount: number, totalPages: number): CommissionResult {
        // Simple 20% commission logic or fixed fee
        // Platform fee: 20%
        const platformFeePercentage = 0.20;
        const commissionAmountInr = Math.round(amount * platformFeePercentage);
        const sellerEarningInr = amount - commissionAmountInr;

        return {
            commissionAmountInr,
            sellerEarningInr
        };
    }

    public async createOrder(amount: number, receiptId: string, userId: string): Promise<any> {
        if (!this.instance) {
            // SECURITY: No Mocks in Production
            if (process.env.NODE_ENV === 'production') {
                console.error('🛑 FATAL: Attempted to create order without keys in Production');
                throw new Error('Payment Service Unavailable: Configuration Missing');
            }

            // Return mock order if no instance (DEV ONLY)
            console.warn('⚠️ Payment Service: Using MOCK order (Razorpay keys missing)');
            return {
                id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                amount: amount * 100, // Amount in paisa
                currency: 'INR',
                receipt: receiptId,
                status: 'created'
            };
        }

        const options = {
            amount: amount * 100, // Razorpay expects amount in paisa
            currency: 'INR',
            receipt: receiptId,
            notes: { userId }
        };

        try {
            const order = await this.instance.orders.create(options);
            return order;
        } catch (error) {
            console.error('Razorpay createOrder failed:', error);

            // FATAL ERROR IN PROD: Do not mock
            if (process.env.NODE_ENV === 'production') {
                throw new Error('Payment Gateway Connection Failed');
            }

            // Fallback to mock for reliability if keys are bad (DEV ONLY)
            console.warn('⚠️ Falling back to MOCK order due to Gateway Error');
            return {
                id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                amount: amount * 100,
                currency: 'INR',
                receipt: receiptId,
                status: 'created'
            };
        }
    }

    public verifyPayment(
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string
    ): VerificationResult {
        // SECURITY CRITICAL: FAIL CLOSED IN PRODUCTION
        if (!this.instance) {
            if (process.env.NODE_ENV === 'production') {
                console.error('🛑 FATAL: Payment verification attempted without Keys in Production');
                return { isValid: false, error: 'Payment Service Misconfigured' };
            }

            // Dev Mode: Allow mock verification
            if (razorpayOrderId.startsWith('order_mock_')) {
                return { isValid: true };
            }

            // Dev Mode but non-mock ID? Fail.
            return { isValid: false, error: 'Razorpay instance not initialized' };
        }

        // Production/Active Mode: Strict Signature Check
        // Explicitly reject mock orders if instance exists (unless we want to allow mixed mode? No, safer to reject)
        if (razorpayOrderId.startsWith('order_mock_')) {
            if (process.env.NODE_ENV === 'production') {
                return { isValid: false, error: 'Mock orders not allowed' };
            }
            return { isValid: true };
        }

        const generatedSignature = crypto
            .createHmac('sha256', this.keySecret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        // Timing-safe comparison to prevent Timing Attacks
        try {
            const expectedBuf = Buffer.from(generatedSignature, 'utf-8');
            const receivedBuf = Buffer.from(razorpaySignature, 'utf-8');

            // Check lengths before timingSafeEqual to avoid RangeError
            if (expectedBuf.length !== receivedBuf.length) {
                return { isValid: false, error: 'Signature Length Mismatch' };
            }

            const isValid = crypto.timingSafeEqual(expectedBuf, receivedBuf);

            if (isValid) {
                return { isValid: true };
            } else {
                return { isValid: false, error: 'Invalid signature' };
            }
        } catch (error) {
            return { isValid: false, error: 'Signature Verification Failed' };
        }
    }
}

export const paymentService = new PaymentServiceSingleton();
