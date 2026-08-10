# Shelfmark Rounds 71–75 — author FAQ, search avatars, yearly reading goal, reading-card goal subline (deploy 419a600b, PR #12)

Shell pre-check facts (live, workers.dev + cache-bust): R71 sanderson has "Brandon Sanderson FAQ" h2 + 3 dt (how many books / most recent "Moment Zero" (2025) / longest series Mistborn 8 books 2006–2022) and FAQPage JSON-LD with matching Q&As. Degrade: janci-patterson FAQ has only 1 Q (how many books) — no longest-series Q. randall-munroe has 3 Qs (has series). R72: /search?q=sanderson Authors card uses shared 48px avatar img. R73/74 are client-side (app.js: `prompt("How many books do you want to read in " + year)`, localStorage `shelfmark:goal:<year>`, "Set goal"/"Edit goal", "reading goal:", card subline "books read · "). Existing tracked state: Mistborn 6/8 (+ possibly others).

## Recorded browser pass

1. R71: /authors/brandon-sanderson (hard-reload first) — visible "Brandon Sanderson FAQ" section with the 3 exact Q&As above. Fail: section missing, wrong counts/titles.
2. R72: /search?q=sanderson — Authors section card shows Brandon Sanderson with round Commons photo avatar; layout intact. Fail: broken img/no avatar.
3. R73 set: /shelf — goal card under stats grid shows Set-goal state; click "Set goal" → browser prompt → type 12 → OK → page reloads showing "2026 reading goal: X of 12 books" (X = current-year read count) + amber progress bar with role=progressbar (aria-valuenow=X, aria-valuemax=12). localStorage `shelfmark:goal:2026` = 12. Fail: no prompt, no goal line/bar, wrong numbers.
4. R74: with goal set, click "Download my reading card" → downloaded PNG subline reads "… books read · N series · 2026 goal X/12". Fail: subline lacks goal segment.
5. R73 edit/clear: click "Edit goal" → prompt shows; enter 0 (or empty) → card returns to Set-goal state, localStorage key removed. Fail: goal persists.
6. Regression tracker: /series/mistborn tick The Lost Metal → 7/8 (88%); untick → restore 6/8 (75%).

## Shell checks

7. R71 JSON-LD: FAQPage mainEntity texts match visible dt/dd (captured). Degrade case janci-patterson: only 1 Q, no longest-series Q (captured).
8. Regression: security headers on / unchanged (HSTS, CSP incl. wikimedia img-src, Permissions-Policy, XFO DENY, nosniff, referrer).
9. Axe (Playwright bypass_csp, axe-core 4.10.2): /authors/brandon-sanderson and /shelf (with goal card visible — seed localStorage goal in the axe context before scan) → 0 violations. Save /tmp/axe_results_r75.json.

Cleanup: clear goal key, restore tracker to 6/8.
Report → /home/ubuntu/repos/shelfmark/test-report-iter75.md
