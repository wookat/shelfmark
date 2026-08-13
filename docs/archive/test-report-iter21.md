# Round 21 test report — a11y contrast residuals fixed (deploy bcd327e4, PR #7 commit 6183489)

Production: https://shelfmark.zalize.com · Branch `devin/1786007000-iter3`
Delta tested: (1) `.bg-ink-900 .text-amber-accent { color: #e8b05f }` (light amber on dark surfaces); (2) all remaining `text-ink-700/70` → `/75` in src/index.ts, src/html.ts, public/app.js. Both curl-verified on live assets before testing (rule served in styles.css; `/70` occurrences = 0 on /series/discworld; homepage now uses `/75` ×25).

## 1. Axe-core re-audit (axe 4.10.2, Playwright Chromium + bypass_csp + add_script_tag)

**Result: 0 violations of any kind on all 7 pages.** `color-contrast` hit the target of 0 (R19: 29 nodes; R18: ~205). `landmark-unique` stayed at 0. No new violation types appeared.

| color-contrast nodes | R18 | R19 | **R21** |
|---|---|---|---|
| `/` | 20 | 2 | **0** |
| `/series/discworld` | 63 | 5 | **0** |
| `/authors/brandon-sanderson` | 72 | 11 | **0** |
| `/genres/fantasy` | 6 | 4 | **0** |
| `/search?q=discworld` | 3 | 1 | **0** |
| `/shelf` (seeded progress) | 6 | 4 | **0** |
| `/new` | 35 | 2 | **0** |

Computed ratios confirming the fixes:
- `#e8b05f` on `#1a1916` (dark section amber): **9.05:1** ✅ (R19 dark amber `#9a6414` was 3.52:1)
- `text-ink-700/75` blended (`#6c6963`) on `#f7f6f3`: **5.06:1** ✅ (the `/70` value was 4.43:1)

Raw results: `/tmp/axe_results_r21.json` (all pages `[]`). Run log: `/tmp/axe_run_r21.log`.

## 2. Dark-section "My Shelf" link (the R21 headline fix)

The dark homepage section ("Your shelf lives in your browser.") now renders its "My Shelf" link in light amber — computed color verified as `rgb(232, 176, 95)` = `#e8b05f`, clearly legible:

![Dark section My Shelf link in light amber](https://app.devin.ai/attachments/5223efa4-e2b9-432b-8452-d22a34674db8/ss_zoom_97422223.png)

## 3. Visual regression pass (desktop, recorded)

No regressions observed on hero highlight ("right order." amber), 12 genre pills, "All X →" links, footer (light footer links + white-on-amber "Notify me" button):

| Hero + pills (top of homepage) | Footer + dark section |
|---|---|
| ![Homepage top](https://app.devin.ai/attachments/6e9bdfc4-1b14-4bb3-871b-8e2c8f8c2348/ss_1a0e0f29.png) | ![Footer](https://app.devin.ai/attachments/25566499-f603-4be3-9dd8-856b00aff0c3/ss_de2ca7d9.png) |

## 4. Smoke: tracker tick + Up next badge + focus ring (Regression)

On /series/discworld (starting 1/55, badge on Mort): ticking Mort updated to **2 of 55 read (4%)** and moved the badge to Equal Rites instantly; Tab shows the amber focus ring on a checkbox. Unticked afterwards — state restored to 1/55 with badge back on Mort.

| Tick → 2/55, badge on Equal Rites | Focus ring visible (Sourcery checkbox) |
|---|---|
| ![Tick](https://app.devin.ai/attachments/03e5bba4-744f-47fa-bc92-6f91d10ba409/ss_zoom_f72742df.png) | ![Focus](https://app.devin.ai/attachments/15ee5bed-6400-4950-b30b-8b627232048c/ss_zoom_edc2ba58.png) |

## 5. Smoke: /shelf stats cards (Regression)

Stats cards intact post-deploy: **10 books read / 3 series followed / 7 read in 2026 / Mistborn**.

![Shelf stats](https://app.devin.ai/attachments/4f90206d-4d5e-4f4f-b5b1-948a9811c861/ss_79430fab.png)

## 6. Mobile ~375px

Homepage incl. dark section wraps cleanly; "My Shelf" link still `rgb(232,176,95)`; measured `scrollWidth=485 ≤ innerWidth=500` (no horizontal overflow). Note: browser chrome floors the CSS viewport at ~500px on this box; overflow was measured objectively.

![Mobile dark section](https://app.devin.ai/attachments/0ab09214-7712-4e29-8ad7-7dabfe918613/ss_fc52c5b1.png)

## Verdict

All Round 21 targets met: color-contrast 0/0/0/0/0/0/0, landmark-unique 0, dark-section link legible and passing, no visual regressions desktop or ~375px, tracker and shelf stats intact.

Artifacts: recording `/home/ubuntu/screencasts/rec-1dd69d46-9b0e-4c06-814b-f058899b505c/rec-1dd69d46-9b0e-4c06-814b-f058899b505c-edited.mp4`; plan `/home/ubuntu/repos/shelfmark/test-plan-iter21.md`; raw axe `/tmp/axe_results_r21.json`.
