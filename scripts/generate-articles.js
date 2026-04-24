/**
 * Generate toronto article pages from data/articles.json using best-pho.html as template.
 *
 * Usage: node scripts/generate-articles.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const articles = JSON.parse(readFileSync(join(root, 'data', 'articles.json'), 'utf8'));
const template = readFileSync(join(root, 'toronto', 'best-pho.html'), 'utf8');

// Pexels images per cuisine for thumbnails (free stock)
const HERO_IMAGES = {
  'best-pho': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop',
  'best-ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop',
  'best-sushi': 'https://images.unsplash.com/photo-2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=600',
  'best-burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop',
  'best-pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop',
  'best-halal': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop',
  'best-tacos': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop',
  'best-indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop',
  'best-chinese': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop',
  'best-italian': 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&auto=format&fit=crop',
  'best-seafood': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&auto=format&fit=crop',
  'best-dessert': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop',
  'best-coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop',
  'best-caribbean': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop',
  'best-bbq': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop',
  'best-noodles': 'https://images.unsplash.com/photo-1552611052-33e04de1b100?w=600&auto=format&fit=crop',
  'best-fried-chicken': 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&auto=format&fit=crop',
  'best-shawarma': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop',
};

const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1432139509613-5c4255a78e46?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&auto=format&fit=crop',
];

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatViews(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function truncCaption(caption, len = 200) {
  const clean = (caption || '').replace(/#\S+/g, '').replace(/@\S+/g, '').trim();
  return clean.length > len ? clean.substring(0, len) + '...' : clean;
}

function extractQuote(caption, transcript) {
  // Try to find a strong quote from caption first (first sentence or two)
  const capClean = (caption || '').replace(/#\S+/g, '').replace(/@\S+/g, '').trim();
  const sentences = capClean.split(/[.!?]+/).filter(s => s.trim().length > 15);
  if (sentences.length > 0) {
    const quote = sentences[0].trim();
    return quote.length > 120 ? quote.substring(0, 120) + '...' : quote;
  }
  // Fallback to first bit of transcript
  const tClean = (transcript || '').replace(/Start Time.*Subtitle/g, '').replace(/\d{2}:\d{2}:\d{2}\t\d{2}:\d{2}:\d{2}\t/g, '').trim();
  const tSentences = tClean.split(/[.!?]+/).filter(s => s.trim().length > 15);
  if (tSentences.length > 0) {
    const q = tSentences[0].trim();
    return q.length > 120 ? q.substring(0, 120) + '...' : q;
  }
  return capClean.substring(0, 100);
}

function cleanTranscript(transcript) {
  if (!transcript) return '';
  // Remove timestamp format lines
  return transcript
    .replace(/Start Time\tEnd Time\tSubtitle\n?/g, '')
    .replace(/\d{2}:\d{2}:\d{2}\t\d{2}:\d{2}:\d{2}\t/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

const verdicts = ['MUST TRY', 'GOAT', 'SOLID', 'FIRE', 'ELITE', 'SLEPT ON', 'WORTH IT', 'INSANE'];
const verdictStyles = ['goat', '', 'mid', 'goat', 'goat', '', '', 'goat'];

// Generate each article
let generated = 0;

for (const [slug, cat] of Object.entries(articles.categories)) {
  if (!cat.viable) continue;
  if (slug === 'best-pho') continue; // Already have this one hand-crafted

  const items = cat.items.slice(0, 10); // Max 10 per article
  if (items.length < 5) continue;

  const titleUpper = cat.title.toUpperCase().replace('BEST ', '');
  const titleClean = cat.title;

  // Build review cards HTML
  const cards = items.map((item, i) => {
    const quote = extractQuote(item.caption, item.transcript);
    const caption = truncCaption(item.caption);
    const transcript = cleanTranscript(item.transcript);
    const img = HERO_IMAGES[slug] || FOOD_IMAGES[i % FOOD_IMAGES.length];
    const thumbImg = FOOD_IMAGES[(i + 3) % FOOD_IMAGES.length];
    const verdict = verdicts[i % verdicts.length];
    const verdictClass = verdictStyles[i % verdictStyles.length];
    const platform = (item.source_url || '').includes('tiktok') ? '◉ TIKTOK'
      : (item.source_url || '').includes('youtube') ? '▶ YOUTUBE'
      : (item.source_url || '').includes('instagram') ? '◉ IG REEL'
      : '◉ BITEMAP';
    const initial = (item.creator_name || 'B').charAt(0).toUpperCase();
    const stars = Math.min(5, Math.max(3, Math.round((item.views / items[0].views) * 5)));
    const starHTML = Array(5).fill(0).map((_, s) => s < stars ? '<i></i>' : '<i class="off"></i>').join('');

    return `
    <a class="review" href="${esc(item.source_url || '#')}">
      <div class="pin"></div>
      <div class="tape-decor"></div>
      <div class="top-meta">
        <span class="name">${esc(item.restaurant)}</span>
        <span class="rating">${starHTML}</span>
      </div>
      <div class="thumb">
        <img src="${thumbImg}" alt="${esc(item.restaurant)}"/>
        <span class="platform-tag">${platform}</span>
        <span class="duration">1:30</span>
        <span class="verdict ${verdictClass}">${verdict}</span>
        <div class="play"><svg viewBox="0 0 24 24"><path d="M7 4 L7 20 L20 12 Z"/></svg></div>
        <div class="stats">
          <span class="stat"><svg viewBox="0 0 24 24"><path d="M12 4C5 4 2 12 2 12s3 8 10 8 10-8 10-8-3-8-10-8zm0 13a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z"/></svg>${formatViews(item.views)}</span>
          <span class="stat"><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9C.8 8.4 2.6 4 6.5 4 9 4 11 6 12 7.5 13 6 15 4 17.5 4 21.4 4 23.2 8.4 21.5 12 19 16.5 12 21 12 21z"/></svg>${formatViews(item.likes)}</span>
          <span class="stat"><svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>${formatViews(item.saves)}</span>
        </div>
      </div>
      <div class="creator-row">
        <div class="avatar">${initial}</div>
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
      <div class="corner-note">${formatViews(item.views)}</div>
    </a>`;
  }).join('\n');

  // Build the page from template
  // We'll do a simpler approach: build the full page
  const html = `<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8" />
<title>BEST ${titleUpper} IN THE 6IX — The Toronto Food Zine | BiteMap</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="The best ${titleClean.toLowerCase()} in Toronto, ranked by food creators with video proof. Every spot filmed so you know exactly what to order.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://www.bitemap.fun/toronto/${slug}">
<meta property="og:title" content="Best ${titleUpper} in the 6ix | BiteMap">
<meta property="og:description" content="The best ${titleClean.toLowerCase()} in Toronto, ranked by food creators with video proof.">
<meta property="og:image" content="https://www.bitemap.fun/images/og-image.jpg">
<meta property="og:site_name" content="BiteMap">
<link rel="icon" type="image/png" href="/images/bitemap-logo.png">
<link rel="apple-touch-icon" href="/images/bitemap-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
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
  .marker{font-family:'Permanent Marker',cursive}
  .caveat{font-family:'Caveat',cursive;font-weight:700}
  .shrikhand{font-family:'Shrikhand',cursive}
  .mono{font-family:'DM Mono',monospace}
  .archivo{font-family:'Archivo Black',sans-serif}
  .tape{position:absolute;background:var(--tape);box-shadow:0 1px 0 rgba(0,0,0,0.05);border-left:1px dashed rgba(0,0,0,0.07);border-right:1px dashed rgba(0,0,0,0.07);z-index:6}
  .stamp{display:inline-block;padding:.35rem .7rem;border:2px solid var(--red);color:var(--red);font-family:'Archivo Black',sans-serif;letter-spacing:.08em;text-transform:uppercase;font-size:.7rem;transform:rotate(-8deg);box-shadow:inset 0 0 0 2px var(--paper),inset 0 0 0 3px var(--red);opacity:.88}
  .marquee{background:var(--ink);color:var(--paper);overflow:hidden;border-top:2px solid var(--ink);border-bottom:2px solid var(--ink);position:relative;z-index:7}
  .marquee-track{display:flex;gap:2rem;padding:.6rem 0;white-space:nowrap;animation:scroll 40s linear infinite;font-family:'Archivo Black';letter-spacing:.05em;font-size:1rem}
  .marquee-track span{display:inline-flex;align-items:center;gap:1rem}
  .marquee-track .dot{width:10px;height:10px;background:var(--red);border-radius:50%;display:inline-block}
  @keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  .nav-top{padding:1rem 0 .8rem;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--ink);position:relative;z-index:10}
  .nav-top a{color:inherit;text-decoration:none;font-family:'DM Mono';font-size:.75rem;letter-spacing:.2em}
  .nav-top a:hover{color:var(--red)}
  .breadcrumb{font-family:'DM Mono';font-size:.75rem}
  .breadcrumb b{font-family:'Archivo Black'}
  .hero{position:relative;padding:0;text-align:center;border-bottom:3px double var(--ink);z-index:10}
  .hero .kicker{display:inline-block;background:var(--ink);color:var(--paper);padding:.25rem .7rem;font-family:'Archivo Black';letter-spacing:.25em;font-size:.75rem;transform:rotate(-1deg)}
  .hero h1{font-family:'Shrikhand',cursive;font-size:clamp(3rem,8vw,7rem);line-height:.9;color:var(--red);text-shadow:4px 4px 0 var(--ink);margin-top:.6rem;white-space:nowrap;letter-spacing:-.02em}
  .reviews-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem 1.5rem;margin:1rem 0 2rem;position:relative;z-index:10;padding:1rem 0 1rem;width:calc(100vw - 3rem);margin-left:calc(50% - 50vw + 1.5rem)}
  @media(max-width:1400px){.reviews-grid{grid-template-columns:repeat(3,1fr)}}
  @media(max-width:1000px){.reviews-grid{grid-template-columns:repeat(2,1fr);gap:1.2rem .8rem}}
  @media(max-width:600px){.reviews-grid{grid-template-columns:1fr}}
  .review{position:relative;display:block;background:var(--paper);border:2px solid var(--ink);box-shadow:8px 10px 0 rgba(0,0,0,.2);cursor:pointer;text-decoration:none;color:inherit;transition:transform .3s cubic-bezier(.2,.9,.3,1.2),box-shadow .25s;padding:1rem 1rem 1.2rem}
  .review:nth-child(7n+1){transform:rotate(-3deg)}
  .review:nth-child(7n+2){transform:rotate(2deg) translateY(10px)}
  .review:nth-child(7n+3){transform:rotate(-1.5deg) translateY(-6px)}
  .review:nth-child(7n+4){transform:rotate(3.5deg)}
  .review:nth-child(7n+5){transform:rotate(-2.5deg) translateY(8px)}
  .review:nth-child(7n+6){transform:rotate(1deg) translateY(-4px)}
  .review:nth-child(7n+7){transform:rotate(-4deg)}
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
  .review .duration{position:absolute;top:.6rem;right:.6rem;z-index:3;background:var(--ink);color:var(--paper);padding:.2rem .5rem;font-family:'DM Mono';font-size:.72rem;border:1.5px solid var(--ink)}
  .review .verdict{position:absolute;top:3.4rem;right:-.5rem;z-index:4;display:inline-block;padding:.3rem .65rem;font-family:'Archivo Black';font-size:.72rem;letter-spacing:.1em;background:var(--red);color:var(--paper);box-shadow:2px 2px 0 var(--ink);transform:rotate(6deg)}
  .review .verdict.mid{background:var(--paper);color:var(--ink);border:1.5px solid var(--ink)}
  .review .verdict.goat{background:var(--yellow);color:var(--ink);border:1.5px solid var(--ink)}
  .review .stats{position:absolute;left:.7rem;right:.7rem;bottom:.7rem;z-index:3;display:flex;gap:1rem;color:#fff;font-family:'DM Mono';font-size:.88rem;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,.8)}
  .review .stats .stat{display:flex;align-items:center;gap:.3rem}
  .review .stats svg{width:17px;height:17px;fill:#fff;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
  .review .creator-row{display:flex;align-items:center;gap:.75rem;padding:.85rem .25rem .4rem}
  .review .avatar{width:48px;height:48px;border-radius:50%;background:#888;border:2px solid var(--ink);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Archivo Black';font-size:.85rem;box-shadow:2px 2px 0 rgba(0,0,0,.25)}
  .review .creator-info{min-width:0;flex:1}
  .review .creator-name{font-family:'Archivo Black';font-size:.92rem;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .review .followers{font-family:'DM Mono';font-size:.72rem;opacity:.7;letter-spacing:.05em;margin-top:.15rem}
  .review .quote{display:block;margin-top:.75rem;padding:.6rem .8rem;background:var(--yellow);border-left:4px solid var(--red);font-family:'Caveat',cursive;font-size:1.15rem;font-weight:700;line-height:1.3;color:var(--ink);transform:rotate(-0.5deg);position:relative}
  .review .quote .quote-mark{font-family:'Shrikhand';font-size:1.6rem;color:var(--red);vertical-align:-.15em;margin-right:.1rem}
  .review .caption{margin-top:.6rem;padding:.5rem .6rem;font-family:'Special Elite',monospace;font-size:.8rem;line-height:1.45;color:var(--ink);opacity:.85;border:1px dashed rgba(0,0,0,.15);background:rgba(255,255,255,.25)}
  .review .caption .cap-label{display:inline-block;font-family:'Archivo Black';font-size:.6rem;letter-spacing:.15em;text-transform:uppercase;color:var(--red);margin-bottom:.3rem}
  .review .transcript{margin-top:.4rem;border:1px dashed var(--ink);background:rgba(255,255,255,.3);overflow:hidden}
  .review .transcript-toggle{display:flex;justify-content:space-between;align-items:center;padding:.4rem .6rem;cursor:pointer;font-family:'DM Mono',monospace;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink);opacity:.7;border:none;background:none;width:100%;text-align:left;transition:opacity .2s}
  .review .transcript-toggle:hover{opacity:1;color:var(--red)}
  .review .transcript-body{max-height:0;overflow:hidden;transition:max-height .4s ease}
  .review .transcript-body.open{max-height:600px}
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
<div class="marquee">
  <div class="marquee-track">
    <span><i class="dot"></i> BEST ${titleUpper} IN THE 6IX</span>
    <span><i class="dot"></i> ${items.length} SPOTS · VIDEO VERIFIED</span>
    <span><i class="dot"></i> THE TORONTO FOOD ZINE</span>
    <span><i class="dot"></i> EAT LOCAL. EAT LOUD.</span>
    <span><i class="dot"></i> BEST ${titleUpper} IN THE 6IX</span>
    <span><i class="dot"></i> ${items.length} SPOTS · VIDEO VERIFIED</span>
    <span><i class="dot"></i> THE TORONTO FOOD ZINE</span>
    <span><i class="dot"></i> EAT LOCAL. EAT LOUD.</span>
  </div>
</div>
<div class="wrap">
  <div class="nav-top">
    <a href="/toronto">← BACK TO ZINE</a>
    <div class="breadcrumb mono">TORONTO FOOD ZINE / <b>BEST ${titleUpper}</b></div>
    <a href="#">SHARE →</a>
  </div>
  <section class="hero">
    <span class="kicker">TOP ${items.length}</span>
    <h1>Best ${titleUpper.charAt(0) + titleUpper.slice(1).toLowerCase()}.</h1>
  </section>
  <div class="reviews-grid">
${cards}
  </div>
  <div class="foot-nav">
    <a href="/toronto">← BACK TO ZINE <span class="sub">ALL LISTS</span></a>
    <a href="/toronto/best-pho">BEST PHO <span class="sub">TOP 7</span></a>
    <a href="https://apps.apple.com/ca/app/bitemap/id6746139076">GET THE APP <span class="sub">iOS + ANDROID</span></a>
  </div>
</div>
</body>
</html>`;

  const outPath = join(root, 'toronto', `${slug}.html`);
  writeFileSync(outPath, html);
  console.log(`Generated: toronto/${slug}.html (${items.length} reviews)`);
  generated++;
}

console.log(`\nDone! Generated ${generated} article pages.`);
