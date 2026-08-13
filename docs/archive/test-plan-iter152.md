# R152: regression of R151 discovery fixes (production worker 67dd3913)

All against https://shelfmark.wookat520.workers.dev (cache-busted), fresh Playwright contexts. Screenshots as evidence; no recording needed unless a failure requires motion.

## T1. Order/copy switch (P1 fix)
- /series/wallander-novels: visible copy uses "series order" (intro/aside/FAQ); assert NO "publication order" in Where-to-start aside or FAQ answer; meta description contains "series order". Screenshot of aside+FAQ.
- /series/mistborn: same "series order" wording.
- Control /series/discworld (verified monotonic book-list years 1986→2010): still says "publication order" (aside + FAQ). FAIL if control also flipped.
- Note: each page may retain one "publication order" occurrence in a custom description — acceptable per brief; assert the FAQ/aside/meta specifically.

## T2. See-all suppression (P2 fix)
- /series/les-rougon-macquart: "If you like…" section shows its 2 cards and NO "See all series like" link (grep DOM + screenshot).
- /series/mistborn: link still present and navigates to /similar/mistborn.

## T3. Curated list curation (P2 fix)
- /lists/classic-series: zero cards for Dehio handbook / Künstler-Monographien / Principia Mathematica; card "Canon of Sherlock Holmes" (capital C) present. Screenshot of the list.
- axe light+dark on /lists/classic-series: 0 violations.

## T4. /popular cross-link row (P2 fix)
- Bottom of /popular: 4 pills — Browse by genre, Reading lists, All series A–Z, New & upcoming; click one (Browse by genre → /genres). Screenshot.

## T5. Pagination indicator (P2 fix)
- /genres/fantasy page 1: "Page 1 of 7" between/near prev-next pills, Next works → page 2 shows "Page 2 of 7" with Previous. Screenshots both.
- /series and /authors page 1: "Page 1 of 44" / "Page 1 of 381" render.
- 375px on /genres/fantasy?page=2: pagination row zero horizontal overflow; screenshot.

## Regressions
- /series/wallander-novels (modified page): tick book 1 → checkbox checked + Up-next badge on book 2; untick reverts; zero console pageerrors.
- axe light+dark on /series/wallander-novels: 0 violations.

Pass = all above with the concrete expected strings/values; anything else reported as failure with evidence.
