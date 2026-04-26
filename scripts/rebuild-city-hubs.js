/**
 * Generate city hub pages by cloning toronto/index.html
 * and replacing Toronto-specific content with city-specific content.
 *
 * Usage: node scripts/rebuild-city-hubs.js
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const BUNNY = 'https://vz-9c9477c9-fd2.b-cdn.net';

function parseCSV(text){const r=[];let c=[];let f='';let q=false;for(let i=0;i<text.length;i++){const ch=text[i];const nx=text[i+1];if(q){if(ch==='"'&&nx==='"'){f+='"';i++}else if(ch==='"'){q=false}else{f+=ch}}else{if(ch==='"'){q=true}else if(ch===','){c.push(f.trim());f=''}else if(ch==='\n'){c.push(f.trim());if(c.length>1)r.push(c);c=[];f=''}else if(ch!=='\r'){f+=ch}}}if(f||c.length){c.push(f.trim());if(c.length>1)r.push(c)}return r}

const CITIES = {
  'los-angeles': {
    csv:'la.csv', name:'Los Angeles', short:'LA', issue:'№01',
    title:'THE LA FOOD ZINE',
    h1:'LOS ANGELES <span class="and">&amp;</span> EATS',
    sub:'a <u>sun-soaked</u> love letter to <u>LA</u> — in tacos, smoke &amp; palm trees.',
    kicker:'FIELD GUIDE — LA EDITION',
    price:'USD $6.66 · 34.0522° N, 118.2437° W',
    printed:'PRINTED IN SILVER LAKE',
    marquee:['THE LA FOOD ZINE','EAT LOCAL. EAT LOUD.','STARTED FROM THE TACO TRUCK NOW WE HERE','LA EATS DIFFERENT'],
    scribbles:['tacos forever!!','↓ dig in ↓'],
    postTitle:'Issue <em>01</em> — the LA drop',
    postDek:'spots · creators · one very full editor',
  },
  'vancouver': {
    csv:'vancouver.csv', name:'Vancouver', short:'VAN', issue:'№01',
    title:'THE VANCOUVER FOOD ZINE',
    h1:'VANCOUVER <span class="and">&amp;</span> EATS',
    sub:'a <u>rain-soaked</u> love letter to <u>Van</u> — in sushi, noodles &amp; mountain views.',
    kicker:'FIELD GUIDE — VANCOUVER EDITION',
    price:'CAD $6.66 · 49.2827° N, 123.1207° W',
    printed:'PRINTED IN GASTOWN',
    marquee:['THE VANCOUVER FOOD ZINE','EAT LOCAL. EAT LOUD.','RAINCITY EATS HEAVY','SUSHI CAPITAL OF NORTH AMERICA'],
    scribbles:['sushi weather!!','↓ dig in ↓'],
    postTitle:'Issue <em>01</em> — the Van drop',
    postDek:'spots · creators · one very full editor',
  },
  'dallas': {
    csv:'dallas.csv', name:'Dallas', short:'DFW', issue:'№01',
    title:'THE DALLAS FOOD ZINE',
    h1:'DALLAS <span class="and">&amp;</span> EATS',
    sub:'a <u>smoky</u> love letter to <u>the Big D</u> — in brisket, tacos &amp; sweet tea.',
    kicker:'FIELD GUIDE — DALLAS EDITION',
    price:'USD $6.66 · 32.7767° N, 96.7970° W',
    printed:'PRINTED IN DEEP ELLUM',
    marquee:['THE DALLAS FOOD ZINE','EAT LOCAL. EAT LOUD.','EVERYTHING IS BIGGER IN DALLAS','BBQ SMOKE AND CITY LIGHTS'],
    scribbles:['BBQ all day!!','↓ dig in ↓'],
    postTitle:'Issue <em>01</em> — the Dallas drop',
    postDek:'spots · creators · one very full editor',
  },
  'houston': {
    csv:'houston.csv', name:'Houston', short:'H-TOWN', issue:'№01',
    title:'THE HOUSTON FOOD ZINE',
    h1:'HOUSTON <span class="and">&amp;</span> EATS',
    sub:'a <u>diverse</u> love letter to <u>H-Town</u> — in Viet-Cajun, BBQ &amp; swangas.',
    kicker:'FIELD GUIDE — HOUSTON EDITION',
    price:'USD $6.66 · 29.7604° N, 95.3698° W',
    printed:'PRINTED IN MONTROSE',
    marquee:['THE HOUSTON FOOD ZINE','EAT LOCAL. EAT LOUD.','H-TOWN HOLDS IT DOWN','MOST DIVERSE FOOD CITY IN AMERICA'],
    scribbles:['chopped & screwed!!','↓ dig in ↓'],
    postTitle:'Issue <em>01</em> — the H-Town drop',
    postDek:'spots · creators · one very full editor',
  },
  'new-york': {
    csv:'new_york.csv', name:'New York', short:'NYC', issue:'№01',
    title:'THE NYC FOOD ZINE',
    h1:'NEW YORK <span class="and">&amp;</span> EATS',
    sub:'a <u>relentless</u> love letter to <u>NYC</u> — in dollar slices, bodega chops &amp; Michelin stars.',
    kicker:'FIELD GUIDE — NYC EDITION',
    price:'USD $6.66 · 40.7128° N, 74.0060° W',
    printed:'PRINTED IN WILLIAMSBURG',
    marquee:['THE NYC FOOD ZINE','EAT LOCAL. EAT LOUD.','DEAD ASS THE BEST FOOD','IF YOU CAN EAT HERE YOU CAN EAT ANYWHERE'],
    scribbles:['no sleep just eat!!','↓ dig in ↓'],
    postTitle:'Issue <em>01</em> — the NYC drop',
    postDek:'spots · creators · one very full editor',
  },
};

// Read Toronto template
const torontoHTML = readFileSync(join(root, 'toronto', 'index.html'), 'utf8');

// Layout patterns for collage grid (same as rebuild-all.js)
const layouts=[
  {c:'1/span 5',r:'1/span 4',rot:-2,big:true},{c:'6/span 3',r:'1/span 2',rot:2},{c:'6/span 3',r:'3/span 2',rot:-3},
  {c:'9/span 4',r:'1/span 3',rot:2,big:true},{c:'13/span 2',r:'1/span 2',rot:4},{c:'15/span 2',r:'1/span 2',rot:-3},
  {c:'1/span 3',r:'5/span 2',rot:-2},{c:'4/span 2',r:'5/span 2',rot:3},{c:'6/span 2',r:'5/span 2',rot:-3},
  {c:'8/span 3',r:'4/span 3',rot:3,big:true},{c:'11/span 2',r:'4/span 2',rot:-4},{c:'13/span 4',r:'5/span 3',rot:-1,big:true},
  {c:'1/span 3',r:'7/span 3',rot:-3,big:true},{c:'4/span 2',r:'7/span 2',rot:4},{c:'6/span 2',r:'7/span 2',rot:-3},
  {c:'8/span 3',r:'7/span 3',rot:2,big:true},{c:'11/span 2',r:'7/span 2',rot:-4},{c:'13/span 2',r:'8/span 2',rot:3},
  {c:'15/span 2',r:'8/span 2',rot:-2},{c:'1/span 4',r:'10/span 3',rot:2,big:true},{c:'5/span 2',r:'10/span 2',rot:-3},
  {c:'7/span 2',r:'10/span 2',rot:3},{c:'9/span 4',r:'10/span 3',rot:-2,big:true},{c:'13/span 2',r:'10/span 2',rot:3},
  {c:'15/span 2',r:'10/span 2',rot:-2},
];
const labelColors=['','label-yellow','label-ink','label-pink','label-teal','label-purple','label-lime','label-orange'];
const CATS_TITLES={
  'best-pho':'PHO','best-ramen':'RAMEN','best-sushi':'SUSHI','best-burger':'BURGERS',
  'best-pizza':'PIZZA','best-halal':'HALAL','best-steak':'STEAK','best-tacos':'TACOS',
  'best-indian':'INDIAN','best-chinese':'CHINESE','best-italian':'ITALIAN',
  'best-seafood':'SEAFOOD','best-dessert':'DESSERTS','best-coffee':'COFFEE',
  'best-wings':'WINGS','best-caribbean':'CARIBBEAN','best-ayce':'AYCE',
  'best-bbq':'BBQ','best-noodles':'NOODLES','best-fried-chicken':'FRIED CHICKEN',
  'best-shawarma':'SHAWARMA','best-brunch':'BRUNCH','best-korean-bbq':'KBBQ',
};

for (const [dir, city] of Object.entries(CITIES)) {
  console.log(`\n═══ ${city.name.toUpperCase()} ═══`);

  // Get article pages for this city
  const cityDir = join(root, dir);
  if (!existsSync(cityDir)) { console.log('  ❌ Dir not found'); continue; }
  const articles = readdirSync(cityDir).filter(f => f.startsWith('best-') && f.endsWith('.html'));

  // Get first thumbnail from each article's CSV data
  const csvPath = join(root, city.csv);
  if (!existsSync(csvPath)) { console.log('  ❌ CSV not found'); continue; }
  const csv = readFileSync(csvPath, 'utf8');
  const rows = parseCSV(csv);
  const headers = rows[0];
  const data = rows.slice(1).map(row => {
    const o = {}; headers.forEach((h, i) => { o[h] = row[i] || '' }); return o;
  }).filter(r => r.bunny_video_id);

  // Build cover grid items from existing article pages
  const gridItems = [];
  for (const articleFile of articles) {
    const slug = articleFile.replace('.html', '');
    const label = CATS_TITLES[slug] || slug.replace('best-', '').toUpperCase();
    // Find first video with bunny_id matching this cuisine
    const kw = slug.replace('best-', '').replace(/-/g, ' ');
    const match = data.find(v => {
      const cap = (v.caption || '').toLowerCase();
      const rest = (v.restaurant || '').toLowerCase();
      return cap.includes(kw) || rest.includes(kw);
    }) || data[gridItems.length % data.length]; // fallback to any video
    const thumb = match ? `${BUNNY}/${match.bunny_video_id}/thumbnail.jpg` : '';
    if (thumb) gridItems.push({ href: `/${dir}/${slug}`, title: label, img: thumb });
  }

  // Also add remaining videos as generic tiles
  const usedIds = new Set(gridItems.map(g => g.img));
  for (const v of data) {
    if (gridItems.length >= layouts.length) break;
    const thumb = `${BUNNY}/${v.bunny_video_id}/thumbnail.jpg`;
    if (usedIds.has(thumb)) continue;
    usedIds.add(thumb);
    gridItems.push({ href: `/${dir}`, title: (v.restaurant || 'SPOT').substring(0, 15).toUpperCase(), img: thumb });
  }

  console.log(`  ${gridItems.length} grid items, ${articles.length} articles`);

  // Build collage grid HTML
  let gridHTML = '';
  const n = Math.min(gridItems.length, layouts.length);
  for (let i = 0; i < n; i++) {
    const it = gridItems[i], ly = layouts[i];
    const lc = labelColors[i % labelColors.length];
    const label = ly.big
      ? `<span class="feat-label ${lc}">${it.title} ↗</span>`
      : `<span class="sub-label ${lc}">${it.title}</span>`;
    const tape = i % 5 === 0 ? `<div class="tape${i%3===0?' red':''}" style="top:-10px;${i%2?'left':'right'}:${20+i%30}%;width:${55+i%20}px;height:${16+i%5}px;transform:rotate(${-4+i%8}deg)"></div>` : '';
    gridHTML += `
      <a class="hoverable mini" data-type="posts" href="${it.href}" style="--hover-rot:${ly.rot}deg;grid-column:${ly.c};grid-row:${ly.r};transform:rotate(${ly.rot}deg)">
        ${ly.big ? label : ''}
        <div class="clip"><img src="${it.img}" alt="best ${it.title.toLowerCase()} ${city.name}" loading="lazy"/></div>
        ${!ly.big ? label : ''}${tape}
      </a>`;
  }
  // Stamp
  gridHTML += `
      <div style="grid-column:13/span 4;grid-row:3/span 2;display:flex;flex-direction:column;gap:.3rem;padding:.4rem;justify-content:center">
        <div class="stamp" style="align-self:flex-start">VIDEO VERIFIED</div>
        <p class="mono" style="font-size:.7rem;line-height:1.3;margin:0">${articles.length} lists · ${city.name}</p>
        <div class="barcode" aria-hidden="true"></div>
      </div>`;
  // Closing typographic card
  const lastRow = Math.ceil(n / 3) * 2 + 2;
  gridHTML += `
      <div style="grid-column:1/span 16;grid-row:${lastRow}/span 1;display:flex;align-items:center;justify-content:center;background:var(--ink);color:var(--paper);padding:1.2rem;transform:rotate(-.3deg);box-shadow:6px 6px 0 var(--red);margin-top:1rem">
        <div style="font-family:'Shrikhand',cursive;font-size:clamp(1.6rem,4vw,3rem);letter-spacing:.02em">↓ more lists every <span style="color:var(--yellow)">Friday</span> ↓</div>
      </div>`;

  // Now clone the Toronto template and do replacements
  let html = torontoHTML;

  // SEO meta
  html = html.replace('THE TORONTO FOOD ZINE — ISSUE №06 | BiteMap', `${city.title} — ISSUE ${city.issue} | BiteMap`);
  html = html.replace(/The definitive Toronto food guide\. A chaotic love letter to the 6ix — in noodles, smoke & skyline\. Video reviews from trusted food creators\./g,
    `The definitive ${city.name} food guide. ${city.sub.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')} Video reviews from trusted food creators.`);
  html = html.replace('https://www.bitemap.fun/toronto', `https://www.bitemap.fun/${dir}`);
  html = html.replace(/THE TORONTO FOOD ZINE \| BiteMap/g, `${city.title} | BiteMap`);
  html = html.replace(/A chaotic love letter to the 6ix — in noodles, smoke & skyline\. Video reviews from real food creators\./g,
    `${city.sub.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')} Video reviews from real food creators.`);

  // Marquee
  const marqueeHTML = city.marquee.map(l => `<span><i class="dot"></i> ${l}</span>`).join('');
  const oldMarquee = html.match(/<div class="marquee-track">[\s\S]*?<\/div>/);
  if (oldMarquee) {
    html = html.replace(oldMarquee[0], `<div class="marquee-track">${marqueeHTML}${marqueeHTML}</div>`);
  }

  // Masthead
  html = html.replace('<b>THE TORONTO FOOD ZINE</b>', `<b>${city.title}</b>`);
  html = html.replace('VOL. VI · ISSUE №06 · APRIL 2026', `VOL. I · ISSUE ${city.issue} · APRIL 2026`);
  html = html.replace('CDN $6.66 · 43.6532° N, 79.3832° W', city.price);
  html = html.replace('PRINTED IN KENSINGTON', city.printed);

  // Title block
  html = html.replace('FIELD GUIDE № 06', city.kicker);
  html = html.replace('TORONTO <span class="and">&amp;</span> EATS', city.h1);

  // Subtitle
  html = html.replace('a <u>chaotic</u> love letter to the <u>6ix</u> — in noodles, smoke &amp; skyline.', city.sub);

  // Scribbles
  html = html.replace('>eat everything!!</', `>${city.scribbles[0]}</`);

  // Post block
  html = html.replace('Issue <em>06</em> — the big drop', city.postTitle);
  html = html.replace(/52 spots • 6 'hoods • 1 very full editor/g, city.postDek);

  // Replace cover grid
  const gridStartMark = '<div class="cover-grid">';
  const gridEndMark = '</div><!-- /previous post -->';
  const gs = html.indexOf(gridStartMark);
  const ge = html.indexOf(gridEndMark);
  if (gs !== -1 && ge !== -1) {
    html = html.substring(0, gs) + `<div class="cover-grid">${gridHTML}\n    </div>\n      </div><!-- /previous post -->` + html.substring(ge + gridEndMark.length);
  }

  // Replace all /toronto/ links with /{dir}/
  html = html.replace(/\/toronto\//g, `/${dir}/`);
  html = html.replace(/href="\/toronto"/g, `href="/${dir}"`);

  // Remove Toronto-specific SVG background iconography (CN Tower, maple leaf, OVO owl, etc.)
  // Keep the bg-layer div but empty it for non-Toronto cities
  const bgStart = html.indexOf('<!-- BACKGROUND TORONTO ICONOGRAPHY -->');
  const bgEnd = html.indexOf('<!-- MASTHEAD -->');
  if (bgStart !== -1 && bgEnd !== -1) {
    html = html.substring(0, bgStart) + `<!-- BACKGROUND ${city.name.toUpperCase()} -->\n    <div class="bg-layer" aria-hidden="true"></div>\n\n    ` + html.substring(bgEnd);
  }

  // Contents section — update links
  html = html.replace(/TORONTO FOOD ZINE/g, `${city.short} FOOD ZINE`);

  // Write
  writeFileSync(join(cityDir, 'index.html'), html);
  console.log(`  ✅ ${dir}/index.html — zine cover with ${n} tiles`);
}

console.log('\n═══ ALL CITY HUBS DONE ═══');
