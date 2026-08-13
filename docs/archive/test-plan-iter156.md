# R156: regression of R155 P2 fixes (production worker de2b520d)

Against https://shelfmark.wookat520.workers.dev, cache-busted, fresh contexts. Screenshots as evidence. Code refs: src/index.ts L1216 (unknown-genre note), L1231 (noindex = activeGenre || unknownGenre — valid genre noindex is BY DESIGN), L932-938 GENRE_LABELS, /similar L224+ pill row when <6 cards, notFound pill row.

## T1. Generic 404 pill row
- /zzz-bad-route: 404 status; main shows "Page not found", "Try searching…", AND a centered 4-pill row (Popular series / Reading lists / All series A–Z / Browse by genre). Visual at 1440 light + dark; 375px zero overflow. Click "Popular series" → /popular. axe light+dark 0 violations.

## T2. /new unknown genre
- /new?genre=zzz: visible note "No new releases under that genre — showing all." above the chips; "All" chip active; meta robots = "noindex,follow". Screenshot.
- Control /new (no param): NO robots meta, no note.

## T3. /new valid genre regression
- /new?genre=fantasy: fantasy chip active, RSS link "/new.rss?genre=fantasy", results filtered (1 fantasy item), note NOT shown; robots noindex,follow (by design L1231).

## T4. Genre chip labels
- /new chips visually show "sports (spokon)", "comedy (anime & manga)", "business" (not "Business Literature"), no raw "Spokon". Screenshot zoom. (CSS capitalize renders them Title Case — acceptable per brief.)

## T5. /similar pill row
- /similar/les-rougon-macquart (2 cards): 4-pill onward row after the grid — visual screenshot; click "Reading lists" → /lists.
- /similar/mistborn (18 cards): NO onward pill row after grid (only the pre-existing top pills).

## T6. axe + mobile
- axe light+dark on /new and 404: 0 violations. 375px: /new?genre=zzz and 404 zero horizontal overflow.

Pass = exact values above; deviations reported as failures.
