# Shelfmark Rounds 36–38 — production QA report

**Target:** https://shelfmark.zalize.com · deploy `7d993d3a` · PR #9 branch
**Method:** recorded live-browser pass (typeahead book suggestions, /series ordering + pagination + letter view, genre chips, mobile pill row, tracker regression) + shell-verified `/api/suggest` responses + headless axe-core 4.10.2 audit (Playwright Chromium, `bypass_csp=True`).
**Plan:** `/home/ubuntu/repos/shelfmark/test-plan-iter38.md`
**Recording:** `/home/ubuntu/screencasts/rec-e26202ab-9399-44ca-b6ca-c482cca5b2fe/rec-e26202ab-9399-44ca-b6ca-c482cca5b2fe-edited.mp4`
**Raw axe output:** `/tmp/axe_results_r38.json`

## Summary

All 12 checks passed. No escalations. No cache staleness observed — all R36–38 behavior was already live at test time.

## R36 — book-title suggestions in /api/suggest + typeahead

1. ✅ **Shell:** `GET /api/suggest?q=platform%20dec` → `[{"label":"Platform Decay","href":"/series/the-murderbot-diaries","kind":"book"}]`; `q=mistborn` → 1 series entry first + 3 book entries (all href `/series/mistborn`); `q=disc` → mixed series+book, total ≤ 8.
2. ✅ **Browser:** typing `platform dec` in the header search shows a visible dropdown entry **"Platform Decay"** with the small **book** kind label.

![Typeahead: Platform Decay with book label](https://app.devin.ai/attachments/6eaa2feb-9fd8-4c39-a3ef-dbbc39908439/ss_ac3a08a7.png)

3. ✅ **Keyboard nav:** ArrowDown highlights the book entry, Enter navigates to `/series/the-murderbot-diaries` (owning series page, not a search-results page).
4. ✅ **Mixed suggestions preserved:** `mistborn` → **Mistborn (series)** first, then 3 "Mistborn: …" **book** entries; clicking the series entry lands on `/series/mistborn` with the seeded 6/8 tracker state intact.

| "mistborn" mixed dropdown | Click → /series/mistborn |
|---|---|
| ![mistborn dropdown](https://app.devin.ai/attachments/655dbc35-6106-4db2-8d44-1d9aee6d2637/ss_946906c7.png) | ![mistborn page](https://app.devin.ai/attachments/5eb6106d-cfd5-4f0d-9b05-1afc63fa1693/ss_1b710f8e.png) |

## R37 — /series All view ordering

5. ✅ Page 1 headed "2,590 series, **best-documented first**. Page 1 of 44." Top cards: Kuroko's Basketball (275), Découvertes Gallimard, The Fragrant Flower Blooms with Dignity, One Piece, Ranma ½, Star Trek, Nancy Drew, Goosebumps… — **no xkcd / Lecture Notes in Computer Science / working-papers** anywhere on page 1.
6. ✅ Pagination: clicking **Next →** loads `/series?page=2` ("Page 2 of 44") continuing the descending book-count order (21-book series onward), with working Previous/Next links.
7. ✅ Letter view unchanged: `/series?letter=D` is alphabetical (D'Artagnan Romances, D.C. Detectives, D.Gray-man, Da Overcoming and Winning Series, Daedalus Mission…), mixing book counts freely — i.e. name order, not documented-first.

| All view page 1 (documented-first) | Page 2 via Next → | Letter D (alphabetical) |
|---|---|---|
| ![series p1](https://app.devin.ai/attachments/86ad7fa2-06b5-4c9c-ae7f-c565488e5461/ss_c033b811.png) | ![series p2](https://app.devin.ai/attachments/13492909-32aa-4012-8dfb-8090b7453293/ss_be75cbea.png) | ![letter D](https://app.devin.ai/attachments/dacdeb95-b4ca-4951-9e2d-af1db27e6265/ss_d1f5c434.png) |

## R38 — genre chips on series pages

8. ✅ `/series/mistborn` pill row shows a capitalized **Fantasy** chip (`text-transform: capitalize` computed); clicking it navigates to `/genres/fantasy` (272 fantasy series page).
9. ✅ `/series/the-murderbot-diaries` shows a **Science Fiction** chip; clicking navigates to `/genres/science-fiction`.
10. ✅ Negative case: `/series/xkcd` (no genre in data — 0 `/genres/` links in served HTML) shows **no genre chip** in its pill row (More by Randall Munroe · 3200 books · Share · Print list · Copy list only).

| Fantasy chip → /genres/fantasy | SF chip → /genres/science-fiction | xkcd: no chip |
|---|---|---|
| ![genres fantasy](https://app.devin.ai/attachments/f8158412-0f7a-4622-b7a5-2785f7f29230/ss_4c4d8ae6.png) | ![genres sf](https://app.devin.ai/attachments/8a0ad76e-36af-4758-bd8d-f289454d4e12/ss_c3ff3f32.png) | ![xkcd pill row](https://app.devin.ai/attachments/727b38c4-e2ca-453b-ba1c-07ce472c13b8/ss_zoom_fe5302b3.png) |

## Mobile spot-check

11. ✅ At 508 CSS px (narrowest available; <640 breakpoint): the mistborn pill row wraps to two rows with the Fantasy chip readable and clickable; **no horizontal overflow** — `document.documentElement.scrollWidth` 493 ≤ `innerWidth` 508.

| Mobile window | Pill row zoom |
|---|---|
| ![mobile](https://app.devin.ai/attachments/3cf84140-b1b6-43e3-9693-e9fe0f35f8aa/ss_45fd73ba.png) | ![pill row](https://app.devin.ai/attachments/424f751f-9705-483b-a8dd-9d8a2336fd29/ss_zoom_e51d368c.png) |

## Regression — tracker tick/untick

12. ✅ On `/series/mistborn` (seeded 6 of 8 read, 75%): ticking **The Lost Metal** → "7 of 8 read (88%)", progress bar grows, Up next badge moves to Secret History; unticking → exactly "6 of 8 read (75%)" with Up next back on The Lost Metal. No state residue; seeded shelf (10/3/7/Mistborn) untouched.

| 🟢 After tick: 7 of 8 (88%) | 🟢 After untick: 6 of 8 (75%) restored |
|---|---|
| ![tick](https://app.devin.ai/attachments/b64f9691-7824-4154-8dd2-e5a7e5c682bf/ss_zoom_fdaf5d54.png) | ![untick](https://app.devin.ai/attachments/73f33529-a6c8-4934-941d-eea10ac85f7a/ss_zoom_bc55be40.png) |

## Accessibility (axe-core 4.10.2)

Headless Playwright Chromium, `bypass_csp=True`, axe injected from cdnjs:

```
https://shelfmark.zalize.com/series           violations: 0
https://shelfmark.zalize.com/series/mistborn  violations: 0
```

✅ Zero-violation baseline holds on both pages (genre chip contrast/link semantics and the reordered index introduce no issues). Raw output: `/tmp/axe_results_r38.json`.

## Notes / limitations

- Result-cap ≤ 8 was verified via the API (`q=disc` returned ≤ 8) rather than by finding a query producing exactly 8 visible dropdown items.
- Axe was scanned without the typeahead dropdown forced open (combobox markup unchanged since R28's zero-violation scan with dropdown open).
