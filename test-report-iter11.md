# Shelfmark Round 11 — did-you-mean 404 suggestions (production, deploy f6d7fa75, PR #6 commit d9d5b4e)

**Scope:** live QA of the new "Were you looking for one of these?" suggestions on series/author 404 pages, plus the pre-filled search link, garbage-slug fallback, existing-page regression, and 375px layout. Tested at https://shelfmark.zalize.com in a recorded browser pass (desktop maximized + ~375px window) with curl for HTTP status codes. Plan: `test-plan-iter11.md`.

## Results

| # | Test | Result |
|---|---|---|
| 1 | /series/mistborn-trilogy → 404 + Mistborn suggested, link works | ✅ passed |
| 2 | "searching" link pre-fills ?q= from slug | ✅ passed (UX note below) |
| 3 | /authors/brandon-sandersen → Brandon Sanderson first, link works | ✅ passed |
| 4 | Garbage slug /series/zzzz-qqqq → plain 404, clean markup | ✅ passed |
| 5 | Existing page /series/mistborn unaffected (Regression) | ✅ passed |
| 6 | ~375px 404 layout, no overflow | ✅ passed |

### 1. Series 404 with suggestions
`/series/mistborn-trilogy` returns HTTP **404** (curl-verified) and renders "Page not found" + "Were you looking for one of these?" with exactly 5 links, **Mistborn by Brandon Sanderson first** (then Sprawl trilogy, Dragon Prince…, Manifold Trilogy, Merlin Trilogy — trilogy-token matches, popularity-ranked). Clicking Mistborn lands on `/series/mistborn` with the full 8-book list and tracker state intact ("6 of 8 read (75%)").

| 404 with suggestions | Click → /series/mistborn (Regression: page unaffected) |
|---|---|
| ![404 suggestions](https://app.devin.ai/attachments/ecc94275-b625-42f6-99f7-3374521a2978/ss_7c8dc91e.png) | ![Mistborn page](https://app.devin.ai/attachments/98bf5a46-704f-4e30-a93c-d35e265544c9/ss_919702ed.png) |

### 2. Pre-filled search link
The "searching" link href is `/search?q=mistborn%20trilogy`; clicking it opens the search page with heading "Results for “mistborn trilogy”".

**UX note (P3, not a spec failure):** that exact pre-filled query returns "Nothing found" — the search treats the phrase strictly, so "mistborn trilogy" doesn't match the Mistborn series. The suggestion links above compensate, but the search-link fallback is weaker than it looks.

![Pre-filled search](https://app.devin.ai/attachments/dc5d2709-7376-47b9-b7b4-7ee6e3200d26/ss_fc006848.png)

### 3. Author 404 with suggestions
`/authors/brandon-sandersen` returns HTTP **404** with **Brandon Sanderson first** of 5 author suggestions, and the search link is exactly `/search?q=brandon%20sandersen`. Clicking Brandon Sanderson lands on `/authors/brandon-sanderson` ("Brandon Sanderson Books in Order", 60 books across 6 series).

| Author 404 | Click → author page |
|---|---|
| ![Author 404](https://app.devin.ai/attachments/be2c7b96-1259-4c53-a7fc-aefa0752e774/ss_d923d317.png) | ![Sanderson page](https://app.devin.ai/attachments/03814599-83e3-49f7-9e45-001a84f3ca63/ss_4a4c68a1.png) |

### 4. Garbage slug
`/series/zzzz-qqqq` → HTTP **404**, plain "Page not found" with only the "Try searching" line — no "Were you looking" block, no empty `<ul>`, no broken markup. (Search link still pre-fills `?q=zzzz%20qqqq`, harmless.)

![Plain 404](https://app.devin.ai/attachments/4a1bab22-f1b2-47ac-a04d-8ef23d7e4c81/ss_da729902.png)

### 5. Regression — existing page
`/series/mistborn` returns HTTP **200** (curl) and renders normally with tracker state intact (see screenshot in §1).

### 6. Mobile ~375px
The mistborn-trilogy 404 at 375px width: suggestion links wrap cleanly, all readable; `scrollWidth 485 <= innerWidth 500` — no horizontal overflow.

![375px 404](https://app.devin.ai/attachments/b23ff600-61a6-4ed9-98ed-c02f4578fb89/ss_ab2fda14.png)

## HTTP statuses (curl, Mozilla UA)
```
series/mistborn-trilogy   -> 404
authors/brandon-sandersen -> 404
series/zzzz-qqqq          -> 404
series/mistborn           -> 200
```

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-10a1f616-5d2e-44d0-b415-c0eb5731e943/rec-10a1f616-5d2e-44d0-b415-c0eb5731e943-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter11.md`
