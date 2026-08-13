# Shelfmark Iteration 1b — re-verify Round-1 fixes (live)

1. /series/discworld: covers render, no broken-image icons; console check `[...document.images].filter(i=>i.complete&&!i.naturalWidth)` → failed imgs removed from DOM by new document error listener; no CSP violations (cloudflareinsights allowed).
2. Home: Prolific authors curated (series_count>=2, 10–400 books; no Randall Munroe 3260 / 0-series authors).
3. /shelf: migrated entry (Mistborn) shows no "1/1/1970" date.
4. Tab focus: amber :focus-visible ring visible on inputs/links/checkboxes; footer email input has aria-label.
