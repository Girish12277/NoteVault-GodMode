import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import crypto from 'crypto';

// 1. Mock dependencies
const mockExecuteRaw = jest.fn<(...args: any[]) => Promise<any>>();
const mockQueryRaw = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => ({
        $executeRaw: mockExecuteRaw,
        $queryRaw: mockQueryRaw,
    })),
    // Mock Enums as simple objects if used by value in code (TS enums disappear at runtime)
    // But since we mock the module, we might lose Enums if strict.
    // However, source uses enums as values. We generally don't mock Enums unless we export them.
    // If the service imports Enums from the file itself (exported), we are fine.
}));

import { ReferralService, ReferralTier } from '../../../src/services/referralService';

describe('Referral Service Brutal Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('trackReferralClick', () => {
        it('should log a click successfully', async () => {
            // Find referrer
            mockQueryRaw.mockResolvedValueOnce([{ id: 'referrer_1' }]);
            // Insert click
            mockExecuteRaw.mockResolvedValue(1);

            const result = await ReferralService.trackReferralClick({
                referralCode: 'REF123',
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla'
            });

            expect(result.success).toBe(true);
            expect(result.clickId).toBeDefined();
            expect(mockQueryRaw).toHaveBeenCalledTimes(1);
            expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
        });

        it('should handle invalid referrer gracefully (null referrer_id)', async () => {
            mockQueryRaw.mockResolvedValueOnce([]); // No referrer
            mockExecuteRaw.mockResolvedValue(1);

            const result = await ReferralService.trackReferralClick({
                referralCode: 'INVALID'
            });

            expect(result.success).toBe(true); // Still logs click
            expect(mockQueryRaw).toHaveBeenCalled();
        });
    });

    describe('createReferralAttribution (Signup)', () => {
        const data = {
            referredUserId: 'user_new',
            referralCode: 'REF123',
            ipAddress: '127.0.0.1'
        };

        it('should create attribution and award signup rewards', async () => {
            // 1. Referrer check
            mockQueryRaw.mockResolvedValueOnce([{ id: 'ref_1', referral_code: 'REF123' }]);

            // 2. Existing attribution check -> None
            mockQueryRaw.mockResolvedValueOnce([]);

            // 3. Create attribution (INSERT)
            mockExecuteRaw.mockResolvedValueOnce(1);

            // 4. Update User (referred_by)
            mockExecuteRaw.mockResolvedValueOnce(1);

            // Award Rewards:
            // 5. Get Referrer Stats (for Tier)
            mockQueryRaw.mockResolvedValueOnce([{ current_tier: 'GOLD' }]);

            // 6. Insert Reward Referrer
            mockExecuteRaw.mockResolvedValueOnce(1);
            // 7. Insert Reward Referee
            mockExecuteRaw.mockResolvedValueOnce(1);

            // 8. Update Click Conversion
            mockExecuteRaw.mockResolvedValueOnce(1);

            const result = await ReferralService.createReferralAttribution(data);

            expect(result.success).toBe(true);
            expect(mockExecuteRaw).toHaveBeenCalledTimes(5); // 3 inserts + 1 update + 1 click update
        });

        it('should fail if referral code invalid', async () => {
            mockQueryRaw.mockResolvedValueOnce([]); // Not found

            await expect(ReferralService.createReferralAttribution(data))
                .rejects.toThrow('Invalid referral code');
        });

        it('should fail if user already has referrer', async () => {
            mockQueryRaw.mockResolvedValueOnce([{ id: 'ref_1' }]); // Found
            mockQueryRaw.mockResolvedValueOnce([{ id: 'existing_tracking' }]); // Existing

            const result = await ReferralService.createReferralAttribution(data);
            expect(result.success).toBe(false);
            expect(result.error).toContain('already has a referrer');
        });
    });

    describe('trackRefereePurchase (First Purchase)', () => {
        const purchaseData = { userId: 'user_new', purchaseAmount: 500 };

        it('should award rewards on FIRST purchase', async () => {
            // 1. Get Tracking
            mockQueryRaw.mockResolvedValueOnce([{
                id: 'tracking_1',
                referee_id: 'user_new',
                referrer_id: 'ref_1',
                has_purchased: false // FIRST TIME
            }]);

            // 2. Update tracking stats (has_purchased=TRUE)
            mockExecuteRaw.mockResolvedValueOnce(1);

            // Award Rewards:
            // 3. Get Referrer Stats
            mockQueryRaw.mockResolvedValueOnce([{ current_tier: 'SILVER' }]);

            // 4. Reward Referrer
            mockExecuteRaw.mockResolvedValueOnce(1);
            // 5. Reward Referee
            mockExecuteRaw.mockResolvedValueOnce(1);

            const result = await ReferralService.trackRefereePurchase(purchaseData);

            expect(result.success).toBe(true);
            expect(result.isFirstPurchase).toBe(true);
            expect(mockExecuteRaw).toHaveBeenCalledTimes(3);
        });

        it('should update stats but NOT award on subsequent purchase', async () => {
            // 1. Get Tracking
            mockQueryRaw.mockResolvedValueOnce([{
                id: 'tracking_1',
                has_purchased: true // ALREADY PURCHASED
            }]);

            // 2. Update tracking stats
            mockExecuteRaw.mockResolvedValueOnce(1);

            const result = await ReferralService.trackRefereePurchase(purchaseData);

            expect(result.success).toBe(true);
            expect(result.isFirstPurchase).toBe(false);
            expect(mockExecuteRaw).toHaveBeenCalledTimes(1); // No reward calls
        });
    });

    describe('getLeaderboard', () => {
        it('should fetch leaderboard with limit', async () => {
            mockQueryRaw.mockResolvedValueOnce([{ user_id: 'u1', total_referrals: 10 }]);

            const result = await ReferralService.getLeaderboard(5);

            expect(result).toHaveLength(1);
            expect(mockQueryRaw).toHaveBeenCalled();
            // Verify LIMIT clause if possible, or just call
        });
    });
});
