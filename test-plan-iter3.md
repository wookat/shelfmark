# Shelfmark Iteration 3 — live re-verify (PR #5 round 3)

Code refs: src/index.ts:405 (search "Books" section, each hit links to /series/{series_slug}), src/index.ts:263 (same-name disambiguation line under H1), src/styles.css:15-18 (@media print hides header/footer/nav/form/[data-progress-bar]/checkboxes).

1. /search?q=The Final Empire: a "Books" H2 section lists "Mistborn: The Final Empire (2006) — Mistborn by Brandon Sanderson"; clicking the title navigates to /series/mistborn. Fail: no Books section (old behavior showed only Authors/Series/no-results).
2. /series/warriors-2: line under H1 "Looking for a different Warriors? …" with link(s) incl. Warriors by Roland J. Green → click navigates to /series/warriors, which shows its own reciprocal line linking back to warriors-2. Fail: line absent on either page.
3. Print stylesheet: on /series/mistborn open print preview (Ctrl+P). Pass: preview shows white background, NO header/nav/footer/search form/email form/checkboxes/progress bar; book list + titles remain. Fail: header or checkboxes visible in preview.
4. Regression: tracker tick on a series page persists after reload (label count increments and stays).
5. Layout sanity on visited pages (no broken sections/overflow at desktop width).
