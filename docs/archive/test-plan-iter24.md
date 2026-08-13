# Shelfmark Round 24 — /shelf "Up next" slots + /api/series-books (deploy 16f476c9, PR #8 commit 094f204)

Code refs: public/app.js diff — shelf group headings (non `standalone-` slugs) get `<span class="block sm:inline text-sm ..." data-upnext="slug">`; client fetches `/api/series-books/:slug`, first book id missing from tracker data → `· Up next: <a class="text-amber-accent" href="/series/slug">title</a>`; none missing → `· Series complete 🎉`; slots capped at 20. src/index.ts — new endpoint, Cache-Control public,max-age=3600, 404 `{books:[]}` on unknown slug.

Already shell-verified live: API 200 with cache-control `public, max-age=3600`, 55 ordered Discworld books (first = The Light Fantastic, #3 Equal Rites), 404 on unknown slug, deployed app.js contains series-books code.

State safety: tracker backup exists at /tmp/shelf_backup_r23.json (identical baseline 10 books / 3 series); restore verbatim at the end and confirm /shelf stats 10/3/7/Mistborn.

## Recorded browser pass

1. /shelf with seeded state (Mistborn 6/8, Warriors 1, Discworld 3): each series heading shows "· Up next: <title>" with correct first-unread — Mistborn → **Mistborn: The Lost Metal**, Discworld → **Mort** (1,5,7 read → first unread is #2 Mort), Warriors → its first unread per API order (verify against API response; "Into the Wild" is read, so it must NOT be Into the Wild). Fail: missing slot, wrong title, or "Series complete" shown.
2. Click the Mistborn Up next link → lands on /series/mistborn.
3. Series complete: go to /series/alcatraz-versus-the-evil-librarians, click "Mark all read" (R23 button), return to /shelf → Alcatraz heading shows "· Series complete 🎉" (not an Up next).
4. Standalone group: on /authors/brandon-sanderson tick one Standalone book (e.g. Elantris) → /shelf shows "Brandon Sanderson standalone" group WITHOUT any Up next/complete slot (data-upnext absent).
5. Console: no CSP/fetch errors after shelf loads.
6. ~375px (narrow window): the slot renders as `display:block` on its own line under the heading, no horizontal overflow (scrollWidth ≤ innerWidth).
7. Regression: stats cards still correct for current state; Export JSON downloads valid file; Import merges without error.
8. Restore backup verbatim → /shelf back to 10 / 3 / 7 / Mistborn, slots re-render with Up next values from step 1.
