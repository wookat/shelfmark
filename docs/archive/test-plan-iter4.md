# Shelfmark Iteration 4 — live re-verify (PR #5 round 4)

Code refs: src/index.ts:443-467 (/new route, grouped-by-year sections, series links, cover/placeholder tiles), src/html.ts nav "New" link + footer "New releases", src/index.ts:269 (Share chip, data-share), public/app.js:92-105 (navigator.share else clipboard → "Link copied ✓" for 2s), src/index.ts:604 (/new in sitemap chunk 1).

1. /new via header nav "New" link: page H1 "New & Upcoming Series Books", a "2026" H2 section with book rows (cover or initial tile); click a series link in a row → correct series page loads. Fail: 404/empty page or dead link.
2. Share button on a series page (e.g. /series/mistborn): chip row shows "Share" next to book-count pill; click it → button text changes to "Link copied ✓" (desktop Chrome, no navigator.share) and reverts after ~2s; clipboard contains the page URL. Fail: no feedback text or wrong clipboard content.
3. Regression fix: /search?q=The Final Empire shows the Books section WITHOUT the "Nothing found. Try a different spelling…" line. Fail: line still present.
4. Regression fix: Ctrl+P print preview on /series/mistborn no longer shows the "N of M read (%)" pill nor the "☑️ Tick a book…" tip line (header/footer/forms/checkboxes still hidden). Fail: pill or tip visible in preview.
5. Mobile ~375px: /new renders stacked rows, no horizontal overflow (scrollWidth <= innerWidth); note "New" nav is expected hidden <sm (footer link instead).
