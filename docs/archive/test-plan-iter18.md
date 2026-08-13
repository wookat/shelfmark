# Shelfmark Round 18 — homepage genre pills + axe-core accessibility audit (deploy 730f2e8d, PR #7 commit 48f8a9a)

Code refs: src/index.ts home route — `SELECT genre, COUNT(*) AS n FROM series WHERE genre IS NOT NULL AND book_count > 0 GROUP BY genre HAVING n >= 10 ORDER BY n DESC LIMIT 12`; "Browse by genre" section with `flex flex-wrap gap-2` pill links `/genres/<gslug>` + count span, "All genres →" link, placed between the New & upcoming section and Prolific authors. Curl pre-check: 12 pills live, fantasy 272 first, all counts ≥10; axe-core 4.10.2 CDN reachable (200, 553 KB).

## Part 1 — R18 regression (recorded)

1. Homepage: "Browse by genre" section renders between "New & upcoming" and "Prolific authors", with exactly 12 pills, first "fantasy 272", plus "All genres →" link. Fail: section missing, wrong position, ≠12 pills, any count <10.
2. Count consistency: fantasy pill count (272) equals /genres/fantasy intro total ("272 fantasy series with complete reading orders."). Click the fantasy pill → lands on /genres/fantasy. Fail: mismatch or dead link.
3. ~375px homepage: pills wrap to multiple rows, scrollWidth <= innerWidth (no horizontal overflow).

## Part 2 — Accessibility audit (axe-core 4.10.2 injected via cdnjs; not recorded — findings-only, per brief)

4. For each of: /, /series/discworld, /authors/brandon-sanderson, /genres/fantasy, /search?q=discworld, /shelf (with existing 10-entry progress), /new — inject axe.min.js and run `axe.run(document)`; collect violations with id, impact, help, node count, first selectors. Deliverable: table grouped by impact (critical/serious/moderate/minor) per page in test-report-iter18.md. No pass/fail — discovery for Round 19.
5. Manual spot checks: Tab through the homepage and a series page — focus must remain reachable/escapable (no keyboard trap); note any visually obvious low-contrast text (e.g. `text-ink-700/60` pill counts) alongside axe's color-contrast results.
