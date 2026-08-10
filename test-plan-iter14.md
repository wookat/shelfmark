# Shelfmark Rounds 13+14 — "Up next" badge + sitemap letter URLs (deploy 95b44ab3, PR #6 commit 84002cb)

Code refs: public/app.js updateSeriesUI — removes all `.up-next-badge` in the list, then if `0 < read < total` inserts `<span class="up-next-badge">Up next</span>` after the `.font-medium` title of the first unchecked box; runs on init and on every checkbox change, per `ol[data-series]` list independently. styles.css: amber pill, `white-space:nowrap`, and `@media print { .up-next-badge { display:none!important } }`. Deployed app.js/styles.css curl-verified to contain the code. R13: /sitemaps/1.xml has 52 `letter=` URLs and parses as valid XML (pre-verified via curl+minidom; browser spot-check in plan).

Note: this browser profile has prior ticks (Discworld may have Mort/Wyrd Sisters/Guards! Guards!/Hero of Ages from earlier rounds; Mistborn is 6/8). On /series/discworld, first untick everything ticked to reach the untouched state (this also pre-exercises badge removal).

1. Untouched /series/discworld (all boxes unchecked, progress label empty): NO "Up next" pill anywhere in the list. Fail: badge visible with zero read.
2. Tick book 1 (The Light Fantastic, 1986): amber "Up next" pill appears immediately after book 2's title (Mort, 1987) and nowhere else; progress "1 of 55 read (2%)". Fail: no badge, badge on wrong row, >1 badge.
3. Tick book 2 (Mort): badge moves to book 3 (Sourcery, 1988); only one badge in list. Fail: stale badge on book 2 or duplicate.
4. Reload (F5) with partial progress (2 of 55): badge still on book 3 after page load. Fail: badge gone or misplaced after reload.
5. Untick books 1 and 2 → progress label empty and badge completely gone. Fail: orphan badge remains.
6. Author page /authors/brandon-sanderson multi-list independence: Mistborn list (6/8) shows badge on its first unread (book 7, The Lost Metal); fully-unread lists (e.g. Alcatraz, Secret Projects) show NO badge. Tick one book in Alcatraz → badge appears on Alcatraz's next unread while Mistborn badge stays on book 7; untick to restore. Fail: badge leaks across lists or appears on 0-read lists.
7. Print preview (Ctrl+P) on /series/mistborn (6/8 partial): no "Up next" pill in the preview (badge print-hidden), rest of print layout unchanged. Fail: badge prints.
8. Mobile ~375px on /series/mistborn: badge row (book 7) doesn't break the card layout — pill wraps/fits, scrollWidth <= innerWidth.
9. (R13, quick) Open /sitemaps/1.xml in the browser: renders as parsed XML (no parse error), and letter-index URLs like /authors?letter=A visible. Fail: XML parse error page.
