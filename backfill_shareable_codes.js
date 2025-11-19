/**
 * Backfill Script: Generate shareable codes for all existing videos
 *
 * This script generates unique 7-character codes for all videos that don't have one.
 * Run this ONCE after applying the migration.
 *
 * Usage:
 * 1. Install dependencies: npm install @supabase/supabase-js nanoid
 * 2. Set environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY
 * 3. Run: node backfill_shareable_codes.js
 */

import { createClient } from '@supabase/supabase-js';
import { customAlphabet } from 'nanoid';

// Use Instagram-style character set (no confusing chars like 0, O, I, l)
const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', 7);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateUniqueCode() {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = nanoid();

    // Check if code already exists
    const { data, error } = await supabase
      .from('videos')
      .select('id')
      .eq('shareable_code', code)
      .single();

    if (error && error.code === 'PGRST116') {
      // Code doesn't exist - good!
      return code;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique code after 10 attempts');
}

async function backfillShareableCodes() {
  console.log('🚀 Starting backfill process...\n');

  // Get all videos without shareable_code
  const { data: videos, error: fetchError } = await supabase
    .from('videos')
    .select('id')
    .is('shareable_code', null);

  if (fetchError) {
    console.error('❌ Error fetching videos:', fetchError);
    process.exit(1);
  }

  if (!videos || videos.length === 0) {
    console.log('✅ All videos already have shareable codes!');
    return;
  }

  console.log(`📊 Found ${videos.length} videos without shareable codes`);
  console.log('⏳ Generating codes...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const video of videos) {
    try {
      const code = await generateUniqueCode();

      const { error: updateError } = await supabase
        .from('videos')
        .update({ shareable_code: code })
        .eq('id', video.id);

      if (updateError) {
        console.error(`❌ Error updating video ${video.id}:`, updateError.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`✅ Generated ${successCount}/${videos.length} codes...`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing video ${video.id}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📈 Backfill complete!');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
}

// Run the backfill
backfillShareableCodes()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
