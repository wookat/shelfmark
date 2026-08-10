# R140 discovery scan (production, five drivers) — find problems, output P0/P1/P2 list

Not a regression run. Deployed prod = worker 9d213355 era. Known-by-design (do NOT report): initial-letter cover placeholders, no ratings data. Code refs: src/index.ts notFound L1646/onError L1648, /pricing L338, /year-in-books L1055 (has noscript), /saved L1075 (has noscript). Seed finding from setup: series index shows "1 books" (9×, e.g. /series/star-trek-5).

## D1 New-user UX walkthrough (browser UI, fresh incognito, 1440)
Home → search or browse to a series → read order → tick 2 books → /shelf → Year in Books → save list & open shared /saved link in 2nd fresh window → footer subscribe (incl. invalid email + duplicate submit) → /pricing → bad URL /series/zzzz (404) and /book/999999-x. Log every confusion/rough edge with screenshot.

## D2 Visual polish sweep 1440 + 375 (light + dark)
Pages: /, /series/mistborn, /series/discworld, /book/134080…, /authors/brandon-sanderson, /shelf (empty + with data), /lists, /popular, /new, /genres/fantasy, /pricing, /search?q=discworld, 404. Check: baseline alignment, uneven paddings, font-weight jumps, hover/focus styles, empty states, dark-mode inconsistencies (e.g. white-only assets, hardcoded colors), image placeholder quality.

## D3 Edge paths
- No-JS (Playwright javascript_enabled=False): /series/mistborn (do checkboxes render but dead? any explanation?), /shelf, /year-in-books, /saved#…, search form.
- Keyboard: tab through home + series page — focus visible on every stop? logical order? skip link? explainer/details reachable? coach-mark "Got it" reachable?
- Slow net (Playwright route delay or CDP throttle): does FOUT/layout jank appear; do covers pop in with layout shift?
- Long strings: longest series/book titles (find via /search long words, sitemap); author with many-word name; check 375 wrap/overflow.
- Extreme data: /series/discworld (55 books), 1-book series /series/star-trek-5 ("1 books" grammar + does progress/Up-next behave), no-cover series page.
## D4 Legacy re-checks
320px homepage; /pricing at 375 (cards/tables); header nav at widths 375–1024 (which links hide? does it feel broken between breakpoints, e.g. 640–768?).

Output: P0 (broken/blocking), P1 (clearly rough/confusing), P2 (polish) — each with page, repro, screenshot path, suggested direction. Exclude by-design items.
