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
