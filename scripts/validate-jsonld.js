/**
 * Validate JSON-LD + SEO blocks across all generated zine pages.
 * Usage: node scripts/validate-jsonld.js
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cityDirs = ['toronto', 'los-angeles', 'vancouver', 'new-york', 'dallas', 'houston'];

let pages = 0, ldOk = 0, ldBad = 0, ldMissing = 0;
const issues = [];
const warnings = [];

for (const d of cityDirs) {
  const dir = join(root, d);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter(f => f.endsWith('.html'))) {
    pages++;
    const path = join(dir, f);
    const h = readFileSync(path, 'utf8');
    const blocks = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    if (!blocks.length) { ldMissing++; issues.push(`NO JSON-LD: ${d}/${f}`); }
    let good = true;
    blocks.forEach(b => { try { JSON.parse(b[1]); } catch (e) { good = false; issues.push(`INVALID JSON-LD: ${d}/${f} — ${e.message}`); } });
    if (blocks.length) (good ? ldOk++ : ldBad++);
    // internal-link density (advisory; skip hubs). Count the hub backlink too (href="/city").
    if (f !== 'index.html') {
      const links = new Set([...h.matchAll(new RegExp(`href="/${d}(/[^"]*)?"`, 'g'))].map(m => m[0]));
      if (links.size < 4) warnings.push(`Thin internal links (${links.size}, expected ~8–12): ${d}/${f}`);
    }
  }
}

console.log(`Pages scanned: ${pages}`);
console.log(`JSON-LD: ${ldOk} valid, ${ldBad} invalid, ${ldMissing} missing`);
if (warnings.length) {
  console.log(`\nWARNINGS (advisory — usually single-article cities with no siblings yet):`);
  warnings.forEach(w => console.log('  ' + w));
}
// JSON-LD validity is the hard gate; link density is advisory and never fails the build.
if (issues.length) { console.log('\nERRORS:'); issues.forEach(i => console.log('  ' + i)); process.exit(1); }
console.log('\n✅ All zine pages have valid structured data.');
