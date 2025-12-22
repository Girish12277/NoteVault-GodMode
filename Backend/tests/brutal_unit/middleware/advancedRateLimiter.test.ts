// @ts-nocheck
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS
// ------------------------------------------------------------------

const mockConsume = jest.fn();

// Mock Alert Service
jest.mock('../../../src/services/alertService', () => ({
    alertService: {
        warning: jest.fn()
    }
}));

// Mock rate-limiter-flexible
jest.mock('rate-limiter-flexible', () => {
    return {
        RateLimiterRedis: jest.fn().mockImplementation(() => ({
            consume: mockConsume
        })),
        RateLimiterMemory: jest.fn().mockImplementation(() => ({
            consume: mockConsume
        }))
    };
});

// Mock Redis
jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
        connect: jest.fn().mockResolvedValue(true),
        on: jest.fn()
    }))
}));

// ------------------------------------------------------------------
// IMPORTS
// ------------------------------------------------------------------
// We need to import AFTER mocks to ensure initialization uses mocks
import { enforcePaymentRateLimit, enforceGeneralRateLimit } from '../../../src/middleware/advancedRateLimiter';
import { alertService } from '../../../src/services/alertService';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Advanced Rate Limiter - Brutal Unit Tests', () => {
    let req: any;
    let res: any;
    let next: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockConsume.mockResolvedValue({ msBeforeNext: 0 }); // Default allow

        req = {
            ip: '127.0.0.1',
            path: '/api/test',
            user: { id: 'user-123' },
            socket: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            set: jest.fn()
        };

        next = jest.fn();
    });

    describe('enforcePaymentRateLimit', () => {
        it('should allow request if limits not exceeded', async () => {
            await enforcePaymentRateLimit(req, res, next);
            expect(next).toHaveBeenCalled();
            // Should verify 3 calls (User, IP, Global)
            expect(mockConsume).toHaveBeenCalledTimes(3);
        });

        it('should block request and alert if limit exceeded', async () => {
            mockConsume.mockRejectedValue({ msBeforeNext: 5000 }); // Block for 5s

            await enforcePaymentRateLimit(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.set).toHaveBeenCalledWith('Retry-After', '5');
            expect(alertService.warning).toHaveBeenCalledWith(
                'RATE_LIMIT_EXCEEDED',
                expect.any(String),
                expect.any(Object)
            );
        });

        it('should handle missing user/ip gracefully', async () => {
            req.user = undefined;
            req.ip = undefined;
            await enforcePaymentRateLimit(req, res, next);
            expect(next).toHaveBeenCalled();
            // Verify 'anonymous' and 'unknown' usage
            expect(mockConsume).toHaveBeenCalledWith('anonymous');
            expect(mockConsume).toHaveBeenCalledWith('unknown');
        });
    });

    describe('enforceGeneralRateLimit', () => {
        it('should allow request', async () => {
            mockConsume.mockClear();
            await enforceGeneralRateLimit(req, res, next);
            expect(next).toHaveBeenCalled();
            // Should verify 1 call (IP only)
            expect(mockConsume).toHaveBeenCalledTimes(1);
        });

        it('should block request without alert', async () => {
            mockConsume.mockRejectedValue({ msBeforeNext: 60000 });

            await enforceGeneralRateLimit(req, res, next);

            expect(res.status).toHaveBeenCalledWith(429);
            // Default general limit doesn't alert critical service usually, logic confirms
            expect(alertService.warning).not.toHaveBeenCalled();
        });
    });
});
