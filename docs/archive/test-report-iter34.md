# Test Report — Rounds 33–34: author-page Share/Print pills + genre ItemList JSON-LD (deploy be25e741, PR #9)

**Target:** production https://shelfmark.zalize.com, deploy be25e741, branch devin/1786013619-iter6
**Method:** recorded live browser pass on /authors/brandon-sanderson (pill row, print preview, Share clipboard, tracker regression) + shell verification of R34 ItemList JSON-LD + headless axe-core 4.10.2 audit of both pages (Playwright, bypass_csp).
**Plan:** `test-plan-iter34.md` · Raw axe output: `/tmp/axe_results_r34.json`
**Recording:** `/home/ubuntu/screencasts/rec-492163a5-5961-4365-a6fc-e9757c10e894/rec-492163a5-5961-4365-a6fc-e9757c10e894-edited.mp4`

## Summary

| # | Check | Result |
|---|---|---|
| 1 | R33: Share + Print list pills render under the author intro paragraph | ✅ passed |
| 2 | R33: Print list → clean print preview (6 pages), numbered lists across series, pills + checkboxes absent from printout | ✅ passed |
| 3 | R33: Share → "Link copied ✓" feedback, reverts to "Share" after ~2s | ✅ passed |
| 4 | R33: clipboard = https://shelfmark.zalize.com/authors/brandon-sanderson | ✅ passed |
| 5 | Regression: tracker tick The Lost Metal → Mistborn "7 of 8 read (88%)", Up next → Secret History; untick → "6 of 8 read (75%)", Up next → The Lost Metal | ✅ passed |
| 6 | Axe /authors/brandon-sanderson: zero violations | ✅ passed |
| 7 | Axe /genres/fantasy: zero violations | ✅ passed |
| 8 | R34 (shell): /genres/fantasy ItemList JSON-LD — numberOfItems 272, 60 itemListElement, first = Discworld position 1 → /series/discworld; ?page=2 first position 61 | ✅ passed |

## R33 — Share + Print list on author pages

Pills render directly under the intro paragraph (row div has `print:hidden`):

![Author page with Share + Print list pills](https://app.devin.ai/attachments/0e284f41-b1e7-4c70-bf2e-8b6a3996f652/ss_4aaa068c.png)

Clicking **Print list** opens Chrome print preview (6 pages) — the printout starts with the title/intro and flows straight into the numbered Mistborn list; **no Share/Print pills and no checkboxes** appear in the printout:

| Print preview (page 1 of 6) | Zoom: intro → list, pills absent |
|---|---|
| ![Preview](https://app.devin.ai/attachments/8901ef5d-63ee-4b43-ad52-c7962f4d0fb3/ss_bee2f7fc.png) | ![Zoom](https://app.devin.ai/attachments/ab189821-cb0c-42cf-a806-14819e227d15/ss_zoom_b299ac14.png) |

Clicking **Share** (desktop Chrome/Linux has no `navigator.share`, so the clipboard fallback is the expected path) flips the button to **"Link copied ✓"** and reverts to "Share" after ~2s:

| 🟢 "Link copied ✓" feedback | 🟢 Reverted to "Share" after ~2s |
|---|---|
| ![Copied](https://app.devin.ai/attachments/ed82da49-72a8-4b24-a19a-d3110c7d33f1/ss_zoom_0a7056c4.png) | ![Reverted](https://app.devin.ai/attachments/7a0469e6-79eb-440d-a398-9d249a161fba/ss_zoom_d1ad770f.png) |

System clipboard (read via `xclip -selection clipboard -o`): `https://shelfmark.zalize.com/authors/brandon-sanderson` — exact match.

## Regression — author-page tracker

| Tick The Lost Metal → 7/8 (88%) | Untick → restored 6/8 (75%) |
|---|---|
| ![Ticked](https://app.devin.ai/attachments/2f0621eb-82c2-4795-9bce-b81a934b3a13/ss_zoom_b4704516.png) | ![Restored](https://app.devin.ai/attachments/778084ab-60e0-4b00-bf33-09578f335536/ss_zoom_3e351dcb.png) |

Up next badge moved to Secret History on tick and back to The Lost Metal on untick (DOM-verified). Tracker state restored to the seeded baseline; no residue.

## R34 — Genre ItemList JSON-LD (shell-verified)

- /genres/fantasy: `ItemList` JSON-LD with `numberOfItems: 272` and **60 itemListElement** entries; first = `{position: 1, name: "Discworld", url: "https://shelfmark.zalize.com/series/discworld"}`.
- /genres/fantasy?page=2: first itemListElement `position: 61` — pagination offsets positions correctly.

## Axe (axe-core 4.10.2, Playwright + bypass_csp)

| Page | Violations |
|---|---|
| /authors/brandon-sanderson (with new pill row) | **0** ✅ |
| /genres/fantasy (with ItemList JSON-LD) | **0** ✅ |

Zero-violation baseline holds on both pages.
