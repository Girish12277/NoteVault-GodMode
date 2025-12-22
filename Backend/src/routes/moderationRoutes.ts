import { Router } from 'express';
import { authenticate, requireAdmin, requireSeller } from '../middleware/auth';
import { moderationController } from '../controllers/moderationController';

const router = Router();

/**
 * GOD-LEVEL CONTENT MODERATION ROUTES
 * Ultra-safe deletion with automatic refunds
 * 
 * Admin endpoints for content moderation
 * Seller endpoints for appeals
 */

// ============================================
// ADMIN ENDPOINTS (Protected)
// ============================================

// Safe delete note with automatic refunds
router.post(
    '/delete-note',
    authenticate,
    requireAdmin,
    moderationController.safeDeleteNote
);

// File copyright/DMCA claim
router.post(
    '/copyright-claim',
    authenticate,
    requireAdmin,
    moderationController.fileCopyrightClaim
);

// Get moderation statistics
router.get(
    '/stats',
    authenticate,
    requireAdmin,
    moderationController.getStats
);

// Get pending content reports
router.get(
    '/pending-reports',
    authenticate,
    requireAdmin,
    moderationController.getPendingReports
);

// ============================================
// SELLER ENDPOINTS (Protected)
// ============================================

// Submit appeal against moderation action
router.post(
    '/appeal',
    authenticate,
    requireSeller,
    moderationController.submitAppeal
);

export default router;
