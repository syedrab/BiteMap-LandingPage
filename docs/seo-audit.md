# BiteMap Website - SEO Audit Report

**Date**: February 28, 2026
**Site**: https://www.bitemap.fun/

---

## Executive Summary

Overall health: **6/10** - Good basic meta tags on most pages, but gaps in structured data, link consistency, and technical polish.

---

## CRITICAL Issues

### 1. Missing Twitter Card Meta Tags on Homepage

The homepage has Open Graph tags but zero Twitter Card meta tags. Shared links on X/Twitter render as plain text.

**Fix**: Add to `index.html` `<head>`:
```html
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://www.bitemap.fun/">
<meta property="twitter:title" content="BiteMap - Real Food, Real Reviews">
<meta property="twitter:description" content="Discover restaurants through TikTok-style video reviews from local food creators.">
<meta property="twitter:image" content="https://www.bitemap.fun/images/og-image.jpg">
```

### 2. Missing OG + Twitter Tags on Privacy, Terms, Legal Pages

`privacy.html`, `terms.html`, `legal.html` have no Open Graph or Twitter Card meta tags.

**Fix**: Add full OG + Twitter Card tag blocks following the pattern in `support.html`.

### 3. No Structured Data (JSON-LD) on Homepage or Most Pages

Only the 3 blog posts have structured data. Missing from: homepage, blog index, privacy, terms, support, legal, delete-account.

**Fix - Homepage**: Add `Organization` + `WebSite` schema:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "BiteMap",
  "url": "https://www.bitemap.fun/",
  "description": "Discover restaurants through TikTok-style video reviews from local food creators.",
  "publisher": {
    "@type": "Organization",
    "name": "BiteMap",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.bitemap.fun/images/bitemap-logo.png"
    }
  }
}
</script>
```

**Fix - Support Page**: Add `FAQPage` schema with all 10 Q&A items (high-value rich result opportunity).

### 4. Placeholder Address in Privacy & Terms

Both pages contain `[Your Company Address]` and `[City, State, ZIP]`.

**Fix**: Replace with actual address or remove mailing address section entirely.

---

## IMPORTANT Issues

### 5. Inconsistent Internal Link Formats (.html vs no extension)

- Homepage footer: `/privacy`, `/terms`, `/support` (no .html)
- Terms/support/legal/blog footers: `/privacy.html`, `/terms.html` (WITH .html)
- Canonical URLs and sitemap use no extension

**Fix**: Standardize ALL internal links to no-`.html` format matching canonical URLs.

### 6. Homepage Missing `<nav>` Semantic Element

The homepage has no `<nav>` tag. All other pages use `<nav class="navbar">`.

**Fix**: Wrap homepage navigation in a `<nav>` element.

### 7. Homepage `overflow: hidden` May Hide Content from Crawlers

`html, body { overflow: hidden; }` prevents native scrolling. Content below the fold may not be indexed.

**Fix**: Test with Google Search Console URL Inspection tool.

### 8. Homepage Loads 5 Font Families (Only 2 Used)

Loads Space Grotesk, Fredoka, Nunito, Quicksand, Baloo 2 - only Space Grotesk and Baloo 2 are used.

**Fix**: Remove Fredoka, Nunito, Quicksand.

### 9. Missing `rel="noopener"` on Homepage Mobile Menu Link

The App Store link in mobile menu is missing `rel="noopener"`.

### 10. Blog Internal Links Use .html but Canonicals Don't

Blog index links to `/blog/why-were-building-bitemap.html` but canonical says `/blog/why-were-building-bitemap`.

**Fix**: Change all blog links to match canonical URLs (no .html).

### 11. Support Page FAQ Not Machine-Readable

10 FAQ items exist but no `FAQPage` structured data.

**Fix**: Add FAQPage JSON-LD schema.

### 12. Support Page Has Outdated Content

Still says "iOS App (Coming Soon)", "Waitlist Registration", "BiteMap is launching soon."

**Fix**: Update to reflect app is live.

---

## NICE-TO-HAVE

### 13. No `hreflang` Tags
### 14. Inconsistent App Store Links (US vs CA)
### 15. Blog Posts Missing `mainEntityOfPage` in JSON-LD
### 16. Copyright 2024 in Legal Page Body (Footer Says 2026)
### 17. Blog Waitlist Forms Non-Functional (App Is Live)
### 18. `meta name="keywords"` Tags (Google Ignores Since 2009)
### 19. Image Filenames Could Be More Descriptive (`Map View.png` has space)

---

## Page-by-Page Meta Tag Summary

| Page | Title | Description | Canonical | OG | Twitter | JSON-LD | H1 |
|------|-------|-------------|-----------|-----|---------|---------|-----|
| index.html | Yes | Yes | Yes | Yes | **MISSING** | **MISSING** | Yes |
| privacy.html | Yes | Yes | Yes | **MISSING** | **MISSING** | **MISSING** | Yes |
| terms.html | Yes | Yes | Yes | **MISSING** | **MISSING** | **MISSING** | Yes |
| support.html | Yes | Yes | Yes | Yes | Yes | **MISSING** | Yes |
| legal.html | Yes | Yes | Yes | **MISSING** | **MISSING** | **MISSING** | Yes |
| delete-account.html | Yes | Yes | Yes | Yes | Yes | **MISSING** | Yes |
| blog/index.html | Yes | Yes | Yes | Yes | Yes | **MISSING** | Yes |
| blog articles (x3) | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

---

## Sitemap & Robots.txt

Both are properly configured. Sitemap lists all 10 public pages. Robots.txt blocks draft/old pages and references sitemap. AI crawlers explicitly allowed.

---

## Prioritized Action Plan

### Tier 1: Critical (this week)
1. Add Twitter Card meta tags to `index.html`
2. Add OG + Twitter Card tags to privacy, terms, legal
3. Add Organization/WebSite JSON-LD to homepage
4. Replace placeholder address text

### Tier 2: High-Impact (within 2 weeks)
5. Standardize all internal links to no-.html format
6. Add FAQPage structured data to support page
7. Add `<nav>` semantic element to homepage
8. Update outdated "coming soon" / "waitlist" content
9. Remove unused font families from homepage

### Tier 3: Quick Wins
10. Fix `rel="noopener"` on homepage mobile menu link
11. Standardize App Store link regions
12. Update copyright year on legal page body
13. Add `mainEntityOfPage` to blog JSON-LD
14. Rename `Map View.png` to eliminate space
