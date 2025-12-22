import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { whatsappController } from '../controllers/whatsappController';

const router = Router();

/**
 * GOD-LEVEL WHATSAPP ROUTES
 * Admin and webhook endpoints
 */

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================

// Get WhatsApp statistics
router.get('/stats', authenticate, requireAdmin, whatsappController.getStats);

// Send test message
router.post('/test', authenticate, requireAdmin, whatsappController.sendTestMessage);

// Get message logs
router.get('/messages', authenticate, requireAdmin, whatsappController.getMessages);

// ==========================================
// WEBHOOK ROUTES (Public - Twilio callback)
// ==========================================

// Twilio status webhook
router.post('/webhook', whatsappController.handleWebhook);

export default router;
