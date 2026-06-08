# BiteMap — App Store Reviews Playbook

The local-SEO masterclass spends a third of its runtime on Google reviews: get to a
threshold, then keep a steady *velocity*, and gate so unhappy customers vent privately
instead of on your public listing. BiteMap has no Google Business Profile — but the App
Store works on the exact same psychology. This is that strategy, adapted.

> **Scope:** this is a strategy doc for the iOS app + growth. No code in *this* repo (the
> landing site) implements it. The "where it lives" notes point at the app codebase.

---

## Why it matters (same logic as the video)
- **Rating is the first thing a user sees**, and it gates install conversion. A 4.7–4.9 with
  hundreds of ratings out-converts a suspicious 5.0 with 12. Aim for the believable band.
- **Velocity is a ranking + trust signal.** A burst of reviews once, then silence, reads as
  "dead app." Apple's algorithms and users both reward a steady drip.
- **A bad public review is expensive for years.** Better to catch the unhappy user privately,
  fix it, and route only the happy ones to the store.

## Targets
| Metric | Goal |
|---|---|
| First threshold | 10+ ratings before worrying about anything else |
| Believable rating band | 4.6 – 4.9 (not a sterile 5.0) |
| Velocity | ~8+ fresh ratings / month, steady — not one big spike |
| Prompt cap | Apple allows the native prompt **3× per 365 days per user** — spend them well |

---

## The mechanism (the "review gate", adapted to iOS)

Apple forbids a homegrown "rate us" dialog that pushes to the store, and forbids gating the
*native* prompt on sentiment. So the compliant pattern is two separate flows:

1. **Soft sentiment check, in-app, first.** A friendly "Enjoying BiteMap?" / "How's it going?"
   moment (your own UI, not Apple's).
   - **Happy →** trigger Apple's native `SKStoreReviewController.requestReview()` (iOS 14+:
     `requestReview(in:)`). Apple decides whether to actually show it; never deep-link to the
     write-review page off the back of a sentiment gate.
   - **Unhappy →** open an in-app feedback form / mailto / support route. This is the
     "send it to Slack/support, not the store" move from the video — handle it privately,
     offer to make it right.
   - *Where it lives:* a `ReviewPromptManager` invoked from the SwiftUI flow described in the
     app's `CLAUDE.md` (MVVM + `AuthManager.shared`-style singletons).

2. **Ask at peak delight, not at launch.** Trigger the sentiment check right after a *win*,
   never on cold start or mid-task:
   - saved their 5th spot, or
   - actually visited a place they found here (a "been there" / check-in), or
   - shared a video, or finished onboarding with > N spots saved.
   Gate on `hasCompletedKeyAction && daysSinceInstall >= 3 && promptsThisYear < 3`.

3. **Respect the budget.** Track prompt count locally; never burn a prompt on a user who just
   rage-tapped. One genuine ask beats three annoying ones.

---

## Velocity engine (keep them coming)
- **Drip, don't dump.** Roll the prompt out to a slice of eligible users continuously rather
  than blasting your whole base in one push — keeps the monthly count steady.
- **Tie asks to your content cadence.** New city / new "Friday drop" → in-app "what's new" →
  natural delight moment → eligible users see the sentiment check.
- **Reply to reviews in App Store Connect.** Apple lets you respond. Reply to the good ones
  briefly and to the critical ones with care (never auto-generated — an AI reply to a furious
  1-star can make it worse, exactly as the video warns). This bumps perceived responsiveness.
- **Lifecycle nudges** (email/push) can *invite* feedback, but must route through the in-app
  sentiment check — they can't link straight to the write-review URL as a reward.

## On the web side (what this repo can do)
- The landing site already advertises ratings via `MobileApplication` + `AggregateRating`
  JSON-LD (now standardized across city hubs via `scripts/lib/seo.js → appReviewJsonLd()`).
  **Keep `ratingValue` / `ratingCount` honest and roughly in sync with the real App Store
  numbers** — schema that contradicts the visible store rating is a manual-action risk.
- A `features/no-fake-reviews` page already exists — link App Store proof there.

## Compliance guardrails (don't get the app rejected)
- ✅ Use `SKStoreReviewController` for the store prompt. ❌ Don't build a custom star dialog
  that writes to the store.
- ❌ Don't condition Apple's native prompt on a high rating, offer rewards for reviews, or
  tell users what score to leave. The sentiment check decides *whether to ask*, not *what to say*.
- ✅ Keep the JSON-LD `aggregateRating` truthful.
