# Shelfmark Rounds 29–30 — RSS feed + Copy list (deploy df0aef7a, PR #8 branch)

Code refs: src/index.ts adds GET /new.rss (RSS 2.0, application/rss+xml, max-age=3600, items link to /series/<slug>) and "RSS feed" link in /new intro; src/html.ts adds `<link rel="alternate" type="application/rss+xml">` when rss opt set. Served app.js: `[data-copylist]` click → builds "<name> — reading order" + blank + "1. <title>"… + blank + "via <origin>/series/<slug>" from `ol[data-series]` inputs, `navigator.clipboard.writeText`, button text → "Copied ✓" for 2s. Button in served /series/discworld HTML has `print:hidden`.

Already shell-verified live: /new.rss → 200, content-type application/rss+xml, valid XML, 31 items, first item links /series/yona-of-the-dawn; /new HTML contains "RSS feed" link + autodiscovery tag.

## Recorded browser pass

1. /new: "RSS feed" link visibly rendered in the intro paragraph (screenshot). Console: head contains link[rel=alternate][type="application/rss+xml"] with href ending /new.rss. Click the RSS feed link → browser shows the XML/feed at /new.rss (URL bar = /new.rss). Fail: link missing, 404, or HTML page instead of feed.
2. /series/discworld: "Copy list" pill renders in pill row next to Share/Print list (screenshot). Click it → button text flips to "Copied ✓" (screenshot within 2s) and reverts to "Copy list" after ~2s. Read clipboard via console `navigator.clipboard.readText()`: line 1 = "Discworld — reading order", line 2 empty, line 3 = "1. The Light Fantastic", line 4 = "2. Mort", numbered lines count = 55 matching page order, last line = "via https://shelfmark.zalize.com/series/discworld". Fail: no feedback, wrong header/order/count/URL.
3. Print-hidden: confirm the Copy list button element has class `print:hidden` (console) — quick check, no full preview needed (R28 already proved print preview).
4. Regression: tick Equal Rites → "2 of 55 read (4%)", reload page → tick persists, then untick → back to 1/55. Header typeahead: type "disc" → dropdown with Discworld first, Escape/clear. /shelf → stats 10/3/7/Mistborn with Up next slots.
5. Axe (shell, Playwright + bypass_csp + add_script_tag, axe-core 4.10.2) on /series/discworld and /new: expect zero violations. Save raw output /tmp/axe_results_r30.json.
