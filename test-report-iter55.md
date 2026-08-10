# Shelfmark Rounds 51–55 — Production Test Report

**Target:** https://shelfmark.zalize.com · deploy `4783d03e` · PR #9
**Date:** 2026-02-02 · **Method:** recorded browser pass (R51–53 UI + /genres sanity) + shell (curl robots checks, axe-core 4.10.2 via Playwright/bypass_csp)
**Result: 8/8 checks passed, 0 failed, 0 untested.** R55 (IndexNow + health check) had no code change and was shell-verified by the user pre-handoff — included as reported, not re-run.

## R51 — "Report it" mailto link on series pages ✅

/series/discworld tracker note ends «Spotted a wrong or missing book? Report it». Hovering the "Report it" link shows the status-bar target:

`mailto:contact@zalize.com?subject=Shelfmark data issue%3A Discworld`

Served HTML confirms the exact href `mailto:contact@zalize.com?subject=Shelfmark%20data%20issue%3A%20Discworld` (subject decodes to "Shelfmark data issue: Discworld"). No mail client was opened, per brief.

![R51 Report it link with mailto target in status bar](https://app.devin.ai/attachments/0f614a77-c42b-4ec2-a5aa-e10cae0b99ca/ss_zoom_60962348.png)

## R52/53 — Genre backfill + vocabulary normalization ✅

- /genres/fantasy header: **"385 fantasy series with complete reading orders."** (was 272 before R52/53).
- /genres/crime-fiction: **"38 crime fiction series"** (crime literature merged in).
- /genres/crime-literature: HTTP **404** with the styled "Page not found" page (site header + "Try searching…" copy).
- /series/fitz-and-the-fool (newly genred via book-level P136 majority): capitalized **Fantasy** chip in the pill row; clicking it navigates to /genres/fantasy.

| 🟢 Fantasy: 385 series | 🟢 Crime fiction: 38 series |
|---|---|
| ![Fantasy 385](https://app.devin.ai/attachments/e8c96268-4493-4fdb-abe6-2a27afdb51f6/ss_5ed2d527.png) | ![Crime fiction 38](https://app.devin.ai/attachments/ea958377-971a-4f73-a167-4651c9b18548/ss_1f3ceb33.png) |

| 🟢 crime-literature → styled 404 | 🟢 Fitz and the Fool: Fantasy chip |
|---|---|
| ![404](https://app.devin.ai/attachments/543296c8-a336-455e-8dc0-b4ad5cee4466/ss_8aaa3b16.png) | ![Fitz chip](https://app.devin.ai/attachments/9d2c84ca-a370-497e-8039-252c5fe48a82/ss_d6ffcc6b.png) |

## Sanity — /genres index ✅

Renders normally, **fantasy 385** first, then science fiction 290, children's literature 73, … No bogus entries (no "Gunilla Bergström", no "crime literature", none of the 7 cleared P136 values visible).

![Genres index clean, fantasy top](https://app.devin.ai/attachments/9d9e8e8e-b6e1-4b5a-835e-962993c8c498/ss_d01ea402.png)

## R54 — small-genre noindex (shell) ✅

```
/genres/cozy-mystery  (1 series)  → <meta name="robots" content="noindex,follow">
/genres/fantasy       (385)       → no robots meta (0 matches)
```

## Axe audit ✅ (axe-core 4.10.2, Playwright bypass_csp)

| Page | Violations |
|---|---|
| /genres | **0** |
| /genres/fantasy | **0** |
| /series/fitz-and-the-fool | **0** |

Raw output: `/tmp/axe_results_r55.json` — zero-violation baseline holds.

## Artifacts

- Recording: `/home/ubuntu/screencasts/rec-78487f3e-1b7e-42ae-a26b-5ae52d38d014/rec-78487f3e-1b7e-42ae-a26b-5ae52d38d014-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter55.md`
- Raw axe: `/tmp/axe_results_r55.json`

## Caveats

- The mailto link was verified by href/status bar only (no mail client on box; brief said not to open one).
- R55 IndexNow/health-check results are user-reported (shell-verified pre-handoff), not independently re-run.
- The "370 series gained a genre" figure was spot-checked via one example (fitz-and-the-fool) plus the aggregate count deltas; individual series were not enumerated.
