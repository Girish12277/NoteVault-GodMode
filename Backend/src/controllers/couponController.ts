import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CouponService } from '../services/couponService';
import { logger } from '../services/logger';

export const couponController = {
    /**
     * POST /api/coupons/validate
     */
    validate: async (req: AuthRequest, res: Response) => {
        try {
            const { code, amount, noteIds } = req.body;
            const userId = req.user!.id;

            if (!code || amount === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Code and amount are required',
                });
            }

            const result = await CouponService.validateCoupon(
                userId,
                code,
                Number(amount),
                noteIds || []
            );

            return res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            logger.error('Coupon validation error', error);
            return res.status(500).json({
                success: false,
                message: 'Coupon validation failed',
                code: 'VALIDATION_ERROR'
            });
        }
    },
};
