import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { prisma } from './config/database';
import { validateEnv, config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

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
            connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
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
}

// Setup Swagger documentation
setupSwagger(app);

// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: 'connected'
    });
});

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
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/cart', cartRouter);
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
