/**
 * Multi-city rebuild: Generate articles, guides, areas + hub page per city.
 * Each city gets its own slang, culture, neighborhoods, marquee text.
 *
 * Usage: node scripts/rebuild-city.js
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const BUNNY_CDN = 'https://vz-9c9477c9-fd2.b-cdn.net';
const SUPABASE_PROFILE = 'https://lqslpgiibpcvknfehdlr.supabase.co/storage/v1/object/public/photos/profile';

// ═══ CITY CONFIGURATIONS ═══
const CITIES = {
  la: {
    csv: 'la.csv',
    slug: 'los-angeles',
    dir: 'los-angeles',
    name: 'Los Angeles',
    shortName: 'LA',
    slang: 'the city of angels',
    marqueeLines: ['EAT LOCAL. EAT LOUD.','STARTED FROM THE TACO TRUCK NOW WE HERE','LA EATS DIFFERENT','NO CAP ALL FLAVOR'],
    hubTitle: 'LOS ANGELES',
    hubH1: 'Where LA <span class="and">&</span> Eats',
    hubSub: 'a <u>sun-soaked</u> love letter to <u>LA</u> — in tacos, smoke & palm trees.',
    hubKicker: 'FIELD GUIDE — LA EDITION',
    hubIssue: 'VOL. 01 · LA · SPRING 2026',
    hubPrice: 'USD $6.66 · 34.0522° N, 118.2437° W',
    hubPrinted: 'PRINTED IN SILVER LAKE',
    hubPasted: 'CUT · PASTED · STAPLED BY HAND',
    neighborhoods: {
      'Hollywood':{desc:'Touristy strip meets genuine late-night gems. Know where to look.',vibe:'HOLLYWOOD HUSTLE'},
      'Koreatown':{desc:'KBBQ at 2AM, tofu stew at dawn. The 24-hour food capital of LA.',vibe:'K-TOWN NEVER SLEEPS'},
      'Silver Lake':{desc:'Hipster brunch, natural wine, and the best avocado toast you\'ll never admit you love.',vibe:'EASTSIDE VIBES'},
      'Downtown':{desc:'Grand Central Market to Arts District. The renaissance is real.',vibe:'DTLA REVIVAL'},
      'Venice':{desc:'Boardwalk bites and Abbot Kinney splurges. Beach town with a food scene.',vibe:'BEACH EATS'},
      'Pasadena':{desc:'Old Town charm, dim sum corridor, and steakhouses your grandpa would approve of.',vibe:'OLD MONEY EATS'},
      'West Hollywood':{desc:'WeHo brunch lines, rooftop cocktails, and celebrity chef spots.',vibe:'WEHO SCENE'},
      'Culver City':{desc:'The new food corridor. Every month a new restaurant worth driving for.',vibe:'CULVER CRAWL'},
      'East LA':{desc:'The heart of Mexican food in America. Birria, al pastor, elote. The real deal.',vibe:'EAST SIDE PRIDE'},
      'Sawtelle':{desc:'Little Osaka. Ramen, tsukemen, Japanese curry — all on one block.',vibe:'JAPANTOWN WEST'},
    },
  },
  vancouver: {
    csv: 'vancouver.csv',
    slug: 'vancouver',
    dir: 'vancouver',
    name: 'Vancouver',
    shortName: 'Van',
    slang: 'raincity',
    marqueeLines: ['EAT LOCAL. EAT LOUD.','RAINCITY EATS HEAVY','VAN FOOD SCENE IS UNDERRATED','SUSHI CAPITAL OF NORTH AMERICA'],
    hubTitle: 'VANCOUVER',
    hubH1: 'Where Van <span class="and">&</span> Eats',
    hubSub: 'a <u>rain-soaked</u> love letter to <u>Van</u> — in sushi, noodles & mountain views.',
    hubKicker: 'FIELD GUIDE — VANCOUVER EDITION',
    hubIssue: 'VOL. 01 · VANCOUVER · SPRING 2026',
    hubPrice: 'CAD $6.66 · 49.2827° N, 123.1207° W',
    hubPrinted: 'PRINTED IN GASTOWN',
    hubPasted: 'CUT · PASTED · STAPLED BY HAND',
    neighborhoods: {
      'Downtown':{desc:'Robson to Granville. Tourist traps and hidden gems, block by block.',vibe:'DOWNTOWN CORE'},
      'Chinatown':{desc:'One of the oldest in North America. Dim sum, BBQ duck, and late-night wonton.',vibe:'CHINATOWN OG'},
      'Commercial Drive':{desc:'The Drive. Italian roots, Ethiopian coffee, and everything in between.',vibe:'THE DRIVE'},
      'Kitsilano':{desc:'Beach vibes, health bowls, and brunch that\'s worth the UBC commute.',vibe:'KITS LIFE'},
      'Gastown':{desc:'Cobblestones and cocktails. Vancouver\'s oldest neighborhood eats well.',vibe:'COBBLESTONE EATS'},
      'Richmond':{desc:'The food capital of Metro Vancouver. Chinese, Japanese, Taiwanese — all world-class.',vibe:'RICHMOND IS THE ANSWER'},
      'Main Street':{desc:'The indie corridor. Craft breweries, pop-ups, and chefs who left fine dining.',vibe:'MAIN ST INDIE'},
      'Burnaby':{desc:'Metrotown mall food courts and hidden Korean spots worth the SkyTrain ride.',vibe:'BURNABY FINDS'},
      'North Vancouver':{desc:'Mountain bikers need calories. Deep Cove donuts and Lonsdale Quay eats.',vibe:'NORTH SHORE'},
      'West End':{desc:'Davie Village meets Denman. Diverse, walkable, and surprisingly delicious.',vibe:'WEST END WANDER'},
    },
  },
  dallas: {
    csv: 'dallas.csv',
    slug: 'dallas',
    dir: 'dallas',
    name: 'Dallas',
    shortName: 'DFW',
    slang: 'the Big D',
    marqueeLines: ['EAT LOCAL. EAT LOUD.','TEXAS-SIZED PORTIONS ONLY','EVERYTHING IS BIGGER IN DALLAS','BBQ SMOKE AND CITY LIGHTS'],
    hubTitle: 'DALLAS',
    hubH1: 'Where Dallas <span class="and">&</span> Eats',
    hubSub: 'a <u>smoky</u> love letter to <u>the Big D</u> — in brisket, tacos & sweet tea.',
    hubKicker: 'FIELD GUIDE — DALLAS EDITION',
    hubIssue: 'VOL. 01 · DALLAS · SPRING 2026',
    hubPrice: 'USD $6.66 · 32.7767° N, 96.7970° W',
    hubPrinted: 'PRINTED IN DEEP ELLUM',
    hubPasted: 'CUT · PASTED · STAPLED BY HAND',
    neighborhoods: {
      'Deep Ellum':{desc:'Live music and late-night eats. Dallas\'s creative heart is hungry.',vibe:'DEEP ELLUM NIGHTS'},
      'Uptown':{desc:'Brunch crowds and rooftop bars. Where Dallas dresses up to eat.',vibe:'UPTOWN FLEX'},
      'Bishop Arts':{desc:'The neighborhood that proved Dallas has taste. Indie restaurants and galleries.',vibe:'BISHOP ARTS'},
      'Downtown':{desc:'The skyline has restaurants now. DART accessible and actually worth it.',vibe:'DOWNTOWN REVIVAL'},
      'Oak Cliff':{desc:'Mexican food so authentic you forget you\'re in Texas. The real Dallas.',vibe:'OAK CLIFF REAL'},
    },
  },
  houston: {
    csv: 'houston.csv',
    slug: 'houston',
    dir: 'houston',
    name: 'Houston',
    shortName: 'H-Town',
    slang: 'H-Town',
    marqueeLines: ['EAT LOCAL. EAT LOUD.','H-TOWN HOLDS IT DOWN','MOST DIVERSE FOOD CITY IN AMERICA','CHOP AND SCREW YOUR APPETITE'],
    hubTitle: 'HOUSTON',
    hubH1: 'Where H-Town <span class="and">&</span> Eats',
    hubSub: 'a <u>diverse</u> love letter to <u>H-Town</u> — in Viet-Cajun, BBQ & swangas.',
    hubKicker: 'FIELD GUIDE — HOUSTON EDITION',
    hubIssue: 'VOL. 01 · HOUSTON · SPRING 2026',
    hubPrice: 'USD $6.66 · 29.7604° N, 95.3698° W',
    hubPrinted: 'PRINTED IN MONTROSE',
    hubPasted: 'CUT · PASTED · STAPLED BY HAND',
    neighborhoods: {
      'Montrose':{desc:'Houston\'s most walkable neighborhood. Brunch, pho, and everything between.',vibe:'MONTROSE MOOD'},
      'Chinatown':{desc:'Bellaire Blvd is the real main street. Viet-Cajun crawfish started here.',vibe:'BELLAIRE BLVD'},
      'Heights':{desc:'19th Street charm. Craft cocktails and neighborhood bistros.',vibe:'HEIGHTS CHARM'},
      'Downtown':{desc:'The tunnels have lunch spots. Above ground has everything else.',vibe:'DOWNTOWN H'},
      'Midtown':{desc:'Bar crawl meets food crawl. Houston\'s nightlife strip eats well.',vibe:'MIDTOWN ENERGY'},
    },
  },
  new_york: {
    csv: 'new_york.csv',
    slug: 'new-york',
    dir: 'new-york',
    name: 'New York',
    shortName: 'NYC',
    slang: 'the city that never sleeps',
    marqueeLines: ['EAT LOCAL. EAT LOUD.','NEW YORK STATE OF MOUTH','IF YOU CAN EAT HERE YOU CAN EAT ANYWHERE','DEAD ASS THE BEST FOOD'],
    hubTitle: 'NEW YORK',
    hubH1: 'Where NYC <span class="and">&</span> Eats',
    hubSub: 'a <u>relentless</u> love letter to <u>NYC</u> — in dollar slices, bodega chops & Michelin stars.',
    hubKicker: 'FIELD GUIDE — NYC EDITION',
    hubIssue: 'VOL. 01 · NYC · SPRING 2026',
    hubPrice: 'USD $6.66 · 40.7128° N, 74.0060° W',
    hubPrinted: 'PRINTED IN WILLIAMSBURG',
    hubPasted: 'CUT · PASTED · STAPLED BY HAND',
    neighborhoods: {
      'Manhattan':{desc:'The island. Every block is a different restaurant. Good luck choosing.',vibe:'MANHATTAN MADNESS'},
      'Brooklyn':{desc:'Williamsburg to Bushwick. The borough that redefined American food culture.',vibe:'BK ALL DAY'},
      'Queens':{desc:'The most diverse food borough on earth. Flushing alone is worth the trip.',vibe:'QUEENS RUNS THIS'},
      'Flushing':{desc:'Chinese food capital of the East Coast. Hand-pulled noodles and Sichuan heat.',vibe:'FLUSHING HEAT'},
      'East Village':{desc:'Punk rock roots, ramen bars, and the best cheap eats in Manhattan.',vibe:'EAST VILLAGE RAW'},
      'Chinatown':{desc:'Canal Street chaos. Dim sum, roast duck, and $1 dumplings that changed the game.',vibe:'CHINATOWN OG'},
      'Williamsburg':{desc:'Smorgasburg started here. Now every corner has a chef-driven concept.',vibe:'WBURG SCENE'},
      'Harlem':{desc:'Soul food, West African, and Dominican. Uptown eats with history.',vibe:'HARLEM SOUL'},
      'Lower East Side':{desc:'Jewish delis meet modern tasting menus. The LES reinvents itself every decade.',vibe:'LES GRIT'},
      'Midtown':{desc:'Tourist traps and hidden gems. The office lunch crowd knows where to go.',vibe:'MIDTOWN HUSTLE'},
    },
  },
};

// ═══ SHARED LOGIC (from rebuild-all.js) ═══
function parseCSV(text){const r=[];let c=[];let f='';let q=false;for(let i=0;i<text.length;i++){const ch=text[i];const nx=text[i+1];if(q){if(ch==='"'&&nx==='"'){f+='"';i++}else if(ch==='"'){q=false}else{f+=ch}}else{if(ch==='"'){q=true}else if(ch===','){c.push(f.trim());f=''}else if(ch==='\n'){c.push(f.trim());if(c.length>1)r.push(c);c=[];f=''}else if(ch!=='\r'){f+=ch}}}if(f||c.length){c.push(f.trim());if(c.length>1)r.push(c)}return r}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmtV(n){if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return String(n)}
function cleanCap(c){return(c||'').replace(/#\S+/g,'').replace(/@\S+/g,'').trim()}
function cleanTrans(t){if(!t)return'';return t.replace(/Start Time\tEnd Time\tSubtitle\n?/g,'').replace(/\d{2}:\d{2}:\d{2}\t\d{2}:\d{2}:\d{2}\t/g,'').replace(/\[\d{2}:\d{2}-\d{2}:\d{2}\]\s*/g,'').replace(/\n+/g,' ').trim()}
function extractQuote(cap,trans){const t=cleanTrans(trans);if(t){const ts=t.split(/[.!?]+/).filter(x=>x.trim().length>20);const juicy=ts.find(s=>/delicious|amazing|incredible|insane|best|goat|fire|perfect|love|obsessed|unreal|crazy|recommend|must try/i.test(s));if(juicy){const q=juicy.trim();return q.length>120?q.substring(0,120)+'...':q}if(ts.length>1){const q=ts[1].trim();return q.length>120?q.substring(0,120)+'...':q}if(ts.length){const q=ts[0].trim();return q.length>120?q.substring(0,120)+'...':q}}const c=cleanCap(cap);const s=c.split(/[.!?]+/).filter(x=>x.trim().length>15);if(s.length){const q=s[0].trim();return q.length>120?q.substring(0,120)+'...':q}return c.substring(0,100)||'You need to try this spot'}
function getHood(addr,cityHoods){const a=(addr||'').toLowerCase();for(const[hood]of Object.entries(cityHoods)){if(a.includes(hood.toLowerCase()))return hood}return'Greater Area'}

const CATS={
  'best-pho':{title:'Best Pho',kw:['pho','phở'],pkw:['pho']},
  'best-ramen':{title:'Best Ramen',kw:['ramen','tonkotsu','tsukemen'],pkw:['ramen']},
  'best-sushi':{title:'Best Sushi',kw:['sushi','omakase','sashimi','nigiri'],pkw:['sushi']},
  'best-burger':{title:'Best Burgers',kw:['burger','smash burger','cheeseburger'],pkw:['burger']},
  'best-pizza':{title:'Best Pizza',kw:['pizza','slice','neapolitan','margherita'],pkw:['pizza']},
  'best-halal':{title:'Best Halal',kw:['halal','shawarma','kebab'],pkw:['halal']},
  'best-korean-bbq':{title:'Best Korean BBQ',kw:['korean bbq','kbbq','samgyeopsal','bulgogi'],pkw:['korean bbq','kbbq']},
  'best-thai':{title:'Best Thai',kw:['thai food','pad thai','green curry','tom yum'],pkw:['thai']},
  'best-brunch':{title:'Best Brunch',kw:['brunch','eggs benedict','french toast','pancakes'],pkw:['brunch']},
  'best-steak':{title:'Best Steak',kw:['steak','steakhouse','ribeye','wagyu'],pkw:['steak']},
  'best-tacos':{title:'Best Tacos',kw:['taco','tacos','burrito','al pastor','birria','mexican'],pkw:['taco','mexican','burrito']},
  'best-indian':{title:'Best Indian',kw:['butter chicken','biryani','naan','tikka','tandoori','curry','indian food'],pkw:['indian','tandoori']},
  'best-chinese':{title:'Best Chinese',kw:['dim sum','dumpling','wonton','peking duck','chinese food','xiao long bao'],pkw:['dim sum','chinese','dumpling']},
  'best-italian':{title:'Best Italian',kw:['pasta','risotto','gnocchi','carbonara','italian food'],pkw:['italian','trattoria']},
  'best-seafood':{title:'Best Seafood',kw:['seafood','lobster','crab','oyster','shrimp','scallop'],pkw:['seafood','oyster','lobster']},
  'best-dessert':{title:'Best Desserts',kw:['dessert','cake','ice cream','gelato','pastry','donut','croissant','chocolate','waffle'],pkw:['bakery','dessert','ice cream','gelato']},
  'best-coffee':{title:'Best Coffee',kw:['coffee','latte','espresso','matcha','cappuccino','cafe'],pkw:['coffee','cafe','café']},
  'best-wings':{title:'Best Wings',kw:['wings','chicken wings','hot wings','buffalo wings'],pkw:['wing']},
  'best-caribbean':{title:'Best Caribbean',kw:['jerk chicken','jamaican','caribbean','oxtail','plantain','roti'],pkw:['jerk','jamaican','caribbean']},
  'best-bbq':{title:'Best BBQ',kw:['bbq','barbeque','barbecue','brisket','pulled pork','smoked meat','ribs'],pkw:['bbq','smokehouse']},
  'best-noodles':{title:'Best Noodles',kw:['noodle','hand pulled','dan dan','udon','lo mein'],pkw:['noodle']},
  'best-fried-chicken':{title:'Best Fried Chicken',kw:['fried chicken','chicken sandwich','nashville hot','korean fried chicken'],pkw:['fried chicken']},
  'best-shawarma':{title:'Best Shawarma',kw:['shawarma','donair','doner','gyro'],pkw:['shawarma','donair']},
  'best-ayce':{title:'Best AYCE',kw:['ayce','all you can eat','buffet','unlimited'],pkw:['ayce','all you can eat']},
};

const verdicts=['MUST TRY','GOAT','SOLID','FIRE','ELITE','SLEPT ON','WORTH IT','INSANE','NO CAP','CERTIFIED'];
const verdictCls=['goat','goat','mid','goat','goat','','goat','goat','','goat'];

// Use the same CSS + modal from rebuild-all.js — read it from an existing generated page
const templatePage = readFileSync(join(root,'toronto','best-burger.html'),'utf8');
const styleMatch = templatePage.match(/<style>([\s\S]*?)<\/style>/);
const CSS = styleMatch ? styleMatch[1] : '';
const scriptMatch = templatePage.match(/<script src="https:\/\/cdn[\s\S]*?<\/script>\s*<\/head>/);
const hlsScript = '<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>';
// Extract modal HTML + JS
const modalStart = templatePage.indexOf('<!-- VIDEO MODAL -->');
const modalEnd = templatePage.indexOf('</body>');
const MODAL_HTML = modalStart !== -1 ? templatePage.substring(modalStart, modalEnd) : '';

function buildCard(item,i,pageTopic,cityName){
  const quote=extractQuote(item.caption,item.transcript);
  const caption=cleanCap(item.caption).substring(0,150);
  const transcript=cleanTrans(item.transcript);
  const thumb=item.thumbnail||'';
  const link=item.video_link||'#';
  const platform=(item.source_url||'').includes('tiktok')?'◉ TIKTOK':(item.source_url||'').includes('youtube')?'▶ YOUTUBE':'◉ IG REEL';
  const creatorImg=`${SUPABASE_PROFILE}/${encodeURIComponent(item.creator_name)}.jpeg`;
  const v=verdicts[i%verdicts.length];const vc=verdictCls[i%verdictCls.length];
  const hlsUrl=item.hls_url||'';const addr=item.address||'';
  const altPhrases=[
    `${item.restaurant} ${pageTopic} ${cityName} - video review by @${item.creator_name}`,
    `${item.restaurant} - top ${pageTopic.toLowerCase()} spot in ${cityName} reviewed on video`,
    `best ${pageTopic.toLowerCase()} ${cityName} ${item.restaurant} - creator food review`,
    `${item.restaurant} ${pageTopic.toLowerCase()} ${cityName} - must try spots 2026`,
    `where to eat ${pageTopic.toLowerCase()} in ${cityName} - ${item.restaurant} video review`,
  ];
  const altText=altPhrases[i%altPhrases.length];
  const creatorAlt=`${item.creator_name} ${cityName} food creator - ${pageTopic.toLowerCase()} reviews`;
  return`
    <div class="review" onclick="openModal(this)" data-hls="${esc(hlsUrl)}" data-restaurant="${esc(item.restaurant)}" data-address="${esc(addr)}" data-creator="${esc(item.creator_name)}" data-views="${item.views}" data-likes="${item.likes}" data-saves="${item.saves}" data-shares="${item.shares}" data-quote="${esc(quote)}" data-caption="${esc(caption)}" data-transcript="${esc(transcript)}" data-thumb="${esc(thumb)}" data-link="${esc(link)}">
      <div class="pin"></div><div class="tape-decor"></div>
      <div class="top-meta"><span class="name">${esc(item.restaurant)}</span><span class="rating"><i></i><i></i><i></i><i></i><i></i></span></div>
      <div class="thumb">
        <img src="${esc(thumb)}" alt="${esc(altText)}" loading="lazy"/>
        <span class="platform-tag">${platform}</span><span class="verdict ${vc}">${v}</span>
        <div class="play"><svg viewBox="0 0 24 24"><path d="M7 4 L7 20 L20 12 Z"/></svg></div>
        <div class="stats">
          <span class="stat"><svg viewBox="0 0 24 24"><path d="M12 4C5 4 2 12 2 12s3 8 10 8 10-8 10-8-3-8-10-8zm0 13a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z"/></svg>${fmtV(item.views)}</span>
          <span class="stat"><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9C.8 8.4 2.6 4 6.5 4 9 4 11 6 12 7.5 13 6 15 4 17.5 4 21.4 4 23.2 8.4 21.5 12 19 16.5 12 21 12 21z"/></svg>${fmtV(item.likes)}</span>
          <span class="stat"><svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>${fmtV(item.saves)}</span>
        </div>
      </div>
      <div class="creator-row">
        <div class="avatar"><img src="${esc(creatorImg)}" alt="${esc(creatorAlt)}" onerror="this.style.display='none';this.parentElement.textContent='${(item.creator_name||'B').charAt(0).toUpperCase()}'"/></div>
        <div class="creator-info"><div class="creator-name">@${esc(item.creator_name)}</div><div class="followers">${fmtV(item.views)} views</div></div>
      </div>
      <div class="quote"><span class="quote-mark">"</span>${esc(quote)}</div>
      <div class="caption"><span class="cap-label">Caption</span><br>${esc(caption)}</div>${transcript?`
      <div class="transcript">
        <button class="transcript-toggle" onclick="event.preventDefault();this.nextElementSibling.classList.toggle('open');this.querySelector('.arrow').textContent=this.nextElementSibling.classList.contains('open')?'▲':'▼'"><span>Full Transcript</span><span class="arrow">▼</span></button>
        <div class="transcript-body"><div class="transcript-text">${esc(transcript)}</div></div>
      </div>`:''}
      <div class="corner-note">${fmtV(item.views)}</div>
    </div>`;
}

function buildPage(items,config,city){
  if(items.length<3) return null;
  const pageTopic=config.seoTopic||config.title;
  const cards=items.map((item,i)=>buildCard(item,i,pageTopic,city.name)).join('\n');
  const marquee=city.marqueeLines.map(l=>`<span><i class="dot"></i> ${l}</span>`).join('');
  return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/><title>${esc(config.title)} — ${city.name} Food Zine | BiteMap</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="description" content="Best ${esc(pageTopic.toLowerCase())} in ${city.name} 2026. Top spots ranked by food creators with video reviews. Find the best ${esc(pageTopic.toLowerCase())} near you.">
<meta name="keywords" content="${esc(pageTopic.toLowerCase())} ${city.name.toLowerCase()}, best ${esc(pageTopic.toLowerCase())} ${city.name.toLowerCase()}, ${esc(pageTopic.toLowerCase())} near me, top ${esc(pageTopic.toLowerCase())} ${city.name.toLowerCase()} 2026">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://www.bitemap.fun/${city.dir}/${config.slug}">
<meta property="og:title" content="${esc(config.title)} | ${city.name} | BiteMap">
<meta property="og:description" content="Best ${esc(pageTopic.toLowerCase())} in ${city.name} ranked by food creators with video proof.">
<meta property="og:image" content="https://www.bitemap.fun/images/og-image.jpg">
<meta property="og:site_name" content="BiteMap">
<link rel="icon" type="image/png" href="/images/bitemap-logo.png">
<link rel="apple-touch-icon" href="/images/bitemap-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Caveat:wght@400;700&family=Shrikhand&family=Rubik+Mono+One&family=Bungee&family=Special+Elite&family=Archivo+Black&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-EEZQEGTQDD"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-EEZQEGTQDD');</script>
<style>${CSS}</style>
${hlsScript}
</head>
<body>
<div class="marquee"><div class="marquee-track">
<span><i class="dot"></i> ${esc(config.marquee)}</span>${marquee}
<span><i class="dot"></i> ${esc(config.marquee)}</span>${marquee}
</div></div>
<div class="wrap">
<div class="nav-top"><a href="/${city.dir}">← BACK TO ZINE</a><div class="breadcrumb mono">${city.shortName} FOOD ZINE / <b>${esc(config.title)}</b></div><a href="#">SHARE →</a></div>
<section class="hero"><div class="hero-left"></div><div class="hero-center"><span class="kicker">${esc(config.kicker)}</span><h1>${config.h1}</h1></div><div class="hero-right"><div class="deck">${esc(config.desc)}</div></div></section>
<div class="reviews-grid">${cards}</div>
<div class="foot-nav"><a href="/${city.dir}">← BACK TO ZINE <span class="sub">ALL LISTS</span></a><a href="/${city.dir}/best-burger">BEST BURGERS <span class="sub">TOP 10</span></a><a href="https://apps.apple.com/ca/app/bitemap/id6746139076">GET THE APP <span class="sub">iOS + ANDROID</span></a></div>
</div>
${MODAL_HTML}
</body></html>`;
}

// ═══ BUILD EACH CITY ═══
for(const[key,city]of Object.entries(CITIES)){
  console.log(`\n═══ ${city.name.toUpperCase()} ═══`);
  const csvPath=join(root,city.csv);
  if(!existsSync(csvPath)){console.log(`  ❌ ${city.csv} not found`);continue}

  const csv=readFileSync(csvPath,'utf8');
  const allRows=parseCSV(csv);
  const headers=allRows[0];
  const data=allRows.slice(1).map(row=>{
    const o={};headers.forEach((h,i)=>{o[h]=row[i]||''});
    o.views=parseInt(o.views)||0;o.likes=parseInt(o.likes)||0;o.saves=parseInt(o.saves)||0;o.shares=parseInt(o.shares)||0;
    if(o.bunny_video_id&&o.bunny_video_id!=='null'){o.thumbnail=`${BUNNY_CDN}/${o.bunny_video_id}/thumbnail.jpg`;o.hls_url=`${BUNNY_CDN}/${o.bunny_video_id}/playlist.m3u8`;o.video_link=`/v/${o.bunny_video_id}`}
    else{o.thumbnail=null;o.hls_url=null;o.video_link=o.source_url||'#'}
    return o;
  }).filter(r=>r.views>=500);

  console.log(`  ${data.length} videos loaded`);

  const cityDir=join(root,city.dir);
  if(!existsSync(cityDir))mkdirSync(cityDir,{recursive:true});

  // Categorize
  const cats={};
  for(const[slug,cat]of Object.entries(CATS)){cats[slug]={...cat,items:[]};}
  for(const v of data){
    const capL=(v.caption||'').toLowerCase();const plL=(v.restaurant||'').toLowerCase();
    for(const[slug,cat]of Object.entries(cats)){
      if(cat.kw.some(k=>capL.includes(k))||cat.pkw.some(k=>plL.includes(k))){
        if(!cat.items.some(x=>x.restaurant===v.restaurant&&x.creator_name===v.creator_name))cat.items.push(v);
      }
    }
  }
  for(const c of Object.values(cats))c.items.sort((a,b)=>b.views-a.views);

  // Generate articles
  let artCount=0;
  for(const[slug,cat]of Object.entries(cats)){
    const seen=new Set();const deduped=cat.items.filter(v=>{if(seen.has(v.creator_name))return false;seen.add(v.creator_name);return true});
    if(deduped.length<3)continue;
    const items=deduped.slice(0,10);
    const cuisine=cat.title.toLowerCase().replace('best ','');
    const config={slug,title:cat.title.toUpperCase(),h1:cuisine.charAt(0).toUpperCase()+cuisine.slice(1)+'.',kicker:'TOP '+items.length,marquee:`BEST ${cuisine.toUpperCase()} IN ${city.shortName} · VIDEO VERIFIED`,desc:`${city.name}'s best ${cuisine} — ranked by creators who filmed every bite.`,seoTopic:cuisine};
    const html=buildPage(items,config,city);
    if(html){writeFileSync(join(cityDir,`${slug}.html`),html);console.log(`  ✅ ${slug}.html (${items.length})`);artCount++}
  }

  // Generate area pages from neighborhoods
  let areaCount=0;
  for(const[hood,meta]of Object.entries(city.neighborhoods)){
    const hoodLower=hood.toLowerCase();
    const items=data.filter(v=>(v.address||'').toLowerCase().includes(hoodLower)).sort((a,b)=>b.views-a.views);
    const seen=new Set();const deduped=items.filter(v=>{if(seen.has(v.creator_name))return false;seen.add(v.creator_name);return true});
    if(deduped.length<3)continue;
    const areaSlug='area-'+hood.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+$/,'');
    const config={slug:areaSlug,title:hood.toUpperCase(),h1:hood+'.',kicker:meta.vibe,marquee:`${hood.toUpperCase()} · ${deduped.length} SPOTS · VIDEO VERIFIED`,desc:meta.desc,seoTopic:hood+' food'};
    const html=buildPage(deduped.slice(0,12),config,city);
    if(html){writeFileSync(join(cityDir,`${areaSlug}.html`),html);console.log(`  ✅ ${areaSlug}.html (${deduped.length})`);areaCount++}
  }

  // Generate hub page
  const hubHtml=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/><title>THE ${city.shortName} FOOD ZINE — ISSUE №01 | BiteMap</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="description" content="The definitive ${city.name} food guide 2026. Best restaurants discovered through video reviews from trusted food creators. ${city.name} food guide.">
<meta name="keywords" content="${city.name.toLowerCase()} food guide, best restaurants ${city.name.toLowerCase()}, where to eat ${city.name.toLowerCase()}, ${city.name.toLowerCase()} food blog, ${city.name.toLowerCase()} restaurant guide 2026">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://www.bitemap.fun/${city.dir}">
<meta property="og:title" content="${city.name} Food Guide 2026 | BiteMap">
<meta property="og:description" content="The definitive ${city.name} food guide. Video reviews from real creators.">
<meta property="og:image" content="https://www.bitemap.fun/images/og-image.jpg">
<meta property="og:site_name" content="BiteMap">
<link rel="icon" type="image/png" href="/images/bitemap-logo.png">
<link rel="apple-touch-icon" href="/images/bitemap-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Caveat:wght@400;700&family=Shrikhand&family=Rubik+Mono+One&family=Bungee&family=Special+Elite&family=Archivo+Black&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-EEZQEGTQDD"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-EEZQEGTQDD');</script>
<style>${CSS}</style>
</head>
<body>
<div class="marquee"><div class="marquee-track">
<span><i class="dot"></i> ${city.hubIssue}</span><span><i class="dot"></i> THE ${city.shortName} FOOD ZINE</span>${city.marqueeLines.map(l=>`<span><i class="dot"></i> ${l}</span>`).join('')}
<span><i class="dot"></i> ${city.hubIssue}</span><span><i class="dot"></i> THE ${city.shortName} FOOD ZINE</span>${city.marqueeLines.map(l=>`<span><i class="dot"></i> ${l}</span>`).join('')}
</div></div>
<div class="wrap">
<div class="nav-top"><a href="/">← BITEMAP HOME</a><div class="breadcrumb mono">${city.shortName} FOOD ZINE / <b>ISSUE №01</b></div><div class="mono" style="font-size:.7rem">${city.hubPrice}</div></div>
<section class="hero" style="flex-direction:column;text-align:center;padding:1rem 2rem">
<span class="kicker">${city.hubKicker}</span>
<h1 style="font-size:clamp(3rem,10vw,8rem);white-space:normal">${city.hubH1}</h1>
<div class="deck" style="text-align:center;margin:0 auto;max-width:30rem;font-size:1.1rem">${city.hubSub}</div>
</section>
<div class="reviews-grid" style="gap:1rem">
${Object.entries(cats).filter(([,c])=>{const s=new Set();return c.items.filter(v=>{if(s.has(v.creator_name))return false;s.add(v.creator_name);return true}).length>=3}).map(([slug,cat],i)=>{
  const first=cat.items[0];
  const thumb=first?.thumbnail||'';
  return`<a href="/${city.dir}/${slug}" class="review" style="text-decoration:none;transform:rotate(${[-2,1.5,-1,2.5,-1.5,.8,-2.5][i%7]}deg)">
    <div class="pin"></div><div class="tape-decor"></div>
    <div class="top-meta"><span class="name">${cat.title.toUpperCase()}</span><span class="rating"><i></i><i></i><i></i><i></i><i></i></span></div>
    <div class="thumb"><img src="${thumb}" alt="best ${cat.title.toLowerCase()} ${city.name} - food guide" loading="lazy"/>
    <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.8) 0%,transparent 50%);display:flex;align-items:flex-end;padding:1rem;z-index:2">
    <span style="font-family:Shrikhand;font-size:1.2rem;color:#fff">${cat.title}</span></div></div>
    <div class="corner-note">${cat.items.length} spots</div>
  </a>`;
}).join('\n')}
</div>
<div class="foot-nav"><a href="/">← BITEMAP HOME <span class="sub">ALL CITIES</span></a><a href="/toronto">TORONTO <span class="sub">THE OG</span></a><a href="https://apps.apple.com/ca/app/bitemap/id6746139076">GET THE APP <span class="sub">iOS + ANDROID</span></a></div>
</div>
</body></html>`;

  writeFileSync(join(cityDir,'index.html'),hubHtml);
  console.log(`  ✅ index.html (hub page)`);
  console.log(`  → ${artCount} articles, ${areaCount} areas`);
}

console.log('\n═══ ALL CITIES DONE ═══');
