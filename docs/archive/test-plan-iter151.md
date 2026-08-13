# R151: five-driver discovery sweep (production worker b93b5427, no code delta)

Goal: find NEW P0/P1/P2 polish issues; not regression. Avoid re-reporting known/by-design items (initial-letter cover placeholders, no ratings, scroll-reveal capture artifacts, sticky-header band in full-page captures, 375px start-chip wrap already reported in R150). Fresh contexts, cache-busted. Screenshots as evidence; no recording unless motion matters.

## D1. Discovery-funnel walkthrough (incognito, 1440)
Path: home → /popular → /genres/fantasy → page 2 (pagination controls: presence, current-page state, prev/next) → /lists → each of 4 curated lists → open a series → scroll to "If you like X" → "See all series like X →" → /similar page → /random (2 hits).
Judge: dead ends (pages without onward CTAs), inconsistent breadcrumbs, weak/missing CTAs, confusing copy, pagination usability (can you get back to page 1?), /random coherence. Record any issue with page + screenshot.

## D2. Mid-width visual pass (768 and 1024, light; spot dark)
Pages: home, /series/mistborn (with a tick + coach tip state), /shelf with 2 books + goal, /lists index + one list.
Judge: grid column counts at 768/1024 (awkward 1-col stretches or cramped 3-col), chip/badge alignment, header nav spacing, hero layout, stat-card grid (2x2 vs 4x1), search input width. PASS bar: nothing misaligned/cramped; capture any offender with screenshot + measurement.

## D3. Keyboard-only pass on /series/mistborn (fresh profile, 1440)
- Tab from top: skip link first? (assert its visibility WHEN focused via screenshot).
- Tab order: header → search → nav → content controls in DOM order; focus ring visible on every stop (sample screenshots at 4+ stops incl. a checkbox, "Got it", explainer summary, Save for later).
- Tick book 1 via Space on its checkbox: state changes, coach tip swaps, up-next badge appears on book 2.
- Shift+Tab back out of the list works; no focus trap.

## D4. Error/edge surfaces
- /series/zzz-bad, /genres/zzz-bad, /book/999999999-x, /authors/zzz-bad, /lists/zzz-bad: all styled 404 (not blank/stack trace), correct 404 status, has search/home CTA.
- Console noise: collect console messages + pageerrors on home, series, shelf, lists, popular, genre p2 — PASS = zero errors/warnings (excluding known third-party insights beacon if any).
- Slow-net sanity: home with 3G-ish throttle — meaningful first paint, no broken intermediate state (screenshot mid-load).

## D5. Free-form polish
Anything below the big-tech bar seen en route: typography inconsistencies, hover states, empty states, copy tone, favicon/tab titles, dark-mode spot checks on funnel pages.

Output: prioritized P0/P1/P2 list, each with page, repro, screenshot path, suggested direction. By-design items excluded.
