# GameDay Template

4-slide sports game day carousel — teams, watch location, featured restaurant, and CTA.

## Quick Start

```bash
cd templates/gameday
./export.sh
open out/
```

This generates `slide_01.png`, `slide_02.png`, `slide_03.png`, `slide_04.png`.

---

## Customization

Edit `preview.html` to change:

### Theme Colors
At the top of `<style>`:
```css
--team-1-color: #CE1141;    /* Home team primary (e.g., Raptors red) */
--team-2-color: #6F2DA8;    /* Away team color (e.g., Cavs purple) */
--accent: #FFFFFF;          /* Text accent (usually white) */
```

### Slide 1: Game Hero
- Team logos (replace `🏀` emoji with actual logo images)
- Team names: `RAPTORS vs CAVS`
- Time: `7:30 PM`
- Venue: `SCOTIABANK ARENA`
- Watch location: `JURASSIC PARK` (or any outdoor/indoor watch venue)

### Slide 2: Where to Eat
- Restaurant image (replace Unsplash placeholder)
- Restaurant name: `Raptor Real Sports Bar`
- Location: `DOWNTOWN TORONTO`
- Distance: `WALKING DISTANCE` (or actual distance from venue)
- Signature items/bullets: `WINGS`, `NACHOS`, `CRAFT BEER`

### Slide 3: Game Vibes
- Crowd/energy image (packed bar or cheering crowd)
- Headline: `BRING THE ENERGY`
- Tagline: `PACKED HOUSE / LIVE · LOUD`
- CTA: `ARRIVE 2H EARLY` (or timing recommendation)

### Slide 4: CTA
- Headline: `FOUND THE SPOT` (fixed)
- Tagline: `Real places. Real game day.` (fixed)
- App badges (static)

---

## Specs

- **Format:** 4-slide carousel (3 content + 1 CTA)
- **Dimensions:** 1080x1350 (Instagram carousel ratio)
- **Fonts:** Bebas Neue (display), Montserrat (body)
- **Aesthetic:** High-energy sports hype with arena atmosphere

---

## Usage in Pipeline

1. Create post folder:
   ```
   posts/raptors_cavs_gameday_2026/
   ├── manifest.json
   └── caption.txt
   ```

2. In `manifest.json`:
   ```json
   {
     "template": "gameday",
     "team1": "RAPTORS",
     "team2": "CAVS",
     "time": "7:30 PM",
     "venue": "SCOTIABANK ARENA",
     "watchLocation": "JURASSIC PARK",
     "restaurantName": "Raptor Real Sports Bar & Grill",
     "restaurantMeta": "DOWNTOWN TORONTO · WALKING DISTANCE",
     "restaurantBullets": ["WINGS", "NACHOS", "CRAFT BEER"],
     "restaurantImageUrl": "https://..."
   }
   ```

3. Render:
   ```bash
   npx tsx src/render-post.ts posts/raptors_cavs_gameday_2026 gameday
   ```

---

## Notes

- Team logos can be actual PNG files or high-contrast badge images
- Restaurant image should be a high-quality food or bar photo (min 1080px wide)
- Watch location is the unique hook — "Jurassic Park" for Toronto, outdoor squares for other cities
- Crowd image should convey energy — packed stands, cheering, hands up
- Use real game times and verified venue names
- Restaurant must be real and walkable from the venue

---

## Localization

For other markets, swap:
- Team colors (theme variables)
- Team names and logos
- Venue name and city
- Watch location (outdoor viewing area or stadium section)
- Restaurant (local sports bar or game-day dining hotspot)
- Bullets/signature items (market-specific menu)
