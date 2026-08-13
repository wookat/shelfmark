# R180 QA fixes + R181 compare pills (worker 29881d39, PR #55)

Against https://shelfmark.zalize.com, cache-busted. Code refs: commits df24d52 (firstBook series-page ordering + sr-only th + 404-before-redirect, src/index.ts L322-372) and 5290ec0 (compareLinks pill row inside the print:hidden "If you like…" section, L1043-1082).

## T1. R180 fix (a): Start-with consistency
- /compare/discworld-vs-xanth "Start with" col A == "The Light Fantastic (1986)", href == /book/147536-the-light-fantastic (same as series-page row 1 / Start-here chip). Xanth still "A Spell for Chameleon (1977)".
- Re-cross-check Start-with vs series page row 1 for 3 random pairs from /compare (all must match now).

## T2. R180 fix (b): axe
- Fresh axe light+dark on /compare/discworld-vs-xanth → 0 violations (empty-table-header gone); first th has scope="col" + sr-only "Statistic".

## T3. R180 fix (c): canonicalization
- /compare/not-a-slug-vs-also-nope → **404** directly (no 301).
- /compare/xanth-vs-discworld (real pair reversed) → still **301** to /compare/discworld-vs-xanth.
- /compare/garbage 404; a-vs-a 404 (regression).

## T4. R181 pill row
- /series/xanth and /series/discworld: "Can't decide?" row inside the "If you like…" section with exactly 3 pills, labels "{series} vs {other}", hrefs canonical alphabetical (a<b), each GET → 200 with NO redirect (status 200 on direct no-redirect probe).
- /series/mistborn: no "Can't decide?" text (fantasy top-8 by book_count — mistborn 8 books, expect out of top-8; verify against /compare fantasy section membership).
- Print emulation on /series/xanth: pill row hidden (display none via print:hidden section).
- 375px /series/xanth: scrollWidth==375, pills wrap (screenshot).
- Fresh axe light+dark on /series/xanth → 0 violations.
- Click one pill in UI → lands on compare page (h1 verified). Zero pageerrors everywhere.
