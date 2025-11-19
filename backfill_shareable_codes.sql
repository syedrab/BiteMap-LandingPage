-- SQL Backfill Script: Generate shareable codes for all existing videos
-- Run this in Supabase SQL Editor
--
-- This creates a function that generates unique 7-character codes
-- and applies them to all videos without shareable_code

-- Function to generate random 7-character code
CREATE OR REPLACE FUNCTION generate_shareable_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..7 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Backfill function that ensures uniqueness
DO $$
DECLARE
  video_record RECORD;
  new_code TEXT;
  max_attempts INT := 10;
  attempt INT;
  code_exists BOOLEAN;
BEGIN
  FOR video_record IN
    SELECT id FROM "Videos" WHERE shareable_code IS NULL
  LOOP
    attempt := 0;
    code_exists := TRUE;

    -- Try to generate unique code
    WHILE code_exists AND attempt < max_attempts LOOP
      new_code := generate_shareable_code();

      -- Check if code already exists
      SELECT EXISTS(
        SELECT 1 FROM "Videos" WHERE shareable_code = new_code
      ) INTO code_exists;

      attempt := attempt + 1;
    END LOOP;

    -- Update video with unique code
    IF NOT code_exists THEN
      UPDATE "Videos"
      SET shareable_code = new_code
      WHERE id = video_record.id;

      RAISE NOTICE 'Generated code % for video %', new_code, video_record.id;
    ELSE
      RAISE WARNING 'Failed to generate unique code for video % after % attempts', video_record.id, max_attempts;
    END IF;
  END LOOP;

  RAISE NOTICE 'Backfill complete!';
END $$;

-- Verify results
SELECT COUNT(*) as total_videos FROM "Videos";
SELECT COUNT(*) as videos_with_codes FROM "Videos" WHERE shareable_code IS NOT NULL;
SELECT COUNT(*) as videos_without_codes FROM "Videos" WHERE shareable_code IS NULL;
