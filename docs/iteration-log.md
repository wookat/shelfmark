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

## Round 46 — 2026-08-05

**发现（五驱动）**
- 竞品/UX：读者最常问「这个系列最近出新书了吗」，R35 的行内 New 徽章要滚动到列表里才看到；页首无醒目提示。

**修复（P2）**
- 系列页 H1 下新增新作横幅：最新一本出版年 ≥ 今年时显示「New in {year} “{title}” is the newest … book — it's in the list below」；年份 > 今年显示 Upcoming 变体。复用 .year-chip 高对比配色。

**证据**
- 线上验证：/series/the-murderbot-diaries 显示 New in 2026 + Platform Decay 横幅；/series/discworld（无今年新作）正确不显示。
- 部署 71cab39b；typecheck + css 重建通过。

## Round 47 — 2026-08-05

**发现（五驱动）**
- UX 走查：新访客首次打开 /shelf 只有一个「Browse series」按钮，空状态缺少具体起步建议，跳出成本高。

**修复（P2）**
- 空书架状态新增「Popular starts」行：Discworld / Mistborn / The Murderbot Diaries / New releases 四个直达链接（纯客户端，不影响已有进度用户）。

**证据**
- 线上验证：app.js 已含 Popular starts（部署 7d0cf7d3）；node --check 语法通过。

## Round 48 — 2026-08-05

**发现（五驱动）**
- UX 走查：搜索零结果页只有一行提示，访客到此即流失（数据驱动亦显示 /search 有零结果访问）。

**修复（P2）**
- 零结果状态补充：增加 genres 浏览链接，并渲染 6 个「Popular series」卡片（与首页同口径的净化查询），把死胡同变成继续探索的入口。

**证据**
- 线上验证：/search?q=zzzzqqqq 显示 Popular series 卡片区；/search?q=discworld（有结果）不显示。
- 部署 77944115；typecheck 通过。

## Round 49 — 2026-08-05

**发现（五驱动）**
- UX/分发：R29 RSS、R39 OpenSearch、R40 可安装 PWA 等分发通道对用户不可见，/about 未提及任何跟进新书的方式。

**修复（P2）**
- /about 新增「Ways to follow new releases」板块：/new + 流派过滤、RSS 订阅、浏览器地址栏搜索引擎（OpenSearch）、移动端 Add to Home Screen 四条路径。

**证据**
- 线上验证：/about 显示新板块（部署 5b4bb009）；typecheck 通过。

## Round 50 — 2026-08-05

**发现（五驱动）**
- QA/分发：R43–49 改动了系列页、/about、搜索页等大批页面，需要全站健康检查并向搜索引擎重新宣告。

**修复（P1/例行）**
- 16 个关键端点线上健康检查全部 200（含 sitemap/robots/opensearch/manifest/RSS）。
- IndexNow 全量重提交 25,647 个 URL（4 批，全部 HTTP 200）。

**证据**
- 健康检查与 IndexNow 输出记录于会话；无回归。

## Round 51 — 2026-08-05

**发现（五驱动）**
- 竞品调研（BSIO 复访）：BSIO 靠「suggestion box + email us」形成用户纠错/补录闭环；Shelfmark 仅 /about 深处有一处报错邮箱，系列页无就地反馈入口。BSIO 另有 Book Release Calendar（月度粒度）——我方数据只有年份粒度，为不伪造数据暂不做日历视图。

**修复（P2）**
- 系列页追踪说明行新增「Spotted a wrong or missing book? Report it」mailto 链接，主题自动带系列名（Shelfmark data issue: {series}），建立数据纠错闭环。

**证据**
- 线上验证：/series/discworld 含预填主题的 mailto 链接（部署 f09dee2c）；typecheck 通过。

## Round 52 — 2026-08-05

**发现（五驱动）**
- 数据分析：2,590 个有书系列中 1,516 个缺 genre（其中 709 个有作者），被排除在 /genres 浏览、/new 净化查询与流派内链之外。

**修复（P1，数据扩容）**
- 新增 scripts/backfill_genres.py（系列实体 P136 回填，仅命中 2）与 scripts/backfill_genres_books.py（按系列各书 P136 多数投票回填，≥2 本一致或 2 本系列 1 本即采纳）。
- 扫描 7,124 本书的 Wikidata 声明，370 个系列新增 genre（74 个不同流派），fantasy 272→379、science fiction→287。

**证据**
- 线上验证：/genres/fantasy 显示 379 series；新入流派样本 Fitz and the Fool（Robin Hobb）归入 fantasy 正确。
- 未伪造数据：全部取自 Wikidata P136；无多数一致者保持 NULL（余 1,145 个）。

## Round 53 — 2026-08-05

**发现（五驱动）**
- 数据分析（R52 后审计）：genre 词表碎片化——crime literature/crime fiction、children's fiction/children's literature、romance/romance novel 等同义分裂，稀释流派聚合页；另有 7 个非流派的错误 P136 值（如作者名 Gunilla Bergström、timeline）。

**修复（P1，数据治理）**
- 新增 scripts/normalize_genres.py：23 组保守同义合并 + 7 个错误值清空，共 96 行修正。fantasy 379→385、crime fiction 16→38、children's literature 51→73。

**证据**
- 线上验证：/genres/fantasy 385、/genres/crime-fiction 38、旧 /genres/crime-literature 正确 404。

## Round 54 — 2026-08-05

**发现（五驱动）**
- SEO 审计（R52–53 后）：genre 词表扩至 190+，其中大量 1–2 个系列的薄页（如 cozy mystery）可经系列页流派 chip 被爬虫发现，但不在 sitemap（阈值 n≥3），存在薄内容收录风险。

**修复（P1，SEO）**
- 流派详情页 total < 3 时输出 noindex,follow（与 /new 过滤视图、搜索结果页策略一致），链接权重仍可传递。

**证据**
- 线上验证：/genres/cozy-mystery（1 系列）输出 noindex,follow；/genres/fantasy（385）无 noindex。
- 部署 4783d03e；typecheck 通过。

## Round 55 — 2026-08-05

**发现（五驱动）**
- QA/分发：R52–54 大幅变更流派数据与 sitemap 集合（新增流派页、合并流派、薄页 noindex），需向搜索引擎重新宣告并做健康检查。

**修复（例行）**
- IndexNow 全量重提交 25,645 URL（4 批全部 HTTP 200）；关键端点健康检查全 200。

**证据**
- IndexNow/健康检查输出记录于会话；无回归。

## Round 56 — 2026-08-05

**发现（五驱动·QA/SEO 交叉）**
- P1（SEO 一致性）：sitemap 第 1 分片的流派 URL 列表按「全部系列 ≥3」筛选，未排除 0-book 系列；而流派详情页的 noindex 阈值按「有书系列 <3」判定。导致 8 个已 noindex 的薄流派页（satire、autobiography、anthropomorphic comic 等）仍被 sitemap 宣告，向搜索引擎发送矛盾信号。

**修复**
- sitemap 流派查询补 `AND book_count > 0`，与 /genres 索引页及详情页 noindex 阈值完全对齐。

**证据**
- D1 审计确认 8 个流派 all_series≥3 但 with_books<3；部署 0db23cb9 后 sitemap（cache-busted 及 workers.dev 直连）不再包含上述 slug；typecheck 通过。

## Round 57 — 2026-08-06

**发现（五驱动·SEO/UX）**
- P2：R53 流派词表合并后，23 个旧流派 slug（crime-literature、fantasy-literature、romance 等）直接 404，历史外链/收藏与可能已被收录的 URL 全部断链。

**修复**
- /genres/:slug 增加 GENRE_SLUG_REDIRECTS 映射：旧 slug 301 到规范流派页（crime-literature→crime-fiction 等 24 条映射）。

**证据**
- 线上实测：/genres/crime-literature、/genres/romance、/genres/fantasy-literature、/genres/young-adult-fiction 均 301 至规范页且最终 200；typecheck 通过；部署 d63bd7de。

## Round 58 — 2026-08-06

**发现（五驱动·竞品/UX/SEO）**
- P2：作者页是流量入口（22,839 页），但读完一个作者后无横向发现路径；BSIO 类站点靠「相似作者」内链留住读者并强化 pSEO 内链网络。

**修复**
- 作者页新增「More {genre} authors」区块：按该作者最大有流派系列的流派，推荐同流派 6 位作者（按其最大系列规模排序）+「All {genre} series →」入口；无流派作者不显示；打印时隐藏。

**证据**
- 线上实测 /authors/brandon-sanderson 显示「More fantasy authors」：Terry Pratchett、Piers Anthony、Mercedes Lackey 等 6 位 + fantasy 流派入口；typecheck 通过；部署 409ea791。

## Round 59 — 2026-08-06

**发现（五驱动·SEO 一致性）**
- P2：/genres 索引页是全站唯一没有结构化数据的列表页（系列/作者/流派详情页均有 BreadcrumbList/ItemList），59 个流派入口未向搜索引擎声明。

**修复**
- /genres 页补 BreadcrumbList + ItemList JSON-LD（59 个流派，含规范 URL）。

**证据**
- 线上解析 /genres 的 ld+json：BreadcrumbList + ItemList numberOfItems=59；typecheck 通过；部署 17223d0b。

## Round 60 — 2026-08-06

**发现（五驱动·分发/竞品）**
- P2：/new 已有流派过滤视图，但 RSS 只有全量 feed；读者想只订阅某一流派的新书（feed 阅读器是无账号分发的主要通道）。

**修复**
- /new.rss 支持 ?genre= 过滤（标题/链接/self URL/描述随流派变化，未知流派回退全量）；/new 过滤视图中的 RSS 链接自动携带当前流派参数并标注「RSS feed (fantasy)」。

**证据**
- 线上实测：?genre=fantasy 标题「New & Upcoming Fantasy Series Books」1 条、全量 33 条、未知流派回退 33 条、XML 均可解析；/new?genre=fantasy 页面 RSS 链接为流派版；typecheck 通过；部署 34bdbde6。

## Round 61 — 2026-08-06

**发现（五驱动·分发）**
- P2：RSS 自动发现 `<link rel="alternate">` 只在 /new 页输出；feed 阅读器订阅首页或系列页时无法自动发现订阅源。
- P1（数据，进行中）：核心系列书目封面覆盖率仅 41%（4,263/10,418）；已启动 Open Library 封面匹配后台任务（6,155 本待匹配，API 限速下跨轮运行，结果将在后续轮次回填 D1）。

**修复**
- layout 默认对全站每页输出 RSS 自动发现链接（默认 /new.rss，/new 页保持原逻辑）。

**证据**
- 线上实测首页、/series/discworld、/genres 均含 application/rss+xml link；typecheck 通过；部署 90b0b331。

## Round 62 — 2026-08-06

**发现（五驱动·分发/视觉）**
- P2：作者页分享到社交平台时 og:image 一律是品牌卡；系列页已用真实封面，作者页（22,839 页）未对齐，分享预览吸引力低。

**修复**
- 作者页 og:image 使用其第一本有封面书的 Open Library 大图（-L.jpg），无封面作者回退品牌卡。

**证据**
- 线上实测 /authors/brandon-sanderson og:image=covers.openlibrary.org/b/id/8737489-L.jpg；/authors/randall-munroe 回退 /og.png；typecheck 通过；部署 8243b45c。

## Round 63 — 2026-08-06

**发现（五驱动·流程合规）**
- P2（Company OS 交接上下文制度）：长期项目要求仓库内维护 docs/handoff-context.md，Shelfmark 尚缺，换会话/负责人接手成本高。

**修复**
- 新增 docs/handoff-context.md：基础设施/技术栈/数据管线/统计/已知缺口/流程约定全量沉淀。

**证据**
- 文档入库本轮 commit；无线上代码变更（无需部署）。

## Round 64 — 2026-08-06

**发现（五驱动·性能）**
- P2：静态资源（styles.css/app.js/favicon.svg/og.png/manifest.json）以 max-age=0, must-revalidate 提供，每次页面浏览都要 ETag 往返，移动端重复访问白白多付 RTT。

**修复**
- 新增 public/_headers（Workers Assets 支持）：css/js max-age=3600，图标/og 图/manifest max-age=86400；ETag 到期后仍可协商复用。
- 附带：scripts/fetch_ol_covers.py 超时 30→90s、间隔 0.6→1.0s（OL 搜索 API 慢查询在 30s 超时下大面积失败）；封面回填后台任务持续运行中。

**证据**
- 线上验证（workers.dev 直连绕边缘缓存）：styles.css/app.js Cache-Control: public, max-age=3600，favicon.svg 86400；部署 283902e9。

## Round 65 — 2026-08-06

**发现（五驱动·分发/竞品）**
- P1（分发）：全部竞品（BSIO/readingorderlist 等）都没有开放数据接口；提供免 key 的 JSON API 可吸引开发者引用与反链（天然分发），且我们数据本就来自 CC0 的 Wikidata。

**修复**
- 新增公开 API `GET /api/series/{slug}.json`：series 名称/作者/流派/出版顺序书目（与页面渲染顺序一致，含重复序号回退逻辑），CORS `*`、Cache-Control 1h、slug 白名单正则防注入；未知 slug/非法文件名 404。
- /about 新增「Open data API」板块（示例链接 + CC0 出处说明）。

**证据**
- 线上实测 /api/series/mistborn.json 返回 7 本正确顺序 JSON、ACAO:*、max-age=3600；does-not-exist.json 与路径穿越样例均 404；typecheck+css 通过；部署 01936eba。

## Round 65 补充（QA 修复）— 2026-08-06

**发现**
- P1（QA 回归）：R61 全站 RSS autodiscovery 上线后，/new?genre= 过滤页 head 中的 alternate link 指向全量 /new.rss 而非过滤 feed（页面可见链接正确，仅 head 链接错误）。

**修复**
- /new 路由 layout 的 rss 参数改为随 activeGenre 拼接 ?genre=。

**证据**
- 线上实测 /new?genre=fantasy head alternate = /new.rss?genre=fantasy，/new 仍为 /new.rss；typecheck 通过；部署 883d242f。

## Round 66 — 2026-08-06

**发现（五驱动·视觉/SEO）**
- P2：genre 详情页 title/h1/面包屑与 /genres 索引卡片直接输出小写流派名（“fantasy Book Series in Order”），观感不专业，SERP 标题也不规范。

**修复**
- 新增 gtitle() 标题化 helper（按词首字母大写，保留连字符/撇号），应用于 genre 页 title/h1/面包屑/BreadcrumbList、/genres 索引卡片与 ItemList name；正文句中引用保持小写。

**证据**
- 线上实测 “Science Fiction Book Series in Order (290 Series)”、“Fantasy …(385)”、“Children's Literature …(73)”；typecheck 通过；部署 d7e03599。

## Round 67 — 2026-08-06

**发现（五驱动·竞品/视觉）**
- P1：竞品（BSIO 等）作者页普遍有作者照片，我们的 1,120 个有系列作者页纯文字，视觉信任感与分享预览都吃亏。

**修复**
- 新增 scripts/fetch_author_photos.py：按 50/批走 Wikidata wbgetentities 拉 P18 头像，669/1,075 位有系列作者命中。
- D1 authors 表新增 photo_url（schema.sql 同步），批量回填 669 条 Commons Special:FilePath URL（width=256）。
- 作者页头部渲染圆角头像（float-right，lazy，无照片不渲染）；Person JSON-LD 加 image；og:image 优先作者照片（width=512）→ 无照片回退书封 → 品牌卡；CSP img-src 放行 commons.wikimedia.org 与 upload.wikimedia.org（跳转目标）。

**证据**
- 线上实测 /authors/brandon-sanderson 头像与 og:image 均为 Commons 照片、图片 URL 200 image/jpeg；typecheck 通过；部署 40fbdf7a。

## Round 68 — 2026-08-06

**发现（五驱动·视觉/UX）**
- P2：R67 拿到 669 位作者照片后，首页「Prolific authors」与 /authors 索引卡片仍是纯文字，视觉密度低且没利用新数据。

**修复**
- 抽出 authorCard() 组件：48px 圆形头像（Commons width=96，lazy），无照片显示首字母占位圆（与书封占位一致的风格），应用于首页与 /authors 全部列表页。

**证据**
- 线上实测首页出现 R.L. Stine/Asimov/Nora Roberts 等头像 URL、/authors?letter=B 渲染头像卡；width=96 URL 200 image/jpeg；typecheck+css 通过；部署 0bc899c3。

## Round 69 — 2026-08-06

**发现（五驱动·UX/分发）**
- P2：R60 的分流派 RSS 只能从 /new 过滤视图发现；genre 详情页（订阅意图最强的场景）既无可见 RSS 链接、head autodiscovery 也指向全量 feed。

**修复**
- genre 详情页副标题新增「RSS」链接（紧跟 New & upcoming 入口）；layout rss 参数改为该流派的 /new.rss?genre=…，feed 阅读器在 genre 页可直接发现分流派订阅源。

**证据**
- 线上实测 /genres/fantasy 可见链接 /new.rss?genre=fantasy、/genres/science-fiction head autodiscovery=/new.rss?genre=science%20fiction 且 feed 200；typecheck 通过；部署 a1133844。

## Round 70 — 2026-08-06

**发现（五驱动·测试/数据）**
- 例行批尾巡检：R66–69 改动了全部 genre 页 title/面包屑、作者页与索引头像、genre RSS，需要全站健康检查并把变化推给搜索引擎。

**修复/动作**
- 17 个核心端点健康检查全部 200（页面/feed/API/sitemap/robots/opensearch/manifest）。
- IndexNow 全量重提交 25,637 URL（4 批次全部 HTTP 200）。

**证据**
- 健康检查输出与 IndexNow 4×200 记录于会话；无代码改动。

## Round 71 — 2026-08-06

**发现（五驱动·竞品/SEO）**
- P2：系列页早有 FAQ+FAQPage 结构化数据，但 22,839 个作者页没有——"how many books has X written"、"latest X book" 类长尾问句无着陆内容。

**修复**
- 作者页新增自动生成 FAQ（书目总数/最新一本/最长系列，全部由目录数据推导、无臆测），可见 dl 区块 + FAQPage JSON-LD，与系列页样式一致；无数据的问题自动省略。

**证据**
- 线上实测 /authors/brandon-sanderson 渲染 3 条 FAQ 且 JSON-LD FAQPage 含相同问答（60 books/6 series、最新 Moment Zero、最长 Mistborn 8 books 2006–2022）；typecheck 通过；部署 f04e040e。

## Round 72 — 2026-08-06

**发现（五驱动·UX/视觉）**
- P2：搜索结果页 Authors 区仍是旧纯文字卡，与首页//authors 的头像卡（R68）不一致。

**修复**
- 搜索结果 Authors 区改用共享 authorCard()（头像/首字母占位），三处作者卡样式统一。

**证据**
- 线上实测 /search?q=sanderson Authors 卡渲染 Commons 头像；typecheck 通过；部署 2280247a。

## Round 73 — 2026-08-06

**发现（五驱动·竞品）**
- P1：StoryGraph/Goodreads 的年度阅读目标是核心留存功能，我们的 /shelf 只有静态统计，没有任何「目标感」。

**修复**
- /shelf 新增年度阅读目标卡：Set goal 设定（prompt，1–9999，0/空清除），进度条（role=progressbar+aria）显示「今年已读/目标」，达标显示 🎉；目标按年份存 localStorage（shelfmark:goal:YYYY），不出浏览器。

**证据**
- app.js 语法校验+线上已含 goal 代码；Tailwind 类齐全；部署 5e9d2833；完整交互回归排入批尾 QA。

## Round 74 — 2026-08-06

**发现（五驱动·UX/分发）**
- P2：R73 加了年度目标后，「Download my reading card」分享卡未体现目标进度，分享传播少了最有炫耀价值的信息。

**修复**
- 分享卡副标题追加「YYYY goal X/N（达标 ✓）」，仅在设定了目标时显示；数据全部来自 localStorage。

**证据**
- app.js 语法校验通过、线上 app.js 已含 cardGoal 逻辑（etag 更新）；部署 419a600b；画布渲染回归排入批尾 QA。

## Round 75 — 2026-08-06

**发现（五驱动·测试/数据）**
- 批尾巡检：R71–74 改动作者页（FAQ）、搜索结果（头像卡）、/shelf 与分享卡（年度目标），需全站回归+搜索引擎重提交。

**修复/动作**
- 8 个核心端点健康检查全 200；IndexNow 全量重提交 25,637 URL（4×200）；完整浏览器回归交由 QA（含录屏），结果见 PR #12 评论。

## Round 76 — 2026-08-06

**发现（五驱动·视觉/竞品）**
- P1：系列卡（首页 Popular/流派页/搜索/相关推荐/A–Z）纯文字无封面，视觉密度低于 BSIO/OrderOfBooks 的图文卡；而目录里 1,198 个有书系列已有首本封面可用。

**修复**
- series 表新增 cover_url 列（D1 已迁移+schema.sql 同步），一次性 SQL 回填 = 各系列第一本有封面书的封面（1,198/2,590）；seriesCard 统一渲染 40×56 封面缩略图（lazy、无封面显示首字母占位），全站 8 处系列网格生效；修正卡内 span>p 非法嵌套为 div。

**证据**
- 线上实测 workers.dev 首页 Popular series 12 卡全部带缩略图，/genres/fantasy 卡片含 covers.openlibrary.org 图；typecheck+CSS 构建通过；部署 719dbcdb。

## Round 77 — 2026-08-06

**发现（五驱动·数据/分发）**
- P2：/new.rss 条目纯文本，无封面 enclosure——feed 阅读器（Feedly/NetNewsWire 等）里没有视觉卡片，分发吸引力弱于带图 feed。

**修复**
- /new.rss（含分流派变体）为有封面的条目输出 <enclosure url="…-L.jpg" type="image/jpeg">，无封面条目保持不变。

**证据**
- 线上 /new.rss 含 5 个 enclosure（如 Platform Decay/The Murderbot Diaries → covers.openlibrary.org 15154430-L.jpg），XML 校验通过；部署 a515e1dd。

## Round 78 — 2026-08-06

**发现（五驱动·竞品/分发）**
- P2：开放 API 只有系列维度（/api/series/{slug}.json），作者书目（22,839 位）无 JSON 出口——开发者要拼一个作者的全部系列只能爬 HTML。

**修复**
- 新增 GET /api/authors/{slug}.json：作者名/URL/统计 + 全部有书系列（名称/流派/册数/年份跨度/页面 URL/对应系列 API URL），CORS + 1h 缓存，未知或非法 slug 404；/about「Open data API」板块补文档。

**证据**
- 线上实测 brandon-sanderson.json 返回 6 系列/60 books 且首条 Mistborn 带 api 链接；nope-xyz.json 与 ..%2Fetc.json 均 404；ACAO:* + max-age=3600 头已验证；typecheck 通过；部署 b8f9b427。

## Round 79 — 2026-08-06

**发现（五驱动·UX/竞品）**
- P1：Goodreads/StoryGraph 首页核心是「继续在读」；我们的首页对老用户与新用户完全一样，已有进度的访客要自己想起在读哪个书系再搜一遍。

**修复**
- 首页新增「Continue reading」条（纯客户端）：从 localStorage 取最近有勾选活动的 ≤4 个书系（排除 standalone），显示书系名+已读册数，点击直达系列页；无进度用户不渲染任何内容；全部 DOM API 构建（textContent），localStorage 字符串不注入 HTML；数据不出浏览器。

**证据**
- 首页含 #continue-reading 挂载点（线上已验证），app.js node --check 通过；完整交互回归排入批尾 QA；部署 f99f976c。

## Round 80 — 2026-08-06

**发现（五驱动·测试/数据）**
- 批尾例行：R76–79 上线后核心路由健康检查 + IndexNow 全量重提交（本批新增 /api/authors API 与首页/卡片结构变化）。

**修复/动作**
- 10 个核心端点（含新 /api/authors/brandon-sanderson.json）线上全 200；IndexNow 全量重提交 25,637 URL（4 批均 200：8000/8000/8000/1637）。

**证据**
- 见上方响应码清单；提交脚本 scripts/indexnow.sh 输出 4×200。

## Round 81 — 2026-08-06

**发现（五驱动·QA/UX）**
- P1：批尾 QA 指出（v1 起既有行为）：首页/流派/索引等列表页的系列卡进度条永远 0%——只有同页存在勾选列表时才填充，已有进度的用户在列表页看不到自己的进度。

**修复**
- seriesCard 进度条增加 data-total（册数）；app.js 按 localStorage 中各 slug 的已读计数填充列表页卡片进度条（min 100%，系列页勾选列表仍由 updateSeriesUI 接管避免双写）。

**证据**
- /genres/fantasy 线上含 data-total 属性；node --check + typecheck 通过；交互回归排入批尾 QA；部署 19a7891b。

## Round 82 — 2026-08-06

**发现（五驱动·竞品/UX）**
- P2：/shelf 只有 JSON 备份；Goodreads/StoryGraph 用户习惯 CSV（可导入表格/其他工具），迁出通道缺失影响信任感。

**修复**
- /shelf 新增「Export CSV」按钮：Title,Series,Date Read 三列（RFC4180 引号转义，无效时间戳日期留空），纯客户端生成下载，数据不出浏览器。

**证据**
- 线上 /shelf 含 export-csv-btn；node --check + typecheck 通过；交互回归排入批尾 QA；部署 570d26d4。

## Round 83 — 2026-08-06

**发现（五驱动·视觉/分发）**
- P2：流派页（59+ 页）og:image 仍是通用品牌卡，分享预览不如带封面的作者/系列页。

**修复**
- 流派页 og:image 改用该页第一个有封面系列的 -L.jpg 大图（无封面回退 /og.png）。

**证据**
- 线上 /genres/fantasy og:image=covers.openlibrary.org/b/id/14648805-L.jpg；部署 3b56dfe2。

## Round 84 — 2026-08-06

**发现（五驱动·竞品/分发）**
- P2：AI 助手/答案引擎日益成为「reading order」问句的入口；站点无 llms.txt，结构与 API 对 LLM 爬取不友好，竞品也均未提供（差异化窗口）。

**修复**
- 新增 GET /llms.txt（llmstxt.org 格式）：站点定位、关键入口（/series /authors /genres /new /about）、两个开放 API 的用法与引用规范，24h 缓存。

**证据**
- 线上 https://shelfmark.zalize.com/llms.txt 返回完整文档；typecheck 通过；部署 3b56dfe2。

## Round 85 — 2026-08-06

**发现（五驱动·测试/数据）**
- 批尾例行：R81–84 上线后核心路由健康检查 + IndexNow 全量重提交。

**修复/动作**
- 8 个核心端点（含新 /llms.txt）线上全 200；IndexNow 全量重提交 25,637 URL（4×200：8000/8000/8000/1637）。

**证据**
- 见上方响应码清单；scripts/indexnow.sh 输出 4×200。

## Round 86 — 2026-08-06

**发现（五驱动·视觉/无障碍）**
- P1：站点无深色模式；系统 prefers-color-scheme: dark 的用户（移动端占比高）夜间阅读体验刺眼，竞品（StoryGraph/Hardcover）均支持。

**修复**
- Tailwind v4 调色板变量在 @media (prefers-color-scheme: dark) 下整体重映射（ink-50→#16140f 页底、white→#1e1c16 卡面、amber→#e8b05f 保证 ≥4.5:1），year-chip/up-next-badge/反色区单独修正，封面图 brightness(.92)；<meta name="color-scheme"> + 双 theme-color。

**证据**
- 线上 styles.css 含 prefers-color-scheme 块；首页 color-scheme meta ×3；部署 1c6013ca。

## Round 87 — 2026-08-06

**发现（五驱动·UX/竞品）**
- P2：无「随便看看」式发现入口；新访客除搜索/浏览外缺少低门槛探索路径。

**修复**
- 新增 GET /random：从有作者+有流派、2–80 本的真实系列中随机 302 至系列页（no-store + X-Robots-Tag noindex，robots.txt Disallow）；首页搜索框下加「surprise me with a series」入口。

**证据**
- 线上 /random 连续两次 302 至不同系列（freyaverse、aquasilva-trilogy），头部齐全；部署 31fc8944。

## Round 88 — 2026-08-06

**发现（五驱动·UX/视觉）**
- P2：PWA manifest 无 shortcuts（长按图标菜单为空）；键盘用户无快捷聚焦搜索方式。

**修复**
- manifest.json 增加 My Shelf / New & upcoming / Surprise me 三个 shortcuts；全站「/」键聚焦头部搜索框（输入框内不劫持）。

**证据**
- 线上 manifest shortcuts=['/shelf','/new','/random']；app.js 含快捷键处理；部署 7e65f71c。

## Round 89 — 2026-08-06

**发现（五驱动·竞品/UX）**
- P1：追踪器只有「已读」，无 TBR/「想读」能力——Goodreads/StoryGraph 的核心用法之一，Shelfmark 完全缺失。

**修复**
- 系列页新增「☆ Save for later」切换按钮（aria-pressed，localStorage shelfmark_saved_v1，纯浏览器本地）；/shelf 新增「Saved for later」区（按保存时间排序、可 Remove、空则不渲染）。

**证据**
- 线上系列页含 data-save-series 按钮、/shelf 含 saved-root、app.js 含 shelfmark_saved_v1；部署 4b729b6c。

## Round 90 — 2026-08-06

**发现（五驱动·测试/数据）**
- 批尾例行：R86–89 上线后核心路由健康检查 + IndexNow 全量重提交。

**修复/动作**
- 14 个核心端点全通过（/random 正确 302，其余 200）；IndexNow 全量重提交 25,637 URL（4×200：8000/8000/8000/1637）。

**证据**
- 响应码清单见会话记录；scripts/indexnow.sh 输出 4×200。

### R86 补充 — QA 修复
- QA 深色模式 axe 抓到 1 个 serious 对比度违规：反色区 My Shelf 链接 #9a6414 on #f2efe6 = 4.34:1 < AA。已改 #8f5d12（4.88:1），部署 99ce72c3，复检 axe 深色模式 0 违规。

## Round 91 — 2026-08-06

**发现（五驱动·UX/测试）**
- P2：R89 的 Save for later 清单不随 JSON 备份走，换设备会丢想读清单。

**修复**
- 导出 JSON 增加保留键 _saved（slug→{name,t}，仅非空时写入）；导入合并 _saved 且书目循环跳过该键。旧版导入器读新文件时 _saved 因无 title 被自然跳过，格式向后兼容。

**证据**
- 线上 app.js 含 _saved 逻辑；部署 55613339。

## Round 92 — 2026-08-06

**发现（五驱动·竞品/视觉）**
- P2：/shelf 统计只有 4 个数字卡，无阅读节奏可视化（StoryGraph 核心卖点之一）。

**修复**
- /shelf 新增「Reading pace — last 12 months」12 根月度条形图（纯 DOM/Tailwind div，无库，仅统计有日期的条目，无日期数据不渲染；role=img+aria-label）。

**证据**
- 线上 app.js 含 Reading pace 渲染；部署 15e151cc。

## Round 93 — 2026-08-06

**发现（五驱动·pSEO/竞品）**
- P1：站点缺跨流派的「最热系列」落地页；BSIO 类站点该类页承接大量导航型搜索。

**修复**
- 新增 /popular：目录中 100 个规模最大、文档最全的系列（同质量过滤），面包屑+ItemList JSON-LD；首页「Top 100 →」入口、页脚 Explore 链接、sitemap 收录。

**证据**
- 线上 /popular 200、含 100 张系列卡；sitemaps/1.xml 含 /popular；部署 7ca82432。

## Round 94 — 2026-08-06

**发现（五驱动·数据）**
- P1：第一方统计只有 day/path 计数，无法区分自然流量与自测——「站点是否有真实访客」始终无法回答。

**修复**
- 无 Cookie 引荐来源统计：前端 beacon 追加外部 referrer 主机名（仅 hostname，不含路径/查询，站内跳转不计）；新增 referrers(day,host,count) 表（生产 D1 已建），/api/hit 校验主机名格式后聚合。隐私模型不变：无 Cookie、无 UA、无 IP 存储。

**证据**
- 线上实测 POST /api/hit 带 google.com referrer → referrers 表 +1；schema.sql 已更新；部署 187823eb。

## Round 95 — 2026-08-06

**发现（五驱动·测试/数据）**
- 批尾例行：R91–94 上线后核心路由健康检查 + IndexNow 全量重提交。

**修复/动作**
- 13 个核心端点全通过（含新 /popular，/random 正确 302）；IndexNow 全量重提交 25,638 URL（4×200：8000/8000/8000/1638）。

**证据**
- 响应码清单见会话记录；scripts/indexnow.sh 输出 4×200。

## Round 96 — 2026-08-06

**发现（五驱动·pSEO/视觉）**
- P2：/popular 分享预览仍是通用品牌卡（流派页 R83 起已用封面大图）；/llms.txt 关键页清单缺 /popular。

**修复**
- /popular og:image 改用列表中首个有封面系列的 -L 大图；/llms.txt Key pages 增补 /popular。

**证据**
- 线上 /popular og:image 为 covers.openlibrary.org/...-L.jpg；/llms.txt 含 /popular；部署 ce428952。

## Round 97 — 2026-08-06

**发现（五驱动·UX/数据）**
- P2：只保存了想读清单（未勾选任何书）的访客回访首页时无个性化入口，Continue reading 条不渲染。

**修复**
- 首页 Continue reading 无阅读进度时回退渲染「From your saved list」（最多 4 个最近保存的系列，仍纯 localStorage 客户端渲染，数据不出浏览器）。

**证据**
- app.js 含 saved 回退分支；部署 ce428952。

## Round 98 — 2026-08-06

**发现（五驱动·合规/UX）**
- P1：隐私优先产品缺「一键清除本地数据」控制（用户在共享设备上无法方便地抹除进度/清单/目标）。

**修复**
- /shelf 新增「Clear all data」按钮：confirm 确认后删除全部 shelfmark* localStorage 键并刷新；说明文案提示先导出备份。

**证据**
- 线上 /shelf 含 clear-data-btn；部署 ce428952。

## Round 99 — 2026-08-06

**发现（五驱动·合规）**
- P1：R94 引荐来源统计上线后 /privacy 的 Analytics 条目未同步披露（透明度缺口）。

**修复**
- /privacy Analytics 条目明确披露：仅记录来源站 hostname（如 google.com），绝不含完整 URL/页面/搜索词；无 IP/UA/指纹存储。

**证据**
- 线上 /privacy 已含新披露文案；部署 ce428952。

## Round 100 — 2026-08-06

**发现（五驱动·测试/数据）**
- 批尾例行 + 100 轮收官：R96–99 上线后核心路由健康检查 + IndexNow 全量重提交。QA 在 R97 抓到 P1（var 提升导致 loadSaved 早于 SAVED_KEY 初始化，saved 回退区不渲染），已修复（eb03008）并复检通过。

**修复/动作**
- 14 个核心端点全通过（/random 正确 302，其余 13 个 200）；IndexNow 全量重提交 25,638 URL（4×200：8000/8000/8000/1638）；部署 ca9e334c。

**证据**
- 响应码清单见会话记录；scripts/indexnow.sh 输出 4×200；QA 报告 test-report-iter99.md。

---

## Round 101 — 2026-08-05

**发现（五驱动·竞品调研专项）**
- 老板专项指令：扩大竞品面深度调研 + 优点整合复刻。实测抓取 10+ 竞品源码与截图（research/comp/），产出 docs/competitor-teardown.md：访问矩阵、逐家功能/交互/技术反推（BSIO=WordPress、booksinorder.io=Next.js+完整 JSON-LD 三件套+每书 Book 节点、Goodreads 系列页 shelving 交互等）、P0/P1/P2 整合清单。StoryGraph/Hardcover/FictionDB/LibraryThing/FantasticFiction 均被 Turnstile/人机验证拦截，按红线不绕过，标注为受限来源。
- 技术栈评估（专项任务 3）：对比竞品（WordPress vs Next.js 预渲染），当前 Workers+Hono+D1/KV+Tailwind v4 边缘 SSR 在 TTFB 与 JS 体积上均占优；Next/Astro 迁移无用户可见收益。结论：保持现栈，依赖保持更新。详见 teardown 文档"Tech-stack assessment"。

**修复/动作**
- docs/competitor-teardown.md 落库；原始证据 research/comp/*.html+png（不入库仓库，仅本地留存）。

## Round 102 — 2026-08-05

**发现（老板 P0 指令·定价改造）**
- 产品不再定位为"免费"，改「Beta 免费试用」口径并展示正式付费方案。

**修复**
- 新增 /pricing：Reader（$0）与 Shelfmark Plus（$2.99/mo 或 $24/yr，planned）双档卡片、"Free during beta" 徽章、Pricing FAQ（beta 期间全功能开放、不收款、数据永可导出）；BreadcrumbList JSON-LD；入 sitemap。
- 头部 Beta 徽章（链接 /pricing）+ 导航/页脚 Pricing 链接；全站 "free tracker" 文案改为 "no-signup tracker / free while in beta"（首页 title、series/authors/genres/popular 描述、OpenSearch、llms.txt）。CTA "Start free beta trial"。不接入任何收款。

**证据**：https://shelfmark.zalize.com/pricing 200；部署 5bd481b2。

## Round 103 — 2026-08-05

**发现（竞品复刻·booksinorder.io）**
- 其系列页首屏 "Quick Order Summary / Start with X" 盒子直接回答核心查询，利于 featured snippet；其面包屑为 4 级（含作者层）。

**修复**
- 系列页新增 "Where to start" 引导卡（首本书名+年份+封面缩略图+出版顺序说明，纯目录数据推导，无捏造）。
- 系列页面包屑升级为 Home/Series/作者/系列 4 级（可见导航 + BreadcrumbList JSON-LD 同步）。

**证据**：https://shelfmark.zalize.com/series/mistborn 实测含 Where to start 卡与 4 级面包屑 LD。

## Round 104 — 2026-08-05

**发现（竞品复刻·BSIO/booksinorder.io）**
- 竞品每本书均有购买出口（BSIO 一页 149 个 Amazon 链接）；我们完全没有获取图书的出口。

**修复**
- 每本书行新增 "Find a copy" 外链 → Bookshop.org 搜索（书名+作者，rel="nofollow noopener"，无联盟代码、诚实搜索链接，打印时隐藏）。作者页 standalone 区同样生效。

**证据**：/series/mistborn 实测 8 处 bookshop.org/search 链接。

## Round 105 — 2026-08-05

**发现（五驱动·测试/数据）**
- 批尾例行：R101–104 上线后核心路由健康检查 + 新页面 IndexNow 提交。

**修复/动作**
- 14 个核心端点全 200；IndexNow 提交 /pricing 等 5 个关键 URL（HTTP 200）；部署 5bd481b2。
- QA 抓到 P1：移动端 375px 头部导航溢出（`.beta-badge` 自定义 CSS 的 display 覆盖了 `hidden` 工具类导致 Beta 徽章在小屏可见 + 首页 New&upcoming 卡 grid 项缺 min-w-0 撑宽页面 + 导航本身预存溢出）。修复：Beta 徽章 `hidden sm:inline-block`、Genres/New 分别 ≥360/380px 才显示、导航间距与 logo 尺寸移动端收紧、卡片加 min-w-0。Playwright 实测 360–768px 全部无横向溢出（320px 罕见宽度仍略溢出，遗留 P3）。部署 736b827e。

## Round 106 — 2026-08-05

**发现（竞品复刻·booksinorder.io/Goodreads/BSIO P2 项）**
- 竞品均有 book 详情层承接书名长尾搜索（Goodreads book 页、booksinorder.io 每书 Book JSON-LD）；我们的书只存在于系列列表行内。

**修复**
- 新增 `/book/{id}-{slug}` 详情页（质量门槛：有简介的 in-series 书才入 sitemap/index，无简介 noindex,follow）：大封面、作者/年份、"Book N of M in {series}"、简介、Full reading order + Find a copy CTA、上一本/下一本导航、Book JSON-LD（isPartOf BookSeries + position）+ BreadcrumbList；slug 不匹配 301 到规范 URL。系列/作者页书名变为详情页链接（勾选区不受影响）。sitemap 新增 book 分片（~21K 有简介书目，索引 6→11 个分片）。

**证据**：/book/134080-mistborn-the-final-empire 200（Book LD、prev/next、301 规范化实测）；sitemaps/11.xml 输出 book URL；移动端 360/375px 无横向溢出。部署 79221be4。

**QA 回归（三项发现均已修复，部署 404b05c1）**
- 360px 仍溢出 3px + 380px 处 New 出现即溢出 → Genres/New 断点改 ≥400/460px；首页 hero 搜索输入加 min-w-0。溢出扫描 320–640px（含断点边缘）除 320px 首页已知 P3 外全清。
- book 页正文内联链接（作者/系列）axe link-in-text-block serious → 改常显 underline，light/dark 均 0 违规。
- 年份重排系列（如 Discworld 重复 position）book 页 "Book N of M" 序号与可见列表不一致 → book 路由复用 bookList 同款重排逻辑，Mort 实测 Book 2 of 55 与列表一致。

## Round 107 — 2026-08-05

**发现（五驱动·测试/数据）**
- 批尾例行：R106 book 详情层上线后全站健康检查 + 全量 IndexNow（含新 book 分片）。

**修复/动作**
- 16 个核心端点全 200（含 /book/ 与 sitemaps/11.xml）；IndexNow 全量重提交 46,267 URL（sitemap 1–11 分片，6×HTTP 200，其中新增 ~21K book URL）；scripts/indexnow.sh 分片数 6→11。

---

**100 轮迭代收官（R1–R100）**：五驱动流程共修复/新增 100+ 项，覆盖安全（CSP/HSTS/限流）、无障碍（axe 205→0 违规并保持）、pSEO（25,638 URL、FAQ/ItemList/BookSeries/Person JSON-LD、/popular、llms.txt）、分发（RSS/OpenSearch/PWA/IndexNow/开放 API）、追踪器（up-next、批量操作、目标、节奏图、想读清单、备份导入导出、清除数据）、深色模式与第一方无 Cookie 统计（day/path + referrer hostname）。遗留：自然流量待观察（referrers 表已就位）、Resend key 缺失致邮件提醒停用、约 1,145 系列无可靠流派证据、核心封面覆盖 ~41%。

## Round 108 — 2026-08-05（视觉/品牌专项·调研）

**发现（视觉专项·竞品调研）**
- Playwright 抓取 10 家阅读类标杆站（literal.club、oku.club、standardebooks.org、italictype.com、press.stripe.com、readwise、bookshop、NYT Books、basmo、beanstalk）完整 HTML+截图+computed 排版参数，落库 docs/visual-teardown.md 与 research/visual/。
- 共性优点：serif 标题+温暖纸感底色、倾斜真实书封拼贴 hero（Literal）、手绘线稿插画（Oku）、纸张 grain 质感（SE/Stripe Press）、克制微动效。
- 技术栈评估：shadcn/ui 需 React（引入为负收益，采纳其令牌纪律不迁栈）；Motion/GSAP 对本站动效量级过重（CSS+30 行 IO 即覆盖）；Tailwind 已 v4 保持。

## Round 109 — 2026-08-05（全局质感+动效）

**修复/动作**
- 纸张 grain 纹理：内联 feTurbulence SVG data-URI 平铺于 body（4.5% 不透明度，light/dark 通用），零请求成本。
- 交互令牌：卡片 hover 抬升+封面微倾（.card-lift）、勾选 check-pop 反馈、滚动淡入（data-reveal + IntersectionObserver）；全部动效包在 prefers-reduced-motion: no-preference 内，降级为静态。
- 构建瘦身：Tailwind v4 此前自动扫描 research/*.html 竞品捕获文件导致产物污染（含竞品类名）；改 source(none)+显式 @source，styles.css 75.6KB→27.9KB（-63%）。

## Round 110 — 2026-08-05（hero 复刻升级）

**修复/动作**
- 首页 hero：标题升 text-6xl，强调词改 Fraunces italic（字体加载 ital 轴）；新增倾斜真实书封拼贴条（Literal 式自研实现：popular 系列封面、交替 ±3–6° 旋转、hover/focus 直立微升、可点击直达系列页；375px 显示 4 张、桌面 7 张）。

## Round 111 — 2026-08-05（品牌素材）

**修复/动作**
- favicon 重绘：摊开书页+琥珀书签绸带（延续 ink/amber 品牌色，manifest 同源引用）。
- OG 分享图重制（public/og.png，1200×630）：纸感底+Fraunces 标题+italic 强调+品牌 mark+四本倾斜书脊插画，模板存 research/visual/og/。
- /shelf 空状态新增自研 SVG 线稿插画（书架+斜书+琥珀书签，Oku 式人文温度）。

**回归（线上，部署 0c3ded07）**
- axe 4.10.2 light/dark × 首页//series/discworld//shelf 全部 0 违规。
- 溢出扫描 360–640px × 首页/系列/pricing 全清；375px 首页实测无横向溢出。
- 暗色模式像素级验证（body 计算色 rgb(22,20,15)，实测像素 (26,23,19)）。
- 素材许可：全部自研 SVG + Google Fonts（OFL），无受版权第三方素材。

## Round 112 — 2026-08-07（Resend 发信链路接入）

**背景**：老板提供 Resend API key（org secret RESEND_API_KEY，send-only 权限）。此前 emails 表只收集意向（double opt-in 未闭环，发信停用）。

**修复/动作**
- DNS/域名验证：zalize.com 在 Resend 已验证（resend._domainkey DKIM、send.zalize.com SPF/MX、_dmarc 均在）；发件地址 no-reply@zalize.com（send.zalize.com 与 leads.zalize.com 子域未在 Resend 单独验证，403）。
- 双确认闭环：/api/subscribe 现发送确认邮件（含 /confirm?t= 链接）；已确认者不重复发送；退订后重新订阅会重置 token 并重新走确认。
- 退订：新增 /unsubscribe（GET 页面 + POST one-click）；所有邮件带 List-Unsubscribe + List-Unsubscribe-Post: One-Click 头与正文退订链接。
- 产品邮件：每周一 09:00 UTC cron（wrangler triggers）跑新书 digest——与 /new 同口径查询，KV(digest:sent) 做增量 diff，只发新增条目（≤20 条），首跑只记基线不发送、无订阅者只更新基线；发送对象仅 confirmed=1 且 unsubscribed=0。
- DB 迁移：emails 表加 unsubscribed 列（wrangler d1 execute 报 7403，改用 Cloudflare 原生 D1 query API 执行成功）。
- 文案：footer 订阅提示改「check your inbox to confirm」；/privacy 补 double opt-in + one-click 退订披露。

**回归（线上，部署 e2347551）**
- 真实 E2E（mail.tm 临时邮箱）：订阅→确认邮件送达（Resend 接受+实收）→点击确认 confirmed=1→one-click POST 退订 unsubscribed=1→GET 退订页 200；原始信头实测含折行 List-Unsubscribe URL + One-Click 头。测试记录已从 emails 表清理。
- 直发测试信 contact@zalize.com 已发出（id 返回成功）供老板核收。
- 注意：确认邮件在部署后首个请求未送达（疑似边缘版本传播窗口），重试后正常；已复验。

## Round 113 — 2026-08-08（性能：HTML 缓存头 + 数据信号）

**修复/动作**
- 全站 HTML GET 200 响应补 `Cache-Control: public, max-age=300, stale-while-revalidate=3600`（此前 HTML 无任何缓存头）；排除 /confirm、/unsubscribe（GET 有状态变更）与 /shelf，已有显式缓存头的路由（search no-store、sitemap 等）不覆盖。
- 数据分析：referrers 表出现首个自然流量信号——google.com 引荐 ×3（站上线以来首次非自测来源）。hits 仍以自测为主。

**回归（线上，部署 811eb934）**
- 实测 GET：/ 与 /series/discworld 返回新缓存头；/shelf、/confirm、/unsubscribe、/search 无公共缓存头（符合预期）。

## Round 114 — 2026-08-08（错误处理：全站 500 页）

**修复/动作**
- 新增 app.onError：未捕获异常返回站点风格 500 页（noindex，Back to home），并 console.error 记录方法/路径/堆栈（wrangler tail 可观测）；此前为 Hono 默认纯文本 "Internal Server Error"。

**回归**
- 本地 wrangler dev（本地 D1 无表触发真实异常）：/series/discworld 返回 500 + 品牌化页面，验证通过；线上部署 fb53d6e3。

## Round 115 — 2026-08-08（场景化邮件订阅入口）

**修复/动作**
- /new 页底部新增「Get new releases by email」订阅卡（高意图场景；复用 data-subscribe 处理器与 double opt-in 链路；print 隐藏、data-reveal 动效、reduced-motion 降级随全局）。

**回归（线上，部署 e1fa7308）**
- /new（自定义域 + workers.dev）实测订阅卡渲染；表单走既有确认邮件流程（R112 已 E2E 验证，不重复发信）。

## Round 116 — 2026-08-08（QA 修复 + 新面回归）

**修复/动作**
- QA 抓到 R113 排除缺口：/search 无自有缓存头导致误得 5 分钟公共缓存；route 内显式 no-store（每查询 HTML 不缓存）。
- 测试 skill 补充：缓存头须用 GET（curl -D -）检查，HEAD 不触发中间件会误报。

**回归（线上，部署 16899a50）**
- /search?q= 实测 no-store（自定义域+workers.dev）。
- 测试代理独立回归：axe light/dark × /new + /unsubscribe(400) 4 轮 0 违规；/new 320/375px 无溢出、订阅卡完整；卡片无效输入被原生校验拦截（0 网络请求）；/ 缓存头正确、/shelf 无公共缓存头。

## Round 117 — 2026-08-08（搜索词统计回归数据驱动）

**修复/动作**
- 新增 searches 表（day+term 聚合：结果数+次数，无任何用户标识），/search 有词查询即记录；为后续零结果缺口分析与目录补齐提供数据。
- /privacy 同步披露站内搜索聚合统计。

**回归（线上，部署 96b77b06）**
- 实测查询后 searches 表正确落一行（term 小写化、results/count 正确），探针记录已清理。

## Round 118 — 2026-08-08（数据/性能复测：全绿，无需修复）

**五驱动扫描**
- 数据：hits 近 3 日 ~680 次（仍以自测为主）；referrers 仅 google.com ×3；searches 表管道用一次性探针实测正常（记录后已清理）；emails 3 待确认 0 已确认。
- 性能：7 个代表路由 TTFB 100–270ms，styles.css 28KB / app.js 34KB，预算内无回归。

## Round 119 — 2026-08-08（竞品复访 → /lists 精选书单层）

**修复/动作**
- 竞品复访发现 booksinorder.io 新增 /lists、/methodology、/release-calendar 面（methodology 我方 /about 已覆盖；release-calendar 因只有年份粒度数据暂不做）。
- 采纳 /lists：新增精选书单层（全部纯目录数据推导，不伪造）——trilogies / long-running-epics / new-series-of-the-2020s / classic-series 四单，每单 ≤60 系列 + ItemList JSON-LD + 面包屑；/lists 索引页；footer、首页 Popular 区、sitemap（索引+4 单）、llms.txt 全部接入。

**回归（线上，部署 2685984c）**
- 双域名 5 个新 URL 全 200；trilogies 单实测 60 张系列卡；未知 slug 404。

## Round 120 — 2026-08-08（backlog P1#5 收尾：系列页年份跨度 chip）

**修复/动作**
- 系列页 at-a-glance chips 补最后缺项：年份跨度 chip（如 2006–2022），与书数/流派/作者 chips 并列；无年份数据不渲染。

**回归（线上）**
- /series/mistborn 实测 2006–2022 chip 渲染。

## Round 121 — 2026-08-08（QA 数据修正：classic-series 年份下限）

**修复/动作**
- QA 发现 classic-series 首条为 Plato「Platonic dialogue · -40–1963」（负年份渲染怪异且非本意的"经典系列"）；下限改为 first_year BETWEEN 1850 AND 1980，文案同步。

**回归（线上）**
- /lists/classic-series 首条不再是 Plato，无负年份条目。

## Round 122 — 2026-08-08（批尾维护）

**动作**
- 17 端点健康检查全 200（含新 /lists 面）。
- IndexNow 全量重提交 46,272 URL（6 批 ×HTTP 200，含 /lists 索引与 4 单）。

## Round 123 — 2026-08-08（BCE 年份格式化）

**修复/动作**
- yearsSpan 对 ≤0 年份输出「N BCE」（proleptic 天文纪年换算），修复 platonic-dialogue / twenty-four-histories 两个系列页 chip 显示「-40–1963」的怪异渲染（仅格式化，不改数据）。

**回归（线上，部署 5f363561）**
- /series/platonic-dialogue 实测渲染「41 BCE–1963」。

## Round 124–125 — 2026-08-08（全面扫描：无 ≥P2 项，转低强度）

**扫描结论**
- 安全头（HSTS/CSP/Permissions-Policy/nosniff）与缓存头在新 /lists 面全部正确；axe 基线保持 0 违规；性能预算内。
- 剩余 backlog 均为边际项或数据受限项（release-calendar 需月份粒度数据、chronological order 无可靠来源）；连续两轮未发现 ≥P2 的有价值改进项，按指令转低强度运营。
- 待观察：周一 09:00 UTC digest cron 首跑基线；searches/referrers 数据继续积累。

## Round 126–127 — 2026-08-08（大功能：Year in Books 年报 + 书单分享链接）

**立项（SOP-01，全面进化指令）**
- R126 Year in Books：新 /year-in-books 页，全部在浏览器端由 localStorage 生成（隐私模型不变）——年度已读数/系列数/最忙月份/目标完成率四统计卡、月度条形图、Top 5 系列、首尾完成书目、跨年份切换、1080×1350 分享 PNG 年报卡。入口：/shelf 主按钮 + footer + sitemap + llms.txt。对标 Spotify Wrapped / Goodreads Year in Books，竞品 SEO 站均无。
- R127 书单分享链接：My Shelf 的 Saved for later 区新增「Share this list」——清单（slug+名称，≤100 条）base64url 编码进 URL fragment（# 后内容不发往服务器），新 /saved 查看页（noindex）解析渲染 + 「Add all to my saved list」一键导入；无效/空链接有引导性空状态。

**回归（线上，部署 377c3fb0）**
- /year-in-books、/saved 双双 200；/saved noindex 确认。测试代理全量回归见 PR 评论。

## Round 128–130 — 2026-08-09（用户引导/Onboarding 专项）

**修复/动作**
- R128 首访引导：首页 hero 下新增「How Shelfmark works」三步叙事卡（1 找系列 → 2 勾选已读 → 3 My Shelf/Year in Books），服务端渲染、静态克制、data-reveal 动效随 reduced-motion 降级。
- R129 系列页首次 coach mark：无任何追踪数据且未关闭过时，书单上方显示一次性提示「New here? Tick the books…」，Got it 关闭（localStorage shelfmark_tip_track_v1），打印隐藏。
- R130 新功能发现：首次勾选任意书后显示一次性「First book tracked ✓ See all your progress on My Shelf」提示（12s 自动消失，localStorage shelfmark_hint_shelf_v1，并同时视为 coach mark 已读）；首页深色板块文案补 Year in Books/书单分享入口；空状态审计（/shelf、/year-in-books、/saved、搜索零结果均已有 CTA，无缺口）。

**回归（线上，部署 c565b465）**
- 首页三步卡上线；app.js coach-tip 逻辑上线。测试代理新用户视角走查见 PR 评论。

## Round 131 — 2026-08-09（品牌化 + 全活动运营专项）

**A. 品牌体系（docs/brand/）**
- brand-guide.md v1：品牌故事与一句话定位、命名/口径规范（含禁用词：free forever、sign up、we track 等）、tone of voice、视觉规范（logo 用法/色板/字体/纹理动效/图像原则）、canonical boilerplate、品牌触点清单。
- 站内一致性巡检：全站 title/meta/OG/邮件署名/口径已一致；修复 footer「My shelf」→「My Shelf」大小写。

**B. 产品外活动（docs/marketing/ + 站内）**
- 新 /press 页：品牌介绍 + boilerplate + fast facts + 品牌素材下载（logo SVG/OG PNG）+ 媒体联系方式；footer/sitemap/llms.txt 接入。
- R131 欢迎信上线：首次确认订阅后自动发送一封欢迎邮件（仅 double opt-in 确认后、带 unsubscribe，重复确认不重发）。
- 素材包落库：directory-submissions.md（目录站清单+粘贴文案，全部需真人账号，未自动注册）、producthunt-launch-kit.md（tagline/gallery/maker comment/FAQ/当日清单）、social-calendar-14d.md（14 天 Reddit/X/HN 逐日文案）、content-plan.md（5 篇 guide 选题+内链规则）、email-lifecycle.md（生命周期现状+win-back 模板待触发条件）。

**回归（线上）**
- /press 200 + footer 链接；欢迎信链路待测试代理 E2E。

## Round 132–136 — 2026-08-10（设计系统深度升级专项）

**修复/动作**
- R132 字体排版：h1-h3 text-wrap:balance、display 字体 -0.01em 字距、进度标签/progressbar 统一 tabular-nums（Google Fonts 已有 display=swap，无新增请求）。
- R133 组件精修：白卡统一 1px 微阴影层级、搜索/邮件输入 hover 边框态、按钮/胶囊 :active 按压反馈（motion-gated）、进度条宽度过渡动效。
- R134 全设备：主容器/头尾 xl 档拓宽 max-w-5xl→6xl（桌面宽屏利用）；头部导航 tap 区 padding+负 margin 扩至 44px（不动布局）；footer 链接首版 padding 方案在纵向列表中相互重叠（QA 实测独占点击区仅 24px），改为 min-height:44px inline-flex 非重叠方案后实测 17 条链接全部 44px 独占；系列复选框整行 label 本已 ≥44px。
- R135 特效：进度条 0.4s 填充过渡、explainer 展开箭头旋转，全部 prefers-reduced-motion 降级，零 JS 零新请求（CWV 不受影响）。
- R136 用户心智：系列页新增「What's "publication order"?」人话 explainer（details/summary，克制、打印隐藏）；/shelf 阅读节奏图补一句话说明（「每根柱 = 当月读完本数」）。

**回归（线上，最终部署 4d51349c）**
- 首轮回归（ed8c9006）：explainer/typography/布局/axe 8 轮 0 违规/CWV/print/reduced-motion 全绿，但抓到两项：① header/footer tap 区实测 38px/34.6px 未达 44px；② 进度条既有 Tailwind transition-all 0.15s 在 reduced-motion 下残留。
- 修复轮（c82d9ab4→4d51349c）：header 44px、reduced-motion transition:none、footer 改非重叠方案后 17 链接全部 44px 独占，375/1440 无溢出。全部关闭，见 PR #21 评论。

## Round 137 — 一比一复刻基准打磨专项

**调研**
- 标杆真实走查：BSIO 7 页 + Goodreads 5 页（Playwright 抓取 HTML+全页截图，落库 research/comp/rep/），逐页逐流程建还原度对照表 docs/replication-benchmark.md（0-100% 评分 + 差距 + 数据边界备注）。
- 结论：作者页/系列页/新书页/订阅已达标或超越；最大差距 = 图书详情页（vs Goodreads book page）与搜索书目行。评分/评论、编辑长简介、时间线顺序、角色索引无合规数据源，明确不做（不伪造红线）。

**修复/动作（全部 P0/P1 缺口关闭）**
- /book 页：流派 chip、「I've read this」勾选（单书 ol[data-series] 复用追踪器，与系列页/My Shelf 双向同步）、「All N books in {series}」横向封面条（当前书高亮）、About the author 卡（bio+头像）、Readers also enjoyed 同流派 3 卡。
- /search 书目行：封面缩略图/首字母占位 + 书名直达 /book。
- app.js coach mark 限 >1 勾选框列表（书页不再触发）。

**回归（线上，部署 be22d3fe）**
- 测试代理全绿：书页五区渲染、勾选跨页同步闭环（书页→系列页 1 of 8 read→/shelf→reload 持久→untick 回同步）、coach mark 书页无/系列页有、搜索封面+直达、55 书条横向滚动无页面溢出、375px 双页无溢出、axe 明暗 0 违规、print 正常、追踪器回归。见 PR #22 评论。

## Round 138 — 复刻升级：页面覆盖率盘点 + 技术标准审计

- **A 覆盖率**：BSIO sitemap_index+robots+导航爬查（14 类）+ Goodreads 公开页面枚举（10 类）→ 对照表新增 E 节。24 类中 19 类已对照/对位；5 类为 deliberate-n/a 或数据边界（角色索引、名人书友会、编辑博客、月日级日历、UGC 社区），逐条注明理由。定位内覆盖率 19/19 = 100%。
- **B 技术审计**：对照表新增 F 节（12 项：渲染/TTFB/体积/字体/图片/缓存/结构化数据/安全头/无障碍/协议/压缩）。TTFB 实测我们 0.24s vs BSIO 1.0s vs GR 2.4s。唯一未达标项 = 字体管线（第三方 Google Fonts CSS）。
- **修复**：自托管 latin 子集变量字体（Fraunces roman/italic + Inter，OFL 许可，woff2 共 197KB）+ head preload，CSP 移除 Google 域（style-src/font-src 收紧至 'self'），/fonts/* 1 年 immutable 缓存。修复后 12/12 达标、8 项反超。
- **回归（生产 9691d0c3）**：测试代理全绿——document.fonts + 宽度对抗测试证实真实 webfont 渲染、全网络捕获零第三方字体请求、console 无 CSP violation、woff2 immutable 头、375px 无溢出、axe 明暗 4 轮 0 违规、LCP 305ms/CLS 0.0013 无回退。

## Round 139 — 大厂验收官整改（Shelfmark 83 分·通过，清 P1/P2）

- **P1 本地数据告知**：/shelf 顶部新增 amber callout「Your shelf lives on this device」明确无账号、清缓存/换设备会丢失，anchor 直达 #backup 导出区（导出/导入/清除本已具备）。邮箱同步列中期项。
- **P2-1 系列锚点索引**：作者页 ≥4 区时渲染「Jump to」锚点导航（44px 目标，print 隐藏）；<4 区不渲染。
- **P2-2 勾选 aha**：勾选后下一本未读行内出现「Up next」amber 徽章 + 1.2s 背景 pulse（reduced-motion 降级为纯徽章）；untick/bulk/加载态均正确；单 checkbox 书页不显示。
- **共性自查**：搜索空态/邮件用途文案/数据来源解释层（about/API/press 已披露 Wikidata+OL）/移动端导航收敛（分级显隐+底部搜索）均已具备，无缺口；AI 任务等待 n/a。
- **QA 两 nit 同轮修复**：`[id]{scroll-margin-top:72px}` 清除 sticky header 锚点遮挡；pulse 起始色 18%→10% 消除暗色 mid-pulse 4.47:1 transient。
- **回归（生产 9d213355）**：测试代理两轮全绿——callout/锚点/jump nav/负控/44px/Up next 全行为/reduced-motion/书页守卫/axe 明暗 0 违规（含 mid-pulse 300/600ms）/375px 无溢出/tracker+coach mark 回归。

## Round 140–144 — 验收官质量线·五驱动发现扫描 + P1/P2 全清

- **发现扫描（五驱动）**：新用户全路径走查 + 1440/375 明暗视觉 + 无 JS/键盘/慢网/CLS + 长文本/55 本 Discworld/320px 边界 + 真实生产环境。数据分析：hits 近 5 日 48–414 views/日；搜索词 discworld(6)/mistborn(4)；referrer 仍仅 google.com×3（QA 流量不计入）。P0 无，P1×4、P2×4。
- **P1-1 首勾布局跳动**：coach mark 原先在首次勾选时移除并在列表下方插入 hint，列表上移 46px 造成误击。改为就地替换 tip 内容（role=status），探针 book2_y 605.5→605.5（0px 位移）；无 tip 页面（书页/回访）保留原插入路径。
- **P1-2/3 无 JS**：系列/作者页列表上方新增 noscript 说明「Ticking books … needs JavaScript — the reading order below works fine without it」；/shelf #shelf-root 内新增 noscript 本地数据解释 + /series 链接（Loading 行仍显示，观感可接受，遗留 cosmetic）。
- **P1-4 header 640px 空胶囊**：行内搜索 hidden sm:block→hidden md:block，下方全宽搜索条 sm:hidden→md:hidden；640/700px 无空胶囊、<768px 全宽搜索可键盘到达（focus 可见）、768/1440 正常、全宽零溢出。
- **P2-1 Star Trek 消歧**：同名系列链接追加区分信息（有作者用 by X，否则年份跨度/册数）：「Star Trek (57 books) · (18 books) · (48 books)」。
- **P2-2 日期**：/shelf 与 Year in Books 数字日期改 fmtDate →「Aug 9, 2026」。
- **P2-3 shelf 系列内排序**：li 加 data-bid，复用 /api/series-books 拉取后按系列阅读顺序重排（兜底按勾选时间升序）；逆序勾选 2→1 实测显示 1→2。
- **P2-4 搜索建议**：/api/suggest 书目项由 /series/{slug} 改为 /book/{id}-{bslug}，点击直达书页且勾选同步。
- **回归（生产 1952dc78）**：测试代理全绿——0px 位移+原坐标二次点击命中、shelf 重排、日期、建议直达、消歧、无 JS 三页、header 五档宽度、键盘、coach mark/Got it 持久化、书页单 checkbox 守卫、Up next、tracker 三端同步、axe 明暗 6 轮 0 违规、375/320 无溢出。
- **遗留**：无 JS /shelf Loading 行与 noscript 说明并存（cosmetic）；每 10 轮竞品深访排在 ~R150。

## Round 145 — 五驱动扫描（feeds/API/边界/暗色/打印/导入导出）+ 搜索 500 修复

- **发现扫描**：/lists 全四单、/genres 分页与负参、/new、/popular、/random、/press、/unsubscribe、RSS/opensearch/sitemap、API 错误形状、打印样式、暗色四页、375px 11 页、axe 8 轮 0 违规、shelf 导出/导入/清除/reading card 回环——均通过。发现 P1×1、P2×2。
- **P1 搜索 ≥49 字符 500**：根因 = SQLite LIKE pattern 上限 50 字符（`%q%` 在 q≥49 时超限抛错）。/search、/api/suggest、/api/opensearch-suggest 的 pattern 内容统一 slice(0,48)；67 字符全书名实测 200 有结果。
- **P2 /api/suggest HTML 500**：同根因，随上修复，超长查询降级返回 `{"results":[]}`。
- **P2 Escape 清空输入**：typeahead Escape 分支补 preventDefault，只关闭建议不清空已输入文字（Chrome 原生 type=search 行为抑制）。
- **附带**：无 JS /shelf「Loading」行经 noscript style 隐藏（R144 遗留 cosmetic）；周维护 IndexNow 全量重提交 46,274 URL（6×200）。
- **回归（生产 1496e332）**：见 PR QA 评论。

## Round 147 — 竞品深访（10 轮节奏）+ 「Series like X」pSEO 层

- **竞品复访**：booksinorder.io 自 R119 后新增 /books-like、/box-sets、/compare、/gift-guides、/methodology、/studies、/videos；BSIO 无结构变化。采纳 readalikes 模式（详见 competitor-teardown R147 节）。
- **新功能 /similar/{slug}**：「Series like X」页——同流派（排除同作者）最多 18 个系列卡，ItemList + Breadcrumb JSON-LD，<6 结果 X-Robots noindex，无 genre 302 回系列页；系列页「If you like…」区加「See all series like X →」入口；llms.txt 披露。
- **pSEO**：834 个合格 similar 页（genre 非空 + 同流派可推荐 ≥6）入 sitemap part 1（上限 2000），IndexNow 提交 834 URL（200）。
- **回归（生产 83f35ded）**：见 PR QA 评论。

## R148 (plural polish + discovery sweep)
- Drivers: UX copy audit + data check (hits mostly QA traffic; top organic paths unchanged).
- Fixed singular/plural copy: /shelf stat card ("1 book read"), reading-card PNG subline, /year-in-books ("1 book read in YYYY", busiest month "(1 book)"), /book sibling heading (defensive — section guarded by sibs.length>1 so singular is unreachable; kept as guard-rail).
- QA (worker 34107574): 1-book and 2-book states verified end-to-end incl. downloaded PNG sublines; goal set/edit/remove flow all green (invalid input ignored, 0 removes, goal in PNG card); 1/2-book series book pages degrade cleanly; /pricing sane; /year-in-books dark+375 clean, axe 0 both themes. No P0/P1; only note is the unreachable-singular guard above.
- Weekly IndexNow: full 46,274-URL resubmission done in R147 batch.

## R149 (search quote normalization)
- Driver: first-party search analytics — zero-result term `"mistborn"` (quoted) spotted in the searches table.
- Fix: /search, /api/suggest, /api/opensearch-suggest now normalize curly apostrophes ‘’→' and strip double quotes "“”«» before LIKE matching; results heading shows the normalized query (avoids “"mistborn"” doubled quotes).
- QA (workers d36376b1 → 0dcef11e): quoted/curly variants all return expected results, straight vs curly apostrophe identical sets, %/_ and 49–100-char regressions intact, 375px curly-apostrophe typeahead clean. No P0/P1/P2.

## R150 (competitor deep revisit + "Start here" chip)
- Driver: 10-round competitor cadence — new scan (rightreadingorder.com, bookseriesorder.com, orderedbooks.com, bookbinge.app, storyjog.com, boundapp.co.uk) + benchmark revisit (booksinorder.io/BSIO unchanged). Notes in docs/competitor-teardown.md.
- Adopted: "Start here" chip on the first book of every multi-book series list (series + author pages) — data-derived entry-point guidance matching rightreadingorder.com's "best starting point" pattern without fabricated editorial. Declined: browse-by-character (no compliant dataset), streaks/AI recaps (out of scope).
- QA (worker b93b5427): chip on book 1 only across series/author pages, absent on 1-book series, light/dark contrast verified, axe 0 both themes, print hidden, tick/untick + Up-next regression clean. 375px: chip wraps below title (no overflow — accepted, same behavior as year-chip). Untested: first-book-upcoming + year-chip combo (no catalog fixture exists).

## R151–152 (discovery sweep + fixes)
- Five-driver discovery (production funnel walkthrough, 768/1024 visual, keyboard pass, error surfaces): P0 none, P1×1, P2×6.
- Fixed P1: series pages whose displayed years are non-monotonic no longer claim "publication order" — conditional wording switches to "series order" in intro/aside/FAQ/meta (isPubOrder check). Fixtures: wallander-novels, mistborn.
- Fixed P2: "See all series like X" link suppressed when /similar adds nothing beyond the inline 6 (LIMIT 7 probe); curated-list LIST_BASE excludes nonfiction genres (compendium/essay/biography/handbook/monograph/textbook/catalog/yearbook) — Dehio/Künstler/Principia removed from classic-series; "Canon of Sherlock Holmes" name capitalized in D1; /popular ends with 4-pill cross-link row; pagination shows "Page X of Y" (both helpers).
- Declined/deferred: home-page third-party-cookie console warnings (external cover CDN, harmless); book-year data audit (data-source work, backlog).
- QA (worker 67dd3913): all 5 fixes verified incl. monotonic control keeping "publication order"; axe 0 light+dark on series + classic list; 375px pagination clean; tick/untick regression green.

## R153 (book-year data audit)
- Driver: R151 P2-4 backlog — year chips vs order/description mismatches.
- Audited all 264 series (4,793 books) whose displayed years are non-monotonic: fetched Wikidata P577 (publication date) for every book QID (all had QIDs; 637 items have no P577 on Wikidata).
- Result: 0 discrepancies — every stored year matches the earliest Wikidata P577. The visible "out-of-order" years reflect the source itself (e.g. Faceless Killers Q1958087 carries only the 1997 English-translation date, not the 1991 Swedish original) plus reading-order ordinals. No compliant fix available without a second date source; the R151 conditional "series order" wording already covers the trust gap. No code change this round.

## R154 (curated-list expansion)
- pSEO/content driver: 3 new data-derived curated lists — /lists/duologies (book_count=2), /lists/big-fantasy-series (fantasy, >=5 books), /lists/long-running-mystery-series (mystery/crime/detective, >=10 books). /lists index now 7 cards; meta description + llms.txt updated; sitemap picks them up automatically via CURATED_LISTS.
- Data fix: "canon of Hercule Poirot" → "Canon of Hercule Poirot" in D1 (QA catch, same class as R151 Sherlock).
- QA (worker 7ef8e2f0): criteria hold at runtime (60/60 duology cards say "2 books"; fantasy counts 8–55; mystery 29 cards 10–72); ItemList JSON-LD valid on all 3; cross-links exclude self; axe 0 light+dark; 375px clean; duology spot-check found a live "Start here"+"New" chip coexistence fixture. Deploy note: brief version-propagation flapping (~1 min of mixed old/new isolates) — retry with fresh cache-busters before judging.

## R155–156 (discovery sweep on less-covered surfaces + fixes)
- R155 discovery (testing agent, acceptance-officer eye): /similar visual passes, /press//popular//pricing dark+768, /saved full share loop, /new genre filters + RSS, 404//random quality. P0/P1 none; P2×4.
- R156 fixes (all four P2s): generic 404 gains a centered 4-pill onward row (popular/lists/A–Z/genres); /new with unknown ?genre= shows "No new releases under that genre — showing all." + noindex; /similar pages with <6 cards get the same onward pill row after the grid (>=6-card pages unchanged); genreLabel map cleans raw chip labels (spokon→sports (spokon), comedy anime and manga→comedy (anime & manga), business literature→business, lgbt literature→LGBT literature).
- QA (worker de2b520d): all four verified light+dark, pills navigate, 375px clean, axe 0 (isolated theme runs), mistborn control has no pill row. Untested: LGBT-literature label (no fixture in current /new window).

## R157–159 (maintenance + a11y semantics)
- R157 maintenance: IndexNow submission of changed URLs (/lists + 3 new lists + /new + /popular, 200); TTFB spot-check healthy (0.1–0.7s incl. cold).
- R158 discovery (keyboard-only + assistive-semantics pass): P0/P1 none — full keyboard operability, complete typeahead ARIA, landmarks/headings clean. P2×3: clipboard confirmations not announced, search inputs labeled only by placeholder, up-next moves unannounced after first tick.
- R159 fixes: aria-live="polite" on [data-share]/[data-copylist]/shelf share buttons; aria-label="Search series, authors, and books" on all search inputs (header ×2 + hero); persistent #sr-live (sr-only, role=status) announces "Up next: {title}" on every tick.
- QA (worker 1a4d63e7): all three verified (announcement text lands in live region, combobox name = aria-label, sr-live updates on successive ticks); typeahead/coach-mark/tracker regression green; axe 0 light+dark home+series.

## R160 (competitor deep revisit + data-studies layer)
- Ten-round deep revisit (see competitor-teardown.md): booksinorder.io grew /compare, /box-sets, /gift-guides, /methodology, /studies, /videos since R150; BSIO/BSO unchanged.
- Adopted the /studies pattern: new data-studies layer built purely from our D1 catalog — /studies index, /studies/longest-series (top 50 by book_count, ItemList JSON-LD), /studies/series-length-by-genre (avg/max per genre, n>=10). Footer/sitemap/llms.txt wired. Declined compare/box-sets/gift-guides/videos/methodology with reasons (methodology already on /about).
- QA (worker 27f1018e) all green: data sanity 50 rows, links resolve, 375px no page scroll (tables scroll in wrapper), axe 0 light+dark, sitemap/llms verified. Three polish notes fixed same round (worker 9ebc9c07): year-span fallback to MIN/MAX(books.year), 8 more genre-label mappings, avg formatted toFixed(1). Kuroko's Basketball keeps "—" — its 275 volumes genuinely carry no year data at source.

## R161 (data-driven search hardening)
- Driver: first-party search-term table showed wildcard probes — "%" returned 80 results (LIKE-wildcard scrub left "% %", matching every multi-word name) and "_" matched single-char rows.
- Fix: wildcard-only queries (empty after %/_ scrub) now render the empty-search prompt instead of querying; /api/suggest and /api/opensearch-suggest return empty results for the same case. Token scrub reused via `core`.
- Verified on worker 2552e13b via curl: %, _, %%% → "Type a series or author name above"; mistborn/mist%born unchanged; /api/suggest?q=%% → {"results":[]}, normal suggest unaffected.

## R162–163 (discovery + studies/book-page polish)
- R162 discovery (fresh-eyes UX on /studies, /book, seeded /shelf + /year-in-books, full new-user journey): P0/P1 none, P2×5.
- R163 fixes (worker ad033fc3):
  - Null series-year backfill: 222 series had no first/last year and no book years; fetched their Wikidata series entities (P577 volume dates, else P580/P571/P582) → 33 backfilled in D1 (incl. Kuroko's Basketball 2009–2014, the rank-1 studies row).
  - Stub-description suppression on /book: short Wikidata stubs ("2007 novel by Brandon Sanderson", "detective novel by John Rhode") duplicated or — with pen names — contradicted the byline; isStubDescription() hides <90-char "…by X" type stubs.
  - /studies index enriched: data-provenance blurb linking /about + standard 4-pill onward row.
- Declined: "Frieren: Beyond Journey's End -Prelude-" trailing hyphen is the genuine Wikidata label styling for the spin-off, not dirty data; placeholder cover strip on cover-less series kept (honest, and covers backfill over time).
- Verified via curl: rank-1 years 2009–2014 render; both stub fixtures hide descriptions; studies blurb live.

## R164 (studies expansion: most prolific authors)
- Perf spot-check first: TTFB 0.10–0.63s across 7 key pages, all healthy.
- New third study /studies/most-prolific-authors (top 50 authors by catalogued series books, ItemList JSON-LD), wired into /studies index, sitemap part 1, llms.txt. QA caught placeholder entity "various authors" at rank 1 → excluded aggregate names (various/anonymous/unknown) from the query; verified rank 1 now R. L. Stine (worker 8c4b64f8).
- R164 QA (worker 8c4b64f8): 50 rows rank-1 R. L. Stine, no aggregate authors, axe 0 light+dark, 375px fits fully, links resolve, longest-series rank-1 years 2009–2014 confirmed. IndexNow submitted for new URLs (200).

## R165–166 (cold-surface discovery + PWA installability)
- R165 discovery (cold surfaces: /pricing /privacy /press /unsubscribe /random /new.rss /opensearch.xml manifest, subscribe-form UX, 320px sweep, 404 hygiene): P0/P1 none. P2×1 — manifest shipped only an SVG icon, so Chrome's install prompt never fired (needs ≥192px PNG). P3 noted: opensearch-suggest thinner than in-app typeahead (possibly intentional dedup).
- R166 fix: /icon-192.png + /icon-512.png (purpose any) + /icon-maskable-512.png (purpose maskable, glyph in 80% safe zone on full-bleed #1a1916) added to manifest; shortcuts carry the 192 icon; 86400 cache headers.
- QA (worker 2a7ce1bd): CDP Page.getInstallabilityErrors → empty (was failing "no acceptable icon"); manifest parse 0 errors; PNGs 200/right dims/cache; maskable safe-zone pixel-verified; zero console errors on home.

## R167 (data-driven search: hyphen-insensitive matching)
- Search analytics: real query "三体"/"three body problem" returned 0 results even though "The Three-Body Problem" exists — hyphenated titles didn't match space-separated queries.
- Fix: primary series/author/book LIKE queries also compare against REPLACE(name,'-',' ') with a hyphen-normalized pattern; token fallback extended to book titles; close-match notice covers book-only fallback hits.
- CJK titles (三体) remain unmatched — catalog stores English titles only; noted as a known limitation, not fixable without an alias dataset.
- Follow-up (same round): the two suggest endpoints got the same hyphen normalization (prefix semantics kept) — "uncanny x men"/"kaguya sama" now suggest Uncanny X-Men / Kaguya-sama. Verified on worker 42383164.

## R168–169 (mobile dark journey + print/touch fixes)
- R168 discovery (recorded 375px dark-mode new-user journey, print emulation, keyboard pass): journey + keyboard clean (skip link, amber focus ring, sr-live announcements). P2×3: /shelf print showed all JS-rendered buttons; dark-theme printing kept dark cards + pale amber headings and printed the recommendation grids; series action pills 34px / breadcrumbs 17px tap height on mobile.
- R169 fixes: print hide-list extended to button/input/select/textarea (covers JS-rendered shelf controls); @media print resets palette vars to light (ink-on-white even for dark users, print amber #a05f10, img filter off); "More series by X" + "If you like X" sections print:hidden; @media (pointer:coarse) grows main rounded-full pills and breadcrumb links to ≥44px hit areas.
- QA (worker 3abe57ec): all three verified — dark print now white bg + full dark ink, shelf print zero interactive controls, coarse-pointer pills exactly 44px (desktop unchanged), axe 0 light+dark. Residual P3 (Year in Books CTA + orphaned export help text printing) fixed same round with print:hidden (worker 53b2c3ad).

## R170 (ten-round competitor deep revisit + fourth study)
- Deep revisit: booksinorder.io nav unchanged since R160; its /studies grew to 4 (added authors-with-most-books ≈ our R164, series-completion-times, series-on-hiatus); BSIO/BSO unchanged; rightreadingorder timeout, orderedbooks 403 (not bypassed).
- Adopted: /studies/longest-gaps — 50 biggest publication gaps between consecutive series books (SQLite LAG window over book years, gap ≥10, LIST_BASE, book_count ≥3), honest framing that gaps may be revivals/posthumous/continuations. Declined "series-on-hiatus" as-is: asserting a series is "on hiatus" is an editorial claim we can't verify; the gaps study covers the same curiosity with verifiable numbers only.
- Wired: studies index card (4 cards), sitemap part 1, llms.txt.
- QA (worker b95f8e54): 50 rows, ranks sequential, gaps non-increasing 83→18 all ≥10, gap == to−from for all 50, ItemList JSON-LD n=50, ranks 1/25/50 cross-checked on their series pages (framing years present, none between), 375px contained, axe 0 light+dark, zero console errors.
- Data fix surfaced by QA: rank 1 (Dream Cycle 83 yrs) ended at a 2026-dated book — "Through the Gates of the Silver Key" carried Wikidata's future-dated P577 (2026-07-30, an anthology/edition date); actual first publication is Weird Tales, July 1934. Corrected year to 1934 in D1. New rank 1: Arsène Lupin literary series, 71 yrs (1941–2012).

## R171 (data-driven suggest: article-insensitive prefix matching)
- Search analytics: "three body" / "three-body" now find results in full search (R167) but typeahead still suggested nothing — suggest is prefix-match and the title starts with "The". Same for any "The/A/An"-prefixed series ("hitchhiker", "song of ice", …).
- Fix: shared artMatch() SQL fragment — prefix match also runs against the name with a leading "The "/"An "/"A " stripped (CASE + SUBSTR, hyphen-normalized). Applied to series in both suggest endpoints and book titles in /api/suggest; /search untouched (substring match already handles articles).
- Verified live: "three body"→The Three-Body Problem, "hitchhiker"→The Hitchhiker's Guide, "song of ice"→A Song of Ice and Fire; "mistborn" unchanged.
- QA (worker f49c1e0e): both suggest endpoints article-stripped correctly; regressions green (series-first cap-8 ordering, author suggestions, quoted queries, <2-char and wildcard-only empty, keyboard typeahead ArrowDown+Enter, zero console errors).

## R172 (data fix: Douglas Adams attribution + authorless-series audit)
- QA flagged (R171 walkthrough): Hitchhiker's Guide series page credited Eoin Colfer (author of book 6 only) for the whole series and all six books; Douglas Adams was missing from the catalog entirely.
- Fix (D1): inserted Douglas Adams (Q42, Wikidata bio + Commons portrait); series + books 1–5 (1979–1992) reattributed to Adams, "And Another Thing..." stays Colfer; also claimed the author-less Dirk Gently series (3 books); counts recomputed (Adams 2 series/8 books, Colfer −1/−5). Wikidata Q25169 P50 confirms Adams as series author.
- Audit: 973 of 2,590 live series have no author. New scripts/backfill_series_authors.py queried Wikidata P50 for all 973 — 929 have no P50 claim at all, 42 have unlabeled (QID-only) author entities, 2 multi-author → zero safe backfills. The gap is upstream in Wikidata, not our import; script kept for future re-runs as Wikidata improves.
- QA (data-only, worker f49c1e0e): series/author/book pages + JSON APIs all show correct attribution, Colfer page clean of Hitchhiker, axe 0 light+dark. Two residual P3s fixed same round: series description rewritten to "1979–2009 series of six books — five by Douglas Adams, with a sixth by Eoin Colfer"; book-6 stub "2009 novel Eoin Colfer" → "2009 novel by Eoin Colfer".

## R173 (catalog curation: academic proceedings removed)
- Data analysis: hits log showed a visitor landing on /book/157385 "Similarity Search and Applications: 10th International Conference … Proceedings" — Lecture Notes in Computer Science (442 "books") and 11 sibling academic publication series (Springer Proceedings, Lecture Notes in X, CBMS-NSF conference series) were in the catalog. They are institutional paper series, not readable book series — off-scope for a reading-order product, they polluted search results and shipped 12 thin/off-brand pSEO pages (studies/lists were already shielded by LIST_BASE).
- Fix (D1): deleted the 12 proceedings/lecture-notes/conference series and their 485 books (none had author attribution; conservative name-pattern match verified row-by-row). Sitemap is DB-driven so the URLs drop automatically; pages now return styled 404s.
- Deliberately kept: nonfiction but genuinely book-shaped series (Massey Lectures, The Buildings of England, Fortress) — curation limited to unambiguous conference/working-paper material.
- Follow-up pass (QA-surfaced tail): deleted 57 more academic/institutional series (685 books) — working papers, research reports, university monograph series, "Studies in …" imprints, annual reports (author NULL + genre NULL + name-pattern match, reviewed row-by-row). Kept deliberately: Massey Lectures (published book lectures), Ipurbeltz (comics). 5 authored academic monographs removed with author book_counts recomputed. Catalog now free of unambiguous conference/working-paper material.
