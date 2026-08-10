# Shelfmark Rounds 71–75 — Production QA Report

**Target:** https://shelfmark.zalize.com (deploy `419a600b`, branch devin/1786024515-iter66, PR #12)
**Method:** recorded browser pass (FAQ, search avatars, goal set/edit/clear via native prompt, reading-card PNG downloads, tracker regression) + shell verification (JSON-LD, degrade cases via workers.dev + cache-bust, security headers) + headless axe-core 4.10.2.
**Recording:** `/home/ubuntu/screencasts/rec-73b39110-876b-417a-8fc8-dacd70d8490c/rec-73b39110-876b-417a-8fc8-dacd70d8490c-edited.mp4`
**Raw axe output:** `/tmp/axe_results_r75.json` · **Plan:** `/home/ubuntu/repos/shelfmark/test-plan-iter75.md`

## Results summary

| # | Check | Result |
|---|---|---|
| R71 | Brandon Sanderson FAQ visible (3 Q&As) | ✅ |
| R71 | FAQPage JSON-LD matches visible content | ✅ |
| R71 | Graceful degrade (janci-patterson: 1 Q, no longest-series Q) | ✅ |
| R72 | Search avatar cards (photo + initial placeholder), layout intact | ✅ |
| R73 | Set goal 12 → "2026 reading goal: 7 of 12 books" + amber progressbar + aria | ✅ |
| R73 | localStorage `shelfmark:goal:2026` = 12; cleared → key removed | ✅ |
| R73 | Edit goal → 0 clears back to Set-goal state | ✅ |
| R74 | Reading-card PNG subline "books read · 3 series · 2026 goal 7/12" | ✅ |
| R74 | No-goal card subline unchanged ("books read · 3 series") | ✅ |
| Regression | Tracker tick 7/8 (88%) → untick restore 6/8 (75%) | ✅ |
| Regression | Axe 0 violations: author page + /shelf (goal card visible) | ✅ |
| Regression | Security headers unchanged (workers.dev + cache-bust) | ✅ |

## R71 — Author-page FAQ

Visible "Brandon Sanderson FAQ" section with exactly 3 Q&As:
- *How many books has Brandon Sanderson written?* → "60 books on record across 6 series."
- *What is the most recent Brandon Sanderson book?* → "“Moment Zero” (2025)."
- *What is Brandon Sanderson's longest series?* → "Mistborn, with 8 books published 2006–2022."

FAQPage JSON-LD (fetched via workers.dev + cache-bust) contains exactly these three Q&As, matching the visible dt/dd text.

![Brandon Sanderson FAQ section](https://app.devin.ai/attachments/e78e0da6-c88a-4433-9c78-4c53df69df60/ss_bef2538f.png)

**Degrade case:** `/authors/janci-patterson` (no qualifying series) shows a FAQ with only 1 question (how many books) — no longest-series question. `/authors/randall-munroe` (has series) shows all 3. Shell-verified.

## R72 — Search avatar cards

`/search?q=sanderson` Authors section renders the shared avatar card: round 48px Commons photo for Brandon Sanderson. `/search?q=lin+carter` shows two author cards with initial-letter placeholders ("L", "J"); cards aligned, no overflow.

| Photo avatar | Initial placeholders |
|---|---|
| ![Sanderson search card](https://app.devin.ai/attachments/e00286be-a8a5-4789-b324-233105f54934/ss_b755c8a4.png) | ![Lin Carter placeholders](https://app.devin.ai/attachments/6715738d-0bf8-4d90-b74b-81bd3b621f44/ss_zoom_b1342dfd.png) |

## R73 — Yearly reading goal

- Precondition: main profile /shelf shows stats grid (10 read / 3 series / 7 read in 2026 / Mistborn) with goal card in Set-goal state under it.
- "Set goal" → native prompt "How many books do you want to read in 2026?" (default 24). Entered **12** → card shows **"2026 reading goal: 7 of 12 books"** + amber progress bar.
- ARIA verified: `role=progressbar`, `aria-valuenow=7 aria-valuemin=0 aria-valuemax=12 aria-label="Yearly reading goal"`. localStorage `shelfmark:goal:2026` = `"12"`.
- "Edit goal" → prompt reopened → entered **0** → card returned to Set-goal state; key removed (null).

| Set-goal state | Prompt | Goal active (7/12 + amber bar) | Cleared |
|---|---|---|---|
| ![Set goal](https://app.devin.ai/attachments/358845fc-cc23-45a8-b6f4-d73a8db0b36e/ss_4f115440.png) | ![Prompt](https://app.devin.ai/attachments/4b56d7f6-638e-4166-9ad9-dafd366f0589/ss_2f2a6929.png) | ![Goal active](https://app.devin.ai/attachments/804e67bd-3e04-41e8-bf5b-8cd52b0d5e49/ss_zoom_21f43eaa.png) | ![Cleared](https://app.devin.ai/attachments/102a0558-4161-4d5f-a3aa-eea3fffe2d7f/ss_zoom_2caccb87.png) |

## R74 — Reading-card PNG goal subline

Downloaded the actual PNGs (not DOM inference):

| 🟢 With goal: "books read · 3 series · 2026 goal 7/12" | 🟢 Without goal: "books read · 3 series" (unchanged) |
|---|---|
| ![Card with goal](https://app.devin.ai/attachments/b59bf77f-09b5-4370-abb3-6d951490d668/shelfmark-reading-card%20%281%29.png) | ![Card no goal](https://app.devin.ai/attachments/65c17777-6e93-46d6-95b3-a04a46c0a541/shelfmark-reading-card%20%282%29.png) |

**Honesty note:** the ✓-when-goal-met variant was NOT exercised (7 read < 12 goal; meeting it would have required destructive ticking of 5+ extra books in the main profile). Untested.

## Regression

- **Tracker** (/series/mistborn): tick The Lost Metal → 7 of 8 (88%), Up next → Secret History; untick → exact restore 6 of 8 (75%), Up next → The Lost Metal.

| Ticked 7/8 (88%) | Restored 6/8 (75%) |
|---|---|
| ![Tick](https://app.devin.ai/attachments/3c9507a0-8276-42d8-9115-bc74cf3d47b4/ss_zoom_49b1004c.png) | ![Restore](https://app.devin.ai/attachments/643b73a0-f6e3-4e29-9a24-3bdcda18fc76/ss_zoom_eba0c1fd.png) |

- **Axe 4.10.2** (Playwright, bypass_csp): `/authors/brandon-sanderson` → **0 violations**; `/shelf` with goal card visible (seeded `shelfmark_read_v1` + `shelfmark:goal:2026` in a fresh context; asserted "2026 reading goal" text rendered before scan) → **0 violations**. Raw: `/tmp/axe_results_r75.json`.
- **Security headers** (workers.dev + cache-bust): HSTS `max-age=31536000; includeSubDomains`; CSP (img-src incl. commons/upload.wikimedia.org); Permissions-Policy `camera=(), microphone=(), geolocation=(), payment=()`; `X-Frame-Options: DENY`; `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin` — all unchanged.

## Cleanup

Goal key cleared (back to Set-goal state), tracker restored to 6/8 baseline, downloaded PNGs left in ~/Downloads.
