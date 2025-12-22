import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import rateLimit from 'express-rate-limit';

// Mock express-rate-limit before import
jest.mock('express-rate-limit', () => {
    return jest.fn((options: any) => {
        const middleware = (req: any, res: any, next: any) => next();
        (middleware as any).options = options; // Attach options for verification
        return middleware;
    });
});

import {
    authLimiter,
    apiLimiter,
    searchLimiter,
    uploadLimiter,
    passwordResetLimiter,
    adminNotificationLimiter,
    broadcastLimiter
} from '../../../src/middleware/rateLimiter';

describe('RateLimiter Configuration - Brutal Unit Tests', () => {
    it('should configure authLimiter correctly', () => {
        expect(rateLimit).toHaveBeenCalled();
        const options = (authLimiter as any).options;
        expect(options.windowMs).toBe(15 * 60 * 1000); // 15 mins
        expect(options.max).toBe(5);
        expect(options.message.code).toBe('RATE_LIMIT_AUTH');
    });

    it('should configure apiLimiter correctly', () => {
        const options = (apiLimiter as any).options;
        expect(options.windowMs).toBe(60 * 1000); // 1 min
        expect(options.max).toBe(60);
    });

    it('should configure searchLimiter correctly', () => {
        const options = (searchLimiter as any).options;
        expect(options.windowMs).toBe(60 * 1000);
        expect(options.max).toBe(30);
    });

    it('should configure uploadLimiter correctly', () => {
        const options = (uploadLimiter as any).options;
        expect(options.windowMs).toBe(60 * 60 * 1000);
        expect(options.max).toBe(200);
    });

    it('should configure adminNotificationLimiter correctly', () => {
        const options = (adminNotificationLimiter as any).options;
        expect(options.windowMs).toBe(60 * 1000);
        expect(options.max).toBe(10);
    });

    it('should configure broadcastLimiter correctly', () => {
        const options = (broadcastLimiter as any).options;
        expect(options.windowMs).toBe(5 * 60 * 1000);
        expect(options.max).toBe(1);
    });
});
