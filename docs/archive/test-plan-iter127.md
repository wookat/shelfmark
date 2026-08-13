# Shelfmark R126–127 — Year in Books + shared saved-list links (worker 377c3fb0, PR #18, commit 650d04b)

Code evidence: public/app.js (yearRoot renderer: entries with t>1e12, year picker only if >1 year, 4 stat cards, monthly bar chart, Top-5 series, first/latest finish, #year-card-btn → canvas PNG download `shelfmark-year-in-books-{yr}.png`; sharedRoot decodes location.hash base64url JSON [[slug,name]…], import via #import-shared-btn → "Added N ✓"/"Already all on your list ✓"; Share this list button appended under savedRoot when saved list non-empty, clipboard copy → "Link copied ✓"); src/index.ts: /year-in-books route + hidden 1080×1350 canvas, /saved route noindex, /shelf amber "Year in Books →" button, footer link, sitemap part 1, llms.txt. Goal read from localStorage `shelfmark:goal:{yr}` (set via existing /shelf goal UI).

## A. Recorded incognito flow (fresh profile #1)
1. Empty state: /year-in-books with no data → "No dated reads yet" + Browse series CTA. Fail: report or blank.
2. Seed dated reads TODAY via UI: on /series/mistborn tick books 1–2 (2 reads); on /series/the-reckoners tick book 1 (1 read). Expect progress lines update (2 of 8 / 1 of 4).
3. Set goal on /shelf: use the yearly goal control, set 10.
4. /year-in-books: NO year picker (single year); stat cards exactly: 3 books read in {year}; 2 series; busiest month = current month (3 books); 30% of your 10-book goal. Chart: single amber bar of 3 in current month, others empty. Top series: 1 Mistborn 2 books, 2 The Reckoners 1 book. First finish = Mistborn: The Final Empire, Latest = The Reckoners #1 (today's date).
5. Click "Download {yr} report card" → PNG lands in ~/Downloads as shelfmark-year-in-books-{yr}.png; open the file and verify: dark card, "Year in Books", year, big "3", "books read · 2 series · goal 30%", busiest month line, ranked list 1. Mistborn · 2 / 2. The Reckoners · 1, footer URL.
6. Save 2 series for later (Mistborn + The Reckoners via ☆ Save for later) → /shelf Saved section shows both + new "Share this list" button beneath. Click → button text flips "Link copied ✓".
7. Round trip: open NEW incognito window (fresh context), paste clipboard URL (/saved#…) → page renders 2 series cards + "Add all to my saved list". Click → status "Added 2 to your saved list ✓"; /shelf in that context shows the 2 saved items. Click Add all again → "Already all on your list ✓".
8. /saved with garbage fragment (/saved#zzzz) → "This link doesn't contain a list" empty state; /saved with no fragment → same.
9. Regression: /shelf renders with new button row ("Year in Books →" amber button); footer "Year in Books" link → page.

## B. Shell/Playwright (unrecorded)
10. /saved served HTML has noindex robots meta; /year-in-books does not.
11. sitemaps/1.xml contains /year-in-books; llms.txt lists Year in Books. /saved NOT in sitemap.
12. Server never sees fragment (inherent to #); confirm no /saved requests carry payload: curl of /saved returns generic page.
13. Axe 4.10.2 light+dark on /year-in-books (populated via seeded localStorage) and /saved (with valid fragment): 0 violations → /tmp/axe_results_r127.json.
14. Overflow 375px + 320px on /year-in-books (populated), /saved (populated), /shelf (with saved items + buttons): scrollWidth == innerWidth.

Constraints: never touch main QA profile reads (Mistborn 6/8); incognito only for ticks/goal/saves; no emails.
