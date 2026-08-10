# Shelfmark Round 10 — /series A–Z letter nav (deploy bc054f6d, PR #6 commit 49ac92c)

Code refs: src/index.ts /series route (mirrors verified /authors pattern): `<nav aria-label="Series by letter">` All + 26 pills, active pill `bg-ink-900 text-ink-50`; `/^[A-Z]$/` validation (else All); letter view `ORDER BY s.name`, All view `ORDER BY s.book_count DESC` ("sorted by size"); `paginationQ("/series?letter=X&")`; canonical path carries letter+page; empty copy "No series under this letter yet.". Also 3f22b19: shelf import reload delay 800→1600ms (code-verified only this round). Pre-checked live: M → 148 series, Page 1 of 3; canonical on letter=M&page=2 correct via curl.

1. /series?letter=M via clicking M pill from /series: heading "All book series: M", intro "148 series starting with M. Page 1 of 3.", M pill inverted dark, all visible cards start with M and ascend alphabetically (book counts non-monotonic → not size order). Fail: non-M card, size order, styling missing.
2. Pagination keeps letter: click "Next →" → /series?letter=M&page=2, still M-only alphabetical continuing, "Page 2 of 3". Fail: filter lost.
3. All pill: click All → /series "sorted by size" view (top card = largest series, e.g. Discworld-scale book_count ordering), All pill inverted. Fail: still filtered or name-sorted.
4. Invalid letter: /series?letter=zz → normal All view, no active letter, no error. Fail: crash/empty.
5. Mobile ~375px on /series?letter=M: pills wrap multiple rows, scrollWidth <= innerWidth, M pill visible inverted.
6. Card navigation: click one M series card → its /series/{slug} page loads with matching H1.
7. Smoke (regression): homepage renders (Popular series + New & upcoming present); tracker: /series/mistborn tick state persists (verify current "5 of 8 read (63%)" state renders; no tick change needed — read-only persistence check of prior ticks).
