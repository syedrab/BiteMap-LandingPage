# City landing theme configs

Each `<slug>.json` drives `scripts/build-city-landing.js <slug>`, which clones the
Toronto master (`index.html`) into `index-<slug>.html` with that city's streets,
landmarks, moving vehicle, and creator pins. `middleware.js` then serves it to
that city's IP-geolocated visitors.

**`nyc.json` is the canonical worked example. Copy its exact shape.**

## Required schema

```jsonc
{
  "slug": "sf",                 // matches filename + ?city=sf + index-sf.html
  "name": "San Francisco",
  "marker": "SF",               // 2-4 chars; rendered in the dashed map-marker circle
  "metaTitle": "BiteMap San Francisco - Best Restaurants Near You | Video Reviews (Preview)",
  "vehicle": { "height": 44, "svg": "<svg viewBox=\"0 0 300 130\">…</svg>" },
  "streets": {
    "horizontal": {   // EXACTLY these 9 Toronto keys → real city E-W streets
      "Eglinton Ave": "…", "St Clair Ave": "…", "Bloor St": "…",
      "Danforth Ave": "…", "Dundas St": "…", "Queen St": "…",
      "King St": "…", "Front St": "…", "Lakeshore Blvd": "…"
    },
    "vertical": {     // EXACTLY these 9 Toronto keys → real city N-S streets
      "Bathurst St": "…", "Spadina Ave": "…", "University Ave": "…",
      "Bay St": "…", "Yonge St": "…", "Church St": "…",
      "Jarvis St": "…", "Parliament St": "…", "Broadview Ave": "…"
    }
  },
  "landmarks": {
    "cntower":      { "label": "…", "svg": "…" },
    "casaloma":     { "label": "…", "svg": "…" },
    "stlawrence":   { "label": "…", "svg": "…" },
    "bmofield":     { "label": "…", "svg": "…" },
    "ROM":          { "label": "…", "svg": "…" },
    "donvalley":    { "svg": "…" },
    "harbourfront": { "svg": "…" },
    "dundassq":     { "svg": "…" }
  }
}
```

The Toronto "sign" landmark is auto-generated from `marker` — do NOT include it.

## Landmark slots — pick a city landmark whose SHAPE fits each slot

Keep the `class="…-img"` and a `style="width:NNpx"` on each SVG root (widths below).
Silhouette fill `#141210`; windows/highlights `#fff` at low opacity; accents may use
`#d62419` (red), `#f5c518` (yellow), `#7bb661` (green). Match nyc.json's drawing style.

| slot | shape it must be | width | label? | NYC used |
|------|------------------|-------|--------|----------|
| `cntower`      | TALL slim tower        | ~48px  | yes | Empire State |
| `casaloma`     | medium building / park | ~84px  | yes | Central Park |
| `stlawrence`   | medium hall/market     | ~104px | yes | Grand Central |
| `bmofield`     | wide stadium/arena oval| ~104px | yes | Madison Sq Garden |
| `ROM`          | medium museum/building | ~92px  | yes | The Met |
| `donvalley`    | WIDE horizontal bridge/skyline | ~190px | no | Brooklyn Bridge |
| `harbourfront` | TALL narrow monument   | ~42px  | no | Statue of Liberty |
| `dundassq`     | small transit roundel/circle | ~46px | no | subway bullet |

## Streets

Use real, recognizable arterials. `horizontal` = E-W streets ordered outer→…→outer
(top of map to bottom). `vertical` = N-S streets ordered W→E; the last one
(`Broadview Ave` slot) is the far edge — a waterfront/boundary name reads well there.

## Vehicle

A city-iconic moving vehicle, drawn side-on like nyc.json's checker cab. Keep it in a
~300×130 viewBox with a ~44px render height so it sits on the streets. Cable car, L
train, pickup, convertible, trolley, ferry, monorail, etc.

## Validate before returning

Run `node scripts/build-city-landing.js <slug>` — it must print ✅ with no error.
