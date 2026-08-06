# Iteration Log (100-round continuous mode)

Each round: 5 drivers (QA testing / UX walkthrough / visual+a11y / competitor research / user+data analytics) → P0-P2 fixes → deploy → live regression → log here.

## Round 1 — 2026-08-06

**Findings (by driver)**
- Data analytics: first-party hits exist (~53 hits, own testing only — site too young for organic); search terms were NOT logged (only `/search` path, no `?q=`). Emails: 2 collected, 0 confirmed (Resend key pending).
- Compliance/security backlog (from round-3 audit): no CSP/Referrer-Policy headers, no API rate limiting. [P1]
- QA (live regression by testing agent): initial CSP deploy broke ~80% of covers — `covers.openlibrary.org` 302-redirects to `ia*.us.archive.org` (not in img-src) and inline `onerror="this.remove()"` fallback blocked by `script-src 'self'`. [P1] CSP also blocked Cloudflare-injected insights beacon (console error per page). [P2]
- UX/visual: `/shelf` showed `1/1/1970` for migrated ticks; home "Prolific authors" surfaced dataset junk (0-series authors, 3000+-book aggregations). [P2] A11y: no visible focus ring, email input unlabeled. [P2]
- Competitor: no new BSIO movement since round 3 (checked headers/features unchanged); StoryGraph still behind CF verification (not bypassed).

**Fixes shipped**
- Security headers on all responses: CSP (self + OL covers + `*.archive.org` img, Google Fonts, cloudflareinsights), Referrer-Policy strict-origin-when-cross-origin, X-Content-Type-Options nosniff, X-Frame-Options DENY.
- Best-effort KV rate limiting: `/api/subscribe` 5/min/IP, `/api/migrate-ids` 10/min, `/api/hit` 60/min (eventually-consistent KV — abuse mitigation, not hard guarantee).
- Search-term analytics: beacon now sends `/search?q=…` (runtime-verified in DevTools: payload `/search?q=discworld` → 204).
- Cover fallback moved from inline `onerror` to CSP-safe capturing `error` listener in app.js.
- `/shelf` hides invalid epoch dates; Prolific authors filtered (`series_count>=2 AND book_count 10–400`).
- A11y: `:focus-visible` ring on inputs/buttons/links; aria-label on footer email input.
- Deploy pipeline: removed `routes` stanza from wrangler.toml (custom domain already attached in dashboard) — eliminates the recurring `Authentication error [code: 10000]` on `/zones/.../workers/routes`; deploys now finish clean.

**Evidence**
- Live headers: `curl -I https://shelfmark.zalize.com/` shows CSP/RP/XCTO/XFO.
- Rate limit: 429 observed after exceeding subscribe limit.
- QA report: `test-report-iter1.md` + recording (session artifacts).

**Regression (live)**
- Two-pass regression: first pass caught `*.archive.org` wildcard not matching apex `archive.org` redirect (37/46 covers blocked); apex added, re-verified 46/46 Discworld covers render, 0 CSP violations (test-report-iter1c.md).

**Carry-over → Round 2**
- Verify covers render clean under final CSP (live regression).
- Styled title-initial placeholder for books without covers.
- Skip link; blurb/footer text AA contrast check.
- OL cover backfill continues in background (4 shards running).

## Round 2 — 2026-08-06

**Findings (by driver)**
- Competitor (OrderOfBooks.com deep-dive, new this round): per-series pages offer publication + chronological order, short stories/collections tables, and an "If You Like X, You'll Love…" recommendation block. Recommendations are implementable with our genre data. [P1 opportunity]
- Visual: books without covers left a ragged list (no placeholder). [P2]
- A11y (carry-over): no skip link; `text-ink-700/60` secondary text below AA contrast on cream. [P2]
- Data: OL cover backfill produced 5,123 total matches so far; production covers 6,947 → 10,045 after import.

**Fixes shipped**
- "If you like {series}, you'll love…" section on series pages: same-genre series by other authors (`genre=? AND author_id<>?`, book_count 3–60, top 6) — internal-linking + engagement analog of OrderOfBooks' block.
- Styled title-initial placeholder for missing covers (38×57 tile, display-font initial).
- Skip-to-content link; `#main` anchor; secondary text bumped `/60`→`/75` opacity for AA contrast.
- +3,098 covers imported into production D1 (10,045 total).

**Evidence**
- Live: `/series/mistborn` shows "If you like Mistborn, you'll love…"; skip link in DOM.
- Cover count via D1: 10,045 `cover_url IS NOT NULL`.

## Round 3 — 2026-08-06

**Findings (by driver)**
- Data analytics: `/series/warriors` vs `/series/warriors-2` ambiguity still confused visitors (both in hit log); generalized as "same-name series have no cross-links". [P2]
- QA/UX: searching an individual book title returned nothing (search only covered series/author names) — a common search intent ("<book> series order"). [P1]
- Competitor (BSIO parity): BSIO offers a print dialog for its lists; Shelfmark printed with nav/checkboxes/progress clutter. [P2]
- SEO ops: content changed in Rounds 1–2 across all series pages; IndexNow resubmission due. indexnow.sh only submitted sitemaps 1–2 of 6 and 400'd on oversized batches. [P2 bug]

**Fixes shipped**
- Search now also matches book titles: "Books" section links each hit to its series page (`b.title LIKE ? JOIN series`, top 20).
- Same-name disambiguation: series pages with identical names cross-link each other ("Looking for a different Warriors? …") — resolves the Warriors ambiguity generically.
- Print stylesheet: header/footer/forms/checkboxes/progress hidden, white background — clean printable reading order (BSIO print parity).
- indexnow.sh fixed (all 6 sitemap chunks, 8K-URL batches); resubmitted 25,594 URLs (4× HTTP 200).

**Evidence**
- Live: `/search?q=The+Final+Empire` shows Books section; `/series/warriors-2` shows disambiguation line.
- IndexNow: 200 8000 ×3 + 200 1594.
- Post-QA fixes: no-results copy accounts for book hits; progress pill + tick tip hidden in print.

## Round 4 — 2026-08-06

**Findings (by driver)**
- Competitor (BSIO/OrderOfBooks): both surface a new/upcoming-releases destination (release calendar / front-page features); Shelfmark had none although the catalog holds 216 books dated 2026 and 705 dated 2025. [P1 opportunity]
- Distribution (charter: natural sharing): no share mechanism on series pages — the natural "send this reading order to a friend" loop was unsupported. [P1]
- Data: OL cover backfill deep in the low-match tail (recent batches 0-match); production covers steady at 10,045.

**Fixes shipped**
- `/new` — "New & Upcoming Series Books" page (current + next year, grouped by year, joined to series/author, covers/placeholders), linked from header nav + footer, added to sitemap chunk 1.
- Share button on series pages: Web Share API with clipboard fallback ("Link copied ✓").

**Evidence**
- Live: https://shelfmark.zalize.com/new (HTTP 200, 2026 section rendering).
- QA (test-report-iter4.md + recording): /new nav/render/sitemap, Share clipboard fallback (exact URL pasted), search books-only copy, print cleanup, 375px mobile, tracker regression — all pass. One P2 raised: /new dominated by dataset noise (~15 xkcd rows, non-book pamphlet entries) → fixed in Round 5.

## Round 5 — 2026-08-06

**Findings (by driver)**
- QA carry-over (P2 from Round 4 live test): /new curation — xkcd strips and pamphlet-style rows led the flagship releases page.
- Competitor/distribution: BSIO/social shares of series links render rich preview cards; Shelfmark pages had og:title/description but **no og:image** — shared links show bare text, weakening the share loop the Round-4 Share button feeds. [P1 for distribution]
- Data analytics: hits still ~all self-testing (40–52/day); search terms logging works (`/search?q=discworld` top). No organic signal yet — too young; nothing to act on.
- Visual: OG card designed to brand palette (ink/amber, serif wordmark).

**Fixes shipped**
- /new curation (two passes): pass 1 — attributed series, size 2–80, genre exclusions (removed xkcd/Munroe); live QA still found self-pub bulk noise (Singapore pamphlets, 34 rows by one author). Pass 2 — require the series to have a known genre AND to be established before the release year (`s.genre IS NOT NULL AND s.first_year < b.year`): only real new installments of existing series qualify (matches the page's "series installments" promise).
- Social preview images: site-wide branded 1200×630 `/og.png` (twitter:card summary_large_image); series pages use first available book cover (`-L.jpg`) as og:image + twitter:image.

**Evidence**
- Live /new after pass 2: 0 matches for xkcd/Munroe/Singapore/Spyrou/Hoicka/study-guide; 31 curated rows, all recognizable series installments (Murderbot "Platform Decay", Apothecary Diaries, Yona of the Dawn 47, Neal Asher, Philip Reeve, manga volumes).
- Live og:image: `/` + `/new` → `https://shelfmark.zalize.com/og.png`; `/series/discworld` → `https://covers.openlibrary.org/b/id/14648805-L.jpg`.
- QA (test-report-iter5.md + recording): og meta on 3 page types, /og.png 1200×630, /new mobile + content quality, smoke regression — pass.

## Round 6 — 2026-08-06

**Findings (by driver)**
- Competitor/SEO: BSIO ranks for question-style long-tail ("what is the first X book", "how many X books are there"); Google surfaces FAQ rich results for competitors. Shelfmark series pages had no FAQ content or FAQPage structured data despite having every answer in the catalog. [P1 pSEO opportunity]
- Data analytics: search-term log confirms question/lookup intent (title lookups like "The Final Empire").

**Fixes shipped**
- Series-page FAQ section (visible `<dl>`, brand-styled cards) + matching FAQPage JSON-LD, fully generated from catalog data (no fabrication): first book (+year), book count (+span), most recent installment, author. Rendered only when data exists.

**Evidence**
- Live: /series/mistborn renders 4 FAQs + FAQPage JSON-LD ("starts with “Mistborn: The Final Empire” (2006)", "8 books … 2006–2022", "The Lost Metal (2022)", "Brandon Sanderson").
- QA (test-report-iter6.md + recording): Mistborn FAQ accurate, JSON-LD valid on 3 pages, author-less series degrades cleanly, 375px + tracker + print pass. One P1 caught: on dup-position series (Discworld) `first = books[0]` used raw DB order while the rendered list re-sorts by year — FAQ said "Mort (1987)" but list starts "The Light Fantastic (1986)". Fixed by applying the same dup-position sort before FAQ generation; live re-verified: FAQ now says "The Light Fantastic (1986)". (PR #6)

## Round 7 — 2026-08-06

**Findings (by driver)**
- UX/competitor: BSIO front page features fresh releases; Shelfmark's homepage had no freshness signal — the curated /new content (Round 5) was only reachable via nav. Repeat visitors get no "what's new" hook on landing. [P1]
- Data: /new curation query proven clean in Round 5 QA; reusable for a homepage teaser without new data work.

**Fixes shipped**
- Homepage "New & upcoming" section: top 6 curated upcoming installments (same established-series query as /new) as cover cards linking to their series pages, with "All new releases →" link to /new. Placed between Popular series and Prolific authors.

**Evidence**
- Live: homepage renders "New & upcoming" with 6 cards + /new link (deploy 04d831eb).
- QA (test-report-iter7.md + recording): Discworld FAQ fix confirmed visually; homepage section (6 real 2026 installments, no noise), card navigation, /new top-6 parity, 375px, tracker — all pass.

## Round 8 — 2026-08-06

**Findings (by driver)**
- UX/competitor: BSIO offers A–Z author browsing; Shelfmark's /authors was one 380-page popularity-sorted list — finding a specific author by browsing was impractical (search was the only path). [P1 UX + pSEO]
- A11y: letter nav needed a labelled `<nav>` landmark with clear current-state affordance.

**Fixes shipped**
- /authors A–Z letter navigation: pill nav (All + A–Z, `aria-label="Authors by letter"`, active letter inverted), `?letter=X` filter (validated `[A-Z]`, name-sorted, paginated with letter preserved), canonical includes letter, empty-letter fallback copy.

**Evidence**
- Live: /authors?letter=K → "authors starting with K", name-sorted; /authors?letter=K&page=2 → "Page 2 of 14" with filter retained (deploy 6416b4e6).
- QA (test-report-iter8.md + recording): letter filter/sort, active pill, pagination retention, canonical, invalid-letter fallback, 375px wrap, author-page smoke — all pass. Untested: empty-letter copy (every letter populated).

## Round 9 — 2026-08-06

**Findings (by driver)**
- UX/product: shelf data lives only in one browser's localStorage — Export JSON existed but there was no way to restore it, so the backup was a dead end and device switches lost all progress. Competitor account products (StoryGraph/Goodreads) sync across devices; a no-account product needs at least backup→restore. [P1]

**Fixes shipped**
- /shelf Import JSON: file picker (`accept=.json`, aria-labelled), validates the parsed object (rejects arrays/non-objects; only entries with string titles merged, fields sanitized to expected types), merges without overwrite-loss into `shelfmark_read_v1`, shows a `role="status"` count ("Imported N new books ✓") and reloads; bad files get a friendly error. Helper copy explains export/import for device switching.

**Evidence**
- Live: /shelf renders Import JSON button + hidden file input (deploy 5deb4cb7); `node --check` on app.js passes.
- QA (test-report-iter9.md + recording): round-trip restore (8 entries, dates preserved), merge without loss/dupes, overlap not counted, invalid-file error, 375px, reading card — all pass. Follow-up shipped: status reload delay 800ms→1.6s.

## Round 10 — 2026-08-06

**Findings (by driver)**
- UX consistency: Round 8 gave /authors A–Z browsing but /series (2,680 entries, 45 pages) remained popularity-only — inconsistent navigation model between the two main indexes. [P1]
- SEO ops: Rounds 5–9 changed content on every series page (FAQ blocks) + new letter pages; IndexNow resubmission due.

**Fixes shipped**
- /series A–Z letter nav, mirroring /authors: validated `?letter=X` filter, name-sorted letter views, active-pill state, letter-preserving pagination, canonical with letter, empty-letter fallback.
- IndexNow: resubmitted all 25,595 sitemap URLs (4 batches HTTP 200; one transient RemoteDisconnected retried successfully).

**Evidence**
- Live: /series?letter=M → "Book Series Starting With M — Page 1", 148 M-series, canonical carries letter (deploy bc054f6d).
- IndexNow: 200 8000 ×3 + 200 1595.

## Round 11 — 2026-08-06

**Findings (by driver)**
- UX/SEO: 404 page was a dead end — stale/mistyped series/author URLs (common for pSEO sites accruing external links) offered only a bare "try searching" link, losing the visitor. [P1]
- QA: /series/mistborn-trilogy and /authors/brandon-sandersen (realistic typo variants) returned generic 404 with zero recovery paths.

**Fixes shipped**
- "Did you mean" suggestions on series/author 404s: slug tokens (first 5 chars each, OR-matched, popularity-ranked, LIMIT 5) query D1 for near-miss series/authors; search link pre-fills the slug-derived query. Generic notFound unchanged for non-catalog routes.

**Evidence**
- Live (deploy f6d7fa75): /series/mistborn-trilogy → suggests Mistborn (+4 trilogy series); /authors/brandon-sandersen → suggests Brandon Sanderson first. Both still HTTP 404 (no soft-200s).

## Round 12 — 2026-08-06

**Findings (by driver)**
- QA (Round 11 live regression, P3): multi-word queries with no exact phrase match returned "Nothing found" — e.g. the 404 page's pre-filled `/search?q=mistborn trilogy` found zero results even though Mistborn exists. Search-term analytics show users type natural phrases, not exact names. [P2]

**Fixes shipped**
- Search close-match fallback: when phrase LIKE yields zero series/authors/books and the query has ≥2 tokens (>2 chars), rerun with token-OR LIKE (popularity-ranked, 12 each) under a "No exact match — showing close matches instead." notice. Exact-match path unchanged; garbage queries still say "Nothing found".

**Evidence**
- Live (deploy 57758c55): `?q=mistborn trilogy` → close-match notice + Mistborn; `?q=discworld` unchanged exact results; `?q=zzqqxx wwyyzz` → Nothing found.

## Round 13 — 2026-08-06

**Findings (by driver)**
- SEO/data analytics: D1 first-party stats still self-testing only (43 hits / 2 days — no organic signal yet; site awaiting indexing). The 52 A–Z letter pages (Rounds 8/10) were crawlable but absent from the sitemap — discovery relied on on-page pill links only. [P2]
- Data: cover coverage 10,045 / 185,730 books (backfill long tail, unchanged priority).

**Fixes shipped**
- Sitemap chunk 1 now lists all 52 letter-index URLs (`/authors?letter=A–Z`, `/series?letter=A–Z`); submitted the 52 URLs to IndexNow (HTTP 200).

**Evidence**
- Live (deploy 7ebbf4e6): `curl /sitemaps/1.xml | grep -c 'letter='` → 52. IndexNow response 200 52.

## Round 14 — 2026-08-06

**Findings (by driver)**
- Competitor/UX: tracker tells you *what you've read* but not *what to read next* — competitors' core promise ("what's the next book in order?") deserved an explicit cue. On long lists (Discworld 46) users must visually scan for the first unticked row. [P1]

**Fixes shipped**
- "Up next" amber pill after the first unread book's title, per series list, whenever the series is partially read (client-side, localStorage-driven, updates instantly on tick/untick; hidden in print; never shown for untouched or completed series).

**Evidence**
- Live (deploy 95b44ab3): verified via Round 14 testing-agent regression (test-report-iter14.md).

## Round 15 — 2026-08-06

**Findings (by driver)**
- QA/data: genre pages had a hard `LIMIT 200` with no pagination — /genres/fantasy (279 series) silently hid 79 series; science fiction (199) was one series away from the same cliff. [P1]

**Fixes shipped**
- Genre pages paginated (PAGE_SIZE=60, popularity-ranked): total count shown, Previous/Next via `paginationQ`, page-aware H1/canonical (`?page=N`), page 1 canonical unchanged.

**Evidence**
- Live (deploy 40f91fb3): /genres/fantasy shows "279 fantasy series" with Next → page 2; /genres/fantasy?page=5 renders "Page 5" with canonical `?page=5`.

## Round 16 — 2026-08-06

**Findings (by driver)**
- QA (Round 15 regression note): genre pagination exposed previously hidden 0-book series rows ("The Riftwar Cycle · 0 books", "Ulldart", "Dragonlance: Tales"…) — 90 such container/parent series existed catalog-wide and appeared in /series, genre pages, search and 404 suggestions. [P2]

**Fixes shipped**
- `book_count > 0` filter on all series listings: /series (All + letter views & counts), genre pages (list + count), search exact + close-match, and 404 did-you-mean suggestions. Series pages themselves stay reachable (parents still render sub-series).

**Evidence**
- Live (deploy 24678a61): /genres/fantasy 279 → 272; /series 2,680 → 2,590; fantasy last page has zero "0 books" rows.

## Round 17 — 2026-08-06

**Findings (by driver)**
- Competitor (StoryGraph/Hardcover): both lead with reading stats; Shelfmark's /shelf opened with a plain sentence ("N books read across M series") — no at-a-glance stats, weaker retention/share pull. [P2]
- Analytics note: hits are aggregated per (day,path) rows — earlier "43 hits" figure was row count; true volume = SUM(count). Still self-testing only.

**Fixes shipped**
- /shelf stats strip (client-side, localStorage only): four cards — books read, series followed, read in <current year>, most-read series — replacing the summary sentence; 2-col mobile / 4-col desktop grid.

**Evidence**
- Live (deploy 9ffba634): verified via Round 17 testing-agent regression (test-report-iter17.md).

## Round 18 — 2026-08-06

**Findings (by driver)**
- UX walkthrough: homepage had no genre entry point besides the small nav link — genre pages (60+, now paginated) are strong browse/SEO surfaces but got no homepage internal links. [P2]

**Fixes shipped**
- Homepage "Browse by genre" section: top-12 genre pills (≥10 series each, 0-book series excluded from counts) with series counts, between New & upcoming and Prolific authors, linking to /genres/<slug> + "All genres →".

**Evidence**
- Live (deploy 730f2e8d): homepage shows 12 genre pills (fantasy 272 … thriller); each links to its genre page.

## Round 19 — 2026-08-06

**Findings (by driver)**
- A11y audit (axe-core 4.10.2 on 7 live pages, Round 18 QA): serious `color-contrast` on all pages (~205 nodes) — amber `#c8842c` on `#f7f6f3` = 2.86:1 and low-opacity ink text (`/50`–`/60`) on small fonts; moderate `landmark-unique` on 4 pages (header nav vs breadcrumb nav unnamed). Zero critical; no keyboard traps. [P1]

**Fixes shipped**
- Accent darkened `#c8842c` → `#9a6414` (≥4.5:1 on both page and card backgrounds; brand hue retained; og.png/favicon untouched).
- Low-opacity text bumped: `text-ink-700/50` → `/70`, `/60` → `/75` across templates.
- `aria-label="Primary"` on header nav, `aria-label="Breadcrumb"` on breadcrumbs.

**Evidence**
- Live (deploy 1ab57995): re-audit in Round 19 QA (test-report-iter19.md).

## Round 20 — 2026-08-06

**Findings (by driver)**
- Visual consistency: favicon bookmark stroke still used the old accent `#c8842c` after the Round 19 darkening. [P2]
- SEO ops: listing/homepage content changed across Rounds 16–19 (counts, genre pills, contrast); core pages due for IndexNow refresh.

**Fixes shipped**
- Favicon accent updated to `#9a6414`; 9 core URLs (home, indexes, top genres, /new, /shelf, /search) resubmitted to IndexNow (HTTP 200).

**Evidence**
- Live (deploy 1a0f0854); IndexNow `200 9`. Round 19 a11y re-audit in test-report-iter19.md.

## Round 21 — 2026-08-06

**Findings (by driver)**
- Visual/a11y (Round 19 re-audit residuals): 29 color-contrast nodes remained — amber `#9a6414` links inside the dark `bg-ink-900` section (3.52:1 on `#1a1916`) and remaining `text-ink-700/70` small text (4.43:1 on `#f7f6f3`). [P1]

**Fixes shipped**
- Dark-surface accent override: `.bg-ink-900 .text-amber-accent { color: #e8b05f }` (light amber ≥7:1 on `#1a1916`); light-background amber unchanged.
- All remaining `text-ink-700/70` bumped to `/75` across templates and app.js.

**Evidence**
- Live (deploy bcd327e4): served CSS contains the dark-surface override; `/` and `/shelf` render zero `/70` classes. Full axe re-audit in test-report-iter21.md.

## Round 22 — 2026-08-06

**Findings (by driver)**
- SEO/QA (new cases): out-of-range paginated pages (`/series?page=9999`, `/authors?page=9999`, `/genres/fantasy?page=999`) returned HTTP 200 with empty grids — soft-404s that waste crawl budget and can index as thin pages. [P2]
- SEO: `/search?q=…` result pages had no robots directive; canonical already points at `/search`, but query pages were still crawlable as duplicates. [P2]
- Data analytics: 2-day hits now 52 → 177/day (still self-test dominated); top paths are QA targets; no organic search terms yet.

**Fixes shipped**
- `page > pages` now returns the 404 page on `/series`, `/authors`, and `/genres/:slug` (letter views included).
- `<meta name="robots" content="noindex,follow">` on `/search` when a query is present (layout gained a `noindex` option); plain `/search` stays indexable.

**Evidence**
- Live (deploy 0d86b832): all three out-of-range URLs return 404; in-range pages (`/series?page=2`, `/genres/fantasy?page=5`, letter views) still 200; `curl /search?q=discworld` shows the robots meta, plain `/search` does not.

## Round 23 — 2026-08-06

**Findings (by driver)**
- UX walkthrough: finishing a long series requires ticking every book by hand (Discworld = 55 clicks); no way to reset a series without unticking each box. Competitors with accounts offer bulk "mark series read". [P1]

**Fixes shipped**
- "Mark all read" / "Clear progress" buttons under every series book list (client-side, ≥2 books, print-hidden). Reuses the localStorage store; preserves original tick timestamps when already read; progress bar/label, Up next badge, and My Shelf update immediately.

**Evidence**
- Live (deploy 018cc8ac): app.js serves the controls; live browser regression in test-report-iter23.md.

## Round 24 — 2026-08-06

**Findings (by driver)**
- UX/competitor: My Shelf lists what you've read but never answers "what should I read next?" — the core question account-based competitors (StoryGraph/Goodreads "want to read") solve. All the data needed is already on the device + catalog. [P1]

**Fixes shipped**
- New cached API `GET /api/series-books/:slug` (ordered id/title list, same dup-position ordering as the series page, `Cache-Control: max-age=3600`).
- My Shelf now shows "· Up next: <first unread book>" (linked) next to each followed series heading, or "· Series complete 🎉" when all books are read; standalone-author groups skipped; capped at 20 series per page load.

**Evidence**
- Live (deploy 16f476c9): `curl /api/series-books/mistborn` returns ordered JSON; unknown slug → 404 JSON. Live browser regression in test-report-iter24.md.

## Round 25 — 2026-08-06

**Findings (by driver)**
- Competitor/UX: Goodreads/StoryGraph offer instant search suggestions; Shelfmark required a full form submit + results page for every lookup — highest-friction step of the golden path (header search is on every page). [P1]

**Fixes shipped**
- `GET /api/suggest?q=` — prefix match, top 5 series (book_count>0) + 3 authors by size, `Cache-Control: max-age=3600`, min 2 chars.
- Typeahead dropdown on all three search forms (header desktop, header mobile, homepage hero): 200 ms debounce, stale-response guard, ArrowUp/Down + Enter + Escape keyboard support, `role=listbox/option`, click-outside close. Plain Enter still submits to /search.

**Evidence**
- Live (deploy 291c2160): `curl /api/suggest?q=disc` → Discworld first; 1-char query returns empty. Live browser regression in test-report-iter25.md.

## Round 26 — 2026-08-06

**Findings (by driver)**
- QA/data consistency: /genres index counted 0-book container series (fantasy said 279 while /genres/fantasy says 272; 50 zero-book rows across genres) — missed by the Round 16 sweep. [P2]
- SEO ops: /, /shelf, /genres content changed across R23–25 (bulk buttons, Up next, typeahead, counts) — core URLs due an IndexNow ping.

**Fixes shipped**
- `/genres` genre counts now filter `book_count > 0`, matching genre pages and homepage pills.
- IndexNow resubmitted 5 core URLs (/, /genres, /shelf, /series, /authors) — HTTP 200.

**Evidence**
- Live (deploy f009c4ad): /genres fantasy card shows 272 (was 279), matching /genres/fantasy. IndexNow `200 5`.

## Round 27 — 2026-08-06

**Findings (by driver)**
- Competitor (BSIO re-check, Jack Reacher page): BSIO prominently offers "Want To Print This Book List?" — a top reader use-case (taking a list to the library/bookstore). Shelfmark has had print CSS since R3 but no visible affordance; users would never discover Ctrl+P renders a clean list. [P2]
- BSIO also lists chronological order variants; still blocked for us (Wikidata lacks narrative-order data — unchanged since R3 benchmark).

**Fixes shipped**
- "Print list" button in the series-page pill row (`data-print` → `window.print()`, print-hidden itself); reuses the existing print stylesheet (hides nav/forms/checkboxes/badges, clean numbered list).

**Evidence**
- Live (deploy 735de9c8): button renders on /series/discworld; print behavior regression-verified in the R23 run (print page shows clean list). Browser check in next QA round.

## Round 28 — 2026-08-06

**Findings (by driver)**
- Visual/a11y: the R25 typeahead used bare `role=listbox/option` without full combobox semantics — screen readers get no expansion state or highlighted-option announcements (WAI-ARIA combobox pattern). [P2]
- UX (mobile walkthrough): the "New" nav link was `hidden sm:inline` — mobile users had no path to /new from the header. [P2]

**Fixes shipped**
- Typeahead upgraded to full ARIA combobox: input gets `role=combobox`, `aria-expanded`, `aria-autocomplete=list`, `aria-controls`; options get unique ids + `aria-selected`; keyboard highlight syncs `aria-activedescendant`.
- "New" now visible in the header nav at all breakpoints.

**Evidence**
- Live (deploy 01918a89): served app.js contains the aria wiring; `/` header shows the un-hidden New link. Browser regression in next QA round.

## Round 29 — 2026-08-06

**Findings (by driver)**
- Competitor/distribution: BSIO and most reading-order sites offer no machine-readable feed of new releases; RSS is a zero-login "natural distribution" channel (feed readers, aggregators, IFTTT/Zapier) that fits the no-account philosophy. [P1]
- Data: first-party stats still self-test dominated (search terms all internal); 3 email intents, 0 confirmed — RSS gives users a subscribe path that doesn't wait on the Resend key. [P2]

**Fixes shipped**
- `GET /new.rss`: RSS 2.0 feed of new/upcoming series installments (same cleaned query as /new, 100-item cap, 1h cache, items link to series reading-order pages).
- `/new` page: visible "RSS feed" link + `<link rel="alternate" type="application/rss+xml">` autodiscovery in head (layout gains optional `rss` opt).

**Evidence**
- Live (deploy 706643b0): `curl https://shelfmark.zalize.com/new.rss` → 200 `application/rss+xml`, valid XML with 31 items; /new head contains the alternate link and body shows the RSS link.

## Round 30 — 2026-08-06

**Findings (by driver)**
- Competitor/distribution: no reading-order site offers one-click list export for sharing (Reddit/Discord/notes); a plain-text "Copy list" with a link back is a natural share loop. [P1]
- QA (from R29 verification): the new /new "RSS feed" link failed axe `link-in-text-block` (2.27:1 vs surrounding text, hover-only underline) — broke the R21 zero baseline. [P1]

**Fixes shipped**
- "Copy list" button in the series-page pill row: copies "<name> — reading order" + numbered titles in rendered order + "via <series URL>" to the clipboard, with 2s "Copied ✓" feedback; print-hidden.
- RSS link gets a persistent `underline` class, restoring axe zero violations on /new.

**Evidence**
- Live QA (deploys df0aef7a → 2e850f87): clipboard content verified exactly (Discworld, 55 numbered titles + via URL); "Copied ✓" feedback; RSS/regression/typeahead/shelf all green; axe 0 violations on /new and /series/discworld after fix. See test-report-iter30.md and PR #8 comments.

## Round 31 — 2026-08-06

**Findings (by driver)**
- SEO/competitor: series-page `BookSeries` JSON-LD carried only name/author/count — no per-book composition, leaving rich-result potential (and machine readability of the reading order itself) on the table. No competitor exposes per-book structured data either. [P1]
- QA (self-caught pre-ship): first cut used the raw query order for `hasPart`, which diverges from the rendered order on duplicate-position series (Discworld would have led with Mort); switched to the same year-sorted `orderedBooks` used for display. [P1]

**Fixes shipped**
- `BookSeries` JSON-LD now includes `hasPart`: up to 50 `Book` items (name, sequential position matching the rendered list, datePublished, cover image, author).

**Evidence**
- Live (deploy b7ef1d86): /series/discworld LD `hasPart` = 50 items starting "1. The Light Fantastic (1986), 2. Mort (1987), 3. Equal Rites (1987)" — identical to the rendered/copy-list order; /series/mistborn = 8 items in publication order.

## Round 32 — 2026-08-06

**Findings (by driver)**
- UX walkthrough: My Shelf series sections rendered in arbitrary object-key order — the series you're actively reading could sit at the bottom. [P1]

**Fixes shipped**
- Shelf sections now sort by most recent activity (group with the newest tick first; items within a group already newest-first).

**Evidence**
- Live QA (deploy d0c25dfd, recorded): ticking Fire and Ice on Warriors moved that section to the top of /shelf; stats 10/3/7 → 11/3/8 and Up next advanced correctly; untick restored order and stats exactly; axe /shelf 0 violations. See test-report-iter32.md and PR #9.

## Round 33 — 2026-08-06

**Findings (by driver)**
- UX walkthrough: author pages had the same print stylesheet and trackable lists as series pages but no visible Share / Print list affordances — parity gap with the R27 series-page buttons. [P2]

**Fixes shipped**
- Author pages get a Share + "Print list" pill row under the intro (reuses the existing `data-share` / `data-print` handlers; row is print-hidden).

**Evidence**
- Live (deploy 2c78b079): /authors/brandon-sanderson renders both buttons; browser regression in next QA round.

## Round 34 — 2026-08-06

**Findings (by driver)**
- SEO: genre pages listed up to 60 series cards with only BreadcrumbList structured data — no machine-readable list (series pages got `hasPart` in R31). [P2]

**Fixes shipped**
- Genre pages add `ItemList` JSON-LD: `numberOfItems` = full genre total, `itemListElement` = the page's series with absolute positions across pagination.

**Evidence**
- Live (deploy be25e741): /genres/fantasy LD → numberOfItems 272, 60 items, first "Discworld" position 1; page 2 first position 61.

## Round 35 — 2026-08-06

**Findings (by driver)**
- Competitor (BSIO re-check via Sanderson page): BSIO lists upcoming installments (e.g. 2026 titles) inline but with no visual emphasis; nothing on our book lists flagged current-year or future releases either — users scanning a long list can miss that a new installment just landed. [P2]

**Fixes shipped**
- Book list rows now badge current-year releases with an amber "New" chip and future-year releases with "Upcoming" (print-hidden; series and author pages both, via shared `bookList`).

**Evidence**
- Live (deploy 52bdbe2c): /series/the-murderbot-diaries shows 2 "New" chips on its 2026 installments. Browser/axe regression in next QA round.

**QA follow-up (same day)**
- Live QA caught the chip failing axe color-contrast (4.36:1 on the amber/10 tint). Replaced the utility classes with a dedicated `.year-chip` (bg #f0e6d6 / text #6d4708, ≈7:1; print-hidden via the print media block). Re-audit on deploy 0e11b673: /series/the-murderbot-diaries back to 0 violations. "Upcoming" chip remains runtime-unverified (no >2026 book in catalog).

## Round 36 — 2026-08-05

**发现（五驱动）**
- 数据分析：搜索词统计里有用户按「书名」而非系列名搜索；联想下拉（R25/R28）只覆盖系列+作者，书名前缀无候选。
- 竞品：Goodreads/StoryGraph 联想均含书目条目。

**修复（P1）**
- `/api/suggest` 增加书名前缀匹配（≤3 条，去重，跳转所属系列页），联想合计上限 8 条；客户端已有的 kind 标签自动显示 "book"。

**证据**
- 线上验证：`/api/suggest?q=platform dec` → Platform Decay → /series/the-murderbot-diaries；`q=mistborn` → 1 系列 + 3 书目条目。
- 部署 48ce73de；typecheck 通过。

## Round 37 — 2026-08-05

**发现（五驱动）**
- 数据分析 + UX 走查：/series 浏览首页（默认 All 视图）按 book_count 排序，前排被目录噪音占领（xkcd 3200 条、Lecture Notes in Computer Science、ASCL working papers、动物志等非小说书系），第一印象差且不利收录。

**修复（P1）**
- /series 默认排序改为「有作者且有流派的书系优先」再按册数：`ORDER BY (author_id IS NOT NULL AND genre IS NOT NULL) DESC, book_count DESC`；文案同步改为 "best-documented first"。字母视图仍按名称排序，无 URL 变化、无数据删除。

**证据**
- 线上验证：/series 首屏现为 Kuroko's Basketball / One Piece / Star Trek / Nancy Drew / Goosebumps / Sherlock Holmes 等真实书系；xkcd、LNCS、working papers 退后。
- 部署 366d4785；typecheck 通过。

## Round 38 — 2026-08-05

**发现（五驱动）**
- 竞品 + SEO：系列页无法一键跳到所属流派；流派页是站内强枢纽（fantasy 272 系列），但反向内链缺失，既损发现性也损内链权重。

**修复（P2）**
- 系列页信息条新增流派 chip（如 Fantasy / Science fiction），链接到 /genres/{slug}，capitalize 展示；无流派的系列不显示。

**证据**
- 线上验证：/series/mistborn 出现 fantasy chip → /genres/fantasy；无流派系列不受影响。
- 部署 7d993d3a；typecheck 通过，styles.css 已重建（capitalize）。

## Round 39 — 2026-08-05

**发现（五驱动）**
- 竞品 + 分发：浏览器可通过 OpenSearch 把站点注册为地址栏搜索引擎（Goodreads 等均支持），Shelfmark 缺此免登录分发入口。

**修复（P2）**
- 新增 /opensearch.xml（OpenSearchDescription：/search?q={searchTerms} 模板 + JSON 建议端点）与 /api/opensearch-suggest（OpenSearch 建议格式，前 5 个系列名，1h 缓存）；全站 <head> 加 rel="search" 自动发现。

**证据**
- 线上验证：/opensearch.xml 200 + application/opensearchdescription+xml；/api/opensearch-suggest?q=disc → ["disc",["Discworld",…]]；首页 head 含 opensearch link。
- 部署 31aad757；typecheck 通过。注意：新路由边缘传播约需 2–5 分钟（与 /new.rss 现象一致）。

## Round 40 — 2026-08-05

**发现（五驱动）**
- 视觉/移动端：站点缺 Web App Manifest 与 theme-color，移动端「添加到主屏幕」体验为普通书签，浏览器 UI 不随品牌配色。

**修复（P2）**
- 新增 /manifest.json（name/short_name/standalone/背景与主题色 #f7f6f3/SVG 图标）；全站 <head> 加 rel="manifest" + theme-color meta。追踪器本就 localStorage 本地化，PWA 安装后离线书架天然可用（无 SW，仅安装性增强）。

**证据**
- 线上验证：/manifest.json 200 application/json；首页 head 含 manifest link 与 theme-color。
- 部署 fa2f528a；typecheck 通过。

## Round 41 — 2026-08-05

**发现（五驱动）**
- SEO：作者页只有 Person + Breadcrumb 结构化数据，缺系列列表 ItemList（流派页 R34 已有，作者页不一致）。
- UX：R36 联想已支持书名，但搜索框 placeholder 仍写 "Search a series or author…"，能力被低估。

**修复（P2×2）**
- 作者页 JSON-LD 增补 ItemList（Book series by {author}，按 book_count 排序，含每系列 URL）。
- 搜索框 placeholder（桌面+移动）改为 "Search series, authors, books…"。

**证据**
- 线上验证：/authors/brandon-sanderson JSON-LD 含 Person + BreadcrumbList + ItemList(6)；placeholder 已更新。
- 部署 ea6e37e4；typecheck 通过。

## Round 42 — 2026-08-05

**发现（五驱动）**
- UX + 竞品：/new 混排全部流派（31 条含 manga/学术等），读者无法按兴趣浏览；竞品新书页普遍可按类型过滤。
- 分发：R37-41 大改后核心 hub URL 需重新提交 IndexNow。

**修复（P1+运营）**
- /new 新增流派过滤 chips（按条数排序 + All，选中态深色、含计数、print 隐藏），?genre= 大小写不敏感匹配，过滤视图 noindex,follow 防重复收录；无效 genre 回落 All。
- IndexNow 重新提交 9 个核心 URL（200）。
- QA 抓到首版 bug：混合大小写流派（Nordic noir）因 lowercase includes 匹配失败导致过滤不生效，已修复（find + toLowerCase 对比）。

**证据**
- 线上验证：/new?genre=science%20fiction → 4 条 + noindex；chips 渲染于 /new；部署 d48426e6；typecheck 通过。

## Round 43 — 2026-08-05

**发现（五驱动）**
- UX + 内链：流派页与 /new 流派过滤（R42）互不相通：读者在 /genres/science-fiction 看不到该流派今明两年有哪些新书。

**修复（P2）**
- 流派详情页副标题新增「New & upcoming in {genre} (N)」链接 → /new?genre={genre}（小写传参，R42 匹配大小写不敏感）；N 为该流派 2026–2027 新作数（与 /new 相同的净化条件），为 0 时不显示。

**证据**
- 线上验证：/genres/science-fiction 显示 "New & upcoming in science fiction (4)" → /new 过滤视图；/genres/fantasy 无新作故无链接（正确）。
- 部署 89adff10；typecheck 通过。

## Round 44 — 2026-08-05

**发现（五驱动）**
- 安全审计复检：全站响应头缺 Strict-Transport-Security 与 Permissions-Policy（CSP/XCTO/Referrer/XFO 均在位）。

**修复（P1）**
- 安全头中间件补 HSTS（max-age=31536000; includeSubDomains）与 Permissions-Policy（禁 camera/microphone/geolocation/payment）。

**证据**
- 线上验证：响应头含两项新头；其余安全头不变。
- 部署 3852c8c5；typecheck 通过。

## Round 45 — 2026-08-05

**发现（五驱动）**
- 竞品/UX：系列页有「Copy list」一键分享，但作者页的各系列区块没有，作者页读者要多跳一次才能复制阅读顺序。

**修复（P2）**
- 作者页每个系列区块标题行新增「Copy list」按钮（复用 data-copylist 处理器，复制编号书单+回链 /series/{slug}；Standalone books 区块不加，因无系列落地页）。

**证据**
- 线上验证：/authors/brandon-sanderson 6 个系列各有按钮；/authors/martha-wells 1 个（Standalone 区块正确无按钮）。
- 部署 7256351c；typecheck 通过。
