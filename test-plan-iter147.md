# R147: /similar/{slug} pSEO pages regression (production worker f3db0333, PR #28)

Code refs: route src/index.ts L214-247 (noindex when <6 at L224, 302 no-genre at L220, 404 unknown at L219); series-page link L689; llms.txt L1599; sitemap L1662. Test via workers.dev origin / cache-busted. No recording; screenshots.

## 1. Primary page /similar/mistborn (browser 1440 light)
- PASS: h1 "Series like Mistborn"; breadcrumb Home/Series/Mistborn/Similar; intro contains "is fantasy — here are 18 more fantasy series" (18 = grid count ≤18); two pill links: one → /series/mistborn ("reading order"), one → /genres/fantasy; grid of up to 18 series cards, none by Brandon Sanderson, all link /series/*; screenshot.
- Click a card → lands on that series page (URL /series/{card-slug}).
- Pill "reading order" navigates to /series/mistborn.
- JSON-LD: page has ItemList with itemListElement length == card count and BreadcrumbList including Mistborn. Validate structure via parsing script.
- Dark 1440 + light 375 screenshots; overflow 0 at 375.
- axe light+dark: 0 violations.

## 2. Series page entry point
- /series/mistborn: "If you like Mistborn, you'll love…" section ends with link "See all series like Mistborn →" href=/similar/mistborn; click navigates to the new page (screenshot of the link).

## 3. Edge cases (curl/Playwright probes)
- Unknown slug /similar/zzzz-nope → 404 "Page not found".
- No-genre series → 302 to /series/{slug}: probe candidate slugs (query sitemap difference: series page in sitemap but slug NOT in /similar list) until one 302s. PASS: Location /series/{slug}, status 302.
- Low-result (<6 similar) → X-Robots-Tag: noindex: probe several /similar/ URLs from rare genres (e.g. gamebook/essay 8-9 series genres from /genres — genre with N<~7 same-genre candidates); PASS: some page shows header X-Robots-Tag: noindex while /similar/mistborn does NOT have it.
- /similar/mistborn header check: no X-Robots-Tag (>=6 results).

## 4. Sitemap + llms.txt
- /sitemaps/1.xml contains /similar/ URLs; count == 834 across sitemap parts (grep -c). PASS: 834 total /similar/ locs.
- llms.txt contains "Series like X" pattern line with /similar/{series-slug}.
- Spot-check 3 random /similar/ URLs from sitemap → all HTTP 200.
