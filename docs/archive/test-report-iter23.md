# Round 23 Live QA — bulk "Mark all read" / "Clear progress" buttons

**Target:** production https://shelfmark.zalize.com, deploy `018cc8ac`, PR #7 branch `devin/1786007000-iter3`, commits `18da3b5` (R22) + `87cbdb7` (R23).
**Method:** recorded live browser regression on `/series/discworld` (55 books), `/shelf`, `/authors/brandon-sanderson`, `/series/dragonlance-heroes`, desktop + narrow (~375-style) viewport. Console used only for the invisible checks (localStorage backup/restore, timestamp comparison, overflow measurement). Tracker state was backed up before testing (`/tmp/shelf_backup_r23.json`) and restored verbatim afterwards.

## R22 spot checks (shell only — user already curl-verified)

- `curl -w '%{http_code}' 'https://shelfmark.zalize.com/genres/fantasy?page=99'` → **404** ✅
- `curl 'https://shelfmark.zalize.com/search?q=discworld' | grep noindex` → `noindex,follow` ✅

## R23 results

| # | Check | Result |
|---|---|---|
| 1 | Buttons render below the 55-book list, pill-styled, desktop | ✅ passed |
| 2 | Mark all read → 55/55 (100%), no Up next badge; /shelf shows Discworld books | ✅ passed |
| 3 | Clear progress → all unticked, progress cleared; entries removed from /shelf | ✅ passed |
| 4 | Partial interplay: 2 pre-ticked books keep original timestamps after Mark all read; counts right, no errors | ✅ passed |
| 5 | Print preview hides the buttons (`print:hidden`) | ✅ passed |
| 6 | Buttons absent on a 1-book series (`/series/dragonlance-heroes`) | ✅ passed |
| 7 | Author page: exactly one pair per multi-book list, pairs fully independent | ✅ passed |
| 8 | ~375px narrow viewport: buttons fit below list, no horizontal overflow (scrollWidth 517 ≤ innerWidth 532) | ✅ passed |
| 9 | State restoration: /shelf back to 10 / 3 / 7 / Mistborn | ✅ passed |

## Evidence

**Partial state before bulk (2/55, Up next on Equal Rites) → after Mark all read (55/55, no badge):**

| 🔴 Before: 2 of 55 read (4%) | 🟢 After: 55 of 55 read (100%) |
|---|---|
| ![Partial 2/55](https://app.devin.ai/attachments/e81aa490-1b92-409f-930e-95d10b228a3a/ss_d64fa63f.png) | ![55/55 after bulk](https://app.devin.ai/attachments/aad96201-ffaa-4e57-88fe-27374b3a2800/ss_cbe8e0a2.png) |

**Timestamp preservation (console, not overwritten by bulk):**

```
PRE:  147536 "The Light Fantastic" t=1786009970917 · 181101 "Mort" t=1786009971240
POST: count=57 discworld entries · 147536.t=1786009970917 · 181101.t=1786009971240 · preserved=true
```

**Print preview — book #55 flows straight into "More series", buttons absent from the printout (they are visible on the page behind the dialog):**

![Print page 6, no buttons](https://app.devin.ai/attachments/97ed02cd-fd82-4b23-94a6-53b65fcfbde9/ss_zoom_e6522bb8.png)

**Author-page independence — Alcatraz bulk → 6/6 while Mistborn stays 6/8 with its Up next badge; then Mistborn Clear progress → 0 while Alcatraz stays 6/6:**

| 🟢 Alcatraz 6/6, Mistborn untouched 6/8 | 🟢 Mistborn cleared, Alcatraz still 6/6 |
|---|---|
| ![Independent bulk](https://app.devin.ai/attachments/00c8e731-8c6c-4d08-863a-e7a51d9d1560/ss_9a93cf2e.png) | ![Independent clear](https://app.devin.ai/attachments/e59aca25-58d3-415c-a1b4-2057a8813042/ss_f0065cf4.png) |

Each of the 7 lists on /authors/brandon-sanderson has exactly ONE `Mark all read` + `Clear progress` pair (DOM-verified — no duplicates).

**Narrow viewport + 1-book series:**

| 🟢 Buttons below #55, no overflow (517 ≤ 532) | 🟢 1-book series: no bulk buttons |
|---|---|
| ![Mobile](https://app.devin.ai/attachments/0e35c260-c184-4135-a67f-1e51e0a55d9c/ss_09cd3e75.png) | ![1-book](https://app.devin.ai/attachments/128cfe09-626e-4196-8e95-6e180d9de23b/ss_2623330e.png) |

**Final restoration — /shelf stats identical to pre-test baseline:**

![Restored 10/3/7/Mistborn](https://app.devin.ai/attachments/24493bbf-7970-4e44-9a70-b8a10bf4e01f/ss_67443484.png)

## Notes

- Mid-test, /shelf transiently showed 9/3/6 after clearing the bulk Discworld progress — this was expected state during testing (one of the 3 original Discworld entries, The Light Fantastic, was legitimately deleted by Clear progress and later restored). Final restored state is exactly the original 10/3/7/Mistborn with all timestamps intact.
- No console errors at any point during bulk operations.
- 0-book series case not exercised (the R16 filter keeps 0-book series out of listings; the 1-book case proves the `boxes.length > 1` gate).

## Artifacts

- Recording: `/home/ubuntu/screencasts/rec-d5642f7e-ce65-499a-aa05-2c885a965efe/rec-d5642f7e-ce65-499a-aa05-2c885a965efe-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter23.md`
- State backup: `/tmp/shelf_backup_r23.json`
