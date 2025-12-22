import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockReferralService = {
    trackReferralClick: jest.fn() as any,
    getUserReferralStats: jest.fn() as any,
    getUserReferrals: jest.fn() as any,
    getPendingRewards: jest.fn() as any,
    getLeaderboard: jest.fn() as any,
};

jest.mock('../../../src/services/referralService', () => ({
    __esModule: true,
    ReferralService: mockReferralService
}));

// Import Controller
import { ReferralController } from '../../../src/controllers/referralController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Referral Controller - Brutal Unit Tests', () => {
    let req: Partial<Request> & { user?: any, params?: any, query?: any, ip?: string };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = {
            method: 'POST',
            body: {},
            params: {},
            query: {},
            ip: '127.0.0.1',
            user: {
                id: 'user_1',
                email: 'user@test.com'
            } as any,
            get: jest.fn().mockReturnValue('Mozilla/5.0') as any
        };

        res = {
            status: statusMock as any,
            json: jsonMock as any,
        };
    });

    // ------------------------------------------------------------------
    // TRACK CLICK
    // ------------------------------------------------------------------
    describe('trackClick', () => {
        it('should return 400 if referralCode is missing', async () => {
            req.body = {}; // Missing referralCode

            await ReferralController.trackClick(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Invalid request data'
            }));
        });

        it('should track referral click successfully with valid code', async () => {
            req.body = {
                referralCode: 'REF123',
                referralSource: 'facebook',
                landingPage: '/home'
            };

            mockReferralService.trackReferralClick.mockResolvedValue({
                success: true,
                clickId: 'click_1'
            });

            await ReferralController.trackClick(req as Request, res as Response);

            expect(mockReferralService.trackReferralClick).toHaveBeenCalledWith(
                expect.objectContaining({
                    referralCode: 'REF123',
                    referralSource: 'facebook',
                    landingPage: '/home',
                    ipAddress: expect.any(String),
                    userAgent: expect.any(String)
                })
            );
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('should handle service errors (500)', async () => {
            req.body = { referralCode: 'REF_ERROR' };

            mockReferralService.trackReferralClick.mockRejectedValue(new Error('DB Error'));

            await ReferralController.trackClick(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    // ------------------------------------------------------------------
    // GET MY STATS
    // ------------------------------------------------------------------
    describe('getMyStats', () => {
        it('should fetch user referral statistics', async () => {
            req.user!.id = 'user_ref';

            mockReferralService.getUserReferralStats.mockResolvedValue({
                totalReferrals: 10,
                totalEarnings: 500,
                pendingRewards: 100
            });

            await ReferralController.getMyStats(req as Request, res as Response);

            expect(mockReferralService.getUserReferralStats).toHaveBeenCalledWith('user_ref');
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ totalReferrals: 10 })
            }));
        });

        it('should handle stats fetch errors', async () => {
            mockReferralService.getUserReferralStats.mockRejectedValue(new Error('Stats Error'));

            await ReferralController.getMyStats(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    // ------------------------------------------------------------------
    // GET MY REFERRALS
    // ------------------------------------------------------------------
    describe('getMyReferrals', () => {
        it('should fetch user referrals list', async () => {
            req.user!.id = 'user_ref';

            mockReferralService.getUserReferrals.mockResolvedValue([
                { id: 'ref_1', referredUserId: 'user_2', status: 'COMPLETED' },
                { id: 'ref_2', referredUserId: 'user_3', status: 'PENDING' }
            ]);

            await ReferralController.getMyReferrals(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({ status: 'COMPLETED' })
                ])
            }));
        });
    });

    // ------------------------------------------------------------------
    // GET MY REWARDS
    // ------------------------------------------------------------------
    describe('getMyRewards', () => {
        it('should fetch pending rewards', async () => {
            req.user!.id = 'user_ref';

            mockReferralService.getPendingRewards.mockResolvedValue({
                pendingAmount: 250,
                claimableRewards: [
                    { id: 'reward_1', amount: 100 },
                    { id: 'reward_2', amount: 150 }
                ]
            });

            await ReferralController.getMyRewards(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ pendingAmount: 250 })
            }));
        });
    });

    // ------------------------------------------------------------------
    // LEADERBOARD
    // ------------------------------------------------------------------
    describe('getLeaderboard', () => {
        it('should fetch leaderboard with default limit (10)', async () => {
            req.query = {};

            mockReferralService.getLeaderboard.mockResolvedValue([
                { userId: 'user_1', referralCount: 100 },
                { userId: 'user_2', referralCount: 50 }
            ]);

            await ReferralController.getLeaderboard(req as Request, res as Response);

            expect(mockReferralService.getLeaderboard).toHaveBeenCalledWith(10);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ referralCount: 100 })
                ])
            }));
        });

        it('should cap leaderboard limit at 50', async () => {
            req.query = { limit: '1000' }; // Excessive request

            mockReferralService.getLeaderboard.mockResolvedValue([]);

            await ReferralController.getLeaderboard(req as Request, res as Response);

            expect(mockReferralService.getLeaderboard).toHaveBeenCalledWith(50); // Capped
        });

        it('should handle custom limit within range', async () => {
            req.query = { limit: '25' };

            mockReferralService.getLeaderboard.mockResolvedValue([]);

            await ReferralController.getLeaderboard(req as Request, res as Response);

            expect(mockReferralService.getLeaderboard).toHaveBeenCalledWith(25);
        });
    });

    // ------------------------------------------------------------------
    // VALIDATE CODE
    // ------------------------------------------------------------------
    describe('validateCode', () => {
        it('should return 404 for invalid referral code', async () => {
            req.params = { code: 'INVALID_CODE' };

            mockReferralService.trackReferralClick.mockResolvedValue({
                success: false
            });

            await ReferralController.validateCode(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid referral code'
            }));
        });

        it('should return 200 for valid referral code', async () => {
            req.params = { code: 'VALID_CODE' };

            mockReferralService.trackReferralClick.mockResolvedValue({
                success: true
            });

            await ReferralController.validateCode(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                valid: true
            }));
        });

        it('should handle validation errors (404)', async () => {
            req.params = { code: 'ERROR_CODE' };

            mockReferralService.trackReferralClick.mockRejectedValue(new Error('Service Error'));

            await ReferralController.validateCode(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });
    });
});
