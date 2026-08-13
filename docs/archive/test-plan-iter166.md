# R166: PWA installable icons (production worker 2a7ce1bd)

Against https://shelfmark.wookat520.workers.dev. Code refs: public/manifest.json (icons: /icon-192.png 192x192 any, /icon-512.png 512x512 any, /icon-maskable-512.png 512x512 maskable, /favicon.svg any; 3 shortcuts each with 192 icon), public/_headers L10-15 (Cache-Control public,max-age=86400 on all 3 PNGs), local PNGs verified 192/512/512 RGBA. Maskable spec: icon at 80% on full-bleed #1a1916 square (safe zone = inner 80% circle).

## T1. Asset probes (HTTP)
- GET each of /icon-192.png, /icon-512.png, /icon-maskable-512.png: 200, Content-Type image/png, Cache-Control contains max-age=86400; downloaded bytes decode as PNG with exact dims 192x192 / 512x512 / 512x512.
- /manifest.json: 200, JSON parses, icons array has the 4 entries above with correct sizes/purpose; shortcuts each have a 192 icon entry.

## T2. Chrome installability (CDP)
- Load https://shelfmark.wookat520.workers.dev/ in Chromium; CDP `Page.getAppManifest` → parses, url correct, no manifest parse errors; CDP `Page.getInstallabilityErrors` → expect empty list (or only the "no service worker / not from installed source" class errors that are unrelated to icons — record verbatim; pass = zero icon/manifest-related errors like "no acceptable icon"). Old behavior (SVG-only) produced "Downloaded icon was empty or corrupted / no supplied icon is at least 144px square in PNG format" — must be absent.

## T3. Maskable safe-zone visual
- Compose maskable-512 with a circular mask (simulate Android round mask) and screenshot review: full-bleed #1a1916 background reaches the circle edge (no transparent corners visible), glyph fully inside inner 80% circle (pixel-check: no non-background pixels outside r=0.4*512 of center). Side-by-side image of icon-512 vs icon-maskable-512 vs circle-masked version.

## T4. Regression on home
- Fresh load of /: `link[rel=manifest][href="/manifest.json"]` present; zero console errors/pageerrors; favicon still loads (200).

Pass = exact values above; any installability error mentioning icons = fail.
