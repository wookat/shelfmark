# Shelfmark Rounds 36–38 — suggest book entries, series ordering, genre chips (deploy 7d993d3a, PR #9)

Shell-verified setup facts (grounding):
- /api/suggest?q=platform%20dec → [{label "Platform Decay", href "/series/the-murderbot-diaries", kind "book"}]; q=mistborn → 1 series + 3 book entries; q=disc → series first then book entries, ≤8 total. app.js:177 renders `label + <span class="text-ink-700/75 text-xs">kind</span>` in the dropdown.
- /series page 1 contains Kuroko's Basketball / One Piece / Star Trek / Nancy Drew / Goosebumps; no xkcd/LNCS matches; copy "best-documented first. Page 1 of 44." Letter D view starts d'Artagnan Romances, D.C. Detectives… (alphabetical).
- Genre chips: /series/mistborn → `<a href="/genres/fantasy" class="…capitalize">fantasy</a>`; /series/the-murderbot-diaries → science fiction chip; /series/xkcd has 0 /genres/ links (no-genre example).

## Recorded browser pass

1. R36 typeahead: header search, type "platform dec" → dropdown shows "Platform Decay" with small "book" kind label; ArrowDown highlights it (bg-ink-100), Enter → /series/the-murderbot-diaries. Fail: no book entry, missing kind label, or wrong destination.
2. R36 mixed: type "mistborn" → dropdown shows Mistborn (series) first then "Mistborn: …" book entries with book labels; click the series entry → /series/mistborn. Fail: books missing or ordering wrong.
3. R38 genre chip: on /series/mistborn the pill row includes a capitalized "fantasy" chip; click → /genres/fantasy. Then /series/the-murderbot-diaries shows "science fiction" chip → /genres/science-fiction. /series/xkcd shows NO genre chip. Fail: chip absent, lowercase-unstyled, wrong link, or chip present on xkcd.
4. R37 ordering: /series (All) page 1 top cards are documented fiction (expect Kuroko's Basketball / One Piece / Star Trek etc.), no xkcd or Lecture Notes in Computer Science at top; copy says "best-documented first". Click page 2 link → different series, position continues. ?letter=D → alphabetical (d'Artagnan Romances first). Fail: junk series at top of All view or letter view not alphabetical.
5. Mobile spot-check (~508px CSS window): /series/mistborn pill row (Share/Print/Copy + fantasy chip) wraps with no horizontal overflow (scrollWidth ≤ innerWidth). Screenshot.
6. Regression: tick first unread Mistborn book → progress label/bar updates (6 of 8 → 7 of 8 with seeded state); untick → restored.
7. Axe (shell, Playwright + bypass_csp, axe-core 4.10.2) on /series and /series/mistborn: expect 0 violations each. Save /tmp/axe_results_r38.json.
