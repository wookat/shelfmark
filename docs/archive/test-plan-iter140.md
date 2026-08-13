# R138 self-hosted fonts + CSP tighten (worker 9691d0c3, commit 0c866e8)

Deployed already verified in setup (cache-busted workers.dev): HTML head has the two `/fonts/*.woff2` preloads and ZERO fonts.googleapis/gstatic references; CSP is `style-src 'self' 'unsafe-inline'; font-src 'self'`; all 3 woff2 return 200 `font/woff2` `cache-control: public, max-age=31536000, immutable` with byte sizes exactly matching commit blobs (67304/81520/48256). Code refs: src/html.ts preloads, src/index.ts CSP, public/_headers /fonts/*, src/styles.css three @font-face (weight 100 900, display swap, latin unicode-range).

## A. Recorded walkthrough (fresh incognito, cache-busted)
1. Homepage: hero heading (Fraunces incl. italic span) and body text render in webfonts — visually correct serif display + Inter body. PASS: headings clearly serif (Fraunces), no FOUT-stuck fallback.
2. /series/mistborn: h1 "Mistborn Books in Order" Fraunces; body Inter.
3. /book/134080-mistborn-the-final-empire: h1 Fraunces; body Inter.
(Objective font proof is in B — the recording demonstrates visual normality.)

## B. Playwright/shell probes (unrecorded)
4. Font actually loaded, not fallback, on all 3 pages: 
   - `document.fonts.check('700 32px Fraunces')`, `check('italic 600 32px Fraunces')`, `check('400 16px Inter')` all true;
   - `[...document.fonts].map(f=>[f.family,f.style,f.status])` → 3 faces status "loaded";
   - computed font-family of h1 starts "Fraunces", body starts Inter;
   - adversarial width check: measure a span "Shelfmark Quixotic 123" in `Fraunces` vs `Georgia` (fallback) → widths differ (proves non-fallback rendering).
5. Network audit on homepage + series page: collect all request URLs → PASS: zero requests to fonts.googleapis.com/fonts.gstatic.com (or any host outside self/covers/archive/wikimedia/cloudflareinsights); the woff2 requests are same-origin 200.
6. Console clean: capture console messages + pageerror during loads → PASS: no CSP violation ("Refused to load") or font errors.
7. 375px overflow: / and /series/mistborn → scrollWidth == 375.
8. Axe 4.10.2 light+dark on / and /series/mistborn → 0 violations (4 runs).
9. CWV sampling: curl TTFB on / and series (< ~1.5s); Playwright LCP + CLS via PerformanceObserver on / (LCP < ~2.5s lab, CLS < 0.1); note font swap shouldn't inflate CLS.
