# Shelfmark Round 2 — Live Site Test Plan (PR #2, https://shelfmark.zalize.com)

Code refs: src/index.ts:189 (Standalone books section), :265 (cover img with onerror=this.remove()).
Cover-dense pages found via seed.sql: /series/lecture-notes-in-computer-science (343 covers), /series/d-couvertes-gallimard (127).

## T1 Home (regression + curation)
- Load /. Pass: hero + search render; "Genres" link in nav/footer; Popular series is curated fiction (e.g. Animorphs, James Bond, Discworld-style) and does NOT contain xkcd or "Lecture Notes in Computer Science".

## T2 Genres (new)
- Click nav "Genres" → /genres index shows genre cards incl. Fantasy. Click Fantasy → /genres/fantasy lists series (e.g. Discworld, Xanth, The Witcher) linking to series pages.

## T3 Author standalone section (new)
- /authors/brandon-sanderson: "Standalone books" section exists with checkboxes. Tick 1 standalone book → progress indicator updates; reload → tick persists (localStorage).

## T4 Series tracker regression
- /series/mistborn: previous 2 ticks may persist (same browser) or re-tick; ticking updates "N of M read" label; persists after reload.

## T5 Covers (new)
- /series/lecture-notes-in-computer-science: multiple small cover thumbnails (38x57) visible next to titles; rows without covers align fine; no broken-image icons anywhere (onerror removes). Check visually at zoom.

## T6 /shelf regression
- Shows ticked books incl. new standalone book grouped correctly.

## T7 Mobile 375px (incl. genres)
- Resize to 375px: home, /genres/fantasy, and a covers series page readable, no horizontal overflow, checkboxes usable.

## T8 /confirm invalid token (new)
- Visit /confirm?t=zzz. Pass: HTTP 400 (curl) and styled "Link invalid" page in browser.

## T9 Sitemap chunks (shell)
- /sitemap.xml lists exactly sitemaps/1..6.xml; each returns 200 valid urlset (spot-check 1 and 6).

## T10 404 regression
- /series/nonexistent-slug → styled 404.

Note P0/P1/P2 UX issues with screenshots.
