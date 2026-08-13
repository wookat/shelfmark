# Shelfmark Rounds 91–95 — export/import _saved, reading pace chart, /popular, /api/hit (deploy 187823eb, PR #14)

Shell pre-check facts (workers.dev + cache-bust, app.js lines): export adds top-level `_saved` only when saved list non-empty (app.js:452); import merges `_saved` entries (name/t validated, no overwrite of existing) then book entries skipping `_saved` key (app.js:493-505); pace chart renders only `if (dated)` — entries with t>1e12 bucketed into last 12 months, card "Reading pace — last 12 months", `role="img"` aria-label "Books read per month over the last 12 months", amber bars w/ counts (app.js:381-403). /popular → 200, h1 "The 100 most popular book series", 100 progress-bar cards, Breadcrumb + ItemList JSON-LD; homepage "Top 100 →" href=/popular; footer "Popular series"; sitemaps/1.xml has /popular. POST /api/hit body "/\ngoogle.com" → 204.

## Recorded browser pass

1. R91 export (incognito profile A): on /series/mistborn tick book 1, click "☆ Save for later" → ★. /shelf → Export JSON. Downloaded shelfmark-export.json must contain top-level `"_saved": {"mistborn":{"name":"Mistborn","t":<ms>}}` AND the ticked book entry. Fail: no _saved key, or missing book.
2. R91 import (fresh incognito profile B, empty localStorage): /shelf → Import JSON, pick the file → status "Imported 1 new book ✓ Reloading…"; after reload /shelf shows the book under Mistborn AND "Saved for later" grid with Mistborn. Fail: progress or saved list not restored.
3. R91 empty-saved export (main profile, saved list = {}): /shelf → Export JSON → file has NO `_saved` key (verify file content). Fail: spurious _saved.
4. R92 pace chart: main profile /shelf shows "Reading pace — last 12 months" card with 12 labeled bars; container role="img" + aria-label; current-month count matches profile (6 entries dated Aug 2026 → bar "6"; Aug 2025 → 2). Negative: incognito empty profile /shelf → no pace card. Fail: wrong counts, missing aria, card shown when no dated entries.
5. R93 UI: homepage "Top 100 →" link near Popular series → /popular renders h1 "The 100 most popular book series" + numbered series cards; footer has "Popular series" link. Fail: 404/missing.
6. Regression tracker: /series/mistborn tick The Lost Metal → 7/8 (88%); untick → restore 6/8 (75%).

## Shell checks

7. R93: /popular 200, h1, 100 cards, Breadcrumb nav, ItemList JSON-LD with 100 items; sitemaps/1.xml contains /popular (already captured, re-verify JSON-LD item count).
8. R94: POST /api/hit with "/\ngoogle.com" → 204 (captured); browser console on / shows no errors (beacon fires without CSP violation).
9. Regression security headers on / unchanged (workers.dev + cb).
10. Axe (Playwright bypass_csp, 4.10.2): light+dark on / and /shelf (seeded) → 0 violations each. Save /tmp/axe_results_r95.json.

Cleanup: incognito contexts discarded; main profile tracker restored 6/8, saved list stays {}.
Report → /home/ubuntu/repos/shelfmark/test-report-iter95.md
