# R154: three new curated lists (production worker 7ef8e2f0)

Against https://shelfmark.wookat520.workers.dev, cache-busted, retry once on flapping. Screenshots as evidence.

## T1. New list pages render with criteria-matching entries
- /lists/duologies: h1/title present; 60 cards (LIMIT 60); EVERY card subtitle says "2 books" (assert count of "2 books" == card count). Screenshot.
- /lists/big-fantasy-series: all card book counts >= 5 (probe min); intro mentions fantasy. Screenshot.
- /lists/long-running-mystery-series: ~29 cards, all counts >= 10. Screenshot.
- Each page: JSON-LD ItemList present, itemListElement count == card count, all /series/ URLs.
- Each page: "More lists" cross-links = the 6 OTHER list slugs (not self).

## T2. /lists index
- Exactly 7 cards: trilogies, duologies, long-running-epics, big-fantasy-series, long-running-mystery-series, new-series-of-the-2020s, classic-series. Screenshot. Meta description mentions the new lists.

## T3. SEO plumbing
- sitemaps/1.xml contains the 3 new /lists URLs (verified in setup; re-assert). llms.txt lists line mentions duologies / big fantasy / long-running mysteries.

## T4. a11y + mobile
- axe light+dark on /lists and /lists/duologies: 0 violations (4 runs).
- 375px /lists/duologies: zero horizontal overflow; screenshot.

## T5. Duology spot-check
- Click first card on /lists/duologies → series page shows "2 books" chip and exactly 2 book list items. Screenshot.

Pass = concrete values above; deviations reported as failures.
