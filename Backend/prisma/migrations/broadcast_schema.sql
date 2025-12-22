-- GOD-LEVEL BROADCAST SYSTEM - Database Schema
-- Million-user scalability with campaign management

-- Broadcast campaigns table
CREATE TABLE IF NOT EXISTS "broadcast_campaigns" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- 'custom', 'bulk', 'scheduled'
  
  -- Channels
  "channels" TEXT[] NOT NULL, -- ['email'], ['whatsapp'], or ['email', 'whatsapp']
  
  -- Content
  "subject" TEXT, -- For email
  "message" TEXT NOT NULL,
  "media_url" TEXT, -- Optional media for WhatsApp
  
  -- Targeting
  "segmentation_type" TEXT NOT NULL, -- 'all', 'userIds', 'query'
  "segmentation_data" JSONB, -- User IDs or query filters
  
  -- Stats
  "total_users" INTEGER DEFAULT 0,
  "total_batches" INTEGER DEFAULT 0,
  "processed_users" INTEGER DEFAULT 0,
  "succeeded_users" INTEGER DEFAULT 0,
  "failed_users" INTEGER DEFAULT 0,
  "progress_percent" DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  "status" TEXT DEFAULT 'queued', -- queued, processing, completed, failed, cancelled
  
  -- Metadata
  "created_by_admin_id" TEXT NOT NULL,
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "estimated_completion" TIMESTAMP,
  "error_message" TEXT,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Broadcast batches (for tracking batch processing)
CREATE TABLE IF NOT EXISTS "broadcast_batches" (
  "id" TEXT PRIMARY KEY,
  "campaign_id" TEXT NOT NULL REFERENCES "broadcast_campaigns"("id") ON DELETE CASCADE,
  
  -- Batch info
  "batch_number" INTEGER NOT NULL,
  "user_ids" TEXT[] NOT NULL, -- Array of user IDs in this batch
  "batch_size" INTEGER NOT NULL,
  
  -- Channel
  "channel" TEXT NOT NULL, -- 'email' or 'whatsapp'
  
  -- Status
  "status" TEXT DEFAULT 'queued', -- queued, processing, completed, failed
  "processed_count" INTEGER DEFAULT 0,
  "succeeded_count" INTEGER DEFAULT 0,
  "failed_count" INTEGER DEFAULT 0,
  
  -- Timing
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "error_message" TEXT,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Broadcast deliveries (individual message tracking)
CREATE TABLE IF NOT EXISTS "broadcast_deliveries" (
  "id" TEXT PRIMARY KEY,
  "campaign_id" TEXT NOT NULL REFERENCES "broadcast_campaigns"("id") ON DELETE CASCADE,
  "batch_id" TEXT NOT NULL REFERENCES "broadcast_batches"("id") ON DELETE CASCADE,
  
  -- User info
  "user_id" TEXT NOT NULL,
  "recipient" TEXT NOT NULL, -- Email or phone number
  
  -- Channel
  "channel" TEXT NOT NULL, -- 'email' or 'whatsapp'
  
  -- Message tracking
  "message_id" TEXT, -- External provider message ID (Twilio SID, SendGrid ID, etc.)
  "status" TEXT DEFAULT 'queued', -- queued, sent, delivered, read, failed, bounced
  
  -- Error tracking
  "error_code" TEXT,
  "error_message" TEXT,
  
  -- Timestamps
  "sent_at" TIMESTAMP,
  "delivered_at" TIMESTAMP,
  "read_at" TIMESTAMP,
  "failed_at" TIMESTAMP,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_campaigns_status" ON "broadcast_campaigns"("status");
CREATE INDEX IF NOT EXISTS "idx_campaigns_created_by" ON "broadcast_campaigns"("created_by_admin_id");
CREATE INDEX IF NOT EXISTS "idx_campaigns_created_at" ON "broadcast_campaigns"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_batches_campaign" ON "broadcast_batches"("campaign_id");
CREATE INDEX IF NOT EXISTS "idx_batches_status" ON "broadcast_batches"("status");

CREATE INDEX IF NOT EXISTS "idx_deliveries_campaign" ON "broadcast_deliveries"("campaign_id");
CREATE INDEX IF NOT EXISTS "idx_deliveries_batch" ON "broadcast_deliveries"("batch_id");
CREATE INDEX IF NOT EXISTS "idx_deliveries_user" ON "broadcast_deliveries"("user_id");
CREATE INDEX IF NOT EXISTS "idx_deliveries_status" ON "broadcast_deliveries"("status");
CREATE INDEX IF NOT EXISTS "idx_deliveries_channel" ON "broadcast_deliveries"("channel");

-- Comments for documentation
COMMENT ON TABLE broadcast_campaigns IS 'Broadcast campaign management with progress tracking';
COMMENT ON TABLE broadcast_batches IS 'Batch processing tracking for campaigns';
COMMENT ON TABLE broadcast_deliveries IS 'Individual message delivery tracking';
