/**
 * Correlation ID Middleware (Enhancement #10)
 * God-Tier: Distributed request tracing
 * 
 * Features:
 * - Generates unique correlation ID for each request
 * - Accepts existing correlation ID from headers
 * - Attaches correlation ID to request object
 * - Adds correlation ID to response headers
 * - Enables end-to-end request tracking across microservices
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger, log } from '../services/logger';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
        }
    }
}

/**
 * Correlation ID Middleware
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
    // Check for existing correlation ID from upstream service
    const existingId = req.headers['x-correlation-id'] as string ||
        req.headers['x-request-id'] as string;

    // Generate new correlation ID if not present
    const correlationId = existingId || `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Attach to request
    req.correlationId = correlationId;

    // Add to response headers (for downstream services)
    res.setHeader('X-Correlation-ID', correlationId);

    // Log request start
    const startTime = Date.now();

    // Log request completion
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        log.request(
            req.method,
            req.originalUrl || req.url,
            correlationId,
            res.statusCode,
            duration
        );
    });

    next();
}

/**
 * Request logging middleware (detailed)
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Log request details
    logger.info('Incoming Request', {
        correlationId: req.correlationId,
        method: req.method,
        url: req.originalUrl || req.url,
        query: req.query,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });

    // Log response
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('Request Completed', {
            correlationId: req.correlationId,
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    });

    next();
}

/**
 * Error logging middleware
 */
export function errorLoggingMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
    logger.error('Request Error', {
        correlationId: req.correlationId,
        method: req.method,
        url: req.originalUrl || req.url,
        error: err.message,
        stack: err.stack
    });

    next(err);
}
