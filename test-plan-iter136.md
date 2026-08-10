# Shelfmark R132–136 design-system upgrade (worker ed8c9006, PR #21, commit 124b3c6)

Code evidence: src/styles.css +91 lines (h1–h3 text-wrap:balance; .font-display -0.01em; [data-progress-label]/[role=progressbar] tabular-nums; input search/email hover amber border; .rounded-2xl.bg-white.border 1px shadow; motion-gated button:active scale(0.97) + progress width .4s + summary caret .2s; details.explainer styles with ?-badge ::before and ▸ ::after rotating 90deg on [open]; header nav a:not(.rounded-full)/footer ul a padding-block .55rem margin-block -.55rem). src/html.ts: 4 containers max-w-5xl→xl:max-w-6xl (header, main, footer grid, footer bottom). src/index.ts: `<details class="explainer mt-3 print:hidden"><summary>What’s “publication order”?</summary>` above the ☑️ note on series pages. public/app.js: pace chart caption "Each bar is how many books you finished that month — taller bar, busier reading month." Deployed CSS verified live (30,274 B, all rules present; cache 1h → always cache-bust).

## A. Recorded walkthrough (browser)
1. Homepage (cache-busted hard reload): renders normally; white cards visibly carry subtle shadow (zoom screenshot).
2. Navigate to /series/mistborn — INCOGNITO (fresh): explainer row "? What's "publication order"? ▸" visible above the ☑️ note; click → panel opens with plain-words body + caret rotated; click again → closes. Fail: absent/panel doesn't toggle.
3. Tick book 1 in incognito: progress label "1 of 8 read (13%)" and bar animates width (0.4s); untick → back to 0. (Animation itself hard to capture in still; assert label+fill change on screen, transition verified in B5.)
4. MAIN profile /shelf (read-only): pace chart card shows new caption under "Reading pace — last 12 months". Fail: caption missing (main profile has dated reads so chart renders).

## B. Playwright/shell (unrecorded)
5. Width sweep on /, /series/mistborn, /shelf(seeded disposable ctx for chart? use main HTML? — use fresh ctx; /shelf renders regardless): widths 320/375/768/1024/1280/1440 → scrollWidth == innerWidth (18 probes). At 1440: main boundingBox width ≈1152px (xl:max-w-6xl); at 1024: ≈1024px minus padding (max-w-5xl regime, i.e. <=1024). Fail: overflow or width unchanged (~1024) at 1440.
6. Tap targets at 1440: every header nav non-pill link + footer ul link effective hit area height ≥44px — measure via elementFromPoint/padding: computed padding-block 8.8px each side + line height, and header h-14 row visually unshifted (screenshot compare not required; assert header container height still 56px). My Shelf pill (a.rounded-full) unchanged padding.
7. Computed styles: h1 text-wrap balance; progress label font-variant-numeric tabular-nums; card box-shadow "0 1px 2px rgba(26,25,22,.05)"; email input hover border-color amber (mouse hover + getComputedStyle).
8. Reduced-motion context: button:active transform none; [data-progress-bar] transition-property not width; explainer still opens/closes.
9. Axe light+dark on /, /series/mistborn (explainer closed AND open), /shelf: 0 violations (8 runs).
10. Print emulation on /series/mistborn: details.explainer computed display none.
11. CWV sanity: curl TTFB (time_starttransfer) on / and /series/mistborn < ~1.5s; styles.css 30,274 B (prev ~28–29 KB → delta ≈1–2 KB); series page HTML makes no new third-party/network request types vs before (check Playwright request list: only same-origin + covers/commons as previously).

Constraints: ticks only in incognito; main profile strictly read-only (/shelf view only). Cache-bust all URLs (?cb=) due to 1h CSS/5min HTML cache.
