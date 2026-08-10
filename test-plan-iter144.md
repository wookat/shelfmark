# R144: R140-fixes regression (worker 1952dc78, production; use workers.dev origin or cache-busted URLs)

Deployed-code pre-check done via curl: role="status" swap in app.js, series/author/shelf noscript notes, header `hidden md:block`/`md:hidden`, "Star Trek (57 books)…", /api/suggest book hrefs → /book/…, fmtDate+data-bid in app.js. Now prove runtime behavior.

## Recorded flow (fresh incognito, 1440)
1. **P1-1 coach-mark no-shift**: /series/mistborn fresh profile → coach tip "New here?" visible. Note book-2 checkbox position. Tick book 1.
   PASS: tip box swaps in place to "First book tracked ✓ … My Shelf" (role=status), checkbox rows do NOT move (book2 y unchanged, verify via probe too: shift == 0, was 46px). Up next badge appears on book 2.
2. **P2-3 shelf reorder**: in same profile tick book 2 THEN book 1 already ticked… instead: fresh profile, tick book 2 first, then book 1. Go /shelf.
   PASS: Mistborn list shows Final Empire (book 1) above Well of Ascension (book 2) after /api/series-books re-sort — reverse of tick order. Dates render "Aug 9, 2026" style (P2-2).
3. **P2-4 suggestions**: type "mistborn" in header/hero search; click a book suggestion.
   PASS: navigates to /book/{id}-… page, not /series/mistborn.
4. **P2-1 star trek**: open /series/star-trek-5. PASS: disambig links read "Star Trek (57 books) · (18 books) · (48 books)".

## Unrecorded probes (Playwright, cache-busted)
5. **P1-2/P1-3 no-JS**: JS-off context: /series/mistborn + /authors/brandon-sanderson show noscript note above first list (screenshot: visible); /shelf shows noscript explanation; flag if "Loading your shelf…" + note combo reads broken (screenshot).
6. **P1-4 header widths**: 375/640/700/768/1440 → no empty pill: inline header search hidden <768, visible ≥768; below-header full-width search visible <768, hidden ≥768; no overflow at any width (scrollWidth==innerWidth); screenshot 640 + 768.
7. **Keyboard @640**: tab reaches the below-header search input, focus visible.
8. **Regression probes**: coach tip appears fresh + "Got it" dismisses (TIP_KEY persists after reload); book page single-checkbox → first-tick hint via old insert-after path, no badge; tick sync book↔series↔shelf; Year in Books first/latest finish dates "Aug …"; axe light+dark 0 violations on /series/mistborn (post-animation), /shelf (with data), /year-in-books; overflow 375+320 on home/series/shelf.

Report P0/P1/P2 for anything found. Main QA profile untouched.
