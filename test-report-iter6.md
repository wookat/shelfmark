# Shelfmark Round 6 live QA — series FAQ section + FAQPage JSON-LD (deploy 006eb147)

Tested against production https://shelfmark.zalize.com with a recorded browser pass (desktop + ~375px window) plus shell (curl/python) for JSON-LD extraction and validation. Plan: `test-plan-iter6.md`. Code refs: src/index.ts:259-265 (FAQ generation), :284 (visible section), :301-311 (FAQPage JSON-LD).

## Verdict

5 of 6 checks passed. **1 failure: the Discworld FAQ's "first book" answer contradicts the page's own book list** ("Mort" (1987) vs list row #1 "The Light Fantastic" (1986)). Root cause identified in code (see below).

## 🔴 Failure — Discworld FAQ first-book answer wrong

The visible FAQ card and the FAQPage JSON-LD both say:

> The series starts with “Mort” (1987).

but the page's own publication-order list starts with **1. The Light Fantastic (1986)** (Mort is #2). The count/span (55 books, 1986–2015), latest ("The Shepherd's Crown" (2015)) and author (Terry Pratchett) answers are all correct.

| 🔴 FAQ says first book is “Mort” (1987) | 🔴 …but list row #1 is The Light Fantastic (1986) |
|---|---|
| ![Discworld FAQ](https://app.devin.ai/attachments/e5d98fe8-b7de-461d-a0ca-747523f10ea4/ss_zoom_c9c5cf03.png) | ![Discworld list top](https://app.devin.ai/attachments/fd66265f-cbb4-4565-a594-adf93c768bb5/ss_8ab9ee13.png) |

**Root cause (code inspection, not patched):** `bookList()` (src/index.ts:322-323) re-sorts the books **by year** when the series has duplicate `position` values (Discworld's case, from the Round-3 duplicate-ordinal fallback), but the FAQ's `const first = books[0]` (src/index.ts:259) is computed from the **raw DB order** (`ORDER BY position, year, id`). In the raw order Mort sorts first (position tie broken differently), while the displayed list is year-sorted and starts with The Light Fantastic. Any series that triggers the duplicate-position re-sort can show a first-book FAQ answer that contradicts its own list. Fix suggestion: compute `first` from the same sorted array `bookList` renders (hoist the dup-position sort before FAQ generation).

## ✅ Mistborn FAQ — accurate

All 4 cards match the page's own 8-book list: first = “Mistborn: The Final Empire” (2006) = list row #1; count = 8 books, published 2006–2022 (matches "8 books" pill and list years); most recent = “Mistborn: The Lost Metal” (2022) = highest-year row; author = Brandon Sanderson. Rendered as a `<dl>` of Q/A cards after the "If you like Mistborn…" section.

![Mistborn FAQ section](https://app.devin.ai/attachments/ae3091ef-dbf1-439b-8a36-6e347eaa64ea/ss_e6a9b024.png)

## ✅ FAQPage JSON-LD present and valid (with the same Discworld inaccuracy)

Extracted all `application/ld+json` blocks from /series/mistborn, /series/discworld and /series/fortress via curl+python:

- 3 LD blocks per page (BookSeries, BreadcrumbList, FAQPage); all parse as valid JSON.
- FAQPage: `@type: "FAQPage"`, `mainEntity` is an array; every entry is `@type: "Question"` with nonempty `name` and `acceptedAnswer` of `@type: "Answer"` with nonempty `text` (assert-verified).
- JSON-LD Q/A text matches the visible FAQ cards exactly on all three pages — which means the Discworld "Mort" error is also emitted to search engines.

```
== mistborn  | ld blocks: 3 | FAQPage: True   (4 Questions, all valid)
== discworld | ld blocks: 3 | FAQPage: True   (4 Questions, valid; first-book answer = “Mort” — wrong)
== fortress  | ld blocks: 3 | FAQPage: True   (3 Questions — no author question)
```

## ✅ Graceful degradation — author-less series (/series/fortress)

Fortress (87 books, no author) renders exactly 3 FAQ cards — first book, count/span, most recent — with **no "Who writes…" card** and no `undefined`/`null`/empty card in either the visible section or the JSON-LD. (No single-book series was found in the visible catalog samples; the `latest !== first` suppression is code-verified only — the closest live proof is that the most-recent question renders only with a distinct title.)

![Fortress FAQ — 3 cards, no author question](https://app.devin.ai/attachments/f7e9cb97-6587-4714-8026-87852a3f09cb/ss_20889b25.png)

## ✅ Mobile ~375px — no overflow

/series/mistborn in a 375px-wide window: FAQ cards stack full-width, question/answer text wraps; `document.documentElement.scrollWidth` 517 ≤ `window.innerWidth` 532 (browser chrome makes the inner viewport report slightly larger than the window, as in previous rounds).

![FAQ at narrow width](https://app.devin.ai/attachments/02129d75-57bc-4db1-9432-45d1b816f078/ss_1d8bf2b9.png)

## ✅ Smoke — tracker persistence + print

- Ticked "Mistborn: The Alloy of Law" → progress went "3 of 8 read (38%)" → **"4 of 8 read (50%)"**; state and count persisted after F5.
- Ctrl+P print preview of /series/mistborn (3 pages): header/footer/forms/checkboxes/progress bar/Share chip all still hidden, white background; the FAQ prints as clean cards on pages 2–3 with **no clipping or layout break** (FAQ in print is allowed per spec).

| Tracker persisted after reload | Print preview — FAQ prints cleanly |
|---|---|
| ![Tracker](https://app.devin.ai/attachments/3a895e25-7310-436b-955f-e4b3a862a746/ss_zoom_2a254c91.png) | ![Print FAQ](https://app.devin.ai/attachments/402e3059-41f6-4655-8c06-46e6646f287a/ss_b38764ff.png) |

## Results summary

| # | Check | Result |
|---|---|---|
| 1a | Mistborn FAQ visible + accurate vs own list | ✅ passed |
| 1b | Discworld FAQ accurate vs own list | 🔴 **failed** (first book = “Mort”, list starts with The Light Fantastic) |
| 2 | FAQPage JSON-LD valid on both (+ fortress) | ✅ passed (structure valid; carries the same Discworld inaccuracy) |
| 3 | Graceful degradation (no-author series) | ✅ passed (single-book case untested — none found in catalog samples) |
| 4 | Mobile ~375px FAQ, no overflow | ✅ passed (517 ≤ 532) |
| 5 | Smoke: tracker tick persistence | ✅ passed |
| 6 | Smoke: print preview unbroken | ✅ passed |

## Artifacts

- Recording: `/home/ubuntu/screencasts/rec-534e28fb-3d81-4712-b547-8d4ecc53b58d/rec-534e28fb-3d81-4712-b547-8d4ecc53b58d-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter6.md`
