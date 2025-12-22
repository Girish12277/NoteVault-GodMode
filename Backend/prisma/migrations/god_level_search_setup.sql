-- Phase 1: PostgreSQL Full-Text Search Setup
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Add search_vector column to notes table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE notes ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS notes_search_idx 
ON notes USING GIN (search_vector);

-- Create trigram indexes for typo tolerance
CREATE INDEX IF NOT EXISTS notes_title_trgm_idx 
ON notes USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS notes_description_trgm_idx 
ON notes USING GIN (description gin_trgm_ops);

-- Create function to auto-update search_vector
CREATE OR REPLACE FUNCTION notes_search_vector_update() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.subject, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS notes_search_vector_trigger ON notes;

CREATE TRIGGER notes_search_vector_trigger
BEFORE INSERT OR UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION notes_search_vector_update();

-- Populate existing rows (one-time update)
UPDATE notes SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(subject, '')), 'C')
WHERE search_vector IS NULL;
