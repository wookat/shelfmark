# Test Report — Round 25: Search typeahead (deploy 291c2160, PR #8 commit ed36577)

Live production QA on https://shelfmark.zalize.com. Recorded browser pass of the new search typeahead dropdown (header desktop, homepage hero, mobile header <640px), keyboard navigation, close behaviors, console health, plus a tracker/shelf regression smoke. API `/api/suggest` was spot-checked by shell (user had already curl-verified it).

**Overall: all requested checks passed.** One minor behavioral note (not a failure): Escape on the `type="search"` input closes the dropdown but the browser's native search-input Escape also clears the typed text — expected native behavior, mentioned for completeness.

## Environment
- Production deploy 291c2160, PR #8 branch commit ed36577
- Deployed app.js contains typeahead code (grep-verified); `/api/suggest?q=disc` → 200, `cache-control: public, max-age=3600`, results Discworld → Discovery → Discrete Mathematics and Its Applications (all series); `q=d` (1 char) → `{"results":[]}`
- Seeded tracker state: 10 books / 3 series (Mistborn, Warriors, Discworld)

## Results

### 1. Header search: "disc" → dropdown, Discworld first, click navigates — ✅ passed
Typed "disc" in the desktop header form on /series. Dropdown appeared below the input with **Discworld · series** first, then Discovery, then Discrete Mathematics and Its Applications (matches API order). Clicking Discworld navigated to /series/discworld.

| Dropdown open (Discworld first) | After click → /series/discworld |
|---|---|
| ![Header dropdown](https://app.devin.ai/attachments/9e831557-5029-4d85-aefa-94a1c579f00e/ss_3975bd76.png) | ![Discworld page](https://app.devin.ai/attachments/cbb05ecd-f1ee-4722-b985-503bce2daa9b/ss_be75f884.png) |

### 2. Homepage hero form works — ✅ passed
Typed "disc" in the hero form on `/`: the same dropdown rendered attached to the hero form (see screenshot below, which also shows keyboard highlight).

### 3. Keyboard navigation — ✅ passed
- ArrowDown ×2 → **2nd item "Discovery" visibly highlighted** (bg-ink-100 grey row): ![Highlight](https://app.devin.ai/attachments/bf0a5ed2-5c0d-44c3-9eb7-8dd190c59464/ss_f53b3ca2.png)
- Enter → navigated to **/series/discovery** (the highlighted item, not the first item, not /search): ![Discovery page](https://app.devin.ai/attachments/dca13a58-dda1-4677-b769-871e40cc3d5f/ss_516611d6.png)
- Escape with dropdown open → dropdown closed (note: native search-input Escape also cleared the text)
- Plain typing "pratchett" + Enter with no highlight → normal form submit to **/search?q=pratchett** results page: ![Search results](https://app.devin.ai/attachments/79cebb25-7837-4937-87f1-ef2899149b36/ss_9de57fb4.png)

### 4. Mobile header form (~375px / <640px) — ✅ passed
Resized window so viewport innerWidth=528 (<640, mobile header form active with nav row above). Typing "disc" showed the dropdown fully visible, no clipping. Measured: `scrollWidth=513 ≤ innerWidth=528`, visible listbox right edge 513 — **no horizontal overflow**.

![Mobile dropdown](https://app.devin.ai/attachments/9dfde022-fec4-4bb2-a648-10d955838faf/ss_362a04ac.png)

### 5. Click outside closes — ✅ passed
With the dropdown open on the header form (/search page), clicked the page background → dropdown closed, input text retained.

| 🔴 Dropdown open | 🟢 After click outside |
|---|---|
| ![Open](https://app.devin.ai/attachments/e4f1dca6-ddba-434c-8205-3c0f6711fa82/ss_6bbc82cf.png) | ![Closed](https://app.devin.ai/attachments/7d6d6c94-392f-4863-9d28-0e4284e99bc6/ss_c0a7d112.png) |

### 6. Console/CSP health — ✅ passed
Browser console checked after all typeahead fetches and interactions: **zero errors, CSP violations, or failed requests**.

### 7. Regression smoke: tracker + shelf — ✅ passed
On /series/discworld ticked Equal Rites → progress updated 1/55 (2%) → **2/55 (4%)**; unticked to restore. /shelf renders intact: stats cards **10 / 3 / 7 / Mistborn**, Up next slots correct (Mistborn: The Lost Metal, Fire and Ice, Mort).

![Shelf intact](https://app.devin.ai/attachments/70c8b03f-a106-4476-af85-ad8e23217f89/ss_263efaf6.png)

## Accessibility semantics
Dropdown container is `role=listbox`, options are `a[role=option]` (verified in live DOM).

## Artifacts
- Recording: /home/ubuntu/screencasts/rec-59235306-7195-4198-8058-759bf96ded44/rec-59235306-7195-4198-8058-759bf96ded44-edited.mp4
- Plan: /home/ubuntu/repos/shelfmark/test-plan-iter25.md
