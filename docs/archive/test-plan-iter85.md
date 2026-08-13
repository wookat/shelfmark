# Shelfmark Rounds 81–85 — card-bar fill on listings, CSV export, genre og:image, llms.txt (deploy 3b56dfe2, PR #13)

Shell pre-check facts (workers.dev + cache-bust): R81 app.js now has a "fill series-card progress bars from localStorage on listing pages" block (counts reads per slug, skips slugs whose page has ol[data-series], sets width=min(100,round(read/total*100))%); genre-page mistborn card bar has `data-progress-bar="mistborn" data-total="8"`. R82 app.js has export-csv-btn handler: header `Title,Series,Date Read`, quoted fields (`""` escaping), ISO date from t>1e12 else empty, CRLF join, downloads shelfmark-export.csv. R83 /genres/fantasy og:image = `https://covers.openlibrary.org/b/id/14648805-L.jpg`. R84 /llms.txt → 200 text/plain, `cache-control: public, max-age=86400`, llmstxt.org format (summary + Key pages + API sections). Main profile: Mistborn 6/8, Discworld 3 reads, Warriors 1 read (10 entries total).

## Recorded browser pass

1. R81 filled: /genres/fantasy (hard reload, main profile) — Mistborn card bar visibly filled ~75% (was 0% in R76–80 run); neighboring untracked cards (e.g. Chronicles of the Cheysuli) stay 0%. Fail: mistborn bar empty or untracked bars filled.
2. R81 homepage: Popular series Discworld card (3/55 reads ≈ 5%) — small but nonzero fill acceptable evidence only if visibly distinguishable; primary evidence is the Mistborn card.
3. R81 unchanged on series page: /series/mistborn still shows 6 of 8 read (75%) label + bar (owned by updateSeriesUI).
4. R82: /shelf — "Export CSV" button next to Export JSON; click → downloads shelfmark-export.csv; file content: first line `Title,Series,Date Read`; 10 data rows, each fully quoted, dates ISO yyyy-mm-dd matching entry timestamps. Fail: missing button, wrong header, unquoted fields, wrong dates.
5. Regression tracker: /series/mistborn tick The Lost Metal → 7/8 (88%); untick → restore 6/8 (75%).

## Shell checks

6. R83: og:image meta on /genres/fantasy = covers.openlibrary.org/…-L.jpg (captured; re-verify with fresh cb).
7. R84: /llms.txt 200, text/plain, max-age=86400, contains site summary + Key pages + both API endpoints (captured).
8. Regression security headers on / unchanged (workers.dev + cb).
9. Axe (Playwright bypass_csp, 4.10.2): / and /shelf → 0 violations. For /shelf, seed shelfmark_read_v1 in the axe context so sections render. Save /tmp/axe_results_r85.json.

Cleanup: tracker restored to 6/8; no goal key added.
Report → /home/ubuntu/repos/shelfmark/test-report-iter85.md
