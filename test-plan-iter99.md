# Shelfmark Rounds 96–99 — popular og:image, saved-list homepage fallback, Clear all data, privacy disclosure (deploy ce428952)

Shell pre-check facts (workers.dev + cache-bust): /popular og:image + twitter:image = `https://covers.openlibrary.org/b/id/15150725-L.jpg`; /llms.txt has `[100 most popular series](https://shelfmark.zalize.com/popular)`; /privacy has "the referring site's hostname (e.g. "google.com" — never the full URL, page, or search query)". app.js: fallback heading "From your saved list" with meta "saved for later · start reading →" when no progress but saved items (app99.js:163-186); #clear-data-btn → confirm("Erase all Shelfmark data…") → removes all localStorage keys starting "shelfmark" → reload (app99.js:487-497).

## Recorded browser pass

1. R97 fallback (disposable incognito, NO progress): on /series/discworld click "☆ Save for later" → ★. Homepage → section heading exactly "From your saved list" with a Discworld card, meta "saved for later · start reading →". Fail: no section, or "Continue reading" heading.
2. R97 progress takes over: tick book 1 on /series/mistborn (1/8). Homepage → heading now "Continue reading" (Mistborn card "1 read · pick up where you left off →"); no "From your saved list". Fail: still fallback heading with progress present.
3. R98 Cancel: /shelf → "Clear all data" button after Import JSON; click → confirm dialog with erase warning → Cancel → shelf data intact (Mistborn 1 read + Saved Discworld still shown; localStorage keys present).
4. R98 Accept: click again → OK → page reloads to "Your shelf is empty", no Saved section; localStorage has no keys starting with "shelfmark". Fail: keys remain or shelf still populated.
5. R99: /privacy Analytics paragraph visibly shows the referring-hostname disclosure (google.com example). Screenshot.
6. Regression (MAIN profile — never click Clear all data): /series/mistborn tick The Lost Metal → 7/8 (88%); untick → restore 6/8 (75%).

## Shell checks

7. R96: /popular og:image + twitter:image are covers.openlibrary.org …-L.jpg (captured); /llms.txt lists /popular (captured).
8. Regression security headers on / unchanged (workers.dev + cb).
9. Axe (Playwright bypass_csp, 4.10.2) light + dark on /, /shelf (seeded), /privacy → 0 violations each. Save /tmp/axe_results_r99.json.

Cleanup: incognito discarded; main profile canonical (Mistborn 6/8, saved {}, no goal key).
Report → /home/ubuntu/repos/shelfmark/test-report-iter99.md

## R97 fix re-test (deploy ca9e334c, commit eb03008)

Pre-check: cache-busted /app.js has `var SAVED_KEY` at line 144, ABOVE the fallback block (line 172, "From your saved list") — hoisting bug fixed. Plain /app.js is still an edge-cache HIT of the old asset (md5 1edd40ee…), so hard reload (Ctrl+Shift+R) is mandatory in the disposable profile.

1. Fresh incognito, NO progress: /series/discworld hard-reload, click "☆ Save for later" → ★. Homepage (hard reload) → section heading exactly "From your saved list" with Discworld card, meta "saved for later · start reading →". Fail: no section (pre-fix behavior).
2. Tick book 1 on /series/mistborn → homepage heading switches to "Continue reading" (Mistborn "1 read · pick up where you left off →"); no "From your saved list". Fail: fallback still shown with progress present.

Append results to test-report-iter99.md; update PR-comment draft.
