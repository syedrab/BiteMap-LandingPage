/**
 * Fetch Toronto Video Data from Supabase
 *
 * Run this to export real video/creator/place data into data/toronto.json
 * Usage: SUPABASE_ANON_KEY=your_key node scripts/fetch-toronto-data.js
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = 'https://lqslpgiibpcvknfehdlr.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('Missing SUPABASE_ANON_KEY. Run with: SUPABASE_ANON_KEY=your_key node scripts/fetch-toronto-data.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cuisine keywords to search in video captions
const CUISINE_SEARCHES = {
  'best-ramen':      ['ramen', 'tonkotsu', 'miso ramen', 'shoyu', 'tsukemen'],
  'best-burger':     ['burger', 'smash burger', 'cheeseburger', 'wagyu burger'],
  'best-sushi':      ['sushi', 'omakase', 'sashimi', 'nigiri', 'maki'],
  'best-halal':      ['halal', 'shawarma', 'kebab', 'biryani'],
  'best-korean-bbq': ['korean bbq', 'kbbq', 'samgyeopsal', 'bulgogi', 'galbi'],
  'best-brunch':     ['brunch', 'eggs benedict', 'pancakes', 'french toast', 'mimosa'],
  'best-thai':       ['thai', 'pad thai', 'green curry', 'tom yum', 'boat noodle'],
  'best-steak':      ['steak', 'steakhouse', 'ribeye', 'filet mignon', 'dry aged'],
  'best-vegan':      ['vegan', 'plant-based', 'plant based', 'vegetarian'],
  'best-pizza':      ['pizza', 'neapolitan', 'margherita', 'detroit style'],
  'best-ayce':       ['ayce', 'all you can eat', 'buffet', 'unlimited']
};

async function fetchVideosForCuisine(keywords, limit = 10) {
  // Build OR filter for caption search
  const filters = keywords.map(k => `caption.ilike.%${k}%`).join(',');

  const { data: videos, error } = await supabase
    .from('Videos')
    .select('*')
    .or(filters)
    .order('views', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Error fetching videos:`, error.message);
    return [];
  }

  // Fetch creator and place data for each video
  const enriched = await Promise.all(videos.map(async (video) => {
    let creator = null;
    let place = null;

    if (video.creator_id) {
      const { data } = await supabase
        .from('Creator')
        .select('id, name, full_name, image_url')
        .eq('id', video.creator_id)
        .single();
      creator = data;
    }

    if (video.place_id) {
      const { data } = await supabase
        .from('Places')
        .select('id, name, address, city')
        .eq('id', video.place_id)
        .single();
      place = data;
    }

    const thumbnailUrl = video.thumbnail_url ||
      (video.bunny_video_id ? `https://vz-9c9477c9-fd2.b-cdn.net/${video.bunny_video_id}/thumbnail.jpg` : null);

    return {
      rank: 0, // Will be set based on array index
      name: place?.name || 'Unknown Restaurant',
      neighborhood: place?.city || 'Toronto',
      address: place?.address || '',
      price_range: '$$',
      known_for: video.caption?.substring(0, 60) || '',
      creator: creator?.name || 'BiteMap Creator',
      caption: video.caption || '',
      views: video.views || 0,
      likes: video.likes || 0,
      video_code: video.shareable_code || video.bunny_video_id || String(video.id),
      thumbnail: thumbnailUrl || '/images/placeholder-food.jpg'
    };
  }));

  // Set ranks
  return enriched.map((item, i) => ({ ...item, rank: i + 1 }));
}

async function fetchCreators() {
  const { data: creators, error } = await supabase
    .from('Creator')
    .select('id, name, full_name, image_url')
    .order('id', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error fetching creators:', error.message);
    return [];
  }

  return creators.map(c => ({
    id: c.name,
    name: c.full_name || c.name,
    handle: `@${c.name}`,
    specialty: '',
    reviews_count: 0,
    initial: (c.full_name || c.name).charAt(0).toUpperCase()
  }));
}

async function fetchStats() {
  const [{ count: videoCount }, { count: creatorCount }, { count: placeCount }] = await Promise.all([
    supabase.from('Videos').select('*', { count: 'exact', head: true }),
    supabase.from('Creator').select('*', { count: 'exact', head: true }),
    supabase.from('Places').select('*', { count: 'exact', head: true })
  ]);

  return {
    restaurants_reviewed: placeCount || 0,
    creators: creatorCount || 0,
    video_reviews: videoCount || 0
  };
}

async function main() {
  console.log('Fetching data from Supabase...\n');

  // Load existing data as template
  const templatePath = join(__dirname, '..', 'data', 'toronto.json');
  const template = JSON.parse(readFileSync(templatePath, 'utf8'));

  // Fetch stats
  console.log('Fetching stats...');
  template.stats = await fetchStats();
  console.log(`  ${template.stats.video_reviews} videos, ${template.stats.creators} creators, ${template.stats.restaurants_reviewed} restaurants`);

  // Fetch creators
  console.log('Fetching creators...');
  const creators = await fetchCreators();
  if (creators.length > 0) {
    template.creators = creators.slice(0, 6);
  }
  console.log(`  Found ${creators.length} creators`);

  // Fetch cuisine lists
  for (const [slug, keywords] of Object.entries(CUISINE_SEARCHES)) {
    console.log(`Fetching ${slug}...`);
    const items = await fetchVideosForCuisine(keywords);

    if (items.length > 0 && template.lists[slug]) {
      template.lists[slug].items = items;
      console.log(`  Found ${items.length} videos`);
    } else {
      console.log(`  No videos found (keeping sample data)`);
    }
  }

  // Update timestamp
  template.updated = new Date().toISOString().split('T')[0];

  // Write output
  const outputPath = join(__dirname, '..', 'data', 'toronto.json');
  writeFileSync(outputPath, JSON.stringify(template, null, 2));
  console.log(`\nData written to ${outputPath}`);
  console.log('Done!');
}

main().catch(console.error);
