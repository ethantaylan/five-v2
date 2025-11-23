-- Migration: Remove groups dependency and add share functionality to fives
-- Run this in your Supabase SQL Editor

-- 1. Add share_code column to fives table (for easy sharing)
ALTER TABLE fives
ADD COLUMN IF NOT EXISTS share_code VARCHAR(8) UNIQUE;

-- 2. Make group_id nullable (fives can exist without groups now)
ALTER TABLE fives
ALTER COLUMN group_id DROP NOT NULL;

-- 3. Generate share codes for existing fives
UPDATE fives
SET share_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE share_code IS NULL;

-- 4. Create function to generate share code automatically
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_code IS NULL THEN
    NEW.share_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to auto-generate share codes
DROP TRIGGER IF EXISTS fives_share_code_trigger ON fives;
CREATE TRIGGER fives_share_code_trigger
  BEFORE INSERT ON fives
  FOR EACH ROW
  EXECUTE FUNCTION generate_share_code();

-- 6. Add index on share_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_fives_share_code ON fives(share_code);

-- 7. Add created_by index for faster queries
CREATE INDEX IF NOT EXISTS idx_fives_created_by ON fives(created_by);

-- Note: We're keeping the groups tables for now in case you want to add them back later
-- If you want to completely remove them, run these lines:
-- DROP TABLE IF EXISTS group_members CASCADE;
-- DROP TABLE IF EXISTS groups CASCADE;
