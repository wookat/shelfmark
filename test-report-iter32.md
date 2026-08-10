# Test Report — Rounds 31–32: JSON-LD hasPart + shelf recency ordering (deploy d0c25dfd, PR #8)

**Target:** production https://shelfmark.zalize.com, deploy d0c25dfd
**Method:** recorded live browser pass of the R32 shelf reordering (tick → reload → verify → untick → verify restore) + shell verification of R31 JSON-LD hasPart + headless axe-core 4.10.2 audit of /shelf with seeded state.
**Plan:** `test-plan-iter32.md` · Raw axe output: `/tmp/axe_results_r32.json`
**Recording:** `/home/ubuntu/screencasts/rec-0303ce36-e504-473d-9c24-5cad1d74f0b6/rec-0303ce36-e504-473d-9c24-5cad1d74f0b6-edited.mp4`

## Summary

| # | Check | Result |
|---|---|---|
| 1 | R32: /shelf precondition — order Discworld / Mistborn / Warriors (by most recent tick, not key order) | ✅ passed |
| 2 | R32: tick Fire and Ice on /series/warriors-2 (1/35 → 2/35, Up next → Forest of Secrets) | ✅ passed |
| 3 | R32: reload /shelf → **Warriors section jumps to the top** | ✅ passed |
| 4 | R32: stats update 10/3/7 → 11/3/8; Mistborn/Discworld Up next slots unchanged | ✅ passed |
| 5 | R32: within-group newest-first — Fire and Ice (8/6/2026) listed above Into the Wild (8/5/2026) | ✅ passed |
| 6 | Restore: untick → order back to Discworld / Mistborn / Warriors, stats 10/3/7/Mistborn, Warriors Up next = Fire and Ice | ✅ passed |
| 7 | Regression: Export JSON / Import JSON / Download my reading card buttons still rendered | ✅ passed |
| 8 | Regression: reading-card share render (optional) | ⚪ untested (skipped — optional, canvas download verified R24) |
| 9 | Axe /shelf (seeded 10/3/7 state): zero violations | ✅ passed |
| 10 | R31: BookSeries JSON-LD hasPart (shell) — /series/discworld 50 Book items, positions 1–50 sequential, names match rendered order; /series/mistborn 8 items | ✅ passed |

## R32 — Shelf sections ordered by most recent activity

Precondition: with the seeded state, /shelf renders **Discworld → Mistborn → Warriors** (already recency-sorted: Discworld's newest tick is most recent, Warriors' 8/5/2026 oldest) — notably different from the old arbitrary key order (Mistborn first in prior rounds):

![Precondition order](https://app.devin.ai/attachments/2ccf2144-a647-4647-bdb2-fac0e843a05b/ss_c4193a5f.png)

Ticked "Fire and Ice" on /series/warriors-2 → 2 of 35 read (6%), Up next badge moved to Forest of Secrets:

![Fire and Ice ticked](https://app.devin.ai/attachments/2d1d81d5-7931-457e-a20a-6e8deccb9f21/ss_zoom_598730da.png)

Reloaded /shelf — **Warriors is now the first section** (above Discworld and Mistborn), with Fire and Ice (8/6/2026) listed above Into the Wild (8/5/2026) inside the group. Stats 11 / 3 / 8 / Mistborn; Warriors Up next advanced to Forest of Secrets; Discworld (Mort) and Mistborn (The Lost Metal) Up next slots unchanged:

![Warriors jumped to top](https://app.devin.ai/attachments/e189f190-5ef9-4f81-94a9-f3408087a7c3/ss_2ffd9d19.png)

Restore: unticked Fire and Ice (back to 1/35, Up next = Fire and Ice) → /shelf order returned to Discworld / Mistborn / Warriors, stats back to **10 / 3 / 7 / Mistborn**, Export JSON / Import JSON / Download my reading card buttons all present:

![Restored order and buttons](https://app.devin.ai/attachments/570d05f2-9465-47d0-8a88-112cc1842e6e/ss_da8e8a9a.png)

Code ref: deployed app.js sorts per-group items by `t` desc then groups by `(b.items[0].t||0) - (a.items[0].t||0)`.

## R31 — BookSeries JSON-LD hasPart (shell-verified)

- /series/discworld: BookSeries JSON-LD contains `hasPart` with **50 Book items**, `position` sequential 1–50, first three names **The Light Fantastic, Mort, Equal Rites** — matching the rendered/copy-list order; each item carries name, position, datePublished, image, author (`{"@type":"Person","name":"Terry Pratchett"}`).
- /series/mistborn: 8 hasPart items (per lead's own curl verification; count re-confirmed).

## Axe (axe-core 4.10.2, Playwright + bypass_csp, localStorage seeded before scan)

| Page | Violations |
|---|---|
| /shelf (seeded 10/3/7 state, all three sections rendered) | **0** ✅ |

Headless section-order sanity in the same run: `['Discworld', 'Mistborn', 'Warriors']` — matches the recorded browser.

## Notes

- Item #8 (reading-card render) was marked optional in the request and skipped; the button's presence was verified, and the canvas download path was last proven in R24.
- Tracker state fully restored to the seeded baseline; no residue left.
