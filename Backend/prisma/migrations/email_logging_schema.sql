-- GOD-LEVEL FREE EMAIL SYSTEM - Database Schema
-- Email logging and provider statistics for triple-provider architecture

-- Email logs table (audit trail)
CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" TEXT PRIMARY KEY,
  "to_email" TEXT NOT NULL,
  "subject" TEXT,
  "provider" TEXT NOT NULL, -- 'Brevo', 'Mailgun', 'SendGrid'
  "message_id" TEXT,
  "status" TEXT DEFAULT 'sent', -- sent, delivered, opened, clicked, bounced, failed
  
  -- Timestamps
  "sent_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "delivered_at" TIMESTAMP,
  "opened_at" TIMESTAMP,
  "clicked_at" TIMESTAMP,
  "bounced_at" TIMESTAMP,
  
  -- Error tracking
  "error_message" TEXT,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_email_logs_to" ON "email_logs"("to_email");
CREATE INDEX IF NOT EXISTS "idx_email_logs_provider" ON "email_logs"("provider");
CREATE INDEX IF NOT EXISTS "idx_email_logs_status" ON "email_logs"("status");
CREATE INDEX IF NOT EXISTS "idx_email_logs_sent_at" ON "email_logs"("sent_at" DESC);

-- Provider usage statistics (monthly tracking)
CREATE TABLE IF NOT EXISTS "email_provider_stats" (
  "id" TEXT PRIMARY KEY,
  "provider" TEXT NOT NULL, -- 'Brevo', 'Mailgun', 'SendGrid'
  "month" TEXT NOT NULL, -- 'YYYY-MM' format
  
  -- Counters
  "emails_sent" INTEGER DEFAULT 0,
  "emails_delivered" INTEGER DEFAULT 0,
  "emails_opened" INTEGER DEFAULT 0,
  "emails_clicked" INTEGER DEFAULT 0,
  "emails_bounced" INTEGER DEFAULT 0,
  "emails_failed" INTEGER DEFAULT 0,
  
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "unique_provider_month" UNIQUE("provider", "month")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_provider_stats_provider" ON "email_provider_stats"("provider");
CREATE INDEX IF NOT EXISTS "idx_provider_stats_month" ON "email_provider_stats"("month" DESC);

-- Comments for documentation
COMMENT ON TABLE email_logs IS 'God-Level Email Logging - Complete audit trail of all emails';
COMMENT ON TABLE email_provider_stats IS 'Monthly statistics per provider (Brevo/Mailgun/SendGrid)';
