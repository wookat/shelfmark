# Test report — Rounds 19+20: a11y fixes re-audit + visual sanity

- **Production:** https://shelfmark.zalize.com, deploy `1a0f0854`
- **Branch:** `devin/1786007000-iter3` (PR #7), commits `89bbb68` (R19 a11y) + `af7d2e1` (R20 favicon/IndexNow)
- **Method:** axe-core 4.10.2 re-audit via headless Playwright Chromium (`bypass_csp=True`, script injected from local `/tmp/axe.min.js`) on the same 7 pages as Round 18; recorded browser visual pass of the darker amber on desktop + ~375px; smoke of genre pills, tracker tick and /shelf stats.
- **Plan:** `test-plan-iter19.md` · **Recording:** `rec-98f0ebc9-…-edited.mp4` · **Raw axe:** `/tmp/axe_results.json` (R19 copy: `/tmp/axe_results_r19.json`)

## Summary

The R19 fixes land as intended: **landmark-unique is fully resolved** (0 nodes on all pages) and **color-contrast dropped from ~205 nodes to 29** across the 7 pages. Computed ratio of the new accent `#9a6414` on the page background `#f7f6f3` is **4.62:1** (≥4.5 ✅). Two residual issue classes remain (not zero):

1. **Amber links on the dark footer** — `#9a6414` on `#1a1916` is **3.52:1**. 2 nodes on `/` (`.underline`, `.mt-3` — the footer "About & methodology"-style links / subscribe note). The darkening fixed light-background amber but made dark-background amber worse.
2. **`text-ink-700/70` at 4.43:1** — the /50→/70 bump lands *just* under 4.5:1 (`#75726d` on `#f7f6f3`). Hits breadcrumbs (`.mb-4`, `.hover:text-amber-accent[href="/"]`), book metadata lines, /shelf section counts and intro. /75 (used elsewhere) passes; /70 does not.

No critical or moderate violations remain. Visual pass found the darker amber acceptable everywhere checked.

## Axe before (R18) → after (R19) — color-contrast nodes

| Page | R18 nodes | R19 nodes | Remaining selectors (R19) |
|---|---|---|---|
| `/` | 20 | **2** | `.underline`, `.mt-3` (amber on dark footer, 3.52:1) |
| `/series/discworld` | 63 | **5** | `.mb-4`, breadcrumb links, `.print:hidden.mt-4`, `.mt-3` (ink-700/70 @4.43) |
| `/authors/brandon-sanderson` | 72 | **11** | breadcrumbs + per-series `.text-sm.text-ink-700/70` metadata |
| `/genres/fantasy` | 6 | **4** | breadcrumbs, `.mt-3` |
| `/search?q=discworld` | 3 | **1** | `.mt-3` (12px) |
| `/shelf` | 6 | **4** | section h2 counts, intro, stat-card labels (ink-700/70) |
| `/new` | 35 | **2** | breadcrumb home link, `.mt-3.text-xs` |
| **Total** | **205** | **29** | |

| Rule | R18 | R19 |
|---|---|---|
| `landmark-unique` (moderate) | 4 pages | **0 pages — resolved** ✅ |
| `color-contrast` (serious) | 7 pages / ~205 nodes | 7 pages / 29 nodes |
| critical rules | 0 | 0 |

Computed ratios: `#9a6414`/`#f7f6f3` = 4.62 ✅ · `#9a6414`/`#1a1916` = 3.52 ❌ · `#75726d` (ink-700/70)/`#f7f6f3` = 4.43 ❌ · white/`#9a6414` = 4.99 ✅.

## Visual sanity (recorded, all passed)

| 🟢 Hero highlight in darker amber | 🟢 Genre pills + "All genres →" |
|---|---|
| ![Hero](https://app.devin.ai/attachments/93a942bd-ab02-4960-a32c-7b8f87f3c252/ss_zoom_cccc8331.png) | ![Pills](https://app.devin.ai/attachments/3dfbb274-dbfe-4c43-b0a3-105d6bc8afad/ss_zoom_7be490ba.png) |

| 🟢 "Notify me" white-on-#9a6414 (4.99:1) | 🟢 Up next badge + progress label |
|---|---|
| ![Button](https://app.devin.ai/attachments/55cc6fd1-6fa2-459d-9ffa-a85e4a244c39/ss_zoom_554b25c3.png) | ![Badge](https://app.devin.ai/attachments/ef76df09-91bb-44f7-8ca3-2a0d4c585d95/ss_zoom_1ef03c17.png) |

| 🟢 Focus ring in new amber (Tab to checkbox) | 🟢 375px pills wrap, no overflow (485≤500) |
|---|---|
| ![Focus](https://app.devin.ai/attachments/b06b5056-5ff0-4d83-8d7e-d0b9fedc2f68/ss_zoom_9b6c587c.png) | ![Mobile](https://app.devin.ai/attachments/6095e2e0-e317-4649-a749-51e8dd47c0bd/ss_fc4ee6f6.png) |

Homepage full desktop view: ![Home](https://app.devin.ai/attachments/3498ecf2-6ccf-4b40-9033-ff1bedefec81/ss_1bbbfc13.png)

## Smoke (Regression, all passed)

- Homepage genre pills: 12 pills, fantasy 272 first, order unchanged.
- /series/discworld tracker: tick Mort → "2 of 55 read (4%)", Up next badge moved to Equal Rites; untick → restored to 1/55, badge back on Mort.
- /shelf stats cards intact: **10 / 3 / 7 / Mistborn** — ![Shelf](https://app.devin.ai/attachments/22ba51ea-66df-4b73-9ffc-8ad83287ccfa/ss_5ab4d6c4.png)

## Coverage notes

- R20 favicon: deployed `public/favicon.svg` contains `#9a6414` (source-verified); visually the tab icon is too small to judge color — not asserted as runtime-verified.
- R20 IndexNow resubmission: not independently verifiable from outside (no API access) — untested.
- The `aria-label` fixes were verified both by axe (landmark-unique gone) and in served HTML (`aria-label="Primary"` / `"Breadcrumb"` present).

## Recommended follow-ups (Round 21 candidates)

1. Footer amber links on dark background: use a lighter amber (e.g. the old `#c8842c` passes 3:1 for large text but for 14px links needs ≈`#d99a45`-range on `#1a1916`) or underline-only styling for dark-context links.
2. Bump remaining `text-ink-700/70` to `/75` (or 80) in the ~29 affected spots — /75 already passes.
