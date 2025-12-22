-- GOD-LEVEL WHATSAPP MESSAGING SYSTEM - Database Schema
-- Complete message logging and tracking

-- WhatsApp messages table (complete audit trail)
CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
  "id" TEXT PRIMARY KEY,
  "to_phone" TEXT NOT NULL,
  "from_phone" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "media_url" TEXT,
  
  -- Twilio tracking
  "message_sid" TEXT NOT NULL,
  "status" TEXT DEFAULT 'queued', -- queued, sent, delivered, read, failed, undelivered
  "provider" TEXT DEFAULT 'twilio',
  
  -- Timestamps
  "sent_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "delivered_at" TIMESTAMP,
  "read_at" TIMESTAMP,
  "failed_at" TIMESTAMP,
  
  -- Error tracking
  "error_code" TEXT,
  "error_message" TEXT,
  
  -- Metadata
  "template_name" TEXT, -- 'otp', 'order_confirmation', 'refund_update', etc.
  "user_id" TEXT, -- Optional link to users table
  "reference_id" TEXT, -- Order ID, Refund ID, etc.
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_whatsapp_to" ON "whatsapp_messages"("to_phone");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_status" ON "whatsapp_messages"("status");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_sent_at" ON "whatsapp_messages"("sent_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_whatsapp_message_sid" ON "whatsapp_messages"("message_sid");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_template" ON "whatsapp_messages"("template_name");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_user_id" ON "whatsapp_messages"("user_id");

-- WhatsApp statistics (daily tracking)
CREATE TABLE IF NOT EXISTS "whatsapp_daily_stats" (
  "id" TEXT PRIMARY KEY,
  "date" DATE NOT NULL UNIQUE,
  
  -- Message counts
  "total_sent" INTEGER DEFAULT 0,
  "total_delivered" INTEGER DEFAULT 0,
  "total_read" INTEGER DEFAULT 0,
  "total_failed" INTEGER DEFAULT 0,
  
  -- By template
  "otp_count" INTEGER DEFAULT 0,
  "order_confirmation_count" INTEGER DEFAULT 0,
  "payment_confirmation_count" INTEGER DEFAULT 0,
  "refund_update_count" INTEGER DEFAULT 0,
  "cart_reminder_count" INTEGER DEFAULT 0,
  
  -- Rates
  "delivery_rate" DECIMAL(5,2),
  "read_rate" DECIMAL(5,2),
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Index for date queries
CREATE INDEX IF NOT EXISTS "idx_whatsapp_stats_date" ON "whatsapp_daily_stats"("date" DESC);

-- Webhook events (for debugging)
CREATE TABLE IF NOT EXISTS "whatsapp_webhook_events" (
  "id" TEXT PRIMARY KEY,
  "message_sid" TEXT NOT NULL,
  "event_type" TEXT NOT NULL, -- 'sent', 'delivered', 'read', 'failed'
  "status" TEXT NOT NULL,
  "error_code" TEXT,
  "error_message" TEXT,
  "raw_payload" JSONB,
  "received_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for message SID lookups
CREATE INDEX IF NOT EXISTS "idx_webhook_message_sid" ON "whatsapp_webhook_events"("message_sid");
CREATE INDEX IF NOT EXISTS "idx_webhook_received_at" ON "whatsapp_webhook_events"("received_at" DESC);

-- Comments for documentation
COMMENT ON TABLE whatsapp_messages IS 'Complete WhatsApp message log with delivery tracking';
COMMENT ON TABLE whatsapp_daily_stats IS 'Daily WhatsApp usage and performance statistics';
COMMENT ON TABLE whatsapp_webhook_events IS 'Raw Twilio webhook events for debugging';
