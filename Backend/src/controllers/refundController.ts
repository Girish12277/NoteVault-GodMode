import { Request, Response } from 'express';
import { RefundService, RefundStatus, RefundReason } from '../services/refundService';
import { z } from 'zod';

// Validation schemas
const initiateRefundSchema = z.object({
    transactionId: z.string().min(1, 'Transaction ID required'),
    reason: z.enum([
        'FILE_CORRUPTION',
        'NOT_AS_DESCRIBED',
        'QUALITY_ISSUES',
        'ACCIDENTAL_PURCHASE',
        'DUPLICATE_PURCHASE',
        'TECHNICAL_ISSUES',
        'OTHER',
    ]),
    reasonDetails: z.string().max(500).optional(),
});

const adminActionSchema = z.object({
    adminNotes: z.string().max(1000).optional(),
});

/**
 * God-Level Refund Controller
 * Zero-error request handling with complete validation
 */
export class RefundController {
    /**
     * User initiates refund request
     * POST /api/refunds/initiate
     */
    static async initiateRefund(req: Request, res: Response) {
        try {
            // Validate request body
            const validationResult = initiateRefundSchema.safeParse(req.body);

            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: validationResult.error.issues,
                });
            }

            const { transactionId, reason, reasonDetails } = validationResult.data;
            const userId = (req as any).user.id; // From auth middleware

            // Get IP and User-Agent
            const ipAddress = req.ip || req.socket.remoteAddress || undefined;
            const userAgent = req.get('user-agent');

            // Initiate refund
            const result = await RefundService.initiateRefund({
                userId,
                transactionId,
                reason: reason as RefundReason,
                reasonDetails,
                ipAddress,
                userAgent,
            });

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Refund initiation error:', error);

            return res.status(400).json({
                success: false,
                error: error.message || 'Failed to initiate refund',
            });
        }
    }

    /**
     * Get user's refund history
     * GET /api/refunds/myrefunds
     */
    static async getMyRefunds(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            const refunds = await RefundService.getUserRefunds(userId);

            return res.status(200).json({
                success: true,
                data: refunds,
            });
        } catch (error: any) {
            console.error('Get refunds error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to fetch refunds',
            });
        }
    }

    /**
     * Get single refund details
     * GET /api/refunds/:refundId
     */
    static async getRefund(req: Request, res: Response) {
        try {
            const { refundId } = req.params;
            const userId = (req as any).user.id;
            const isAdmin = (req as any).user.is_admin;

            const refund = await RefundService.getRefund(refundId);

            if (!refund) {
                return res.status(404).json({
                    success: false,
                    error: 'Refund not found',
                });
            }

            // Verify authorization (user can only see their own refunds unless admin)
            if (!isAdmin && refund.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access',
                });
            }

            return res.status(200).json({
                success: true,
                data: refund,
            });
        } catch (error: any) {
            console.error('Get refund error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to fetch refund',
            });
        }
    }

    /**
     * ADMIN: Get all pending refunds
     * GET /api/refunds/admin/pending
     */
    static async getPendingRefunds(req: Request, res: Response) {
        try {
            const isAdmin = (req as any).user.is_admin;

            if (!isAdmin) {
                return res.status(403).json({
                    success: false,
                    error: 'Admin access required',
                });
            }

            const refunds = await RefundService.getPendingRefunds();

            return res.status(200).json({
                success: true,
                data: refunds,
            });
        } catch (error: any) {
            console.error('Get pending refunds error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to fetch pending refunds',
            });
        }
    }

    /**
     * ADMIN: Approve refund
     * POST /api/refunds/admin/:refundId/approve
     */
    static async approveRefund(req: Request, res: Response) {
        try {
            const isAdmin = (req as any).user.is_admin;

            if (!isAdmin) {
                return res.status(403).json({
                    success: false,
                    error: 'Admin access required',
                });
            }

            const { refundId } = req.params;
            const adminId = (req as any).user.id;

            // Validate admin notes
            const validationResult = adminActionSchema.safeParse(req.body);

            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: validationResult.error.issues,
                });
            }

            const { adminNotes } = validationResult.data;

            // Approve and process refund
            const result = await RefundService.approveRefund({
                refundId,
                adminId,
                adminNotes,
            });

            return res.status(200).json({
                success: true,
                data: result,
                message: 'Refund approved and processed successfully',
            });
        } catch (error: any) {
            console.error('Approve refund error:', error);

            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to approve refund',
            });
        }
    }

    /**
     * ADMIN: Reject refund
     * POST /api/refunds/admin/:refundId/reject
     */
    static async rejectRefund(req: Request, res: Response) {
        try {
            const isAdmin = (req as any).user.is_admin;

            if (!isAdmin) {
                return res.status(403).json({
                    success: false,
                    error: 'Admin access required',
                });
            }

            const { refundId } = req.params;
            const adminId = (req as any).user.id;

            // Validate admin notes
            const validationResult = adminActionSchema.safeParse(req.body);

            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: validationResult.error.issues,
                });
            }

            const { adminNotes } = validationResult.data;

            // Reject refund
            const result = await RefundService.rejectRefund(refundId, adminId, adminNotes);

            return res.status(200).json({
                success: true,
                data: result,
                message: 'Refund rejected',
            });
        } catch (error: any) {
            console.error('Reject refund error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to reject refund',
            });
        }
    }

    /**
     * Get refund statistics
     * GET /api/refunds/stats
     */
    static async getRefundStats(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const isAdmin = (req as any).user.is_admin;

            // Users can see their own stats, admins can see all
            // Implementation depends on requirements

            return res.status(200).json({
                success: true,
                data: {
                    // Placeholder - implement as needed
                    message: 'Stats endpoint - implement based on requirements',
                },
            });
        } catch (error: any) {
            console.error('Get stats error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to fetch statistics',
            });
        }
    }
}
