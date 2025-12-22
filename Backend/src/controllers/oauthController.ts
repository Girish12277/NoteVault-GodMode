import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { googleAuthService, passportInstance } from '../services/googleAuthService';

/**
 * GOD-LEVEL OAUTH CONTROLLER
 * 999999999999999% Perfection Standard
 * 
 * Handles:
 * - Google OAuth2 initiation
 * - Google OAuth2 callback
 * - Account linking
 */

export const oauthController = {
    /**
     * GET /api/auth/google
     * Initiate Google OAuth flow
     */
    googleAuth: passportInstance.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    }),

    /**
     * GET /api/auth/google/callback
     * Handle Google OAuth callback
     */
    googleCallback: async (req: Request, res: Response) => {
        try {
            // Passport will populate req.user
            passportInstance.authenticate('google', { session: false }, async (err: any, user: any) => {
                if (err || !user) {
                    console.error('Google OAuth error:', err);

                    // Redirect to frontend with error
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                    return res.redirect(`${frontendUrl}/auth/error?message=google_auth_failed`);
                }

                // Process authentication and generate tokens
                const ipAddress = req.ip || req.socket.remoteAddress;
                const result = await googleAuthService.processGoogleAuth(user, ipAddress);

                if (!result.success) {
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                    return res.redirect(`${frontendUrl}/auth/error?message=token_generation_failed`);
                }

                // Redirect to frontend with tokens
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                const redirectUrl = `${frontendUrl}/auth/callback?` +
                    `token=${encodeURIComponent(result.accessToken || '')}` +
                    `&refresh=${encodeURIComponent(result.refreshToken || '')}` +
                    `&newUser=${result.isNewUser || false}`;

                return res.redirect(redirectUrl);
            })(req, res);
        } catch (error: any) {
            console.error('Google callback controller error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            return res.redirect(`${frontendUrl}/auth/error?message=server_error`);
        }
    },

    /**
     * POST /api/auth/google/link
     * Link Google account to existing user (requires authentication)
     */
    linkGoogle: async (req: AuthRequest, res: Response) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated'
                });
            }

            const { googleId, googleEmail } = req.body;

            if (!googleId || !googleEmail) {
                return res.status(400).json({
                    success: false,
                    error: 'Google ID and email are required'
                });
            }

            const result = await googleAuthService.linkGoogleAccount(
                req.user.id,
                googleId,
                googleEmail
            );

            if (!result.success) {
                return res.status(409).json({
                    success: false,
                    error: result.error
                });
            }

            return res.json({
                success: true,
                message: 'Google account linked successfully'
            });
        } catch (error: any) {
            console.error('Link Google error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to link Google account'
            });
        }
    },

    /**
     * POST /api/auth/google/unlink
     * Unlink Google account (requires authentication)
     */
    unlinkGoogle: async (req: AuthRequest, res: Response) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated'
                });
            }

            const result = await googleAuthService.unlinkGoogleAccount(req.user.id);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error
                });
            }

            return res.json({
                success: true,
                message: 'Google account unlinked successfully'
            });
        } catch (error: any) {
            console.error('Unlink Google error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to unlink Google account'
            });
        }
    }
};
