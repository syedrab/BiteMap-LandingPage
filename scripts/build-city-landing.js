/**
 * Parametrized city-landing generator.
 *
 * Reads data/city-themes/<slug>.json and produces index-<slug>.html by
 * transforming the Toronto master (index.html): swapping the street grid,
 * the landmark silhouettes, the moving vehicle, the creator pins, and the
 * meta/robots/body tags. Same transform contract as the original
 * build-nyc-landing-preview.js, but data-driven so every city stays
 * consistent.
 *
 * Usage:
 *   node scripts/build-city-landing.js <slug>     # one city
 *   node scripts/build-city-landing.js --all       # every json in data/city-themes
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesDir = join(root, 'data', 'city-themes');

// ── Creator pools ────────────────────────────────────────────────────
// Pins are decorative; alt text only. City-specific handles (where we
// have them) are prepended, then topped up from a general pool to ~24.
const GENERAL_POOL = ['aarnvrr', 'insta.noodls', 'joshkimeats', 'jessycadinh', 'foodiebros_to', 'davebites', 'ryaneatzz', 'oxtailpapi', 'charweeezy', 'chelskng', 'anniethaonhi', 'bitesofsunah', 'foodiesushiqueen', 'gourmetgirlie', 'winniefoodie', 'maryymak', 'mattiasblanco', 'nick.rizzo.daily', 'josephdebenedictis', 'ourhungergoals_', 'thecaroandtina', 'snackeatingsnacks', 'great_eats', 'craveshack', 'dudelovesfood', 'darnitdamon', 'devstayeatin', 'inspiredbyak', 'naijeyathefoodie', 'meggyeatz', 'eugeeoh', 'schmoozelife', 'povmonaeats', 'phlmyplate', 'bussin.boys'];
const CITY_SPECIFIC = {
  seattle: ['biteofseattle', 'curated_seattle', 'seattle.food.diva', 'seattlefoodieadventure', 'seattlehalalfoodie', 'infatuation_seattle', 'hangry.wa', 'george.pnw'],
  philadelphia: ['bites.of.philly', 'josheatsphilly', 'phillyfoodies', 'phillyfoodladies', 'fueledonphilly', 'how.kev.eats'],
  atlanta: ['atlantaeatstv', 'atlfoodies', 'zackinatl', 'dariusddavidson'],
  dallas: ['cheapdatesdallas'],
  nyc: ['foodbythegram', 'how.kev.eats', 'vveatss', 'thehalalfoodcompass', 'emifoodi', 'emiliemooney', 'deliciousfoodfinds', 'ksitrin', 'shantheleo', 'styledtoatea', 'thefoodblogbyduke', 'tht.youngfoodie', 'zia_hazrati'],
};
function creatorsFor(slug) {
  const specific = CITY_SPECIFIC[slug] || [];
  const seen = new Set();
  const out = [];
  for (const c of [...specific, ...GENERAL_POOL]) {
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= 24) break;
  }
  return out;
}

// ── Fixed Toronto→city street mapping keys (order matters: the JS route
//    names reuse the horizontal street values) ─────────────────────────
const H_KEYS = ['Eglinton Ave', 'St Clair Ave', 'Bloor St', 'Danforth Ave', 'Dundas St', 'Queen St', 'King St', 'Front St', 'Lakeshore Blvd'];
const V_KEYS = ['Bathurst St', 'Spadina Ave', 'University Ave', 'Bay St', 'Yonge St', 'Church St', 'Jarvis St', 'Parliament St', 'Broadview Ave'];
// JS streetcar route name (short) → the horizontal key it corresponds to
const ROUTE_TO_HKEY = {
  Eglinton: 'Eglinton Ave', 'St Clair': 'St Clair Ave', Bloor: 'Bloor St',
  Dundas: 'Dundas St', Queen: 'Queen St', King: 'King St', Front: 'Front St',
};
const ROUTE_TOPS = { Eglinton: '2%', 'St Clair': '15%', Bloor: '28%', Dundas: '42%', Queen: '55%', King: '68%', Front: '81%' };

// ── Landmark regexes against the Toronto master (fixed) ───────────────
// labelled: [regex, cfgKey, label-in-config]; unlabelled: [regex, cfgKey]
const LABELLED = [
  [/<img src="images\/cntower\.jpg"[^>]*>\s*<span class="landmark-label">CN Tower<\/span>/, 'cntower'],
  [/<img src="images\/casaloma\.jpg"[^>]*>\s*<span class="landmark-label">Casa Loma<\/span>/, 'casaloma'],
  [/<img src="images\/stlawrence\.jpg"[^>]*>\s*<span class="landmark-label">St\. Lawrence Market<\/span>/, 'stlawrence'],
  [/<img src="images\/bmofield\.jpg"[^>]*>\s*<span class="landmark-label">BMO Field<\/span>/, 'bmofield'],
  [/<img src="images\/ROM\.jpg"[^>]*>\s*<span class="landmark-label">ROM<\/span>/, 'ROM'],
];
const UNLABELLED = [
  [/<img src="images\/donvalley\.jpg"[^>]*>/, 'donvalley'],
  [/<img src="images\/harbourfront\.jpg"[^>]*>/, 'harbourfront'],
  [/<img src="images\/dundassq\.jpg"[^>]*>/, 'dundassq'],
];

function buildCity(slug) {
  const cfg = JSON.parse(readFileSync(join(themesDir, `${slug}.json`), 'utf8'));
  let html = readFileSync(join(root, 'index.html'), 'utf8');

  const mustReplace = (from, to) => {
    if (!html.includes(from)) throw new Error(`[${slug}] marker not found: ${from.slice(0, 50)}`);
    html = html.split(from).join(to);
  };

  // 1. Streets
  const hmap = cfg.streets.horizontal, vmap = cfg.streets.vertical;
  for (const k of [...H_KEYS, ...V_KEYS]) {
    const src = hmap[k] ?? vmap[k];
    if (!src) throw new Error(`[${slug}] missing street mapping for "${k}"`);
    mustReplace(k, src);
  }
  // JS route names → horizontal values (do these before generic, guarded by full string)
  for (const [route, hkey] of Object.entries(ROUTE_TO_HKEY)) {
    const from = `{ name: '${route}', top: '${ROUTE_TOPS[route]}' }`;
    // hkey already renamed above, so target uses the mapped value
    mustReplace(from, `{ name: '${hmap[hkey]}', top: '${ROUTE_TOPS[route]}' }`);
  }

  // 2. Landmarks
  const marker = cfg.marker;
  // Toronto sign → dashed marker circle (auto-generated)
  const markerSvg = `<svg class="toronto-img" style="width:110px" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#d62419" stroke-width="4" stroke-dasharray="6 4"/><text x="50" y="62" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="30" fill="#d62419">${marker}</text></svg>`;
  html = html.replace(/<img src="images\/toronto\.jpg"[^>]*>/, markerSvg);
  for (const [re, key] of LABELLED) {
    const l = cfg.landmarks[key];
    if (!l || !l.svg || !l.label) throw new Error(`[${slug}] landmark "${key}" needs {svg,label}`);
    if (!re.test(html)) throw new Error(`[${slug}] landmark marker not found: ${key}`);
    html = html.replace(re, `${l.svg}\n        <span class="landmark-label">${l.label}</span>`);
  }
  for (const [re, key] of UNLABELLED) {
    const l = cfg.landmarks[key];
    if (!l || !l.svg) throw new Error(`[${slug}] landmark "${key}" needs {svg}`);
    if (!re.test(html)) throw new Error(`[${slug}] landmark marker not found: ${key}`);
    html = html.replace(re, l.svg);
  }

  // 3. Vehicle (streetcar → city vehicle)
  mustReplace(`            const img = document.createElement('img');
            img.src = 'images/streetcar.jpg';
            img.alt = 'Streetcar on ' + route.name;
            streetcar.appendChild(img);`,
    `            streetcar.innerHTML = ${JSON.stringify(cfg.vehicle.svg)};`);
  mustReplace(`        .streetcar-decor img {
            height: 50px;
            width: auto;
        }`,
    `        .streetcar-decor img {
            height: 50px;
            width: auto;
        }

        .streetcar-decor svg {
            height: ${cfg.vehicle.height || 44}px;
            width: auto;
        }`);

  // 4. Creator pins
  const creators = creatorsFor(slug);
  const arrRe = /const creatorNames = \[[^\]]*\];/;
  if (!arrRe.test(html)) throw new Error(`[${slug}] creatorNames array not found`);
  html = html.replace(arrRe, `const creatorNames = [${creators.map(c => `'${c}'`).join(', ')}];`);

  // 5. Meta
  mustReplace('<title>BiteMap - Best Restaurants Near You | Video Reviews</title>',
    `<title>${cfg.metaTitle}</title>`);
  mustReplace('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
    '<meta name="robots" content="noindex, nofollow">');
  html = html.replace('<body>', `<body data-city="${cfg.slug}">`);

  const outfile = join(root, `index-${slug}.html`);
  writeFileSync(outfile, html);
  console.log(`✅ index-${slug}.html  (${creators.length} pins, marker "${marker}")`);
}

const args = process.argv.slice(2);
const slugs = args.includes('--all')
  ? readdirSync(themesDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
  : args;
if (!slugs.length) { console.error('Usage: node scripts/build-city-landing.js <slug> | --all'); process.exit(1); }
let fail = 0;
for (const s of slugs) {
  try { buildCity(s); } catch (e) { console.error(`❌ ${e.message}`); fail++; }
}
process.exit(fail ? 1 : 0);
