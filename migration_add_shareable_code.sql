-- Migration: Add shareable_code column to videos table
-- Run this in your iOS app's Supabase migrations folder or Supabase SQL Editor

-- Add shareable_code column
ALTER TABLE "Videos"
ADD COLUMN IF NOT EXISTS shareable_code TEXT UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_videos_shareable_code
ON "Videos"(shareable_code);

-- Add comment
COMMENT ON COLUMN "Videos".shareable_code IS 'Short unique code for sharing videos (e.g., DRM4nUd)';
