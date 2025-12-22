-- Refund System Database Schema
-- God-Level Refund Processing Infrastructure

-- Add refund_status enum if not exists
DO $$ BEGIN
  CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add refund_reason enum
DO $$ BEGIN
  CREATE TYPE "RefundReason" AS ENUM (
    'FILE_CORRUPTION',
    'NOT_AS_DESCRIBED',
    'QUALITY_ISSUES',
    'ACCIDENTAL_PURCHASE',
    'DUPLICATE_PURCHASE',
    'TECHNICAL_ISSUES',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create refunds table
CREATE TABLE IF NOT EXISTS "refunds" (
  "id" TEXT PRIMARY KEY,
  "transaction_id" TEXT NOT NULL UNIQUE,
  "purchase_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "note_id" TEXT NOT NULL,
  "seller_id" TEXT NOT NULL,
  
  -- Financial details
  "amount_inr" DECIMAL(10, 2) NOT NULL,
  "gateway_fee_inr" DECIMAL(10, 2) DEFAULT 0,
  "net_refund_inr" DECIMAL(10, 2) NOT NULL,
  
  -- Refund details
  "reason" "RefundReason" NOT NULL,
  "reason_details" TEXT,
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
  
  -- Processing details
  "requested_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "approved_at" TIMESTAMP,
  "processed_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "failed_at" TIMESTAMP,
  
  -- Gateway integration
  "razorpay_refund_id" TEXT,
  "razorpay_payment_id" TEXT NOT NULL,
  "gateway_status" TEXT,
  "gateway_error" TEXT,
  
  -- Admin & audit
  "approved_by_admin_id" TEXT,
  "rejected_by_admin_id" TEXT,
  "admin_notes" TEXT,
  "is_auto_approved" BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  "ip_address" TEXT,
  "user_agent" TEXT,
  "metadata" JSONB,
  
  -- Timestamps
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_refunds_user_id" ON "refunds"("user_id");
CREATE INDEX IF NOT EXISTS "idx_refunds_seller_id" ON "refunds"("seller_id");
CREATE INDEX IF NOT EXISTS "idx_refunds_status" ON "refunds"("status");
CREATE INDEX IF NOT EXISTS "idx_refunds_created_at" ON "refunds"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_refunds_transaction_id" ON "refunds"("transaction_id");
CREATE INDEX IF NOT EXISTS "idx_refunds_purchase_id" ON "refunds"("purchase_id");

-- Create refund_abuse_tracking table
CREATE TABLE IF NOT EXISTS "refund_abuse_tracking" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  
  -- Abuse metrics
  "total_refunds" INTEGER DEFAULT 0,
  "refunds_last_30_days" INTEGER DEFAULT 0,
  "refunds_last_90_days" INTEGER DEFAULT 0,
  "total_refund_amount_inr" DECIMAL(10, 2) DEFAULT 0,
  "refund_to_purchase_ratio" DECIMAL(5, 2) DEFAULT 0,
  
  -- Flags
  "is_flagged" BOOLEAN DEFAULT FALSE,
  "flagged_at" TIMESTAMP,
  "flag_reason" TEXT,
  "is_blocked_from_refunds" BOOLEAN DEFAULT FALSE,
  "blocked_at" TIMESTAMP,
  
  -- Audit
  "last_refund_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_refund_abuse_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_refund_abuse_user_id" ON "refund_abuse_tracking"("user_id");
CREATE INDEX IF NOT EXISTS "idx_refund_abuse_flagged" ON "refund_abuse_tracking"("is_flagged") WHERE "is_flagged" = TRUE;

-- Add refund-related columns to transactions table if not exist
DO $$ BEGIN
  ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "refund_id" TEXT;
  ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "is_refunded" BOOLEAN DEFAULT FALSE;
  ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "refunded_at" TIMESTAMP;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Add index for refunded transactions
CREATE INDEX IF NOT EXISTS "idx_transactions_refund_id" ON "transactions"("refund_id") WHERE "refund_id" IS NOT NULL;

-- Create automated refund approval trigger
CREATE OR REPLACE FUNCTION check_refund_auto_approval()
RETURNS TRIGGER AS $$
DECLARE
  hours_since_purchase INTEGER;
  user_refund_count INTEGER;
BEGIN
  -- Check if within 24 hours
  SELECT EXTRACT(EPOCH FROM (NEW.requested_at - t.created_at))/3600 INTO hours_since_purchase
  FROM transactions t
  WHERE t.id = NEW.transaction_id;
  
  -- Check user's refund history
  SELECT COUNT(*) INTO user_refund_count
  FROM refunds
  WHERE user_id = NEW.user_id
  AND status IN ('COMPLETED', 'APPROVED');
  
  -- Auto-approve if:
  -- 1. Within 24 hours
  -- 2. User has < 3 previous refunds
  -- 3. Reason is FILE_CORRUPTION or TECHNICAL_ISSUES
  IF hours_since_purchase <= 24 
     AND user_refund_count < 3 
     AND NEW.reason IN ('FILE_CORRUPTION', 'TECHNICAL_ISSUES') THEN
    NEW.is_auto_approved := TRUE;
    NEW.status := 'APPROVED';
    NEW.approved_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_refund_auto_approval ON refunds;
CREATE TRIGGER trigger_refund_auto_approval
  BEFORE INSERT ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION check_refund_auto_approval();

-- Create function to update refund abuse tracking
CREATE OR REPLACE FUNCTION update_refund_abuse_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert abuse tracking
  INSERT INTO refund_abuse_tracking (
    id,
    user_id,
    total_refunds,
    refunds_last_30_days,
    refunds_last_90_days,
    total_refund_amount_inr,
    last_refund_at
  )
  VALUES (
    gen_random_uuid()::TEXT,
    NEW.user_id,
    1,
    CASE WHEN NEW.requested_at > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END,
    CASE WHEN NEW.requested_at > NOW() - INTERVAL '90 days' THEN 1 ELSE 0 END,
    NEW.amount_inr,
    NEW.requested_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_refunds = refund_abuse_tracking.total_refunds + 1,
    refunds_last_30_days = (
      SELECT COUNT(*) FROM refunds 
      WHERE user_id = NEW.user_id 
      AND requested_at > NOW() - INTERVAL '30 days'
    ),
    refunds_last_90_days = (
      SELECT COUNT(*) FROM refunds 
      WHERE user_id = NEW.user_id 
      AND requested_at > NOW() - INTERVAL '90 days'
    ),
    total_refund_amount_inr = refund_abuse_tracking.total_refund_amount_inr + NEW.amount_inr,
    last_refund_at = NEW.requested_at,
    updated_at = NOW();
  
  -- Auto-flag if > 3 refunds in 30 days
  UPDATE refund_abuse_tracking
  SET 
    is_flagged = TRUE,
    flagged_at = NOW(),
    flag_reason = 'Excessive refunds: ' || refunds_last_30_days || ' in last 30 days'
  WHERE user_id = NEW.user_id
  AND refunds_last_30_days >= 3
  AND is_flagged = FALSE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for abuse tracking
DROP TRIGGER IF EXISTS trigger_update_refund_abuse ON refunds;
CREATE TRIGGER trigger_update_refund_abuse
  AFTER INSERT ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_refund_abuse_tracking();

-- Add unique constraint to refund_abuse_tracking
ALTER TABLE refund_abuse_tracking 
  DROP CONSTRAINT IF EXISTS unique_refund_abuse_user;
  
ALTER TABLE refund_abuse_tracking
  ADD CONSTRAINT unique_refund_abuse_user UNIQUE (user_id);

COMMENT ON TABLE refunds IS 'God-Level Refund Processing System';
COMMENT ON TABLE refund_abuse_tracking IS 'Automated refund abuse detection and prevention';
