/**
 * City-theme switch for the landing page.
 *
 * Visitors in a supported metro get that city's themed landing page (its
 * own vehicle, street grid, landmarks and creator pins — index-<slug>.html)
 * served at the same "/" URL; everyone else gets the Toronto default.
 * Geo comes from Vercel's per-request IP headers, so no external geo
 * service is needed.
 *
 * Test without a VPN: /?city=<slug> forces a theme (e.g. /?city=miami),
 * and /?city=toronto forces the default.
 */
import { rewrite, next } from '@vercel/edge';

export const config = { matcher: '/' };

// slug → match rule against Vercel IP geo headers.
// region = x-vercel-ip-country-region (US state code). cities = extra metro
// municipalities that fall outside the primary state (matched on the
// x-vercel-ip-city header, case-insensitive, exact).
const CITY_RULES = [
  { slug: 'nyc',          region: 'NY', cities: ['jersey city', 'hoboken', 'newark', 'weehawken', 'fort lee'] },
  { slug: 'la',           region: 'CA', cities: ['los angeles', 'long beach', 'santa monica', 'pasadena', 'burbank', 'glendale', 'inglewood', 'anaheim'] },
  { slug: 'sf',           region: 'CA', cities: ['san francisco', 'oakland', 'berkeley', 'daly city', 'south san francisco'] },
  { slug: 'chicago',      region: 'IL', cities: ['chicago', 'evanston', 'oak park', 'cicero', 'skokie'] },
  { slug: 'miami',        region: 'FL', cities: ['miami', 'miami beach', 'hialeah', 'coral gables', 'doral', 'north miami'] },
  { slug: 'atlanta',      region: 'GA', cities: ['atlanta', 'decatur', 'sandy springs', 'marietta', 'east point'] },
  { slug: 'houston',      region: 'TX', cities: ['houston', 'sugar land', 'pearland', 'katy', 'the woodlands'] },
  { slug: 'dallas',       region: 'TX', cities: ['dallas', 'fort worth', 'arlington', 'plano', 'irving', 'garland'] },
  { slug: 'seattle',      region: 'WA', cities: ['seattle', 'bellevue', 'tacoma', 'redmond', 'kirkland', 'renton'] },
  { slug: 'boston',       region: 'MA', cities: ['boston', 'cambridge', 'somerville', 'brookline', 'quincy', 'newton'] },
  { slug: 'philadelphia', region: 'PA', cities: ['philadelphia', 'camden', 'chester', 'upper darby'] },
];

// CA and TX host two cities each; disambiguate by nearest metro on the
// city header, falling back to the first rule for that state.
const AMBIGUOUS_STATES = { CA: ['la', 'sf'], TX: ['dallas', 'houston'] };

function pickForState(region, city) {
  const inState = CITY_RULES.filter(r => r.region === region);
  if (inState.length === 1) return inState[0].slug;
  // Ambiguous state: match the city list explicitly; else default to first.
  for (const r of inState) {
    if (r.cities.includes(city)) return r.slug;
  }
  return (AMBIGUOUS_STATES[region] || [inState[0]?.slug])[0];
}

export default function middleware(request) {
  const url = new URL(request.url);
  const force = url.searchParams.get('city');
  if (force === 'toronto') return next();

  // Explicit override for testing: /?city=<slug>
  if (force) {
    const known = CITY_RULES.find(r => r.slug === force);
    if (known) return rewrite(new URL(`/index-${known.slug}`, request.url));
    return next();
  }

  const country = request.headers.get('x-vercel-ip-country') || '';
  if (country !== 'US') return next();
  const region = request.headers.get('x-vercel-ip-country-region') || '';
  const city = decodeURIComponent(request.headers.get('x-vercel-ip-city') || '').toLowerCase();

  // First, an out-of-state metro municipality (e.g. Jersey City → NYC).
  for (const r of CITY_RULES) {
    if (r.cities.includes(city)) return rewrite(new URL(`/index-${r.slug}`, request.url));
  }
  // Then, by state.
  if (CITY_RULES.some(r => r.region === region)) {
    const slug = pickForState(region, city);
    if (slug) return rewrite(new URL(`/index-${slug}`, request.url));
  }
  return next();
}
