# Test Report — Round 35: "New"/"Upcoming" chips on book list rows (deploy 52bdbe2c, PR #9)

**Target:** production https://shelfmark.zalize.com · deploy 52bdbe2c · branch devin/1786013619-iter6 (PR #9)
**Method:** recorded live browser pass on /series/the-murderbot-diaries and /authors/martha-wells (desktop + narrow width + print preview + tracker), plus headless axe-core 4.10.2 audit (Playwright Chromium, bypass_csp).
**Plan:** test-plan-iter35.md · **Recording:** /home/ubuntu/screencasts/rec-f9ce7d4b-28df-403a-88d7-19e6aca6e2f7/rec-f9ce7d4b-28df-403a-88d7-19e6aca6e2f7-edited.mp4 · **Raw axe:** /tmp/axe_results_r35.json · fix re-run: /tmp/axe_results_r35b.json

## Summary — ❌ 1 failure on 52bdbe2c → ✅ fixed & re-verified on 0e11b673

The chip feature works functionally and visually, **but on the original deploy (52bdbe2c) the axe zero-violation baseline was broken**: the New chip failed `color-contrast` (serious). A fix deploy (**0e11b673**) replaced the Tailwind utility classes with a dedicated `.year-chip` class (`color:#6d4708` on `background:#f0e6d6`, ≈7:1) and print-hides it via `@media print{.year-chip{display:none!important}}`. Headless axe re-run on /series/the-murderbot-diaries → **0 violations** — zero baseline restored (served markup confirmed: `<span class="year-chip">New</span>`).

Also two data/spec discrepancies vs the brief:
- The brief said "2 New chips" on /series/the-murderbot-diaries; the live page has **exactly 1** (Platform Decay, 2026). Rapport is 2025 → correctly no chip. Either the data changed or the brief miscounted; behavior matches spec (chip iff year == 2026).
- **No "Upcoming" chip exists anywhere reachable in production** (no book with year > 2026 found across all series linked from /new) — Upcoming is markup/code-only, runtime-untested.

## Results

| # | Check | Result |
|---|---|---|
| 1 | Desktop: amber "New" chip next to "Platform Decay (2026)"; no chip on Rapport (2025) or older rows | ✅ passed |
| 2 | Chip classes as specified (`bg-amber-accent/10 text-amber-accent print:hidden`, rounded-full) | ✅ passed |
| 3 | Mobile width (508px CSS): chip visible, row wraps sensibly, no overflow (scrollWidth 493 ≤ 508) | ✅ passed |
| 4 | Print preview: Platform Decay row shows year but **no chip** (print:hidden works) | ✅ passed |
| 5 | Tracker on badged book: tick → "1 of 11 read (9%)"; untick → restored, chip intact both ways | ✅ passed |
| 6 | Author page (/authors/martha-wells) shows the same chip via shared bookList | ✅ passed |
| 7 | Axe on /series/the-murderbot-diaries — zero baseline | ❌ failed on 52bdbe2c → ✅ **0 violations on fix deploy 0e11b673** |
| 8 | "Upcoming" chip (year > 2026) at runtime | ⚪ untested — no such book exists in production data |

## Axe failure detail (52bdbe2c, fixed on 0e11b673)

```
color-contrast (serious), 1 node:
<span class="ml-2 rounded-full bg-amber-accent/10 text-amber-accent text-xs font-semibold px-2 py-0.5 align-middle print:hidden">New</span>
Element has insufficient color contrast of 4.36
(foreground #9a6414, effective background #f5efe7 [amber-accent/10 over card], font 12px)
Expected contrast ratio of 4.5:1
```

Computed style confirmed live: color rgb(154,100,20), 12px, weight 600 (semibold — still "small text" for WCAG, so 4.5:1 applies). The chip is just barely short (4.36 vs 4.5). Fix options: darker text (e.g. amber-accent darkened ~5%), lighter chip background, or bump the chip text to ≥18.66px bold (not sensible for a chip) — darkening the foreground is the minimal fix.

Note: styles.css also contains a second `text-amber-accent{color:#e8b05f}` rule alongside `color:var(--color-amber-accent)` (#9a6414); the computed color is #9a6414, but the duplicate lighter definition in the rebuilt stylesheet may be worth a look.

## Evidence

**Desktop — New chip on Platform Decay (2026), none on 2025/older rows:**
![Desktop chip](https://app.devin.ai/attachments/64a3bd86-5746-4663-a793-5fc2dc68e5ce/ss_5f35031e.png)
![Chip zoom](https://app.devin.ai/attachments/0009b0ff-2e88-4fac-9b7c-7767f4df5f2b/ss_zoom_13f1f052.png)

| 📱 Mobile width (508px): chip fits, no overflow | 🖨️ Print preview: chip absent |
|---|---|
| ![Mobile](https://app.devin.ai/attachments/074e3319-0bb4-48dc-85f4-da2ee7e7c2be/ss_cf6e152f.png) | ![Print](https://app.devin.ai/attachments/af133bb4-7664-498f-8af1-0e2fdd4b99d2/ss_zoom_c6e5545e.png) |

| 🟢 Tick: checked, 1 of 11 read (9%) | 🟢 Untick: restored, chip intact |
|---|---|
| ![Tick](https://app.devin.ai/attachments/7b3062f0-5960-4b76-b3ea-83831d343bb7/ss_zoom_5dd02950.png) | ![Untick](https://app.devin.ai/attachments/04c33837-cc7f-40eb-bffb-0c5a518ed75e/ss_zoom_a6dd8efb.png) |

**Author page (shared bookList) — same chip:**
![Author page chip](https://app.devin.ai/attachments/34de8b6e-e6d0-40c1-bc00-7f206c1cbcf5/ss_15ea4f99.png)

## State restoration

Tracker mutation (Platform Decay tick) was reverted in-session; seeded baseline (10 books / 3 series) untouched — the murderbot series was at 0 read before and after.
