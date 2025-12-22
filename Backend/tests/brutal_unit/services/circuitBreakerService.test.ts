import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockPaymentService = {
    createOrder: jest.fn() as any,
};

jest.mock('../../../src/services/paymentService', () => ({
    __esModule: true,
    paymentService: mockPaymentService
}));

const mockAlertService = {
    critical: jest.fn(),
    warning: jest.fn(),
};

jest.mock('../../../src/services/alertService', () => ({
    __esModule: true,
    alertService: mockAlertService
}));

import { safePaymentService } from '../../../src/services/circuitBreakerService';

describe('CircuitBreakerService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createOrder', () => {
        it('should call paymentService successfully', async () => {
            mockPaymentService.createOrder.mockResolvedValue({ id: 'order_123' });

            const result = await safePaymentService.createOrder(100, 'receipt', 'user');

            expect(result.id).toBe('order_123');
            expect(mockPaymentService.createOrder).toHaveBeenCalled();
        });

        it('should handle payment service failure', async () => {
            mockPaymentService.createOrder.mockRejectedValue(new Error('Razorpay fail'));

            // The circuit breaker re-throws the error (or fallback if open/configured fallback logic handles it)
            // Code shows fallback handles it by logging and throwing 'RAZORPAY_UNAVAILABLE'.
            // However, opossum fallback is usually for OPEN state or timeout/failure?
            // "razorpayCreateOrderBreaker.fallback(...)". Opossum executes fallback on failure.

            await expect(safePaymentService.createOrder(100, 'receipt', 'user'))
                .rejects.toThrow('RAZORPAY_UNAVAILABLE');

            expect(mockAlertService.critical).toHaveBeenCalled();
        });
    });

    describe('getCircuitBreakerStatus', () => {
        it('should return status', () => {
            const status = safePaymentService.getCircuitBreakerStatus();
            expect(status.name).toBe('razorpay_create_order');
            expect(status.state).toBeDefined();
        });
    });
});
