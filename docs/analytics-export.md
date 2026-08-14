# Analytics export — last 30 days (generated 2026-08-14, UTC)

Aggregate-only export for the round-6 retention-funnel audit. No PII is collected or
exported: Shelfmark's first-party analytics store only `(day, path, count)`,
`(day, term, results, count)`, and `(day, referrer_host, count)` aggregates in D1.
There are **no visitor identifiers, cookies, or sessions by design** (reading progress
lives in the visitor's own localStorage), so a true per-visitor
first-visit → activation → return funnel cannot be computed. The proxies below are the
honest best available; GSC/Bing Webmaster (pending boss action, see round-5 report)
would add real impression/click data.

## Funnel proxies (page-hit aggregates)

| Stage | Proxy | 30-day total |
|---|---|---|
| Arrival | all tracked page hits | 4,682 |
| Discovery | `/series/*` page hits | 677 |
| Activation/return | `/shelf` hits (only meaningful after a book is tracked) | 174 |
| Search engagement | `/search*` hits | 89 |

## Daily breakdown

| day | hits | series_hits | shelf_hits | home_hits | search_hits |
|---|---|---|---|---|---|
| 2026-08-05 | 52 | 20 | 5 | 6 | 5 |
| 2026-08-06 | 414 | 114 | 74 | 58 | 27 |
| 2026-08-07 | 214 | 47 | 8 | 83 | 0 |
| 2026-08-08 | 153 | 48 | 18 | 33 | 2 |
| 2026-08-09 | 497 | 88 | 32 | 25 | 9 |
| 2026-08-10 | 984 | 190 | 35 | 23 | 44 |
| 2026-08-11 | 1 | 1 | 0 | 0 | 0 |
| 2026-08-12 | 1 | 0 | 0 | 0 | 0 |
| 2026-08-13 | 2,043 | 138 | 2 | 9 | 2 |
| 2026-08-14 | 323 | 31 | 0 | 0 | 0 |

## Referrers (30 days)

| host | hits |
|---|---|
| google.com | 3 |

## Search (30 days)

- 79 distinct terms, 163 searches, 42 zero-result searches.

## Caveats (must-read for the funnel audit)

- **QA traffic dominates.** Nearly all hits above are our own QA/testing-agent runs
  (per the standing rule, QA traffic must not be counted as business results). The
  bursts on 08-06/08-09/08-10/08-13 line up with QA regression runs; organic referrers
  remain google.com ×3 for the whole window.
- **No visitor-level funnel is possible** without adding identifiers, which would
  contradict the product's no-account, no-cookie privacy position. If the round-6
  audit needs cohort retention, the compliant option is GSC/Bing click data plus
  privacy-preserving aggregate counters (e.g. a `first_tick`/`return_visit` beacon
  counting events, still without IDs) — flag for discussion before implementing.
