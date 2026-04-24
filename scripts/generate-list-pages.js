/**
 * Generate Toronto cuisine list pages from template + data.json
 *
 * Usage: node scripts/generate-list-pages.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const data = JSON.parse(readFileSync(join(root, 'data', 'toronto.json'), 'utf8'));
const template = readFileSync(join(root, 'toronto', 'best-ramen.html'), 'utf8');

const PAGES = {
  'best-burger':     { title: 'Burgers', h1: 'The 10 Best Burgers in Toronto Right Now', desc: 'Smash, wagyu, brioche — ranked by who films them best' },
  'best-sushi':      { title: 'Sushi', h1: 'The 10 Best Sushi Spots in Toronto Right Now', desc: 'From AYCE to omakase — every piece on video' },
  'best-halal':      { title: 'Halal Restaurants', h1: 'The 10 Best Halal Restaurants in Toronto Right Now', desc: 'Verified halal, every cuisine — trusted by the community' },
  'best-korean-bbq': { title: 'Korean BBQ', h1: 'The 10 Best Korean BBQ Spots in Toronto Right Now', desc: 'Grill your own — creator tested, community approved' },
  'best-brunch':     { title: 'Brunch', h1: 'The 10 Best Brunch Spots in Toronto Right Now', desc: 'Worth waking up early for — weekend tested' },
  'best-thai':       { title: 'Thai Food', h1: 'The 10 Best Thai Restaurants in Toronto Right Now', desc: 'Pad thai, curries, boat noodles — the real deal' },
  'best-steak':      { title: 'Steakhouses', h1: 'The 10 Best Steakhouses in Toronto Right Now', desc: 'Special occasions, date nights, power dinners' },
  'best-vegan':      { title: 'Vegan Restaurants', h1: 'The 10 Best Vegan Restaurants in Toronto Right Now', desc: 'Plant-based spots that even meat lovers enjoy' },
  'best-pizza':      { title: 'Pizza', h1: 'The 10 Best Pizza Spots in Toronto Right Now', desc: 'Neapolitan, New York, Detroit — slice by slice' },
  'best-ayce':       { title: 'All You Can Eat', h1: 'The 10 Best AYCE Spots in Toronto Right Now', desc: 'Maximum value, maximum food — creator approved' },
};

for (const [slug, config] of Object.entries(PAGES)) {
  const listData = data.lists[slug];
  if (!listData) {
    console.log(`Skipping ${slug} — no data found`);
    continue;
  }

  let page = template;

  // Replace slug reference
  page = page.replace("const LIST_SLUG = 'best-ramen';", `const LIST_SLUG = '${slug}';`);

  // Replace title tags and meta
  page = page.replace(/10 Best Ramen in Toronto 2026/g, `10 Best ${config.title} in Toronto 2026`);
  page = page.replace(/best ramen Toronto/g, `best ${config.title.toLowerCase()} Toronto`);
  page = page.replace(/best ramen near me/g, `best ${config.title.toLowerCase()} near me`);
  page = page.replace(/ramen restaurants Toronto/g, `${config.title.toLowerCase()} restaurants Toronto`);
  page = page.replace(/top ramen Toronto/g, `top ${config.title.toLowerCase()} Toronto`);
  page = page.replace(/tonkotsu Toronto, miso ramen Toronto, /g, '');
  page = page.replace(/tonkotsu, miso, shoyu, tsukemen/g, config.desc.split(' — ')[0]);

  // Replace URLs
  page = page.replace(/\/toronto\/best-ramen/g, `/toronto/${slug}`);
  page = page.replace(/best-ramen-toronto/g, `${slug.replace('best-', 'best-')}-toronto`);

  // Replace h1
  page = page.replace('The 10 Best Bowls of Ramen in Toronto Right Now', config.h1);

  // Replace subtitle
  page = page.replace('The bowls worth braving the cold for', config.desc);

  // Replace breadcrumb
  page = page.replace('>Best Ramen<', `>Best ${config.title}<`);

  // Replace meta descriptions
  page = page.replace(
    /The 10 best bowls of ramen in Toronto, ranked by food creators with video proof\. Tonkotsu, miso, shoyu, tsukemen — every bowl filmed so you know exactly what to order\./g,
    `The 10 best ${config.title.toLowerCase()} in Toronto, ranked by food creators with video proof. Every spot filmed so you know exactly what to expect.`
  );

  // Replace CTA text
  page = page.replace('See every bowl of ramen on video', `See every ${config.title.toLowerCase()} spot on video`);

  const outPath = join(root, 'toronto', `${slug}.html`);
  writeFileSync(outPath, page);
  console.log(`Generated: toronto/${slug}.html`);
}

console.log('\nDone! All list pages generated.');
