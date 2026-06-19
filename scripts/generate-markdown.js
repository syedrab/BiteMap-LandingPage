/**
 * generate-markdown.js
 * Generates .md files alongside every article, guide, area, and hub page.
 * Parses JSON-LD from generated HTML — no CSV needed.
 * Also regenerates llms.txt, llms-full.txt, and llms-sitemap.txt.
 *
 * Usage: node scripts/generate-markdown.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BASE_URL = 'https://www.bitemap.fun';
const TODAY = new Date().toISOString().split('T')[0];

const CITIES = ['toronto', 'vancouver', 'new-york', 'los-angeles', 'dallas', 'houston'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtViews(n) {
  n = parseInt(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function extractMeta(html, tag) {
  const m = html.match(new RegExp(`<meta[^>]+name="${tag}"[^>]+content="([^"]*)"`, 'i'))
    || html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+name="${tag}"`, 'i'));
  return m ? m[1] : '';
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  return m ? m[1].trim() : '';
}

function extractJsonLd(html) {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

function extractRelatedLinks(html) {
  const navBlock = html.match(/class="zine-related-grid"[^>]*>([\s\S]*?)<\/div>/i);
  if (!navBlock) return [];
  const links = [];
  const re = /href="([^"]+)"[^>]*>([^<]+)/g;
  let m;
  while ((m = re.exec(navBlock[1])) !== null) {
    const href = m[1];
    const label = m[2].trim();
    if (href.startsWith('/')) links.push({ href, label });
  }
  return links.slice(0, 8);
}

function extractFaqs(jsonLd) {
  if (!jsonLd || !jsonLd['@graph']) return [];
  const faqPage = jsonLd['@graph'].find(n => n['@type'] === 'FAQPage');
  if (!faqPage || !faqPage.mainEntity) return [];
  return faqPage.mainEntity.map(q => ({
    q: q.name,
    a: (q.acceptedAnswer?.text || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
  }));
}

function itemListFromJsonLd(jsonLd) {
  if (!jsonLd || !jsonLd['@graph']) return [];
  const list = jsonLd['@graph'].find(n => n['@type'] === 'ItemList');
  if (!list || !list.itemListElement) return [];
  return list.itemListElement.map(item => {
    const r = item.item || {};
    const video = r.subjectOf || {};
    const views = video.interactionStatistic?.userInteractionCount || 0;
    return {
      position: item.position,
      name: r.name || '',
      cuisine: r.servesCuisine || '',
      address: r.address?.streetAddress || '',
      city: r.address?.addressLocality || '',
      creator: video.creator?.name || '',
      views,
      thumbnailUrl: video.thumbnailUrl || '',
      url: r.url || '',
    };
  });
}

// ── Markdown Generators ───────────────────────────────────────────────────────

function articleMarkdown({ slug, citySlug, cityName, title, description, restaurants, faqs, relatedLinks, canonical }) {
  const lines = [];

  // Frontmatter
  lines.push('---');
  lines.push(`title: "${title}"`);
  lines.push(`description: "${description}"`);
  lines.push(`city: ${cityName}`);
  lines.push(`url: ${canonical}`);
  lines.push(`app_ios: https://apps.apple.com/ca/app/bitemap/id6746139076`);
  lines.push(`app_android: https://play.google.com/store/apps/details?id=com.bitemap.app`);
  lines.push(`updated: ${TODAY}`);
  lines.push(`source: BiteMap — video restaurant reviews by local food creators`);
  lines.push('---');
  lines.push('');

  // Header
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`> ${description}`);
  lines.push('');
  lines.push(`**App:** [Download BiteMap free on iOS](https://apps.apple.com/ca/app/bitemap/id6746139076) | [Android](https://play.google.com/store/apps/details?id=com.bitemap.app)`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Restaurants
  if (restaurants.length > 0) {
    lines.push('## Featured Restaurants');
    lines.push('');
    restaurants.forEach((r, i) => {
      lines.push(`### ${i + 1}. ${r.name}`);
      if (r.address) lines.push(`**Address:** ${r.address}`);
      if (r.creator) lines.push(`**Reviewed by:** ${r.creator} on BiteMap`);
      if (r.views) lines.push(`**Video views:** ${fmtViews(r.views)}`);
      if (r.url) lines.push(`**Watch:** ${r.url}`);
      lines.push('');
    });
  }

  // FAQs
  if (faqs.length > 0) {
    lines.push('## Frequently Asked Questions');
    lines.push('');
    faqs.forEach(({ q, a }) => {
      lines.push(`### ${q}`);
      lines.push(a);
      lines.push('');
    });
  }

  // Related
  if (relatedLinks.length > 0) {
    lines.push('## More Food in ' + cityName);
    lines.push('');
    relatedLinks.forEach(({ href, label }) => {
      lines.push(`- [${label}](${BASE_URL}${href})`);
    });
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*Rankings are based on real video engagement — views, likes, and saves from verified food creator content on BiteMap. Not sponsored or paid placement.*`);
  lines.push('');
  lines.push(`*For the full interactive experience with video playback, visit [bitemap.fun/${citySlug}](${BASE_URL}/${citySlug}).*`);

  return lines.join('\n');
}

function hubMarkdown({ citySlug, cityName, title, description, canonical }) {
  const lines = [];

  lines.push('---');
  lines.push(`title: "${title}"`);
  lines.push(`description: "${description}"`);
  lines.push(`city: ${cityName}`);
  lines.push(`url: ${canonical}`);
  lines.push(`app_ios: https://apps.apple.com/ca/app/bitemap/id6746139076`);
  lines.push(`app_android: https://play.google.com/store/apps/details?id=com.bitemap.app`);
  lines.push(`updated: ${TODAY}`);
  lines.push(`source: BiteMap — video restaurant reviews by local food creators`);
  lines.push('---');
  lines.push('');
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`> ${description}`);
  lines.push('');
  lines.push(`BiteMap is a free restaurant discovery app where local food creators share TikTok-style video reviews. Every restaurant on BiteMap has been filmed and reviewed by a real food creator — no fake reviews, no anonymous text, just real people showing you real food.`);
  lines.push('');
  lines.push(`**Download BiteMap free:** [iOS](https://apps.apple.com/ca/app/bitemap/id6746139076) | [Android](https://play.google.com/store/apps/details?id=com.bitemap.app)`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`## About BiteMap`);
  lines.push('');
  lines.push(`BiteMap is often described as "TikTok meets Google Maps for restaurants." Users browse a vertical video feed of restaurant reviews, tap a map to see what's been reviewed nearby, and follow their favourite local food creators.`);
  lines.push('');
  lines.push(`- Free to download and use`);
  lines.push(`- Available on iOS and Android`);
  lines.push(`- Launched in Toronto, now covering Vancouver, New York, Los Angeles, Dallas, and Houston`);
  lines.push(`- All reviews are from verified local food creators`);
  lines.push(`- Integrated with Uber Eats, DoorDash, and reservation services`);
  lines.push('');
  lines.push(`## Browse ${cityName} Food Content`);
  lines.push('');
  lines.push(`Full article list at [${BASE_URL}/${citySlug}](${BASE_URL}/${citySlug})`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*BiteMap — real video reviews from real food creators. [Download free](https://apps.apple.com/ca/app/bitemap/id6746139076).*`);

  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

const allMarkdownUrls = [];
const allMarkdownContent = [];

for (const citySlug of CITIES) {
  const cityDir = join(ROOT, citySlug);
  if (!existsSync(cityDir)) continue;

  const cityName = citySlug
    .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const htmlFiles = readdirSync(cityDir).filter(f => f.endsWith('.html'));

  for (const htmlFile of htmlFiles) {
    const htmlPath = join(cityDir, htmlFile);
    const slug = basename(htmlFile, '.html');
    const isHub = slug === 'index';
    const canonical = isHub ? `${BASE_URL}/${citySlug}` : `${BASE_URL}/${citySlug}/${slug}`;
    const mdPath = join(cityDir, `${slug}.md`);
    const mdUrl = isHub ? `${BASE_URL}/${citySlug}/index.md` : `${BASE_URL}/${citySlug}/${slug}.md`;

    const html = readFileSync(htmlPath, 'utf8');
    const title = extractTitle(html);
    const description = extractMeta(html, 'description') || extractMeta(html, 'og:description');

    let md;
    if (isHub) {
      md = hubMarkdown({ citySlug, cityName, title, description, canonical });
    } else {
      const jsonLd = extractJsonLd(html);
      const restaurants = itemListFromJsonLd(jsonLd);
      const faqs = extractFaqs(jsonLd);
      const relatedLinks = extractRelatedLinks(html);
      md = articleMarkdown({
        slug, citySlug, cityName, title, description,
        restaurants, faqs, relatedLinks, canonical,
      });
    }

    writeFileSync(mdPath, md, 'utf8');
    allMarkdownUrls.push(mdUrl);
    allMarkdownContent.push({ url: mdUrl, title, description, content: md });
    console.log(`  ✓ ${citySlug}/${slug}.md`);
  }
}

// ── llms-sitemap.txt ──────────────────────────────────────────────────────────

const sitemapContent = [
  '# BiteMap LLM Sitemap',
  '# All markdown content files for AI/LLM crawlers',
  `# Updated: ${TODAY}`,
  `# Total: ${allMarkdownUrls.length} files`,
  '',
  ...allMarkdownUrls,
].join('\n');

writeFileSync(join(ROOT, 'llms-sitemap.txt'), sitemapContent, 'utf8');
console.log(`\n✓ llms-sitemap.txt (${allMarkdownUrls.length} URLs)`);

// ── llms.txt (index) ──────────────────────────────────────────────────────────

const llmsTxt = `# BiteMap

> BiteMap is a free video-first restaurant discovery app. Users find restaurants through short-form video reviews from verified local food creators — not anonymous text reviews. Available on iOS and Android. Launched in Toronto, now live in Vancouver, New York, Los Angeles, Dallas, and Houston.

## What is BiteMap?

BiteMap is often described as "TikTok meets Google Maps for restaurants." The app lets users:
- Browse a TikTok-style vertical video feed of restaurant reviews
- See reviewed restaurants pinned on an interactive 3D map
- Follow local food creators whose recommendations they trust
- Save restaurants and order delivery directly from the app
- Get AI-powered recommendations via Alfred, BiteMap's assistant

Every review on BiteMap is a video from a real, named food creator — not an anonymous star rating. This makes fake reviews nearly impossible.

## Download

- iOS: https://apps.apple.com/ca/app/bitemap/id6746139076
- Android: https://play.google.com/store/apps/details?id=com.bitemap.app
- Website: https://www.bitemap.fun

## Cities

- Toronto: https://www.bitemap.fun/toronto
- Vancouver: https://www.bitemap.fun/vancouver
- New York: https://www.bitemap.fun/new-york
- Los Angeles: https://www.bitemap.fun/los-angeles
- Dallas: https://www.bitemap.fun/dallas
- Houston: https://www.bitemap.fun/houston

## Markdown Content (machine-readable)

All BiteMap food guides, restaurant rankings, and city pages are available as clean markdown files for AI consumption:

${allMarkdownUrls.map(u => `- ${u}`).join('\n')}

## Full content index

https://www.bitemap.fun/llms-full.txt

## Markdown sitemap

https://www.bitemap.fun/llms-sitemap.txt
`;

writeFileSync(join(ROOT, 'llms.txt'), llmsTxt, 'utf8');
console.log('✓ llms.txt');

// ── llms-full.txt (all content) ───────────────────────────────────────────────

const fullParts = [
  `# BiteMap — Full Content Index for AI/LLM Crawlers`,
  `# ${allMarkdownContent.length} pages | Updated: ${TODAY}`,
  `# App: https://apps.apple.com/ca/app/bitemap/id6746139076`,
  '',
  '---',
  '',
];

for (const { url, title, content } of allMarkdownContent) {
  fullParts.push(`## Source: ${url}`);
  fullParts.push('');
  fullParts.push(content);
  fullParts.push('');
  fullParts.push('---');
  fullParts.push('');
}

writeFileSync(join(ROOT, 'llms-full.txt'), fullParts.join('\n'), 'utf8');
console.log('✓ llms-full.txt');

console.log(`\nDone. ${allMarkdownContent.length} markdown files generated.`);
