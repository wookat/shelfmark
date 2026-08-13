## ✅ Rounds 86–90 live QA — dark mode, /random, hotkey, Save for later all green (after 1 contrast fix)

Tested against production https://shelfmark.zalize.com, deploys 4b729b6c → 99ce72c3 (recorded in Devin session).

**🟠→🟢 R86 dark mode:** initial axe run in dark emulation on / flagged **1 serious color-contrast violation** — the inverted `bg-ink-900` section's "My Shelf" link (`#9a6414` on `#f2efe6`) hit 4.34:1, below AA. Fixed to `#8f5d12`, redeployed (99ce72c3), re-checked: **axe dark mode 0 violations**, link now computes to **4.88:1**. Dark rendering itself is correct on / and /series/mistborn — dark page/cards, legible amber, dark-variant year chips and "Up next" badge, filled progress bar:

| 🟢 Dark homepage | 🟢 Dark series header (chips, 75% bar) | 🟢 Inverted section after fix |
|---|---|---|
| ![Dark home](/home/ubuntu/screenshots/ss_7dd46879.png) | ![Dark series](/home/ubuntu/screenshots/ss_zoom_cec52832.png) | ![Fixed section](/home/ubuntu/screenshots/ss_dcd56d02.png) |

**🟢 R89 Save for later:** ☆→★ toggle with `aria-pressed`, `shelfmark_saved_v1` persistence, /shelf grid in recency order with working Remove, section fully gone when empty (verified after reload; main profile left clean):

| 🟢 /shelf "Saved for later" grid | 🟢 Empty after removes + reload |
|---|---|
| ![Grid](/home/ubuntu/screenshots/ss_157d5ae3.png) | ![Empty](/home/ubuntu/screenshots/ss_1777975a.png) |

**🟢 R87:** 3× `/random` → 302 to three different `/series/{slug}` with `no-store` + `x-robots-tag: noindex`; robots.txt `Disallow: /random`; homepage "surprise me with a series" link clicks through to a random series.

**🟢 R88:** manifest shortcuts `[/shelf, /new, /random]`; "/" focuses header search from anywhere, but typing `test/` in the footer email input is untouched (no focus steal).

<details><summary>Regression (all green)</summary>

Tracker: tick → 7/8 (88%), untick → exact restore 6/8 (75%). Security headers unchanged (workers.dev + cache-bust). Axe light mode: 0 violations on / and /shelf (seeded).
</details>

_R85/R90 are log-only (health checks + IndexNow)._
