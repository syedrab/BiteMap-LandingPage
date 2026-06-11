/**
 * Build a viewable New York hub preview from the Toronto hub template,
 * swapping in NYC landmark iconography (yellow taxi, skyline, Statue of Liberty,
 * subway bullet, NY pizza, bagel, hot dog, water tower) + NYC masthead.
 *
 * Output: new-york/preview.html  (open it to see the NYC background style)
 * This is the design proof for the IP-based city-theme system.
 *
 * Usage: node scripts/build-nyc-preview.js
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── NYC landmark layer. Landmark silhouettes use higher opacity (less transparent)
//    per the brief; foreground food/stickers stay punchy. Same bg-item contract
//    as Toronto (data-speed = parallax, --r = rotation, floaty/spin animations). ──
const NYC_BG = `    <!-- BACKGROUND NEW YORK ICONOGRAPHY -->
    <div class="bg-layer" id="bgLayer" aria-hidden="true">

      <!-- Faint Empire State Building behind title -->
      <div class="bg-item" data-speed="0.05" style="top:3rem;left:-20px;opacity:.22">
        <svg width="300" height="640" viewBox="0 0 120 256">
          <g fill="#141210">
            <rect x="57" y="0" width="6" height="34"/>
            <rect x="52" y="30" width="16" height="22"/>
            <path d="M44 50 L76 50 L72 92 L48 92 Z"/>
            <path d="M40 90 L80 90 L78 120 L42 120 Z"/>
            <rect x="36" y="118" width="48" height="138"/>
            <g fill="#f1ead8" opacity=".5"><rect x="42" y="130" width="4" height="10"/><rect x="52" y="130" width="4" height="10"/><rect x="62" y="130" width="4" height="10"/><rect x="72" y="130" width="4" height="10"/><rect x="42" y="150" width="4" height="10"/><rect x="52" y="150" width="4" height="10"/><rect x="62" y="150" width="4" height="10"/><rect x="72" y="150" width="4" height="10"/><rect x="42" y="170" width="4" height="10"/><rect x="52" y="170" width="4" height="10"/><rect x="62" y="170" width="4" height="10"/><rect x="72" y="170" width="4" height="10"/></g>
          </g>
        </svg>
      </div>

      <!-- Statue of Liberty silhouette -->
      <div class="bg-item" data-speed="-0.07" style="top:16rem;right:-20px;opacity:.24;animation:floaty 8s ease-in-out infinite;--r:4deg">
        <svg width="190" height="430" viewBox="0 0 95 215">
          <g fill="#141210">
            <rect x="30" y="186" width="36" height="29"/>
            <rect x="36" y="172" width="24" height="16"/>
            <path d="M40 92 L56 92 L62 172 L34 172 Z"/>
            <g transform="rotate(10 52 70)"><rect x="49" y="38" width="6" height="56"/></g>
            <path d="M50 24 L62 24 L59 40 L53 40 Z" fill="#f5c518"/>
            <circle cx="45" cy="84" r="8"/>
            <path d="M37 78 L33 68 M41 76 L40 64 M45 75 L47 63 M49 76 L54 66 M52 78 L59 70" stroke="#141210" stroke-width="2" fill="none"/>
          </g>
        </svg>
      </div>

      <!-- NYC marker circle -->
      <div class="bg-item" data-speed="0.14" style="top:3rem;right:24%;opacity:.7;animation:floaty 4s ease-in-out infinite;--r:-6deg">
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#d62419" stroke-width="4" stroke-dasharray="6 4"/>
          <text x="50" y="64" text-anchor="middle" font-family="Shrikhand, serif" font-size="34" fill="#d62419">NYC</text>
        </svg>
      </div>

      <!-- Subway bullet (MTA roundel) -->
      <div class="bg-item" data-speed="-0.04" style="top:11rem;right:13%;opacity:.78;--r:-4deg">
        <svg width="96" height="96" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="#f5c518" stroke="#141210" stroke-width="3"/>
          <text x="50" y="68" text-anchor="middle" font-family="Archivo Black" font-size="48" fill="#141210">Q</text>
        </svg>
      </div>

      <!-- Yellow taxi (hero) -->
      <div class="bg-item" data-speed="0.15" style="top:47rem;left:-40px;opacity:.9">
        <svg width="320" height="130" viewBox="0 0 300 130">
          <rect x="134" y="8" width="32" height="13" fill="#141210"/>
          <text x="150" y="18" text-anchor="middle" font-family="Archivo Black" font-size="8" fill="#f5c518">TAXI</text>
          <path d="M18 74 L42 42 L120 32 L205 40 L272 62 L284 74 L284 96 L18 96 Z" fill="#f5c518" stroke="#141210" stroke-width="3"/>
          <path d="M52 46 L116 38 L116 62 L46 62 Z" fill="#bfe3ee" stroke="#141210" stroke-width="2"/>
          <path d="M124 38 L194 44 L212 62 L124 62 Z" fill="#bfe3ee" stroke="#141210" stroke-width="2"/>
          <line x1="120" y1="36" x2="120" y2="62" stroke="#141210" stroke-width="3"/>
          <g fill="#141210"><rect x="18" y="74" width="14" height="9"/><rect x="46" y="74" width="14" height="9"/><rect x="74" y="74" width="14" height="9"/><rect x="102" y="74" width="14" height="9"/><rect x="130" y="74" width="14" height="9"/><rect x="158" y="74" width="14" height="9"/><rect x="186" y="74" width="14" height="9"/><rect x="214" y="74" width="14" height="9"/><rect x="242" y="74" width="14" height="9"/><rect x="270" y="74" width="14" height="9"/></g>
          <text x="150" y="92" text-anchor="middle" font-family="Archivo Black" font-size="12" fill="#141210">N Y C</text>
          <circle cx="74" cy="98" r="17" fill="#141210"/><circle cx="74" cy="98" r="6" fill="#f1ead8"/>
          <circle cx="232" cy="98" r="17" fill="#141210"/><circle cx="232" cy="98" r="6" fill="#f1ead8"/>
        </svg>
      </div>

      <!-- Water tower (NYC rooftop) -->
      <div class="bg-item" data-speed="-0.1" style="top:54rem;right:7%;opacity:.8;--r:3deg;animation:floaty 7s ease-in-out infinite">
        <svg width="96" height="128" viewBox="0 0 90 120">
          <g stroke="#141210" stroke-width="2">
            <path d="M18 42 L72 42 L45 14 Z" fill="#8a5a2a"/>
            <path d="M22 42 L68 42 L62 92 L28 92 Z" fill="#6b4a2a"/>
            <line x1="30" y1="92" x2="24" y2="116"/><line x1="60" y1="92" x2="66" y2="116"/>
            <line x1="22" y1="60" x2="68" y2="60"/>
          </g>
        </svg>
      </div>

      <!-- NY pizza slice -->
      <div class="bg-item" data-speed="0.18" style="top:40rem;left:42%;opacity:.82;--r:-8deg;animation:floaty 6s ease-in-out infinite">
        <svg width="120" height="120" viewBox="0 0 100 100">
          <path d="M50 8 L88 90 L12 90 Z" fill="#c98a3c" stroke="#141210" stroke-width="2"/>
          <path d="M50 16 L80 84 L20 84 Z" fill="#f3c14b"/>
          <circle cx="44" cy="54" r="6" fill="#c4261a"/><circle cx="58" cy="68" r="6" fill="#c4261a"/><circle cx="50" cy="38" r="5" fill="#c4261a"/>
        </svg>
      </div>

      <!-- Everything bagel -->
      <div class="bg-item" data-speed="-0.06" style="top:62rem;left:10%;opacity:.82;--r:6deg;animation:spin-slow 50s linear infinite">
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="#c98a3c" stroke="#141210" stroke-width="3"/>
          <circle cx="50" cy="50" r="14" fill="#f1ead8" stroke="#141210" stroke-width="3"/>
          <g fill="#141210"><ellipse cx="40" cy="24" rx="1.6" ry="3"/><ellipse cx="58" cy="26" rx="1.6" ry="3" transform="rotate(20 58 26)"/><ellipse cx="72" cy="40" rx="1.6" ry="3" transform="rotate(60 72 40)"/><ellipse cx="74" cy="58" rx="1.6" ry="3" transform="rotate(110 74 58)"/><ellipse cx="60" cy="74" rx="1.6" ry="3" transform="rotate(150 60 74)"/><ellipse cx="40" cy="76" rx="1.6" ry="3"/><ellipse cx="26" cy="60" rx="1.6" ry="3" transform="rotate(60 26 60)"/><ellipse cx="26" cy="40" rx="1.6" ry="3" transform="rotate(120 26 40)"/></g>
        </svg>
      </div>

      <!-- Hot dog cart frank -->
      <div class="bg-item" data-speed="0.12" style="top:70rem;left:34%;opacity:.78;--r:10deg">
        <svg width="150" height="80" viewBox="0 0 150 80">
          <rect x="12" y="38" width="126" height="24" rx="12" fill="#e3b063" stroke="#141210" stroke-width="2"/>
          <rect x="6" y="33" width="138" height="15" rx="7.5" fill="#b5402a" stroke="#141210" stroke-width="2"/>
          <path d="M16 40 Q28 32 40 40 T64 40 T88 40 T112 40 T132 40" fill="none" stroke="#f5c518" stroke-width="4" stroke-linecap="round"/>
        </svg>
      </div>

      <!-- Greek deli coffee cup -->
      <div class="bg-item" data-speed="0.16" style="top:38rem;right:18%;opacity:.7;--r:7deg;animation:floaty 5s ease-in-out infinite">
        <svg width="86" height="118" viewBox="0 0 90 120">
          <path fill="#1f4f9c" stroke="#141210" stroke-width="2" d="M12 30 L20 110 Q22 118 30 118 L60 118 Q68 118 70 110 L78 30 Z"/>
          <rect x="10" y="22" width="70" height="12" fill="#f1ead8" stroke="#141210" stroke-width="2"/>
          <ellipse cx="45" cy="28" rx="6" ry="2" fill="#1f4f9c"/>
          <text x="45" y="74" text-anchor="middle" font-family="Archivo Black" font-size="8" fill="#f1ead8">WE ARE HAPPY</text>
          <text x="45" y="88" text-anchor="middle" font-family="Archivo Black" font-size="8" fill="#f1ead8">TO SERVE YOU</text>
        </svg>
      </div>

      <!-- NYC skyline strip (Empire + Chrysler + WTC spires) -->
      <div class="bg-item" data-speed="-0.02" style="bottom:8rem;left:0;right:0;width:100%;opacity:.24">
        <svg viewBox="0 0 1200 150" preserveAspectRatio="none" style="width:100%;height:150px">
          <path fill="#141210" d="M0 150 L0 120 L30 120 L30 90 L70 90 L70 110 L110 110 L110 60 L140 60 L140 110 L180 110 L180 40 L188 40 L188 18 L196 18 L196 40 L210 40 L210 110 L250 110 L250 86 L300 86 L300 30 L306 30 L306 8 L312 8 L312 30 L320 30 L320 110 L360 110 L360 70 L430 70 L430 100 L470 100 L470 50 L478 50 L478 24 L486 24 L486 50 L500 50 L500 100 L560 100 L560 76 L620 76 L620 44 L628 44 L628 100 L700 100 L700 60 L760 60 L760 30 L766 30 L766 10 L772 10 L772 30 L780 30 L780 100 L840 100 L840 78 L900 78 L900 50 L980 50 L980 96 L1040 96 L1040 70 L1110 70 L1110 96 L1160 96 L1160 84 L1200 84 L1200 150 Z"/>
        </svg>
      </div>

      <!-- Stickers / stars -->
      <div class="bg-item" data-speed="0.3" style="top:12rem;left:46%;opacity:.8;animation:floaty 3s ease-in-out infinite">
        <svg width="40" height="40" viewBox="0 0 20 20"><path fill="#f5c518" stroke="#141210" stroke-width="1" d="M10 1 L12 7 L18 7 L13 11 L15 17 L10 13 L5 17 L7 11 L2 7 L8 7 Z"/></svg>
      </div>
      <div class="bg-item" data-speed="-0.25" style="top:30rem;left:62%;opacity:.9;animation:floaty 4s ease-in-out infinite .5s">
        <svg width="28" height="28" viewBox="0 0 20 20"><path fill="#d62419" stroke="#141210" stroke-width="1" d="M10 1 L12 7 L18 7 L13 11 L15 17 L10 13 L5 17 L7 11 L2 7 L8 7 Z"/></svg>
      </div>
      <div class="bg-item" data-speed="0.2" style="top:68rem;left:72%;opacity:.8;animation:floaty 5s ease-in-out infinite 1s">
        <svg width="36" height="36" viewBox="0 0 20 20"><path fill="#f5c518" stroke="#141210" stroke-width="1" d="M10 1 L12 7 L18 7 L13 11 L15 17 L10 13 L5 17 L7 11 L2 7 L8 7 Z"/></svg>
      </div>

    </div>
`;

let html = readFileSync(join(root, 'toronto', 'index.html'), 'utf8');

// 1. Swap the background iconography block (between the comment and the masthead)
const bgStart = html.indexOf('    <!-- BACKGROUND TORONTO ICONOGRAPHY -->');
const mastIdx = html.indexOf('    <!-- MASTHEAD -->');
if (bgStart === -1 || mastIdx === -1) throw new Error('Could not find background/masthead markers');
html = html.slice(0, bgStart) + NYC_BG + '\n' + html.slice(mastIdx);

// 2. Swap the flying CN tower for a flying yellow taxi
const flyStart = html.indexOf('<div class="fly-tower" id="flyTower"');
if (flyStart !== -1) {
  const flyEnd = html.indexOf('</div>', html.indexOf('</svg>', flyStart)) + 6;
  const flyTaxi = `<div class="fly-tower" id="flyTower" aria-hidden="true">
  <svg viewBox="0 0 120 60"><g><rect x="50" y="2" width="16" height="7" fill="#141210"/><path d="M6 36 L18 14 L52 9 L88 14 L112 30 L116 36 L116 50 L6 50 Z" fill="#f5c518" stroke="#141210" stroke-width="3"/><path d="M24 17 L50 12 L50 28 L20 28 Z" fill="#bfe3ee" stroke="#141210" stroke-width="2"/><path d="M54 12 L84 16 L96 28 L54 28 Z" fill="#bfe3ee" stroke="#141210" stroke-width="2"/><g fill="#141210"><rect x="8" y="36" width="9" height="6"/><rect x="26" y="36" width="9" height="6"/><rect x="44" y="36" width="9" height="6"/><rect x="62" y="36" width="9" height="6"/><rect x="80" y="36" width="9" height="6"/><rect x="98" y="36" width="9" height="6"/></g><circle cx="32" cy="50" r="9" fill="#141210"/><circle cx="92" cy="50" r="9" fill="#141210"/></g></svg>
</div>`;
  html = html.slice(0, flyStart) + flyTaxi + html.slice(flyEnd);
}

// 3. Masthead / wordmark text swaps (Toronto → New York). Visual-preview only.
const swaps = [
  ['THE TORONTO FOOD ZINE', 'THE NEW YORK FOOD ZINE'],
  ['TORONTO <span class="and">&amp;</span> EATS', 'NEW YORK <span class="and">&amp;</span> EATS'],
  ['a <u>chaotic</u> love letter to the <u>6ix</u> — in noodles, smoke &amp; skyline.',
   'a <u>chaotic</u> love letter to the <u>five boroughs</u> — in slices, steam &amp; skyline.'],
  ['PRINTED IN KENSINGTON', 'PRINTED IN BROOKLYN'],
  ['CDN $6.66 · 43.6532° N, 79.3832° W', 'USD $6.66 · 40.7128° N, 74.0060° W'],
  ['FIELD GUIDE № 06', 'FIELD GUIDE — NYC EDITION'],
  ['Made in a 4th-floor walk-up in Kensington by editors who have eaten too much and regret nothing.',
   'Made in a 5th-floor walk-up in Brooklyn by editors who have eaten too much and regret nothing.'],
  ['TORONTO · 43.6532°N · 79.3832°W', 'NEW YORK · 40.7128°N · 74.0060°W'],
  ['>eat everything!!<', '>fuhgeddaboudit<'],
];
for (const [a, b] of swaps) html = html.split(a).join(b);

// Tag the body so the IP/theme switch can target it later
html = html.replace('<body>', '<body data-city="new-york">');

writeFileSync(join(root, 'new-york', 'preview.html'), html);
console.log('✅ Wrote new-york/preview.html — open it to see the NYC background.');
