/**
 * City-theme switch for the landing page.
 *
 * New York-area visitors get the NYC-themed landing page (yellow cabs,
 * Manhattan grid, NYC creator pins — index-nyc.html) served at the same
 * URL; everyone else gets the Toronto default. Geo comes from Vercel's
 * per-request IP headers, so no external geo service is needed.
 *
 * Test without a VPN: /?city=nyc forces the NYC theme, /?city=toronto
 * forces the default.
 */
import { rewrite, next } from '@vercel/edge';

export const config = { matcher: '/' };

// NYC metro cities that sit outside NY state (so region alone won't catch them)
const NYC_METRO = /^(jersey city|hoboken|newark|weehawken|fort lee)$/i;

export default function middleware(request) {
  const url = new URL(request.url);
  const force = url.searchParams.get('city');
  if (force === 'toronto') return next();

  const country = request.headers.get('x-vercel-ip-country') || '';
  const region = request.headers.get('x-vercel-ip-country-region') || '';
  const city = decodeURIComponent(request.headers.get('x-vercel-ip-city') || '');

  const isNYC =
    force === 'nyc' ||
    (country === 'US' && (region === 'NY' || NYC_METRO.test(city)));

  if (isNYC) return rewrite(new URL('/index-nyc.html', request.url));
  return next();
}
