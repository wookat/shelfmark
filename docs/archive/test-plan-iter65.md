# Shelfmark Rounds 61–65 — RSS autodiscovery, author og:image, static cache headers, series JSON API, /about Open data section (deploy 01936eba)

Shell pre-check facts (live): autodiscovery `<link rel="alternate" type="application/rss+xml" href=…/new.rss>` present on /, /series/discworld, /genres. ⚠️ On /new?genre=fantasy the autodiscovery href is **/new.rss (unfiltered)**, not /new.rss?genre=fantasy — brief says the filtered page should still point to the filtered feed → likely R61 FAILURE (confirmed identical via workers.dev direct + cache-bust). og:image: sanderson → covers.openlibrary.org/b/id/8737489-L.jpg; munroe → /og.png fallback. R64 via workers.dev+cache-bust: styles.css/app.js max-age=3600; favicon.svg/og.png/manifest.json max-age=86400. R65 API: mistborn.json has name/author/genre/url/order/books(8, order+title+year)/license, headers ACAO:* + max-age=3600; unknown slug & ..%2Fetc.json both 404. /about has "Open data API" + mistborn.json example links. Security headers unchanged. R63: docs only, no test.

## Shell checks (curl, no browser)

1. R61: `<link rel="alternate" type="application/rss+xml">` with href /new.rss on /, /series/discworld, /genres. Fail: missing on any.
2. R61 filtered page: /new?genre=fantasy autodiscovery href should be /new.rss?genre=fantasy per brief. Observed /new.rss → mark FAILED unless page shows otherwise.
3. R62: /authors/brandon-sanderson og:image = `https://covers.openlibrary.org/b/id/8737489-L.jpg` (-L large); /authors/randall-munroe og:image = `https://shelfmark.zalize.com/og.png`. Fail: -M/-S image, wrong id, or no fallback.
4. R64 (workers.dev direct + ?cb=): styles.css & app.js → `cache-control: public, max-age=3600`; favicon.svg, og.png, manifest.json → `max-age=86400`. Fail: missing/wrong values.
5. R65: GET /api/series/mistborn.json → 200 JSON with keys name/author/genre/url/order/books/license; books[0] = {order:1, title:"Mistborn: The Final Empire", year:2006}, 8 books in page order; headers `access-control-allow-origin: *` + `cache-control: public, max-age=3600`. Unknown slug (zzznotreal.json) → 404; traversal `..%2Fetc.json` → 404. Fail: any mismatch/5xx.
6. Regression: security headers on / unchanged (HSTS, CSP, Permissions-Policy, XFO DENY, nosniff, referrer).

## Recorded browser pass

7. R65 UI: /about — "Open data API" section visible with example link; click the /api/series/mistborn.json link → JSON renders with mistborn fields. Fail: section missing or link broken.
8. Regression tracker: /series/mistborn — tick The Lost Metal → 7 of 8 read (88%); untick → restore 6 of 8 (75%). Fail: no change or wrong restore.
9. Axe (Playwright bypass_csp, axe-core 4.10.2): /, /about, /authors/brandon-sanderson → 0 violations each. Save /tmp/axe_results_r65.json.

Report → /home/ubuntu/repos/shelfmark/test-report-iter65.md
