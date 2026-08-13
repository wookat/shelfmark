# R149: search quote-normalization regression (production worker d36376b1)

Delta: /search, /api/suggest, /api/opensearch-suggest map ‘’→' and strip "“”«» before LIKE. Old behavior: quoted `"mistborn"` → 0 results. /api/suggest has max-age=3600 → always add cache-buster params. Test on workers.dev.

## A. /search variants (browser, 1440)
For each query, load /search?q=… and PASS iff results contain the expected entry AND h1 shows the RAW typed query:
1. `"mistborn"` (straight double quotes) → Mistborn series in results; h1 contains `"mistborn"` as typed. (Broken = "No results".)
2. `“mistborn”` (curly double quotes) → same.
3. `ender’s game` (curly apostrophe) → Ender's Game series/book rows. (Broken = 0 results since D1 stores straight '.)
4. `Ender's Game` (straight, control) → same results as 3 (result sets should match).
5. `mistborn` (unquoted control) → Mistborn series.
Screenshots for 1–3.

## B. Suggest APIs (curl, cache-busted)
6. /api/suggest?q=%22mistborn%22 → JSON with Mistborn series entry (broken = {"results":[]}).
7. /api/suggest?q=ender%E2%80%99s → JSON containing "Ender's Game" entries; compare with q=ender's — same labels.
8. /api/opensearch-suggest?q=%E2%80%9Cmistb → 4-element JSON array with non-empty completions array.

## C. Regression (curl)
9. /search?q=%25 and /search?q=_ and /search?q=mist%25born → all HTTP 200, no 500.
10. /search?q=("x"*49) and ("x"*100) → 200 (R146 fix intact); /api/suggest?q=("x"*55) → 200 JSON.
11. Short control /api/suggest?q=mistborn → unchanged series+book entries with /book/ hrefs.

## D. 375px typeahead UX (browser)
12. 375px viewport, type `ender’s` (curly) into the below-header search input: PASS = listbox opens with Ender's Game suggestion(s), no overflow (scrollWidth==375), screenshot; Enter/click navigates to the suggestion target.
