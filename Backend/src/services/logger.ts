/**
 * God-Tier Structured Logging Service (Enhancement #9)
 * 
 * Features:
 * - Structured JSON logging for production log aggregation
 * - Multiple log levels (error, warn, info, debug)
 * - Request context tracking (correlation IDs)
 * - Separate error log file
 * - Console output for development
 * - Production-ready format for log aggregation tools (Datadog, Splunk, ELK)
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Custom format for production
const productionFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Custom format for development (more readable)
const developmentFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        const corrId = correlationId ? `[${correlationId}]` : '';
        return `${timestamp} ${level} ${corrId} ${message} ${metaStr}`;
    })
);

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create logger instance
export const logger = winston.createLogger({
    level: logLevel,
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    defaultMeta: {
        service: 'notevault-api',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Console transport
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat
        }),

        // Error log file (production only)
        ...(process.env.NODE_ENV === 'production' ? [
            new winston.transports.File({
                filename: path.join(logsDir, 'error.log'),
                level: 'error',
                maxsize: 10485760, // 10MB
                maxFiles: 5
            }),
            new winston.transports.File({
                filename: path.join(logsDir, 'combined.log'),
                maxsize: 10485760, // 10MB
                maxFiles: 5
            })
        ] : [])
    ],

    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log')
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log')
        })
    ]
});

/**
 * Log with correlation ID (for request tracing)
 */
export function logWithContext(
    level: 'error' | 'warn' | 'info' | 'debug',
    message: string,
    correlationId?: string,
    meta?: Record<string, any>
) {
    logger.log({
        level,
        message,
        correlationId,
        ...meta
    });
}

/**
 * Helper methods for common logging patterns
 */
export const log = {
    // HTTP request logging
    request: (method: string, url: string, correlationId: string, statusCode?: number, duration?: number) => {
        logger.info('HTTP Request', {
            correlationId,
            method,
            url,
            statusCode,
            duration: duration ? `${duration}ms` : undefined
        });
    },

    // Database query logging
    database: (query: string, duration: number, correlationId?: string) => {
        logger.debug('Database Query', {
            correlationId,
            query,
            duration: `${duration}ms`
        });
    },

    // External API calls
    externalApi: (service: string, endpoint: string, duration: number, success: boolean, correlationId?: string) => {
        logger.info('External API Call', {
            correlationId,
            service,
            endpoint,
            duration: `${duration}ms`,
            success
        });
    },

    // Security events
    security: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: Record<string, any>) => {
        logger.warn('Security Event', {
            securityEvent: event,
            severity,
            ...details
        });
    },

    // Performance metrics
    performance: (metric: string, value: number, unit: string, correlationId?: string) => {
        logger.info('Performance Metric', {
            correlationId,
            metric,
            value,
            unit
        });
    },

    // Business events
    business: (event: string, details: Record<string, any>, correlationId?: string) => {
        logger.info('Business Event', {
            correlationId,
            businessEvent: event,
            ...details
        });
    }
};

// Export logger as default
export default logger;
