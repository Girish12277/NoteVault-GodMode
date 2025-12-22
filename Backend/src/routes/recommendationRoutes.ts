/**
 * RECOMMENDATION ROUTES
 * 
 * API endpoints for FREE recommendation system
 */

import { Router } from 'express';
import { recommendationController } from '../controllers/recommendationController';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * GET /api/recommendations
 * Get personalized recommendations for the authenticated user
 * 
 * Query params:
 * - limit (optional): Number of recommendations (default: 20)
 * 
 * Response: { success: true, data: Note[], count: number }
 */
router.get(
    '/',
    authenticate,
    apiLimiter,
    recommendationController.getPersonalized
);

/**
 * GET /api/recommendations/similar/:noteId
 * Get similar notes (item-to-item recommendations)
 * 
 * Params:
 * - noteId: ID of the source note
 * 
 * Query params:
 * - limit (optional): Number of recommendations (default: 10)
 * 
 * Response: { success: true, data: Note[], count: number }
 */
router.get(
    '/similar/:noteId',
    apiLimiter,
    recommendationController.getSimilar
);

/**
 * GET /api/recommendations/popular
 * Get trending/popular notes
 * 
 * Query params:
 * - category (optional): Filter by degree/category
 * - limit (optional): Number of notes (default: 20)
 * 
 * Response: { success: true, data: Note[], count: number }
 */
router.get(
    '/popular',
    apiLimiter,
    recommendationController.getPopular
);

/**
 * GET /api/recommendations/latest
 * Get recently added notes
 * 
 * Query params:
 * - category (optional): Filter by degree/category
 * - limit (optional): Number of notes (default: 20)
 * 
 * Response: { success: true, data: Note[], count: number }
 */
router.get(
    '/latest',
    apiLimiter,
    recommendationController.getLatest
);

export default router;
