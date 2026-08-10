# Shelfmark Rounds 81–85 — live production QA report

**Target:** https://shelfmark.zalize.com (direct origin https://shelfmark.wookat520.workers.dev for cache-sensitive checks), deploy `3b56dfe2`, branch `devin/1786028086-iter80`, PR #13.
**Method:** recorded browser pass (R81 listing-page card bars, R82 CSV export UI + downloaded file, tracker regression) + shell verification (R83 og:image, R84 /llms.txt, security headers) + headless Playwright axe-core 4.10.2 audit.
**Plan:** `/home/ubuntu/repos/shelfmark/test-plan-iter85.md` · **Recording:** `/home/ubuntu/screencasts/rec-f00d88fb-7b43-4c86-abef-283e87531458/rec-f00d88fb-7b43-4c86-abef-283e87531458-edited.mp4` · **Raw axe:** `/tmp/axe_results_r85.json`

## R81 — listing-page series-card progress bars ✅

Deployed app.js now contains the "fill series-card progress bars from localStorage on listing pages" block: it counts tracker reads per slug and sets `width=min(100, round(read/total*100))%` on `[data-progress-bar][data-total]` elements, skipping slugs whose page contains `ol[data-series]`. Served genre-page markup carries `data-progress-bar="mistborn" data-total="8"`.

With the main test profile (Mistborn 6/8), on /genres/fantasy (hard reload) the Mistborn card bar is now visibly filled ~75% amber, while adjacent untracked cards (Chronicles of the Cheysuli, Way of the Tiger) remain 0%. This is the exact fix for the R76–80 behavior note (bars previously always 0% on card grids).

| 🟢 Mistborn card ~75%, untracked neighbors 0% (zoom) | 🟢 Genre page context |
|---|---|
| ![R81 zoom](https://app.devin.ai/attachments/11259f24-ece6-4fc1-9c44-d5e0da2401b2/ss_zoom_4ad7a093.png) | ![Genre page](https://app.devin.ai/attachments/f83a547b-7341-48d3-9e0b-0b8fba1d045f/ss_b4361d78.png) |

/series/mistborn behavior unchanged: baseline "6 of 8 read (75%)" with matching bar (still owned by updateSeriesUI).

## R82 — CSV export ✅

/shelf shows a new **Export CSV** button between Export JSON and Import JSON. Clicking it downloads `shelfmark-export.csv` (519 B). Actual file content (`cat -A` verified CRLF line endings):

```
Title,Series,Date Read
"Mistborn: Shadows of Self","Mistborn","2026-08-06"
"Mistborn: The Well of Ascension","Mistborn","2026-08-06"
"Mistborn: The Bands of Mourning","Mistborn","2026-08-06"
"Into the Wild","Warriors","2026-08-05"
"Mistborn: The Final Empire","Mistborn",""
...(10 data rows total)
```

- Header exactly `Title,Series,Date Read` ✅
- All fields quoted ✅ · Dates ISO yyyy-mm-dd matching entry timestamps ✅
- **Invalid-epoch case actually exercised:** the main profile's "Mistborn: The Final Empire" entry has a legacy timestamp ≤ 1e12 and produced an empty `""` date field ✅

| 🟢 Export CSV button on /shelf | 🟢 shelfmark-export.csv downloaded |
|---|---|
| ![Shelf buttons](https://app.devin.ai/attachments/1c06cd63-9c43-46d5-b89c-df0486a68376/ss_026002a3.png) | ![Download](https://app.devin.ai/attachments/3052efaa-b509-423b-aadd-6fc54aa139b9/ss_4b25e571.png) |

## R83 — genre og:image ✅

Via workers.dev + cache-bust, /genres/fantasy head contains:
`<meta property="og:image" content="https://covers.openlibrary.org/b/id/14648805-L.jpg">` — an Open Library large (-L.jpg) book cover (Discworld's cover, the genre's top series). ✅

## R84 — /llms.txt ✅

Via workers.dev + cache-bust: HTTP **200**, `content-type: text/plain; charset=UTF-8`, `cache-control: public, max-age=86400` (24h). Body is llmstxt.org format: `# Shelfmark` H1 + `>` summary blockquote, "## Key pages" (series/authors/genres/new/about links), "## API" listing both `/api/series/{slug}.json` and `/api/authors/{slug}.json` with examples, plus a citation note. ✅

## Regression

- **Tracker** (/series/mistborn): tick The Lost Metal → **7 of 8 read (88%)**; untick → exact restore **6 of 8 read (75%)** ✅

| Ticked 7/8 (88%) | Restored 6/8 (75%) |
|---|---|
| ![Tick](https://app.devin.ai/attachments/a947b7a8-ca45-4692-a29e-fdd954254bbd/ss_zoom_e9908530.png) | ![Restore](https://app.devin.ai/attachments/018c6947-247b-4015-8c37-085602c8df65/ss_zoom_2a002f0f.png) |

- **Security headers** (workers.dev + cb, /): HSTS `max-age=31536000; includeSubDomains`; CSP unchanged (incl. wikimedia img-src); Permissions-Policy camera/mic/geo/payment; X-Frame-Options DENY; nosniff; Referrer-Policy strict-origin-when-cross-origin ✅
- **Axe 4.10.2** (bypass_csp, seeded tracker state so /shelf sections render): **/ → 0 violations, /shelf → 0 violations** ✅ (raw: /tmp/axe_results_r85.json)

## Caveats / honesty notes

- R81 homepage Discworld card (3/55 ≈ 5%) was not used as visual evidence — a 5% fill is too subtle to judge from pixels; the ~75% Mistborn card on /genres/fantasy is the primary proof.
- The invalid-epoch CSV case was proven via the pre-existing legacy entry in the main profile, not a synthetic entry.
- R80/R85 are log-only with no runtime surface — not tested, per brief.

## Cleanup

Main profile restored exactly (Mistborn 6/8); no goal key added; no disposable state left.
