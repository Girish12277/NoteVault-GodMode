# BULLETPROOF MIGRATION GUIDE
# Content Moderation Database Schema

## MIGRATION SQL (Copy-Paste to pgAdmin)

```sql
-- GOD-LEVEL CONTENT MODERATION SYSTEM - Database Schema
-- Ultra-safe deletion with automatic refunds and audit trail

-- Moderation actions audit trail
CREATE TABLE IF NOT EXISTS "moderation_actions" (
  "id" TEXT PRIMARY KEY,
  "action_type" TEXT NOT NULL,
  "note_id" TEXT NOT NULL,
  "admin_id" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "reason_category" TEXT,
  "affected_buyers_count" INTEGER DEFAULT 0,
  "total_refund_amount" DECIMAL(10,2) DEFAULT 0,
  "seller_id" TEXT,
  "seller_earnings_deducted" DECIMAL(10,2) DEFAULT 0,
  "note_title" TEXT,
  "note_price" DECIMAL(10,2),
  "purchase_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Copyright/DMCA claims
CREATE TABLE IF NOT EXISTS "copyright_claims" (
  "id" TEXT PRIMARY KEY,
  "note_id" TEXT NOT NULL,
  "claimant_email" TEXT NOT NULL,
  "claimant_name" TEXT,
  "claimant_organization" TEXT,
  "proof_url" TEXT,
  "description" TEXT NOT NULL,
  "original_work_url" TEXT,
  "status" TEXT DEFAULT 'PENDING',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "reviewed_at" TIMESTAMP,
  "resolved_at" TIMESTAMP,
  "resolved_by_admin_id" TEXT,
  "resolution_notes" TEXT,
  "action_taken" TEXT,
  "seller_notified_at" TIMESTAMP,
  "seller_response" TEXT,
  "seller_evidence_url" TEXT
);

-- Seller appeals
CREATE TABLE IF NOT EXISTS "moderation_appeals" (
  "id" TEXT PRIMARY KEY,
  "moderation_action_id" TEXT NOT NULL,
  "seller_id" TEXT NOT NULL,
  "appeal_reason" TEXT NOT NULL,
  "evidence_url" TEXT,
  "additional_notes" TEXT,
  "status" TEXT DEFAULT 'PENDING',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "reviewed_at" TIMESTAMP,
  "reviewed_by_admin_id" TEXT,
  "outcome" TEXT,
  "admin_notes" TEXT,
  "note_restored_at" TIMESTAMP,
  "buyers_recharged" BOOLEAN DEFAULT FALSE
);

-- Deleted notes archive
CREATE TABLE IF NOT EXISTS "deleted_notes_archive" (
  "id" TEXT PRIMARY KEY,
  "note_id" TEXT NOT NULL UNIQUE,
  "note_data" JSONB NOT NULL,
  "deletion_date" TIMESTAMP NOT NULL DEFAULT NOW(),
  "admin_id" TEXT NOT NULL,
  "deletion_reason" TEXT NOT NULL,
  "deletion_category" TEXT,
  "purchase_count" INTEGER DEFAULT 0,
  "total_refund_amount" DECIMAL(10,2) DEFAULT 0,
  "seller_id" TEXT,
  "retention_until" TIMESTAMP,
  "is_archived_offsite" BOOLEAN DEFAULT FALSE,
  "offsite_archive_url" TEXT
);

-- Indexes
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

-- Comments
COMMENT ON TABLE moderation_actions IS 'Complete audit trail of all moderation actions';
COMMENT ON TABLE copyright_claims IS 'DMCA/copyright takedown requests and resolution';
COMMENT ON TABLE moderation_appeals IS 'Seller appeals against moderation decisions';
COMMENT ON TABLE deleted_notes_archive IS 'Legal archive of deleted notes (7-year retention)';
```

## EXECUTION STEPS (pgAdmin)

### Step 1: Open pgAdmin 4
- Launch pgAdmin from Start Menu or Desktop

### Step 2: Connect to Database
- Navigate to: Servers → PostgreSQL → Databases → studyvault

### Step 3: Open Query Tool
- Right-click on `studyvault` database
- Select **Tools → Query Tool** (or press F5)

### Step 4: Execute Migration
1. **Copy** the entire SQL block above (from CREATE TABLE to COMMENT lines)
2. **Paste** into the Query Tool editor
3. Click **Execute** button (▶️) or press **F5**

### Step 5: Verify Success

Run this verification query:
```sql
SELECT tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
  AND (tablename LIKE '%moderation%' 
   OR tablename LIKE '%copyright%' 
   OR tablename LIKE '%deleted%')
ORDER BY tablename;
```

**Expected Result**: 4 tables
- `copyright_claims`
- `deleted_notes_archive`
- `moderation_actions`
- `moderation_appeals`

## SUCCESS CRITERIA

✅ No errors in Query Tool output  
✅ "CREATE TABLE" messages (×4)  
✅ "CREATE INDEX" messages (×13)  
✅ "COMMENT" messages (×4)  
✅ Verification query returns 4 rows  

---

**Estimated Time**: 30 seconds  
**Difficulty**: Easy (copy-paste)  
**Risk**: Zero (IF NOT EXISTS prevents errors)
