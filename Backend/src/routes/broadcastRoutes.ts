import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { broadcastController } from '../controllers/broadcastController';

const router = Router();

/**
 * GOD-LEVEL BROADCAST ROUTES
 * Admin-only endpoints for million-user campaigns
 * 
 * All routes require admin authentication
 */

// Send custom message to specific users
router.post('/send-custom', authenticate, requireAdmin, broadcastController.sendCustomMessage);

// Create bulk broadcast campaign
router.post('/create-campaign', authenticate, requireAdmin, broadcastController.createCampaign);

// List all campaigns
router.get('/campaigns', authenticate, requireAdmin, broadcastController.getCampaigns);

// Get campaign status with progress
router.get('/campaigns/:id', authenticate, requireAdmin, broadcastController.getCampaignStatus);

// Cancel campaign
router.delete('/campaigns/:id', authenticate, requireAdmin, broadcastController.cancelCampaign);

export default router;
