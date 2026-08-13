# R176: catalog curation pass 4 verification (data-only, PR #51 docs)

Against https://shelfmark.zalize.com, cache-busted. Refs: docs/iteration-log.md R176 entry (commit b345a4a); search route + 404 suggestions unchanged since R173.

## T1. Keyword search cleanliness
For each q in: lecture notes, research report, survey, archaeology, handbook, statistics, reference, studies, publications, proceedings, dictionary, encyclopedia, catalogue, yearbook —
- GET /search?q=…; parse actual result rows (exclude the `Results for "…"` header echo).
- FAIL if any row title matches academic-imprint patterns (report(s), proceedings, lecture notes, working papers, handbook-of, survey-of, memoirs, bulletin, transactions, outlines, encyclopedia/dictionary/catalogue-of, "Studies in", BAR, CRS, geological, Wellcome, Springer/Wiley/Garland/Oxford imprints). Record every row per query for manual review; fiction with report-like names (Flashman Papers, Gonzo Papers, Secret Projects…) is OK.

## T2. Deleted-series three-surface check (7 slugs)
african-studies-collection, bar-british-series, oxford-handbooks, second-geological-survey-of-pennsylvania, wellcome-witnesses-to-contemporary-medicine, springer-series-in-statistics, treatise-on-basic-philosophy:
- /series/{slug} → HTTP 404, styled "Page not found" + 4 onward pills; 404 suggestion list contains no academic imprints (record lists).
- /api/series/{slug}.json → 404.
- All 11 sitemap parts: 0 occurrences of each slug.

## T3. Kept series still live
/series/{massey-lectures, dehio-handbook, classici-dellarte, k-nstler-monographien, official-toki-pona, the-country-home-library, companions-quartet, the-flashman-papers, secret-projects} → each HTTP 200 with an h1 ending "Books in Order" and ≥1 book row; still present in sitemaps.

## T4. No broken collateral
- Author link from 2-3 kept series (e.g. Sonja Lang from official-toki-pona, Julia Golding from companions-quartet) → 200, consistent counts, zero pageerrors.
- /authors index 200, no empty/0-book entries visible on first screen (screenshot).
- /genres + 3 genre pages (mystery-fiction, fantasy, reference-adjacent if exists): no series card showing "0 books"; card counts all ≥1 (DOM scan).
- Zero pageerrors on all browsed pages. Screenshots: one clean search results page, one styled 404, one kept series page.
