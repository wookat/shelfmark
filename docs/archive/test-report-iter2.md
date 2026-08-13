# Shelfmark — Iteration 2 report (PR #5, live)

Live regression on https://shelfmark.zalize.com (recorded browser pass, desktop + 375px). All 5 requested checks passed.

## Results

| Check | Result |
|---|---|
| Mistborn "If you like Mistborn, you'll love…" grid | ✅ pass — 6 same-genre cards (Discworld, Xanth, Darkover, Warriors, Anita Blake, Shannara), none by Brandon Sanderson, each with progress bar; clicking the Discworld card navigated to /series/discworld |
| Placeholder tiles for cover-less books | ✅ pass — Discworld #14 Troll Bridge / #15 Theatre of Cruelty show 38×57 initial-letter "T" tiles, visually aligned with neighboring covers |
| Skip-to-content link | ✅ pass — first Tab on a fresh load shows the "Skip to content" pill top-left; Enter jumps to `#main` and the next Tab lands inside main content |
| Regression: tracker tick/persist | ✅ pass — ticked Mort → "2 of 55 read (4%)", persisted after reload |
| Regression: mobile 375px | ✅ pass — Mistborn incl. also-like grid stacks in one column, `scrollWidth 485 ≤ innerWidth 500`, no horizontal overflow |

Observations (no action required): also-like grid appears on Discworld too (fantasy genre); secondary text at /75 opacity reads noticeably darker than before — no visual regressions spotted.

## Evidence

| 🟢 Also-like grid on Mistborn | 🟢 Initial-letter placeholder tiles |
|---|---|
| ![Also-like grid](https://app.devin.ai/attachments/1157cd14-eb56-4a3a-9e28-726dbecf0c42/ss_c73986f8.png) | ![Placeholder tiles](https://app.devin.ai/attachments/6b9e0fe3-56d0-405f-afdd-e84b0aa67170/ss_zoom_1b487f87.png) |

| 🟢 Skip link (first tab stop) | 🟢 Tracker persists after reload |
|---|---|
| ![Skip to content pill](https://app.devin.ai/attachments/ff9ccc4c-0228-4ebb-8e91-40eb8509e477/ss_95a3d95a.png) | ![2 of 55 read after reload](https://app.devin.ai/attachments/cb49c102-600d-4333-961f-1caf38fe1cc0/ss_zoom_25c1094f.png) |

🟢 Mobile 375px, also-like grid stacked, no overflow:

![Mobile 375px](https://app.devin.ai/attachments/57304b25-e128-40fb-931f-7a9988dffce0/ss_8cf6ffcb.png)

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-4b245ce2-2742-4dbd-97a4-9c3adb17abf2/rec-4b245ce2-2742-4dbd-97a4-9c3adb17abf2-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter2.md`
