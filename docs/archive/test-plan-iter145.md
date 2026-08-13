# R145 discovery scan — new surfaces (production worker 62f02dd0)

Not covered by R140 scan. Goal: find NEW P0/P1/P2. Test via workers.dev origin or cache-busted zalize.com. No real email submissions / no subscription inserts. By-design exclusions: initial-letter cover placeholders, no ratings.

## 0. Spot-check delta fix (only code change)
- No-JS /shelf: `#shelf-loading` now hidden via noscript `<style>` (src/index.ts L1033). PASS: with JS off, "Loading your shelf…" NOT visible, only the explanation card + /series link (screenshot). With JS on, shelf renders normally (loading replaced by content).

## 1. Content/nav surfaces (browser, 1440 light; spot dark + 375)
- /lists → all 4 curated lists (trilogies, long-running-epics, new-series-of-the-2020s, classic-series; src/index.ts L251-280): each loads, non-empty grid, cards match blurb criteria (e.g. trilogies show "3 books"), breadcrumb, cross-links to other lists.
- /genres → open a genre page → pagination (page 2 link works; ?page=999 → 404; ?page=0/-1 → treated as 1); "New & Upcoming in {genre}" filtered /new?genre=… view + RSS link.
- /new + /new?genre=… filtered; /popular; /random (expect 302 → some /series/*, no-store; hit twice, likely different).
- /about, /press, /privacy, /pricing desktop 1440, /unsubscribe with no/garbage token (expect 400 page "Link invalid or already used" — GET with bad t only; do NOT hit with a real token).
- Dark mode spot: /lists, /press, /pricing, one book page — no unreadable/hardcoded-light patches (screenshots).
- 375px on: lists, a curated list, genres, genre page, new, popular, about, press, privacy, unsubscribe — no horizontal overflow (scrollWidth==375) + visual spot-check.

## 2. Feeds / SEO / API edge behavior (shell)
- /new.rss + /new.rss?genre=fantasy: valid XML (xmllint), item links absolute, self atom:link matches.
- /opensearch.xml valid XML; /api/opensearch-suggest?q=mist returns the 4-element OpenSearch array.
- /sitemap.xml → child /sitemaps/* fetchable; sample 5 URLs return 200.
- API errors: /api/series/zzzz.json → 404 {"error":"Series not found"}; /api/series/BAD..name.json → 404 Not found; /api/series-books/zzzz → 404 {books:[]}; /api/suggest?q= (empty), 1 char, 500-char, emoji, `' OR 1=1--` → 200 JSON no 5xx; /search same queries → 200 page, no error text, no raw SQL echo.
- robots.txt, llms.txt exist.

## 3. Shelf data round-trips (browser UI, fresh incognito)
- Tick 2 Mistborn books → /shelf → Export JSON (verify file content has both ids) → Clear all data (shelf empties, stats 0) → Import JSON (both books restored, series order). Export CSV parses with 2 rows.
- "Download my reading card" produces a PNG (check downloaded file magic bytes + open it).
- /saved viewer edge: /saved with empty fragment and garbled fragment (#x=%%%) → graceful message, no console error/blank white page.

## 4. Search typeahead keyboard (browser)
- Type "mist" in header search → ArrowDown highlights first suggestion (aria-selected=true), Enter navigates to it; Escape closes the listbox (aria-expanded=false) leaving input text intact.

## 5. Print + axe
- Print emulation on /series/mistborn: tracker checkboxes hidden, list readable, no nav/footer clutter (compare against media screen).
- axe light+dark on 4 least-tested pages: /lists/trilogies, /press, /genres/fantasy, /unsubscribe (bad token). PASS: 0 violations each.

Output: prioritized P0/P1/P2 findings with page, repro, screenshot path, suggested direction. Recording: none unless a finding benefits from motion demo (per brief "only if it adds value").
