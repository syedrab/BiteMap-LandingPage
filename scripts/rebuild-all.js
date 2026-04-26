/**
 * FULL REBUILD: Parse Toronto Viral.csv, categorize into articles/guides/areas,
 * generate all HTML pages with:
 * - Real Bunny CDN thumbnails
 * - Links to /v/{bunny_video_id}
 * - HLS playlist URLs for video playback
 *
 * Usage: node scripts/rebuild-all.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const BUNNY_CDN = 'https://vz-9c9477c9-fd2.b-cdn.net';

// ── CSV Parser ──
function parseCSV(text) {
  const rows = []; let current = []; let field = ''; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]; const nx = text[i+1];
    if (inQ) { if (ch==='"'&&nx==='"'){field+='"';i++} else if(ch==='"'){inQ=false} else {field+=ch} }
    else { if(ch==='"'){inQ=true} else if(ch===','){current.push(field.trim());field=''} else if(ch==='\n'){current.push(field.trim());if(current.length>1)rows.push(current);current=[];field=''} else if(ch!=='\r'){field+=ch} }
  }
  if(field||current.length){current.push(field.trim());if(current.length>1)rows.push(current)}
  return rows;
}

const csv = readFileSync(join(root, 'Toronto Viral.csv'), 'utf8');
const allRows = parseCSV(csv);
const headers = allRows[0];
const data = allRows.slice(1).map(row => {
  const o = {}; headers.forEach((h,i) => { o[h] = row[i]||''; });
  o.views = parseInt(o.views)||0; o.likes = parseInt(o.likes)||0;
  o.saves = parseInt(o.saves)||0; o.shares = parseInt(o.shares)||0;
  // Build Bunny URLs
  if (o.bunny_video_id) {
    o.thumbnail = `${BUNNY_CDN}/${o.bunny_video_id}/thumbnail.jpg`;
    o.hls_url = `${BUNNY_CDN}/${o.bunny_video_id}/playlist.m3u8`;
    o.video_link = `/v/${o.bunny_video_id}`;
  } else {
    o.thumbnail = null; o.hls_url = null; o.video_link = o.source_url || '#';
  }
  return o;
}).filter(r => r.creator_name !== 'callmecandace.tv' && r.views >= 500);

console.log(`${data.length} videos loaded\n`);

// ── Helpers ──
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fmtV(n){if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return String(n)}
function cleanCap(c){return(c||'').replace(/#\S+/g,'').replace(/@\S+/g,'').trim()}
function extractQuote(cap,trans){
  // Pull quote from TRANSCRIPT (so it's different from caption)
  const t=cleanTrans(trans);
  if(t){
    const ts=t.split(/[.!?]+/).filter(x=>x.trim().length>20);
    // Try to find a juicy sentence (contains opinion words)
    const juicy=ts.find(s=>/delicious|amazing|incredible|insane|best|goat|fire|perfect|love|obsessed|unreal|crazy|wow|recommend|must try|game.?chang/i.test(s));
    if(juicy){const q=juicy.trim();return q.length>120?q.substring(0,120)+'...':q}
    if(ts.length>1){const q=ts[1].trim();return q.length>120?q.substring(0,120)+'...':q}
    if(ts.length){const q=ts[0].trim();return q.length>120?q.substring(0,120)+'...':q}
  }
  // Fallback to caption
  const c=cleanCap(cap);const s=c.split(/[.!?]+/).filter(x=>x.trim().length>15);
  if(s.length){const q=s[0].trim();return q.length>120?q.substring(0,120)+'...':q}
  return c.substring(0,100)||'You need to try this spot'
}
function cleanTrans(t){
  if(!t)return'';
  return t.replace(/Start Time\tEnd Time\tSubtitle\n?/g,'').replace(/\d{2}:\d{2}:\d{2}\t\d{2}:\d{2}:\d{2}\t/g,'').replace(/\[\d{2}:\d{2}-\d{2}:\d{2}\]\s*/g,'').replace(/\n+/g,' ').trim()
}
function getHood(addr){
  const a=(addr||'').toLowerCase();
  if(a.includes('chinatown')||(a.includes('spadina')&&a.includes('dundas')))return'Chinatown';
  if(a.includes('kensington'))return'Kensington Market';
  if(a.includes('queen st w')||a.includes('queen west'))return'Queen West';
  if(a.includes('queen st e')||a.includes('queen east')||a.includes('leslieville'))return'Leslieville';
  if(a.includes('danforth')||a.includes('greektown'))return'The Danforth';
  if(a.includes('yorkville')||a.includes('bloor st')||a.includes('bay st'))return'Yorkville & Bloor';
  if(a.includes('king st w')||a.includes('king west')||a.includes('liberty'))return'King West';
  if(a.includes('king st e')||a.includes('distillery'))return'Distillery & King East';
  if(a.includes('college st')||a.includes('little italy'))return'Little Italy';
  if(a.includes('ossington')||a.includes('dundas st w'))return'Ossington & Dundas W';
  if(a.includes('yonge st')||a.includes('yonge-dundas')||a.includes('dundas sq'))return'Downtown Yonge';
  if(a.includes('scarborough')||a.includes('agincourt'))return'Scarborough';
  if(a.includes('north york')||a.includes('finch')||a.includes('sheppard'))return'North York';
  if(a.includes('mississauga'))return'Mississauga';
  if(a.includes('etobicoke')||a.includes('islington'))return'Etobicoke';
  if(a.includes('markham'))return'Markham';
  if(a.includes('richmond hill')||a.includes('vaughan'))return'North of the City';
  if(a.includes('st clair'))return'St. Clair';
  if(a.includes('spadina'))return'Spadina';
  if(a.includes('front st')||a.includes('union station')||a.includes('harbourfront'))return'Waterfront';
  if(a.includes('annex')||a.includes('bathurst'))return'The Annex';
  if(a.includes('eglinton'))return'Midtown';
  if(a.includes('brampton'))return'Brampton';
  if(a.includes('church st'))return'Church & Wellesley';
  if(a.includes('junction'))return'The Junction';
  if(a.includes('toronto'))return'Greater Toronto';
  return'Greater Toronto';
}
data.forEach(v=>{v.hood=getHood(v.address)});

// ═══ CATEGORIES ═══
const CATS = {
  'best-pho':{title:'Best Pho',kw:['pho','phở'],pkw:['pho']},
  'best-ramen':{title:'Best Ramen',kw:['ramen','tonkotsu','tsukemen'],pkw:['ramen']},
  'best-sushi':{title:'Best Sushi',kw:['sushi','omakase','sashimi','nigiri'],pkw:['sushi']},
  'best-burger':{title:'Best Burgers',kw:['burger','smash burger','cheeseburger'],pkw:['burger']},
  'best-pizza':{title:'Best Pizza',kw:['pizza','slice','neapolitan','margherita'],pkw:['pizza']},
  'best-halal':{title:'Best Halal',kw:['halal','shawarma','kebab'],pkw:['halal']},
  'best-korean-bbq':{title:'Best Korean BBQ',kw:['korean bbq','kbbq','samgyeopsal','bulgogi','galbi'],pkw:['korean bbq','kbbq']},
  'best-thai':{title:'Best Thai',kw:['thai food','pad thai','green curry','tom yum','boat noodle'],pkw:['thai']},
  'best-brunch':{title:'Best Brunch',kw:['brunch','eggs benedict','french toast','pancakes','mimosa'],pkw:['brunch']},
  'best-steak':{title:'Best Steak',kw:['steak','steakhouse','ribeye','wagyu','dry aged'],pkw:['steak']},
  'best-tacos':{title:'Best Tacos',kw:['taco','tacos','burrito','al pastor','birria','mexican'],pkw:['taco','mexican','burrito']},
  'best-indian':{title:'Best Indian',kw:['butter chicken','biryani','naan','tikka','tandoori','curry','indian food','dosa'],pkw:['indian','tandoori','masala','curry']},
  'best-chinese':{title:'Best Chinese',kw:['dim sum','dumpling','wonton','peking duck','char siu','chinese food','xiao long bao'],pkw:['dim sum','chinese','dumpling','wonton']},
  'best-italian':{title:'Best Italian',kw:['pasta','risotto','gnocchi','carbonara','italian food','tiramisu'],pkw:['italian','trattoria','osteria']},
  'best-seafood':{title:'Best Seafood',kw:['seafood','lobster','crab','oyster','shrimp','scallop','seafood boil'],pkw:['seafood','oyster','lobster','crab']},
  'best-dessert':{title:'Best Desserts',kw:['dessert','cake','ice cream','gelato','pastry','donut','croissant','chocolate','waffle','crepe','cheesecake'],pkw:['bakery','dessert','ice cream','gelato','donut']},
  'best-coffee':{title:'Best Coffee',kw:['coffee','latte','espresso','matcha','cappuccino','cafe'],pkw:['coffee','cafe','café']},
  'best-wings':{title:'Best Wings',kw:['wings','chicken wings','hot wings','buffalo wings'],pkw:['wing']},
  'best-caribbean':{title:'Best Caribbean',kw:['jerk chicken','jamaican','caribbean','oxtail','plantain','roti','doubles'],pkw:['jerk','jamaican','caribbean','roti']},
  'best-middle-eastern':{title:'Best Middle Eastern',kw:['falafel','hummus','manakish','shawarma plate','persian','afghan','lebanese'],pkw:['middle eastern','falafel','lebanese','persian']},
  'best-vegan':{title:'Best Vegan',kw:['vegan','plant-based','plant based','vegetarian restaurant'],pkw:['vegan','plant']},
  'best-ayce':{title:'Best AYCE',kw:['ayce','all you can eat','buffet','unlimited'],pkw:['ayce','all you can eat','buffet']},
  'best-bbq':{title:'Best BBQ',kw:['bbq','barbeque','barbecue','brisket','pulled pork','smoked meat','ribs'],pkw:['bbq','smokehouse']},
  'best-noodles':{title:'Best Noodles',kw:['noodle','hand pulled','dan dan','udon','lo mein','chow mein'],pkw:['noodle']},
  'best-fried-chicken':{title:'Best Fried Chicken',kw:['fried chicken','chicken sandwich','nashville hot','korean fried chicken','karaage'],pkw:['fried chicken']},
  'best-shawarma':{title:'Best Shawarma',kw:['shawarma','donair','doner','gyro'],pkw:['shawarma','donair']},
};

for(const c of Object.values(CATS))c.items=[];
for(const v of data){
  const capL=(v.caption||'').toLowerCase();const plL=(v.restaurant||'').toLowerCase();
  for(const[slug,cat]of Object.entries(CATS)){
    if(cat.kw.some(k=>capL.includes(k))||cat.pkw.some(k=>plL.includes(k))){
      if(!cat.items.some(x=>x.restaurant===v.restaurant&&x.creator_name===v.creator_name))cat.items.push(v);
    }
  }
}
for(const c of Object.values(CATS))c.items.sort((a,b)=>b.views-a.views);

// ═══ GUIDES ═══
const GUIDES=[
  {slug:'most-viral',title:'MOST VIRAL',h1:'Most Viral.',kicker:'THE ALGORITHM SPOKE',marquee:'MOST VIRAL TORONTO FOOD · MILLIONS OF VIEWS',desc:'The Toronto food videos that broke the internet. Raw view count, no editorial filter.',filter:()=>[...data].sort((a,b)=>b.views-a.views).slice(0,12)},
  {slug:'hidden-gems',title:'HIDDEN GEMS',h1:'Hidden Gems.',kicker:'OFF THE BEATEN PATH',marquee:'HIDDEN GEMS · SLEEPER HITS · NOBODY TALKS ABOUT',desc:'Low follower count, massive impact. The spots the algorithm missed but your stomach won\'t.',filter:()=>[...data].filter(v=>v.views<500000&&v.views>10000&&v.likes>1000).sort((a,b)=>(b.likes/Math.max(b.views,1))-(a.likes/Math.max(a.views,1))).slice(0,12)},
  {slug:'under-15',title:'UNDER $15',h1:'Under $15.',kicker:'BUDGET KINGS',marquee:'FULL MEALS UNDER $15 · CHEAP EATS · BROKE BUT HUNGRY',desc:'Full meals for under fifteen bucks. In this economy? Yeah. These creators found them.',filter:()=>data.filter(v=>{const c=(v.caption||'').toLowerCase();return c.includes('cheap')||c.includes('budget')||c.includes('under $')||c.includes('affordable')||c.includes('dollar')}).sort((a,b)=>b.views-a.views).slice(0,12)},
  {slug:'date-night',title:'DATE NIGHT',h1:'Date Night.',kicker:'IMPRESS SOMEONE',marquee:'DATE NIGHT · ROMANCE · MAKE IT COUNT',desc:'Where to take someone when you actually care. Ambiance, plating, the whole performance.',filter:()=>data.filter(v=>{const c=(v.caption+' '+v.restaurant).toLowerCase();return c.includes('date')||c.includes('romantic')||c.includes('fancy')||c.includes('fine dining')||c.includes('omakase')||c.includes('prix fixe')}).sort((a,b)=>b.views-a.views).slice(0,12)},
  {slug:'creators-picks',title:'CREATORS\' PICKS',h1:'Creators\' Picks.',kicker:'WHAT THEY ACTUALLY EAT',marquee:'WHERE CREATORS ACTUALLY EAT · NOT SPONSORED · REAL PICKS',desc:'Not the sponsored posts. These are the spots Toronto\'s biggest food creators go back to on their own dime.',filter:()=>{const m={};data.forEach(v=>{if(!v.caption.toLowerCase().includes('sponsor')&&!v.caption.toLowerCase().includes('#ad')){if(!m[v.creator_name]||v.views>m[v.creator_name].views)m[v.creator_name]=v}});return Object.values(m).sort((a,b)=>b.views-a.views).slice(0,12)}},
  {slug:'spice-scale',title:'SPICE SCALE',h1:'Spice Scale.',kicker:'BRING MILK',marquee:'HOTTEST FOOD IN TORONTO · SPICY · FIRE · SWEAT',desc:'The spots that made creators sweat on camera. Ranked by how much they suffered.',filter:()=>data.filter(v=>{const c=(v.caption+' '+(v.transcript||'')).toLowerCase();return c.includes('spicy')||c.includes('hot sauce')||c.includes('chili')||c.includes('buldak')||c.includes('ghost pepper')||c.includes('samyang')}).sort((a,b)=>b.views-a.views).slice(0,12)},
  {slug:'mukbang-approved',title:'MUKBANG APPROVED',h1:'Mukbang Approved.',kicker:'BIG PORTIONS ONLY',marquee:'MUKBANG · BIG PORTIONS · EATING SHOWS',desc:'Portions so big they became content. If a mukbang creator went there, it\'s certified massive.',filter:()=>data.filter(v=>{const c=(v.caption+' '+(v.transcript||'')).toLowerCase();return c.includes('mukbang')||c.includes('eating show')||c.includes('food challenge')||c.includes('massive')}).sort((a,b)=>b.views-a.views).slice(0,12)},
  {slug:'first-bite-reaction',title:'FIRST BITE REACTIONS',h1:'First Bite.',kicker:'THE FACE SAYS IT ALL',marquee:'FIRST BITE · REACTIONS · HONEST REVIEWS',desc:'The first bite where the creator\'s face tells you everything. These spots made them lose it on camera.',filter:()=>data.filter(v=>{const c=(v.caption+' '+(v.transcript||'')).toLowerCase();return c.includes('first time')||c.includes('trying')||c.includes('never had')||c.includes('honest review')||c.includes('taste test')}).sort((a,b)=>b.views-a.views).slice(0,12)},
  {slug:'comfort-food',title:'COMFORT FOOD',h1:'Comfort Food.',kicker:'SOUL WARMING',marquee:'COMFORT FOOD · SOUP · NOODLES · WARMTH',desc:'When you need food that feels like a hug. Soup, noodles, rice bowls — anything that makes winter in the 6ix bearable.',filter:()=>data.filter(v=>{const c=(v.caption+' '+(v.transcript||'')).toLowerCase();return c.includes('comfort')||c.includes('cozy')||c.includes('warm')||c.includes('soul')||c.includes('soup')||c.includes('stew')}).sort((a,b)=>b.views-a.views).slice(0,12)},
  {slug:'worth-the-hype',title:'WORTH THE HYPE',h1:'Worth the Hype?',kicker:'HYPE CHECK',marquee:'VIRAL SPOTS · WORTH IT? · HYPE CHECK',desc:'Every hyped spot gets a reality check. Creators visited the most talked-about restaurants and gave their honest take.',filter:()=>data.filter(v=>{const c=(v.caption+' '+(v.transcript||'')).toLowerCase();return c.includes('hype')||c.includes('viral')||c.includes('worth it')||c.includes('overrated')||c.includes('finally tried')}).sort((a,b)=>b.views-a.views).slice(0,12)},
];

// ═══ AREAS ═══
const hoodCounts={};data.forEach(v=>{hoodCounts[v.hood]=(hoodCounts[v.hood]||0)+1});
const topHoods=Object.entries(hoodCounts).sort((a,b)=>b[1]-a[1]);
console.log('Neighborhoods:');topHoods.forEach(([h,c])=>console.log(`  ${h}: ${c}`));

const AREA_META={
  'Greater Toronto':{desc:'The spots that don\'t fit a neat neighborhood box but absolutely belong in your rotation.',vibe:'ALL OVER THE MAP'},
  'Scarborough':{desc:'Strip mall gold. Parking lot legends. The drive is the price of admission.',vibe:'STRIP MALL ROYALTY'},
  'North York':{desc:'Korean BBQ rows, Persian ice cream, AYCE spots worth the elastic waistband.',vibe:'SUBURBAN HEAT'},
  'Mississauga':{desc:'The 905 doesn\'t play. South Asian feasts, halal everything, portions that feed the whole family.',vibe:'THE 905'},
  'Downtown Yonge':{desc:'Tourist traps and genuine gems side by side. Knowing the difference is what makes you local.',vibe:'MAIN STRIP'},
  'Ossington & Dundas W':{desc:'Natural wine bars next to $3 banh mi. The gentrification buffet, served daily.',vibe:'COOL KID CORRIDOR'},
  'Chinatown':{desc:'Spadina to Dundas. Hand-pulled noodles at 1AM. Dim sum carts at dawn. Best value per bite in the city.',vibe:'NOODLE DISTRICT'},
  'Queen West':{desc:'Art galleries and all-day brunch. Trinity Bellwoods picnics into late-night taco runs.',vibe:'WEST SIDE STORY'},
  'King West':{desc:'Bottle service meets bone marrow. More good restaurants than you\'d expect between the clubs.',vibe:'NIGHTLIFE FUEL'},
  'Yorkville & Bloor':{desc:'Old money, new restaurants. $300 omakase next to a $6 falafel that\'s equally legendary.',vibe:'HIGH & LOW'},
  'Leslieville':{desc:'Queen East\'s quiet evolution. Brunch capital by day, neighbourhood bistros by night.',vibe:'EAST END ENERGY'},
  'Little Italy':{desc:'College Street\'s identity crisis: still Italian, also Korean, secretly Vietnamese, somehow all works.',vibe:'COLLEGE CRAWL'},
  'The Danforth':{desc:'Greek Town that grew up. Souvlaki is still king but the ramen shop next door is giving it a run.',vibe:'GREEK + EVERYTHING'},
  'Spadina':{desc:'The spine of Toronto food. Chinatown bleeds into Kensington. Every block is a different country.',vibe:'WORLD IN A STREET'},
  'Distillery & King East':{desc:'Cobblestones and cocktails. The east side of King has quietly become a food destination.',vibe:'COBBLESTONE EATS'},
  'Waterfront':{desc:'Harbourfront to Union. Tourist pricing but a few gems if you know where to look.',vibe:'LAKE VIEWS'},
  'Etobicoke':{desc:'The quiet west end. Family-run spots that have been here for decades. No hype, just loyalty.',vibe:'WEST END LOYALTY'},
  'St. Clair':{desc:'Corso Italia meets the Caribbean. Patties and paninis on the same block.',vibe:'THE REAL MIX'},
  'Brampton':{desc:'The 905 food corridor. Massive South Asian food scene and growing Caribbean influence.',vibe:'905 CORRIDOR'},
  'Markham':{desc:'Chinese food capital of Canada. If you haven\'t eaten in Markham, you haven\'t eaten Chinese in Toronto.',vibe:'CHINESE FOOD CAPITAL'},
  'Kensington Market':{desc:'Eclectic, chaotic, delicious. International eats in narrow streets. Zero pretension.',vibe:'MARKET VIBES'},
  'Church & Wellesley':{desc:'The Village\'s food scene. Brunch culture, patio season, and late-night bites.',vibe:'VILLAGE EATS'},
  'The Junction':{desc:'West end sleeper. Dundas West past Keele — indie restaurants, craft beer, neighbourhood charm.',vibe:'JUNCTION JUNCTION'},
};

const AREAS=topHoods.filter(([h,c])=>c>=5).slice(0,10).map(([hood,count])=>{
  const m=AREA_META[hood]||{desc:`The food scene in ${hood}. Every spot reviewed on video.`,vibe:hood.toUpperCase()};
  return{slug:hood.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+$/,''),title:hood.toUpperCase(),hood,h1:hood+'.',kicker:m.vibe,marquee:`${hood.toUpperCase()} · ${count} SPOTS · VIDEO VERIFIED`,desc:m.desc,filter:()=>data.filter(v=>v.hood===hood).sort((a,b)=>b.views-a.views).slice(0,12)};
});

// ═══ HTML BUILDER ═══
const verdicts=['MUST TRY','GOAT','SOLID','FIRE','ELITE','SLEPT ON','WORTH IT','INSANE','NO CAP','CERTIFIED'];
const verdictCls=['goat','goat','mid','goat','goat','','goat','goat','','goat'];

const SUPABASE_PROFILE = 'https://lqslpgiibpcvknfehdlr.supabase.co/storage/v1/object/public/photos/profile';

function buildCard(item,i,pageTopic){
  const quote=extractQuote(item.caption,item.transcript);
  const caption=cleanCap(item.caption).substring(0,150);
  const transcript=cleanTrans(item.transcript);
  const thumb=item.thumbnail||`https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop`;
  const link=item.video_link||'#';
  const platform=(item.source_url||'').includes('tiktok')?'◉ TIKTOK':(item.source_url||'').includes('youtube')?'▶ YOUTUBE':'◉ IG REEL';
  const creatorImg=`${SUPABASE_PROFILE}/${encodeURIComponent(item.creator_name)}.jpeg`;
  const v=verdicts[i%verdicts.length];const vc=verdictCls[i%verdictCls.length];
  const hlsUrl=item.hls_url||'';
  const addr=item.address||'';
  // SEO-rich alt text variations
  const altPhrases=[
    `${item.restaurant} ${pageTopic} Toronto - video review by @${item.creator_name}`,
    `${item.restaurant} - top ${pageTopic.toLowerCase()} spot in Toronto reviewed on video`,
    `best ${pageTopic.toLowerCase()} Toronto ${item.restaurant} - creator food review`,
    `${item.restaurant} Toronto food review - ${pageTopic.toLowerCase()} recommended by @${item.creator_name}`,
    `where to eat ${pageTopic.toLowerCase()} in Toronto - ${item.restaurant} video review`,
    `${item.restaurant} - ${pageTopic.toLowerCase()} restaurant Toronto ON Canada`,
    `Toronto ${pageTopic.toLowerCase()} guide - ${item.restaurant} reviewed by food creator`,
    `${pageTopic.toLowerCase()} near me Toronto - ${item.restaurant} honest review`,
    `${item.restaurant} ${pageTopic.toLowerCase()} Toronto - must try spots 2026`,
    `food creator reviews ${item.restaurant} - best ${pageTopic.toLowerCase()} Toronto`,
  ];
  const altText=altPhrases[i%altPhrases.length];
  const creatorAlt=`${item.creator_name} Toronto food creator - ${pageTopic.toLowerCase()} reviews`;
  return`
    <div class="review" onclick="openModal(this)" data-hls="${esc(hlsUrl)}" data-restaurant="${esc(item.restaurant)}" data-address="${esc(addr)}" data-creator="${esc(item.creator_name)}" data-views="${item.views}" data-likes="${item.likes}" data-saves="${item.saves}" data-shares="${item.shares}" data-quote="${esc(quote)}" data-caption="${esc(caption)}" data-transcript="${esc(transcript)}" data-thumb="${esc(thumb)}" data-link="${esc(link)}">
      <div class="pin"></div><div class="tape-decor"></div>
      <div class="top-meta">
        <span class="name">${esc(item.restaurant)}</span>
        <span class="rating"><i></i><i></i><i></i><i></i><i></i></span>
      </div>
      <div class="thumb">
        <img src="${esc(thumb)}" alt="${esc(altText)}" loading="lazy"/>
        <span class="platform-tag">${platform}</span>
        <span class="verdict ${vc}">${v}</span>
        <div class="play"><svg viewBox="0 0 24 24"><path d="M7 4 L7 20 L20 12 Z"/></svg></div>
        <div class="stats">
          <span class="stat"><svg viewBox="0 0 24 24"><path d="M12 4C5 4 2 12 2 12s3 8 10 8 10-8 10-8-3-8-10-8zm0 13a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z"/></svg>${fmtV(item.views)}</span>
          <span class="stat"><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9C.8 8.4 2.6 4 6.5 4 9 4 11 6 12 7.5 13 6 15 4 17.5 4 21.4 4 23.2 8.4 21.5 12 19 16.5 12 21 12 21z"/></svg>${fmtV(item.likes)}</span>
          <span class="stat"><svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>${fmtV(item.saves)}</span>
        </div>
      </div>
      <div class="creator-row">
        <div class="avatar"><img src="${esc(creatorImg)}" alt="${esc(creatorAlt)}" onerror="this.style.display='none';this.parentElement.textContent='${(item.creator_name||'B').charAt(0).toUpperCase()}'"/></div>
        <div class="creator-info">
          <div class="creator-name">@${esc(item.creator_name)}</div>
          <div class="followers">${fmtV(item.views)} views</div>
        </div>
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

function buildPage(config,type){
  // Enforce 1 creator per page everywhere
  const raw=config.filter();
  const seen=new Set();
  const items=raw.filter(v=>{if(seen.has(v.creator_name))return false;seen.add(v.creator_name);return true});
  if(items.length<3){console.log(`  ⚠️ Skip ${config.slug} (${items.length} items)`);return null}
  // Use seoTopic (cuisine keyword) if available, fallback to title
  const pageTopic=config.seoTopic||config.title.replace(/BEST /i,'').replace(/TOP \d+ /i,'');
  const cards=items.map((item,i)=>buildCard(item,i,pageTopic)).join('\n');
  const prefix=type==='guide'?'guide':type==='area'?'area':'';
  const fileSlug=prefix?`${prefix}-${config.slug}`:config.slug;
  const canonical=`https://www.bitemap.fun/toronto/${fileSlug}`;
  return{fileSlug,html:`<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8"/><title>${esc(config.title)} — Toronto Food Zine | BiteMap</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="description" content="${esc(config.desc)}">
<meta name="keywords" content="${esc(pageTopic.toLowerCase())} toronto, best ${esc(pageTopic.toLowerCase())} toronto, ${esc(pageTopic.toLowerCase())} near me, top ${esc(pageTopic.toLowerCase())} toronto 2026, ${esc(pageTopic.toLowerCase())} restaurants toronto, where to eat ${esc(pageTopic.toLowerCase())} toronto, ${esc(pageTopic.toLowerCase())} food toronto">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(config.title)} | BiteMap">
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
:root{--paper:#f1ead8;--paper-2:#ece2c7;--ink:#141210;--red:#d62419;--yellow:#f5c518;--tape:rgba(240,220,120,0.55)}*{box-sizing:border-box}html,body{margin:0;padding:0;background:var(--paper);color:var(--ink);font-family:'Special Elite','Courier New',monospace;overflow-x:hidden}body{background:radial-gradient(1200px 800px at 20% 10%,rgba(214,36,25,0.05),transparent 60%),radial-gradient(900px 600px at 90% 60%,rgba(20,18,16,0.04),transparent 60%),repeating-linear-gradient(0deg,rgba(20,18,16,0.018) 0 2px,transparent 2px 4px),var(--paper)}body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:1;background-image:radial-gradient(rgba(20,18,16,0.08) 1px,transparent 1px),radial-gradient(rgba(20,18,16,0.05) 1px,transparent 1px);background-size:3px 3px,7px 7px;background-position:0 0,1px 2px;mix-blend-mode:multiply;opacity:.5}.wrap{position:relative;z-index:5;max-width:1800px;margin:0 auto;padding:0 1rem}h1,h2,h3,h4{margin:0;font-weight:400}.marquee{background:var(--ink);color:var(--paper);overflow:hidden;border-top:2px solid var(--ink);border-bottom:2px solid var(--ink);position:relative;z-index:7}.marquee-track{display:flex;gap:2rem;padding:.5rem 0;white-space:nowrap;animation:scroll 40s linear infinite;font-family:'Archivo Black';letter-spacing:.05em;font-size:.9rem}.marquee-track span{display:inline-flex;align-items:center;gap:1rem}.marquee-track .dot{width:8px;height:8px;background:var(--red);border-radius:50%;display:inline-block}@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}.nav-top{padding:.6rem 1rem;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--ink);position:relative;z-index:10}.nav-top a{color:inherit;text-decoration:none;font-family:'DM Mono';font-size:.7rem;letter-spacing:.15em}.nav-top a:hover{color:var(--red)}.breadcrumb{font-family:'DM Mono';font-size:.7rem}.breadcrumb b{font-family:'Archivo Black'}.hero{position:relative;padding:.5rem 2rem;border-bottom:2px solid var(--ink);z-index:10;display:flex;align-items:center;gap:1rem}.hero-left{flex:1}.hero-center{text-align:center;flex:0 0 auto}.hero .kicker{display:inline-block;background:var(--ink);color:var(--paper);padding:.15rem .5rem;font-family:'Archivo Black';letter-spacing:.2em;font-size:.55rem;transform:rotate(-1deg)}.hero h1{font-family:'Shrikhand',cursive;font-size:clamp(1.8rem,4vw,3rem);line-height:.95;color:var(--red);text-shadow:2px 2px 0 var(--ink);letter-spacing:-.02em;white-space:nowrap}.hero-right{flex:1;text-align:right}.hero .deck{font-family:'Caveat',cursive;font-weight:700;font-size:.95rem;line-height:1.25;max-width:16rem;margin-left:auto;color:var(--ink);opacity:.7}@media(max-width:700px){.hero{flex-direction:column;text-align:center;padding:.4rem 1rem}.hero-right{text-align:center}.hero .deck{margin:0 auto;max-width:none}}
.reviews-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem 1.2rem;margin:.5rem 0 1.5rem;position:relative;z-index:10;padding:1.5rem 3rem}
@media(max-width:768px){.reviews-grid{grid-template-columns:repeat(2,1fr);gap:1rem;padding:1rem 1rem}.review{padding:.4rem .4rem .5rem;box-shadow:3px 4px 0 rgba(0,0,0,.12)}.review:nth-child(n){transform:rotate(0deg) !important}.review .top-meta .name{font-size:.75rem}.review .play{width:40px;height:40px}.review .play svg{width:18px;height:18px;margin-left:2px}.review .stats{font-size:.65rem;gap:.5rem}.review .stats svg{width:12px;height:12px}.review .creator-row{gap:.4rem;padding:.4rem .15rem .2rem}.review .avatar{width:26px;height:26px;font-size:.55rem}.review .creator-name{font-size:.7rem}.review .followers{font-size:.55rem}.review .quote{font-size:.78rem;padding:.25rem .35rem}.review .quote .quote-mark{font-size:.9rem}.review .caption{font-size:.55rem;padding:.2rem .3rem}.review .caption .cap-label{font-size:.42rem}.review .transcript-toggle{font-size:.55rem;padding:.2rem .3rem}.review .transcript-text{font-size:.55rem;padding:.2rem .3rem}.review .pin{width:16px;height:16px;top:-6px;left:-6px}.review .tape-decor{width:40px;height:12px;top:-8px}.review .corner-note{font-size:.6rem;padding:.1rem .3rem;right:-4px;bottom:-10px}.review .platform-tag{font-size:.5rem;padding:.12rem .3rem;top:.3rem;left:.3rem}.review .verdict{font-size:.48rem;padding:.15rem .35rem;top:1.8rem;right:-.2rem}.nav-top{padding:.4rem .75rem;gap:.3rem}.nav-top a{font-size:.6rem;letter-spacing:.1em}.breadcrumb{font-size:.6rem}.hero{padding:.3rem .75rem}.hero h1{font-size:clamp(1.4rem,5vw,2rem)}.hero .kicker{font-size:.48rem;padding:.1rem .4rem}.hero .deck{font-size:.75rem}.marquee-track{font-size:.75rem;padding:.4rem 0}.foot-nav{grid-template-columns:1fr;gap:.5rem;padding:0 .75rem}.foot-nav a{padding:.6rem;font-size:.65rem}}
@media(max-width:380px){.reviews-grid{grid-template-columns:1fr;gap:.8rem;padding:.75rem .75rem}.review .thumb{aspect-ratio:9/12}}
.review{position:relative;display:block;background:var(--paper);border:2px solid var(--ink);box-shadow:5px 6px 0 rgba(0,0,0,.15);cursor:pointer;text-decoration:none;color:inherit;transition:transform .3s cubic-bezier(.2,.9,.3,1.2),box-shadow .25s;padding:.5rem .5rem .6rem}
.review:nth-child(7n+1){transform:rotate(-2deg)}.review:nth-child(7n+2){transform:rotate(1.5deg) translateY(6px)}.review:nth-child(7n+3){transform:rotate(-1deg) translateY(-4px)}.review:nth-child(7n+4){transform:rotate(2.5deg)}.review:nth-child(7n+5){transform:rotate(-1.5deg) translateY(5px)}.review:nth-child(7n+6){transform:rotate(.8deg) translateY(-3px)}.review:nth-child(7n+7){transform:rotate(-2.5deg)}
.review:hover{transform:rotate(0deg) translateY(-6px) scale(1.03);box-shadow:8px 12px 0 rgba(214,36,25,.35);z-index:30}
.review .top-meta{padding:.2rem .2rem .35rem;border-bottom:1.5px dashed var(--ink);margin-bottom:.4rem;display:flex;justify-content:space-between;align-items:center;gap:.3rem}
.review .top-meta .name{font-family:'Shrikhand';font-size:.85rem;line-height:1;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.review .top-meta .rating{display:flex;gap:1px;flex-shrink:0}.review .top-meta .rating i{width:9px;height:9px;background:var(--red);display:block;clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}.review .top-meta .rating i.off{background:rgba(0,0,0,.2)}
.review .thumb{position:relative;aspect-ratio:9/16;overflow:hidden;background:#333;box-shadow:inset 0 0 0 2px var(--paper),inset 0 0 0 3px var(--ink)}
.review .thumb img{width:100%;height:100%;object-fit:cover;display:block;filter:contrast(1.05) saturate(1.05)}
.review .thumb::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.3) 0%,transparent 20%,transparent 60%,rgba(0,0,0,.8) 100%)}
.review .play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.4);transition:transform .2s;z-index:3}
.review:hover .play{transform:translate(-50%,-50%) scale(1.12)}.review .play svg{width:22px;height:22px;margin-left:3px;fill:var(--ink)}
.review .platform-tag{position:absolute;top:.4rem;left:.4rem;z-index:3;font-family:'Archivo Black';font-size:.55rem;letter-spacing:.08em;background:var(--paper);color:var(--ink);padding:.15rem .35rem;border:1px solid var(--ink);text-transform:uppercase;box-shadow:1px 1px 0 rgba(0,0,0,.3)}
.review .verdict{position:absolute;top:2rem;right:-.3rem;z-index:4;display:inline-block;padding:.2rem .45rem;font-family:'Archivo Black';font-size:.55rem;letter-spacing:.08em;background:var(--red);color:var(--paper);box-shadow:2px 2px 0 var(--ink);transform:rotate(6deg)}.review .verdict.mid{background:var(--paper);color:var(--ink);border:1px solid var(--ink)}.review .verdict.goat{background:var(--yellow);color:var(--ink);border:1px solid var(--ink)}
.review .stats{position:absolute;left:.4rem;right:.4rem;bottom:.4rem;z-index:3;display:flex;gap:.6rem;color:#fff;font-family:'DM Mono';font-size:.7rem;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,.8)}.review .stats .stat{display:flex;align-items:center;gap:.2rem}.review .stats svg{width:13px;height:13px;fill:#fff;filter:drop-shadow(0 1px 1px rgba(0,0,0,.5))}
.review .creator-row{display:flex;align-items:center;gap:.5rem;padding:.4rem .15rem .2rem}
.review .avatar{width:32px;height:32px;border-radius:50%;background:#888;border:1.5px solid var(--ink);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Archivo Black';font-size:.65rem;box-shadow:1px 1px 0 rgba(0,0,0,.2)}.review .avatar img{width:100%;height:100%;object-fit:cover;display:block}
.review .creator-info{min-width:0;flex:1}.review .creator-name{font-family:'Archivo Black';font-size:.72rem;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.review .followers{font-family:'DM Mono';font-size:.6rem;opacity:.6;margin-top:.1rem}
.review .quote{display:block;margin-top:.3rem;padding:.25rem .4rem;background:var(--yellow);border-left:2px solid var(--red);font-family:'Caveat',cursive;font-size:.82rem;font-weight:700;line-height:1.2;color:var(--ink);transform:rotate(-0.3deg)}.review .quote .quote-mark{font-family:'Shrikhand';font-size:1rem;color:var(--red);vertical-align:-.1em;margin-right:.05rem}
.review .caption{margin-top:.2rem;padding:.2rem .35rem;font-family:'Special Elite',monospace;font-size:.58rem;line-height:1.35;color:var(--ink);opacity:.75;border:1px dashed rgba(0,0,0,.1);background:rgba(255,255,255,.15)}.review .caption .cap-label{display:inline-block;font-family:'Archivo Black';font-size:.45rem;letter-spacing:.1em;text-transform:uppercase;color:var(--red);margin-bottom:.15rem}
.review .transcript{margin-top:.25rem;border:1px dashed var(--ink);background:rgba(255,255,255,.25);overflow:hidden}.review .transcript-toggle{display:flex;justify-content:space-between;align-items:center;padding:.25rem .4rem;cursor:pointer;font-family:'DM Mono',monospace;font-size:.6rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink);opacity:.6;border:none;background:none;width:100%;text-align:left}.review .transcript-toggle:hover{opacity:1;color:var(--red)}.review .transcript-body{max-height:0;overflow:hidden;transition:max-height .4s ease}.review .transcript-body.open{max-height:500px}.review .transcript-text{padding:.3rem .4rem;font-family:'Special Elite',monospace;font-size:.62rem;line-height:1.45;color:var(--ink);opacity:.7}
.review .pin{position:absolute;width:20px;height:20px;top:-8px;left:-8px;z-index:5;background:radial-gradient(circle at 30% 30%,#ff5a4a,var(--red) 60%,#8a0a00);border-radius:50%;border:1.5px solid #2a0a06;box-shadow:1px 2px 3px rgba(0,0,0,.25)}.review .pin::after{content:'';position:absolute;top:5px;left:5px;width:5px;height:4px;background:rgba(255,255,255,.5);border-radius:50%}
.review .tape-decor{position:absolute;top:-10px;right:15%;width:55px;height:16px;background:var(--tape);transform:rotate(-5deg);z-index:4;pointer-events:none;border-left:1px dashed rgba(0,0,0,.08);border-right:1px dashed rgba(0,0,0,.08)}.review:nth-child(3n) .tape-decor{background:rgba(220,90,80,0.45);right:auto;left:12%;transform:rotate(4deg)}.review:nth-child(4n) .tape-decor{background:rgba(120,190,220,0.5);left:40%;right:auto;transform:rotate(-2deg)}
.review .corner-note{position:absolute;right:-6px;bottom:-12px;z-index:5;font-family:'Permanent Marker';color:var(--ink);font-size:.7rem;transform:rotate(-4deg);background:var(--yellow);padding:.15rem .4rem;border:1px solid var(--ink);box-shadow:1px 1px 0 var(--ink)}
.foot-nav{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.8rem;margin:1rem 0 2rem;position:relative;z-index:10;padding:0 1rem}.foot-nav a{display:block;padding:.8rem;border:2px solid var(--ink);text-decoration:none;color:inherit;text-align:center;font-family:'Archivo Black';letter-spacing:.08em;font-size:.75rem;transition:all .2s;background:var(--paper)}.foot-nav a:hover{background:var(--red);color:var(--paper);transform:rotate(-1deg)}.foot-nav a .sub{display:block;font-family:'DM Mono';font-weight:400;font-size:.6rem;opacity:.7;margin-top:.2rem;letter-spacing:.12em}@media(max-width:780px){.foot-nav{grid-template-columns:1fr}}

/* ═══ VIDEO MODAL ═══ */
.vmodal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:1.5rem}
.vmodal.open{display:flex}
.vmodal-bg{position:absolute;inset:0;background:rgba(10,10,8,.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.vmodal-inner{position:relative;display:flex;gap:1.5rem;max-width:900px;width:100%;max-height:90vh;z-index:2}
.vmodal-video{flex:0 0 340px;aspect-ratio:9/16;background:#000;border:3px solid var(--ink);box-shadow:8px 10px 0 rgba(214,36,25,.4);overflow:hidden;position:relative;border-radius:4px}
.vmodal-video video{width:100%;height:100%;object-fit:cover}
.vmodal-video .vm-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.5);z-index:3;transition:transform .2s}
.vmodal-video .vm-play:hover{transform:translate(-50%,-50%) scale(1.1)}
.vmodal-video .vm-play svg{width:28px;height:28px;margin-left:3px;fill:var(--ink)}
.vmodal-video.playing .vm-play{display:none}
.vmodal-side{flex:1;overflow-y:auto;background:var(--paper);border:2px solid var(--ink);box-shadow:5px 6px 0 rgba(0,0,0,.15);padding:1.2rem;max-height:90vh;border-radius:4px}
.vmodal-side .vm-restaurant{font-family:'Shrikhand';font-size:1.6rem;color:var(--ink);line-height:1;margin-bottom:.3rem}
.vmodal-side .vm-address{font-family:'DM Mono';font-size:.7rem;opacity:.5;margin-bottom:.8rem}
.vmodal-side .vm-creator{display:flex;align-items:center;gap:.6rem;padding:.6rem 0;border-top:1.5px dashed var(--ink);border-bottom:1.5px dashed var(--ink);margin-bottom:.8rem}
.vmodal-side .vm-avatar{width:40px;height:40px;border-radius:50%;border:2px solid var(--ink);overflow:hidden;background:#888;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Archivo Black';font-size:.75rem}
.vmodal-side .vm-avatar img{width:100%;height:100%;object-fit:cover}
.vmodal-side .vm-cname{font-family:'Archivo Black';font-size:.85rem}
.vmodal-side .vm-cviews{font-family:'DM Mono';font-size:.65rem;opacity:.6}
.vmodal-side .vm-stats{display:flex;gap:1.2rem;margin-bottom:.8rem;font-family:'DM Mono';font-size:.75rem}
.vmodal-side .vm-stats span{display:flex;align-items:center;gap:.3rem}
.vmodal-side .vm-stats b{color:var(--red)}
.vmodal-side .vm-quote{padding:.5rem .7rem;background:var(--yellow);border-left:3px solid var(--red);font-family:'Caveat',cursive;font-size:1.05rem;font-weight:700;line-height:1.25;margin-bottom:.6rem;transform:rotate(-.3deg)}
.vmodal-side .vm-caption{font-family:'Special Elite';font-size:.75rem;line-height:1.5;opacity:.8;margin-bottom:.6rem;border:1px dashed rgba(0,0,0,.1);padding:.5rem;background:rgba(255,255,255,.2)}
.vmodal-side .vm-transcript{font-family:'Special Elite';font-size:.7rem;line-height:1.5;opacity:.65;border:1px dashed var(--ink);padding:.5rem;max-height:200px;overflow-y:auto;background:rgba(255,255,255,.15)}
.vmodal-side .vm-label{font-family:'Archivo Black';font-size:.5rem;letter-spacing:.15em;text-transform:uppercase;color:var(--red);margin-bottom:.3rem;display:block}
.vmodal-close{position:absolute;top:-12px;right:-12px;width:36px;height:36px;border-radius:50%;background:var(--paper);border:2px solid var(--ink);cursor:pointer;font-family:'Archivo Black';font-size:1.1rem;display:flex;align-items:center;justify-content:center;z-index:5;box-shadow:2px 2px 0 var(--ink);transition:all .2s}
.vmodal-close:hover{background:var(--red);color:var(--paper);border-color:var(--red)}
.vmodal-dl{display:inline-flex;align-items:center;gap:.5rem;margin-top:.8rem;padding:.5rem 1rem;background:var(--ink);color:var(--paper);font-family:'Archivo Black';font-size:.7rem;letter-spacing:.1em;text-decoration:none;border:2px solid var(--ink);transition:all .2s}
.vmodal-dl:hover{background:var(--red);border-color:var(--red)}
@media(max-width:700px){.vmodal{padding:.5rem}.vmodal-inner{flex-direction:column;max-height:95vh;overflow-y:auto}.vmodal-video{flex:none;width:100%;max-width:280px;margin:0 auto}.vmodal-side{max-height:none;padding:.8rem}.vmodal-side .vm-restaurant{font-size:1.2rem}.vmodal-side .vm-quote{font-size:.9rem}.vmodal-close{top:-8px;right:-8px;width:30px;height:30px;font-size:.9rem}}
</style>
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
</head>
<body>
<div class="marquee"><div class="marquee-track">
<span><i class="dot"></i> ${esc(config.marquee)}</span><span><i class="dot"></i> THE TORONTO FOOD ZINE</span><span><i class="dot"></i> EAT LOCAL. EAT LOUD.</span><span><i class="dot"></i> STARTED FROM THE BOTTOM NOW WE EAT</span><span><i class="dot"></i> ${esc(config.marquee)}</span><span><i class="dot"></i> VIDEO VERIFIED · 2026</span>
<span><i class="dot"></i> ${esc(config.marquee)}</span><span><i class="dot"></i> THE TORONTO FOOD ZINE</span><span><i class="dot"></i> EAT LOCAL. EAT LOUD.</span><span><i class="dot"></i> STARTED FROM THE BOTTOM NOW WE EAT</span><span><i class="dot"></i> ${esc(config.marquee)}</span><span><i class="dot"></i> VIDEO VERIFIED · 2026</span>
</div></div>
<div class="wrap">
<div class="nav-top"><a href="/toronto">← BACK TO ZINE</a><div class="breadcrumb mono">TORONTO FOOD ZINE / <b>${esc(config.title)}</b></div><a href="#">SHARE →</a></div>
<section class="hero"><div class="hero-left"></div><div class="hero-center"><span class="kicker">${esc(config.kicker)}</span><h1>${config.h1}</h1></div><div class="hero-right"><div class="deck">${esc(config.desc)}</div></div></section>
<div class="reviews-grid">${cards}</div>
<div class="foot-nav"><a href="/toronto">← BACK TO ZINE <span class="sub">ALL LISTS</span></a><a href="/toronto/best-ramen">BEST RAMEN <span class="sub">TOP 10</span></a><a href="https://apps.apple.com/ca/app/bitemap/id6746139076">GET THE APP <span class="sub">iOS + ANDROID</span></a></div>
</div>

<!-- VIDEO MODAL -->
<div class="vmodal" id="vmodal">
  <div class="vmodal-bg" onclick="closeModal()"></div>
  <div class="vmodal-inner">
    <div class="vmodal-video" id="vm-video">
      <video id="vm-player" playsinline loop></video>
      <div class="vm-play" id="vm-play" onclick="togglePlay(event)"><svg viewBox="0 0 24 24"><path d="M7 4 L7 20 L20 12 Z"/></svg></div>
    </div>
    <div class="vmodal-side">
      <div class="vm-restaurant" id="vm-restaurant"></div>
      <div class="vm-address" id="vm-address"></div>
      <div class="vm-creator">
        <div class="vm-avatar" id="vm-avatar"></div>
        <div><div class="vm-cname" id="vm-cname"></div><div class="vm-cviews" id="vm-cviews"></div></div>
      </div>
      <div class="vm-stats">
        <span><b id="vm-views"></b> views</span>
        <span><b id="vm-likes"></b> likes</span>
        <span><b id="vm-saves"></b> saves</span>
      </div>
      <div class="vm-quote" id="vm-quote"></div>
      <div><span class="vm-label">Caption</span><div class="vm-caption" id="vm-caption"></div></div>
      <div id="vm-transcript-wrap" style="margin-top:.5rem"><span class="vm-label">Transcript</span><div class="vm-transcript" id="vm-transcript"></div></div>
      <a class="vmodal-dl" href="https://apps.apple.com/ca/app/bitemap/id6746139076" target="_blank">WATCH IN APP →</a>
    </div>
    <button class="vmodal-close" onclick="closeModal()">×</button>
  </div>
</div>

<script>
const PROFILE_URL='https://lqslpgiibpcvknfehdlr.supabase.co/storage/v1/object/public/photos/profile';
let currentHls=null;
function fmtV(n){n=parseInt(n)||0;if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return n}
function openModal(el){
  const d=el.dataset;
  document.getElementById('vm-restaurant').textContent=d.restaurant;
  document.getElementById('vm-address').textContent=d.address;
  document.getElementById('vm-cname').textContent='@'+d.creator;
  document.getElementById('vm-cviews').textContent=fmtV(d.views)+' views';
  document.getElementById('vm-views').textContent=fmtV(d.views);
  document.getElementById('vm-likes').textContent=fmtV(d.likes);
  document.getElementById('vm-saves').textContent=fmtV(d.saves);
  document.getElementById('vm-quote').innerHTML='<span style="font-family:Shrikhand;font-size:1.2rem;color:var(--red);margin-right:.1rem">\\u201C</span>'+d.quote;
  document.getElementById('vm-caption').textContent=d.caption;
  const tw=document.getElementById('vm-transcript-wrap');
  const tt=document.getElementById('vm-transcript');
  if(d.transcript){tw.style.display='block';tt.textContent=d.transcript}else{tw.style.display='none'}
  const av=document.getElementById('vm-avatar');
  av.innerHTML='<img src="'+PROFILE_URL+'/'+encodeURIComponent(d.creator)+'.jpeg" onerror="this.style.display=\\'none\\';this.parentElement.textContent=\\''+d.creator.charAt(0).toUpperCase()+'\\'"/>';
  // Video
  const video=document.getElementById('vm-player');
  const vwrap=document.getElementById('vm-video');
  vwrap.classList.remove('playing');
  video.pause();
  if(currentHls){currentHls.destroy();currentHls=null}
  video.poster=d.thumb;
  if(d.hls){
    if(Hls.isSupported()){
      currentHls=new Hls();currentHls.loadSource(d.hls);currentHls.attachMedia(video);
    }else if(video.canPlayType('application/vnd.apple.mpegurl')){
      video.src=d.hls;
    }
  }
  document.getElementById('vmodal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(){
  document.getElementById('vmodal').classList.remove('open');
  document.body.style.overflow='';
  const video=document.getElementById('vm-player');
  video.pause();
  if(currentHls){currentHls.destroy();currentHls=null}
}
function togglePlay(e){
  e.stopPropagation();
  const video=document.getElementById('vm-player');
  const vwrap=document.getElementById('vm-video');
  if(video.paused){video.play();vwrap.classList.add('playing')}
  else{video.pause();vwrap.classList.remove('playing')}
}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});
</script>
</div>
</body></html>`};
}

// ═══ Creative varied titles per category ═══
const CREATIVE_TITLES = {
  'best-pho':           {title:'TOP 10 PHO',         h1:'Top 10 Pho.',          kicker:'BROTH GOSPEL',       marquee:'TOP 10 PHO SPOTS IN TORONTO · STEAMING HOT'},
  'best-ramen':         {title:'RAMEN REPORT',       h1:'Ramen Report.',        kicker:'NOODLE OBSESSIVES',  marquee:'TORONTO RAMEN REPORT · EVERY BOWL ON VIDEO'},
  'best-sushi':         {title:'SUSHI FILES',        h1:'The Sushi Files.',     kicker:'RAW & RANKED',       marquee:'TORONTO SUSHI FILES · OMAKASE TO AYCE'},
  'best-burger':        {title:'SMASH OR PASS',      h1:'Smash or Pass.',       kicker:'BURGER EDITION',     marquee:'TORONTO BURGER WARS · SMASH OR PASS'},
  'best-pizza':         {title:'SLICE BY SLICE',     h1:'Slice by Slice.',      kicker:'PIZZA PATROL',       marquee:'TORONTO PIZZA · SLICE BY SLICE · EVERY STYLE'},
  'best-halal':         {title:'HALAL MAP',          h1:'The Halal Map.',       kicker:'VERIFIED HALAL',     marquee:'TORONTO HALAL FOOD MAP · EVERY CUISINE VERIFIED'},
  'best-korean-bbq':    {title:'GRILL SESSION',      h1:'Grill Session.',       kicker:'KOREAN BBQ',         marquee:'TORONTO KOREAN BBQ · GRILL YOUR OWN'},
  'best-thai':          {title:'THAI HEAT',          h1:'Thai Heat.',           kicker:'PAD THAI TO BOAT',   marquee:'TORONTO THAI FOOD · FROM PAD THAI TO BOAT NOODLES'},
  'best-brunch':        {title:'WORTH THE WAIT',     h1:'Worth the Wait.',      kicker:'BRUNCH EDITION',     marquee:'TORONTO BRUNCH · WORTH THE WAIT'},
  'best-steak':         {title:'CREATORS RECOMMEND', h1:'Creators Recommend.',  kicker:'STEAK NIGHT',        marquee:'STEAKHOUSES CREATORS ACTUALLY RECOMMEND'},
  'best-tacos':         {title:'TACO CRAWL',         h1:'Taco Crawl.',          kicker:'AL PASTOR TO BIRRIA',marquee:'TORONTO TACO CRAWL · AL PASTOR TO BIRRIA'},
  'best-indian':        {title:'SPICE ROUTE',        h1:'The Spice Route.',     kicker:'INDIAN FOOD',        marquee:'TORONTO INDIAN FOOD · THE SPICE ROUTE'},
  'best-chinese':       {title:'DIM SUM & THEN SOME',h1:'Dim Sum & Then Some.', kicker:'CHINESE FOOD',       marquee:'TORONTO CHINESE FOOD · DIM SUM & THEN SOME'},
  'best-italian':       {title:'PASTA LA VISTA',     h1:'Pasta la Vista.',      kicker:'ITALIAN EDITION',    marquee:'TORONTO ITALIAN · PASTA LA VISTA'},
  'best-seafood':       {title:'CATCH OF THE DAY',   h1:'Catch of the Day.',    kicker:'SEAFOOD',            marquee:'TORONTO SEAFOOD · CATCH OF THE DAY'},
  'best-dessert':       {title:'SWEET TOOTH',        h1:'Sweet Tooth.',         kicker:'DESSERT GUIDE',      marquee:'TORONTO DESSERTS · SWEET TOOTH GUIDE'},
  'best-coffee':        {title:'DAILY GRIND',        h1:'The Daily Grind.',     kicker:'COFFEE CULTURE',     marquee:'TORONTO COFFEE · THE DAILY GRIND'},
  'best-wings':         {title:'WING NIGHT',         h1:'Wing Night.',          kicker:'SAUCED & TOSSED',    marquee:'TORONTO WINGS · SAUCED & TOSSED'},
  'best-caribbean':     {title:'ISLAND VIBES',       h1:'Island Vibes.',        kicker:'CARIBBEAN',          marquee:'TORONTO CARIBBEAN FOOD · ISLAND VIBES'},
  'best-middle-eastern':{title:'MEZZE PLATTER',      h1:'Mezze Platter.',       kicker:'MIDDLE EASTERN',     marquee:'TORONTO MIDDLE EASTERN · MEZZE PLATTER'},
  'best-vegan':         {title:'PLANT MODE',         h1:'Plant Mode.',          kicker:'VEGAN & PLANT',      marquee:'TORONTO VEGAN · PLANT MODE'},
  'best-ayce':          {title:'ALL YOU CAN',        h1:'All You Can.',         kicker:'UNLIMITED',          marquee:'TORONTO AYCE · ALL YOU CAN EAT'},
  'best-bbq':           {title:'LOW & SLOW',         h1:'Low & Slow.',          kicker:'BBQ SMOKE',          marquee:'TORONTO BBQ · LOW & SLOW'},
  'best-noodles':       {title:'NOODLE BIBLE',       h1:'The Noodle Bible.',    kicker:'EVERY STRAND',       marquee:'TORONTO NOODLES · THE NOODLE BIBLE'},
  'best-fried-chicken': {title:'CRISPY CHRONICLES',  h1:'Crispy Chronicles.',   kicker:'FRIED CHICKEN',      marquee:'TORONTO FRIED CHICKEN · CRISPY CHRONICLES'},
  'best-shawarma':      {title:'WRAP GAME',          h1:'Wrap Game.',           kicker:'SHAWARMA',           marquee:'TORONTO SHAWARMA · WRAP GAME STRONG'},
};

// ONE creator per article — pick their highest-viewed video
function dedupItems(items) {
  const seen = new Set();
  return items.filter(v => {
    if (seen.has(v.creator_name)) return false;
    seen.add(v.creator_name);
    return true;
  });
}

// ═══ GENERATE ALL ═══
console.log('\n=== ARTICLES ===');
let artCount=0;
for(const[slug,cat]of Object.entries(CATS)){
  const deduped = dedupItems(cat.items);
  if(deduped.length<3)continue;
  const items=deduped.slice(0,10);
  const ct = CREATIVE_TITLES[slug] || {title:cat.title.toUpperCase(),h1:cat.title.replace('Best ','')+'.', kicker:'TOP '+items.length, marquee:cat.title.toUpperCase()+' IN THE 6IX'};
  const cuisine=cat.title.toLowerCase().replace('best ','');
  const seoDescs = {
    'best-pho': `Best pho in Toronto 2026. Top pho restaurants near you ranked by food creators with video reviews. Find the best Vietnamese pho spots, noodle soup, and pho bo in Toronto.`,
    'best-sushi': `Best sushi restaurants in Toronto 2026. Top sushi spots, omakase, and sashimi ranked by food creators. Find the best sushi near you in Toronto with video proof.`,
    'best-burger': `Best burgers in Toronto 2026. Top burger spots, smash burgers, and cheeseburgers ranked by food creators with video reviews. Find the best burger near you.`,
    'best-pizza': `Best pizza in Toronto 2026. Top pizza spots — Neapolitan, New York, Detroit style — ranked by food creators. Find the best pizza near you in Toronto.`,
    'best-halal': `Best halal restaurants in Toronto 2026. Top halal food spots, shawarma, and halal-certified restaurants ranked by food creators with video reviews.`,
    'best-steak': `Best steakhouses in Toronto 2026. Top steak restaurants, dry-aged beef, and wagyu ranked by food creators. Find the best steak near you in Toronto.`,
    'best-tacos': `Best tacos in Toronto 2026. Top taco spots, birria, al pastor, and Mexican food ranked by food creators. Find the best tacos near you in Toronto.`,
    'best-indian': `Best Indian food in Toronto 2026. Top Indian restaurants, butter chicken, biryani, and tandoori ranked by food creators. Find the best Indian food near you.`,
    'best-chinese': `Best Chinese food in Toronto 2026. Top Chinese restaurants, dim sum, dumplings, and hand-pulled noodles ranked by food creators with video reviews.`,
    'best-italian': `Best Italian food in Toronto 2026. Top Italian restaurants, pasta, risotto, and Neapolitan pizza ranked by food creators. Find the best Italian near you.`,
    'best-seafood': `Best seafood in Toronto 2026. Top seafood restaurants, lobster, crab, oysters, and fish ranked by food creators. Find the best seafood near you in Toronto.`,
    'best-dessert': `Best desserts in Toronto 2026. Top dessert spots, ice cream, cake, pastries, and bakeries ranked by food creators. Find the best desserts near you.`,
    'best-coffee': `Best coffee shops in Toronto 2026. Top cafes, espresso bars, latte art, and matcha spots ranked by food creators. Find the best coffee near you in Toronto.`,
    'best-wings': `Best chicken wings in Toronto 2026. Top wing spots, hot wings, buffalo wings, and wing nights ranked by food creators. Find the best wings near you.`,
    'best-caribbean': `Best Caribbean food in Toronto 2026. Top jerk chicken, oxtail, roti, and Jamaican food ranked by food creators. Find the best Caribbean food near you.`,
    'best-ayce': `Best all you can eat in Toronto 2026. Top AYCE buffets, unlimited sushi, and Korean BBQ ranked by food creators. Find the best AYCE near you in Toronto.`,
    'best-bbq': `Best BBQ in Toronto 2026. Top barbecue spots, brisket, pulled pork, and smoked ribs ranked by food creators. Find the best BBQ near you in Toronto.`,
    'best-noodles': `Best noodle spots in Toronto 2026. Top noodle restaurants, hand-pulled noodles, udon, and dan dan ranked by food creators. Find the best noodles near you.`,
    'best-fried-chicken': `Best fried chicken in Toronto 2026. Top fried chicken spots, Nashville hot, Korean fried chicken ranked by food creators. Find the best fried chicken near you.`,
    'best-shawarma': `Best shawarma in Toronto 2026. Top shawarma spots, chicken shawarma, and donairs ranked by food creators. Find the best shawarma near you in Toronto.`,
    'best-brunch': `Best brunch in Toronto 2026. Top brunch spots, eggs benedict, pancakes, and mimosas ranked by food creators. Find the best brunch near you in Toronto.`,
  };
  const desc = seoDescs[slug] || `Best ${cuisine} in Toronto 2026. Top ${cuisine} restaurants ranked by food creators with video reviews. Find the best ${cuisine} near you in Toronto.`;
  const config={slug,title:ct.title,h1:ct.h1,kicker:ct.kicker,marquee:ct.marquee,desc,seoTopic:cuisine,filter:()=>items};
  const r=buildPage(config,'');
  if(r){writeFileSync(join(root,'toronto',`${r.fileSlug}.html`),r.html);console.log(`  ✅ ${r.fileSlug}.html (${items.length})`);artCount++}
}

console.log('\n=== GUIDES ===');
let gCount=0;
for(const g of GUIDES){
  const r=buildPage(g,'guide');
  if(r){writeFileSync(join(root,'toronto',`${r.fileSlug}.html`),r.html);console.log(`  ✅ ${r.fileSlug}.html`);gCount++}
}

console.log('\n=== AREAS ===');
let aCount=0;
for(const a of AREAS){
  const r=buildPage(a,'area');
  if(r){writeFileSync(join(root,'toronto',`${r.fileSlug}.html`),r.html);console.log(`  ✅ ${r.fileSlug}.html`);aCount++}
}

console.log(`\nDone! ${artCount} articles + ${gCount} guides + ${aCount} areas = ${artCount+gCount+aCount} pages total`);

// ═══ UPDATE ZINE COVER (toronto/index.html) ═══
console.log('\n=== UPDATING ZINE COVER ===');

const COVER_TITLES = {
  'best-pho':'PHO','best-ramen':'RAMEN','best-sushi':'SUSHI','best-burger':'BURGERS',
  'best-pizza':'PIZZA','best-halal':'HALAL','best-steak':'STEAK','best-tacos':'TACOS',
  'best-indian':'INDIAN','best-chinese':'CHINESE','best-italian':'ITALIAN',
  'best-seafood':'SEAFOOD','best-dessert':'DESSERTS','best-coffee':'COFFEE',
  'best-wings':'WINGS','best-caribbean':'CARIBBEAN','best-ayce':'AYCE',
  'best-bbq':'BBQ','best-noodles':'NOODLES','best-fried-chicken':'FRIED CHICKEN',
  'best-shawarma':'SHAWARMA','best-brunch':'BRUNCH',
};
const coverLabelColors=['','label-yellow','label-ink','label-pink','label-teal','label-purple','label-lime','label-orange'];

// Collect all article cover items (first thumbnail per category)
const coverItems = [];
for(const[slug,cat]of Object.entries(CATS)){
  // Same 1-per-creator dedup as buildPage
  const seen=new Set();
  const deduped=cat.items.filter(v=>{if(seen.has(v.creator_name))return false;seen.add(v.creator_name);return true});
  if(deduped.length<3) continue;
  const first = deduped[0];
  if(!first.bunny_video_id) continue;
  coverItems.push({
    href:`/toronto/${slug}`,
    title:COVER_TITLES[slug]||slug.replace('best-','').toUpperCase(),
    img:`${BUNNY_CDN}/${first.bunny_video_id}/thumbnail.jpg`,
    type:'posts',
  });
}
// Add guide items
const guideCovers=[
  {slug:'guide-most-viral',title:'MOST VIRAL'},{slug:'guide-hidden-gems',title:'HIDDEN GEMS'},
  {slug:'guide-spice-scale',title:'SPICE 🌶'},{slug:'guide-worth-the-hype',title:'HYPE CHECK'},
  {slug:'guide-comfort-food',title:'COMFORT'},{slug:'guide-creators-picks',title:'CREATOR PICKS'},
  {slug:'guide-mukbang-approved',title:'MUKBANG'},{slug:'guide-under-15',title:'UNDER $15'},
  {slug:'guide-date-night',title:'DATE NIGHT'},{slug:'guide-first-bite-reaction',title:'FIRST BITE'},
];
const areaCovers=[
  {slug:'area-mississauga',title:'MISSISSAUGA'},{slug:'area-scarborough',title:'SCARBOROUGH'},
  {slug:'area-north-york',title:'NORTH YORK'},{slug:'area-downtown-yonge',title:'DOWNTOWN'},
  {slug:'area-queen-west',title:'QUEEN WEST'},{slug:'area-yorkville-bloor',title:'YORKVILLE'},
  {slug:'area-ossington-dundas-w',title:'OSSINGTON'},{slug:'area-church-wellesley',title:'VILLAGE'},
  {slug:'area-greater-toronto',title:'GTA'},{slug:'area-brampton',title:'BRAMPTON'},
];
const allVids=[...data];
for(let i=0;i<guideCovers.length;i++){
  const v=allVids[Math.min(i*5,allVids.length-1)];
  if(v?.bunny_video_id) coverItems.push({href:`/toronto/${guideCovers[i].slug}`,title:guideCovers[i].title,img:`${BUNNY_CDN}/${v.bunny_video_id}/thumbnail.jpg`,type:'guides'});
}
for(let i=0;i<areaCovers.length;i++){
  const v=allVids[Math.min(i*5+3,allVids.length-1)];
  if(v?.bunny_video_id) coverItems.push({href:`/toronto/${areaCovers[i].slug}`,title:areaCovers[i].title,img:`${BUNNY_CDN}/${v.bunny_video_id}/thumbnail.jpg`,type:'areas'});
}

// Layout patterns (16-col grid)
const coverLayouts=[
  {c:'1/span 5',r:'1/span 4',rot:-2,big:true},{c:'6/span 3',r:'1/span 2',rot:2},{c:'6/span 3',r:'3/span 2',rot:-3},
  {c:'9/span 4',r:'1/span 3',rot:2,big:true},{c:'13/span 2',r:'1/span 2',rot:4},{c:'15/span 2',r:'1/span 2',rot:-3},
  {c:'1/span 3',r:'5/span 2',rot:-2},{c:'4/span 2',r:'5/span 2',rot:3},{c:'6/span 2',r:'5/span 2',rot:-3},
  {c:'8/span 3',r:'4/span 3',rot:3,big:true},{c:'11/span 2',r:'4/span 2',rot:-4},{c:'13/span 4',r:'5/span 3',rot:-1,big:true},
  {c:'1/span 3',r:'7/span 3',rot:-3,big:true},{c:'4/span 2',r:'7/span 2',rot:4},{c:'6/span 2',r:'7/span 2',rot:-3},
  {c:'8/span 3',r:'7/span 3',rot:2,big:true},{c:'11/span 2',r:'7/span 2',rot:-4},{c:'13/span 2',r:'8/span 2',rot:3},
  {c:'15/span 2',r:'8/span 2',rot:-2},{c:'1/span 4',r:'10/span 3',rot:2,big:true},{c:'5/span 2',r:'10/span 2',rot:-3},
  {c:'7/span 2',r:'10/span 2',rot:3},{c:'9/span 4',r:'10/span 3',rot:-2,big:true},{c:'13/span 2',r:'10/span 2',rot:3},
  {c:'15/span 2',r:'10/span 2',rot:-2},{c:'1/span 3',r:'13/span 2',rot:-3},{c:'4/span 2',r:'12/span 2',rot:3},
  {c:'6/span 3',r:'13/span 3',rot:-2,big:true},{c:'9/span 4',r:'13/span 3',rot:2,big:true},{c:'13/span 4',r:'13/span 3',rot:-2,big:true},
  {c:'1/span 4',r:'16/span 3',rot:3,big:true},{c:'5/span 4',r:'16/span 3',rot:-2,big:true},{c:'9/span 2',r:'16/span 2',rot:3},
  {c:'11/span 2',r:'16/span 2',rot:-3},{c:'13/span 4',r:'16/span 3',rot:-2,big:true},
  {c:'1/span 3',r:'19/span 3',rot:2,big:true},{c:'4/span 2',r:'19/span 2',rot:-3},{c:'6/span 3',r:'19/span 2',rot:3},
  {c:'9/span 4',r:'19/span 3',rot:-2,big:true},{c:'13/span 2',r:'19/span 2',rot:-4},{c:'15/span 2',r:'19/span 2',rot:3},
];

let coverGridHTML='';
const n=Math.min(coverItems.length,coverLayouts.length);
for(let i=0;i<n;i++){
  const it=coverItems[i],ly=coverLayouts[i];
  const lc=coverLabelColors[i%coverLabelColors.length];
  const label=ly.big?`<span class="feat-label ${lc}">${it.title} ↗</span>`:`<span class="sub-label ${lc}">${it.title}</span>`;
  const tape=i%5===0?`<div class="tape${i%3===0?' red':''}" style="top:-10px;${i%2?'left':'right'}:${20+i%30}%;width:${55+i%20}px;height:${16+i%5}px;transform:rotate(${-4+i%8}deg)"></div>`:'';
  coverGridHTML+=`
      <a class="hoverable mini" data-type="${it.type}" href="${it.href}" style="--hover-rot:${ly.rot}deg;grid-column:${ly.c};grid-row:${ly.r};transform:rotate(${ly.rot}deg)">
        ${ly.big?label:''}
        <div class="clip"><img src="${it.img}" alt="${it.title}" loading="lazy"/></div>
        ${!ly.big?label:''}${tape}
      </a>`;
}
// Stamp + closing typographic card
coverGridHTML+=`
      <div style="grid-column:13/span 4;grid-row:3/span 2;display:flex;flex-direction:column;gap:.3rem;padding:.4rem;justify-content:center">
        <div class="stamp" style="align-self:flex-start">VIDEO VERIFIED</div>
        <p class="mono" style="font-size:.7rem;line-height:1.3;margin:0">${coverItems.length} lists · 10 guides · 10 areas</p>
        <div class="barcode" aria-hidden="true"></div>
      </div>
      <div style="grid-column:1/span 16;grid-row:${Math.ceil(n/3)*2+2}/span 1;display:flex;align-items:center;justify-content:center;background:var(--ink);color:var(--paper);padding:1.2rem;transform:rotate(-.3deg);box-shadow:6px 6px 0 var(--red);margin-top:1rem">
        <div style="font-family:'Shrikhand',cursive;font-size:clamp(1.6rem,4vw,3rem);letter-spacing:.02em">↓ more lists every <span style="color:var(--yellow)">Friday</span> ↓</div>
      </div>`;

// Replace in index.html
let indexHTML=readFileSync(join(root,'toronto','index.html'),'utf8');
const startMarker='    <!-- COVER COLLAGE - DENSE MANY SMALL IMAGES -->\n    <div class="cover-grid">';
const endMarker='    </div>\n      </div><!-- /previous post -->';
const si=indexHTML.indexOf(startMarker);
const ei=indexHTML.indexOf(endMarker);
if(si!==-1&&ei!==-1){
  indexHTML=indexHTML.substring(0,si)+
    '    <!-- COVER COLLAGE - REAL DATA -->\n    <div class="cover-grid">'+coverGridHTML+'\n    </div>\n      </div><!-- /previous post -->'+
    indexHTML.substring(ei+endMarker.length);
  writeFileSync(join(root,'toronto','index.html'),indexHTML);
  console.log(`  ✅ Updated cover grid with ${n} real items`);
} else {
  console.log(`  ⚠️ Could not find cover-grid markers (si=${si}, ei=${ei})`);
  // Try alternative: just look for the div
  const altSi=indexHTML.indexOf('<div class="cover-grid">');
  const altEi=indexHTML.indexOf('</div><!-- /previous post -->');
  if(altSi!==-1&&altEi!==-1){
    indexHTML=indexHTML.substring(0,altSi)+
      '<div class="cover-grid">'+coverGridHTML+'\n    </div>\n      </div><!-- /previous post -->'+
      indexHTML.substring(altEi+('</div><!-- /previous post -->').length);
    writeFileSync(join(root,'toronto','index.html'),indexHTML);
    console.log(`  ✅ Updated cover grid (alt method) with ${n} real items`);
  } else {
    console.log(`  ❌ Failed to update cover grid`);
  }
}
