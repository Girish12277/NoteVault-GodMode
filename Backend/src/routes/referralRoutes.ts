import express from 'express';
import { ReferralController } from '../controllers/referralController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * God-Level Referral Routes
 * Viral growth API endpoints
 */

// Public routes
router.post(
    '/track-click',
    ReferralController.trackClick
);

router.get(
    '/validate/:code',
    ReferralController.validateCode
);

router.get(
    '/leaderboard',
    ReferralController.getLeaderboard
);

// Protected user routes
router.get(
    '/my-stats',
    authenticate,
    ReferralController.getMyStats
);

router.get(
    '/my-referrals',
    authenticate,
    ReferralController.getMyReferrals
);

router.get(
    '/my-rewards',
    authenticate,
    ReferralController.getMyRewards
);

export default router;
