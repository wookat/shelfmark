# Shelfmark Rounds 41–42 — production QA report (deploy d48426e6, PR #9)

**Scope:** live production https://shelfmark.zalize.com. R41: author-page ItemList JSON-LD + updated header search placeholder. R42: /new genre filter chips (case-insensitive `?genre=`, noindex on filtered views, invalid-genre fallback). Recorded browser pass + headless axe-core 4.10.2 audit. No product code modified.

**Verdict: all 12 checks passed. Axe: 0 violations on /new (All) and /new?genre=science%20fiction.**

## R42 — /new genre chips

### 1. Chips render on /new (All view) — ✅ passed
Chip row (`nav aria-label="Filter by genre"`) renders under the intro: **All** (dark/selected by default) + 18 genre chips, each with a count badge, sorted by count descending — romance novel 6, science fiction 4, then count-2 genres, then count-1. 31 items listed. No `robots` meta (indexable).

![/new All view: chip row, All selected, 31 items](https://app.devin.ai/attachments/1545b3bb-0129-40f0-b0ac-35783e7dc7dc/ss_ad2b6362.png)

### 2. Click "science fiction" → filtered view — ✅ passed
URL becomes `/new?genre=science%20fiction`; exactly **4 items**, all sci-fi series (The Murderbot Diaries, Lily Starling ×2, Time's Shadow); the Science Fiction chip flips to dark (`bg-ink-900 text-ink-50`), All reverts to white. DOM check: `<meta name="robots" content="noindex,follow">` present.

![Filtered: 4 sci-fi items, chip highlighted](https://app.devin.ai/attachments/a495fab5-02ab-4b29-b257-3d2e1cdd7435/ss_35b27fbc.png)

### 3. Click "All" → reset — ✅ passed
Back to `/new`: **31 items**, All chip dark again, and DOM check confirms `robots` meta = **none** (no noindex).

![All reset: 31 items, no noindex](https://app.devin.ai/attachments/c8e81e5f-f8ff-4b3c-bf99-09918bf6d503/ss_185f39ef.png)

### 4. Mixed-case genre ("Nordic noir") + case-insensitivity — ✅ passed
Clicking the visible **Nordic Noir 1** chip (`?genre=Nordic%20noir`, raw mixed-case value) → 1 item (Sateenvarjomies / Vares), chip dark. Then navigated directly to lowercase `/new?genre=nordic%20noir` → **same 1 item, same highlighted chip** — case-insensitive matching confirmed.

| Chip click (raw "Nordic noir") | Lowercase URL, same result |
|---|---|
| ![Chip](https://app.devin.ai/attachments/3c90efed-0935-4f86-8f2a-d6ecface5f2d/ss_05fd28eb.png) | ![Lowercase](https://app.devin.ai/attachments/d6349d50-ceb2-4a7d-8ae4-9a59f17b4868/ss_da5b3101.png) |

### 5. Invalid `?genre=zzz` → falls back to All — ✅ passed
`/new?genre=zzz` renders the full All view: **31 items**, All chip selected/dark, DOM `robots` meta = none (invalid filter is not noindexed).

![zzz fallback: All view, 31 items](https://app.devin.ai/attachments/a9c5d768-8760-45b2-991b-802b8353a97e/ss_0e2d2039.png)

## R41 — author JSON-LD + placeholder

### 6. /authors/brandon-sanderson ItemList JSON-LD — ✅ passed
Parsed live in-browser: `@type: ItemList`, name **"Book series by Brandon Sanderson"**, `numberOfItems: 6`, 6 elements in book_count order with URLs:

```
1 Mistborn (8) → /series/mistborn
2 Alcatraz Versus the Evil Librarians (6) → /series/alcatraz-versus-the-evil-librarians
3 Secret Projects (5) → /series/secret-projects
4 Skyward series (5) → /series/skyward-series
5 The Reckoners (4) → /series/the-reckoners
6 Legion series (3) → /series/legion-series
```

![Author page](https://app.devin.ai/attachments/81f13bed-1925-430d-b9df-137524dfad95/ss_c0648443.png)

### 7. Header placeholder (desktop) — ✅ passed
Header search input visibly shows **"Search series, authors, books…"** on desktop pages (verified visually; also present on /new, /authors/brandon-sanderson, homepage).

![Desktop header placeholder zoom](https://app.devin.ai/attachments/62ba9fbc-5202-4a55-a30e-873484658cb2/ss_zoom_23372051.png)

### 8. Mobile search box placeholder — ✅ passed
At 508px CSS width the mobile header search box shows the same **"Search series, authors, books…"** (DOM `placeholder` confirmed identical).

## Mobile spot-check

### 9. /new chips wrap without overflow — ✅ passed
508px CSS viewport: chips wrap to 7 rows, all readable/clickable; `document.scrollWidth` 493 ≤ `innerWidth` 508, chip-row scrollWidth 461 → **no horizontal overflow**.

![Mobile /new: wrapped chips + placeholder](https://app.devin.ai/attachments/8b438b98-e9cb-4598-9de8-69da3ac600a7/ss_9f3d42a2.png)

## Accessibility

### 10–11. Axe (axe-core 4.10.2, Playwright Chromium, bypass_csp) — ✅ passed
- `/new` (All view, chips rendered): **0 violations**
- `/new?genre=science%20fiction` (filtered, dark selected chip): **0 violations**

Raw output: `/tmp/axe_results_r42.json` (script `/tmp/axe_r42.py`).

## Regression

### 12. RSS link on /new — ✅ passed
"RSS feed" link (underlined, `href="/new.rss"`) still present; clicking it serves valid RSS 2.0 with atom:link self, 31 items, each linking to its `/series/...` page.

![RSS feed served](https://app.devin.ai/attachments/aa1cd874-880e-4c32-b28e-80daa7b0c1a2/ss_84652085.png)

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-26a2abff-d23a-4490-a1ff-80de55b57573/rec-26a2abff-d23a-4490-a1ff-80de55b57573-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter42.md`
- Raw axe: `/tmp/axe_results_r42.json`

## Notes / honesty
- No edge-cache staleness encountered — all R41/R42 changes were live at test time.
- Print-hidden behavior of the chip row was verified via the `print:hidden` class in served markup, not via a fresh print preview this round.
- No tracker state was mutated; seeded shelf state (10/3/7, Mistborn) untouched.
