# Test Report — Rounds 26–28 (deploy 01918a89, PR #8 commits 74ddb0b / ea3d827 / 3d3a118)

**Target:** production https://shelfmark.zalize.com
**Scope:** R26 /genres counts exclude 0-book series; R27 "Print list" button on series pages; R28 ARIA combobox typeahead + mobile "New" nav link; axe re-audit on / and /search?q=discworld; tracker/shelf regression smoke.
**Method:** recorded live browser pass (maximized Chrome, plus a narrow ~528px CSS window for the mobile check); headless Playwright + axe-core 4.10.2 (bypass_csp + add_script_tag) for the accessibility re-audit; browser console only for invisible ARIA/overflow measurements.

**Overall: all requested checks passed.** No console errors; tracker state restored exactly.

---

## 1. R26 — /genres counts (PASS)

- `/genres` fantasy card shows **272 series** (was 279 before the fix).
- `/genres/fantasy` intro: "**272** fantasy series with complete reading orders." — exact match.
- Spot-check 2: science fiction card **196** ↔ (matches homepage pill 196); horror fiction card **12** ↔ `/genres/horror-fiction` intro "**12** horror fiction series…" and exactly 12 cards listed.

| /genres index (fantasy 272 first) | /genres/fantasy intro = 272 | /genres/horror-fiction intro = 12 |
|---|---|---|
| ![Genres index](https://app.devin.ai/attachments/0e5f6a12-6f22-4726-a318-ac5e09655b92/ss_5d847154.png) | ![Fantasy 272](https://app.devin.ai/attachments/53b37658-70da-4fcf-9946-f38c695f7548/ss_zoom_82c71b15.png) | ![Horror 12](https://app.devin.ai/attachments/1fe0e775-7d54-4055-9c03-2a01e38a034b/ss_zoom_332280d4.png) |

## 2. R27 — Print list button (PASS)

- `/series/discworld` pill row renders **"Print list" directly next to Share**: `More by Terry Pratchett · 55 books · Share · Print list · 1 of 55 read (2%)`.
- Clicking the button opened Chrome's print preview (7 pages). Preview shows the clean numbered book list; nav/search/checkboxes/progress label are hidden, and the pill row in the printout contains only "More by Terry Pratchett" and "55 books" — **Share and Print list are absent** (`print:hidden` works).
- Cancelled the dialog; page unchanged.
- Note: my first click landed in the gap between pills and did nothing (visible in the recording); the second, on-target click opened the preview immediately.

| Pill row with Print list next to Share | Print preview: clean list, buttons absent |
|---|---|
| ![Pill row](https://app.devin.ai/attachments/d6802a13-61dc-4335-a650-cc35b4830dbf/ss_zoom_588e0007.png) | ![Print preview](https://app.devin.ai/attachments/cf90dd9a-084a-4e37-a793-23b7a43db1c8/ss_70227ca7.png) |

## 3. R28a — ARIA combobox typeahead (PASS)

Header form on /series/discworld:

- Precondition (console): `{"role":"combobox","expanded":"false","autocomplete":"list","controls":"suggest-box-1","activedesc":null}`.
- Typed "disc" → dropdown appeared with **Discworld · series first**, then Discovery, Discrete Mathematics…; `aria-expanded` flipped to `"true"`.
- ArrowDown ×2 → 2nd option (Discovery) visibly highlighted (grey bg-ink-100); DOM: `aria-activedescendant="suggest-box-1-opt-1"`, Discovery `aria-selected="true"`, others `"false"` — options have unique ids.
- Enter → navigated to **/series/discovery** (the highlighted item, not /search).

| Dropdown open, Discovery highlighted (aria-selected=true) | Enter landed on /series/discovery |
|---|---|
| ![Combobox](https://app.devin.ai/attachments/d597c472-ba26-4434-9597-e3f39b4d2740/ss_48aa93d5.png) | ![Discovery](https://app.devin.ai/attachments/1f3e37b6-2fd4-433f-b0d5-6262677f1ac7/ss_zoom_1805d3a7.png) |

## 4. R28b — Mobile "New" nav link (PASS)

Narrow window (innerWidth **528** CSS px < 640 breakpoint):

- Header nav renders `Series · Authors · Genres · New · My Shelf` on one row — **New visible** (computed `display:block`, no `hidden`).
- No overflow: `scrollWidth 513 ≤ innerWidth 528`; no wrapping of the nav row.

| Mobile homepage with New in nav | Zoomed header row |
|---|---|
| ![Mobile](https://app.devin.ai/attachments/d8aed349-b7cb-4203-a459-f442eab9e1dc/ss_5418489a.png) | ![Header zoom](https://app.devin.ai/attachments/536bc512-2aaa-4f03-9b63-3f7008d12027/ss_zoom_3109713c.png) |

## 5. Axe re-audit — / and /search?q=discworld (PASS)

Playwright + bypass_csp + add_script_tag (axe-core 4.10.2), with the combobox **forced open** on both pages before scanning (typed "disc" + ArrowDown; verified `aria-expanded="true"` at scan time):

```
"https://shelfmark.zalize.com/": [],
"https://shelfmark.zalize.com/::expanded": "true",
"https://shelfmark.zalize.com/search?q=discworld": [],
"https://shelfmark.zalize.com/search?q=discworld::expanded": "true"
```

**Zero violations of any kind** — no new aria-* rules from the combobox markup; the R21 zero-violation baseline holds. Raw output: `/tmp/axe_results_r28.json`, script `/tmp/axe_r28.py`.

## 6. Regression — tracker + shelf smoke (PASS)

- Ticked Equal Rites on /series/discworld → "2 of 55 read (4%)"; unticked → back to "1 of 55 read (2%)".
- /shelf stats cards intact: **10 books read / 3 series followed / 7 read in 2026 / Mistborn most-read**, with correct Up next slots (Mistborn → The Lost Metal, Warriors → Fire and Ice, Discworld → Mort). No localStorage restore needed.

| Tick registered 2/55 then reverted | /shelf 10/3/7/Mistborn with Up next |
|---|---|
| ![Tick](https://app.devin.ai/attachments/26a723ad-d6a8-4d34-8a0e-9ce92a0d671b/ss_zoom_9435a2a3.png) | ![Shelf](https://app.devin.ai/attachments/5d879ada-3295-4994-b59f-bd7d1d0510cb/ss_b9ae4695.png) |

---

## Artifacts

- Recording: `/home/ubuntu/screencasts/rec-fdaa18d1-3ea9-4588-9b90-561d2f4696ac/rec-fdaa18d1-3ea9-4588-9b90-561d2f4696ac-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter28.md`
- Raw axe output: `/tmp/axe_results_r28.json`

## Coverage notes

- Only the header combobox instance was keyboard-exercised end to end; hero and mobile forms received the same aria wiring per the served app.js (form-loop) and the R25 run proved those forms functionally — not re-proven this round.
- The plain-Enter-without-highlight fallback was not re-run this round (unchanged code path, verified in R25).
- Print output was verified via Chrome's print preview, not a physical/PDF print.
