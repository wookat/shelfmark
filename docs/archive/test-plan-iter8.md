# Shelfmark Round 8 — /authors A–Z letter nav (deploy 6416b4e6, PR #6 commit 013c91e)

Code refs: src/index.ts /authors route (commit 013c91e): letter pill nav `<nav aria-label="Authors by letter">` with All + 26 pills below intro line; active pill `bg-ink-900 text-ink-50`; `?letter` validated by `/^[A-Z]$/` (else null → All); letter view `ORDER BY name`, All view `ORDER BY book_count DESC`; paginationQ base `/authors?letter=X&`; empty state "No authors under this letter yet."; canonical path includes letter+page. Pre-checked live: letter K → "Page 1 of 14".

1. Nav renders: /authors shows heading "All authors", pill row All+A–Z below intro; "All" pill visually inverted (dark bg, light text). Fail: nav missing, wrong pill count, active style absent.
2. Click "K" pill: URL /authors?letter=K; heading "All authors: K"; intro "… authors starting with K. Page 1 of 14"; K pill inverted, All pill normal; all visible author cards start with K and are alphabetically sorted (first card should start "K…" and cards ascend by name, NOT by book_count). Fail: non-K author present, popularity order retained, or active styling wrong.
3. Pagination preserves letter: click "Next →" → URL /authors?letter=K&page=2; heading still ": K"; page 2 cards still all K, alphabetical continuing after page 1's last name. Fail: page 2 loses letter (shows popularity/all authors).
4. "All" pill returns to popularity view: click All → /authors, first cards are highest book_count (e.g. top card matches previous All view top author), All pill inverted again.
5. Invalid letter: navigate to /authors?letter=zz → renders All view ("All authors", "… with series reading orders"), no error, no letter styled active. (Also canonical check via view-source/curl: letter=K page includes canonical /authors?letter=K.)
6. Mobile ~375px: /authors?letter=K pill row wraps to multiple lines, no horizontal overflow (scrollWidth <= innerWidth).
7. Smoke: click a K author card → lands on /authors/{slug} "{Name} Books in Order" page.

Empty-state text "No authors under this letter yet." tested only if a letter with 0 authors exists (probe Q/X/Z live); otherwise mark untested.
