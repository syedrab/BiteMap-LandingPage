export default function handler(req, res) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.bitemap.fun/</loc>
    <lastmod>2026-02-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.bitemap.fun/privacy</loc>
    <lastmod>2026-02-09</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.bitemap.fun/terms</loc>
    <lastmod>2026-02-09</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.bitemap.fun/support</loc>
    <lastmod>2026-02-09</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.bitemap.fun/legal</loc>
    <lastmod>2026-02-09</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.bitemap.fun/blog</loc>
    <lastmod>2026-02-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.bitemap.fun/blog/why-were-building-bitemap</loc>
    <lastmod>2026-02-09</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.bitemap.fun/blog/how-bitemap-works</loc>
    <lastmod>2026-02-09</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.bitemap.fun/blog/tiktok-to-table</loc>
    <lastmod>2026-02-09</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(sitemap);
}
