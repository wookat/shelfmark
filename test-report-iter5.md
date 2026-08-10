# Shelfmark Round 5 — live regression (deploy 3f801e9c)

Tested against production https://shelfmark.zalize.com in Chrome (recorded, desktop + narrow-width mobile). Code refs: src/index.ts:447 (/new curation query), src/html.ts:43-45 (og:image/twitter meta), src/index.ts:295 (series first-cover -L.jpg override).

## Summary

| # | Check | Result |
|---|---|---|
| 1 | /new: xkcd/Munroe rows gone, real 2026/2027 fiction remain | ✅ passed |
| 1b | /new: pamphlet noise gone | 🔴 **failed** — "Singapore as Model for Ukraine Russia Peace" (Russian + Ukrainian editions) still lead the 2026 list |
| 2 | /new covers/placeholder tiles render, series links work | ✅ passed |
| 3 | /new mobile ~375px no horizontal overflow | ✅ passed (scrollWidth 485 ≤ innerWidth 500) |
| 4 | og meta `/`: og.png + summary_large_image | ✅ passed |
| 5 | og meta /series/discworld: cover -L.jpg + twitter:card summary | ✅ passed |
| 6 | og meta /series/mistborn: fallback og.png + summary_large_image | ✅ passed |
| 7 | /og.png loads as 1200×630 image | ✅ passed |
| 8 | Smoke: home renders, search works, tracker tick persists | ✅ passed |

## 1. /new curation (partial)

`curl` + DOM search: **0 matches for "Munroe" and "xkcd"** — the Round-4 xkcd flood is gone. Real fiction entries present: Yona of the Dawn Vol 47, Murderbot Diaries "Platform Decay" (Martha Wells), The Singing Hills Cycle (Nghi Vo), Time's Shadow (Neal Asher), Tamzin Pook (Philip Reeve), The Apothecary Diaries, etc. Covers and initial-letter tiles render; series links navigate correctly.

🔴 **However, the pamphlet noise is NOT fully gone:** the 2026 section still *leads* with two "Singapore as Model for Ukraine Russia Peace: Proactive Leadership, Mediation and Hard Work" editions ("Mediation for Life and Peace" by David Hoicka), and the list is heavily dominated by self-published bulk series that pass the new filters — 34 rows by Sotiris Spyrou alone (Safety Spotters ×~20, "Full Marks Press: AI Study Guides" ×13), plus "The Algorithmic Monographs" ×5. These are attributed series with 2–80 books and non-excluded genres, so the query keeps them.

![/new top of 2026 list — Singapore pamphlets still lead](https://app.devin.ai/attachments/3bd1f132-bd25-4c21-96ee-da9ad57459ea/ss_99308b6a.png)

## 2. og:image / twitter meta (all passed)

curl-extracted meta, confirmed in view-source:

- `/`: `og:image` = `https://shelfmark.zalize.com/og.png`, `twitter:card` = `summary_large_image`, `twitter:image` = og.png ✅
- `/series/discworld`: `og:image` = `https://covers.openlibrary.org/b/id/14648805-L.jpg`, `twitter:card` = `summary`, `twitter:image` = same -L.jpg ✅
- `/series/mistborn` (no covers): falls back to og.png + `summary_large_image` ✅

| 🟢 Discworld view-source (cover -L.jpg + summary) | 🟢 Mistborn view-source (og.png fallback + summary_large_image) |
|---|---|
| ![Discworld meta](https://app.devin.ai/attachments/8922e77d-8a7f-42a9-872f-32c4e8a8f7fe/ss_zoom_669a5511.png) | ![Mistborn meta](https://app.devin.ai/attachments/b7c46aa9-fee5-4f02-a1ee-a9a9833c480a/ss_zoom_0d4eee77.png) |

## 3. /og.png (passed)

Loaded directly in browser: branded Shelfmark card, Chrome tab title reads "og.png (1200×630)".

![og.png 1200×630](https://app.devin.ai/attachments/92a9f4ca-3f55-4491-b243-e6b1977b1ea6/ss_a551f8ea.png)

## 4. Smoke regression (passed)

- Home renders hero, Popular series, curated Prolific authors.
- Search "discworld" → Series (Discworld, The Science of Discworld) + Books sections, no "Nothing found" line.
- Tracker: ticked "Mistborn: The Hero of Ages" → "3 of 8 read (38%)"; persisted after F5.

| 🟢 Search results | 🟢 Tick persists after reload |
|---|---|
| ![Search](https://app.devin.ai/attachments/9da616f1-28df-4c7f-a029-0c2cafbe2883/ss_0d14c59e.png) | ![Tracker](https://app.devin.ai/attachments/5975dbc3-cf06-4c18-bdd7-38b002fc2a46/ss_zoom_963dddbb.png) |

## 5. /new mobile (passed)

Narrow window: rows stack, scrollWidth 485 ≤ innerWidth 500, no horizontal overflow.

![Mobile /new](https://app.devin.ai/attachments/94341059-fe9d-49e6-98e4-9a41cd946ed4/ss_9f16e2f5.png)

## Artifacts
- Recording: /home/ubuntu/screencasts/rec-af9da2f4-b54f-4f4f-aa82-6122d63439af/rec-af9da2f4-b54f-4f4f-aa82-6122d63439af-edited.mp4
- Plan: /home/ubuntu/repos/shelfmark/test-plan-iter5.md
