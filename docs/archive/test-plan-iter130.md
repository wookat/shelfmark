# Shelfmark R128–130 onboarding (worker c565b465, PR #18, commit 201334f)

Code evidence: public/app.js — coach tip inserted before `ol[data-series]` iff read store empty AND `shelfmark_tip_track_v1` unset; "Got it" sets key + removes; `maybeShelfHint` fires on first-ever tick (wasEmpty), sets `shelfmark_hint_shelf_v1` + tip key, removes tip, appends "First book tracked ✓ … My Shelf." after list, auto-remove 12s; both `.coach-tip … print:hidden`. src/index.ts — homepage 3-step section (sr-only h2 "How Shelfmark works", links /popular, /shelf, /year-in-books) + dark panel copy now mentions Year in Books/shareable list.

## A. Recorded new-user walkthrough (fresh incognito #1)
1. Homepage: 3-step cards visible under hero: "1 Find your series / 2 Tick books as you read / 3 See it all on My Shelf". Fail: absent.
2. Click "browse the most popular" in card 1 → /popular; click a series (e.g. Discworld) → series page shows coach tip box above book list: "New here? Tick the books you've read…" + "Got it". Fail: no tip.
3. Tick book 1 → coach tip disappears immediately AND hint appears after list: "First book tracked ✓ See all your progress on My Shelf." Progress "1 of N read". Fail: tip persists or no hint.
4. Click the hint's My Shelf link → /shelf shows the 1 read book.
5. Back to series page (reload): NO tip, NO hint (keys set). Fail: tip reappears.
6. Wait >12s on a fresh hint in step 3? (hint auto-remove verified by observing it gone after 12s — capture before/after).
7. Fresh incognito #2 (close all incognito first): series page → tip visible → click "Got it" WITHOUT ticking → tip removed; reload → tip stays gone (key persists), no hint ever shown.
8. Main QA profile (has progress): open /series/discworld → NO coach tip (read store non-empty). Read-only check.
9. Regression: homepage dark bottom panel mentions Year in Books + shareable saved list.

## B. Shell/Playwright (unrecorded)
10. Print emulation (Playwright media="print") on a coach-marked series page: `.coach-tip` computed display none. 
11. Reduced-motion emulation homepage: 3-step section fully visible (opacity 1) without scroll.
12. Axe 4.10.2 light+dark on / and on a series page with tip visible (fresh storage): 0 violations → /tmp/axe_results_r130.json.
13. Overflow 375+320px on / and series page with tip visible: scrollWidth == innerWidth.

Constraints: incognito for all new-user flows; main profile read-only (negative tip check only).
