# R172: D1 data fix — Douglas Adams attribution (worker f49c1e0e, data-only)

Against https://shelfmark.wookat520.workers.dev, cache-busted (`?cb=` — HTML cached 5 min). Code refs (unchanged code): src/index.ts L775 author-page portrait img, L1054 book-page author card, per-book "YYYY novel by X" stub lines on series pages.

## T1. /series/the-hitchhikers-guide-to-the-galaxy
- Byline credits Douglas Adams (no longer "five books by Douglas Adams" vs 6-book pills mismatch — record exact byline text); breadcrumb author link = Douglas Adams → /authors/douglas-adams; "More by Douglas Adams" pill.
- 6 book rows; rows 1–5 per-book lines say "novel by Douglas Adams"; row 6 "And Another Thing..." (2009) line says Eoin Colfer.
- Pixel review screenshot.

## T2. /authors/douglas-adams
- HTTP 200, h1 contains Douglas Adams; bio text contains "(1952–2001)".
- Portrait: img[alt="Douglas Adams"] present AND resource fetch 200 image/* (naturalWidth > 0).
- Lists both series: Hitchhiker (6 books) + Dirk Gently (3 books)... note brief says 8 books total — record actual per-series counts and total; assert total books shown = 8 (record if 6+3=9 discrepancy — flag).
- Pixel review light screenshot.

## T3. /authors/eoin-colfer
- Series list does NOT include Hitchhiker; DOES include Artemis Fowl. Stats reflect 2 series / 27 books (record actual).

## T4. /book/137647-the-hitchhiker-s-guide-to-the-galaxy
- Author card shows Douglas Adams (link /authors/douglas-adams), photo if present.

## T5. JSON APIs
- /api/series/the-hitchhikers-guide-to-the-galaxy.json → author == "Douglas Adams".
- /api/authors/douglas-adams.json → 200 valid JSON, name Douglas Adams, series include both slugs.

## T6. Hygiene
- axe on /authors/douglas-adams fresh light + dark → 0 violations each.
- Zero pageerrors/console errors on all probed pages.
