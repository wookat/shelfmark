---
name: testing-shelfmark
description: How to test the Shelfmark live site (shelfmark.zalize.com) — key routes, tracker/localStorage behavior, exports, and SEO endpoints.
---

# Testing Shelfmark

- Production: https://shelfmark.zalize.com (Cloudflare Worker + D1, SSR via Hono; code in `src/index.ts`, ~440 lines). No login or local setup needed to test the live site.
- Key routes: `/` (home), `/search?q=`, `/authors/<slug>` (e.g. brandon-sanderson), `/series/<slug>` (e.g. mistborn, jack-reacher, discworld), `/shelf`, `/genres`, `/genres/<slug>` (e.g. fantasy), `/confirm?t=<token>` (invalid token → HTTP 400 page), `/about`, `/privacy`, `/robots.txt`, `/sitemap.xml`, `/sitemaps/N.xml`. Unknown slugs return HTTP 404 with a styled page.
- Reading tracker: on series/author pages, checkboxes per book update a "N of M read (X%)" label + progress bar instantly; state is stored in localStorage key `shelfmark_read_v1` keyed by numeric book ID; after any data re-import check for ID drift by comparing stored keys vs page `data-book` attrs (a one-time client migration via `/api/migrate-ids` + `shelfmark_mig_v2` flag remaps old ids); state is stored in localStorage only (never sent to the server), so it persists across reloads but not across browsers/profiles. Author pages also have a "Standalone books" tracked section (shelf slug `standalone-<author-slug>`; its /shelf heading links to the author page).
- `/shelf` renders from localStorage: books grouped by series. "Export JSON" downloads `shelfmark-export.json` (map of bookId → {t, title, series, slug}); "Download my reading card" generates a 1080×1350 PNG (`shelfmark-reading-card.png`) via canvas. Check `~/Downloads/` for both.
- Shelf import (since iteration 9): "Import JSON" merges a backup file into localStorage. The success status ("Imported N new books ✓ Reloading…") auto-reloads after ~1.6s — to screenshot it, suppress the timer via a one-off console `setTimeout` patch; drive the GTK file dialog with Ctrl+L + typed path.
- Email capture: footer form POSTs to `/api/subscribe`; on success the button text changes to "Subscribed ✓" (no toast). Use a test@example.com-style address.
- Sub-series: Erin Hunter's Warriors parent is at `/series/warriors-2` (`/series/warriors` is an unrelated Roland J. Green series); Discworld is a good single page to check covers + blurbs + numbering at once.
- Covers: sparse (~5.6K books). Densest test pages: `/series/lecture-notes-in-computer-science` (343 covers), `/series/d-couvertes-gallimard` (127); find more by grepping `data/seed.sql` for `covers.openlibrary.org`.
- SEO: series pages include title, meta description, canonical, OG tags, and JSON-LD (BookSeries + BreadcrumbList) — verify via `view-source:` or curl.
- Mobile: test at ~375px width (resize with `wmctrl -r :ACTIVE: -e 0,100,0,375,740` after removing maximized state).
- Security headers (since iteration 1): all responses carry X-Content-Type-Options/Referrer-Policy/X-Frame-Options; HTML responses also get a CSP (`script-src 'self'`, `img-src 'self' https://covers.openlibrary.org data:`). Gotchas: CSP blocks inline event handlers (e.g. `onerror="this.remove()"` on cover imgs) and any redirect target not in img-src — covers.openlibrary.org often 302-redirects to `ia*.us.archive.org`, so many covers can appear as broken-image icons; check `[...document.images].filter(i=>i.complete&&!i.naturalWidth)` in console. Note: OL redirect targets vary between apex `https://archive.org/download/...` and `ia*.us.archive.org` — CSP `*.archive.org` does NOT match the apex, so img-src needs BOTH `https://archive.org` and `https://*.archive.org`. A document-level 'error' listener in app.js removes failed cover IMGs, so missing covers can hide silently — diagnose with a `securitypolicyviolation` event listener rather than by eye. Cloudflare's auto-injected `static.cloudflareinsights.com/beacon.min.js` is also CSP-blocked (one console error per page — expected unless allowlisted).
- Analytics: every page load POSTs its pathname to `/api/hit` via sendBeacon (on `/search` pages the `?q=` query is appended, capped at 120 chars). To verify the payload at runtime, open DevTools → Network, reload, click the `hit` request → Payload tab (initiator app.js; 204 response). Best-effort KV rate limits: /api/subscribe 5/min/IP, /api/migrate-ids 10/min, /api/hit 60/min.
- Accessibility audits (axe-core): the site's CSP (`script-src 'self'`) blocks injecting axe from a CDN in the live browser console (script onerror fires). Instead run headless Playwright (Python, installed) with `bypass_csp=True`: download `axe.min.js` via curl, `page.add_script_tag(content=...)`, then `axe.run(document)` per page. The box's `google-chrome` is a CDP wrapper, not a real binary — run `python3 -m playwright install chromium` first (≈2 min). Seed `/shelf` state with `localStorage.setItem('shelfmark_read_v1', ...)` + reload before auditing it. The audit script prints results JSON to stdout (it does not write a file) — redirect stdout to a per-run file, e.g. `python3 axe_audit.py > /tmp/axe_results_rN.json`.
- Clipboard features (e.g. the series-page "Copy list" button, `[data-copylist]` in app.js): click the button via normal UI interaction (writeText works fine), but do NOT try to verify with `navigator.clipboard.readText()` from the devtools console — it throws "Document is not focused" and pops a permission prompt into the recording. The system clipboard is shared with the box, so read it from the shell instead: `xclip -selection clipboard -o`.
- RSS: `/new.rss` (RSS 2.0, `application/rss+xml`, max-age=3600, items link to `/series/<slug>`); `/new` has a visible "RSS feed" intro link + `<link rel="alternate" type="application/rss+xml">` autodiscovery in head. Validate XML with `python3 -c "import xml.dom.minidom;xml.dom.minidom.parse('/tmp/new.rss')"`.
- Clean-localStorage states (e.g. the /shelf empty state): use an incognito window (Ctrl+Shift+N) so the main profile's seeded tracker progress survives; close it when done.
- `/opensearch.xml` downloads in Chrome instead of rendering (correct `application/opensearchdescription+xml` type) — verify via the completed download or a shell curl + XML parse.
- Local dev if needed: `npx wrangler dev` in the repo (wrangler.toml binds D1 `shelfmark-db`); requires a Cloudflare token.

## Devin Secrets Needed
- None for live-site testing. `CLOUDFLARE_WORKERS_API_TOKEN` / `CLOUDFLARE_ADMIN_API_TOKEN` only if deploying or querying D1 directly.

## Edge cache gotcha
When verifying response headers or newly deployed routes, the zalize.com edge may serve stale cached headers/HTML. Verify against the direct origin `https://shelfmark.wookat520.workers.dev` with a cache-bust query param (e.g. `?cb=$RANDOM`).

## Post-deploy CSS caching
styles.css is cached max-age=3600, so right after a deploy the browser may render new markup with the previous stylesheet and produce false layout failures. Hard-reload (Ctrl+Shift+R) before judging CSS-dependent UI.

## Shelf goal card in headless contexts
To render the /shelf goal card headlessly (e.g. for axe), seed BOTH `shelfmark_read_v1` (`{"<bookId>":{"t":<ms>,"title":...,"series":...,"slug":...}}`) and `shelfmark:goal:<year>` in localStorage before navigating — the goal card only renders when tracked books exist. Reading-card PNG content must be verified from the downloaded file, not the DOM.

## Card progress bars on listing pages
Series-card `data-progress-bar` fills ONLY when the same page contains that series' `ol[data-series]` checkbox list. 0% bars on homepage//genres//series card grids are by design, not failures.

## Static asset caching applies to app.js too
css/js are cached 1h at the Cloudflare **edge** (not just the browser) — even a fresh incognito profile can get a stale app.js. After a deploy, hard reload (Ctrl+Shift+R) or verify the served md5 against workers.dev before judging client-rendered features.

## External retailer links & mobile-overflow probes
bookshop.org (per-book "Find a copy" links) Cloudflare-blocks this box's datacenter IP, and the instrumented browser strips `target="_blank"` from the live DOM — verify external-link attributes via curl of the served HTML, not by clicking. For mobile layout, a Playwright `document.documentElement.scrollWidth > innerWidth` probe is the fastest overflow check — sweep widths **including exact breakpoint edges** (e.g. 400/460 where nav items appear); overflow can appear only at the width where an element becomes visible. Site is expected clean ≥320px (the old 320px home overflow was fixed by the R109 CSS rebuild). Books lacking descriptions are excluded from sitemaps — to find a `noindex,follow` book page, probe low raw ids via `/book/{id}-x` (301s to canonical) rather than sampling sitemap URLs. Note: custom component classes in src/styles.css must not set `display` or they override Tailwind's `hidden` utility (caused the Beta-badge mobile bug). Dark-mode/reduced-motion/no-JS behavior is best verified with Playwright contexts (`color_scheme`, `reduced_motion`, `java_script_enabled=False`); in the recorded UI browser, DevTools "Emulate CSS prefers-color-scheme: dark" reverts when DevTools is closed, so keep the panel open while capturing dark screenshots.

## localStorage-section render failures: check var hoisting
If a localStorage-driven section silently fails to render, check helper-definition order in app.js — helpers like `loadSaved` defined below their first call see `SAVED_KEY` as `undefined`. Also `shelfmark_mig_v2` is re-created on every page load, so "all shelfmark keys removed" checks should exempt it.

## Dark mode & /random testing
No OS dark toggle on this box — use DevTools "Emulate CSS prefers-color-scheme: dark" for the visible browser, and a Playwright context with `color_scheme="dark"` for headless axe. `/random` responses are `no-store` 302s; curl the workers.dev origin for header proof.

## Goal-met card variant (non-destructive)
Test the reading-card "✓ goal met" branch in incognito: seed `shelfmark_read_v1` with current-year timestamps and set a goal ≤ that count via the UI prompt.
