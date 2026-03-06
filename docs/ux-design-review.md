# BiteMap Website - UX & Design Review

**Date**: February 28, 2026
**Site**: https://www.bitemap.fun/

---

## Executive Summary

The homepage has a unique Toronto street-grid concept but is a single non-scrollable viewport missing nearly all conversion-critical elements. Secondary pages are clean but have navigation inconsistencies and outdated content. The net effect is a creative homepage that fails to convert visitors.

---

## HIGH IMPACT Issues

### 1. Homepage Missing Most Conversion Sections

The homepage has `overflow: hidden` making it a single non-scrollable viewport containing only:
- Logo + tagline + subtitle
- Phone mockup
- Download button

**Missing**: Features/benefits, social proof, testimonials, how it works, FAQ, final CTA.

**Recommendation**: Make the page scrollable and add: "How it works" section, features grid, social proof stats, and final CTA. Keep Toronto grid for hero viewport.

### 2. Outdated "Coming Soon" / "Waitlist" Language

The app is **live on the App Store** but multiple pages still say upcoming:

- `support.html`: "iOS App (Coming Soon)" with "In Development" badge
- `support.html` FAQ: "BiteMap is launching soon on iOS! Join our waitlist..."
- `support.html`: "Waitlist Registration - Operational"
- Blog posts: "We're launching on iOS in the coming months"
- Blog CTAs: "Want early access? Join our waitlist"

**Recommendation**: Update all pages to reflect app is live. Replace waitlist with App Store links.

### 3. Placeholder Text in Privacy & Terms

Both `privacy.html` and `terms.html` contain:
```
BiteMap
[Your Company Address]
[City, State, ZIP]
```

Also: Jurisdictional conflict - legal page says Ontario/Canada, privacy and terms say United States.

**Recommendation**: Fill in actual address or remove. Fix jurisdiction consistency.

### 4. No Social Proof on Homepage

Zero trust signals anywhere:
- No download count
- No App Store rating
- No user testimonials
- No "As featured in" logos
- No creator/video count

**Recommendation**: Add stats like "500+ food videos", "50+ food creators", or App Store rating.

### 5. Blog Post CTA Forms Non-Functional

Blog posts have "Join Waitlist" email forms but app is already live. Forms may reference non-existent `/js/app.js`.

**Recommendation**: Replace with direct App Store download links.

### 6. Navigation Inconsistency Across Pages

| Page | Nav links |
|------|-----------|
| index.html | (mobile menu: Privacy, Terms, Support, Download) |
| privacy.html | Support, Blog, Download |
| terms.html | Support, Blog, Download |
| support.html | Privacy, Blog, Download |
| blog/index.html | Support, Download |
| blog articles | Blog, Support, Download |

No visible desktop navigation on homepage (only mobile hamburger + footer).

**Recommendation**: Standardize navbar across all pages (Home, Blog, Support, Download App).

---

## MEDIUM IMPACT Issues

### 7. Footer Link Format Inconsistency

Some pages use `/privacy`, others use `/privacy.html`. Needs standardization.

### 8. Blog Posts All Dated Oct 2024

Three blog posts are over a year old with no new content. Makes product look stagnant.

**Recommendation**: Add new content or remove dates to appear evergreen.

### 9. Homepage Loads 5 Fonts, Uses 2

Fredoka, Nunito, Quicksand are loaded but never used. Adds ~100KB+ unnecessary weight.

### 10. Copyright Year Inconsistency

- `legal.html` body: "(c) 2024"
- All footers: "(c) 2026"

### 11. Homepage `overflow: hidden` Breaks Scrolling

- No footer visible on mobile (explicitly hidden)
- No legal links accessible on mobile except hamburger menu
- Users on short screens might not see download button

### 12. Support/Delete-Account Forms Post to `/api/contact`

Need to verify this endpoint works. Critical for Apple's account deletion requirement.

### 13. No Mobile Hamburger Menu on Secondary Pages

On mobile (<=1024px), nav links are hidden except "Download App" button. No hamburger menu exists on secondary pages.

### 14. Homepage Subtitle Hidden on Mobile

The core value prop "Discover restaurants through TikTok-style video reviews..." is `display: none` on mobile.

**Recommendation**: Show at least a shorter version on mobile.

---

## LOW IMPACT Issues

### 15. CSS styles.css Designed for Dark Theme But Overridden to Light on Every Page
### 16. styles.css Contains Styles for Sections That Don't Exist (.creators-section, .vendors-section, etc.)
### 17. Blog Articles Have No Featured Images
### 18. Twitter Meta Tags Use `property` Instead of `name`
### 19. App Store Link Inconsistency (US vs CA)
### 20. "Note for App Store Review" Visible to All Users in Privacy Page
### 21. `user-select: none` on Homepage Prevents Text Selection (Hostile UX)

---

## Missing Pages / Features

1. **About / Team page** - Builds trust for community-driven app
2. **Features page** - Dedicated page explaining how BiteMap works
3. **For Creators page** - Targeting food creators for supply-side growth
4. **Google Play badge** - Even as "Coming Soon"
5. **Cookie consent banner** - Required if using Google Analytics (GDPR)
6. **Custom 404 page**

---

## Priority Summary

### Fix immediately (high impact, low effort):
1. Remove placeholder `[Your Company Address]`
2. Update "Coming Soon" / waitlist language
3. Remove "For App Store Review" note from privacy page
4. Fix App Store link consistency
5. Remove unused font imports

### Fix soon (high impact, medium effort):
6. Add scrollable content below hero (features, social proof, final CTA)
7. Standardize navigation across all pages
8. Standardize footer link formats
9. Verify `/api/contact` endpoint works
10. Show value proposition on mobile

### Plan for (medium impact, higher effort):
11. Add social proof / trust signals
12. Create "How it works" section
13. Update blog with fresh content
14. Add structured data
15. Build "For Creators" landing page
