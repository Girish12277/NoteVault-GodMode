-- GOD-LEVEL CONTENT MODERATION SYSTEM - Database Schema
-- Ultra-safe deletion with automatic refunds and audit trail

-- Moderation actions audit trail
CREATE TABLE IF NOT EXISTS "moderation_actions" (
  "id" TEXT PRIMARY KEY,
  "action_type" TEXT NOT NULL, -- 'DELETE_NOTE', 'FLAG', 'APPROVE', 'REJECT', 'COPYRIGHT_TAKEDOWN'
  "note_id" TEXT NOT NULL,
  "admin_id" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "reason_category" TEXT, -- 'COPYRIGHT', 'SPAM', 'FAKE', 'QUALITY', 'OTHER'
  
  -- Impact tracking
  "affected_buyers_count" INTEGER DEFAULT 0,
  "total_refund_amount" DECIMAL(10,2) DEFAULT 0,
  "seller_id" TEXT,
  "seller_earnings_deducted" DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  "note_title" TEXT,
  "note_price" DECIMAL(10,2),
  "purchase_count" INTEGER DEFAULT 0,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Copyright/DMCA claims
CREATE TABLE IF NOT EXISTS "copyright_claims" (
  "id" TEXT PRIMARY KEY,
  "note_id" TEXT NOT NULL,
  
  -- Claimant information
  "claimant_email" TEXT NOT NULL,
  "claimant_name" TEXT,
  "claimant_organization" TEXT,
  
  -- Evidence
  "proof_url" TEXT, -- Evidence document/link
  "description" TEXT NOT NULL,
  "original_work_url" TEXT, -- Link to original copyrighted work
  
  -- Status tracking
  "status" TEXT DEFAULT 'PENDING', -- PENDING, UNDER_REVIEW, APPROVED, REJECTED, APPEALED
  
  -- Resolution
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "reviewed_at" TIMESTAMP,
  "resolved_at" TIMESTAMP,
  "resolved_by_admin_id" TEXT,
  "resolution_notes" TEXT,
  "action_taken" TEXT, -- 'NOTE_DELETED', 'CLAIM_REJECTED', 'PENDING_APPEAL'
  
  -- Seller response
  "seller_notified_at" TIMESTAMP,
  "seller_response" TEXT,
  "seller_evidence_url" TEXT
);

-- Seller appeals for moderation actions
CREATE TABLE IF NOT EXISTS "moderation_appeals" (
  "id" TEXT PRIMARY KEY,
  "moderation_action_id" TEXT NOT NULL,
  "seller_id" TEXT NOT NULL,
  
  -- Appeal details
  "appeal_reason" TEXT NOT NULL,
  "evidence_url" TEXT,
  "additional_notes" TEXT,
  
  -- Status
  "status" TEXT DEFAULT 'PENDING', -- PENDING, UNDER_REVIEW, UPHELD, OVERTURNED, REJECTED
  
  -- Resolution
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "reviewed_at" TIMESTAMP,
  "reviewed_by_admin_id" TEXT,
  "outcome" TEXT, -- 'UPHELD' (deletion stays), 'OVERTURNED' (note restored), 'REJECTED' (appeal denied)
  "admin_notes" TEXT,
  
  -- If overturned
  "note_restored_at" TIMESTAMP,
  "buyers_recharged" BOOLEAN DEFAULT FALSE
);

-- Deleted notes archive (legal compliance - 7 year retention)
CREATE TABLE IF NOT EXISTS "deleted_notes_archive" (
  "id" TEXT PRIMARY KEY,
  "note_id" TEXT NOT NULL UNIQUE,
  
  -- Complete note snapshot (JSON)
  "note_data" JSONB NOT NULL,
  
  -- Deletion metadata
  "deletion_date" TIMESTAMP NOT NULL DEFAULT NOW(),
  "admin_id" TEXT NOT NULL,
  "deletion_reason" TEXT NOT NULL,
  "deletion_category" TEXT,
  
  -- Impact
  "purchase_count" INTEGER DEFAULT 0,
  "total_refund_amount" DECIMAL(10,2) DEFAULT 0,
  "seller_id" TEXT,
  
  -- Legal retention
  "retention_until" TIMESTAMP, -- Auto-delete after 7 years
  "is_archived_offsite" BOOLEAN DEFAULT FALSE,
  "offsite_archive_url" TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_moderation_actions_note" ON "moderation_actions"("note_id");
CREATE INDEX IF NOT EXISTS "idx_moderation_actions_admin" ON "moderation_actions"("admin_id");
CREATE INDEX IF NOT EXISTS "idx_moderation_actions_type" ON "moderation_actions"("action_type");
CREATE INDEX IF NOT EXISTS "idx_moderation_actions_created" ON "moderation_actions"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_copyright_claims_note" ON "copyright_claims"("note_id");
CREATE INDEX IF NOT EXISTS "idx_copyright_claims_status" ON "copyright_claims"("status");
CREATE INDEX IF NOT EXISTS "idx_copyright_claims_created" ON "copyright_claims"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_appeals_action" ON "moderation_appeals"("moderation_action_id");
CREATE INDEX IF NOT EXISTS "idx_appeals_seller" ON "moderation_appeals"("seller_id");
CREATE INDEX IF NOT EXISTS "idx_appeals_status" ON "moderation_appeals"("status");

CREATE INDEX IF NOT EXISTS "idx_archive_note" ON "deleted_notes_archive"("note_id");
CREATE INDEX IF NOT EXISTS "idx_archive_seller" ON "deleted_notes_archive"("seller_id");
CREATE INDEX IF NOT EXISTS "idx_archive_deletion_date" ON "deleted_notes_archive"("deletion_date" DESC);

-- Comments for documentation
COMMENT ON TABLE moderation_actions IS 'Complete audit trail of all moderation actions (deletions, flags, etc.)';
COMMENT ON TABLE copyright_claims IS 'DMCA/copyright takedown requests and their resolution';
COMMENT ON TABLE moderation_appeals IS 'Seller appeals against moderation decisions';
COMMENT ON TABLE deleted_notes_archive IS 'Legal archive of deleted notes (7-year retention for compliance)';
