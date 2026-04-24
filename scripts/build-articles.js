/**
 * Parse the Supabase CSV export and categorize videos into article groups.
 * Then output data/articles.json with the content for each article page.
 *
 * Usage: node scripts/build-articles.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Parse CSV (handles quoted fields with commas/newlines) ──
function parseCSV(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field.trim());
        field = '';
      } else if (ch === '\n') {
        current.push(field.trim());
        if (current.length > 1) rows.push(current);
        current = [];
        field = '';
      } else if (ch !== '\r') {
        field += ch;
      }
    }
  }
  if (field || current.length) {
    current.push(field.trim());
    if (current.length > 1) rows.push(current);
  }
  return rows;
}

// ── Read and parse ──
const csvPath = join(root, 'Supabase Snippet Find Videos Near Toronto.csv');
const raw = readFileSync(csvPath, 'utf8');
const allRows = parseCSV(raw);

const headers = allRows[0];
const data = allRows.slice(1).map(row => {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i] || ''; });
  return obj;
});

console.log(`Parsed ${data.length} rows`);

// ── Filter out callmecandace.tv ──
const filtered = data.filter(r => r.creator_name !== 'callmecandace.tv');
console.log(`${filtered.length} rows after excluding callmecandace.tv`);

// ── Category definitions ──
const CATEGORIES = {
  'best-pho':            { title: 'Best Pho', keywords: ['pho', 'phở', 'vietnamese noodle soup'], placeKw: ['pho'] },
  'best-ramen':          { title: 'Best Ramen', keywords: ['ramen', 'tonkotsu', 'miso ramen', 'shoyu ramen', 'tsukemen'], placeKw: ['ramen'] },
  'best-sushi':          { title: 'Best Sushi', keywords: ['sushi', 'omakase', 'sashimi', 'nigiri'], placeKw: ['sushi'] },
  'best-burger':         { title: 'Best Burgers', keywords: ['burger', 'smash burger', 'cheeseburger'], placeKw: ['burger'] },
  'best-pizza':          { title: 'Best Pizza', keywords: ['pizza', 'slice', 'neapolitan', 'margherita'], placeKw: ['pizza'] },
  'best-halal':          { title: 'Best Halal', keywords: ['halal', 'shawarma', 'kebab'], placeKw: ['halal'] },
  'best-korean-bbq':     { title: 'Best Korean BBQ', keywords: ['korean bbq', 'kbbq', 'samgyeopsal', 'bulgogi', 'galbi', 'korean barbecue'], placeKw: ['korean bbq', 'kbbq'] },
  'best-thai':           { title: 'Best Thai', keywords: ['thai food', 'pad thai', 'green curry', 'tom yum', 'boat noodle', 'thai restaurant'], placeKw: ['thai'] },
  'best-brunch':         { title: 'Best Brunch', keywords: ['brunch', 'eggs benedict', 'french toast', 'pancakes', 'mimosa', 'brunch spot'], placeKw: ['brunch'] },
  'best-steak':          { title: 'Best Steak', keywords: ['steak', 'steakhouse', 'ribeye', 'filet mignon', 'dry aged', 'wagyu steak'], placeKw: ['steak', 'steakhouse'] },
  'best-tacos':          { title: 'Best Tacos', keywords: ['taco', 'tacos', 'burrito', 'al pastor', 'birria', 'mexican food'], placeKw: ['taco', 'mexican', 'burrito'] },
  'best-indian':         { title: 'Best Indian', keywords: ['butter chicken', 'biryani', 'naan', 'tikka masala', 'tandoori', 'curry', 'indian food', 'dosa'], placeKw: ['indian', 'tandoori', 'masala', 'curry'] },
  'best-chinese':        { title: 'Best Chinese', keywords: ['dim sum', 'dumpling', 'wonton', 'peking duck', 'char siu', 'chinese food', 'hand pulled noodle', 'mapo tofu', 'xiao long bao'], placeKw: ['dim sum', 'chinese', 'dumpling', 'wonton'] },
  'best-italian':        { title: 'Best Italian', keywords: ['pasta', 'risotto', 'gnocchi', 'carbonara', 'italian food', 'osso buco', 'tiramisu'], placeKw: ['italian', 'trattoria', 'osteria', 'ristorante'] },
  'best-seafood':        { title: 'Best Seafood', keywords: ['seafood', 'lobster', 'crab', 'oyster', 'shrimp', 'fish and chips', 'scallop', 'seafood boil'], placeKw: ['seafood', 'oyster', 'lobster', 'crab'] },
  'best-dessert':        { title: 'Best Desserts', keywords: ['dessert', 'cake', 'ice cream', 'gelato', 'pastry', 'donut', 'croissant', 'chocolate', 'waffle', 'crepe', 'cheesecake', 'cookie'], placeKw: ['bakery', 'dessert', 'ice cream', 'gelato', 'donut'] },
  'best-coffee':         { title: 'Best Coffee', keywords: ['coffee', 'latte', 'espresso', 'matcha latte', 'cappuccino', 'cafe'], placeKw: ['coffee', 'cafe', 'café'] },
  'best-wings':          { title: 'Best Wings', keywords: ['wings', 'chicken wings', 'hot wings', 'buffalo wings'], placeKw: ['wing'] },
  'best-caribbean':      { title: 'Best Caribbean', keywords: ['jerk chicken', 'jamaican', 'caribbean', 'oxtail', 'plantain', 'roti', 'doubles'], placeKw: ['jerk', 'jamaican', 'caribbean', 'roti'] },
  'best-middle-eastern': { title: 'Best Middle Eastern', keywords: ['falafel', 'hummus', 'manakish', 'fattoush', 'shawarma plate', 'persian', 'afghan', 'lebanese'], placeKw: ['middle eastern', 'falafel', 'lebanese', 'persian', 'afghan'] },
  'best-vegan':          { title: 'Best Vegan', keywords: ['vegan', 'plant-based', 'plant based', 'vegetarian restaurant'], placeKw: ['vegan', 'plant'] },
  'best-ayce':           { title: 'Best AYCE', keywords: ['ayce', 'all you can eat', 'buffet', 'unlimited'], placeKw: ['ayce', 'all you can eat', 'buffet'] },
  'best-late-night':     { title: 'Best Late Night', keywords: ['late night', 'midnight', '2am', '3am', 'after hours', 'late-night eats', 'open late'], placeKw: [] },
  'best-bbq':            { title: 'Best BBQ', keywords: ['bbq', 'barbeque', 'barbecue', 'brisket', 'pulled pork', 'smoked meat', 'ribs'], placeKw: ['bbq', 'barbeque', 'smokehouse'] },
  'best-noodles':        { title: 'Best Noodles', keywords: ['noodle', 'hand pulled', 'dan dan', 'udon', 'lo mein', 'chow mein', 'pad see ew'], placeKw: ['noodle'] },
  'best-fried-chicken':  { title: 'Best Fried Chicken', keywords: ['fried chicken', 'chicken sandwich', 'nashville hot', 'korean fried chicken', 'karaage'], placeKw: ['fried chicken', 'chicken'] },
  'best-shawarma':       { title: 'Best Shawarma', keywords: ['shawarma', 'donair', 'doner', 'gyro'], placeKw: ['shawarma', 'donair'] },
};

// ── Categorize ──
for (const [slug, cat] of Object.entries(CATEGORIES)) {
  cat.items = [];
}

for (const row of filtered) {
  const captionLower = (row.caption || '').toLowerCase();
  const placeLower = (row.restaurant || '').toLowerCase();
  const views = parseInt(row.views) || 0;

  // Skip very low engagement
  if (views < 500) continue;

  for (const [slug, cat] of Object.entries(CATEGORIES)) {
    const matchCaption = cat.keywords.some(kw => captionLower.includes(kw));
    const matchPlace = cat.placeKw.some(kw => placeLower.includes(kw));

    if (matchCaption || matchPlace) {
      // Dedupe: same restaurant + same creator
      const exists = cat.items.some(
        item => item.restaurant === row.restaurant && item.creator_name === row.creator_name
      );
      if (!exists) {
        cat.items.push({
          creator_name: row.creator_name,
          restaurant: row.restaurant,
          address: row.address,
          caption: row.caption,
          transcript: row.transcript,
          views,
          likes: parseInt(row.likes) || 0,
          shares: parseInt(row.shares) || 0,
          saves: parseInt(row.saves) || 0,
          source_url: row.source_url,
          video_id: row.id,
          km: parseFloat(row.km_from_downtown) || 0,
        });
      }
    }
  }
}

// ── Sort and report ──
console.log('\n=== RESULTS ===\n');
const viable = [];
const thin = [];

for (const [slug, cat] of Object.entries(CATEGORIES)) {
  cat.items.sort((a, b) => b.views - a.views);
  if (cat.items.length >= 5) {
    viable.push(slug);
    console.log(`✅ ${cat.title}: ${cat.items.length} videos`);
  } else if (cat.items.length > 0) {
    thin.push(slug);
    console.log(`⚠️  ${cat.title}: ${cat.items.length} videos (need 5+)`);
  } else {
    console.log(`❌ ${cat.title}: 0 videos`);
  }
}

console.log(`\n${viable.length} viable categories (5+ videos)`);

// ── Build output ──
const output = {
  generated: new Date().toISOString(),
  total_videos: filtered.length,
  viable_categories: viable.length,
  categories: {}
};

for (const slug of [...viable, ...thin]) {
  const cat = CATEGORIES[slug];
  output.categories[slug] = {
    title: cat.title,
    slug,
    count: cat.items.length,
    viable: cat.items.length >= 5,
    items: cat.items.slice(0, 15).map((item, i) => ({
      rank: i + 1,
      restaurant: item.restaurant,
      address: item.address,
      creator_name: item.creator_name,
      caption: item.caption,
      transcript: item.transcript,
      views: item.views,
      likes: item.likes,
      shares: item.shares,
      saves: item.saves,
      source_url: item.source_url,
      video_id: item.video_id,
    }))
  };
}

const outPath = join(root, 'data', 'articles.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nWritten to ${outPath}`);

// ── Print top 3 per viable category ──
console.log('\n=== TOP 3 PER VIABLE CATEGORY ===\n');
for (const slug of viable) {
  const cat = CATEGORIES[slug];
  console.log(`\n── ${cat.title} (${cat.items.length}) ──`);
  for (const item of cat.items.slice(0, 3)) {
    console.log(`  ${item.restaurant} — @${item.creator_name} — ${item.views.toLocaleString()} views`);
    const capPreview = (item.caption || '').replace(/\n/g, ' ').substring(0, 80);
    console.log(`    "${capPreview}..."`);
  }
}
