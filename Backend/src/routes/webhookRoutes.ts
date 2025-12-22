import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';

const router = Router();

/**
 * Webhook Routes (Enhancement #5)
 * 
 * SECURITY NOTE: Webhook endpoints should NOT require authentication
 * (They are called by external services like Razorpay)
 * Security is enforced via signature verification
 */

// POST /api/webhooks/razorpay - Handle Razorpay payment notifications
router.post('/razorpay', webhookController.handleRazorpay);

export default router;
