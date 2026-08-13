# Round 15 live QA — paginated genre pages (deploy 40f91fb3, PR #7 commit 234ea60)

Production https://shelfmark.zalize.com, branch devin/1786007000-iter3 (PR #6 merged; commit `234ea60 Round 15: paginate genre pages`). Recorded browser pass, desktop + ~375px; curl for canonical links.

Code refs: src/index.ts /genres/:slug — `COUNT(*)` total, `LIMIT PAGE_SIZE OFFSET (page-1)*60` popularity-ranked, H1 `— Page N` for page>1, intro uses total (old code capped at LIMIT 200 and showed results.length), `paginationQ` Previous/Next, canonical bare on page 1 and `?page=N` beyond.

## Results

| # | Assertion | Result |
|---|---|---|
| 1 | /genres/fantasy: intro "279 fantasy series" (not 200-capped), 60 popularity-ranked cards (Discworld 55 first), Next only, plain H1 | ✅ passed |
| 2 | Clicked Next through 2→3→4→5: intermediate pages show Prev+Next, popularity order continues across pages; page 5 H1 "— Page 5", 39 cards, Previous only | ✅ passed |
| 3 | Canonicals (curl): page 1 bare `/genres/fantasy`, page 5 `/genres/fantasy?page=5` | ✅ passed |
| 4 | Card click from page 2: The Lunar Chronicles → /series/the-lunar-chronicles with 5-book list | ✅ passed |
| 5 | Small genre /genres/detective-fiction: 19 cards, no Previous/Next, plain H1 | ✅ passed |
| 6 | ~375px on ?page=5: cards single-column, Previous visible, scrollWidth 485 ≤ innerWidth 500 | ✅ passed |
| 7 | Regression — Round 14 badge after deploy: tick Cinder on Lunar Chronicles → amber "Up next" on Scarlet, "1 of 5 read (20%)"; unticked to restore | ✅ passed |

## Evidence

| Page 1 — 279 series, 60 cards, Next only | Page 5 — "— Page 5", still "279 series" |
|---|---|
| ![Page1](https://app.devin.ai/attachments/bbdfd4b6-6ff6-4321-814d-485a9423156f/ss_93964541.png) | ![Page5 H1](https://app.devin.ai/attachments/5bc846c4-3ea7-4f26-9b72-cd51c5f382b8/ss_zoom_33dd43ff.png) |

| Page 5 bottom — 39 cards end, Previous only | Card click from page 2 → series page |
|---|---|
| ![Page5 end](https://app.devin.ai/attachments/97b25044-341c-4e0c-b36c-5e7d335389f9/ss_0f3b5670.png) | ![Lunar](https://app.devin.ai/attachments/8cf8e42d-7978-4a20-9105-040b2196207c/ss_f2574dd5.png) |

| Small genre — 19 cards, no controls | ~375px page 5 — single column, no overflow |
|---|---|
| ![Detective](https://app.devin.ai/attachments/a7134294-b955-4a83-8870-5234f71ca298/ss_3a7028c5.png) | ![Mobile](https://app.devin.ai/attachments/9b93d362-f5f8-423c-98ec-f341df33a91f/ss_e2830ed3.png) |

Regression — badge still works after deploy:

![Badge](https://app.devin.ai/attachments/cf279a79-4617-43c7-8d43-a03790cec105/ss_zoom_5ee08d3d.png)

## Notes

- Tail of page 5 exposes 0-book series entries (e.g. "The Riftwar Cycle · 0 books", "Ulldart · 0 books") — previously hidden past the LIMIT 200 cutoff; now user-visible. Data-quality observation, not a pagination bug.
- Tracker state left clean: Cinder untick verified in localStorage (no Lunar Chronicles entries; 10 pre-existing entries intact).

## Artifacts

- Recording: `/home/ubuntu/screencasts/rec-1cefe101-2e4e-4675-9fff-06d490da4bd6/rec-1cefe101-2e4e-4675-9fff-06d490da4bd6-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter15.md`
