# Rounds 13+14 live QA — "Up next" badge + sitemap letter URLs

Production https://shelfmark.zalize.com, deploy 95b44ab3 (PR #6 branch, commit 84002cb `Round 14: 'Up next' badge marks first unread book in partially-read series`). Recorded browser pass, desktop + ~375px; sitemap validated in-browser plus curl/minidom.

Code refs: `public/app.js` updateSeriesUI — removes all `.up-next-badge` then, when `0 < read < total`, inserts an amber `Up next` pill after the first unchecked book's `.font-medium` title (per `ol[data-series]` list, on init and every change). `public/styles.css`: `.up-next-badge` pill + `@media print { display:none!important }`. Deployed assets curl-verified to contain both.

## Results

| # | Assertion | Result |
|---|---|---|
| 1 | Badge renders on first unread book on page load with partial progress (Discworld 2/55 → badge on #3 Equal Rites) | ✅ passed |
| 2 | Tick moves badge to next unread instantly (tick #3 → badge to #4 Sourcery, single badge) | ✅ passed |
| 3 | Untick all → badge gone, progress label empty, no orphan markup | ✅ passed |
| 4 | Tick book 1 → badge on book 2 (Mort); F5 reload → badge persists on Mort | ✅ passed |
| 5 | Author page multi-list independence (Mistborn 6/8 badge on #7 Lost Metal; ticking Alcatraz #1 puts its badge on Alcatraz #2 without moving Mistborn's; 0-read lists have no badge) | ✅ passed |
| 6 | Print preview hides the badge (#7 Lost Metal row clean) | ✅ passed |
| 7 | ~375px: badge fits on its row, scrollWidth 485 ≤ innerWidth 500, no overflow | ✅ passed |
| 8 | R13: /sitemaps/1.xml parses in browser as valid XML with 52 `?letter=` URLs (authors+series A–Z) | ✅ passed |

Notes:
- Fully-read-series case (badge never shown at 100%) exercised implicitly only via code path (`read < boxes.length` guard); not separately demonstrated on a fully ticked list.
- Untick behavior in step 3 also re-placed badges correctly at each intermediate step.

## Evidence

| Badge on first unread at load (2/55 → Equal Rites) | Tick #3 → badge moves to Sourcery |
|---|---|
| ![Load](https://app.devin.ai/attachments/01b6db66-99fc-4691-8a94-8b2bbd1ce8e8/ss_zoom_16c44d8c.png) | ![Move](https://app.devin.ai/attachments/2c4f0cc2-98e0-4e64-a2fe-a8a774e97b17/ss_zoom_438260ca.png) |

| 🔴 All unticked — no badge | 🟢 Tick #1 → badge on Mort (persists after F5) |
|---|---|
| ![None](https://app.devin.ai/attachments/b52da92a-4100-4371-96c2-0c93d629528e/ss_zoom_bbb3037b.png) | ![Mort](https://app.devin.ai/attachments/9a9984fd-f4da-40c3-90cd-284f45b40b24/ss_zoom_ef108c7c.png) |

Author page independence — Mistborn badge stays on #7 while Alcatraz gets its own on #2:

![Independence](https://app.devin.ai/attachments/6b208d2f-854e-4b91-b186-184162c31864/ss_zoom_eed6b6f5.png)

| Print preview: no badge on #7 (badge visible on page behind) | ~375px: badge fits, no overflow (485 ≤ 500) |
|---|---|
| ![Print](https://app.devin.ai/attachments/f1859ace-0c07-4e27-90ff-db1170db2cc2/ss_9cedd691.png) | ![Mobile](https://app.devin.ai/attachments/d823372c-4130-44da-9d13-710eb2b4c28f/ss_bede05c9.png) |

R13 sitemap — parsed XML tree with 52 `?letter=` matches:

![Sitemap](https://app.devin.ai/attachments/9d4db918-107d-474e-90c3-5330aeabbc07/ss_7e12f5b0.png)

## Artifacts

- Recording: `/home/ubuntu/screencasts/rec-8cef953e-8bdf-423e-82ab-44a0331e5121/rec-8cef953e-8bdf-423e-82ab-44a0331e5121-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter14.md`
