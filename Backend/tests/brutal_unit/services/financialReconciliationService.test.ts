// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockPrisma = {
    transactions: {
        aggregate: jest.fn() as any,
    },
    financial_reconciliation: {
        create: jest.fn() as any,
    },
};

const mockAlertService = {
    critical: jest.fn(),
};

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

jest.mock('../../../src/services/alertService', () => ({
    __esModule: true,
    alertService: mockAlertService
}));

jest.mock('../../../src/services/logger', () => ({
    __esModule: true,
    logger: mockLogger
}));

// Import Service AFTER mocks
import { financialReconciliationService } from '../../../src/services/financialReconciliationService';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('FinancialReconciliationService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('reconcileDaily', () => {
        const testDate = new Date('2025-01-15T10:00:00Z');

        it('should return MATCH when our total matches Razorpay (within ₹100 threshold)', async () => {
            // Our DB aggregate
            mockPrisma.transactions.aggregate
                .mockResolvedValueOnce({
                    _sum: { amount_inr: 10000 },
                    _count: 5
                })
                // Mock Razorpay fetch (calls aggregate again)
                .mockResolvedValueOnce({
                    _sum: { amount_inr: 10050 }, // ₹50 diff (< ₹100 threshold)
                    _count: 5
                });

            mockPrisma.financial_reconciliation.create.mockResolvedValue({ id: 'recon_1' });

            const result = await financialReconciliationService.reconcileDaily(testDate);

            expect(result).toEqual({
                status: 'MATCH',
                ourTotal: 10000,
                razorpayTotal: 10050,
                difference: 50
            });

            // Should NOT alert
            expect(mockAlertService.critical).not.toHaveBeenCalled();
        });

        it('should return MISMATCH and alert when difference exceeds ₹100', async () => {
            mockPrisma.transactions.aggregate
                .mockResolvedValueOnce({
                    _sum: { amount_inr: 10000 },
                    _count: 5
                })
                .mockResolvedValueOnce({
                    _sum: { amount_inr: 10200 }, // ₹200 diff (> ₹100 threshold)
                    _count: 5
                });

            mockPrisma.financial_reconciliation.create.mockResolvedValue({ id: 'recon_2' });

            const result = await financialReconciliationService.reconcileDaily(testDate);

            expect(result).toEqual({
                status: 'MISMATCH',
                ourTotal: 10000,
                razorpayTotal: 10200,
                difference: 200
            });

            // Should alert CRITICAL
            expect(mockAlertService.critical).toHaveBeenCalledWith(
                'FINANCIAL_RECONCILIATION_MISMATCH',
                expect.stringContaining('₹200'),
                expect.objectContaining({
                    ourTotal: 10000,
                    razorpayTotal: 10200,
                    difference: 200
                })
            );

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('FINANCIAL RECONCILIATION FAILED'),
                expect.any(Object)
            );
        });

        it('should create reconciliation record with correct data', async () => {
            mockPrisma.transactions.aggregate
                .mockResolvedValueOnce({
                    _sum: { amount_inr: 5000 },
                    _count: 3
                })
                .mockResolvedValueOnce({
                    _sum: { amount_inr: 5000 },
                    _count: 3
                });

            mockPrisma.financial_reconciliation.create.mockResolvedValue({ id: 'recon_3' });

            await financialReconciliationService.reconcileDaily(testDate);

            expect(mockPrisma.financial_reconciliation.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    our_total: 5000,
                    our_count: 3,
                    razorpay_total: 5000,
                    razorpay_count: 3,
                    amount_difference: 0,
                    count_difference: 0,
                    status: 'MATCH'
                })
            });
        });

        it('should handle ₹100 exactly at threshold (boundary test) - MATCH', async () => {
            mockPrisma.transactions.aggregate
                .mockResolvedValueOnce({
                    _sum: { amount_inr: 10000 },
                    _count: 5
                })
                .mockResolvedValueOnce({
                    _sum: { amount_inr: 10100 }, // Exactly ₹100
                    _count: 5
                });

            mockPrisma.financial_reconciliation.create.mockResolvedValue({ id: 'recon_4' });

            const result = await financialReconciliationService.reconcileDaily(testDate);

            // ₹100 is NOT > ₹100, so should be MATCH
            expect(result.status).toBe('MATCH');
            expect(mockAlertService.critical).not.toHaveBeenCalled();
        });

        it('should handle ₹101 just above threshold - MISMATCH', async () => {
            mockPrisma.transactions.aggregate
                .mockResolvedValueOnce({
                    _sum: { amount_inr: 10000 },
                    _count: 5
                })
                .mockResolvedValueOnce({
                    _sum: { amount_inr: 10101 }, // ₹101
                    _count: 5
                });

            mockPrisma.financial_reconciliation.create.mockResolvedValue({ id: 'recon_5' });

            const result = await financialReconciliationService.reconcileDaily(testDate);

            expect(result.status).toBe('MISMATCH');
            expect(mockAlertService.critical).toHaveBeenCalled();
        });

        it('should handle zero transactions gracefully', async () => {
            mockPrisma.transactions.aggregate
                .mockResolvedValueOnce({
                    _sum: { amount_inr: null }, // No transactions
                    _count: 0
                })
                .mockResolvedValueOnce({
                    _sum: { amount_inr: null },
                    _count: 0
                });

            mockPrisma.financial_reconciliation.create.mockResolvedValue({ id: 'recon_6' });

            const result = await financialReconciliationService.reconcileDaily(testDate);

            expect(result).toEqual({
                status: 'MATCH',
                ourTotal: 0,
                razorpayTotal: 0,
                difference: 0
            });
        });

        it('should query correct time range (full day)', async () => {
            mockPrisma.transactions.aggregate
                .mockResolvedValueOnce({ _sum: { amount_inr: 1000 }, _count: 1 })
                .mockResolvedValueOnce({ _sum: { amount_inr: 1000 }, _count: 1 });

            mockPrisma.financial_reconciliation.create.mockResolvedValue({ id: 'recon_7' });

            await financialReconciliationService.reconcileDaily(testDate);

            const firstCall = mockPrisma.transactions.aggregate.mock.calls[0][0];
            const whereClause = firstCall.where;

            // Verify time range
            const gte = whereClause.updated_at.gte;
            const lte = whereClause.updated_at.lte;

            // Verify it's querying same day
            expect(gte.getDate()).toBe(testDate.getDate());
            expect(lte.getDate()).toBe(testDate.getDate());

            // Verify start of day is before end of day
            expect(gte.getTime()).toBeLessThan(lte.getTime());

            // Verify ~24 hour span (allowing for DST)
            const diffMs = lte.getTime() - gte.getTime();
            expect(diffMs).toBeGreaterThan(86390000); // ~23h59m50s
            expect(diffMs).toBeLessThan(86410000); // ~24h0m10s
        });

        it('should only query SUCCESS status transactions', async () => {
            mockPrisma.transactions.aggregate
                .mockResolvedValueOnce({ _sum: { amount_inr: 1000 }, _count: 1 })
                .mockResolvedValueOnce({ _sum: { amount_inr: 1000 }, _count: 1 });

            mockPrisma.financial_reconciliation.create.mockResolvedValue({ id: 'recon_8' });

            await financialReconciliationService.reconcileDaily(testDate);

            const firstCall = mockPrisma.transactions.aggregate.mock.calls[0][0];
            expect(firstCall.where.status).toBe('SUCCESS');
        });

        it('should calculate absolute difference (negative diffs become positive)', async () => {
            mockPrisma.transactions.aggregate
                .mockResolvedValueOnce({
                    _sum: { amount_inr: 8000 }, // Lower than Razorpay
                    _count: 4
                })
                .mockResolvedValueOnce({
                    _sum: { amount_inr: 8300 },
                    _count: 4
                });

            mockPrisma.financial_reconciliation.create.mockResolvedValue({ id: 'recon_9' });

            const result = await financialReconciliationService.reconcileDaily(testDate);

            // Diff should be positive number
            expect(result.difference).toBe(300);
            expect(result.status).toBe('MISMATCH');
        });

        it('should alert and throw on reconciliation failure', async () => {
            mockPrisma.transactions.aggregate.mockRejectedValue(new Error('DB Connection Lost'));

            await expect(
                financialReconciliationService.reconcileDaily(testDate)
            ).rejects.toThrow('DB Connection Lost');

            expect(mockAlertService.critical).toHaveBeenCalledWith(
                'RECONCILIATION_JOB_FAILED',
                expect.stringContaining('crashed'),
                expect.any(Object)
            );

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Financial reconciliation failed'),
                expect.any(Object)
            );
        });

        it('should warn about mock Razorpay data usage', async () => {
            mockPrisma.transactions.aggregate
                .mockResolvedValueOnce({ _sum: { amount_inr: 1000 }, _count: 1 })
                .mockResolvedValueOnce({ _sum: { amount_inr: 1000 }, _count: 1 });

            mockPrisma.financial_reconciliation.create.mockResolvedValue({ id: 'recon_10' });

            await financialReconciliationService.reconcileDaily(testDate);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('mock Razorpay data')
            );
        });
    });
});
