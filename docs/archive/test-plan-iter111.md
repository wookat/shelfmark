# Shelfmark R108–111 visual/brand upgrade (deploy 0c3ded07, PR #16, commit a8656c5)

Code refs: src/index.ts:94-106 (hero text-6xl + `<em>` italic, hero-covers collage: 7 popular covers, rotate ±3–6°, i>3 hidden md:block / i>2 hidden sm:block → 4/5/7 visible), 124 (`data-reveal` on bg-ink-900 panel); src/styles.css:22-72 (body feTurbulence grain, .card-lift transitions + hover translateY(-2px)+img rotate(-2deg) scale(1.05), check-pop keyframe on :checked, .js-reveal [data-reveal] opacity 0 → .revealed, all inside `@media (prefers-reduced-motion: no-preference)`); public/app.js:665-682 (IO reveal only when motion-safe; adds `js-reveal` to html), 362 (empty-shelf inline SVG line-art with amber ribbon path fill #c98a2e); src/html.ts:58 (Fraunces italic axis in font URL).

Pre-checked (workers.dev + cb): styles.css 27,913 bytes with all tokens; home HTML has hero-covers/data-reveal/card-lift×30/text-6xl/em; favicon.svg 200 image/svg+xml; og.png 200 png 1200×630.

## Recorded browser pass (main profile; hard reload for new styles.css/app.js)

1. Homepage hero (desktop, light): text-6xl headline with italic amber "right order"; tilted cover collage below search — 7 covers, visibly rotated, each links to /series/{slug}; hover a cover → straightens + lifts. Screenshot. Fail: no collage, covers upright, or links wrong.
2. Scroll to bottom: "Your shelf lives in your browser." dark panel fades up into view (data-reveal → revealed). Fail: section permanently invisible (opacity 0) or no fade for motion-safe.
3. Series page /series/mistborn: hover a "More by Brandon Sanderson" card → card lifts, cover tilts. Tick The Lost Metal checkbox → check-pop animation + 7/8 (88%); untick → 6/8 (75%) exact restore. Fail: progress wrong or not persisted.
4. Empty-shelf illustration: incognito window → /shelf shows new line-art SVG (books + amber bookmark ribbon) above "Your shelf is empty". Fail: old text-only empty state.
5. Dark mode (DevTools emulate dark): homepage renders dark palette w/ collage + grain intact, dark cards distinct. Screenshot.

## Shell/Playwright checks

6. Reduced motion (Playwright reduced_motion="reduce"): html must NOT have js-reveal class; data-reveal section opacity=1 / no transform at load without scrolling; card-lift hover produces no translateY; screenshot proving bottom panel visible. Fail: invisible section (accessibility regression).
7. No-JS: context with javascript_enabled=False → data-reveal section visible (no js-reveal on html).
8. Mobile 375px: hero collage shows exactly 4 covers (i>2 hidden sm:block); no horizontal overflow. Sweep 320/360/375/400/414/460/640: scrollWidth<=innerWidth on / (record exact values; note prior 360 fix commit 6f568c1 claims 400/460 nav breakpoints). Genres visible ≥400, New ≥460, Beta+Pricing ≥640.
9. Axe 4.10.2 light+dark on /, /series/discworld, /shelf (seeded), /pricing → 0 violations (adversarial re-check incl. the R106 link-in-text-block fix: book-page inline series links now persistently underlined). Save /tmp/axe_results_r111.json.
10. Regression of R106 QA fixes: /book/181101-mort ordinal now matches series list (Mort #2 → "Book 2 of 55"?) — verify consistency for Mort + Light Fantastic; book-page "Mistborn" inline link has underline style in served HTML/computed style.
11. Security headers unchanged (workers.dev + cb); styles.css size ~27.9KB (vs 75.6KB) with .beta-badge/year-chip/up-next tokens still present; favicon.svg + og.png (1200×630) served (captured).

Cleanup: main profile canonical (Mistborn 6/8, saved {}, no goal key).
Report → /home/ubuntu/repos/shelfmark/test-report-iter111.md
