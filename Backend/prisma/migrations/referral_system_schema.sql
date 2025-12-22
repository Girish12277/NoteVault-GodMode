-- Referral System Database Schema
-- God-Level Viral Growth Infrastructure

-- Add referral_tier enum
DO $$ BEGIN
  CREATE TYPE "ReferralTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add referral_reward_type enum
DO $$ BEGIN
  CREATE TYPE "ReferralRewardType" AS ENUM ('CASH', 'CREDITS', 'DISCOUNT', 'BONUS_CONTENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create referral_tracking table
CREATE TABLE IF NOT EXISTS "referral_tracking" (
  "id" TEXT PRIMARY KEY,
  "referrer_id" TEXT NOT NULL,
  "referee_id" TEXT NOT NULL,
  "referral_code" TEXT NOT NULL,
  
  -- Attribution
  "signup_date" TIMESTAMP NOT NULL DEFAULT NOW(),
  "first_purchase_date" TIMESTAMP,
  "referral_source" TEXT, -- utm_source, direct, social, etc.
  "landing_page" TEXT,
  
  -- Conversion tracking
  "has_signed_up" BOOLEAN DEFAULT TRUE,
  "has_purchased" BOOLEAN DEFAULT FALSE,
  "purchase_count" INTEGER DEFAULT 0,
  "total_purchase_value_inr" DECIMAL(10, 2) DEFAULT 0,
  
  -- Status
  "is_valid" BOOLEAN DEFAULT TRUE,
  "invalidation_reason" TEXT,
  "invalidated_at" TIMESTAMP,
  
  -- Metadata
  "ip_address" TEXT,
  "user_agent" TEXT,
  "metadata" JSONB,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_referrer" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_referee" FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "unique_referee" UNIQUE ("referee_id") -- One referrer per user
);

-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS "referral_rewards" (
  "id" TEXT PRIMARY KEY,
  "referral_tracking_id" TEXT NOT NULL,
  "referrer_id" TEXT NOT NULL,
  "referee_id" TEXT NOT NULL,
  
  -- Reward details
  "reward_type" "ReferralRewardType" NOT NULL,
  "amount_inr" DECIMAL(10, 2) DEFAULT 0,
  "credits" INTEGER DEFAULT 0,
  "discount_percentage" DECIMAL(5, 2) DEFAULT 0,
  "bonus_content_ids" TEXT[],
  
  -- Trigger & status
  "trigger_event" TEXT NOT NULL, -- 'SIGNUP', 'FIRST_PURCHASE', 'NTH_PURCHASE'
  "status" TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, PAID, FAILED
  
  -- Processing
  "approved_at" TIMESTAMP,
  "paid_at" TIMESTAMP,
  "payment_reference" TEXT,
  "failed_reason" TEXT,
  
  -- Metadata
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_referral_tracking" FOREIGN KEY ("referral_tracking_id") REFERENCES "referral_tracking"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_reward_referrer" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_reward_referee" FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create referral_statistics table (aggregated metrics)
CREATE TABLE IF NOT EXISTS "referral_statistics" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL UNIQUE,
  
  -- Counts
  "total_referrals" INTEGER DEFAULT 0,
  "signup_referrals" INTEGER DEFAULT 0,
  "purchase_referrals" INTEGER DEFAULT 0,
  
  -- Revenue
  "total_referee_revenue_inr" DECIMAL(10, 2) DEFAULT 0,
  "total_rewards_earned_inr" DECIMAL(10, 2) DEFAULT 0,
  "total_rewards_paid_inr" DECIMAL(10, 2) DEFAULT 0,
  "pending_rewards_inr" DECIMAL(10, 2) DEFAULT 0,
  
  -- Tier & performance
  "current_tier" "ReferralTier" DEFAULT 'BRONZE',
  "tier_qualified_at" TIMESTAMP,
  "conversion_rate" DECIMAL(5, 2) DEFAULT 0, -- signup to purchase %
  
  -- Rankings
  "rank_by_referrals" INTEGER,
  "rank_by_revenue" INTEGER,
  
  -- Time periods
  "referrals_this_month" INTEGER DEFAULT 0,
  "referrals_last_month" INTEGER DEFAULT 0,
  "revenue_this_month_inr" DECIMAL(10, 2) DEFAULT 0,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_stats_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_referral_tracking_referrer" ON "referral_tracking"("referrer_id");
CREATE INDEX IF NOT EXISTS "idx_referral_tracking_referee" ON "referral_tracking"("referee_id");
CREATE INDEX IF NOT EXISTS "idx_referral_tracking_code" ON "referral_tracking"("referral_code");
CREATE INDEX IF NOT EXISTS "idx_referral_tracking_valid" ON "referral_tracking"("is_valid") WHERE "is_valid" = TRUE;
CREATE INDEX IF NOT EXISTS "idx_referral_tracking_purchased" ON "referral_tracking"("has_purchased") WHERE "has_purchased" = TRUE;

CREATE INDEX IF NOT EXISTS "idx_referral_rewards_referrer" ON "referral_rewards"("referrer_id");
CREATE INDEX IF NOT EXISTS "idx_referral_rewards_status" ON "referral_rewards"("status");
CREATE INDEX IF NOT EXISTS "idx_referral_rewards_pending" ON "referral_rewards"("status") WHERE "status" = 'PENDING';

CREATE INDEX IF NOT EXISTS "idx_referral_stats_user" ON "referral_statistics"("user_id");
CREATE INDEX IF NOT EXISTS "idx_referral_stats_tier" ON "referral_statistics"("current_tier");
CREATE INDEX IF NOT EXISTS "idx_referral_stats_rank" ON "referral_statistics"("rank_by_referrals", "rank_by_revenue");

-- Create function to update referral statistics
CREATE OR REPLACE FUNCTION update_referral_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert referral statistics
  INSERT INTO referral_statistics (
    id,
    user_id,
    total_referrals,
    signup_referrals,
    purchase_referrals,
    total_referee_revenue_inr
  )
  VALUES (
    gen_random_uuid()::TEXT,
    NEW.referrer_id,
    1,
    CASE WHEN NEW.has_signed_up THEN 1 ELSE 0 END,
    CASE WHEN NEW.has_purchased THEN 1 ELSE 0 END,
    NEW.total_purchase_value_inr
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_referrals = referral_statistics.total_referrals + 
      CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE 0 END,
    signup_referrals = referral_statistics.signup_referrals + 
      CASE WHEN NEW.has_signed_up AND (TG_OP = 'INSERT' OR NOT OLD.has_signed_up) THEN 1 ELSE 0 END,
    purchase_referrals = referral_statistics.purchase_referrals + 
      CASE WHEN NEW.has_purchased AND (TG_OP = 'INSERT' OR NOT OLD.has_purchased) THEN 1 ELSE 0 END,
    total_referee_revenue_inr = referral_statistics.total_referee_revenue_inr + 
      (NEW.total_purchase_value_inr - COALESCE(OLD.total_purchase_value_inr, 0)),
    conversion_rate = 
      CASE 
        WHEN referral_statistics.signup_referrals > 0 
        THEN (referral_statistics.purchase_referrals::DECIMAL / referral_statistics.signup_referrals) * 100
        ELSE 0 
      END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for statistics
DROP TRIGGER IF EXISTS trigger_update_referral_stats ON referral_tracking;
CREATE TRIGGER trigger_update_referral_stats
  AFTER INSERT OR UPDATE ON referral_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_statistics();

-- Create function to auto-tier users based on performance
CREATE OR REPLACE FUNCTION update_referral_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-tier based on purchase_referrals
  IF NEW.purchase_referrals >= 50 THEN
    NEW.current_tier := 'PLATINUM';
    NEW.tier_qualified_at := COALESCE(NEW.tier_qualified_at, NOW());
  ELSIF NEW.purchase_referrals >= 20 THEN
    NEW.current_tier := 'GOLD';
    NEW.tier_qualified_at := COALESCE(NEW.tier_qualified_at, NOW());
  ELSIF NEW.purchase_referrals >= 5 THEN
    NEW.current_tier := 'SILVER';
    NEW.tier_qualified_at := COALESCE(NEW.tier_qualified_at, NOW());
  ELSE
    NEW.current_tier := 'BRONZE';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tier updates
DROP TRIGGER IF EXISTS trigger_update_tier ON referral_statistics;
CREATE TRIGGER trigger_update_tier
  BEFORE INSERT OR UPDATE ON referral_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_tier();

-- Create function to track referral link clicks
CREATE TABLE IF NOT EXISTS "referral_clicks" (
  "id" TEXT PRIMARY KEY,
  "referral_code" TEXT NOT NULL,
  "referrer_id" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "referral_source" TEXT,
  "landing_page" TEXT,
  "converted" BOOLEAN DEFAULT FALSE,
  "converted_user_id" TEXT,
  "converted_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_click_referrer" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_referral_clicks_code" ON "referral_clicks"("referral_code");
CREATE INDEX IF NOT EXISTS "idx_referral_clicks_referrer" ON "referral_clicks"("referrer_id");
CREATE INDEX IF NOT EXISTS "idx_referral_clicks_converted" ON "referral_clicks"("converted") WHERE "converted" = TRUE;

COMMENT ON TABLE referral_tracking IS 'God-Level Referral Attribution & Tracking';
COMMENT ON TABLE referral_rewards IS 'Automated Referral Reward Distribution';
COMMENT ON TABLE referral_statistics IS 'Real-Time Referral Performance Metrics';
COMMENT ON TABLE referral_clicks IS 'Referral Link Click Tracking';
