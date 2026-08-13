# R167: hyphen-insensitive search (production worker f7b7cfc8)

Against https://shelfmark.wookat520.workers.dev. Code refs: src/index.ts /search route diff (commit d864fb7): primary series/authors/books queries add `REPLACE(col,'-',' ') LIKE ?2` with likeNorm = hyphens→spaces, ws-collapsed, 48-cap; token fallback extended to book titles (REPLACE'd) when series+authors fallback empty; close-match notice now also shown for book-only fallback hits.

## T1. New behavior
- `/search?q=three body problem`: Books section contains a row linking `/book/{id}-...three-body...` with title "The Three-Body Problem" (previously 0 results). Notice "No exact match" must NOT appear (primary-query hit, closeMatches=false).
- `/search?q=three-body`: still returns the same book row (raw ?1 path).
- Book-only fallback notice: a multi-token query with no series/author/book primary hit and no series/author token hit but with book token hits (e.g. `three body zzzqqq` — tokens "three"/"body"/"zzzqqq" ORed against REPLACE'd titles) → Books section non-empty AND notice "No exact match — showing close matches instead." visible.

## T2. Regressions
- `mistborn`: Series section contains Mistborn (link /series/mistborn).
- `discworld`: Series section contains Discworld.
- `"mistborn"` (quoted): still resolves (exact-match path, qm) — Mistborn present.
- `%25` (wildcard-only, R161 guard): empty-query prompt (no results header, "Type a series" style prompt), no 500.
- 60-char query: HTTP 200, no 500 (LIKE 48-cap).
- Multi-token nonsense `zzxqy wvupt kkjhg`: "Nothing found" state, HTTP 200.

## T3. Typeahead unaffected
- `/api/suggest?q=three body` and `q=mist`: 200, JSON shape unchanged; UI typeahead: type "mist" → listbox opens with options (regression only; suggest endpoint intentionally unchanged, so "three body" may return 0 — record, don't fail unless 500).

## T4. Sanity on results page
- `/search?q=three body problem` at 375px: scrollingElement.scrollWidth == 375; axe fresh light load → 0 violations. Screenshots: results page 1440 + 375.

Zero pageerrors everywhere.
