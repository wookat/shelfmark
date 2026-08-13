# R180: /compare layer verification (worker 8cdf844a, PR #53)

Against https://shelfmark.zalize.com, cache-busted. Code refs: commit eefa072 src/index.ts (+270ff: CMP_TOP=8, CMP_ELIGIBLE genre+author+book_count 3–60, /compare index, /compare/:pair with alphabetical-canonical 301, noindex header for non-top-8 pairs), sitemap part 1 block (+2118ff), footer link src/html.ts L99, llms.txt line.

## T1. Index
- GET /compare → 200; exactly **12** genre `<section>` h2s; each section exactly **28** pair links (C(8,2)); total 336 unique hrefs, all matching `^/compare/[a-z0-9-]+-vs-[a-z0-9-]+$` with a<b alphabetically.
- Visual: light + dark screenshots at 1440; 375px scrollWidth==375; fresh axe light+dark → 0 violations.

## T2. Pair pages (discworld-vs-xanth + 4 random from index)
For each: 200; h1 "A vs B"; table rows Author/Books/Published/Books per year/Start with/Reading order.
- Cross-check Books + Published against each series page pills ("N books", "YYYY–YYYY") — values must match exactly.
- Books per year == round(count/span,1) recomputed from displayed values; "—" iff span 0/null.
- "Start with" anchor → /book/{id}-… of the series' row-1 book (verify href equals the series page's first book link); click one to confirm 200.
- JSON-LD: BreadcrumbList (Compare → pair) + ItemList numberOfItems 2 with both /series URLs; <title> "A vs B: Which Series to Start? | Shelfmark".
- Onward pills: /similar/a, /similar/b, genre, /compare all present and resolve 200.

## T3. Canonicalization / 404s (status + Location, no follow)
- /compare/xanth-vs-discworld → **301** Location /compare/discworld-vs-xanth; one more reversed random pair 301.
- /compare/discworld-vs-discworld → 404; /compare/garbage → 404 styled; /compare/not-a-slug-vs-also-nope → 404; cross-genre /compare/discworld-vs-thursday-next → 404 (verify both series exist individually & genres differ).

## T4. noindex
- Harvest a same-genre CMP-eligible series NOT in that genre's top-8 (from /genres/{g} cards with 3–60 books + author, excluding index pairs). GET its pair with a top-8 series (alphabetical order) → 200 AND header `x-robots-tag: noindex`.
- A top-8 index pair (discworld-vs-xanth) → 200 with NO x-robots-tag header.

## T5. Sitemap + wiring
- /sitemaps/1.xml contains `/compare<` once + exactly **336** /compare/ pair URLs, set-equal to the index hrefs; sample 5 → all 200.
- Footer on / and on a series page contains link "Compare series" → /compare; /llms.txt line mentions /compare.

## T6. Mobile + print + regression
- Pair page at 375px: page scrollWidth==375, table scrolls inside its overflow-x-auto wrapper (wrapper scrollWidth > clientWidth OR table fits); screenshot.
- Print: emulate media print, screenshot pair page — header/footer/nav hidden per @media print, table readable.
- Regression: tick book 1 on /series/agatha-raisin → "1 of 8 read (13%)".
- Zero pageerrors on all browsed pages.
