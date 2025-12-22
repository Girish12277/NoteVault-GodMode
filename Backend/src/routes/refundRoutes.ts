import express from 'express';
import { RefundController } from '../controllers/refundController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * God-Level Refund Routes
 * All routes protected with authentication + global API limiter
 */

// User Refund Routes
router.post(
    '/initiate',
    authenticate,
    RefundController.initiateRefund
);

router.get(
    '/my-refunds',
    authenticate,
    RefundController.getMyRefunds
);

router.get(
    '/:refundId',
    authenticate,
    RefundController.getRefund
);

router.get(
    '/stats',
    authenticate,
    RefundController.getRefundStats
);

// Admin Refund Routes
router.get(
    '/admin/pending',
    authenticate,
    RefundController.getPendingRefunds
);

router.post(
    '/admin/:refundId/approve',
    authenticate,
    RefundController.approveRefund
);

router.post(
    '/admin/:refundId/reject',
    authenticate,
    RefundController.rejectRefund
);

export default router;
