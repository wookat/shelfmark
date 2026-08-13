# R173: D1 catalog curation — academic series deleted (worker f49c1e0e, data-only)

Against https://shelfmark.wookat520.workers.dev, cache-busted (`?cb=` — HTML cached 5 min). Sitemap index /sitemap.xml → parts /sitemaps/1.xml…11.xml (from R170). Styled-404 marker: h1/heading "Page not found" + four onward pills (R156/R165 skill note).

## T1. Deleted pages → styled 404
- GET /series/lecture-notes-in-computer-science → HTTP 404, page contains "Page not found" + 4 onward pill links; screenshot.
- GET /book/157385-similarity-search-and-applications-10th-international-confer → HTTP 404 styled.

## T2. Search cleanup
- /search?q=similarity+search → no result row whose label contains "Similarity Search and Applications" or "proceedings" (case-insensitive); record what does return (may be "Nothing found").
- /search?q=lecture+notes → no "Lecture Notes in Computer Science" series/book rows; record actual.

## T3. Sitemaps
- Fetch all /sitemaps/1..11.xml; assert zero occurrences of "lecture-notes-in-computer-science" across all parts.

## T4. Regression — unaffected surfaces
- /studies/longest-series → 200; rank-1 row unchanged (Kuroko's Basketball 275 books, 2009–2014); no deleted academic series in top rows (grep "Lecture Notes"/"Proceedings" absent from table).
- /genres/fantasy 200, /popular 200 with content (h1 present, >0 series cards).
- /series/mistborn intact: 200, 8-book list, h1 "Mistborn Books in Order".

## T5. API + hygiene
- /api/series/lecture-notes-in-computer-science.json → HTTP 404 with JSON body (record shape).
- Zero pageerrors on browsed pages.
