import CircuitBreaker from 'opossum';
import { paymentService } from './paymentService';
import { alertService } from './alertService';

/**
 * Circuit Breaker Service (Enhancement #4)
 * God-Tier: Prevents cascading failures when external APIs (Razorpay) fail
 * Pattern: Circuit breaker with graceful degradation
 */

// Circuit breaker for Razorpay order creation
const razorpayCreateOrderBreaker = new CircuitBreaker(
    async (amount: number, receiptId: string, userId: string) => {
        // Call actual Razorpay API
        return await paymentService.createOrder(amount, receiptId, userId);
    },
    {
        timeout: 5000,                    // Fail after 5 seconds
        errorThresholdPercentage: 50,     // Open circuit after 50% errors
        resetTimeout: 30000,              // Retry after 30 seconds (half-open)
        rollingCountTimeout: 10000,       // 10-second error window
        rollingCountBuckets: 10,          // 10 buckets for statistical accuracy
        name: 'razorpay_create_order',
        volumeThreshold: 5                // Minimum 5 requests before opening
    }
);

// Fallback: Return error message when Razorpay is down
razorpayCreateOrderBreaker.fallback(async (amount: number, receiptId: string, userId: string) => {
    console.warn('[CIRCUIT-BREAKER] Razorpay unavailable - returning fallback');

    // Alert ops team
    alertService.critical('RAZORPAY_CIRCUIT_BREAKER_FALLBACK',
        'Razorpay circuit breaker fallback activated',
        { amount, receiptId, userId }
    );

    // Throw error to be handled by caller
    throw new Error('RAZORPAY_UNAVAILABLE: Payment service temporarily unavailable. Please try again in a few minutes.');
});

// Monitoring events
razorpayCreateOrderBreaker.on('open', () => {
    console.error('[CIRCUIT-BREAKER] 🚨 OPENED: Razorpay unavailable (>50% errors)');
    alertService.critical('RAZORPAY_CIRCUIT_BREAKER_OPEN',
        'Razorpay circuit breaker OPENED - service unavailable',
        { threshold: '50%', resetTimeout: '30s' }
    );
});

razorpayCreateOrderBreaker.on('halfOpen', () => {
    console.warn('[CIRCUIT-BREAKER] ⚠️ HALF-OPEN: Testing Razorpay recovery');
});

razorpayCreateOrderBreaker.on('close', () => {
    console.info('[CIRCUIT-BREAKER] ✅ CLOSED: Razorpay recovered');
    alertService.warning('RAZORPAY_CIRCUIT_BREAKER_CLOSED',
        'Razorpay circuit breaker CLOSED - service recovered',
        {}
    );
});

// Export protected service
export const safePaymentService = {
    /**
     * Create Razorpay order with circuit breaker protection
     * Throws RAZORPAY_UNAVAILABLE error if service is down
     */
    createOrder: async (amount: number, receiptId: string, userId: string) => {
        return await razorpayCreateOrderBreaker.fire(amount, receiptId, userId);
    },

    /**
     * Get circuit breaker status (for monitoring)
     */
    getCircuitBreakerStatus: () => {
        return {
            name: 'razorpay_create_order',
            state: razorpayCreateOrderBreaker.opened ? 'OPEN' :
                razorpayCreateOrderBreaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
            stats: razorpayCreateOrderBreaker.stats
        };
    }
};
