# R146: R145-fixes regression (production worker 1496e332)

Test via workers.dev origin / cache-busted URLs. No recording unless failure; screenshots suffice.

## 1. Long-search 500 fix (was: ≥49 chars → 500; SQLite 50-char LIKE limit, now capped at 48)
- curl /search?q= with 48, 49, 67, 100-char junk ("x"*N): PASS = all HTTP 200 (previously 49+ → 500).
- Browser: /search?q="The Girl Who Circumnavigated Fairyland in a Ship of Her Own Making" (67 chars): PASS = 200, results page contains that book title as a link (screenshot shows it), NOT the "Something went wrong" page.
- /api/suggest?q=("x"*55) and /api/opensearch-suggest?q=("x"*55): PASS = 200, Content-Type JSON, body parses as JSON ({"results":[...]} / 4-element array), not HTML.
- Control: /api/suggest?q=mistborn still returns book entries with /book/{id}-{slug} hrefs; UI typeahead shows suggestions for "mistborn".

## 2. Escape typeahead fix (was: native clear wiped text)
- Browser 1440: type "mist" in visible header search → listbox open (aria-expanded=true). Press Escape once: PASS = listbox closed (aria-expanded=false, box hidden) AND input value still "mist" (screenshot). 
- Press Escape a second time (box already closed): PASS = handler branch skipped → native behavior may clear the input (value "" acceptable, browser-native); no JS error.

## 3. No-JS /shelf (re-verify on this worker)
- JS-off context /shelf: PASS = "Loading your shelf…" not visible (display:none), explanation card + /series link visible (screenshot).
- JS-on /shelf with 1 ticked book: PASS = loading replaced by stats/section, no explanation card visible.

## 4. Spot checks
- axe light+dark on /search?q=(67-char title) results page: PASS = 0 violations.
- 375px on same long-query results page: PASS = scrollWidth==375, no overflow (screenshot).
