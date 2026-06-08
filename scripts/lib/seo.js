/**
 * Shared SEO helpers for the BiteMap zine generators.
 *
 * One source of truth for structured data (JSON-LD), the editorial intro,
 * the on-page FAQ, and the internal cross-link block — so every city page
 * (rebuild-all.js, rebuild-city.js, rebuild-city-hubs.js) stays consistent
 * and future cities inherit it for free.
 *
 * All functions are pure. Copy is data-driven (real restaurant names, creators,
 * view counts, neighbourhoods) so no two pages share boilerplate — that's the
 * anti-thin-content / anti-"AI slop" guard.
 */

const SITE = 'https://www.bitemap.fun';
const APP_STORE = 'https://apps.apple.com/ca/app/bitemap/id6746139076';
const APP_STORE_ID = '6746139076';
const ORG_ID = `${SITE}/#org`;

// ── tiny local utils (self-contained so the module has no import surface) ──
function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtV(n) {
  // Mirror the generators' local fmtV exactly so the same view count renders
  // identically on the card and in the intro/FAQ/JSON-LD on a given page.
  n = parseInt(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}
// deterministic small hash so per-page template choices vary but are stable across rebuilds
function hash(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function pick(arr, seed) {
  return arr[seed % arr.length];
}
function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}
function countryFromLang(lang) {
  return (lang || '').toLowerCase().includes('-ca') ? 'CA' : 'US';
}
function gmapsUrl(name, address) {
  const q = encodeURIComponent([name, address].filter(Boolean).join(' '));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// ── JSON-LD wrapper ──
function jsonLdScript(graph) {
  const doc = { '@context': 'https://schema.org', '@graph': graph };
  // Escape '<' so CSV-derived data containing "</script>" or "<!--" can't break
  // out of the <script> tag (truncated schema / stored XSS). JSON.stringify alone
  // produces valid JSON but does NOT neutralise these HTML sequences.
  const json = JSON.stringify(doc).replace(/[<>\u2028\u2029]/g, c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
  return `<script type="application/ld+json">${json}</script>`;
}

/**
 * Restaurant + VideoObject + ItemList + FAQPage + Breadcrumb graph for an article/guide/area page.
 * @param {object} o
 *   cityName, cityDir, lang, fileSlug, title, desc, topic, canonical, items[], faqs[{q,a}]
 */
function articleJsonLd(o) {
  const { cityName, cityDir, lang, fileSlug, title, desc, topic, canonical, items = [], faqs = [] } = o;
  const country = countryFromLang(lang);
  const pageUrl = canonical || `${SITE}/${cityDir}/${fileSlug}`;
  const graph = [];

  // Breadcrumb: Home → City hub → this page
  graph.push({
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', position: 1, name: 'BiteMap', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: `${cityName} Food Zine`, item: `${SITE}/${cityDir}` },
      { '@type': 'ListItem', position: 3, name: title, item: pageUrl },
    ],
  });

  // ItemList of ranked restaurants, each a Restaurant (+ the creator video as VideoObject)
  const elements = items.map((it, i) => {
    const restaurant = {
      '@type': 'Restaurant',
      '@id': `${pageUrl}#r${i + 1}`,
      'name': it.restaurant || `${cityName} ${topic} spot`,
      'servesCuisine': topic ? topic.replace(/\b\w/g, c => c.toUpperCase()) : 'Restaurant',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': it.address || '',
        'addressLocality': cityName,
        'addressCountry': country,
      },
    };
    if (it.video_link) restaurant.url = it.video_link.startsWith('http') ? it.video_link : SITE + it.video_link;
    if (it.hls_url && it.thumbnail) {
      const v = {
        '@type': 'VideoObject',
        'name': `${it.restaurant} — ${topic || 'food'} review by @${it.creator_name}`,
        'description': (it.quote || `${it.restaurant} reviewed on video by ${cityName} food creator @${it.creator_name}.`).slice(0, 280),
        'thumbnailUrl': it.thumbnail,
        'contentUrl': it.hls_url,
        // uploadDate intentionally omitted — no real per-video publish date exists,
        // and a fabricated constant is a false signal. Pass it.uploadDate from CSV when available.
        ...(it.uploadDate ? { uploadDate: it.uploadDate } : {}),
        'creator': { '@type': 'Person', name: `@${it.creator_name}` },
        'interactionStatistic': {
          '@type': 'InteractionCounter',
          'interactionType': 'https://schema.org/WatchAction',
          'userInteractionCount': parseInt(it.views) || 0,
        },
      };
      restaurant.subjectOf = v;
    }
    return { '@type': 'ListItem', position: i + 1, item: restaurant };
  });
  graph.push({
    '@type': 'ItemList',
    '@id': `${pageUrl}#list`,
    'name': title,
    'description': desc,
    'numberOfItems': items.length,
    'itemListOrder': 'https://schema.org/ItemListOrderDescending',
    'itemListElement': elements,
  });

  // FAQPage — same Q&A rendered visibly on the page (Google requires parity)
  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      'mainEntity': faqs.map(f => ({
        '@type': 'Question',
        'name': f.q,
        'acceptedAnswer': { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return jsonLdScript(graph);
}

/** CollectionPage + WebSite(SearchAction) + Organization for a city hub. */
function hubJsonLd(o) {
  const { cityName, cityDir, canonical } = o;
  const pageUrl = canonical || `${SITE}/${cityDir}`;
  return jsonLdScript([
    {
      '@type': 'CollectionPage',
      '@id': `${pageUrl}#page`,
      'name': `${cityName} Food Zine — BiteMap`,
      'description': `The definitive ${cityName} food guide. Best restaurants ranked by local food creators with real video reviews.`,
      'url': pageUrl,
      'isPartOf': { '@id': `${SITE}/#website` },
      'about': { '@type': 'Place', name: cityName },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      'url': SITE + '/',
      'name': 'BiteMap',
      'publisher': { '@id': ORG_ID },
      'potentialAction': {
        '@type': 'SearchAction',
        'target': { '@type': 'EntryPoint', urlTemplate: `${SITE}/${cityDir}?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', position: 1, name: 'BiteMap', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: `${cityName} Food Zine`, item: pageUrl },
      ],
    },
  ]);
}

/**
 * MobileApplication + Organization — the adapted "app" transfer.
 *
 * NOTE: aggregateRating is deliberately NOT emitted. Google requires aggregateRating
 * to reflect genuine reviews present on the page; a hardcoded/invented rating is a
 * structured-data policy violation (manual-action risk). To enable it, pass REAL,
 * current App Store numbers via `rating` — e.g. appReviewJsonLd({ratingValue:'4.7',ratingCount:'342'})
 * — wired from the live App Store Connect figures, and keep them in sync.
 */
function appReviewJsonLd(o = {}) {
  const app = {
    '@type': 'MobileApplication',
    'name': 'BiteMap',
    'operatingSystem': 'iOS',
    'applicationCategory': 'FoodAndDrinkApplication',
    'url': APP_STORE,
    'offers': { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
  if (o.rating && o.rating.ratingValue && o.rating.ratingCount) {
    app.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(o.rating.ratingValue),
      ratingCount: String(o.rating.ratingCount),
      bestRating: '5',
    };
  }
  return jsonLdScript([
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      'name': 'BiteMap',
      'url': SITE + '/',
      'logo': `${SITE}/images/bitemap-logo.png`,
      'sameAs': [APP_STORE],
    },
    app,
  ]);
}

// ── Editorial intro (data-driven, zine voice) ──
function topNeighborhoods(items, n = 3) {
  return uniq(items.map(it => it.hood)).slice(0, n);
}
function editorialIntroHtml(o) {
  const { title, topic, cityName, slang, items = [], kind } = o;
  if (items.length < 3) return '';
  const seed = hash(title + cityName);
  const top = items[0];
  const second = items[1];
  const count = items.length;
  const hoods = topNeighborhoods(items, 3);
  const place = slang || cityName;
  const topic_ = (topic || title).toLowerCase();
  const hoodLine = hoods.length >= 2
    ? `From ${esc(hoods[0])} to ${esc(hoods[hoods.length - 1])},`
    : `Across ${esc(cityName)},`;

  // a few interchangeable openers so pages don't read identically
  const openers = [
    `We watched the tape so you don't have to.`,
    `No ads, no sponsors, no list bait — just the receipts.`,
    `Ranked by people who actually filmed the food.`,
    `The creators did the legwork. We just counted the views.`,
  ];
  const opener = pick(openers, seed);

  const lead = kind === 'area'
    ? `${opener} These are the spots ${esc(cityName)} food creators keep going back to in ${esc(title.replace(/\.$/, ''))} — ${count} of them, every one on video.`
    : kind === 'guide'
      ? `${opener} ${count} ${esc(topic_)} picks pulled straight from ${esc(place)}'s most-watched food clips.`
      : `${opener} We pulled the ${count} most-watched ${esc(topic_)} spots in ${esc(place)} and ranked them by the only metric that doesn't lie: how many people actually watched.`;

  const proof = top
    ? `<strong>${esc(top.restaurant)}</strong> takes the top slot — @${esc(top.creator_name)}'s clip alone pulled <strong>${fmtV(top.views)} views</strong>${second ? `, with <strong>${esc(second.restaurant)}</strong> close behind` : ''}. ${hoodLine} here's where to eat, with a video to prove it.`
    : '';

  return `
<section class="zine-intro">
  <p class="zine-intro-lead">${lead}</p>
  <p class="zine-intro-proof">${proof}</p>
</section>`;
}

// ── FAQ (data-driven Q&A; also feeds FAQPage schema) ──
function faqsFor(o) {
  const { title, topic, cityName, items = [], kind } = o;
  if (items.length < 3) return [];
  const top = items[0], second = items[1], third = items[2];
  const label = (title || '').replace(/[.?]+$/, '');           // human display title
  const topic_ = (topic || '').toLowerCase().replace(/[.?]+$/, '');
  // a noun that reads naturally in every question
  const noun = topic_ ? `${topic_} spots` : kind === 'area' ? 'spots' : 'picks';
  const nounSingularList = topic_ ? `${topic_} list` : `${label.toLowerCase()} list`;
  const faqs = [];

  faqs.push({
    q: kind === 'area'
      ? `Where should I eat in ${label}?`
      : topic_
        ? `What is the best ${topic_} in ${cityName}?`
        : `What's on BiteMap's ${label} list for ${cityName}?`,
    a: `${top.restaurant} is the most-watched ${topic_ || 'pick'} on BiteMap right now — @${top.creator_name}'s video hit ${fmtV(top.views)} views.` +
       (second && third ? ` ${second.restaurant} and ${third.restaurant} round out the top three.` : ''),
  });

  faqs.push({
    q: `How are these ${noun} ranked?`,
    a: `By real video reviews from ${cityName} food creators — view counts, likes and saves, not paid placements. Every spot on this page has a clip you can watch before you go.`,
  });

  const hoods = topNeighborhoods(items, 4).map(esc);
  if (hoods.length >= 2 && kind !== 'area') {
    faqs.push({
      q: `Which ${cityName} neighbourhoods do these ${noun} cover?`,
      a: `Right now the strongest picks are spread across ${hoods.slice(0, -1).join(', ')} and ${hoods[hoods.length - 1]}. Tap any card to see the exact address and the creator's review.`,
    });
  }

  faqs.push({
    q: `Are BiteMap's reviews sponsored?`,
    a: `No. BiteMap ranks spots by genuine creator videos and engagement, never paid promotion. If a place is on this list, a real food creator filmed it and people actually watched.`,
  });

  faqs.push({
    q: `How often is this ${nounSingularList} updated?`,
    a: `It refreshes as new ${cityName} food videos go viral — we drop new lists every Friday. Get the BiteMap app to see what's trending near you in real time.`,
  });

  return faqs;
}

function faqSectionHtml(faqs) {
  if (!faqs || !faqs.length) return '';
  const rows = faqs.map((f, i) => `
    <details class="zine-faq-item"${i === 0 ? ' open' : ''}>
      <summary>${esc(f.q)}</summary>
      <div class="zine-faq-a">${esc(f.a)}</div>
    </details>`).join('');
  return `
<section class="zine-faq">
  <h2 class="zine-faq-h">Questions, Answered</h2>${rows}
</section>`;
}

// ── Internal cross-links ──
/**
 * @param {object} o cityDir, currentFileSlug, links[{href,label,sub}]
 * links should already be filtered to exclude the current page.
 */
function relatedLinksHtml(o) {
  const { cityDir, currentFileSlug, links = [] } = o;
  const items = links.filter(l => l.href && !l.href.endsWith('/' + currentFileSlug)).slice(0, 9);
  if (!items.length) return '';
  const cells = items.map(l =>
    `<a href="${esc(l.href)}">${esc(l.label)}${l.sub ? `<span class="sub">${esc(l.sub)}</span>` : ''}</a>`
  ).join('');
  return `
<section class="zine-related">
  <h2 class="zine-related-h">Keep Eating →</h2>
  <div class="zine-related-grid">${cells}<a href="/${esc(cityDir)}" class="zine-related-hub">Back to the ${esc(cityDir)} zine<span class="sub">all lists</span></a></div>
</section>`;
}

/**
 * Build cross-link candidates from a generator's own article/guide/area lists.
 * Rotates the slice by a per-page seed so different pages link to different
 * siblings (spreads internal link equity, avoids identical blocks).
 * @param {object} o cityDir, currentFileSlug, articles[{fileSlug,label,sub}], guides[], areas[]
 */
function pickRelatedLinks(o) {
  const { cityDir, currentFileSlug, articles = [], guides = [], areas = [] } = o;
  const seed = hash(currentFileSlug);
  const rotate = (arr, k) => arr.length ? arr.slice(k % arr.length).concat(arr.slice(0, k % arr.length)) : arr;
  const toLink = x => ({ href: `/${cityDir}/${x.fileSlug}`, label: x.label, sub: x.sub });
  const a = rotate(articles.filter(x => x.fileSlug !== currentFileSlug), seed).slice(0, 5).map(toLink);
  const g = rotate(guides.filter(x => x.fileSlug !== currentFileSlug), seed + 1).slice(0, 2).map(toLink);
  const r = rotate(areas.filter(x => x.fileSlug !== currentFileSlug), seed + 2).slice(0, 2).map(toLink);
  return [...a, ...g, ...r];
}

// CSS injected once per page (scoped to the new zine SEO blocks)
const SEO_CSS = `
.zine-intro{position:relative;z-index:10;max-width:760px;margin:.2rem auto 0;padding:1rem 2rem .2rem;font-family:'Special Elite',monospace}
.zine-intro-lead{font-size:1rem;line-height:1.5;margin:0 0 .6rem}
.zine-intro-proof{font-size:.85rem;line-height:1.55;opacity:.85;margin:0}
.zine-intro strong{color:var(--red)}
.zine-faq{position:relative;z-index:10;max-width:760px;margin:.5rem auto 1rem;padding:0 2rem}
.zine-faq-h,.zine-related-h{font-family:'Shrikhand',cursive;color:var(--red);text-shadow:1.5px 1.5px 0 var(--ink);font-size:1.4rem;margin:.5rem 0 .8rem;transform:rotate(-1deg)}
.zine-faq-item{border:2px solid var(--ink);background:var(--paper);box-shadow:3px 4px 0 rgba(0,0,0,.12);margin-bottom:.6rem;padding:.1rem .8rem}
.zine-faq-item summary{cursor:pointer;font-family:'Archivo Black';font-size:.85rem;padding:.6rem 0;list-style:none}
.zine-faq-item summary::-webkit-details-marker{display:none}
.zine-faq-item summary::after{content:'+';float:right;color:var(--red);font-size:1.1rem}
.zine-faq-item[open] summary::after{content:'–'}
.zine-faq-a{font-family:'Special Elite',monospace;font-size:.82rem;line-height:1.55;padding:0 0 .7rem;opacity:.85}
.zine-related{position:relative;z-index:10;max-width:1100px;margin:.5rem auto 2rem;padding:0 2rem}
.zine-related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.6rem}
.zine-related-grid a{display:block;padding:.6rem .7rem;border:2px solid var(--ink);background:var(--paper);text-decoration:none;color:inherit;font-family:'Archivo Black';font-size:.72rem;letter-spacing:.04em;transition:all .2s;box-shadow:2px 3px 0 rgba(0,0,0,.12)}
.zine-related-grid a:hover{background:var(--red);color:var(--paper);transform:rotate(-1deg)}
.zine-related-grid a .sub{display:block;font-family:'DM Mono';font-weight:400;font-size:.58rem;opacity:.7;margin-top:.2rem;letter-spacing:.1em}
.zine-related-hub{background:var(--ink)!important;color:var(--paper)!important}
.review .map-link{display:inline-block;margin-top:.35rem;font-family:'DM Mono',monospace;font-size:.6rem;letter-spacing:.04em;color:var(--red);text-decoration:none;border-bottom:1px dashed var(--red)}
.review .map-link:hover{background:var(--red);color:var(--paper);border-color:var(--red)}
@media(max-width:700px){.zine-intro,.zine-faq{padding-left:1rem;padding-right:1rem}.zine-related{padding:0 1rem}}
`;

export {
  gmapsUrl,
  articleJsonLd, hubJsonLd, appReviewJsonLd,
  editorialIntroHtml, faqsFor, faqSectionHtml,
  relatedLinksHtml, pickRelatedLinks,
  SEO_CSS,
};
