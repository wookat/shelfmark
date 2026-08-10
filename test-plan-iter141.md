# R139 acceptance-fixes QA (worker 5c3ca36a, commit 940a193)

Deployed verified in setup (cache-busted workers.dev): /shelf has "lives on this device" callout + `id="backup"`; /authors/brandon-sanderson & /authors/terry-pratchett have `nav[aria-label="Jump to series"]` (sanderson: 6 series anchors + #standalone); /authors/suzanne-collins (3 sections) has NO nav (negative control); styles.css has `.up-next-flash{animation:1.2s ease-out up-next-pulse}` inside prefers-reduced-motion: no-preference block. Code refs: src/index.ts L489+ (nav, ≥4 rule), L1023+ (callout, #backup on export row), public/app.js updateUpNext (badge after title `a`, removed+reinserted on change, animate only on tick), src/styles.css up-next-pulse.

## A. Recorded walkthrough (fresh incognito, cache-busted)
1. /shelf: amber callout "Your shelf lives on this device." visible under intro; click "export a backup" link → page scrolls to Export button row (Export JSON visible in viewport). PASS iff scroll lands on #backup row.
2. /authors/brandon-sanderson: "Jump to" card under Share/Print with series links; click "The Reckoners" → page scrolls to #the-reckoners section heading. PASS iff URL gains #the-reckoners and the section h2 is at top of viewport.
3. /series/mistborn: tick book 1 → "Up next" amber badge appears next to book 2 title with visible background pulse; tick book 2 → badge moves to book 3; untick book 1 → badge moves to book 1 (first unread). PASS iff badge exists exactly once and on the correct li each time.
4. Mark all read → badge disappears (no unread). Clear → badge disappears (zero checked). PASS iff no .up-next-badge in both states.

## B. Unrecorded probes (Playwright/shell, fresh contexts)
5. Badge on load: pre-seed localStorage shelfmark_read_v1 with mistborn book 1 read → load series page → badge on book 2 present WITHOUT up-next-flash class on li (no animation on load). PASS/FAIL per class presence.
6. Reduced-motion: emulate reduce → tick a book → badge appears; computed animation-name of li.up-next-flash = none (rule gated to no-preference). PASS iff badge present + animationName "none".
7. Book page /book/134080-mistborn-the-final-empire: tick single checkbox → NO up-next badge (items.length<2 guard). PASS iff zero badges.
8. Negative control: /authors/suzanne-collins has no nav[aria-label="Jump to series"]; brandon-sanderson nav anchor targets all resolve to existing ids incl. #standalone.
9. Jump-nav tap targets: each nav a boundingBox height ≥44px (min-h-[44px] inline-flex).
10. 375px overflow: /shelf, /authors/brandon-sanderson, /series/mistborn → scrollWidth==375.
11. Axe 4.10.2 light+dark on /shelf, /authors/brandon-sanderson, /series/mistborn (with a tick so badge present) → 0 violations (6 runs).
12. Regression: tick on series page still syncs to /shelf count; coach mark still appears on series page for fresh profile (unchanged >1-checkbox guard). Main QA profile untouched (disposable contexts only).
