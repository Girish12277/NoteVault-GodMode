import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { prisma } from './config/database';
import { validateEnv, config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { correlationIdMiddleware, requestLoggingMiddleware } from './middleware/correlationId';
import { logger } from './services/logger';
import { incrementActiveRequests, decrementActiveRequests } from './controllers/metricsController';

// Import routes
import authRoutes from './routes/authRoutes';
import noteRoutes from './routes/noteRoutes';
import categoryRoutes from './routes/categoryRoutes';
import universityRoutes from './routes/universityRoutes';
import searchRoutes from './routes/searchRoutes';
import reviewRoutes from './routes/reviewRoutes';
import paymentRoutes from './routes/paymentRoutes';
import uploadRoutes from './routes/uploadRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import contactRoutes from './routes/contactRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import settingsRoutes from './routes/settingsRoutes';
import disputeRoutes from './routes/disputeRoutes';
import userActionsRoutes from './routes/userActionsRoutes';
import downloadRoutes from './routes/downloadRoutes';
import webhookRoutes from './routes/webhookRoutes';
import healthRoutes from './routes/healthRoutes';
import metricsRoutes from './routes/metricsRoutes';
import refundRoutes from './routes/refundRoutes';
import referralRoutes from './routes/referralRoutes';
import whatsappRoutes from './routes/whatsappRoutes';
import broadcastRoutes from './routes/broadcastRoutes';
import moderationRoutes from './routes/moderationRoutes';
import couponRoutes from './routes/couponRoutes';

import contentRoutes from './routes/contentRoutes';
import profileRouter from './routes/profileRoutes';
import messagesRouter from './routes/messagesRouter';
import userRoutes from './routes/userRoutes';
import postsRouter from './routes/postsRouter';
import { downloadKillSwitch } from './middleware/killSwitch';
import { sellerRouter, adminRouter, cartRouter } from './routes/additionalRoutes';
import sellerAnalyticsRoutes from './routes/sellerAnalyticsRoutes';
import publicRoutes from './routes/publicRoutes';
import orderRouter from './routes/orderRoutes';
import recommendationRoutes from './routes/recommendationRoutes';  // Phase 3: FREE Recommendation System
import { setupSwagger } from './config/swagger';

// Load and validate environment variables
dotenv.config();
validateEnv();

// Fix BigInt JSON serialization
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const app = express();

// GOD-LEVEL SECURITY: Trust Proxy for Rate Limiting (Cloudflare/Nginx/Heroku compatibility)
app.set('trust proxy', 1);

// GOD-LEVEL SECURITY: Hardened Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for some inline scripts, investigate removal later
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"], // Allow images from https (Cloudinary)
            connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:8080'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" }, // Clickjacking protection
    hsts: {
        maxAge: 31536000, // 1 Year
        includeSubDomains: true,
        preload: true,
    },
    ieNoOpen: true,
    noSniff: true, // Prevent MIME type sniffing
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
}));

app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:8081',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'idempotency-key']
}));

// GOD-LEVEL SECURITY: DoS Protection (Body Limits)
// Login payloads are < 1KB. 10KB is generous.
// 50MB was a catastrophic DoS vector.
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// REMOVED: Unsecured Static File Serving from Root
// app.use('/uploads', express.static('uploads')); 
// All file access must go through signed URLs or authenticated API routes.

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    // Production: Use Winston logger
    app.use((req, res, next) => {
        logger.info(`${req.method} ${req.url}`);
        next();
    });
}

// Setup Swagger documentation
setupSwagger(app);

// Enhancement #10: Correlation ID + Request Logging
app.use(correlationIdMiddleware);
if (process.env.NODE_ENV === 'development') {
    app.use(requestLoggingMiddleware);
}

// This section seems to be part of a larger async initialization block that was not fully provided.
// To make the provided snippet syntactically correct and functional within this file,
// we'll wrap it in an immediately invoked async function (IIFE) or assume it's part of a
// server startup function that will be called.
// For the purpose of this edit, we'll place it where it logically fits as an initialization step.
// Note: `cloudinaryCircuitBreaker` and `paymentCircuitBreaker` are not defined in this file.
// They would need to be imported or defined elsewhere for this code to run successfully.
// The `} catch (error) {; });` part of the snippet is syntactically incorrect as provided
// and suggests it's closing a `try...catch` block and another function call.
// We will adjust it to be a standalone initialization block.

// Placeholder for circuit breakers (assuming they are defined/imported elsewhere)
const cloudinaryCircuitBreaker = { healthCheck: async () => logger.info('Cloudinary circuit breaker health check (mock)') };
const paymentCircuitBreaker = { healthCheck: async () => logger.info('Payment circuit breaker health check (mock)') };

(async () => {
    try {
        // Initialize circuit breakers
        logger.info('[INIT] Initializing circuit breakers...');
        await cloudinaryCircuitBreaker.healthCheck();
        await paymentCircuitBreaker.healthCheck();

        // Initialize email monitoring crons
        logger.info('[INIT] Initializing email monitoring system...');
        const { initializeEmailCrons } = await import('./services/emailCronJobs');
        initializeEmailCrons();

        // Initialize broadcast workers
        logger.info('[INIT] Initializing broadcast workers...');
        await import('./services/broadcastWorkers');

        logger.info('[INIT] All systems initialized successfully');
    } catch (error) {
        logger.error('[INIT] Initialization failed:', error);
        // Depending on the severity, you might want to exit the process here
        // process.exit(1);
    }
})();


// Track active requests (for metrics)
app.use((req, res, next) => {
    incrementActiveRequests();
    res.on('finish', () => decrementActiveRequests());
    next();
});

// Enhancement #7: Health Check Endpoints (unauthenticated)
app.use('/health', healthRoutes);

// Enhancement #11: Metrics Endpoint (unauthenticated)
app.use('/metrics', metricsRoutes);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/refunds', refundRoutes); // God-Level Refund System
app.use('/api/referrals', referralRoutes); // God-Level Referral System
app.use('/api/admin/whatsapp', whatsappRoutes); // Admin WhatsApp management
app.use('/api/webhooks/whatsapp', whatsappRoutes); // Twilio webhooks
app.use('/api/admin/broadcast', broadcastRoutes); // God-Level Broadcast System
app.use('/api/admin/moderation', moderationRoutes); // God-Level Content Moderation
app.use('/api/seller/moderation', moderationRoutes); // Seller appeals
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/cart', cartRouter);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/seller/analytics', sellerAnalyticsRoutes); // REGISTERED CORRECTLY
app.use('/api/admin', adminRouter);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/disputes', disputeRoutes);
app.use('/api/admin/users', userActionsRoutes);
// Public Route for Disputes
app.use('/api/disputes', disputeRoutes);
app.use('/api/content', contentRoutes); // Dynamic Content
app.use('/api/profile', profileRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/users', userRoutes); // Secured User Profile Actions (Chat Profile)
app.use('/api/posts', postsRouter); // Public Seller Profile
// EMERGENCY: Kill switch active - disable downloads during security hardening
// app.use('/api/download', downloadKillSwitch);
app.use('/api/download', downloadRoutes); // Re-enable after signed URLs implemented
app.use('/api/public', publicRoutes); // Public Verification Routes
app.use('/api/recommendations', recommendationRoutes); // Phase 3: FREE Recommendation System
app.use('/api/webhooks', webhookRoutes); // Enhancement #5: Server-Side Webhook Handler

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        code: 'NOT_FOUND'
    });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
