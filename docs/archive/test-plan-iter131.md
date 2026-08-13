# Shelfmark R131 — press kit + welcome email (worker 6707ebe9, PR #20, commit 35c6697)

Code evidence: src/index.ts ~L1186 `/press` route (crumbs, h1 "Press kit", Boilerplate box, Fast facts ul, Brand assets with `download="shelfmark-logo.svg"` → /favicon.svg and shelfmark-og.png → /og.png, Contact mailto); /confirm ~L1453: welcome email "Welcome to Shelfmark new-release alerts" sent ONLY when `!row.confirmed` (re-visit → no resend); sendEmail L1341–46 sets List-Unsubscribe + List-Unsubscribe-Post one-click when token passed; src/html.ts footer: "My Shelf" capitalization + "Press kit" link between About & Privacy.

## A. /press page (browser + Playwright)
1. Browser: footer of / → click "Press kit" (must sit between "About & methodology" and "Privacy", and footer shows "My Shelf" not "My shelf") → /press renders breadcrumb Home / Press kit, h1 "Press kit", boilerplate box, Fast facts (6 items), Brand assets (logo SVG + OG PNG links), Contact contact@zalize.com. Screenshot light; Playwright dark screenshot.
2. curl (workers.dev+cb): /favicon.svg 200 image/svg+xml, /og.png 200 image/png. /press served HTML contains `download="shelfmark-logo.svg"`.
3. Axe light+dark on /press: 0 violations. Overflow 375+320px: scrollWidth == innerWidth.
4. sitemaps/1.xml contains /press; llms.txt lists Press kit. (Pre-verified in setup; re-log in results.)

## B. Welcome email E2E (mail.tm disposable inbox; shell + browser)
5. Create mail.tm account; in browser footer form on /, submit the disposable address → note "Almost done — check your inbox…".
6. Poll mail.tm: confirmation email arrives; extract /confirm?t= link.
7. Open confirm link in browser → confirmed page. Poll inbox: welcome email arrives with subject exactly "Welcome to Shelfmark new-release alerts"; body has /popular, /new (+RSS), /shelf links + unsubscribe link; source headers include List-Unsubscribe:<.../unsubscribe?t=...> and List-Unsubscribe-Post: List-Unsubscribe=One-Click.
8. Re-open the SAME confirm link (already-confirmed) → wait ≥2 min → inbox message count unchanged (no duplicate welcome). Fail: second welcome arrives.
9. Click unsubscribe link from the welcome email → unsubscribe page → confirm one-click POST works (page says removed/unsubscribed).

## C. Regression (quick)
10. / and /series/mistborn load fine in browser (hard reload); main profile untouched.

Constraints: single disposable subscriber only; unsubscribe at end (row remains with unsubscribed=1 — note for lead); no real emails.
