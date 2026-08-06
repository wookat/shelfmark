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
