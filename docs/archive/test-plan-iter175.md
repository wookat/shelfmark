# R175: genre aliases + related-genres row + M. C. Beaton + stub suppression + casing (worker 0ccc474b, PR #49)

Against https://shelfmark.zalize.com per brief, cache-busted (`?cb=`). Code refs: src/index.ts L1215-1238 GENRE_SLUG_REDIRECTS, L1241-1248 GENRE_CLUSTERS, L1250-1253 301 redirect, L1272-1278 Related-genres row.

## T1. Genre aliases (no-redirect HTTP probes)
- Each of /genres/{mystery,mysteries,crime,detective,horror,sci-fi,scifi,ya,young-adult,children,childrens,kids} → 301 with Location /genres/{expected canonical}; following redirect → 200 correct h1.

## T2. Related-genres row
- /genres/mystery-fiction: "Related genres:" row with pills exactly {Crime Fiction, Detective Fiction, Thriller, Spy Fiction, Psychological Thriller}; one pill click navigates.
- /genres/fantasy, /genres/science-fiction, /genres/horror-fiction, /genres/romance-novel, /genres/children-s-literature: row present, pills subset of cluster minus self, all hrefs resolve (record lists).
- /genres/western (non-cluster): NO "Related genres:" text.
- 375px on mystery-fiction: scrollingElement.scrollWidth == 375; pills wrap; screenshot.

## T3. Pen-name rename
- /authors/marion-chesney → 301 → /authors/m-c-beaton 200; h1 "M. C. Beaton Books in Order"; bio contains "Pen name of Marion Chesney" + "(1936–2019)".
- /series/agatha-raisin: breadcrumb + "More by" pill + byline + FAQ say "M. C. Beaton"; zero "Marion Chesney" outside the pen-name explainer (record all occurrences).
- Genre card on /genres/mystery-fiction shows M. C. Beaton; /book/147475-agatha-raisin-and-the-quiche-of-death byline + author card M. C. Beaton.

## T4. Stub suppression
- /series/agatha-raisin book rows: zero "novel by" stub lines (was ×8).
- /series/the-hitchhikers-guide-to-the-galaxy: rows 1–5 have NO "novel by Douglas Adams" stub; row 6 STILL shows the Eoin Colfer stub (different author kept). Record actual per-row lines.
- Control: a multi-author or description-rich series page (e.g. /series/mistborn) — book descriptions unaffected (record rows).

## T5. Casing
- /genres index: label "Comics of the United States" (lowercase of/the); scan all labels for mid-title capitalized articles/preps (Of/The/And/In/A) — report any leftovers.

## T6. Regression + hygiene
- UI: tick book 1 on /series/agatha-raisin → progress "1 of 8 read", Up next badge appears.
- axe fresh light+dark on /genres/mystery-fiction and /authors/m-c-beaton → 0 violations each.
- Zero pageerrors on all probed pages. Screenshots: related-row, beaton author page, agatha series, hitchhiker rows, genres index.
