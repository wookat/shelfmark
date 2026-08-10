# Shelfmark R113–R115 quick pass (worker e1fa7308, no recording per brief)

Code evidence: cache middleware src/index.ts:28-31 (skips /confirm, /unsubscribe, /shelf, and responses already carrying Cache-Control); only /random sets no-store (line 77). R115 card in /new HTML (data-subscribe, print:hidden, data-reveal).

1. Cache headers (curl GET, cache-busted, workers.dev + zalize.com):
   - GET / 200 → `Cache-Control: public, max-age=300, stale-while-revalidate=3600`. Fail if absent.
   - GET /shelf 200 → no such header. GET /search?q=x → must NOT have the public 5-min header (brief says stays no-store).
2. Axe 4.10.2 light+dark on /new and /unsubscribe?t=deadbeef (400 page): 0 violations each (4 runs). Raw → /tmp/axe_results_r115.json.
3. /new overflow at 375 and 320px: scrollWidth == innerWidth; "Get new releases by email" card visible (screenshot).
4. Card native validation (desktop Playwright): fill "bogus", click submit → validity.valid=false, native message shown, zero requests containing "subscribe" fired. Do NOT submit any real email.
5. R114 prod 500 page: skipped per explicit instruction.
