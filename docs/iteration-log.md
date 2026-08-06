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

**Carry-over → Round 2**
- Verify covers render clean under final CSP (live regression).
- Styled title-initial placeholder for books without covers.
- Skip link; blurb/footer text AA contrast check.
- OL cover backfill continues in background (4 shards running).
