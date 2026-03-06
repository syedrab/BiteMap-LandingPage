# BiteMap Website - Technical Audit Report

**Date**: February 28, 2026
**Site**: https://www.bitemap.fun/

---

## 1. PERFORMANCE

### 1A. Images Massively Oversized (CRITICAL)

Images directory is **64 MB total**. Key offenders actively loaded on the site:

| File | Size | Issue |
|------|------|-------|
| `Map View.png` | **3.7 MB** | Loaded in homepage phone carousel. Should be <50 KB |
| `Home Feed 2.png` | 4.9 MB | Phone screenshot |
| `Home Feed.png` | 4.4 MB | Used in feature-graphic.html |
| `Profile View.png` | 4.3 MB | Phone screenshot |
| `Discover.png` | 2.1 MB | Phone screenshot |
| `Alfred AI.png` | 1.4 MB | Phone screenshot |
| All `*_full.png` files | ~12 MB | High-res sources, only .jpg versions used |
| `images/Archieve/` | 14 MB | Old screenshots, not referenced anywhere |
| `Screenshot 2025-08-12*.png` (2) | 4.5 MB | Developer screenshots, should be deleted |

**Total removable: ~48 MB out of 64 MB**

**Fix**: Convert `Map View.png` to compressed JPEG/WebP at ~300px width (~50 KB). Delete unused source files.

### 1B. Render-Blocking Google Fonts (MEDIUM)

Homepage loads 5 font families (22 weight files): Space Grotesk, Fredoka, Nunito, Quicksand, Baloo 2. Only Space Grotesk and Baloo 2 are used.

**Fix**: Remove Fredoka, Nunito, Quicksand.

### 1C. All CSS/JS Inlined in Homepage (LOW)

1,614-line HTML file with all styles/scripts inline. Zero caching benefit. The external `css/styles.css` is not referenced by `index.html` at all.

### 1D. No Lazy Loading on Images (LOW)

Landmark images all load eagerly. Only above-fold images need eager loading.

**Fix**: Add `loading="lazy"` to landmark images.

---

## 2. SECURITY

### 2A. XSS Vulnerability in video-preview.js (CRITICAL)

Database values (creatorName, placeName) are interpolated directly into HTML with **zero escaping**:

```javascript
<title>${title}</title>
<meta property="og:title" content="${title}">
```

If a creator name contains `"` or `<script>`, it executes arbitrary JavaScript.

**Fix**: Add and apply `escapeHtml()`:
```javascript
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### 2B. test-email.js Exposes Infrastructure Details (MEDIUM)

Committed to repo, exposes SMTP host (`smtp-mail.outlook.com`), email address (`mohib.rab@bitemap.fun`), placeholder password field.

**Fix**: Delete `test-email.js` from repo.

### 2C. Missing Security Headers in vercel.json (MEDIUM)

Current: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection (deprecated)

**Missing**:
- `Content-Security-Policy`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (restrict camera, mic, geolocation)

### 2D. TLS Config Weakness in API (LOW)

Both `contact.js` and `subscribe.js` have:
```javascript
tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
```

`rejectUnauthorized: false` disables cert validation (MITM risk). `SSLv3` is outdated.

### 2E. No CSRF Protection on Form Endpoints (LOW)

`/api/subscribe` and `/api/contact` have no CSRF tokens, rate limiting, or origin checking.

---

## 3. BROKEN FUNCTIONALITY

### 3A. Missing og-image.jpg (BROKEN)

`index.html` and all pages reference `https://www.bitemap.fun/images/og-image.jpg` for social previews. **This file does not exist.** Social shares show no image.

**Fix**: Create `og-image.jpg` (1200x630px) and place in `images/`.

### 3B. contact.js Silently Succeeds on Failure (MEDIUM)

When email sending fails, returns `200 success: true`. User thinks message sent, but it's only in Vercel logs.

### 3C. subscribe.js Returns 500 with Technical Details (MEDIUM)

Returns `"SMTP credentials missing"` error to end user. Inconsistent with contact.js behavior.

### 3D. Stale URLs in Email Templates (LOW)

- `contact.js` links to `https://bitemap.app/support.html` - domain is `bitemap.fun`
- Copyright in email templates says 2024

---

## 4. VERCEL CONFIG

- Rewrite for `/v/:code` to `/api/video-preview` is correct
- Image cache headers (1 year immutable) set correctly
- **Missing**: www to non-www redirect (or vice versa)
- **Missing**: Security headers (see 2C)

---

## 5. DEPENDENCIES

```json
{
  "nodemailer": "^7.0.6",
  "@supabase/supabase-js": "^2.39.0",
  "nanoid": "^5.0.4"
}
```

- Dependencies are relatively current
- `package.json` references non-existent `"main": "index.js"`
- `backfill_shareable_codes.js` is a one-time script that shouldn't be deployed
- `nanoid` only used in backfill script, not APIs

---

## 6. ACCESSIBILITY

### 6A. No ARIA Labels on Interactive Elements (MEDIUM)
- Mobile menu button: no `aria-label`, `aria-expanded`, `aria-controls`
- Android modal: no `aria-modal`, `role="dialog"`, `aria-labelledby`
- Close button: no `aria-label="Close"`

### 6B. Missing Skip-to-Content Link (LOW)
### 6C. Keyboard Trap in Mobile Menu (LOW)
- No focus trapping, no Escape key handler
### 6D. All Images Have Alt Text (GOOD)
### 6E. Footer Hidden on Mobile (LOW)
- Privacy/terms/support links only accessible via hamburger menu

---

## 7. CODE QUALITY & DEAD CODE

### 7A. Old HTML Files Publicly Accessible (MEDIUM)

These are accessible by direct URL even though robots.txt blocks some:
- `index-original.html`, `index-v2.html`, `index2.html`, `index3.html`
- `pitch.html`, `partner-pitch.html`, `consumer-pitch.html`
- `feature-graphic.html`

**Fix**: Delete or add Vercel rewrites to 404 them.

### 7B. css/styles.css Completely Unused by index.html (LOW)

1,266 lines from old dark-theme design. Dead code. (Still used by sub-pages though.)

### 7C. .DS_Store Files Tracked in Git (LOW)

### 7D. Hardcoded Supabase URL in video-preview.js (LOW)

`https://lqslpgiibpcvknfehdlr.supabase.co` - should be env var.

---

## 8. IMAGES - WHAT TO KEEP vs DELETE

### Keep (actively used):
- `bitemap-logo.png` (244 KB) - Logo
- `screenshot.jpg`, `screenshot1.jpg` (~500 KB) - Phone carousel
- `Map View.png` (3.7 MB) - **Needs compression to ~50 KB**
- All `.jpg` landmark files (~400 KB total) - Toronto grid
- `streetcar.jpg` (45 KB) - Animation
- `Home Feed.png`, `Home Feed 2.png` - Used by feature-graphic.html

### Can Delete (~48 MB):
- All `*_full.png` files (~12 MB) - High-res sources, .jpg versions used
- `images/Archieve/` (14 MB) - Typo folder, not referenced
- `Screenshot 2025-08-12*.png` (4.5 MB) - Dev screenshots
- Duplicate `.png` files where `.jpg` exists
- `bitemap_logo_clear.png` (1.2 MB) - Not referenced
- `bitemap-mouth-logo.png` (1.2 MB) - Not referenced
- `bitemap-logo-transparent.png` (244 KB) - Not referenced

---

## PRIORITY FIXES

### Critical (fix immediately):
1. **XSS in video-preview.js** - Add HTML escaping
2. **Missing og-image.jpg** - Create and deploy
3. **Map View.png is 3.7 MB** - Compress to ~50 KB

### High (fix soon):
4. Add missing security headers to vercel.json
5. Delete test-email.js from repo
6. Remove unused font families
7. Fix stale URLs in email templates (bitemap.app -> bitemap.fun)

### Medium (schedule for cleanup):
8. Remove/restrict old HTML files
9. Fix SMTP TLS config
10. Add ARIA labels to interactive elements
11. Make contact.js error handling consistent

### Low (nice to have):
12. Clean up images directory (~48 MB)
13. Add `loading="lazy"` to landmark images
14. Delete `.DS_Store` from git
15. Remove dead css/styles.css reference
16. Fix `"main": "index.js"` in package.json
