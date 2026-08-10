# Shelfmark Round 3b — P1 fix verification (PR #4, live https://shelfmark.zalize.com)

Scope: localStorage id migration, sub-series row exclusion, year-ordering for duplicate-ordinal series, fresh-tick regression. Recording: `/home/ubuntu/screencasts/rec-8b41178f-4652-4c2a-9df7-cc2514c566b9/rec-8b41178f-4652-4c2a-9df7-cc2514c566b9-edited.mp4`.

## T1 localStorage id migration — PASSED
- Seeded via console: `shelfmark_read_v1 = {"15080":{"t":1,"title":"Mistborn: The Final Empire","series":"Mistborn","slug":"mistborn"}}`, removed `shelfmark_mig_v2`.
- Loaded `/series/mistborn`: migration ran, page reloaded, tick restored on the correct book with **"1 of 9 read (11%)"**.
- localStorage after: key `134080` (old `15080` gone), `shelfmark_mig_v2 = "1"`. API pre-check: `POST /api/migrate-ids {"ids":["15080","13946",...]}` → `{"13946":128212,"15080":134080}`.
- `/shelf`: "Mistborn — 1 read — Mistborn: The Final Empire", **no orphaned groups**.

![Mistborn tick restored after auto-migration](https://app.devin.ai/attachments/558b8d4b-e35b-4c6c-bb25-0446c3c6e809/ss_24dbb36b.png)
![Shelf shows migrated entry, no orphans](https://app.devin.ai/attachments/742c0e75-e753-4a8b-9828-0ca086238173/ss_77548754.png)

- Note (P2): unmapped ids (e.g. old `55952` Warbreaker, `129458` The Way of Kings were NOT in the API map) are left in place by app.js and the flag is still set — such entries stay orphaned forever. Not exercised in this run's UI but visible in the API response + code (public/app.js:19-45).

## T2 Sub-series rows excluded from parent lists — PARTIAL FAIL
- Discworld: list is now 60 rows (was 61) and the requested items pass numerically, **but rows 55–60 still include tickable sub-series entries**: "Death", "Rincewind", "Tiffany Aching", "Witches" (all labeled "Discworld books subseries"). Header pill still says **"61 books"** (stale book_count) while the list has 60 rows.
- Warriors `/series/warriors-2`: former #25 "Warriors: A Vision of Shadows" and #47 "Super Edition" rows are **gone** (now in the "Sub-series within Warriors" card section) — this part passes. But 6 arc rows remain tickable (#14 Power of Three, #21 Omen of the Stars, #28 The Prophecies Begin, #30 The New Prophecy, #35 Dawn of the Clans, #41 Changing Skies), and the pill says "47 books" vs 41 actual rows.
- Cause: the fix filters only books whose `wikidata_id` exists in the `series` table (src/index.ts:216); sub-series not imported as series rows slip through. Severity: P2.

![Discworld rows 55-60 still show subseries entries](https://app.devin.ai/attachments/63ba1105-33d0-4b78-b627-4b2f4e3a36ae/ss_36ce3a80.png)

## T3 Year ordering + sequential numbering — PASSED
- Discworld runs 1. The Light Fantastic (1986), 2. Mort (1987), 3. Equal Rites (1987), 4. Sourcery (1988), 5. Wyrd Sisters (1988)… — non-decreasing years, sequential 1..60 (undated subseries rows sort last).

![Discworld year-ordered 1986/1987/1987/1988](https://app.devin.ai/attachments/d276b344-c3b4-452d-9d99-7c89c090f8f7/ss_81f3582e.png)

## T4 Fresh ticks regression — PASSED
- On `/series/warriors-2` (post-migration browser), ticked "Into the Wild" → label "1 of 41 read (2%)"; after F5 reload the tick and label persist.

![Warriors parent without #25/#47 series rows](https://app.devin.ai/attachments/05759e18-a492-4c02-bfa3-3963283f5a0f/ss_70bafb3e.png)
![Fresh tick persists after reload](https://app.devin.ai/attachments/816687d5-496f-49cf-8645-e3e51577ca79/ss_zoom_f8ef92db.png)

## Issue summary
- P2: sub-series exclusion incomplete — Discworld still lists Death/Rincewind/Tiffany Aching/Witches as tickable books; Warriors keeps 6 arc rows.
- P2: header "N books" pill uses stale `book_count` (61 vs 60 rows; 47 vs 41 rows) and progress denominator uses the filtered list, so users see "1 of 41 read" under a "47 books" pill.
- P2: migration leaves unmapped old ids in localStorage and sets the flag anyway — permanently orphaned shelf entries possible for books missing from `id_migrations`.
