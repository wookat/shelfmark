# R165: discovery — cold surfaces (production worker 8c4b64f8)

Discovery at acceptance-officer bar; P0/P1/P2, no fixes. Against https://shelfmark.wookat520.workers.dev, cache-busted fresh contexts. Code refs: /random index.ts L85-93 (302, Cache-Control no-store, X-Robots-Tag noindex, target /series/{slug}); /pricing L569+; /press L1495+; /privacy L1530+; /unsubscribe GET L1710-1723 (no/bad token → HTTP 400, h1 "Link invalid or already used", noindex meta); /new.rss L1404+; /opensearch.xml L1435-1446 (+ /api/opensearch-suggest); subscribe form L1381-1387 (input type=email required aria-label="Email for new-release alerts", button "Notify me", POST /api/subscribe app.js L423-431); manifest public/manifest.json (start_url "/", standalone, single SVG icon /favicon.svg, 3 shortcuts incl. /shelf /new /random).

## D1. Static pages (/pricing, /privacy, /press)
- Each: 200, sensible h1, 1440 light+dark screenshots, visual review (contrast, layout, dead links). Click 1-2 in-page links (e.g. /press → /pricing link) — resolve 200. No NaN/undefined; zero pageerrors.

## D2. /unsubscribe degradation
- GET /unsubscribe (no token): expect HTTP 400, h1 "Link invalid or already used", contact email fallback visible, noindex meta, page renders full chrome (no stack trace). Same with ?t=garbage. Screenshot.

## D3. /random
- 3 fetches: each 302 → /series/{slug} that then 200s; headers Cache-Control: no-store + X-Robots-Tag: noindex on the redirect response.

## D4. /new.rss
- 200, Content-Type XML, parses as valid XML (python xml.etree), channel title/link, ≥1 item, spot-fetch 2 item links → 200. Genre variant /new.rss?genre=fantasy also valid.

## D5. PWA + OpenSearch
- /manifest.json: 200, JSON parses, start_url "/", display standalone, icon /favicon.svg fetches 200 image/svg+xml; shortcuts URLs (/shelf,/new,/random) all reachable. html link rel=manifest present. Note: single SVG-only icon (no 192/512 PNG) — judge installability (Chrome requires PNG icons ≥144px for install prompt → likely finding).
- /opensearch.xml: 200, correct content-type, valid XML, template URLs resolve; /api/opensearch-suggest?q=mist returns JSON suggestions array.

## D6. Subscribe form UX on /new (NO real submit)
- Visual: heading "Get new releases by email", input + "Notify me" button. Input has aria-label; type "notanemail" + click Notify me → native validation blocks (assert :invalid state + validationMessage, no POST /api/subscribe request fired — network listener). Clear → empty submit also blocked (required). Screenshot of validation bubble.

## D7. 320px sweep
- At 320×740: /studies, /studies/longest-series, /studies/most-prolific-authors, /studies/series-length-by-genre, a /book page (Mistborn #2), /lists/duologies. Assert document.scrollingElement.scrollWidth == 320 each; screenshots; visual review for clipped/overlapping text.

## D8. HTTP hygiene
- /studies/xxx, /lists/xxx → 404 with the styled not-found page (4-pill row from R156); also /pricing/xxx behavior noted. No 500s anywhere.

## Output
Prioritized P0/P1/P2 with location + direction; verified-fine list; zero pageerrors expected.
