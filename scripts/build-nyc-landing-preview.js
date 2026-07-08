/**
 * Build a viewable New York LANDING PAGE preview from index.html:
 * yellow cabs instead of streetcars, Manhattan street grid names,
 * NYC landmark silhouettes (Empire State, Statue of Liberty, Brooklyn
 * Bridge, Central Park, Grand Central, The Met, MSG, subway bullet),
 * and NYC creator pins.
 *
 * Output: index-nyc.html  (open it to see the NYC landing style)
 * This is the design proof for the IP-based city-theme switch —
 * the body is tagged <body data-city="new-york">.
 *
 * Usage: node scripts/build-nyc-landing-preview.js
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let html = readFileSync(join(root, 'index.html'), 'utf8');

const mustReplace = (from, to) => {
  if (!html.includes(from)) throw new Error(`Marker not found: ${from.slice(0, 60)}`);
  html = html.split(from).join(to);
};

// ── 1. Street names: Toronto grid → Manhattan grid ──────────────────
// Horizontal (N→S): 96th, 86th, 72nd, 57th, 42nd, 34th, 23rd, 14th
// Vertical (W→E): 11th, 9th, 7th, Broadway, 5th, Madison, Park, Lex, Bedford
const streetSwaps = [
  ['Eglinton Ave', '96th St'],
  ['St Clair Ave', '86th St'],
  ['Bloor St', '72nd St'],
  ['Danforth Ave', 'Roosevelt Ave'],
  ['Dundas St', '57th St'],
  ['Queen St', '42nd St'],
  ['King St', '34th St'],
  ['Front St', '23rd St'],
  ['Lakeshore Blvd', '14th St'],
  ['Bathurst St', '11th Ave'],
  ['Spadina Ave', '9th Ave'],
  ['University Ave', '7th Ave'],
  ['Bay St', 'Broadway'],
  ['Yonge St', '5th Ave'],
  ['Church St', 'Madison Ave'],
  ['Jarvis St', 'Park Ave'],
  ['Parliament St', 'Lexington Ave'],
  ['Broadview Ave', 'Bedford Ave'],
  // JS streetcar route names (used for grouping/comments only)
  ["{ name: 'Eglinton', top: '2%' }", "{ name: '96th St', top: '2%' }"],
  ["{ name: 'St Clair', top: '15%' }", "{ name: '86th St', top: '15%' }"],
  ["{ name: 'Bloor', top: '28%' }", "{ name: '72nd St', top: '28%' }"],
  ["{ name: 'Dundas', top: '42%' }", "{ name: '57th St', top: '42%' }"],
  ["{ name: 'Queen', top: '55%' }", "{ name: '42nd St', top: '55%' }"],
  ["{ name: 'King', top: '68%' }", "{ name: '34th St', top: '68%' }"],
  ["{ name: 'Front', top: '81%' }", "{ name: '23rd St', top: '81%' }"],
];
for (const [a, b] of streetSwaps) mustReplace(a, b);

// ── 2. Landmarks: Toronto imgs → NYC inline-SVG silhouettes ─────────
// Container classes are kept so positions, opacity CSS, and the JS
// landmark-exclusion zones keep working untouched.
const landmarkSwaps = [
  // CN Tower → Empire State Building
  [/<img src="images\/cntower\.jpg"[^>]*>\s*<span class="landmark-label">CN Tower<\/span>/,
`<svg class="cn-tower-img" style="width:48px" width="120" height="256" viewBox="0 0 120 256"><g fill="#141210"><rect x="57" y="0" width="6" height="34"/><rect x="52" y="30" width="16" height="22"/><path d="M44 50 L76 50 L72 92 L48 92 Z"/><path d="M40 90 L80 90 L78 120 L42 120 Z"/><rect x="36" y="118" width="48" height="138"/><g fill="#fff" opacity=".5"><rect x="42" y="130" width="4" height="10"/><rect x="52" y="130" width="4" height="10"/><rect x="62" y="130" width="4" height="10"/><rect x="72" y="130" width="4" height="10"/><rect x="42" y="150" width="4" height="10"/><rect x="52" y="150" width="4" height="10"/><rect x="62" y="150" width="4" height="10"/><rect x="72" y="150" width="4" height="10"/><rect x="42" y="170" width="4" height="10"/><rect x="52" y="170" width="4" height="10"/><rect x="62" y="170" width="4" height="10"/><rect x="72" y="170" width="4" height="10"/></g></g></svg>
        <span class="landmark-label">Empire State</span>`],
  // Toronto sign → dashed NYC marker circle
  [/<img src="images\/toronto\.jpg"[^>]*>/,
`<svg class="toronto-img" style="width:110px" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#d62419" stroke-width="4" stroke-dasharray="6 4"/><text x="50" y="62" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="30" fill="#d62419">NYC</text></svg>`],
  // Casa Loma → Central Park
  [/<img src="images\/casaloma\.jpg"[^>]*>\s*<span class="landmark-label">Casa Loma<\/span>/,
`<svg class="casaloma-img" style="width:84px" width="120" height="76" viewBox="0 0 120 76"><rect x="4" y="4" width="112" height="68" rx="10" fill="#7bb661" stroke="#141210" stroke-width="3" opacity=".9"/><g fill="#3e7a3e"><circle cx="30" cy="28" r="9"/><circle cx="54" cy="44" r="11"/><circle cx="84" cy="26" r="8"/><circle cx="94" cy="52" r="9"/><circle cx="26" cy="54" r="7"/></g><path d="M14 38 Q40 30 60 38 T106 38" fill="none" stroke="#f1ead8" stroke-width="3"/></svg>
        <span class="landmark-label">Central Park</span>`],
  // St. Lawrence Market → Grand Central
  [/<img src="images\/stlawrence\.jpg"[^>]*>\s*<span class="landmark-label">St\. Lawrence Market<\/span>/,
`<svg class="stlawrence-img" style="width:104px" width="140" height="84" viewBox="0 0 140 84"><g fill="#141210"><path d="M10 30 L70 8 L130 30 L130 36 L10 36 Z"/><rect x="10" y="36" width="120" height="48"/><g fill="#fff" opacity=".6"><path d="M24 48 a10 10 0 0 1 20 0 V78 H24 Z"/><path d="M60 48 a10 10 0 0 1 20 0 V78 H60 Z"/><path d="M96 48 a10 10 0 0 1 20 0 V78 H96 Z"/></g><circle cx="70" cy="22" r="7" fill="#f5c518" stroke="#141210" stroke-width="2"/></g></svg>
        <span class="landmark-label">Grand Central</span>`],
  // BMO Field → Madison Square Garden
  [/<img src="images\/bmofield\.jpg"[^>]*>\s*<span class="landmark-label">BMO Field<\/span>/,
`<svg class="bmofield-img" style="width:104px" width="140" height="72" viewBox="0 0 140 72"><g stroke="#141210" stroke-width="3"><ellipse cx="70" cy="20" rx="62" ry="14" fill="#c9c4b4"/><path d="M8 20 L8 52 Q8 66 70 66 Q132 66 132 52 L132 20" fill="#dcd6c4"/><line x1="30" y1="28" x2="30" y2="60"/><line x1="70" y1="32" x2="70" y2="66"/><line x1="110" y1="28" x2="110" y2="60"/></g></svg>
        <span class="landmark-label">Madison Sq Garden</span>`],
  // ROM → The Met
  [/<img src="images\/ROM\.jpg"[^>]*>\s*<span class="landmark-label">ROM<\/span>/,
`<svg class="rom-img" style="width:92px" width="130" height="80" viewBox="0 0 130 80"><g fill="#141210"><path d="M12 30 L65 8 L118 30 L118 36 L12 36 Z"/><g><rect x="20" y="40" width="8" height="28"/><rect x="38" y="40" width="8" height="28"/><rect x="56" y="40" width="8" height="28"/><rect x="74" y="40" width="8" height="28"/><rect x="92" y="40" width="8" height="28"/><rect x="102" y="40" width="8" height="28"/></g><rect x="12" y="68" width="106" height="6"/><rect x="8" y="74" width="114" height="6"/></g></svg>
        <span class="landmark-label">The Met</span>`],
  // Don Valley → Brooklyn Bridge
  [/<img src="images\/donvalley\.jpg"[^>]*>/,
`<svg class="donvalley-img" style="width:190px" width="220" height="74" viewBox="0 0 220 74"><g stroke="#141210" stroke-width="3" fill="#141210"><path d="M56 10 L72 10 L72 64 L56 64 Z" fill="#141210"/><path d="M60 22 a4 8 0 0 1 8 0 v10 h-8 Z" fill="#fff"/><path d="M148 10 L164 10 L164 64 L148 64 Z"/><path d="M152 22 a4 8 0 0 1 8 0 v10 h-8 Z" fill="#fff"/><path d="M0 40 Q32 62 64 46 Q110 20 156 46 Q188 62 220 40" fill="none"/><line x1="0" y1="60" x2="220" y2="60"/></g></svg>`],
  // Harbourfront → Statue of Liberty
  [/<img src="images\/harbourfront\.jpg"[^>]*>/,
`<svg class="harbourfront-img" style="width:42px" width="95" height="215" viewBox="0 0 95 215"><g fill="#141210"><rect x="30" y="186" width="36" height="29"/><rect x="36" y="172" width="24" height="16"/><path d="M40 92 L56 92 L62 172 L34 172 Z"/><g transform="rotate(10 52 70)"><rect x="49" y="38" width="6" height="56"/></g><path d="M50 24 L62 24 L59 40 L53 40 Z" fill="#f5c518"/><circle cx="45" cy="84" r="8"/><path d="M37 78 L33 68 M41 76 L40 64 M45 75 L47 63 M49 76 L54 66 M52 78 L59 70" stroke="#141210" stroke-width="2" fill="none"/></g></svg>`],
  // Dundas Square → MTA subway bullet
  [/<img src="images\/dundassq\.jpg"[^>]*>/,
`<svg class="dundassq-img" style="width:46px" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#f5c518" stroke="#141210" stroke-width="3"/><text x="50" y="66" text-anchor="middle" font-family="Archivo Black, sans-serif" font-size="44" fill="#141210">N</text></svg>`],
];
for (const [re, to] of landmarkSwaps) {
  if (!re.test(html)) throw new Error(`Landmark marker not found: ${re}`);
  html = html.replace(re, to);
}

// ── 3. Streetcars → yellow cabs ──────────────────────────────────────
const TAXI_SVG = `'<svg viewBox="0 0 300 130"><rect x="134" y="8" width="32" height="13" fill="#141210"/><text x="150" y="18" text-anchor="middle" font-family="Archivo Black, sans-serif" font-size="8" fill="#f5c518">TAXI</text><path d="M18 74 L42 42 L120 32 L205 40 L272 62 L284 74 L284 96 L18 96 Z" fill="#f5c518" stroke="#141210" stroke-width="3"/><path d="M52 46 L116 38 L116 62 L46 62 Z" fill="#bfe3ee" stroke="#141210" stroke-width="2"/><path d="M124 38 L194 44 L212 62 L124 62 Z" fill="#bfe3ee" stroke="#141210" stroke-width="2"/><line x1="120" y1="36" x2="120" y2="62" stroke="#141210" stroke-width="3"/><g fill="#141210"><rect x="18" y="74" width="14" height="9"/><rect x="46" y="74" width="14" height="9"/><rect x="74" y="74" width="14" height="9"/><rect x="102" y="74" width="14" height="9"/><rect x="130" y="74" width="14" height="9"/><rect x="158" y="74" width="14" height="9"/><rect x="186" y="74" width="14" height="9"/><rect x="214" y="74" width="14" height="9"/><rect x="242" y="74" width="14" height="9"/><rect x="270" y="74" width="14" height="9"/></g><text x="150" y="92" text-anchor="middle" font-family="Archivo Black, sans-serif" font-size="12" fill="#141210">N Y C</text><circle cx="74" cy="98" r="17" fill="#141210"/><circle cx="74" cy="98" r="6" fill="#f1ead8"/><circle cx="232" cy="98" r="17" fill="#141210"/><circle cx="232" cy="98" r="6" fill="#f1ead8"/></svg>'`;

mustReplace(`            const img = document.createElement('img');
            img.src = 'images/streetcar.jpg';
            img.alt = 'Streetcar on ' + route.name;
            streetcar.appendChild(img);`,
`            streetcar.innerHTML = ${TAXI_SVG};`);

mustReplace(`        .streetcar-decor img {
            height: 50px;
            width: auto;
        }`,
`        .streetcar-decor img {
            height: 50px;
            width: auto;
        }

        .streetcar-decor svg {
            height: 44px;
            width: auto;
        }`);

// ── 4. Creator pins → NYC creators ───────────────────────────────────
const NYC_CREATORS = ['foodbythegram', 'how.kev.eats', 'vveatss', 'thehalalfoodcompass', 'emifoodi', 'emiliemooney', 'deliciousfoodfinds', 'ksitrin', 'shantheleo', 'styledtoatea', 'thefoodblogbyduke', 'tht.youngfoodie', 'zia_hazrati', 'oxtailpapi', 'naijeyathefoodie', 'bussin.boys', 'charweeezy', 'darnitdamon', 'jessycadinh', 'ryaneatzz', 'insta.noodls', 'bites.of.philly', 'fueledonphilly', 'josheatsphilly', 'phillyfoodies', 'phillyfoodladies', 'phlmyplate'];
const arrRe = /const creatorNames = \[[^\]]*\];/;
if (!arrRe.test(html)) throw new Error('creatorNames array not found');
html = html.replace(arrRe, `const creatorNames = [${NYC_CREATORS.map(c => `'${c}'`).join(', ')}];`);

// ── 5. Meta: preview-only page, tagged for the city-theme switch ─────
mustReplace('<title>BiteMap - Best Restaurants Near You | Video Reviews</title>',
'<title>BiteMap New York - Best Restaurants Near You | Video Reviews (Preview)</title>');
mustReplace('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
'<meta name="robots" content="noindex, nofollow">');
html = html.replace('<body>', '<body data-city="new-york">');

writeFileSync(join(root, 'index-nyc.html'), html);
console.log('✅ Wrote index-nyc.html — open it to see the NYC landing style.');
