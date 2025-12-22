/**
 * God-Level Enhancement #19: Comprehensive Multi-Layer Rate Limiting
 * 
 * Byzantine Fault Tolerance: 3-layer DOS protection
 * Prevents: System-wide DOS attacks, user abuse, IP-based attacks
 * Pattern: Per-user + Per-IP + Global rate limiting with Redis
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { AuthRequest } from './auth';
import { alertService } from '../services/alertService';
import { logger } from '../services/logger';

// Initialize rate limiters (will use memory fallback if Redis unavailable)
let paymentRateLimiter: any;
let ipRateLimiter: any;
let globalPaymentLimiter: any;

(async () => {
    try {
        if (!process.env.REDIS_URL) {
            logger.info('ℹ️  Rate Limiting: Memory Fallback (Redis not configured)');
            useFallbackRateLimiters();
            return;
        }

        // Attempt Redis-based rate limiting (production)
        const redis = require('redis').createClient({
            url: process.env.REDIS_URL,
            socket: {
                connectTimeout: 5000
            }
        });

        await redis.connect();
        logger.info('Redis connected for rate limiting');

        // Layer 1: Per-User Payment Limit (prevents user abuse)
        paymentRateLimiter = new RateLimiterRedis({
            storeClient: redis,
            keyPrefix: 'rl:payment:user',
            points: 10,        // 10 payment attempts
            duration: 60,      // per minute
            blockDuration: 300 // Block for 5 minutes
        });

        // Layer 2: Per-IP Limit (prevents IP-based attacks)
        ipRateLimiter = new RateLimiterRedis({
            storeClient: redis,
            keyPrefix: 'rl:ip',
            points: 100,       // 100 requests
            duration: 60,      // per minute
            blockDuration: 600 // Block for 10 minutes
        });

        // Layer 3: Global Failsafe (prevents system-wide DOS)
        globalPaymentLimiter = new RateLimiterRedis({
            storeClient: redis,
            keyPrefix: 'rl:global:payment',
            points: 5000,      // 5K total payments
            duration: 1,       // per second
            blockDuration: 10
        });


    } catch (error: any) {
        logger.info('Redis not available for rate limiting, using memory-based fallback', { error: error.message });
        useFallbackRateLimiters();
    }
})();

/**
 * Fallback to memory-based rate limiting if Redis unavailable
 */
function useFallbackRateLimiters() {
    paymentRateLimiter = new RateLimiterMemory({
        keyPrefix: 'rl:payment:user',
        points: 10,
        duration: 60
    });

    ipRateLimiter = new RateLimiterMemory({
        keyPrefix: 'rl:ip',
        points: 100,
        duration: 60
    });

    globalPaymentLimiter = new RateLimiterMemory({
        keyPrefix: 'rl:global:payment',
        points: 5000,
        duration: 1
    });
}

// Initialize fallback immediately if Redis variables not set
if (!paymentRateLimiter) {
    useFallbackRateLimiters();
}

/**
 * Middleware: Enforce payment rate limits (all 3 layers)
 */
export async function enforcePaymentRateLimit(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = req.user?.id || 'anonymous';
        const ip = req.ip || req.socket.remoteAddress || 'unknown';

        // Check all three layers in parallel
        await Promise.all([
            paymentRateLimiter.consume(userId),    // Layer 1: Per-user
            ipRateLimiter.consume(ip),             // Layer 2: Per-IP
            globalPaymentLimiter.consume('global') // Layer 3: Global
        ]);

        next();

    } catch (rateLimiterRes: any) {
        const retryAfter = Math.round(rateLimiterRes.msBeforeNext / 1000) || 60;

        logger.warn('Rate limit exceeded', {
            userId: req.user?.id,
            ip: req.ip,
            endpoint: req.path,
            correlationId: req.correlationId
        });

        await alertService.warning(
            'RATE_LIMIT_EXCEEDED',
            'User hit payment rate limit',
            {
                userId: req.user?.id,
                ip: req.ip,
                retryAfter,
                endpoint: req.path
            }
        );

        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({
            success: false,
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Retry after ${retryAfter} seconds.`,
            retryAfter
        });
    }
}

/**
 * Middleware: General API rate limit (lighter than payment)
 */
export async function enforceGeneralRateLimit(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';

        await ipRateLimiter.consume(ip);
        next();

    } catch (rateLimiterRes: any) {
        const retryAfter = Math.round(rateLimiterRes.msBeforeNext / 1000) || 60;

        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({
            success: false,
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Retry after ${retryAfter} seconds.`,
            retryAfter
        });
    }
}
