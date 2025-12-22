import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockGoogleAuthService = {
    processGoogleAuth: jest.fn() as any,
    linkGoogleAccount: jest.fn() as any,
    unlinkGoogleAccount: jest.fn() as any,
};

const mockPassport = {
    authenticate: jest.fn() as any
};

jest.mock('../../../src/services/googleAuthService', () => ({
    __esModule: true,
    googleAuthService: mockGoogleAuthService,
    passportInstance: mockPassport
}));

// Import Controller
import { oauthController } from '../../../src/controllers/oauthController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('OAuthController - Brutal Unit Tests', () => {
    let req: Partial<Request> & { user?: any, body?: any, ip?: string, socket?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    let redirectMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        redirectMock = jest.fn();

        req = {
            user: { id: 'user_123' } as any,
            body: {},
            ip: '127.0.0.1',
            socket: { remoteAddress: '127.0.0.1' } as any
        };

        res = {
            status: statusMock as any,
            json: jsonMock as any,
            redirect: redirectMock as any
        };

        process.env.FRONTEND_URL = 'https://frontend.com';
    });

    describe('linkGoogle', () => {
        it('should link Google account successfully', async () => {
            req.body = {
                googleId: 'google_123',
                googleEmail: 'user@gmail.com'
            };

            (mockGoogleAuthService.linkGoogleAccount as any).mockResolvedValue({
                success: true
            });

            await oauthController.linkGoogle(req as any, res as Response);

            expect(mockGoogleAuthService.linkGoogleAccount).toHaveBeenCalledWith(
                'user_123',
                'google_123',
                'user@gmail.com'
            );

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('linked')
            }));
        });

        it('should return 401 if not authenticated', async () => {
            req.user = undefined;
            req.body = { googleId: 'google_123', googleEmail: 'user@gmail.com' };

            await oauthController.linkGoogle(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.stringContaining('Not authenticated')
            }));
        });

        it('should return 400 if googleId missing', async () => {
            req.body = { googleEmail: 'user@gmail.com' };

            await oauthController.linkGoogle(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('required')
            }));
        });

        it('should return 400 if googleEmail missing', async () => {
            req.body = { googleId: 'google_123' };

            await oauthController.linkGoogle(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return 409 if account already linked', async () => {
            req.body = { googleId: 'google_123', googleEmail: 'user@gmail.com' };

            (mockGoogleAuthService.linkGoogleAccount as any).mockResolvedValue({
                success: false,
                error: 'Account already linked'
            });

            await oauthController.linkGoogle(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Account already linked'
            }));
        });

        it('should return 500 on service error', async () => {
            req.body = { googleId: 'google_123', googleEmail: 'user@gmail.com' };

            (mockGoogleAuthService.linkGoogleAccount as any).mockRejectedValue(new Error('DB Error'));

            await oauthController.linkGoogle(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('unlinkGoogle', () => {
        it('should unlink Google account successfully', async () => {
            (mockGoogleAuthService.unlinkGoogleAccount as any).mockResolvedValue({
                success: true
            });

            await oauthController.unlinkGoogle(req as any, res as Response);

            expect(mockGoogleAuthService.unlinkGoogleAccount).toHaveBeenCalledWith('user_123');

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('unlinked')
            }));
        });

        it('should return 401 if not authenticated', async () => {
            req.user = undefined;

            await oauthController.unlinkGoogle(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
        });

        it('should return 400 if unlinking fails', async () => {
            (mockGoogleAuthService.unlinkGoogleAccount as any).mockResolvedValue({
                success: false,
                error: 'Cannot unlink only login method'
            });

            await oauthController.unlinkGoogle(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Cannot unlink only login method'
            }));
        });

        it('should return 500 on service error', async () => {
            (mockGoogleAuthService.unlinkGoogleAccount as any).mockRejectedValue(new Error('Service down'));

            await oauthController.unlinkGoogle(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});
