# Shelfmark Round 35 — New/Upcoming chips on book lists (deploy 52bdbe2c, PR #9)

Code/served refs: /series/the-murderbot-diaries HTML — row for Platform Decay (2026) contains `<span class="ml-2 rounded-full bg-amber-accent/10 text-amber-accent text-xs font-semibold px-2 py-0.5 align-middle print:hidden">New</span>` after the year span. Setup discrepancy vs brief: the brief said 2 New chips, but the live page has exactly **1** — book years are 2017–2023, Rapport (2025, correctly no chip), Platform Decay (2026, chip). No series page reachable from /new has any `Upcoming` (>2026) chip — production data has no >2026 books there, so Upcoming can only be markup/code-verified, not runtime-rendered.

## Recorded browser pass

1. /series/the-murderbot-diaries desktop: amber "New" chip renders next to "Platform Decay (2026)"; no chip on Rapport (2025) or any other row (screenshot + zoom). Fail: chip missing, on wrong rows, or unstyled.
2. Mobile width (~528px CSS, <640 breakpoint): row with chip wraps sensibly, no horizontal overflow (scrollWidth <= innerWidth), chip visible (screenshot).
3. Print preview: printout book list shows "Platform Decay (2026)" WITHOUT the chip (print:hidden). Cancel.
4. Tracker interplay: click Platform Decay checkbox → progress label increments (0 of 11 → 1 of 11) and chip still renders; untick → back to 0 of 11. Fail: click swallowed by chip or label broken.
5. Axe (shell, Playwright + bypass_csp, axe-core 4.10.2) on /series/the-murderbot-diaries: expect zero violations (chip is amber-on-amber/10 — contrast rule must pass). Save /tmp/axe_results_r35.json.

Upcoming chip: ⚪ runtime-untestable (no >2026 book in production); report as such.
