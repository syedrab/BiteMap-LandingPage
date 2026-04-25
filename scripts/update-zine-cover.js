/**
 * Update the Toronto Zine cover page (toronto/index.html)
 * Replace the hardcoded cover-grid with real article data + Bunny thumbnails
 *
 * Usage: node scripts/update-zine-cover.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const articles = JSON.parse(readFileSync(join(root, 'data', 'articles.json'), 'utf8'));
const BUNNY = 'https://vz-9c9477c9-fd2.b-cdn.net';

// Creative titles map
const TITLES = {
  'best-pho':'PHO','best-ramen':'RAMEN','best-sushi':'SUSHI','best-burger':'BURGERS',
  'best-pizza':'PIZZA','best-halal':'HALAL','best-steak':'STEAK','best-tacos':'TACOS',
  'best-indian':'INDIAN','best-chinese':'CHINESE','best-italian':'ITALIAN',
  'best-seafood':'SEAFOOD','best-dessert':'DESSERTS','best-coffee':'COFFEE',
  'best-wings':'WINGS','best-caribbean':'CARIBBEAN','best-ayce':'AYCE',
  'best-bbq':'BBQ','best-noodles':'NOODLES','best-fried-chicken':'FRIED CHICKEN',
  'best-shawarma':'SHAWARMA','best-brunch':'BRUNCH',
};

const LABEL_COLORS = [
  '','label-yellow','label-ink','label-pink','label-teal',
  'label-purple','label-lime','label-orange','label-red',
];

// Guides + Areas
const GUIDES = [
  {slug:'guide-most-viral', title:'MOST VIRAL', type:'guides'},
  {slug:'guide-hidden-gems', title:'HIDDEN GEMS', type:'guides'},
  {slug:'guide-spice-scale', title:'SPICE SCALE', type:'guides'},
  {slug:'guide-worth-the-hype', title:'HYPE CHECK', type:'guides'},
  {slug:'guide-comfort-food', title:'COMFORT FOOD', type:'guides'},
  {slug:'guide-creators-picks', title:'CREATORS\' PICKS', type:'guides'},
  {slug:'guide-mukbang-approved', title:'MUKBANG', type:'guides'},
  {slug:'guide-under-15', title:'UNDER $15', type:'guides'},
  {slug:'guide-date-night', title:'DATE NIGHT', type:'guides'},
  {slug:'guide-first-bite-reaction', title:'FIRST BITE', type:'guides'},
];

const AREAS = [
  {slug:'area-mississauga', title:'MISSISSAUGA', type:'areas'},
  {slug:'area-scarborough', title:'SCARBOROUGH', type:'areas'},
  {slug:'area-north-york', title:'NORTH YORK', type:'areas'},
  {slug:'area-downtown-yonge', title:'DOWNTOWN', type:'areas'},
  {slug:'area-queen-west', title:'QUEEN WEST', type:'areas'},
  {slug:'area-yorkville-bloor', title:'YORKVILLE', type:'areas'},
  {slug:'area-ossington-dundas-w', title:'OSSINGTON', type:'areas'},
  {slug:'area-church-wellesley', title:'THE VILLAGE', type:'areas'},
  {slug:'area-greater-toronto', title:'GTA', type:'areas'},
  {slug:'area-brampton', title:'BRAMPTON', type:'areas'},
];

// Build grid items from real data
const gridItems = [];

// Articles (posts) — get first video thumbnail from each
for (const [slug, cat] of Object.entries(articles.categories)) {
  if (!cat.viable || !cat.items.length) continue;
  const first = cat.items[0];
  const thumb = first.video_id ? `${BUNNY}/${first.video_id}/thumbnail.jpg` : null;
  if (!thumb) continue;
  gridItems.push({
    href: `/toronto/${slug}`,
    title: TITLES[slug] || slug.replace('best-','').toUpperCase(),
    img: thumb,
    type: 'posts',
    count: cat.count,
  });
}

// Add guides (use first article's thumbnail as proxy)
const allItems = Object.values(articles.categories).flatMap(c => c.items || []);
for (let i = 0; i < GUIDES.length && i < allItems.length; i++) {
  const g = GUIDES[i];
  const vid = allItems[Math.min(i * 3, allItems.length - 1)];
  const thumb = vid?.video_id ? `${BUNNY}/${vid.video_id}/thumbnail.jpg` : null;
  if (thumb) {
    gridItems.push({ href: `/toronto/${g.slug}`, title: g.title, img: thumb, type: 'guides', count: 0 });
  }
}

// Add areas
for (let i = 0; i < AREAS.length && i < allItems.length; i++) {
  const a = AREAS[i];
  const vid = allItems[Math.min(i * 4 + 2, allItems.length - 1)];
  const thumb = vid?.video_id ? `${BUNNY}/${vid.video_id}/thumbnail.jpg` : null;
  if (thumb) {
    gridItems.push({ href: `/toronto/${a.slug}`, title: a.title, img: thumb, type: 'areas', count: 0 });
  }
}

console.log(`${gridItems.length} grid items prepared`);

// Define layout patterns for the collage grid (16-col, varying sizes)
const layouts = [
  // Row 1-4: Big hero + sidekicks
  {col:'1/span 5', row:'1/span 4', rot:-2, size:'hero'},
  {col:'6/span 3', row:'1/span 2', rot:2, size:'med'},
  {col:'6/span 3', row:'3/span 2', rot:-3, size:'med'},
  {col:'9/span 4', row:'1/span 3', rot:2, size:'large'},
  {col:'13/span 2', row:'1/span 2', rot:4, size:'sm'},
  {col:'15/span 2', row:'1/span 2', rot:-3, size:'sm'},
  // Row 5-6
  {col:'1/span 3', row:'5/span 2', rot:-2, size:'med'},
  {col:'4/span 2', row:'5/span 2', rot:3, size:'sm'},
  {col:'6/span 2', row:'5/span 2', rot:-3, size:'sm'},
  {col:'8/span 3', row:'4/span 3', rot:3, size:'large'},
  {col:'11/span 2', row:'4/span 2', rot:-4, size:'sm'},
  {col:'13/span 4', row:'5/span 3', rot:-1, size:'large'},
  // Row 7-9
  {col:'1/span 3', row:'7/span 3', rot:-3, size:'large'},
  {col:'4/span 2', row:'7/span 2', rot:4, size:'sm'},
  {col:'6/span 2', row:'7/span 2', rot:-3, size:'sm'},
  {col:'4/span 4', row:'9/span 1', rot:-1, size:'wide'},
  {col:'8/span 3', row:'7/span 3', rot:2, size:'large'},
  {col:'11/span 2', row:'7/span 2', rot:-4, size:'sm'},
  {col:'13/span 2', row:'8/span 2', rot:3, size:'sm'},
  {col:'15/span 2', row:'8/span 2', rot:-2, size:'sm'},
  // Row 10-12
  {col:'1/span 4', row:'10/span 3', rot:2, size:'large'},
  {col:'5/span 2', row:'10/span 2', rot:-3, size:'sm'},
  {col:'7/span 2', row:'10/span 2', rot:3, size:'sm'},
  {col:'9/span 4', row:'10/span 3', rot:-2, size:'large'},
  {col:'13/span 2', row:'10/span 2', rot:3, size:'sm'},
  {col:'15/span 2', row:'10/span 2', rot:-2, size:'sm'},
  // Row 13-15
  {col:'1/span 3', row:'13/span 2', rot:-3, size:'med'},
  {col:'5/span 2', row:'12/span 2', rot:3, size:'sm'},
  {col:'7/span 2', row:'12/span 2', rot:-4, size:'sm'},
  {col:'9/span 4', row:'13/span 3', rot:2, size:'large'},
  {col:'13/span 4', row:'13/span 3', rot:-2, size:'large'},
  // Row 16-18
  {col:'1/span 4', row:'16/span 3', rot:3, size:'large'},
  {col:'5/span 4', row:'16/span 3', rot:-2, size:'large'},
  {col:'9/span 2', row:'16/span 2', rot:3, size:'sm'},
  {col:'11/span 2', row:'16/span 2', rot:-3, size:'sm'},
  {col:'13/span 4', row:'16/span 3', rot:-2, size:'large'},
  // Row 19-21
  {col:'1/span 3', row:'19/span 3', rot:2, size:'large'},
  {col:'4/span 2', row:'19/span 2', rot:-3, size:'sm'},
  {col:'6/span 3', row:'19/span 2', rot:3, size:'med'},
  {col:'9/span 4', row:'19/span 3', rot:-2, size:'large'},
  {col:'13/span 2', row:'19/span 2', rot:-4, size:'sm'},
  {col:'15/span 2', row:'19/span 2', rot:3, size:'sm'},
];

// Build HTML
let gridHTML = '';
for (let i = 0; i < Math.min(gridItems.length, layouts.length); i++) {
  const item = gridItems[i];
  const lay = layouts[i];
  const labelColor = LABEL_COLORS[i % LABEL_COLORS.length];
  const isHero = lay.size === 'hero' || lay.size === 'large';
  const label = isHero
    ? `<span class="feat-label ${labelColor}">${item.title} ↗</span>`
    : `<span class="sub-label ${labelColor}">${item.title}</span>`;

  gridHTML += `
      <a class="hoverable mini" data-type="${item.type}" href="${item.href}" style="--hover-rot:${lay.rot > 0 ? '' : ''}${lay.rot}deg;grid-column:${lay.col};grid-row:${lay.row};transform:rotate(${lay.rot}deg)">
        ${isHero ? label : ''}
        <div class="clip"><img src="${item.img}" alt="${item.title}" loading="lazy"/></div>
        ${!isHero ? label : ''}${i % 5 === 0 ? `\n        <div class="tape${i%3===0?' red':i%3===1?' blue':''}" style="top:-10px;${i%2?'left':'right'}:${20+i%30}%;width:${55+i%20}px;height:${16+i%5}px;transform:rotate(${-4+i%8}deg)"></div>` : ''}
      </a>`;
}

// Add stamp block
gridHTML += `
      <div style="grid-column:13/span 4;grid-row:3/span 2;display:flex;flex-direction:column;gap:.3rem;padding:.4rem;justify-content:center">
        <div class="stamp" style="align-self:flex-start">VIDEO VERIFIED</div>
        <p class="mono" style="font-size:.7rem;line-height:1.3;margin:0">${gridItems.length} articles. 10 guides. 10 areas.</p>
        <div class="barcode" aria-hidden="true"></div>
      </div>`;

// Read and replace in index.html
let html = readFileSync(join(root, 'toronto', 'index.html'), 'utf8');

// Find the cover-grid and replace its contents
const gridStart = html.indexOf('<!-- COVER COLLAGE');
const gridEnd = html.indexOf('</div> <!-- /cover-grid -->');

if (gridStart === -1) {
  // Try alternate end marker
  // Find closing of cover-grid by counting from start
  const altStart = html.indexOf('<div class="cover-grid">');
  if (altStart === -1) {
    console.error('Could not find cover-grid in index.html');
    process.exit(1);
  }
  // Find the matching </div> — it's before the </div> of post-block
  // Just replace everything between <div class="cover-grid"> and the next post-block close or contents section
  const contentsIdx = html.indexOf('<!-- ========== CONTENTS');
  if (contentsIdx === -1) {
    console.error('Could not find CONTENTS section');
    process.exit(1);
  }
  // Find the </div></div> before contents (closing cover-grid + post-block + post-feed)
  const beforeContents = html.lastIndexOf('</div>', contentsIdx);
  const beforeBefore = html.lastIndexOf('</div>', beforeContents - 1);
  const beforeBeforeBefore = html.lastIndexOf('</div>', beforeBefore - 1);

  // Safer: just replace from cover-grid start to just before contents
  const newGrid = `<div class="cover-grid">\n${gridHTML}\n    </div>\n    </div>\n    </div>\n\n`;
  const sectionBefore = html.substring(0, altStart);
  const sectionAfter = html.substring(contentsIdx);
  html = sectionBefore + newGrid + '    ' + sectionAfter;
} else {
  console.log('Found COVER COLLAGE comment');
}

writeFileSync(join(root, 'toronto', 'index.html'), html);
console.log('Updated toronto/index.html with real article thumbnails');
