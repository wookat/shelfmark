# Shelfmark Continuous-Iteration Round 1 — Live security-headers/CSP + beacon + regression (light)

Code refs: src/index.ts:18-38 (header middleware — CSP only on text/html; rateLimited via KV), src/index.ts:469 (subscribe rate limit 5/min), public/app.js:11-16 (beacon: on /search appends location.search, sent as POST BODY to /api/hit).
Pre-verified in setup (curl): CSP/Referrer-Policy/X-Content-Type-Options/X-Frame-Options present on `/`; non-HTML (robots.txt) gets the 3 non-CSP headers; POST /api/hit → 204.

## T1 CSP does not break the page (browser)
- Load / and /series/discworld with console open state cleared. Pass: display-font headings render in the serif display face (Fraunces-style, visually distinct from system sans), Open Library cover thumbnails visible on Discworld, and `browser_console` shows NO "Refused to load/execute…Content Security Policy" violations.
- Tracker under CSP: tick one unchecked Discworld book → label updates ("N of 60 read"); reload → persists (proves app.js executed under script-src 'self').
- JSON-LD: page source of /series/discworld contains `application/ld+json` with BookSeries (shell grep of curl output).

## T2 Search beacon includes query (new)
- Search "discworld" from the header search box → lands on /search?q=discworld; results include a link to /series/discworld (regression).
- Runtime payload proof: open DevTools Network panel (justified — payload is not visible any other way), reload /search?q=discworld, click the `hit` request. Pass: request payload/body is exactly `/search?q=discworld` and status 204. A broken change would show body `/search` (no query).
- Cross-check: `performance.getEntriesByType('resource')` includes an /api/hit entry on the search page.

## T3 Subscribe from footer still works under rate limiting
- On /, scroll to footer, enter `iter1-test@example.com`, click "Notify me". Pass: button text changes to "Subscribed ✓" (no CSP block of the fetch; single request well under 5/min).

## T4 Regression: /shelf and /genres (light)
- /shelf: previously ticked books render grouped (localStorage intact). /genres: genre cards render; click Fantasy → series list renders.

## T5 Mobile 375px
- Resize to 375px: home + /series/discworld render with no horizontal overflow; header nav (incl. Genres) usable. Restore maximized after.

## T6 UX/a11y improvement candidates (observation only)
- Note candidates: focus states, checkbox touch targets, contrast of gray blurb text, skip-to-content link, form labels/aria on search + subscribe, heading hierarchy.
