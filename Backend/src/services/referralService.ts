import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export enum ReferralTier {
    BRONZE = 'BRONZE',
    SILVER = 'SILVER',
    GOLD = 'GOLD',
    PLATINUM = 'PLATINUM',
}

export enum ReferralRewardType {
    CASH = 'CASH',
    CREDITS = 'CREDITS',
    DISCOUNT = 'DISCOUNT',
    BONUS_CONTENT = 'BONUS_CONTENT',
}

interface ReferralConfig {
    signupReward: { referrer: number; referee: number }; // INR
    firstPurchaseReward: { referrer: number; referee: number };
    tierBonuses: Record<ReferralTier, number>; // Multiplier
}

/**
 * God-Level Referral Service
 * Complete viral growth infrastructure
 */
export class ReferralService {
    // Reward configuration
    private static config: ReferralConfig = {
        signupReward: { referrer: 50, referee: 25 }, // ₹50 for referrer, ₹25 for referee
        firstPurchaseReward: { referrer: 100, referee: 50 }, // ₹100 for referrer, ₹50 for referee
        tierBonuses: {
            BRONZE: 1.0,
            SILVER: 1.25,
            GOLD: 1.5,
            PLATINUM: 2.0,
        },
    };

    /**
     * Track referral link click
     */
    static async trackReferralClick(data: {
        referralCode: string;
        ipAddress?: string;
        userAgent?: string;
        referralSource?: string;
        landingPage?: string;
    }) {
        try {
            // Find referrer by code
            const referrer = await prisma.$queryRaw<any[]>`
        SELECT id FROM users WHERE referral_code = ${data.referralCode}
      `;

            const clickId = `CLICK_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

            await prisma.$executeRaw`
        INSERT INTO referral_clicks (
          id, referral_code, referrer_id, ip_address, user_agent, 
          referral_source, landing_page
        ) VALUES (
          ${clickId},
          ${data.referralCode},
          ${referrer[0]?.id || null},
          ${data.ipAddress || null},
          ${data.userAgent || null},
          ${data.referralSource || null},
          ${data.landingPage || null}
        )
      `;

            return { success: true, clickId };
        } catch (error: any) {
            console.error('Track click error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create referral attribution on signup
     */
    static async createReferralAttribution(data: {
        referredUserId: string;
        referralCode: string;
        ipAddress?: string;
        userAgent?: string;
    }) {
        try {
            // Find referrer
            const referrer = await prisma.$queryRaw<any[]>`
        SELECT id, referral_code FROM users WHERE referral_code = ${data.referralCode}
      `;

            if (!referrer || referrer.length === 0) {
                throw new Error('Invalid referral code');
            }

            const referrerId = referrer[0].id;

            // Check if user already has a referrer
            const existing = await prisma.$queryRaw<any[]>`
        SELECT id FROM referral_tracking WHERE referee_id = ${data.referredUserId}
      `;

            if (existing && existing.length > 0) {
                return { success: false, error: 'User already has a referrer' };
            }

            // Create attribution
            const trackingId = `REF_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

            await prisma.$executeRaw`
        INSERT INTO referral_tracking (
          id, referrer_id, referee_id, referral_code,
          ip_address, user_agent, has_signed_up
        ) VALUES (
          ${trackingId},
          ${referrerId},
          ${data.referredUserId},
          ${data.referralCode},
          ${data.ipAddress || null},
          ${data.userAgent || null},
          TRUE
        )
      `;

            // Update referred_by in users table
            await prisma.$executeRaw`
        UPDATE users SET referred_by = ${referrerId} WHERE id = ${data.referredUserId}
      `;

            // Award signup rewards
            await this.awardSignupReward(trackingId, referrerId, data.referredUserId);

            // Update click conversion
            await prisma.$executeRaw`
        UPDATE referral_clicks
        SET converted = TRUE, converted_user_id = ${data.referredUserId}, converted_at = NOW()
        WHERE referral_code = ${data.referralCode}
        AND ip_address = ${data.ipAddress || null}
        AND converted = FALSE
        ORDER BY created_at DESC
        LIMIT 1
      `;

            return { success: true, trackingId, referrerId };
        } catch (error: any) {
            console.error('Create attribution error:', error);
            throw error;
        }
    }

    /**
     * Award signup reward
     */
    private static async awardSignupReward(
        trackingId: string,
        referrerId: string,
        refereeId: string
    ) {
        const { referrer: referrerReward, referee: refereeReward } = this.config.signupReward;

        // Get referrer tier for bonus
        const stats = await prisma.$queryRaw<any[]>`
      SELECT current_tier FROM referral_statistics WHERE user_id = ${referrerId}
    `;

        const tier = (stats[0]?.current_tier as ReferralTier) || ReferralTier.BRONZE;
        const multiplier = this.config.tierBonuses[tier];

        const finalReferrerReward = referrerReward * multiplier;

        // Create reward for referrer
        await prisma.$executeRaw`
      INSERT INTO referral_rewards (
        id, referral_tracking_id, referrer_id, referee_id,
        reward_type, amount_inr, trigger_event, status
      ) VALUES (
        ${`RWD_${crypto.randomBytes(6).toString('hex').toUpperCase()}`},
        ${trackingId},
        ${referrerId},
        ${refereeId},
        'CASH'::ReferralRewardType,
        ${finalReferrerReward},
        'SIGNUP',
        'APPROVED'
      )
    `;

        // Create reward for referee
        await prisma.$executeRaw`
      INSERT INTO referral_rewards (
        id, referral_tracking_id, referrer_id, referee_id,
        reward_type, amount_inr, trigger_event, status
      ) VALUES (
        ${`RWD_${crypto.randomBytes(6).toString('hex').toUpperCase()}`},
        ${trackingId},
        ${refereeId},
        ${refereeId},
        'CASH'::ReferralRewardType,
        ${refereeReward},
        'SIGNUP',
        'APPROVED'
      )
    `;

        return { success: true };
    }

    /**
     * Track referee purchase and award rewards
     */
    static async trackRefereePurchase(data: {
        userId: string;
        purchaseAmount: number;
    }) {
        try {
            // Get referral tracking
            const tracking = await prisma.$queryRaw<any[]>`
        SELECT * FROM referral_tracking WHERE referee_id = ${data.userId} AND is_valid = TRUE
      `;

            if (!tracking || tracking.length === 0) {
                return { success: false, message: 'No referral found' };
            }

            const ref = tracking[0];
            const isFirstPurchase = !ref.has_purchased;

            // Update tracking
            await prisma.$executeRaw`
        UPDATE referral_tracking
        SET 
          has_purchased = TRUE,
          first_purchase_date = COALESCE(first_purchase_date, NOW()),
          purchase_count = purchase_count + 1,
          total_purchase_value_inr = total_purchase_value_inr + ${data.purchaseAmount},
          updated_at = NOW()
        WHERE id = ${ref.id}
      `;

            // Award first purchase reward
            if (isFirstPurchase) {
                await this.awardFirstPurchaseReward(ref.id, ref.referrer_id, data.userId);
            }

            return { success: true, isFirstPurchase };
        } catch (error: any) {
            console.error('Track purchase error:', error);
            throw error;
        }
    }

    /**
     * Award first purchase reward
     */
    private static async awardFirstPurchaseReward(
        trackingId: string,
        referrerId: string,
        refereeId: string
    ) {
        const { referrer: referrerReward, referee: refereeReward } = this.config.firstPurchaseReward;

        // Get referrer tier
        const stats = await prisma.$queryRaw<any[]>`
      SELECT current_tier FROM referral_statistics WHERE user_id = ${referrerId}
    `;

        const tier = (stats[0]?.current_tier as ReferralTier) || ReferralTier.BRONZE;
        const multiplier = this.config.tierBonuses[tier];
        const finalReferrerReward = referrerReward * multiplier;

        // Referrer reward
        await prisma.$executeRaw`
      INSERT INTO referral_rewards (
        id, referral_tracking_id, referrer_id, referee_id,
        reward_type, amount_inr, trigger_event, status
      ) VALUES (
        ${`RWD_${crypto.randomBytes(6).toString('hex').toUpperCase()}`},
        ${trackingId},
        ${referrerId},
        ${refereeId},
        'CASH'::ReferralRewardType,
        ${finalReferrerReward},
        'FIRST_PURCHASE',
        'APPROVED'
      )
    `;

        // Referee reward
        await prisma.$executeRaw`
      INSERT INTO referral_rewards (
        id, referral_tracking_id, referrer_id, referee_id,
        reward_type, amount_inr, trigger_event, status
      ) VALUES (
        ${`RWD_${crypto.randomBytes(6).toString('hex').toUpperCase()}`},
        ${trackingId},
        ${refereeId},
        ${refereeId},
        'CASH'::ReferralRewardType,
        ${refereeReward},
        'FIRST_PURCHASE',
        'APPROVED'
      )
    `;

        return { success: true };
    }

    /**
     * Get user referral statistics
     */
    static async getUserReferralStats(userId: string) {
        const stats = await prisma.$queryRaw<any[]>`
      SELECT * FROM referral_statistics WHERE user_id = ${userId}
    `;

        if (!stats || stats.length === 0) {
            // Initialize if not exists
            await prisma.$executeRaw`
        INSERT INTO referral_statistics (id, user_id)
        VALUES (${crypto.randomBytes(8).toString('hex')}, ${userId})
        ON CONFLICT (user_id) DO NOTHING
      `;

            return {
                total_referrals: 0,
                purchase_referrals: 0,
                total_rewards_earned_inr: 0,
                current_tier: ReferralTier.BRONZE,
            };
        }

        return stats[0];
    }

    /**
     * Get user referrals list
     */
    static async getUserReferrals(userId: string) {
        return await prisma.$queryRaw<any[]>`
      SELECT 
        rt.*,
        u.full_name as referee_name,
        u.email as referee_email,
        u.created_at as signup_date
      FROM referral_tracking rt
      LEFT JOIN users u ON u.id = rt.referee_id
      WHERE rt.referrer_id = ${userId}
      ORDER BY rt.created_at DESC
    `;
    }

    /**
     * Get pending rewards for user
     */
    static async getPendingRewards(userId: string) {
        return await prisma.$queryRaw<any[]>`
      SELECT * FROM referral_rewards
      WHERE referrer_id = ${userId}
      AND status = 'APPROVED'
      ORDER BY created_at DESC
    `;
    }

    /**
     * Get leaderboard
     */
    static async getLeaderboard(limit: number = 10) {
        return await prisma.$queryRaw<any[]>`
      SELECT 
        rs.*,
        u.full_name,
        u.email
      FROM referral_statistics rs
      LEFT JOIN users u ON u.id = rs.user_id
      ORDER BY rs.purchase_referrals DESC, rs.total_referee_revenue_inr DESC
      LIMIT ${limit}
    `;
    }
}
