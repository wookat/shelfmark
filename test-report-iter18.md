# Shelfmark Round 18 — homepage genre pills + accessibility audit report

**Deploy:** production 730f2e8d · PR #7 branch `devin/1786007000-iter3` (commit 48f8a9a "Round 18: homepage Browse-by-genre pills section")
**Environment:** https://shelfmark.zalize.com. R18 regression: recorded browser pass (desktop + ~375px). Accessibility audit: axe-core 4.10.2 run headlessly (Playwright chromium with CSP bypass — the site's `script-src 'self'` CSP correctly blocks in-page CDN injection) plus manual keyboard checks in the real browser.
**Plan:** /home/ubuntu/repos/shelfmark/test-plan-iter18.md

## Part 1 — R18 regression (all passed)

### 1. Pills render — ✅ PASSED

"Browse by genre" section appears between "New & upcoming" and "Prolific authors" with exactly 12 pills — fantasy 272, science fiction 196, children's literature 47, historical fiction 33, high fantasy 23, detective fiction 18, comics of the United States 18, crime literature 14, thriller 13, space opera 12, romance novel 12, horror fiction 12 (all ≥10, descending) — plus the "All genres →" link.

![Homepage Browse by genre pills](https://app.devin.ai/attachments/943efe5f-f1f0-43f2-8d43-2fec9766197c/ss_b6504026.png)

### 2. Pill navigation + count consistency — ✅ PASSED

Clicked the "fantasy 272" pill → landed on /genres/fantasy whose intro reads "272 fantasy series with complete reading orders." — pill count matches the genre page total exactly.

![Fantasy page after pill click — 272](https://app.devin.ai/attachments/765d54fc-488c-493f-9e76-601158fec19d/ss_zoom_0156e6b5.png)

### 3. ~375px — ✅ PASSED

Pills wrap to 6 rows, fully visible; scrollWidth 485 ≤ innerWidth 500 (no horizontal overflow).

![Mobile pill wrap](https://app.devin.ai/attachments/7cbdaae4-e17e-40e0-8d1b-182c241f1d65/ss_3de76318.png)

## Part 2 — Accessibility audit (axe-core 4.10.2, findings for Round 19)

Pages audited: `/`, `/series/discworld`, `/authors/brandon-sanderson`, `/genres/fantasy`, `/search?q=discworld`, `/shelf` (seeded with 3-entry progress), `/new`. Raw JSON: `/tmp/axe_results.json` (script `/tmp/axe_audit.py`).

**Zero critical violations. Two violation types total across all 7 pages:**

| Impact | Rule | Pages affected | Node counts | Example selectors | Root cause |
|---|---|---|---|---|---|
| **serious** | `color-contrast` — Elements must meet minimum color contrast ratio thresholds | ALL 7 pages | / 20 · discworld 63 · sanderson 72 · fantasy 6 · search 3 · shelf 6 · new 35 | `.text-amber-accent` links/headings; `.text-ink-700\/50` book numbers; `.text-ink-700\/70` metadata; breadcrumb `.mb-4` links; `/new` card links | Amber accent `#c8842c` on background `#f7f6f3` = **2.86:1** (needs 3:1 large / 4.5:1 normal text); ink-700 at 50–70% opacity also falls below 4.5:1 on small text |
| **moderate** | `landmark-unique` — Landmarks should have a unique accessible name | /series/discworld, /authors/brandon-sanderson, /genres/fantasy, /new | 1 each | `.ml-auto` (header `<nav>`) | Header `<nav>` and the breadcrumb `<nav>` (and letter-pill `<nav>` where present) lack distinguishing aria-labels — header nav has none while breadcrumbs/letter navs are labeled, or vice versa; give the header nav `aria-label="Primary"` |

Notes for prioritization:
- The **amber accent color** (`--color-amber-accent: #c8842c`) is the single biggest offender — it's used for "All X →" links, breadcrumb hover, the hero highlight, progress labels, and `/new` metadata; darkening it to ≈`#9a6414` (≥4.5:1 on `#f7f6f3`) would clear most of the 205 flagged nodes site-wide.
- Secondary: low-opacity ink text (`text-ink-700/50`, `/60`, `/70`) on small font sizes (book numbers, card metadata, stat-card labels, pill counts).
- `landmark-unique` is a one-line fix: `aria-label` on the header `<nav>`.

### Manual checks

- **Keyboard trap: none found.** Tabbing on the homepage moves logo → search → header nav (visible focus ring on "Authors"); on /series/discworld, Tab reaches the Share button and then each book checkbox in order (visible amber focus ring on the Equal Rites checkbox), and Shift+Tab moves back — focus is never stuck.
- **Manual contrast observations** match axe: the amber "All genres →"/"All series →" links and the grey pill-count digits (`text-ink-700/60`) are visibly faint on the cream background.

| Focus ring on header nav (Tab) | Focus ring reaches checkboxes, no trap |
|---|---|
| ![Header focus](https://app.devin.ai/attachments/bf381763-ede4-464d-900f-92bd817c8502/ss_892afb57.png) | ![Checkbox focus](https://app.devin.ai/attachments/e8db460f-beb2-487c-ad1c-fa079f9377e6/ss_9e537ee1.png) |

## Artifacts

- Recording (R18 part): /home/ubuntu/screencasts/rec-d8a4b824-d03c-4d93-82c8-f327cb5452f0/rec-d8a4b824-d03c-4d93-82c8-f327cb5452f0-edited.mp4
- Raw axe JSON: /tmp/axe_results.json · audit script: /tmp/axe_audit.py
- Plan: /home/ubuntu/repos/shelfmark/test-plan-iter18.md
