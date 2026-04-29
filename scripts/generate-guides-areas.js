/**
 * Generate 10 creative GUIDES and 10 AREA pages from the Supabase CSV.
 *
 * GUIDES = themed editorial pieces (not just "best X" cuisine lists)
 * AREAS = neighborhood-focused pages
 *
 * Usage: node scripts/generate-guides-areas.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── CSV Parser ──
function parseCSV(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { current.push(field.trim()); field = ''; }
      else if (ch === '\n') { current.push(field.trim()); if (current.length > 1) rows.push(current); current = []; field = ''; }
      else if (ch !== '\r') { field += ch; }
    }
  }
  if (field || current.length) { current.push(field.trim()); if (current.length > 1) rows.push(current); }
  return rows;
}

const csvPath = join(root, 'Supabase Snippet Find Videos Near Toronto.csv');
const raw = readFileSync(csvPath, 'utf8');
const allRows = parseCSV(raw);
const headers = allRows[0];
const data = allRows.slice(1).map(row => {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i] || ''; });
  obj.views = parseInt(obj.views) || 0;
  obj.likes = parseInt(obj.likes) || 0;
  obj.saves = parseInt(obj.saves) || 0;
  obj.shares = parseInt(obj.shares) || 0;
  return obj;
}).filter(r => !['callmecandace.tv', 'brazilianfoodie'].includes(r.creator_name) && r.views >= 500);

console.log(`${data.length} videos loaded\n`);

// ── Helpers ──
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtV(n) { if(n>=1e6) return (n/1e6).toFixed(1)+'M'; if(n>=1e3) return (n/1e3).toFixed(1)+'K'; return String(n); }
function cleanCap(c) { return (c||'').replace(/#\S+/g,'').replace(/@\S+/g,'').trim(); }
function extractQuote(cap, trans) {
  const c = cleanCap(cap);
  const s = c.split(/[.!?]+/).filter(x=>x.trim().length>15);
  if(s.length) { const q=s[0].trim(); return q.length>120?q.substring(0,120)+'...':q; }
  const t = cleanTranscript(trans);
  const ts = t.split(/[.!?]+/).filter(x=>x.trim().length>15);
  if(ts.length) { const q=ts[0].trim(); return q.length>120?q.substring(0,120)+'...':q; }
  return c.substring(0,100);
}
function cleanTranscript(t) {
  if(!t) return '';
  return t.replace(/Start Time\tEnd Time\tSubtitle\n?/g,'').replace(/\d{2}:\d{2}:\d{2}\t\d{2}:\d{2}:\d{2}\t/g,'').replace(/\n+/g,' ').trim();
}

// ── Extract neighborhood from address ──
function getHood(addr) {
  const a = (addr||'').toLowerCase();
  if(a.includes('chinatown') || (a.includes('spadina') && a.includes('dundas'))) return 'Chinatown';
  if(a.includes('kensington')) return 'Kensington Market';
  if(a.includes('queen st w') || a.includes('queen west')) return 'Queen West';
  if(a.includes('queen st e') || a.includes('queen east') || a.includes('leslieville')) return 'Leslieville';
  if(a.includes('danforth') || a.includes('greektown')) return 'The Danforth';
  if(a.includes('yorkville') || a.includes('bloor st') || a.includes('bay st')) return 'Yorkville & Bloor';
  if(a.includes('king st w') || a.includes('king west') || a.includes('liberty')) return 'King West';
  if(a.includes('king st e') || a.includes('distillery')) return 'Distillery & King East';
  if(a.includes('college st') || a.includes('little italy')) return 'Little Italy';
  if(a.includes('ossington') || a.includes('dundas st w')) return 'Ossington & Dundas W';
  if(a.includes('yonge st') || a.includes('yonge-dundas') || a.includes('dundas sq')) return 'Downtown Yonge';
  if(a.includes('scarborough') || a.includes('markham') || a.includes('agincourt')) return 'Scarborough';
  if(a.includes('north york') || a.includes('finch') || a.includes('sheppard')) return 'North York';
  if(a.includes('mississauga')) return 'Mississauga';
  if(a.includes('etobicoke') || a.includes('islington')) return 'Etobicoke';
  if(a.includes('richmond hill') || a.includes('vaughan') || a.includes('markham rd')) return 'North of the City';
  if(a.includes('st clair') || a.includes('corso italia')) return 'St. Clair';
  if(a.includes('spadina')) return 'Spadina';
  if(a.includes('front st') || a.includes('union station') || a.includes('harbourfront')) return 'Waterfront';
  if(a.includes('annex') || a.includes('bathurst')) return 'The Annex';
  if(a.includes('eglinton')) return 'Midtown';
  if(a.includes('Junction') || a.includes('junction')) return 'The Junction';
  if(a.includes('toronto')) return 'Greater Toronto';
  return 'Greater Toronto';
}

// Tag each video with neighborhood
data.forEach(v => { v.hood = getHood(v.address); });

// ═══════════════════════════════════════
// GUIDES — 10 creative themed editorial pieces
// ═══════════════════════════════════════
const GUIDES = [
  {
    slug: 'most-viral',
    title: 'MOST VIRAL',
    h1: 'Most Viral.',
    kicker: 'THE ALGORITHM SPOKE',
    marquee: 'MOST VIRAL TORONTO FOOD VIDEOS · MILLIONS OF VIEWS',
    desc: 'The Toronto food videos that broke the internet. Sorted by raw view count — no editorial filter, just what the people watched.',
    filter: () => [...data].sort((a,b) => b.views - a.views).slice(0, 12),
  },
  {
    slug: 'hidden-gems',
    title: 'HIDDEN GEMS',
    h1: 'Hidden Gems.',
    kicker: 'OFF THE BEATEN PATH',
    marquee: 'SPOTS YOU\'VE NEVER HEARD OF · HIDDEN GEMS · SLEEPER HITS',
    desc: 'The restaurants nobody talks about but everyone should. Low follower count, massive impact. These are the spots the algorithm missed.',
    filter: () => [...data].filter(v => v.views < 500000 && v.views > 10000 && v.likes > 1000).sort((a,b) => (b.likes/Math.max(b.views,1)) - (a.likes/Math.max(a.views,1))).slice(0, 12),
  },
  {
    slug: 'under-15',
    title: 'UNDER $15',
    h1: 'Under $15.',
    kicker: 'BUDGET KINGS',
    marquee: 'FULL MEALS UNDER $15 · CHEAP EATS · BROKE BUT HUNGRY',
    desc: 'Full meals for under fifteen dollars. In this economy? Yeah. These creators found them so you don\'t have to eat at home.',
    filter: () => data.filter(v => {
      const c = (v.caption||'').toLowerCase();
      return c.includes('cheap') || c.includes('budget') || c.includes('under $') || c.includes('$1') || c.includes('affordable') || c.includes('dollar');
    }).sort((a,b) => b.views - a.views).slice(0, 12),
  },
  {
    slug: 'date-night',
    title: 'DATE NIGHT',
    h1: 'Date Night.',
    kicker: 'IMPRESS SOMEONE',
    marquee: 'DATE NIGHT · ROMANCE · CANDLES · MAKE IT COUNT',
    desc: 'Where to take someone when you actually care. Ambiance, plating, the whole performance. These spots make you look good.',
    filter: () => data.filter(v => {
      const c = (v.caption + ' ' + v.restaurant).toLowerCase();
      return c.includes('date') || c.includes('romantic') || c.includes('fancy') || c.includes('fine dining') || c.includes('special occasion') || c.includes('anniversary') || c.includes('omakase') || c.includes('prix fixe');
    }).sort((a,b) => b.views - a.views).slice(0, 12),
  },
  {
    slug: 'creators-picks',
    title: 'CREATORS\' PICKS',
    h1: 'Creators\' Picks.',
    kicker: 'WHAT THEY ACTUALLY EAT',
    marquee: 'WHERE THE CREATORS ACTUALLY EAT · NOT SPONSORED · REAL PICKS',
    desc: 'Not the sponsored posts. Not the brand deals. These are the spots Toronto\'s biggest food creators go back to on their own dime.',
    filter: () => {
      const creatorBest = {};
      data.forEach(v => {
        if(!v.caption.toLowerCase().includes('sponsor') && !v.caption.toLowerCase().includes('partner') && !v.caption.toLowerCase().includes('#ad')) {
          if(!creatorBest[v.creator_name] || v.views > creatorBest[v.creator_name].views) {
            creatorBest[v.creator_name] = v;
          }
        }
      });
      return Object.values(creatorBest).sort((a,b) => b.views - a.views).slice(0, 12);
    },
  },
  {
    slug: 'spice-scale',
    title: 'SPICE SCALE',
    h1: 'Spice Scale.',
    kicker: 'BRING MILK',
    marquee: 'HOTTEST FOOD IN TORONTO · SPICY · FIRE · SWEAT · TEARS',
    desc: 'The spots that made creators sweat on camera. From gentle warmth to "call an ambulance." Ranked by how much they suffered.',
    filter: () => data.filter(v => {
      const c = (v.caption + ' ' + (v.transcript||'')).toLowerCase();
      return c.includes('spicy') || c.includes('hot sauce') || c.includes('chili') || c.includes('fire') || c.includes('buldak') || c.includes('ghost pepper') || c.includes('carolina reaper') || c.includes('samyang');
    }).sort((a,b) => b.views - a.views).slice(0, 12),
  },
  {
    slug: 'mukbang-approved',
    title: 'MUKBANG APPROVED',
    h1: 'Mukbang Approved.',
    kicker: 'BIG PORTIONS ONLY',
    marquee: 'MUKBANG · BIG PORTIONS · EATING SHOWS · FEED THE SOUL',
    desc: 'The spots with portions so big they became content. If a mukbang creator went there, the portions are certified massive.',
    filter: () => data.filter(v => {
      const c = (v.caption + ' ' + (v.transcript||'')).toLowerCase();
      return c.includes('mukbang') || c.includes('eating show') || c.includes('food challenge') || c.includes('huge portion') || c.includes('massive');
    }).sort((a,b) => b.views - a.views).slice(0, 12),
  },
  {
    slug: 'first-bite-reaction',
    title: 'FIRST BITE REACTIONS',
    h1: 'First Bite.',
    kicker: 'THE FACE SAYS IT ALL',
    marquee: 'FIRST BITE · REACTIONS · THAT FACE · YOU KNOW THE ONE',
    desc: 'You know the moment — the first bite where the creator\'s face tells you everything. These are the spots that made them lose it on camera.',
    filter: () => data.filter(v => {
      const c = (v.caption + ' ' + (v.transcript||'')).toLowerCase();
      return c.includes('first time') || c.includes('trying') || c.includes('never had') || c.includes('honest review') || c.includes('food review') || c.includes('taste test');
    }).sort((a,b) => b.views - a.views).slice(0, 12),
  },
  {
    slug: 'comfort-food',
    title: 'COMFORT FOOD',
    h1: 'Comfort Food.',
    kicker: 'SOUL WARMING',
    marquee: 'COMFORT FOOD · SOUP · NOODLES · WARMTH · HOME COOKING ENERGY',
    desc: 'When you need food that feels like a hug. Soup, noodles, rice bowls, anything that makes winter in the 6ix bearable.',
    filter: () => data.filter(v => {
      const c = (v.caption + ' ' + (v.transcript||'')).toLowerCase();
      return c.includes('comfort') || c.includes('cozy') || c.includes('warm') || c.includes('soul') || c.includes('home cooking') || c.includes('soup') || c.includes('stew') || c.includes('mac and cheese');
    }).sort((a,b) => b.views - a.views).slice(0, 12),
  },
  {
    slug: 'worth-the-hype',
    title: 'WORTH THE HYPE',
    h1: 'Worth the Hype?',
    kicker: 'HYPE CHECK',
    marquee: 'VIRAL SPOTS · WORTH IT? · HYPE CHECK · THE VERDICT',
    desc: 'Every hyped spot gets a reality check. Creators visited the most talked-about restaurants in Toronto and gave their honest take.',
    filter: () => data.filter(v => {
      const c = (v.caption + ' ' + (v.transcript||'')).toLowerCase();
      return c.includes('hype') || c.includes('viral') || c.includes('worth it') || c.includes('overrated') || c.includes('honest review') || c.includes('finally tried');
    }).sort((a,b) => b.views - a.views).slice(0, 12),
  },
];

// ═══════════════════════════════════════
// AREAS — 10 neighborhood pages
// ═══════════════════════════════════════
const hoodCounts = {};
data.forEach(v => { hoodCounts[v.hood] = (hoodCounts[v.hood]||0)+1; });
const topHoods = Object.entries(hoodCounts).sort((a,b)=>b[1]-a[1]);
console.log('Neighborhoods:');
topHoods.forEach(([h,c]) => console.log(`  ${h}: ${c}`));

const AREA_META = {
  'Scarborough': { desc: 'Where Toronto\'s best-kept food secrets live. Strip mall gold. Parking lot legends. The drive is the price of admission.', vibe: 'STRIP MALL ROYALTY' },
  'North York': { desc: 'Korean BBQ rows, Persian ice cream, and every AYCE spot worth the elastic waistband. Yonge & Finch energy.', vibe: 'SUBURBAN HEAT' },
  'Mississauga': { desc: 'The 905 doesn\'t play. South Asian feasts, halal everything, and portions that feed your entire family plus the neighbors.', vibe: 'THE 905' },
  'Downtown Yonge': { desc: 'Tourist traps and genuine gems, side by side. Knowing the difference is what separates locals from visitors.', vibe: 'MAIN STRIP' },
  'Ossington & Dundas W': { desc: 'Where the cool kids eat. Natural wine bars next to $3 banh mi. The gentrification buffet, served daily.', vibe: 'COOL KID CORRIDOR' },
  'Greater Toronto': { desc: 'The spots that don\'t fit a neat neighborhood box but absolutely belong in your rotation. GTA at large.', vibe: 'ALL OVER THE MAP' },
  'Chinatown': { desc: 'Spadina to Dundas. Hand-pulled noodles at 1AM. Dim sum carts at dawn. The best value per bite in the entire city.', vibe: 'NOODLE DISTRICT' },
  'Queen West': { desc: 'Art galleries and all-day brunch. The strip where Trinity Bellwoods picnics turn into late-night taco runs.', vibe: 'WEST SIDE STORY' },
  'King West': { desc: 'Bottle service meets bone marrow. Toronto\'s nightlife strip has more good restaurants than you\'d expect between the clubs.', vibe: 'NIGHTLIFE FUEL' },
  'Yorkville & Bloor': { desc: 'Old money, new restaurants. Where Toronto\'s most expensive omakase lives next to a $6 falafel that\'s equally legendary.', vibe: 'HIGH & LOW' },
  'Leslieville': { desc: 'Queen East\'s quiet evolution. Brunch capital by day, neighbourhood bistros by night. The east end doesn\'t need your attention — it has its own thing going.', vibe: 'EAST END ENERGY' },
  'Little Italy': { desc: 'College Street\'s identity crisis: still Italian, also Korean, secretly Vietnamese, and somehow all of it works.', vibe: 'COLLEGE CRAWL' },
  'The Danforth': { desc: 'Greek Town that grew up. Souvlaki is still king but the ramen shop next door is giving it a run.', vibe: 'GREEK + EVERYTHING' },
  'St. Clair': { desc: 'Corso Italia meets the Caribbean. Patties and paninis on the same block. The real multicultural Toronto.', vibe: 'THE REAL MIX' },
  'Waterfront': { desc: 'Harbourfront to Union. Tourist pricing but a few gems if you know where to look. Best eaten with a lake view.', vibe: 'LAKE VIEWS' },
  'Etobicoke': { desc: 'The quiet west end. Family-run spots that have been here for decades. No hype, just loyalty.', vibe: 'WEST END LOYALTY' },
  'The Annex': { desc: 'Student budgets, professor taste. Bloor West between Spadina and Bathurst. Cheap, good, unpretentious.', vibe: 'CAMPUS ADJACENT' },
  'Midtown': { desc: 'Eglinton\'s moment. The LRT construction is done and the restaurants survived. They deserve your visit.', vibe: 'MIDTOWN REVIVAL' },
};

const AREAS = topHoods
  .filter(([h, c]) => c >= 5)
  .slice(0, 10)
  .map(([hood, count]) => {
    const meta = AREA_META[hood] || { desc: `The food scene in ${hood}. Every spot reviewed on video.`, vibe: hood.toUpperCase() };
    return {
      slug: hood.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/,''),
      title: hood.toUpperCase(),
      hood,
      h1: hood + '.',
      kicker: meta.vibe,
      marquee: `${hood.toUpperCase()} · ${count} SPOTS · VIDEO VERIFIED`,
      desc: meta.desc,
      filter: () => data.filter(v => v.hood === hood).sort((a,b) => b.views - a.views).slice(0, 12),
    };
  });

console.log(`\n${GUIDES.length} guides, ${AREAS.length} areas\n`);

// ═══════════════════════════════════════
// HTML GENERATION
// ═══════════════════════════════════════

const FOOD_IMGS = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop',
];

const verdicts = ['MUST TRY','GOAT','SOLID','FIRE','ELITE','SLEPT ON','WORTH IT','INSANE','NO CAP','CERTIFIED'];
const verdictCls = ['goat','goat','mid','goat','goat','','goat','goat','','goat'];

function buildCard(item, i) {
  const quote = extractQuote(item.caption, item.transcript);
  const caption = cleanCap(item.caption).substring(0, 200);
  const transcript = cleanTranscript(item.transcript);
  const img = FOOD_IMGS[i % FOOD_IMGS.length];
  const platform = (item.source_url||'').includes('tiktok') ? '◉ TIKTOK' : (item.source_url||'').includes('youtube') ? '▶ YOUTUBE' : '◉ IG REEL';
  const init = (item.creator_name||'B').charAt(0).toUpperCase();
  const v = verdicts[i % verdicts.length];
  const vc = verdictCls[i % verdictCls.length];

  return `
    <a class="review" href="${esc(item.source_url||'#')}">
      <div class="pin"></div><div class="tape-decor"></div>
      <div class="top-meta">
        <span class="name">${esc(item.restaurant)}</span>
        <span class="rating"><i></i><i></i><i></i><i></i><i></i></span>
      </div>
      <div class="thumb">
        <img src="${img}" alt="${esc(item.restaurant)}"/>
        <span class="platform-tag">${platform}</span>
        <span class="duration">1:30</span>
        <span class="verdict ${vc}">${v}</span>
        <div class="play"><svg viewBox="0 0 24 24"><path d="M7 4 L7 20 L20 12 Z"/></svg></div>
        <div class="stats">
          <span class="stat"><svg viewBox="0 0 24 24"><path d="M12 4C5 4 2 12 2 12s3 8 10 8 10-8 10-8-3-8-10-8zm0 13a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z"/></svg>${fmtV(item.views)}</span>
          <span class="stat"><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9C.8 8.4 2.6 4 6.5 4 9 4 11 6 12 7.5 13 6 15 4 17.5 4 21.4 4 23.2 8.4 21.5 12 19 16.5 12 21 12 21z"/></svg>${fmtV(item.likes)}</span>
          <span class="stat"><svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>${fmtV(item.saves)}</span>
        </div>
      </div>
      <div class="creator-row">
        <div class="avatar">${init}</div>
        <div class="creator-info">
          <div class="creator-name">@${esc(item.creator_name)}</div>
          <div class="followers">TikTok</div>
        </div>
      </div>
      <div class="quote"><span class="quote-mark">"</span>${esc(quote)}</div>
      <div class="caption"><span class="cap-label">Caption</span><br>${esc(caption)}</div>${transcript ? `
      <div class="transcript">
        <button class="transcript-toggle" onclick="event.preventDefault();this.nextElementSibling.classList.toggle('open');this.querySelector('.arrow').textContent=this.nextElementSibling.classList.contains('open')?'▲':'▼'"><span>Full Transcript</span><span class="arrow">▼</span></button>
        <div class="transcript-body"><div class="transcript-text">${esc(transcript)}</div></div>
      </div>` : ''}
      <div class="corner-note">${fmtV(item.views)}</div>
    </a>`;
}

function buildPage(config, type) {
  const items = config.filter();
  if (items.length < 3) { console.log(`  ⚠️ Skipping ${config.slug} — only ${items.length} items`); return null; }

  const cards = items.map((item, i) => buildCard(item, i)).join('\n');
  const prefix = type === 'guide' ? 'guide' : 'area';
  const backLabel = type === 'guide' ? 'ALL GUIDES' : 'ALL AREAS';
  const canonical = `https://www.bitemap.fun/toronto/${prefix}-${config.slug}`;

  return `<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8"/>
<title>${config.title} — Toronto Food Zine | BiteMap</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="description" content="${esc(config.desc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${config.title} | Toronto Food Zine | BiteMap">
<meta property="og:description" content="${esc(config.desc)}">
<meta property="og:image" content="https://www.bitemap.fun/images/og-image.jpg">
<meta property="og:site_name" content="BiteMap">
<link rel="icon" type="image/png" href="/images/bitemap-logo.png">
<link rel="apple-touch-icon" href="/images/bitemap-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Caveat:wght@400;700&family=Shrikhand&family=Rubik+Mono+One&family=Bungee&family=Special+Elite&family=Archivo+Black&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-EEZQEGTQDD"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-EEZQEGTQDD');</script>
<style>
:root{--paper:#f1ead8;--paper-2:#ece2c7;--ink:#141210;--red:#d62419;--yellow:#f5c518;--tape:rgba(240,220,120,0.55)}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--paper);color:var(--ink);font-family:'Special Elite','Courier New',monospace;overflow-x:hidden}
body{background:radial-gradient(1200px 800px at 20% 10%,rgba(214,36,25,0.05),transparent 60%),radial-gradient(900px 600px at 90% 60%,rgba(20,18,16,0.04),transparent 60%),repeating-linear-gradient(0deg,rgba(20,18,16,0.018) 0 2px,transparent 2px 4px),var(--paper)}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:1;background-image:radial-gradient(rgba(20,18,16,0.08) 1px,transparent 1px),radial-gradient(rgba(20,18,16,0.05) 1px,transparent 1px);background-size:3px 3px,7px 7px;background-position:0 0,1px 2px;mix-blend-mode:multiply;opacity:.5}
.wrap{position:relative;z-index:5;max-width:1680px;margin:0 auto;padding:0 2rem}
h1,h2,h3,h4{margin:0;font-weight:400}
.marquee{background:var(--ink);color:var(--paper);overflow:hidden;border-top:2px solid var(--ink);border-bottom:2px solid var(--ink);position:relative;z-index:7}
.marquee-track{display:flex;gap:2rem;padding:.6rem 0;white-space:nowrap;animation:scroll 40s linear infinite;font-family:'Archivo Black';letter-spacing:.05em;font-size:1rem}
.marquee-track span{display:inline-flex;align-items:center;gap:1rem}
.marquee-track .dot{width:10px;height:10px;background:var(--red);border-radius:50%;display:inline-block}
@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.nav-top{padding:1rem 0 .8rem;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--ink);position:relative;z-index:10}
.nav-top a{color:inherit;text-decoration:none;font-family:'DM Mono';font-size:.75rem;letter-spacing:.2em}.nav-top a:hover{color:var(--red)}
.breadcrumb{font-family:'DM Mono';font-size:.75rem}.breadcrumb b{font-family:'Archivo Black'}
.hero{position:relative;padding:0;text-align:center;border-bottom:3px double var(--ink);z-index:10}
.hero .kicker{display:inline-block;background:var(--ink);color:var(--paper);padding:.25rem .7rem;font-family:'Archivo Black';letter-spacing:.25em;font-size:.75rem;transform:rotate(-1deg)}
.hero h1{font-family:'Shrikhand',cursive;font-size:clamp(3rem,8vw,7rem);line-height:.9;color:var(--red);text-shadow:4px 4px 0 var(--ink);margin-top:.6rem;letter-spacing:-.02em}
.hero .deck{font-family:'Caveat',cursive;font-weight:700;font-size:clamp(1.1rem,2vw,1.6rem);max-width:40rem;margin:.5rem auto 0;line-height:1.3;padding:0 1rem .5rem}
.reviews-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;margin:1rem 0 2rem;position:relative;z-index:10;padding:1rem 0;width:calc(100vw - 3rem);margin-left:calc(50% - 50vw + 1.5rem)}
@media(max-width:1400px){.reviews-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:1000px){.reviews-grid{grid-template-columns:repeat(2,1fr);gap:1.2rem .8rem}}
@media(max-width:600px){.reviews-grid{grid-template-columns:1fr}}
.review{position:relative;display:block;background:var(--paper);border:2px solid var(--ink);box-shadow:8px 10px 0 rgba(0,0,0,.2);cursor:pointer;text-decoration:none;color:inherit;transition:transform .3s cubic-bezier(.2,.9,.3,1.2),box-shadow .25s;padding:1rem 1rem 1.2rem}
.review:nth-child(7n+1){transform:rotate(-3deg)}.review:nth-child(7n+2){transform:rotate(2deg) translateY(10px)}.review:nth-child(7n+3){transform:rotate(-1.5deg) translateY(-6px)}.review:nth-child(7n+4){transform:rotate(3.5deg)}.review:nth-child(7n+5){transform:rotate(-2.5deg) translateY(8px)}.review:nth-child(7n+6){transform:rotate(1deg) translateY(-4px)}.review:nth-child(7n+7){transform:rotate(-4deg)}
.review:hover{transform:rotate(0deg) translateY(-10px) scale(1.03);box-shadow:12px 18px 0 rgba(214,36,25,.4);z-index:30}
.review .top-meta{padding:.3rem .3rem .6rem;border-bottom:2px dashed var(--ink);margin-bottom:.7rem;display:flex;justify-content:space-between;align-items:center;gap:.5rem}
.review .top-meta .name{font-family:'Shrikhand';font-size:1.3rem;line-height:1;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.review .top-meta .rating{display:flex;gap:2px;flex-shrink:0}
.review .top-meta .rating i{width:12px;height:12px;background:var(--red);display:block;clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}
.review .top-meta .rating i.off{background:rgba(0,0,0,.2)}
.review .thumb{position:relative;aspect-ratio:9/11.66;overflow:hidden;background:#333;box-shadow:inset 0 0 0 3px var(--paper),inset 0 0 0 4px var(--ink)}
.review .thumb img{width:100%;height:100%;object-fit:cover;display:block;filter:contrast(1.08) saturate(1.05)}
.review .thumb::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.35) 0%,transparent 25%,transparent 55%,rgba(0,0,0,.85) 100%)}
.review .play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:76px;height:76px;border-radius:50%;background:rgba(255,255,255,.95);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.5);transition:transform .2s;z-index:3}
.review:hover .play{transform:translate(-50%,-50%) scale(1.15)}
.review .play svg{width:32px;height:32px;margin-left:4px;fill:var(--ink)}
.review .platform-tag{position:absolute;top:.6rem;left:.6rem;z-index:3;font-family:'Archivo Black';font-size:.7rem;letter-spacing:.1em;background:var(--paper);color:var(--ink);padding:.25rem .55rem;border:1.5px solid var(--ink);text-transform:uppercase;box-shadow:2px 2px 0 rgba(0,0,0,.4)}
.review .duration{position:absolute;top:.6rem;right:.6rem;z-index:3;background:var(--ink);color:var(--paper);padding:.2rem .5rem;font-family:'DM Mono';font-size:.72rem}
.review .verdict{position:absolute;top:3.4rem;right:-.5rem;z-index:4;display:inline-block;padding:.3rem .65rem;font-family:'Archivo Black';font-size:.72rem;letter-spacing:.1em;background:var(--red);color:var(--paper);box-shadow:2px 2px 0 var(--ink);transform:rotate(6deg)}
.review .verdict.mid{background:var(--paper);color:var(--ink);border:1.5px solid var(--ink)}.review .verdict.goat{background:var(--yellow);color:var(--ink);border:1.5px solid var(--ink)}
.review .stats{position:absolute;left:.7rem;right:.7rem;bottom:.7rem;z-index:3;display:flex;gap:1rem;color:#fff;font-family:'DM Mono';font-size:.88rem;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,.8)}
.review .stats .stat{display:flex;align-items:center;gap:.3rem}.review .stats svg{width:17px;height:17px;fill:#fff;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
.review .creator-row{display:flex;align-items:center;gap:.75rem;padding:.85rem .25rem .4rem}
.review .avatar{width:48px;height:48px;border-radius:50%;background:#888;border:2px solid var(--ink);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Archivo Black';font-size:.85rem;box-shadow:2px 2px 0 rgba(0,0,0,.25)}
.review .creator-info{min-width:0;flex:1}.review .creator-name{font-family:'Archivo Black';font-size:.92rem;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.review .followers{font-family:'DM Mono';font-size:.72rem;opacity:.7;letter-spacing:.05em;margin-top:.15rem}
.review .quote{display:block;margin-top:.75rem;padding:.6rem .8rem;background:var(--yellow);border-left:4px solid var(--red);font-family:'Caveat',cursive;font-size:1.15rem;font-weight:700;line-height:1.3;color:var(--ink);transform:rotate(-0.5deg)}
.review .quote .quote-mark{font-family:'Shrikhand';font-size:1.6rem;color:var(--red);vertical-align:-.15em;margin-right:.1rem}
.review .caption{margin-top:.6rem;padding:.5rem .6rem;font-family:'Special Elite',monospace;font-size:.8rem;line-height:1.45;color:var(--ink);opacity:.85;border:1px dashed rgba(0,0,0,.15);background:rgba(255,255,255,.25)}
.review .caption .cap-label{display:inline-block;font-family:'Archivo Black';font-size:.6rem;letter-spacing:.15em;text-transform:uppercase;color:var(--red);margin-bottom:.3rem}
.review .transcript{margin-top:.4rem;border:1px dashed var(--ink);background:rgba(255,255,255,.3);overflow:hidden}
.review .transcript-toggle{display:flex;justify-content:space-between;align-items:center;padding:.4rem .6rem;cursor:pointer;font-family:'DM Mono',monospace;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink);opacity:.7;border:none;background:none;width:100%;text-align:left}
.review .transcript-toggle:hover{opacity:1;color:var(--red)}
.review .transcript-body{max-height:0;overflow:hidden;transition:max-height .4s ease}.review .transcript-body.open{max-height:600px}
.review .transcript-text{padding:.5rem .6rem;font-family:'Special Elite',monospace;font-size:.75rem;line-height:1.5;color:var(--ink);opacity:.75}
.review .pin{position:absolute;width:26px;height:26px;top:-10px;left:-10px;z-index:5;background:radial-gradient(circle at 30% 30%,#ff5a4a,var(--red) 60%,#8a0a00);border-radius:50%;border:2px solid #2a0a06;box-shadow:2px 3px 4px rgba(0,0,0,.3)}
.review .pin::after{content:'';position:absolute;top:6px;left:6px;width:7px;height:5px;background:rgba(255,255,255,.6);border-radius:50%}
.review .tape-decor{position:absolute;top:-14px;right:20%;width:80px;height:22px;background:var(--tape);transform:rotate(-6deg);z-index:4;pointer-events:none;border-left:1px dashed rgba(0,0,0,.1);border-right:1px dashed rgba(0,0,0,.1)}
.review:nth-child(3n) .tape-decor{background:rgba(220,90,80,0.5);right:auto;left:15%;transform:rotate(5deg)}
.review:nth-child(4n) .tape-decor{background:rgba(120,190,220,0.55);left:45%;right:auto;transform:rotate(-3deg)}
.review .corner-note{position:absolute;right:-10px;bottom:-18px;z-index:5;font-family:'Permanent Marker';color:var(--ink);font-size:.85rem;transform:rotate(-5deg);background:var(--yellow);padding:.2rem .55rem;border:1.5px solid var(--ink);box-shadow:2px 2px 0 var(--ink)}
.foot-nav{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin:1.5rem 0 3rem;position:relative;z-index:10}
.foot-nav a{display:block;padding:1rem;border:2px solid var(--ink);text-decoration:none;color:inherit;text-align:center;font-family:'Archivo Black';letter-spacing:.1em;font-size:.85rem;transition:all .2s;background:var(--paper)}
.foot-nav a:hover{background:var(--red);color:var(--paper);transform:rotate(-1deg)}
.foot-nav a .sub{display:block;font-family:'DM Mono';font-weight:400;font-size:.65rem;opacity:.7;margin-top:.3rem;letter-spacing:.15em}
@media(max-width:780px){.foot-nav{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="marquee"><div class="marquee-track">
<span><i class="dot"></i> ${esc(config.marquee)}</span>
<span><i class="dot"></i> THE TORONTO FOOD ZINE</span>
<span><i class="dot"></i> EAT LOCAL. EAT LOUD.</span>
<span><i class="dot"></i> ${esc(config.marquee)}</span>
<span><i class="dot"></i> THE TORONTO FOOD ZINE</span>
<span><i class="dot"></i> EAT LOCAL. EAT LOUD.</span>
</div></div>
<div class="wrap">
<div class="nav-top">
  <a href="/toronto">← BACK TO ZINE</a>
  <div class="breadcrumb mono">TORONTO FOOD ZINE / <b>${esc(config.title)}</b></div>
  <a href="#">SHARE →</a>
</div>
<section class="hero">
  <span class="kicker">${esc(config.kicker)}</span>
  <h1>${config.h1}</h1>
  <div class="deck">${esc(config.desc)}</div>
</section>
<div class="reviews-grid">
${cards}
</div>
<div class="foot-nav">
  <a href="/toronto">← BACK TO ZINE <span class="sub">${backLabel}</span></a>
  <a href="/toronto/best-ramen">BEST RAMEN <span class="sub">TOP 10</span></a>
  <a href="https://apps.apple.com/ca/app/bitemap/id6746139076">GET THE APP <span class="sub">iOS + ANDROID</span></a>
</div>
</div>
</body>
</html>`;
}

// Generate guides
console.log('\n=== GENERATING GUIDES ===');
let guideCount = 0;
for (const g of GUIDES) {
  const html = buildPage(g, 'guide');
  if (html) {
    writeFileSync(join(root, 'toronto', `guide-${g.slug}.html`), html);
    console.log(`  ✅ guide-${g.slug}.html`);
    guideCount++;
  }
}

// Generate areas
console.log('\n=== GENERATING AREAS ===');
let areaCount = 0;
for (const a of AREAS) {
  const html = buildPage(a, 'area');
  if (html) {
    writeFileSync(join(root, 'toronto', `area-${a.slug}.html`), html);
    console.log(`  ✅ area-${a.slug}.html`);
    areaCount++;
  }
}

console.log(`\nDone! ${guideCount} guides + ${areaCount} areas generated.`);
