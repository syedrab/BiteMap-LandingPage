---
name: zine
description: >
  Generate a new fully-SEO'd BiteMap city food-zine page (a city×cuisine "best X"
  article, a neighbourhood area page, a themed guide, or a whole new city hub) from
  the Supabase CSV data. Bakes in structured data (JSON-LD), the editorial intro, the
  FAQ section, internal cross-links, and BiteMap's brand voice. Use when the user says
  "/zine", "make a zine page", "add a city", "add a cuisine page", or "new food page".
---

# /zine — BiteMap zine page factory

Produces zine pages that ship with everything the SEO engine needs, by driving the
existing Node generators rather than hand-writing HTML. The SEO logic lives in
`scripts/lib/seo.js` (structured data + intro + FAQ + cross-links); the brand voice
lives in `data/voice/*.md`. **Read those voice files before writing any prose.**

## Usage
`/zine <city> <cuisine-or-area-or-guide>` — e.g. `/zine toronto best-korean-corndog`,
`/zine miami` (new city), `/zine vancouver area-richmond`.

## Decide the case first
1. **New cuisine on an existing city** → most common.
2. **New area (neighbourhood) page** → existing city, new `area-*`.
3. **New themed guide** → Toronto only (e.g. "late-night eats").
4. **Brand-new city** → needs config + CSV + a hub.

---

## Case 1 — New cuisine page (existing city)
1. Confirm the cuisine keyword set. Add an entry to the `CATS` map:
   - Toronto: `scripts/rebuild-all.js` (also add a `CREATIVE_TITLES`, `COVER_TITLES`,
     `toc_descriptions` entry, and a `seoDescs` line for a unique meta description).
   - Other cities: `scripts/rebuild-city.js` `CATS`.
   - Shape: `'best-x':{title:'Best X',kw:[caption keywords],pkw:[restaurant-name keywords]}`.
2. The shared `buildPage()` already injects `articleJsonLd`, `editorialIntroHtml`,
   `faqsFor`, `faqSectionHtml`, and `relatedLinksHtml` — **you don't write HTML.**
3. Run the generator: `node scripts/rebuild-all.js` (Toronto) or `node scripts/rebuild-city.js`.
4. Verify (see Verify below). Add the new URL to `sitemap.xml`.

## Case 2 — New area page
Add the neighbourhood to the city's `neighborhoods` in `data/cities.json` (and to
`AREA_META` in `rebuild-all.js` for Toronto) with a `vibe` + `desc` written in BiteMap
voice. Re-run the generator. Areas need ≥3 spots with distinct creators or they're skipped.

## Case 3 — New guide (Toronto)
Add an object to the `GUIDES` array in `scripts/rebuild-all.js` with a `filter()` that
selects matching videos, plus `title/h1/kicker/marquee/desc` in voice. Re-run `rebuild-all.js`.

## Case 4 — New city
1. Drop the city's CSV at repo root (same columns as `Toronto Viral.csv`).
2. Add the city to **both** `data/cities.json` and the `CITIES` object in
   `scripts/rebuild-city.js` (`csv`, `dir`, `name`, `shortName`, `slang`, marquee/hub fields,
   `neighborhoods`). Set `lang:'en-CA'` for Canadian cities (drives schema `addressCountry`).
3. Run `node scripts/rebuild-city.js` → generates articles, areas, and a hub with full JSON-LD.
4. Add the city's pages to `sitemap.xml`; link the city from the homepage / other hubs.

---

## Writing prose (the anti-slop rule)
- The generators produce data-driven intros/FAQs automatically. If you hand-write any extra
  copy (guide decks, area descriptions, meta descriptions), match `data/voice/tone.md`,
  `vocabulary.md`, `humor.md`, `beliefs.md`. Lead with the creator + the view count; never
  open with "Looking for the best…".
- One creator per article (enforced in `buildPage` dedup). Skip `bunny_video_id === 'null'`.
  Excluded creators live in the `.filter(...)` array — add more there if asked.

## Verify (always, before declaring done)
```bash
# JSON-LD parses on the new page(s)
node -e 'const fs=require("fs");const h=fs.readFileSync(PATH,"utf8");[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].forEach((m,i)=>{try{JSON.parse(m[1]);console.log("block "+i+" OK")}catch(e){console.log("INVALID",e.message)}})'
# Internal links present (should be ~8–12, not 1)
grep -oE 'href="/CITYDIR/[^"]*"' PATH | sort -u | wc -l
# Intro + FAQ + map link rendered
grep -c 'zine-intro\|zine-faq\|map-link' PATH
```
Then serve (`python3 -m http.server 8000`) and eyeball the page on mobile width. Optionally
run Lighthouse (mobile) and confirm rich-results eligibility for FAQ + ItemList.

## Don't
- Don't run `scripts/generate-guides-areas.js` — it's deprecated and ships pages *without*
  SEO. Use `rebuild-all.js`.
- Don't hardcode JSON-LD into pages — always go through `scripts/lib/seo.js` so every city
  stays consistent.
