## ✅ R138 self-hosted fonts + CSP tighten — live QA all green (worker 9691d0c3)

Tested on production https://shelfmark.zalize.com in fresh incognito contexts with cache-busted URLs (recorded in Devin session).

**🟢 Fonts really render self-hosted:** on /, /series/mistborn and /book/134080…, `document.fonts.check` passes for Fraunces 700 + Inter 400, all used faces report `loaded`, and an adversarial metric test shows Fraunces ≠ Georgia (367 vs 325px) and Inter ≠ Arial (366 vs 354px) — not fallback rendering. Hero italic "right order" renders in Fraunces italic:

| 🟢 Hero (Fraunces + italic, Inter body) | 🟢 Book page (fonts + sections normal) |
|---|---|
| ![hero](/home/ubuntu/screenshots/ss_zoom_746d7190.png) | ![book](/home/ubuntu/screenshots/ss_0936e0c0.png) |

**🟢 Zero third-party:** full network capture shows **no fonts.googleapis/gstatic requests** on any page — woff2 comes same-origin; console has zero CSP violations under the tightened `style-src 'self' 'unsafe-inline'; font-src 'self'`. All 3 woff2 return 200 `font/woff2` with `cache-control: public, max-age=31536000, immutable`, sizes matching the commit exactly.

**🟢 Baselines:** no 375px overflow on / + series; axe 4.10.2 **0 violations** light+dark (4 runs); TTFB 0.24–0.28s, lab LCP 305ms, CLS 0.0013 — no CWV regression.

ℹ️ Note: `fraunces-italic-latin.woff2` loads lazily only where italics are used (homepage hero) — expected, since only the two roman faces are preloaded.
