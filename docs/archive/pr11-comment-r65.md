## Rounds 61–65 live QA — 9/10 passed; R61 filtered-page autodiscovery bug found and fixed in #12

Tested against production https://shelfmark.zalize.com, deploy 01936eba (recorded in Devin session).

**❌→✅ R61 (one failure, now fixed):** autodiscovery `<link rel="alternate" type="application/rss+xml">` is correctly in head on `/`, `/series/discworld`, and `/genres`, but on `/new?genre=fantasy` it pointed to the unfiltered `/new.rss` instead of `/new.rss?genre=fantasy` (confirmed on both zalize.com and the workers.dev origin with cache-bust — not edge staleness; the page's visible "RSS feed (fantasy)" link was already correct). Fixed in PR #12, deployed (883d242f), and live-reverified: filtered pages now advertise the filtered feed.

**🟢 R65 open data API:** `/api/series/mistborn.json` → 200 JSON with name/author/genre/url/order + 8 books `{order,title,year}` in page order + license, `access-control-allow-origin: *`, `cache-control: public, max-age=3600`; unknown slug and `..%2Fetc.json` both 404. The new **Open data API** section renders on /about and its example link serves the JSON:

| 🟢 /about: Open data API section | 🟢 Example link → JSON |
|---|---|
| ![About](/home/ubuntu/screenshots/ss_d347243f.png) | ![JSON](/home/ubuntu/screenshots/ss_6e014465.png) |

**🟢 R62 og:image:** brandon-sanderson → `covers.openlibrary.org/b/id/8737489-L.jpg` (large); randall-munroe → `/og.png` fallback. **🟢 R64 cache headers** (workers.dev direct + cache-bust): styles.css/app.js `max-age=3600`; favicon.svg/og.png/manifest.json `max-age=86400`.

**♿ Axe** (4.10.2): **0 violations** on /, /about, /authors/brandon-sanderson.

<details><summary>Regression (all green)</summary>

Tracker on /series/mistborn: tick → 7/8 (88%), untick → exact restore 6/8 (75%). Security headers (HSTS/CSP/Permissions-Policy/XFO/nosniff/referrer) unchanged.

| Ticked 7/8 | Restored 6/8 |
|---|---|
| ![Tick](/home/ubuntu/screenshots/ss_zoom_1da55b03.png) | ![Restore](/home/ubuntu/screenshots/ss_zoom_8499496e.png) |
</details>

_R63 was docs-only._
