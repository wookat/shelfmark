# Shelfmark Rounds 19+20 — a11y fixes re-audit + visual sanity (deploy 1a0f0854, PR #7 commits 89bbb68 + af7d2e1)

Code refs: styles.css `--color-amber-accent: #9a6414` (was #c8842c); src/index.ts opacity bumps `/50→/70`, `/60→/75`; src/html.ts header `<nav aria-label="Primary">`; breadcrumbs `aria-label="Breadcrumb"`; favicon.svg accent #9a6414. Live curl pre-check confirms all deployed.

## Part 1 — axe re-audit (shell, not recorded)

1. Re-run /tmp/axe_audit.py (Playwright chromium, bypass_csp, axe-core 4.10.2, same 7 pages: /, /series/discworld, /authors/brandon-sanderson, /genres/fantasy, /search?q=discworld, /shelf seeded, /new). Pass: `color-contrast` nodes drop from R18 counts (20/63/72/6/3/6/35) to 0 or near-0 — report any remaining nodes with selectors; `landmark-unique` gone on all 4 previously-affected pages. Fail: counts unchanged or landmark-unique persists.
2. Compute #9a6414 vs #f7f6f3 contrast ratio (expect ≥4.5:1).

## Part 2 — visual sanity (recorded)

3. Homepage desktop: hero amber highlight, "All genres →"/"All series →" links, genre pill counts render in darker amber, legible; subscribe button white-on-amber legible. Screenshot.
4. /series/discworld: tick one book — progress label/bar + amber "Up next" badge render with new accent; Tab → focus ring visible in new amber. Untick to restore.
5. ~375px homepage: pills + amber elements legible, scrollWidth ≤ innerWidth.
6. Smoke: genre pills still 12/fantasy 272; /shelf stats cards still 10/3/7/Mistborn.
