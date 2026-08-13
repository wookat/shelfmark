# Shelfmark Round 3 — Live Site Test Plan (PR #3, https://shelfmark.zalize.com)

Code refs: src/index.ts:269-276 (dup-ordinal fallback + blurb line), :236 ("Part of" chip), :242 (Sub-series section).
Note: the Erin Hunter Warriors parent is slug **/series/warriors-2**; /series/warriors is a different (Roland J. Green) series. Report as naming ambiguity.

## T1 Author bio (new)
- /authors/brandon-sanderson. Pass: intro paragraph begins "Brandon Sanderson is an American fantasy writer (born 1975)." followed by book/series counts.

## T2 Book blurbs + duplicate-ordinal fix + covers (new)
- /series/discworld. Pass: (a) numbering is sequential 1..N with NO duplicate "1." entries (previously three); (b) small gray description lines under titles (e.g. under "The Colour of Magic"); (c) Open Library cover thumbnails render inline without breaking row layout; no broken-image icons (zoom check).

## T3 Sub-series hierarchy (new)
- /series/warriors-2. Pass: "Sub-series within Warriors" card section incl. "Warriors: A Vision of Shadows"; click it → child page shows "Part of Warriors" chip; click chip → back to parent.

## T4 Regression: home + genres
- Home: Popular series cards sane (no obvious reference-work junk as #1). /genres loads with genre cards; click Fantasy → series list.

## T5 Regression: tracker + shelf
- /series/mistborn: previous ticks persist; tick/untick updates label. /shelf: standalone group "Brandon Sanderson — standalone" heading now links to /authors/brandon-sanderson (round-2 P1 fix) — click it, no 404.

## T6 Regression: mobile 375px
- Resize to 375px: home + /series/discworld (blurbs/covers) no horizontal overflow; Genres visible in mobile header (round-2 P2 fix).

## T7 Regression: sitemap (shell)
- curl /sitemap.xml → 200, lists chunks.

Report P0/P1/P2 with screenshots.
