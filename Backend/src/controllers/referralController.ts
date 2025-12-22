import { Request, Response } from 'express';
import { ReferralService } from '../services/referralService';
import { z } from 'zod';

// Validation schemas
const trackClickSchema = z.object({
    referralCode: z.string().min(1),
    referralSource: z.string().optional(),
    landingPage: z.string().optional(),
});

/**
 * God-Level Referral Controller
 * Complete viral growth API
 */
export class ReferralController {
    /**
     * Track referral link click
     * POST /api/referrals/track-click
     */
    static async trackClick(req: Request, res: Response) {
        try {
            const validationResult = trackClickSchema.safeParse(req.body);

            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: validationResult.error.issues,
                });
            }

            const { referralCode, referralSource, landingPage } = validationResult.data;

            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.get('user-agent');

            const result = await ReferralService.trackReferralClick({
                referralCode,
                ipAddress,
                userAgent,
                referralSource,
                landingPage,
            });

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Track click error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to track click',
            });
        }
    }

    /**
     * Get user referral statistics
     * GET /api/referrals/my-stats
     */
    static async getMyStats(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            const stats = await ReferralService.getUserReferralStats(userId);

            return res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            console.error('Get stats error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to fetch statistics',
            });
        }
    }

    /**
     * Get user's referrals list
     * GET /api/referrals/my-referrals
     */
    static async getMyReferrals(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            const referrals = await ReferralService.getUserReferrals(userId);

            return res.status(200).json({
                success: true,
                data: referrals,
            });
        } catch (error: any) {
            console.error('Get referrals error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to fetch referrals',
            });
        }
    }

    /**
     * Get pending rewards
     * GET /api/referrals/my-rewards
     */
    static async getMyRewards(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            const rewards = await ReferralService.getPendingRewards(userId);

            return res.status(200).json({
                success: true,
                data: rewards,
            });
        } catch (error: any) {
            console.error('Get rewards error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to fetch rewards',
            });
        }
    }

    /**
     * Get referral leaderboard
     * GET /api/referrals/leaderboard
     */
    static async getLeaderboard(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query.limit as string) || 10;

            const leaderboard = await ReferralService.getLeaderboard(Math.min(limit, 50));

            return res.status(200).json({
                success: true,
                data: leaderboard,
            });
        } catch (error: any) {
            console.error('Get leaderboard error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to fetch leaderboard',
            });
        }
    }

    /**
     * Validate referral code
     * GET /api/referrals/validate/:code
     */
    static async validateCode(req: Request, res: Response) {
        try {
            const { code } = req.params;

            // Simple validation - check if code exists
            const result = await ReferralService.trackReferralClick({
                referralCode: code,
            });

            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    error: 'Invalid referral code',
                });
            }

            return res.status(200).json({
                success: true,
                valid: true,
            });
        } catch (error: any) {
            return res.status(404).json({
                success: false,
                error: 'Invalid referral code',
            });
        }
    }
}
