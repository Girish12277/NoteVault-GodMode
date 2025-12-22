import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 * 5 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // STRICT: 5 attempts per window
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 15 minutes.',
        code: 'RATE_LIMIT_AUTH'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    skip: () => process.env.NODE_ENV === 'test' // Disable in test environment
});

/**
 * General API rate limiter
 * 60 requests per minute per IP
 */
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // STRICT: 1 req/sec average
    message: {
        success: false,
        message: 'Too many requests. Please slow down.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test' // Disable in test environment
});

/**
 * Search endpoint rate limiter
 * 30 searches per minute
 */
export const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        success: false,
        message: 'Too many search requests. Please wait.',
        code: 'RATE_LIMIT_SEARCH'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * File upload rate limiter
 * 10 uploads per hour for sellers
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 200, // Increased from 10 to 200 to allow multiple notes/previews upload
    message: {
        success: false,
        message: 'Upload limit reached. Try again later.',
        code: 'RATE_LIMIT_UPLOAD'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Password reset rate limiter
 * 3 attempts per hour
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        success: false,
        message: 'Too many password reset attempts. Try again later.',
        code: 'RATE_LIMIT_PASSWORD_RESET'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Admin notification rate limiter
 * 10 requests per minute per admin user
 * Prevents notification spam abuse
 */
export const adminNotificationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: {
        success: false,
        message: 'Notification rate limit exceeded. Wait 60 seconds.',
        code: 'RATE_LIMIT_ADMIN_NOTIFICATION'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use user ID when available, otherwise fall back to default (IP-based)
    keyGenerator: (req: any) => req.user?.id || 'anonymous',
    validate: { xForwardedForHeader: false }  // Disable IPv6 validation
});

/**
 * Broadcast rate limiter (stricter)
 * 1 broadcast per 5 minutes per admin
 * Prevents mass notification abuse
 */
export const broadcastLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 1,
    message: {
        success: false,
        message: 'Broadcast cooldown active. Wait 5 minutes between broadcasts.',
        code: 'RATE_LIMIT_BROADCAST'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use user ID when available, otherwise fall back to default (IP-based)
    keyGenerator: (req: any) => req.user?.id || 'anonymous',
    validate: { xForwardedForHeader: false }  // Disable IPv6 validation
});
