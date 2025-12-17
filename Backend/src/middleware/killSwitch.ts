import { Request, Response, NextFunction } from 'express';

/**
 * EMERGENCY KILL SWITCH
 * 
 * Disables download endpoints during security hardening.
 * Remove this middleware after implementing signed URLs.
 */
export const downloadKillSwitch = (req: Request, res: Response, next: NextFunction) => {
    const downloadsEnabled = process.env.ENABLE_DOWNLOADS === 'true';
    const signedUrlsEnabled = process.env.SIGNED_URLS_ENABLED === 'true';
    if (downloadsEnabled && signedUrlsEnabled) {
        return next();
    }
    return res.status(503).json({
        success: false,
        code: 'MAINTENANCE',
        message: 'Downloads temporarily disabled for security hardening. Estimated restoration: 72 hours.'
    });
};

/**
 * Feature flags for gradual rollout
 */
export const featureFlags = {
    downloadsEnabled: process.env.ENABLE_DOWNLOADS === 'true',
    signedUrlsEnabled: process.env.SIGNED_URLS_ENABLED === 'true',
    watermarkingEnabled: process.env.WATERMARKING_ENABLED === 'true'
};
