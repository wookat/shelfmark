# Shelfmark Round 3b — P1 fix verification (PR #4, live site)

Code refs: public/app.js:19-45 (one-time migration via POST /api/migrate-ids, sets shelfmark_mig_v2, reloads if changed); src/index.ts:458 (endpoint). API pre-verified: {"15080":134080,"13946":128212}.

## T1 localStorage id migration (new)
- Console setup: set `shelfmark_read_v1` = {"15080":{"t":1,"title":"Mistborn: The Final Empire","series":"Mistborn","slug":"mistborn"}}; remove `shelfmark_mig_v2`.
- Load /series/mistborn. Pass: page auto-reloads once; checkbox for "Mistborn: The Final Empire" is ticked; label "1 of N read"; localStorage now has key "134080" and `shelfmark_mig_v2`="1".
- /shelf shows "Mistborn — 1 read — Mistborn: The Final Empire" (no orphan behavior for this entry).

## T2 Sub-series rows excluded (new)
- /series/discworld: no rows named "Tiffany Aching"/"Rincewind"/"Witches" etc. as tickable books; list has 60 rows. /series/warriors-2: no "#25 Warriors: A Vision of Shadows"/"#47 Super Edition" book rows.
- Note: header pill may still say "61 books" (stale book_count) — record if so.

## T3 Year ordering for duplicate-ordinal series (new)
- /series/discworld order starts 1. The Light Fantastic (1986), 2. Mort (1987), 3. Equal Rites (1987), 4. Sourcery (1988) — sequential numbers, non-decreasing years.

## T4 Fresh ticks unaffected (regression)
- On a page in a migrated browser (mig flag set), tick 1 Discworld book → label updates; reload → persists.
