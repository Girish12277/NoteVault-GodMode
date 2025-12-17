-- Migration: Add security fields for download quotas, checksums, and audit tables
-- Run after database backup
-- Usage: psql $DATABASE_URL -f migrations/20251211_add_security_fields/migration.sql

BEGIN;

-- Add security columns to purchases table
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS watermarked_public_id TEXT,
  ADD COLUMN IF NOT EXISTS file_sha256 VARCHAR(128),
  ADD COLUMN IF NOT EXISTS downloads_used INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_limit INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS watermark_job_status TEXT DEFAULT 'pending';

-- Create webhook idempotency table to prevent replay attacks
CREATE TABLE IF NOT EXISTS webhook_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_order_id TEXT NOT NULL UNIQUE,
  webhook_event_id TEXT,
  payload_hash TEXT,
  processed_at timestamptz DEFAULT now()
);

-- Create device sessions table for device binding
CREATE TABLE IF NOT EXISTS device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  device_fingerprint TEXT,
  ip INET,
  user_agent TEXT,
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  is_revoked BOOLEAN DEFAULT FALSE
);

-- Create audit logs table (append-only)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB,
  request_id TEXT,
  ip INET,
  user_agent TEXT,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchases_watermarked_public_id ON purchases (watermarked_public_id);
CREATE INDEX IF NOT EXISTS idx_webhook_gateway_order ON webhook_idempotency (gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON device_sessions (user_id, is_revoked);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_action ON audit_logs (actor_id, action, created_at);

COMMIT;
