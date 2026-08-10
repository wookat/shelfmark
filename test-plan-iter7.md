# Shelfmark Rounds 6b+7 — Discworld FAQ fix + homepage "New & upcoming" (deploy 04d831eb, PR #6)

Code refs: commit b3fd6bb (dup-position year sort applied before FAQ generation — orderedBooks); commit cf5883d src/index.ts homepage: `fresh` query (b.year in [thisYear, thisYear+1], s.author_id NOT NULL, book_count 2–80, genre NOT NULL and not comic strip/webcomic, s.first_year < b.year, LIMIT 6) and section markup — h2 "New & upcoming" with "All new releases →" link to /new, ul of 6 li cards linking to /series/{slug}, cover img or initial-letter placeholder, title (year) + series · author line, placed between "Popular series" and "Prolific authors" sections.

1. Round 6b fix re-verify (visual): /series/discworld FAQ first card must read "The series starts with “The Light Fantastic” (1986)" — matching list row #1. Fail: still "Mort" or any mismatch vs row #1.
2. Homepage section: on /, between "Popular series" grid and "Prolific authors" heading, a "New & upcoming" h2 with "All new releases →" link and exactly 6 cards. Each card shows a real series installment (title with 2026/2027 year, series name · author). Fail: section missing, wrong placement, >6/0 cards, or dataset noise (e.g. "Singapore as Model...", Safety Spotters/AI Study Guides bulk, xkcd) — judge: entries should look like genuine fiction/series releases; note noise explicitly.
3. Card navigation: click one card → lands on the matching /series/{slug} page whose book list contains the card's book title. Fail: 404 or wrong series.
4. "All new releases →" click → /new renders.
5. Covers/placeholders: cards render either a cover image (naturalWidth>0) or an initial-letter tile; no broken/blank 38x57 area.
6. Mobile ~375px: homepage incl. New & upcoming stacks single-column, scrollWidth <= innerWidth.
7. Smoke (regression): tick an unticked book on /series/mistborn → count increments (from "4 of 8 read (50%)" to "5 of 8 read (63%)"), persists after F5.
