# R171: article-insensitive suggest (production worker f49c1e0e)

Against https://shelfmark.wookat520.workers.dev, cache-busted (`&cb=` — suggest cached max-age=3600). Code refs: src/index.ts L1515-1519 artMatch (strips leading "The "/"An "/"A " via CASE+SUBSTR, hyphen-normalized vs ?2), L1521-1533 /api/opensearch-suggest (series only, [q,[names]]), L1621-1646 /api/suggest (series 5 + authors 3 + books 3 → slice 8, series-first ordering). /search unchanged.

## T1. New behavior — /api/suggest (JSON fetch, cache-busted)
- q="three body" → results include a book entry with label "The Three-Body Problem", kind "book", href /book/159964-…. Previously 0 (R167 noted this gap).
- q="three-body" → same book present (hyphen path).
- q="hitchhiker" → series entry label containing "Hitchhiker's Guide", kind "series".
- q="song of ice" → series entry "A Song of Ice and Fire".

## T2. New behavior — /api/opensearch-suggest
- Shape: JSON array [q, [names…]] for every probe.
- q="hitchhiker" → names include The Hitchhiker's Guide… series name; q="song of ice" → "A Song of Ice and Fire"; q="three body" → [] or names OK (series-only endpoint — book titles NOT included; assert no crash, shape correct; record actual).

## T3. Regression — /api/suggest
- "mistborn": series Mistborn first (kind series), plus book entries; "discworld": Discworld series present.
- "brandon sanderson": author entry kind "author" label "Brandon Sanderson".
- Quoted '"mistborn"': same results as unquoted (quote-stripping).
- "m" (<2 chars) → results [] (or empty); "%"/"_" wildcard-only → empty results, HTTP 200 no 500.
- Broad query (e.g. "the") → ≤8 results, all series entries listed before author/book entries.
- Same wildcard/short-q checks on /api/opensearch-suggest → [q,[]].

## T4. UI typeahead on home (Playwright, fresh context)
- Type "hitchhiker" in hero search → listbox opens (aria-expanded=true), option "The Hitchhiker's Guide to the Galaxy" visible (screenshot).
- ArrowDown → option aria-selected/active; Enter → navigates to /series/… hitchhiker page, h1 correct (screenshot).

## T5. Hygiene
- Zero pageerrors/console errors on home during T4; all API probes HTTP 200.
