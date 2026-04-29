/**
 * Fetch viral Toronto videos from Supabase
 *
 * Usage: SUPABASE_ANON_KEY=your_key node scripts/fetch-viral-toronto.js
 *
 * This fetches videos near Toronto, groups them by cuisine/category,
 * and outputs the data needed to build article pages.
 */

const SUPABASE_URL = 'https://lqslpgiibpcvknfehdlr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_ANON_KEY. Run with:\n  SUPABASE_ANON_KEY=your_key node scripts/fetch-viral-toronto.js');
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

// Toronto coordinates
const TORONTO_LAT = 43.6532;
const TORONTO_LNG = -79.3832;
const RADIUS_KM = 30;

// Exclude this creator
const EXCLUDE_CREATORS = ['callmecandace.tv', 'brazilianfoodie'];

async function query(table, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error(`Error querying ${table}:`, res.status, await res.text());
    return [];
  }
  return res.json();
}

async function main() {
  console.log('Fetching all videos with places...\n');

  // Step 1: Get all videos ordered by views, with decent engagement
  const videos = await query('Videos',
    'select=*&order=views.desc.nullslast&limit=2000'
  );
  console.log(`Fetched ${videos.length} videos total`);

  // Step 2: Get all creators
  const creators = await query('Creator', 'select=id,name,full_name,image_url');
  const creatorMap = {};
  creators.forEach(c => { creatorMap[c.id] = c; });
  console.log(`Fetched ${creators.length} creators`);

  // Step 3: Get all places
  const places = await query('Places', 'select=id,name,address,city,latitude,longitude,google_rating');
  const placeMap = {};
  places.forEach(p => { placeMap[p.id] = p; });
  console.log(`Fetched ${places.length} places`);

  // Step 4: Enrich videos with creator + place data, filter near Toronto
  const enriched = [];
  for (const v of videos) {
    const creator = creatorMap[v.creator_id];
    const place = placeMap[v.place_id];

    // Skip excluded creators
    if (creator && EXCLUDE_CREATORS.includes(creator.name)) continue;

    // Skip videos without places
    if (!place) continue;

    // Filter to Toronto area (rough bounding box)
    if (place.latitude && place.longitude) {
      const dlat = Math.abs(place.latitude - TORONTO_LAT);
      const dlng = Math.abs(place.longitude - TORONTO_LNG);
      if (dlat > 0.5 || dlng > 0.7) continue; // ~50km radius
    } else if (place.city) {
      const city = place.city.toLowerCase();
      if (!city.includes('toronto') && !city.includes('mississauga') &&
          !city.includes('scarborough') && !city.includes('etobicoke') &&
          !city.includes('north york') && !city.includes('markham') &&
          !city.includes('richmond hill') && !city.includes('vaughan') &&
          !city.includes('brampton') && !city.includes('oakville')) continue;
    } else {
      continue;
    }

    const thumbnailUrl = v.thumbnail_url ||
      (v.bunny_video_id ? `https://vz-9c9477c9-fd2.b-cdn.net/${v.bunny_video_id}/thumbnail.jpg` : null);

    enriched.push({
      id: v.id,
      caption: v.caption || '',
      views: v.views || 0,
      likes: v.likes || 0,
      saves: v.saves || 0,
      shares: v.shares || 0,
      shareable_code: v.shareable_code || v.bunny_video_id || String(v.id),
      thumbnail: thumbnailUrl,
      platform: v.platform || v.source || 'bitemap',
      duration: v.duration || null,
      creator_name: creator?.name || 'Unknown',
      creator_full_name: creator?.full_name || creator?.name || 'Unknown',
      creator_image: creator?.image_url || null,
      place_name: place?.name || 'Unknown',
      place_address: place?.address || '',
      place_city: place?.city || 'Toronto',
      place_rating: place?.google_rating || null,
    });
  }

  console.log(`\n${enriched.length} Toronto-area videos after filtering\n`);

  // Step 5: Categorize by caption keywords
  const categories = {
    'best-pho': { keywords: ['pho', 'phở', 'vietnamese soup', 'vietnamese noodle'], title: 'Best Pho', items: [] },
    'best-ramen': { keywords: ['ramen', 'tonkotsu', 'miso ramen', 'shoyu', 'tsukemen'], title: 'Best Ramen', items: [] },
    'best-sushi': { keywords: ['sushi', 'omakase', 'sashimi', 'nigiri', 'maki roll'], title: 'Best Sushi', items: [] },
    'best-burger': { keywords: ['burger', 'smash burger', 'cheeseburger', 'patty'], title: 'Best Burgers', items: [] },
    'best-pizza': { keywords: ['pizza', 'slice', 'neapolitan', 'margherita', 'pepperoni pizza'], title: 'Best Pizza', items: [] },
    'best-halal': { keywords: ['halal', 'shawarma', 'kebab', 'biryani', 'halal food'], title: 'Best Halal', items: [] },
    'best-korean-bbq': { keywords: ['korean bbq', 'kbbq', 'samgyeopsal', 'bulgogi', 'galbi', 'korean bbq'], title: 'Best Korean BBQ', items: [] },
    'best-thai': { keywords: ['thai', 'pad thai', 'green curry', 'tom yum', 'thai food', 'boat noodle'], title: 'Best Thai', items: [] },
    'best-brunch': { keywords: ['brunch', 'eggs benedict', 'pancakes', 'french toast', 'mimosa', 'brunch spot'], title: 'Best Brunch', items: [] },
    'best-steak': { keywords: ['steak', 'steakhouse', 'ribeye', 'filet', 'dry aged', 'wagyu'], title: 'Best Steak', items: [] },
    'best-tacos': { keywords: ['taco', 'tacos', 'burrito', 'mexican', 'al pastor', 'birria'], title: 'Best Tacos', items: [] },
    'best-indian': { keywords: ['indian', 'butter chicken', 'biryani', 'naan', 'tikka', 'curry', 'masala', 'tandoori'], title: 'Best Indian', items: [] },
    'best-chinese': { keywords: ['chinese', 'dim sum', 'dumpling', 'wonton', 'peking duck', 'char siu', 'hand pulled noodle'], title: 'Best Chinese', items: [] },
    'best-italian': { keywords: ['italian', 'pasta', 'risotto', 'tiramisu', 'gnocchi', 'carbonara', 'osso buco'], title: 'Best Italian', items: [] },
    'best-seafood': { keywords: ['seafood', 'lobster', 'crab', 'oyster', 'shrimp', 'fish', 'salmon', 'tuna', 'scallop'], title: 'Best Seafood', items: [] },
    'best-dessert': { keywords: ['dessert', 'cake', 'ice cream', 'gelato', 'pastry', 'donut', 'croissant', 'chocolate', 'waffle', 'crepe'], title: 'Best Desserts', items: [] },
    'best-coffee': { keywords: ['coffee', 'latte', 'espresso', 'cafe', 'café', 'matcha', 'cappuccino'], title: 'Best Coffee', items: [] },
    'best-wings': { keywords: ['wings', 'chicken wings', 'hot wings', 'buffalo wings', 'wing spot'], title: 'Best Wings', items: [] },
    'best-jerk': { keywords: ['jerk', 'jamaican', 'caribbean', 'oxtail', 'plantain', 'patty'], title: 'Best Caribbean', items: [] },
    'best-middle-eastern': { keywords: ['middle eastern', 'falafel', 'hummus', 'shawarma', 'tabouleh', 'manakish', 'fattoush', 'afghan', 'persian'], title: 'Best Middle Eastern', items: [] },
    'best-vegan': { keywords: ['vegan', 'plant-based', 'plant based', 'vegetarian', 'meat-free'], title: 'Best Vegan', items: [] },
    'best-ayce': { keywords: ['ayce', 'all you can eat', 'buffet', 'unlimited'], title: 'Best AYCE', items: [] },
    'best-late-night': { keywords: ['late night', 'midnight', '2am', '3am', 'after hours', 'late-night'], title: 'Best Late Night', items: [] },
    'best-bbq': { keywords: ['bbq', 'barbeque', 'barbecue', 'brisket', 'pulled pork', 'ribs', 'smoked'], title: 'Best BBQ', items: [] },
  };

  // Also try to match by place name
  const placeNameCategories = {
    'best-pho': ['pho'],
    'best-ramen': ['ramen'],
    'best-sushi': ['sushi'],
    'best-pizza': ['pizza'],
    'best-thai': ['thai'],
    'best-indian': ['indian', 'tandoori', 'masala'],
    'best-chinese': ['dim sum', 'chinese', 'dumpling', 'wonton'],
    'best-italian': ['italian', 'trattoria', 'osteria', 'ristorante'],
    'best-coffee': ['coffee', 'cafe', 'café'],
    'best-jerk': ['jerk', 'jamaican', 'caribbean'],
    'best-bbq': ['bbq', 'barbeque', 'smokehouse'],
  };

  for (const v of enriched) {
    const captionLower = (v.caption || '').toLowerCase();
    const placeNameLower = (v.place_name || '').toLowerCase();

    for (const [slug, cat] of Object.entries(categories)) {
      const matchCaption = cat.keywords.some(kw => captionLower.includes(kw));
      const matchPlace = (placeNameCategories[slug] || []).some(kw => placeNameLower.includes(kw));

      if (matchCaption || matchPlace) {
        // Avoid duplicates (same place + same creator)
        const exists = cat.items.some(
          item => item.place_name === v.place_name && item.creator_name === v.creator_name
        );
        if (!exists) {
          cat.items.push(v);
        }
      }
    }
  }

  // Step 6: Sort each category by views and report
  console.log('=== CATEGORY RESULTS ===\n');
  const viable = [];
  const thin = [];

  for (const [slug, cat] of Object.entries(categories)) {
    cat.items.sort((a, b) => b.views - a.views);
    const count = cat.items.length;
    if (count >= 5) {
      viable.push({ slug, ...cat });
      console.log(`✅ ${cat.title}: ${count} videos`);
    } else if (count > 0) {
      thin.push({ slug, ...cat, count });
      console.log(`⚠️  ${cat.title}: ${count} videos (need 5+)`);
    } else {
      console.log(`❌ ${cat.title}: 0 videos`);
    }
  }

  console.log(`\n${viable.length} categories with 5+ videos`);
  console.log(`${thin.length} categories with some but < 5\n`);

  // Step 7: Write output
  const output = {
    fetched_at: new Date().toISOString(),
    total_toronto_videos: enriched.length,
    categories: {}
  };

  for (const cat of viable) {
    output.categories[cat.slug] = {
      title: cat.title,
      count: cat.items.length,
      items: cat.items.slice(0, 15).map((v, i) => ({
        rank: i + 1,
        place_name: v.place_name,
        place_address: v.place_address,
        place_city: v.place_city,
        place_rating: v.place_rating,
        creator_name: v.creator_name,
        creator_full_name: v.creator_full_name,
        creator_image: v.creator_image,
        caption: v.caption,
        views: v.views,
        likes: v.likes,
        saves: v.saves,
        shares: v.shares,
        video_code: v.shareable_code,
        thumbnail: v.thumbnail,
        platform: v.platform,
        duration: v.duration,
      }))
    };
  }

  // Also include thin categories for reference
  for (const cat of thin) {
    output.categories[cat.slug] = {
      title: cat.title,
      count: cat.items.length,
      note: 'Below 5 threshold — needs more content',
      items: cat.items.slice(0, 15).map((v, i) => ({
        rank: i + 1,
        place_name: v.place_name,
        place_address: v.place_address,
        creator_name: v.creator_name,
        creator_full_name: v.creator_full_name,
        caption: v.caption,
        views: v.views,
        likes: v.likes,
        video_code: v.shareable_code,
        thumbnail: v.thumbnail,
        platform: v.platform,
      }))
    };
  }

  const fs = await import('fs');
  const outPath = 'data/viral-toronto.json';
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nData written to ${outPath}`);

  // Print top 5 for each viable category
  console.log('\n=== TOP 5 PER CATEGORY ===\n');
  for (const cat of viable) {
    console.log(`\n── ${cat.title} (${cat.items.length} total) ──`);
    for (const item of cat.items.slice(0, 5)) {
      console.log(`  ${item.place_name} — @${item.creator_name} — ${item.views.toLocaleString()} views`);
      console.log(`    "${(item.caption || '').substring(0, 80)}..."`);
    }
  }
}

main().catch(console.error);
