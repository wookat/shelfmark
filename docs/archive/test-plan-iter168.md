# R168: discovery — mobile dark journey (375px, recorded) + print + keyboard (production worker 42383164)

Discovery at big-tech-polish bar; P0/P1/P2 with locations/directions, no fixes. Against https://shelfmark.wookat520.workers.dev, fresh browser profile (empty localStorage). Code refs: home genre chips index.ts L143-144 (/genres/{slug}); series action pills L856-860 (Share / Print list / Copy list / ☆ Save for later — all print:hidden); coach tip + tracker app.js (tick → role=status tip, Up next badge, #sr-live); shelf route L1288+ (notice banner, #shelf-root, saved-root); print:hidden coverage L721-875 (crumbs pills, jump-nav, Copy list, similar section, share row, explainer, coach text), series filter chips L1382, subscribe box L1388.

## D1. Mobile dark new-user journey — RECORDED (device-emulated 375x812, dark, real Chrome window)
Steps (all UI, annotate each): home → tap a genre chip in "Browse by genre" (e.g. Fantasy) → genre page → tap a series card (e.g. Mistborn) → tick books 1+2 (coach tip "First book tracked ✓" + Up next badge moves + progress label "2 of N read") → tap header "My Shelf" → stats show 2 read / 1 series → back to series → "☆ Save for later" (label swaps to saved state) → "Share" (Link copied ✓).
Polish checks at each step (pixel review of stills): dark contrast of chips/cards/banners, spacing, coach mark placement at 375, tap-target sizes (measure computed h ≥ ~40px for chips/checkbox labels/action pills — flag < 40), no overflow (scrollingElement.scrollWidth == 375 on each page), no clipped text.
Pass criteria: every step lands the expected state above; any visual roughness → P2 finding with screenshot.

## D2. Print spot-check (emulate media print, 1440)
- /series/mistborn print: expect HIDDEN: Share/Print list/Copy list/Save pills, jump-nav, similar section, explainer, coach paragraph, header search/nav chrome, subscribe box; expect VISIBLE + legible: h1, ordered book list with numbers/titles/years. Checkboxes may print (record state). Full-page screenshot under print emulation.
- /shelf print (with 2 ticked books seeded from the journey profile or fresh seed): shelf content legible, interactive-only controls (export/import/clear buttons, goal Edit) — record which print (any interactive-only control printing = P2 candidate). Screenshot.

## D3. Keyboard pass on /series/mistborn (fresh context, 1280 light)
- Tab #1 = "Skip to content" visible pill; Enter → next Tab lands in main.
- Tab to book-1 checkbox: visible focus ring (pixel-verified); Space ticks → coach tip role=status + Up next.
- Tab order logical (record first ~15 stops); reach Share/Print/Copy/Save pills; no trap (Shift+Tab back works).

## Output
P0/P1/P2 with location + direction; verified-fine list; recording of D1; screenshots for D2/D3; zero pageerrors throughout.
