# Shelfmark Continuous Iteration — Round 3 live QA (PR #5)

Live production pass on https://shelfmark.zalize.com (recorded browser run, desktop + 375px mobile). Plan: `test-plan-iter3.md`. Code refs: src/index.ts:405 (search Books section), src/index.ts:263 (same-name disambiguation), src/styles.css:15-18 (@media print).

## Results

### 1. Search "Books" section — ✅ passed
`/search?q=The Final Empire` shows a "Books" H2 with "**Mistborn: The Final Empire** (2006) — Mistborn by Brandon Sanderson"; clicking the title navigated to `/series/mistborn`.

![Search Books section](https://app.devin.ai/attachments/6241449f-5eaf-4c2f-a0d2-58262be98029/ss_c0a13160.png)

**P2 observation:** on the same page the "Nothing found. Try a different spelling…" line renders directly below the Books section — the no-results condition (src/index.ts:406) only checks `series`/`authors`, not `bookHits`. Contradictory copy when only books match.

### 2. Same-name series disambiguation — ✅ passed
- `/series/warriors-2` (Victoria Holmes): "Looking for a different Warriors? **Warriors by Roland J. Green**" under the H1.
- Clicking it lands on `/series/warriors`, which reciprocally shows "Looking for a different Warriors? **Warriors by Victoria Holmes**" linking back to `/series/warriors-2`. No dead links.

| warriors-2 → warriors | warriors → warriors-2 |
|---|---|
| ![warriors-2 disambiguation](https://app.devin.ai/attachments/4fda4958-058d-439f-9883-358a49962475/ss_a936900b.png) | ![warriors reciprocal](https://app.devin.ai/attachments/24bcbc28-cf67-48b8-a031-2f16aed9a887/ss_58785265.png) |

### 3. Print stylesheet — ✅ passed
Ctrl+P print preview of `/series/mistborn`: white background; site header/nav, footer, search form, email form, checkboxes and the progress bar are all hidden; book list, titles, blurbs remain. (Minor cosmetic: the "1 of 8 read (13%)" text pill and the "☑️ Tick a book…" tip line still print — they're text, not in the hidden selector list.)

![Print preview](https://app.devin.ai/attachments/2d69d979-e69d-44fc-8bbf-548f76623b3b/ss_zoom_ec6d227b.png)

### 4. Regression: tracker persistence — ✅ passed
Ticked "Mistborn: The Well of Ascension" → count went 1 of 8 (13%) → **2 of 8 read (25%)**; persisted after F5.

![Tick persisted after reload](https://app.devin.ai/attachments/fb970b6d-bf3f-4740-a9d7-86016618def8/ss_zoom_620f788a.png)

### 5. Regression: layout / 375px mobile — ✅ passed
Desktop pages visited (search, mistborn, warriors, warriors-2) all render normally. 375px window: Mistborn and Warriors pages stack cleanly incl. the disambiguation line; no horizontal overflow (scrollWidth 485 ≤ innerWidth 500).

![Mobile warriors-2 with disambiguation](https://app.devin.ai/attachments/bd768f20-f7cf-4166-b16d-908e295029c5/ss_ef29406c.png)

### Not tested
- IndexNow script fix — server-side, no UI; not verified in this pass.

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-a5791dcf-9ebd-46f6-8362-a5a7207256dc/rec-a5791dcf-9ebd-46f6-8362-a5a7207256dc-edited.mp4`
