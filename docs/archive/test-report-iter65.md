# Shelfmark Rounds 61–65 — Production Test Report

**Target:** https://shelfmark.zalize.com · deploy 01936eba
**Method:** curl/python for R61 autodiscovery, R62 og:image, R64 cache headers (via https://shelfmark.wookat520.workers.dev direct + cache-bust), R65 API JSON/headers/404s, security-header regression; recorded browser pass for the /about "Open data API" section and tracker regression; headless Playwright + axe-core 4.10.2.
**Result: 9/10 checks passed, 1 FAILED (R61 filtered-page autodiscovery), 0 untested.**

## ❌ R61 — RSS autodiscovery (1 failure)

`<link rel="alternate" type="application/rss+xml" title="Shelfmark — new series books" href="https://shelfmark.zalize.com/new.rss">` present in head on `/`, `/series/discworld`, `/genres` — ✅ passed.

**FAILED:** the brief says the /new?genre= page's autodiscovery link should still point to the filtered feed, but on `/new?genre=fantasy` the only `rel="alternate"` link in head points to the **unfiltered** `https://shelfmark.zalize.com/new.rss`, not `/new.rss?genre=fantasy`. Confirmed identically on both zalize.com and the workers.dev origin with cache-bust (`?genre=fantasy&cb=…`), so it is not edge staleness:

```
zalize.com/new?genre=fantasy      → href="https://shelfmark.zalize.com/new.rss"
workers.dev/new?genre=fantasy&cb= → href="https://shelfmark.zalize.com/new.rss"
```

(The R60 *visible* "RSS feed (fantasy)" link on the page still correctly targets /new.rss?genre=fantasy — only the head autodiscovery link is unfiltered.)

## ✅ R62 — author og:image

```
/authors/brandon-sanderson → <meta property="og:image" content="https://covers.openlibrary.org/b/id/8737489-L.jpg">
/authors/randall-munroe    → <meta property="og:image" content="https://shelfmark.zalize.com/og.png">
```

Large (-L) OL cover for the first covered book; /og.png fallback for a no-cover author — ✅ passed.

## R63 — docs only, not tested (per brief).

## ✅ R64 — static asset cache headers (workers.dev direct + ?cb=)

```
styles.css:    cache-control: public, max-age=3600
app.js:        cache-control: public, max-age=3600
favicon.svg:   cache-control: public, max-age=86400
og.png:        cache-control: public, max-age=86400
manifest.json: cache-control: public, max-age=86400
```

✅ All five match the spec.

## ✅ R65 — public series JSON API + /about section

- `GET /api/series/mistborn.json` → 200 `application/json`, keys `name/author/genre/url/order/books/license`; name=Mistborn, author=Brandon Sanderson, genre=fantasy, order="publication", 8 books with `{order, title, year}` starting `{1, "Mistborn: The Final Empire", 2006}` — sequence identical to the page's reading order; license string present.
- Headers: `access-control-allow-origin: *`, `cache-control: public, max-age=3600`, `x-content-type-options: nosniff` — ✅
- `zzznotreal.json` → **404**; traversal `..%2Fetc.json` → **404** — ✅
- /about renders the new **Open data API** section; clicking the `/api/series/mistborn.json` example link serves the JSON in-browser:

| 🟢 /about: Open data API section | 🟢 Example link → JSON response |
|---|---|
| ![About](https://app.devin.ai/attachments/16448fcb-cf04-4d51-b9e3-a2fc3d69d077/ss_d347243f.png) | ![JSON](https://app.devin.ai/attachments/2d882644-ff82-4549-ad43-f8b3fa000ae1/ss_6e014465.png) |

## ✅ Regression

- Tracker on /series/mistborn: tick The Lost Metal → **7 of 8 read (88%)**, Up next → Secret History; untick → exact restore **6 of 8 read (75%)**, Up next back on The Lost Metal.

| 🟢 Ticked: 7/8 (88%) | 🟢 Restored: 6/8 (75%) |
|---|---|
| ![Ticked](https://app.devin.ai/attachments/3da52b76-7215-45b9-ad86-cdd6d435e48f/ss_zoom_1da55b03.png) | ![Restored](https://app.devin.ai/attachments/1a85685e-ddaa-4af5-b044-5cb6ea8325bf/ss_zoom_8499496e.png) |

- Security headers on `/` unchanged: HSTS max-age=31536000; includeSubDomains, full CSP, Permissions-Policy camera/microphone/geolocation/payment=(), X-Frame-Options DENY, nosniff, referrer strict-origin-when-cross-origin — ✅
- Axe (4.10.2, bypass_csp): `/` → 0, `/about` → 0, `/authors/brandon-sanderson` → 0 violations — ✅

## Artifacts

- Recording: /home/ubuntu/screencasts/rec-dcdae712-6433-439b-832c-8957ae1001bd/rec-dcdae712-6433-439b-832c-8957ae1001bd-edited.mp4
- Plan: /home/ubuntu/repos/shelfmark/test-plan-iter65.md
- Raw axe: /tmp/axe_results_r65.json

## Caveats

- R62 fallback tested on randall-munroe only; the 8737489-L.jpg id was taken as spec'd by the brief and matches the first covered Sanderson book per served meta.
- R64 verified on the workers.dev origin per the brief's note that zalize.com edge may cache stale headers.
