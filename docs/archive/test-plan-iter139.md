# R137 book-page enrichment + search covers (worker be22d3fe, PR #22, branch devin/1786194971-replication-benchmark)

Deployed HTML verified (cache-busted workers.dev): /book/134080-mistborn-the-final-empire contains genre chip `/genres/fantasy`, `ol[data-series="mistborn"]` with "I've read this" checkbox, "All 8 books in Mistborn" strip with one `aria-current="page"`, "About the author", "Readers also enjoyed"; app.js has the `>1 checkbox` coach-mark guard; /search?q=discworld books link to `/book/{id}-slug` with w-8 h-12 thumbnails. Code refs: src/index.ts /book/:key handler + /search bookHits; public/app.js TIP_KEY guard.

## A. Recorded walkthrough (fresh incognito context; main profile untouched)
1. Open /book/134080-mistborn-the-final-empire?cb=… (fresh incognito, 1440 max window).
   - PASS: page shows "Book 1 of 8 in Mistborn · Fantasy" (Fantasy = link), "I've read this — saves privately in your browser" checkbox UNCHECKED, "All 8 books in Mistborn" strip (Mistborn covers absent in DB → initial placeholders "M…" expected; first tile amber-bordered/current), "About the author" Brandon Sanderson card, "Readers also enjoyed" 3 fantasy series cards.
   - PASS: NO "New here?" coach mark anywhere on the book page (fresh profile, single checkbox).
2. Tick "I've read this" → checkbox checked (first-tick hint may appear — fine, notes R130 behavior).
3. Click "Full reading order" → /series/mistborn: PASS: book 1 "Mistborn: The Final Empire" checkbox CHECKED, progress label "1 of 8 read (13%)". Note: coach mark must NOT appear here either (profile now has data — expected suppressed; the coach-mark-present positive test is step 6).
4. Nav My Shelf → /shelf: PASS: "1 books read", Mistborn listed with "Mistborn: The Final Empire".
5. Back to the book page (reload) → checkbox still checked; UNTICK → go to /series/mistborn: checkbox 1 unchecked, progress label gone/0.
6. Coach-mark positive control: close incognito, open NEW fresh incognito → /series/discworld?cb=…: PASS: "New here? Tick the books you've read…" tip visible above list. Then /book/134080…?cb=…: PASS: no tip.
7. /search?q=discworld → Books section: thumbnails/initial placeholders beside each book row; click a book title → lands on /book/… page. PASS: title links to /book not /series.

## B. Unrecorded probes (Playwright/shell)
8. 375px overflow: /book/134080-mistborn-the-final-empire and /search?q=discworld → scrollWidth == 375 (strip is overflow-x-auto, must not widen page). Also drag/scroll strip horizontally at 375 → strip scrollLeft > 0 while page scrollWidth stays 375.
9. Axe light+dark on the book page: 0 violations target.
10. Print emulation on book page: `ol[data-series]` (tick) computed display none (print:hidden); "Readers also enjoyed" section display none (print:hidden); cover strip section has no print:hidden → still displayed — assert nothing broken (body renders, no overflow errors).
11. Regression: series-page tracker tick/untick already exercised in A3/A5.
