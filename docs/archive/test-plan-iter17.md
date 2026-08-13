# Shelfmark Rounds 16+17 — 0-book series filtered + /shelf stats cards (deploy 9ffba634, PR #7 commits 0e42a65 + 1514a25)

Code refs: public/app.js shelf renderer — replaces old sentence with a `grid grid-cols-2 sm:grid-cols-4` of 4 statCards: entries.length "books read", bySeries count "series followed", entries with `t > 1e12 && t >= Jan1(currentYear)` "read in 2026", top series by item count (name truncated >22 chars) "most-read series"; empty-shelf branch unchanged ("Your shelf is empty"). src/index.ts: `book_count > 0` added to /series (All+letter), genre count+list, search exact + close-match, 404 seriesSuggestions. Curl pre-check: /series "2,590 series", fantasy "272", fantasy?page=5 has zero "0 books" occurrences, search riftwar cycle returns only riftwar-saga slugs, deployed app.js contains the stats code.

Browser profile has 10 tracker entries (mix of 2025 backup-imported and 2026 ticks); exact expected numbers computed from localStorage `shelfmark_read_v1` at execution start and cross-checked against the cards.

1. /shelf with existing progress: 4 stat cards render in place of the old "N books read across M series" sentence; values exactly match localStorage computation (books read = entry count; series followed = distinct series; read in 2026 = entries with t ≥ 2026-01-01 AND t > 1e12; most-read = series with most items, truncated at 22 chars with …). Fail: sentence still shown, wrong numbers, epoch/pre-2026 entries counted.
2. Tick a new book on any series page, revisit /shelf: "books read" +1, "read in 2026" +1 (new tick t=now); series counts adjust if new series. Untick after to restore. Fail: stale counts.
3. Empty state: temporarily rename key (console: shelfmark_read_v1 → backup), reload /shelf → "Your shelf is empty" card, NO stats grid; restore key, reload → stats back. Fail: stats grid with zeros or broken empty card.
4. ~375px /shelf: stats grid is 2 columns, no horizontal overflow (scrollWidth <= innerWidth).
5. R16 UI: /genres/fantasy intro "272 fantasy series" (was 279); last page (5) contains no "0 books" cards visually; /series shows "2,590 series, sorted by size" (was 2,680); site search "riftwar cycle" → results do NOT include the 0-book "The Riftwar Cycle" container (riftwar-saga sub-series OK).
6. Regression smoke: /shelf Export JSON downloads a file; Import of that file reports success (counts unchanged).
