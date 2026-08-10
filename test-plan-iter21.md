# Shelfmark Round 21 — contrast residuals fix re-audit (deploy bcd327e4, PR #7 commit 6183489)

Code refs: src/styles.css adds `.bg-ink-900 .text-amber-accent { color: #e8b05f }`; all `text-ink-700/70` → `/75` in src/index.ts, src/html.ts, public/app.js. Curl pre-check: rule served live; /70 count on /series/discworld = 0.

## Part 1 — axe re-audit (shell, not recorded)

1. Re-run /tmp/axe_audit.py (Playwright Chromium, bypass_csp, axe-core 4.10.2) on /, /series/discworld, /authors/brandon-sanderson, /genres/fantasy, /search?q=discworld, /shelf (seeded), /new. Pass: `color-contrast` = **0 nodes on all 7 pages** (R19 residual was 29); `landmark-unique` stays 0; no new violation types. Fail: any remaining node (report selectors).
2. Compute #e8b05f vs #1a1916 ratio (expect ≥4.5:1) and #3d3a33@75% (`text-ink-700/75`) vs #f7f6f3 (expect ≥4.5:1).

## Part 2 — visual pass (recorded)

3. Homepage dark section ("Your shelf lives in your browser.", bg-ink-900): the "My Shelf" link renders in light amber (#e8b05f), visibly legible against the dark background — screenshot + zoom. Fail: still dark amber/illegible.
4. No visual regressions desktop: hero highlight, genre pills, footer links still fine.
5. /series/discworld: tick a book → progress updates + Up next badge moves (smoke); Tab focus ring visible. Untick to restore.
6. ~375px homepage incl. dark section: legible, scrollWidth ≤ innerWidth.
7. /shelf: stats cards still 10 / 3 / 7 / Mistborn (Regression).
