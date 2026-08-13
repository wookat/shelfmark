# Shelfmark Rounds 91–95 — live production QA report

- **Site:** https://shelfmark.zalize.com (direct origin https://shelfmark.wookat520.workers.dev for authoritative checks)
- **Deploy:** 187823eb · branch `devin/1786031667-iter95` · PR #14
- **Date:** 2026-08-06
- **Recording:** `/home/ubuntu/screencasts/rec-f25d3c1e-85af-4668-bcf1-f3ebe7a356a2/rec-f25d3c1e-85af-4668-bcf1-f3ebe7a356a2-edited.mp4`
- **Raw axe results:** `/tmp/axe_results_r95.json`
- **Test plan:** `/home/ubuntu/repos/shelfmark/test-plan-iter95.md`

## Summary

All requested R91–R94 checks and regression checks **passed**. R95 is log-only and was not runtime-tested. One environment note: the main browser profile initially served the pre-R92 cached `app.js` (1h cache), so the pace chart did not render until a hard reload — the deployed asset was correct throughout (known stale-CSS/JS cache behavior, not a bug).

## R91 — Export/Import with saved list ✅

**Disposable incognito profile A:** ticked "Mistborn: The Final Empire" on /series/mistborn (1 of 8 read, 13%) and clicked "☆ Save for later" → "★ Saved for later".

![Profile A: ticked + saved](https://app.devin.ai/attachments/cf8ea60c-8f7d-48ab-8464-401a5739db1e/ss_zoom_2fdbccd6.png)

/shelf showed the book, the Saved for later grid, and (bonus) a pace chart with Aug=1. Clicked **Export JSON**:

![Profile A /shelf before export](https://app.devin.ai/attachments/ea0f23b6-7a38-4870-a728-50ebc4440aca/ss_f28443c5.png)

Downloaded `shelfmark-export (3).json` content — top-level `_saved` in `{slug:{name,t}}` shape plus the book entry:

```json
{
  "134080": { "t": 1786031941148, "title": "Mistborn: The Final Empire", "series": "Mistborn", "slug": "mistborn" },
  "_saved": { "mistborn": { "name": "Mistborn", "t": 1786031941427 } }
}
```

**Fresh incognito profile B** (all incognito windows closed first → clean storage; /shelf showed "Your shelf is empty", no pace card):

| 🔴 Before import: empty shelf, no pace card | 🟢 After import: progress + Saved for later + pace chart |
|---|---|
| ![Empty](https://app.devin.ai/attachments/04b72f06-197d-4bb0-840e-d90cde50f53c/ss_4fdd8029.png) | ![Restored](https://app.devin.ai/attachments/6cc96e8d-04c1-4268-9150-4f61d459bd49/ss_78205f09.png) |

Import JSON → file picker → selected the export; after auto-reload /shelf showed **Mistborn 1 read AND the "Saved for later" grid with Mistborn** — both restored. ✅

**Empty-saved export (main profile, saved list `{}`):** `shelfmark-export (4).json` keys = 10 book IDs only, `_saved present: False`. ✅

## R92 — Reading pace chart ✅

Main profile /shelf (after hard reload, see cache note) shows the **"Reading pace — last 12 months"** card: 12 labeled bars (Sep…Aug), Aug bar = **7**, matching the profile's 7 dated 2026-08 entries (5 Mistborn 8/6 + Light Fantastic 8/6 + Into the Wild 8/5); the legacy-timestamp entry ("Mistborn: The Final Empire", t ≤ 1e12) and the two 8/6/2025 Discworld entries (Aug 2025 falls before the Sep 2025–Aug 2026 window) are correctly excluded, leaving all other bars empty as expected.

Console check: container `role="img"`, `aria-label="Books read per month over the last 12 months"`, **12 child bars**.

![Pace chart, Aug=7](https://app.devin.ai/attachments/fbe09bf6-4648-44aa-82ee-96230e4a6ab5/ss_4f0a8520.png)

**Hidden when no dated entries:** fresh profile B before import showed no pace card (screenshot above, left). ✅

## R93 — /popular Top 100 ✅

Homepage "Popular series" section shows **"Top 100 →"** linking to /popular; footer Explore column includes **"Popular series"**:

![Homepage Top 100 link](https://app.devin.ai/attachments/0c2d30fe-ad08-44d2-8bdf-2419055e2658/ss_475f087d.png)

Clicked through → /popular renders h1 **"The 100 most popular book series"** with breadcrumb Home / Popular and 100 series cards (the tracked Discworld card even shows its filled progress bar):

![/popular](https://app.devin.ai/attachments/41d984af-01a7-4b9a-9588-7c53fc6e597a/ss_36e1f96d.png)

Shell (workers.dev + cache-bust): HTTP **200**, `data-progress-bar` card count = **100**, `BreadcrumbList: ['Home','Popular']`, **ItemList JSON-LD with 100 items** (first: /series/nancy-drew-mystery-stories), and `sitemaps/1.xml` contains `https://shelfmark.zalize.com/popular</loc>`. ✅

## R94 — Referrer analytics (shell) ✅

- `POST https://shelfmark.wookat520.workers.dev/api/hit` with body `"/x\ngoogle.com"` → **HTTP 204** (also 204 with harmless `"/\ngoogle.com"` on the earlier probe).
- Page beacon: on /series/mistborn, `performance.getEntriesByType('resource')` shows `https://shelfmark.zalize.com/api/hit | beacon`; browser console had **no errors**.
- DB row increment not checked per brief (user already verified).

## Regression ✅

- **Tracker:** /series/mistborn precondition 6/8 (75%) → tick The Lost Metal → **7 of 8 read (88%)** → untick → exact restore **6 of 8 read (75%)**.

| Ticked 7/8 (88%) | Restored 6/8 (75%) |
|---|---|
| ![Tick](https://app.devin.ai/attachments/2d7169a8-c610-4213-b24b-b422098414d4/ss_zoom_05ba2ecf.png) | ![Restore](https://app.devin.ai/attachments/a93c7bd7-3c01-4c16-9345-03093e3f978c/ss_zoom_2f98e9b4.png) |

- **Security headers** (workers.dev + cache-bust) unchanged: HSTS `max-age=31536000; includeSubDomains`, full CSP, Permissions-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Axe 4.10.2** (Playwright, bypass_csp, seeded shelf): light `/` 0, light `/shelf` 0, dark `/` 0, dark `/shelf` 0 violations. Raw: `/tmp/axe_results_r95.json`.

## R95

Log-only per brief — no runtime surface, **not runtime-tested**.

## Cleanup / state

Incognito contexts discarded. Main profile: tracker restored to canonical 6/8 Mistborn / 10 books, saved list remains `{}` (never mutated in main profile), no goal key added.
