# Shelfmark Round 3 — Live Site Test Report (PR #3)

Target: **https://shelfmark.zalize.com** (production, branch devin/1754430000-round-3). New-feature + regression pass, recorded (desktop + 375px mobile).

## Results summary

| # | Test | Result |
|---|------|--------|
| 1 | Author bio: /authors/brandon-sanderson intro reads "Brandon Sanderson is an American fantasy writer (born 1975). …" | ✅ Pass |
| 2 | Book blurbs: gray Wikidata description lines under titles on series pages (Discworld, Mistborn, Warriors) | ✅ Pass |
| 3 | Duplicate-ordinal fix: /series/discworld numbering strictly sequential 1..61, no repeated "1." | ✅ Pass |
| 4 | Sub-series hierarchy: "Sub-series within Warriors" cards on parent; child shows "Part of Warriors" chip linking back | ✅ Pass (note: parent lives at **/series/warriors-2**; /series/warriors is an unrelated Roland J. Green series) |
| 5 | Covers: OL thumbnails render inline on Discworld (47 covers); cover-less rows align; no broken-image icons at zoom | ✅ Pass |
| 6 | Regression — series tracker: **prior Round-1/2 ticks LOST** (re-import changed book IDs); fresh ticks work + persist after reload ("2 of 9 read (22%)") | ❌ **Fail (P1)** |
| 7 | Regression — /shelf standalone group heading now links to /authors/brandon-sanderson (Round-2 P1 fixed, no 404) | ✅ Pass |
| 8 | Regression — home Popular series curated (Animorphs #1; Biographisches Lexikon gone) | ✅ Pass |
| 9 | Regression — /genres index (70+ genres, fantasy 279) | ✅ Pass |
| 10 | Regression — 375px mobile: Mistborn / /genres / Discworld covers page, no horizontal overflow (scrollWidth ≤ innerWidth); "Genres" now visible in mobile header (Round-2 P2 fixed) | ✅ Pass |
| 11 | Regression — /sitemap.xml → 200 listing sitemaps/1..6.xml | ✅ Pass |

## Issues (severity)

- **P1 — Data re-import orphaned all existing user reading progress.** localStorage stores ticks keyed by numeric book ID (`public/app.js` line 38, `data-book`), and the Round-3 import re-assigned IDs (stored `15080:Mistborn: The Final Empire` vs page now `134080:Mistborn: The Final Empire` — verified via console). Result: every series page shows 0 ticked for pre-Round-3 users; /shelf shows stale orphan entries that no longer correspond to any checkbox. Real users who tracked progress before this deploy silently lost it. Fix options: stable IDs across imports (e.g. keyed on Wikidata QID), or a client-side migration matching stored titles to new IDs.
- **P2 — "Warriors" slug ambiguity**: the Erin Hunter parent series is at `/series/warriors-2` while `/series/warriors` is a 6-book Roland J. Green series — confusing for the flagship sub-series demo and for SEO.
- **P2 — Warriors parent list mixes sub-series rows in as "books"** (e.g. "25. Warriors: A Vision of Shadows", "47. Warriors: Super Edition Series" appear as tickable books alongside novels). Same pattern on Discworld (items 55–61 are subseries rows).
- **P2 — "Publication order" ordering is scrambled on Discworld**: sequential fallback numbering shows 1. Mort (1987), 2. Theatre of Cruelty (1993), 3. The Wee Free Men (2003), 5. The Light Fantastic (1986) — the numbers are sequential but the order is neither publication nor internal order.

## Evidence

### 1. Author bio (new)
![Author bio intro](https://app.devin.ai/attachments/085f1c7c-0d09-4057-9f3a-ea812ee587f3/ss_04f170de.png)

### 2+3+5. Discworld: blurbs + sequential numbering + covers
| 🟢 Full page (covers, blurbs, 1..N) | 🟢 Zoom: gray blurbs, aligned rows, no broken icons |
|---|---|
| ![Discworld](https://app.devin.ai/attachments/0de57d83-c586-430f-a648-47e27c0b7130/ss_e87a5121.png) | ![Discworld zoom](https://app.devin.ai/attachments/65066dc0-fa79-4098-8369-b8dd664e8f0a/ss_zoom_1524a724.png) |

### 4. Sub-series hierarchy
| 🟢 Parent: "Sub-series within Warriors" cards | 🟢 Child: "Part of Warriors" chip (links back to parent) |
|---|---|
| ![Warriors parent](https://app.devin.ai/attachments/477568cf-cbf8-41f9-9656-569da56569c0/ss_4376303b.png) | ![Child chip](https://app.devin.ai/attachments/a08ca2b8-8633-49aa-b089-227a9f0b4e26/ss_188e5840.png) |

### 6. Tracker regression — P1 FAIL then fresh ticks OK
| 🔴 Prior ticks orphaned: Mistborn all unticked (shelf still lists them) | 🟢 Fresh ticks: "2 of 9 read (22%)" persists after reload |
|---|---|
| ![Orphaned ticks](https://app.devin.ai/attachments/2a8bc62b-480c-462c-b8db-0ee608d13bcd/ss_1969b863.png) | ![Fresh ticks persist](https://app.devin.ai/attachments/c796e01e-b8d4-49aa-b3c2-94a17ab57770/ss_312cebf8.png) |

Console proof of ID mismatch:
```
STORED: 13946:Mistborn: The Well of Ascension | 15080:Mistborn: The Final Empire | 55952:Warbreaker | 129458:The Way of Kings
PAGE mistborn ids: 134080:Mistborn: The Final Empire | 128212:Mistborn: The Well of Ascension | ...
```

### 7+8+9. Shelf link fix, home curation, genres (regression)
| 🟢 /shelf standalone heading → author page (no 404) | 🟢 Home Popular series curated (Animorphs #1) |
|---|---|
| ![Shelf fixed link](https://app.devin.ai/attachments/87b0d4b1-df77-46e5-a82d-7c4ce86aa5b7/ss_c240d30a.png) | ![Home curated](https://app.devin.ai/attachments/218b3c93-a8ae-4d2f-9155-1def8fd73067/ss_cfee8fda.png) |

![Genres index](https://app.devin.ai/attachments/6bf4f750-57ff-45c1-9369-0f622157a5fe/ss_b5837ddb.png)

### 10. Mobile 375px (Genres now in mobile header)
| 🟢 Mistborn tracker @375px | 🟢 Discworld covers @375px (no overflow, scrollW 485 ≤ innerW 500) |
|---|---|
| ![Mobile Mistborn](https://app.devin.ai/attachments/c3d2eaa9-d5c4-419a-bb91-638d55491cde/ss_a24627ea.png) | ![Mobile Discworld](https://app.devin.ai/attachments/f42ec08b-a16f-482e-96c6-29c5ff732247/ss_69a303ed.png) |

### 11. Sitemap (shell)
```
sitemap.xml -> 200
sitemaps/1.xml ... sitemaps/6.xml (6 chunks listed)
```
