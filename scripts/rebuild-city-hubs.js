/**
 * Generate city hub pages from toronto/index.html template + data/cities.json.
 * Replaces ALL Toronto-specific content: marquee, masthead, title, subtitle,
 * filter counts, TOC, colophon, CN Tower, scribbles, collage grid.
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
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

const cities = JSON.parse(readFileSync(join(root, 'data', 'cities.json'), 'utf8'));
let torontoHTML = ''; // loaded after Toronto is updated

// Layout patterns for collage grid
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

// First, update Toronto itself (TOC, filter counts, colophon)
// Then use Toronto as template for other cities
function updateToronto() {
  const city = cities.toronto;
  const cityDir = join(root, city.dir);
  const articles = readdirSync(cityDir).filter(f => f.startsWith('best-') && f.endsWith('.html')).map(f => f.replace('.html',''));
  const areas = readdirSync(cityDir).filter(f => f.startsWith('area-') && f.endsWith('.html')).map(f => f.replace('.html',''));
  const guides = readdirSync(cityDir).filter(f => f.startsWith('guide-') && f.endsWith('.html')).map(f => f.replace('.html',''));

  let html = readFileSync(join(cityDir, 'index.html'), 'utf8');

  // Fix filter counts
  html = html.replace(/data-filter="posts">Posts <span class="count">\d+<\/span>/, `data-filter="posts">Posts <span class="count">${articles.length}</span>`);
  html = html.replace(/data-filter="areas">Areas <span class="count">\d+<\/span>/, `data-filter="areas">Areas <span class="count">${areas.length}</span>`);
  html = html.replace(/data-filter="guides">Guides <span class="count">\d+<\/span>/, `data-filter="guides">Guides <span class="count">${guides.length}</span>`);

  // Fix TOC
  const tocDescs = city.toc_descriptions || {};
  let tocHTML = '';
  let pgNum = 4;
  for (const slug of articles) {
    const label = CATS_TITLES[slug] || slug.replace('best-','').toUpperCase();
    const desc = tocDescs[slug] || '';
    tocHTML += `      <a href="/toronto/${slug}"><span class="pg">${String(pgNum).padStart(2,'0')}</span><span class="t"><b>${label}</b> ${esc(desc)}</span><span class="arrow">↗</span></a>\n`;
    pgNum += 4 + Math.floor(Math.random() * 4);
  }
  for (const slug of guides) {
    const label = slug.replace('guide-','').replace(/-/g,' ').toUpperCase();
    tocHTML += `      <a href="/toronto/${slug}"><span class="pg">${String(pgNum).padStart(2,'0')}</span><span class="t"><b>${label}</b> guide</span><span class="arrow">↗</span></a>\n`;
    pgNum += 3;
  }
  for (const slug of areas) {
    const label = slug.replace('area-','').replace(/-/g,' ').toUpperCase();
    tocHTML += `      <a href="/toronto/${slug}"><span class="pg">${String(pgNum).padStart(2,'0')}</span><span class="t"><b>${label}</b> area</span><span class="arrow">↗</span></a>\n`;
    pgNum += 2;
  }

  const tocStart = html.indexOf('<div class="toc">');
  const tocEnd = html.indexOf('</div>', tocStart + 17);
  if (tocStart !== -1 && tocEnd !== -1) {
    html = html.substring(0, tocStart) + `<div class="toc">\n${tocHTML}    </div>` + html.substring(tocEnd + 6);
  }

  writeFileSync(join(cityDir, 'index.html'), html);
  console.log(`  ✅ toronto/index.html — ${articles.length} articles, ${areas.length} areas, ${guides.length} guides`);
}

console.log('═══ TORONTO ═══');
updateToronto();

// Now read updated Toronto as template for other cities
torontoHTML = readFileSync(join(root, 'toronto', 'index.html'), 'utf8');

for (const [cityKey, city] of Object.entries(cities)) {
  if (cityKey === 'toronto') continue;

  console.log(`\n═══ ${city.name.toUpperCase()} ═══`);

  const cityDir = join(root, city.dir);
  if (!existsSync(cityDir)) { console.log('  ❌ Dir not found'); continue; }

  // Get existing article pages
  const articles = readdirSync(cityDir).filter(f => f.startsWith('best-') && f.endsWith('.html')).map(f => f.replace('.html',''));
  const areas = readdirSync(cityDir).filter(f => f.startsWith('area-') && f.endsWith('.html')).map(f => f.replace('.html',''));
  const guides = readdirSync(cityDir).filter(f => f.startsWith('guide-') && f.endsWith('.html')).map(f => f.replace('.html',''));

  // Get thumbnails from CSV
  const csvPath = join(root, city.csv);
  let csvData = [];
  if (existsSync(csvPath)) {
    const csv = readFileSync(csvPath, 'utf8');
    const rows = parseCSV(csv);
    const headers = rows[0];
    csvData = rows.slice(1).map(row => {
      const o = {}; headers.forEach((h, i) => { o[h] = row[i] || '' }); return o;
    }).filter(r => r.bunny_video_id && r.bunny_video_id !== 'null');
  }

  // Build collage grid items
  const gridItems = [];
  for (const slug of articles) {
    const label = CATS_TITLES[slug] || slug.replace('best-','').toUpperCase();
    const kw = slug.replace('best-','').replace(/-/g,' ');
    const match = csvData.find(v => {
      const cap = (v.caption||'').toLowerCase();
      const rest = (v.restaurant||'').toLowerCase();
      return cap.includes(kw) || rest.includes(kw);
    }) || csvData[gridItems.length % Math.max(csvData.length, 1)];
    const thumb = match?.bunny_video_id ? `${BUNNY}/${match.bunny_video_id}/thumbnail.jpg` : '';
    if (thumb) gridItems.push({ href: `/${city.dir}/${slug}`, title: label, img: thumb, type: 'posts' });
  }
  for (const slug of areas) {
    const match = csvData[gridItems.length % Math.max(csvData.length, 1)];
    const thumb = match?.bunny_video_id ? `${BUNNY}/${match.bunny_video_id}/thumbnail.jpg` : '';
    if (thumb) gridItems.push({ href: `/${city.dir}/${slug}`, title: slug.replace('area-','').toUpperCase(), img: thumb, type: 'areas' });
  }
  for (const slug of guides) {
    const match = csvData[gridItems.length % Math.max(csvData.length, 1)];
    const thumb = match?.bunny_video_id ? `${BUNNY}/${match.bunny_video_id}/thumbnail.jpg` : '';
    if (thumb) gridItems.push({ href: `/${city.dir}/${slug}`, title: slug.replace('guide-','').toUpperCase(), img: thumb, type: 'guides' });
  }
  // Fill remaining slots with extra CSV thumbnails
  const usedImgs = new Set(gridItems.map(g => g.img));
  for (const v of csvData) {
    if (gridItems.length >= layouts.length) break;
    const thumb = `${BUNNY}/${v.bunny_video_id}/thumbnail.jpg`;
    if (usedImgs.has(thumb)) continue;
    usedImgs.add(thumb);
    gridItems.push({ href: `/${city.dir}`, title: (v.restaurant||'SPOT').substring(0,15).toUpperCase(), img: thumb, type: 'posts' });
  }

  console.log(`  ${gridItems.length} grid items, ${articles.length} articles, ${areas.length} areas, ${guides.length} guides`);

  // ── Build collage grid HTML ──
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
      <a class="hoverable mini" data-type="${it.type}" href="${it.href}" style="--hover-rot:${ly.rot}deg;grid-column:${ly.c};grid-row:${ly.r};transform:rotate(${ly.rot}deg)">
        ${ly.big ? label : ''}
        <div class="clip"><img src="${it.img}" alt="best ${it.title.toLowerCase()} ${city.name}" loading="lazy"/></div>
        ${!ly.big ? label : ''}${tape}
      </a>`;
  }
  gridHTML += `
      <div style="grid-column:13/span 4;grid-row:3/span 2;display:flex;flex-direction:column;gap:.3rem;padding:.4rem;justify-content:center">
        <div class="stamp" style="align-self:flex-start">VIDEO VERIFIED</div>
        <p class="mono" style="font-size:.7rem;line-height:1.3;margin:0">${articles.length} lists · ${city.name}</p>
        <div class="barcode" aria-hidden="true"></div>
      </div>`;

  // ── Build TOC HTML ──
  const tocDescs = city.toc_descriptions || {};
  let tocHTML = '';
  let pgNum = 4;
  for (const slug of articles) {
    const label = CATS_TITLES[slug] || slug.replace('best-','').toUpperCase();
    const desc = tocDescs[slug] || '';
    tocHTML += `      <a href="/${city.dir}/${slug}"><span class="pg">${String(pgNum).padStart(2,'0')}</span><span class="t"><b>${label}</b> ${esc(desc)}</span><span class="arrow">↗</span></a>\n`;
    pgNum += 4 + Math.floor(Math.random() * 6);
  }
  if (!tocHTML) {
    tocHTML = `      <a href="/${city.dir}"><span class="pg">01</span><span class="t"><b>Coming Soon</b> more lists dropping every Friday</span><span class="arrow">↗</span></a>\n`;
  }

  // ── Build marquee HTML ──
  const marqueeItems = city.marquee.map(l => `<span><i class="dot"></i> ${l}</span>`).join('');
  const marqueeHTML = marqueeItems + marqueeItems; // doubled for loop

  // ── Real filter counts ──
  const postCount = articles.length;
  const areaCount = areas.length;
  const guideCount = guides.length;

  // ── Start with Toronto template ──
  let html = torontoHTML;

  // ── 1. SEO meta ──
  html = html.replace(/THE TORONTO FOOD ZINE — ISSUE №06 \| BiteMap/g, `${city.hub.title} — ISSUE ${city.issue} | BiteMap`);
  html = html.replace(/The definitive Toronto food guide\.[^"]*Video reviews from trusted food creators\./g,
    `The definitive ${city.name} food guide. ${(city.hub.sub||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&')} Video reviews from trusted food creators.`);
  html = html.replace(/https:\/\/www\.bitemap\.fun\/toronto/g, `https://www.bitemap.fun/${city.dir}`);
  html = html.replace(/THE TORONTO FOOD ZINE \| BiteMap/g, `${city.hub.title} | BiteMap`);
  html = html.replace(/A chaotic love letter to the 6ix[^"]*Video reviews from real food creators\./g,
    `${(city.hub.sub||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&')} Video reviews from real food creators.`);

  // ── 2. Marquee ──
  html = html.replace(/<div class="marquee-track">[\s\S]*?<\/div>/, `<div class="marquee-track">${marqueeHTML}</div>`);

  // ── 3. Masthead ──
  html = html.replace('<b>THE TORONTO FOOD ZINE</b>', `<b>${city.hub.title}</b>`);
  html = html.replace(/VOL\. VI · ISSUE №06 · APRIL 2026/, `VOL. ${city.vol} · ISSUE ${city.issue} · APRIL 2026`);
  html = html.replace(/CDN \$6\.66 · 43\.6532° N, 79\.3832° W/, `${city.price} · ${city.coords}`);
  html = html.replace('PRINTED IN KENSINGTON', city.printed);

  // ── 4. Title + kicker ──
  html = html.replace('FIELD GUIDE № 06', city.hub.kicker);
  html = html.replace('TORONTO <span class="and">&amp;</span> EATS', city.hub.h1);

  // ── 5. Subtitle ──
  html = html.replace(
    'a <u>chaotic</u> love letter to the <u>6ix</u> — in noodles, smoke &amp; skyline.',
    city.hub.sub
  );

  // ── 6. Filter counts — replace with real numbers ──
  html = html.replace(
    /data-filter="posts">Posts <span class="count">\d+<\/span>/,
    `data-filter="posts">Posts <span class="count">${postCount}</span>`
  );
  html = html.replace(
    /data-filter="areas">Areas <span class="count">\d+<\/span>/,
    `data-filter="areas">Areas <span class="count">${areaCount}</span>`
  );
  html = html.replace(
    /data-filter="guides">Guides <span class="count">\d+<\/span>/,
    `data-filter="guides">Guides <span class="count">${guideCount}</span>`
  );

  // ── 7. Post head ──
  html = html.replace('Issue <em>06</em> — the big drop', `Issue <em>01</em> — the ${city.short} drop`);
  html = html.replace(/\d+ spots • \d+ 'hoods • 1 very full editor/g,
    `${postCount} lists · ${areaCount} areas · ${guideCount} guides`);
  html = html.replace(/\d+ lists · \d+ areas · \d+ guides/g,
    `${postCount} lists · ${areaCount} areas · ${guideCount} guides`);

  // ── 8. Scribbles ──
  html = html.replace('>eat everything!!<', `>${city.scribbles[0]}<`);

  // ── 9. Cover grid — replace entirely ──
  const gridStartStr = '<div class="cover-grid">';
  const gridEndStr = '</div><!-- /previous post -->';
  const gs = html.indexOf(gridStartStr);
  const ge = html.indexOf(gridEndStr);
  if (gs !== -1 && ge !== -1) {
    html = html.substring(0, gs) + `<div class="cover-grid">${gridHTML}\n    </div>\n      </div><!-- /previous post -->` + html.substring(ge + gridEndStr.length);
  }

  // ── 10. TOC section — replace with real article links ──
  const tocStart = html.indexOf('<div class="toc">');
  const tocEnd = html.indexOf('</div>', tocStart + 17);
  if (tocStart !== -1 && tocEnd !== -1) {
    html = html.substring(0, tocStart) + `<div class="toc">\n${tocHTML}    </div>` + html.substring(tocEnd + 6);
  }

  // ── 11. Colophon — city-specific ──
  html = html.replace(
    /Made in a 4th-floor walk-up in Kensington by editors who have eaten too much and regret nothing\./,
    city.colophon.text
  );
  html = html.replace(
    /TORONTO · 43\.6532°N · 79\.3832°W/,
    city.colophon.coords
  );

  // ── 12. Remove Toronto background SVGs (CN Tower, maple leaf, OVO owl, etc.) ──
  const bgStart = html.indexOf('<!-- BACKGROUND TORONTO ICONOGRAPHY -->');
  const bgEnd = html.indexOf('<!-- MASTHEAD -->');
  if (bgStart !== -1 && bgEnd !== -1) {
    html = html.substring(0, bgStart) + `<!-- BACKGROUND ${city.name.toUpperCase()} -->\n    <div class="bg-layer" aria-hidden="true"></div>\n\n    ` + html.substring(bgEnd);
  }

  // ── 13. Remove flying CN Tower ──
  const cnStart = html.indexOf('<!-- Flying CN Tower -->');
  const cnEnd = html.indexOf('</div>', html.indexOf('fly-tower', cnStart) + 10);
  if (cnStart !== -1 && cnEnd !== -1) {
    html = html.substring(0, cnStart) + html.substring(cnEnd + 6);
  }

  // ── 14. Fix all remaining /toronto/ links ──
  html = html.replace(/\/toronto\//g, `/${city.dir}/`);
  html = html.replace(/href="\/toronto"/g, `href="/${city.dir}"`);

  // ── 15. Fix remaining "TORONTO FOOD ZINE" text refs ──
  html = html.replace(/TORONTO FOOD ZINE/g, `${city.short} FOOD ZINE`);

  // ── 16. Remove CN Tower toggle text ──
  html = html.replace('CN Tower scroll', `${city.short} scroll`);

  // ── 17. Fix barcode seed ──
  html = html.replace("'TOFOODZINE06'", `'${city.short.replace(/[^A-Z]/g,'')}FOODZINE01'`);

  // ── 17. Fix filter JS — make grid shrink when items hidden ──
  // Add grid auto-resize after filtering
  html = html.replace(
    "grid.classList.toggle('filtered', filtering);",
    "grid.classList.toggle('filtered', filtering);\n    // Shrink grid height to fit visible items\n    grid.style.gridTemplateRows = '';"
  );

  writeFileSync(join(cityDir, 'index.html'), html);
  console.log(`  ✅ ${city.dir}/index.html`);
}

console.log('\n═══ ALL CITY HUBS DONE ═══');
