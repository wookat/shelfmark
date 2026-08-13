# R155: discovery sweep (production worker 7ef8e2f0, no code delta)

Find-improvements round. Fresh contexts, cache-busted; screenshots as evidence; conservative P0/P1/P2 classification. Exclude known by-design items (letter placeholders, sticky-header capture band, 375 start-chip wrap).

## D1. /similar polish
- /similar/mistborn at 768 + 1024 light, 1440 dark: grid re-flow, chip/pill alignment, no overflow (measure), breadcrumb + heading copy sanity.
- Few-card cases: /similar/lonesome-dove-series (3 cards), /similar/les-rougon-macquart (2 cards): does a 2–3 card page feel broken/empty? Is there an onward CTA below the small grid? Copy still says "here are N more ..." correctly (singular/plural, grammar)?

## D2. /press, /popular, /pricing
- Each at 768 light and 1440 dark: layout, contrast, copy nits (read intros fully), no overflow. Press kit links work (download/assets present?).

## D3. /year-in-books + /saved share loop
- Empty (fresh context) /year-in-books: is the empty state helpful (clear CTA to start tracking)? Screenshot.
- With 2 ticked books: stats render; Share list from /shelf → copy /saved#fragment link → open in second fresh context → import → books appear. Judge friction/copy. Screenshots at each step.

## D4. /new?genre= + RSS
- /new?genre=fantasy: filtered list plausible (all fantasy), h1/copy reflects filter, genre select state preserved; RSS link href includes genre; /new.rss?genre=fantasy valid XML, items match filter (spot 3), absolute links.
- Bad genre /new?genre=zzz: graceful (empty state or all), no error page.

## D5. 404 + /random
- /zzz-bad 404: visual quality at 1440 light + dark (heading, CTA, layout centered?).
- /random ×3: each 302 to a series page; destination quality — any obviously broken/empty series (0-book, missing author)?

## D6. New lists at 768 dark
- /lists/duologies + /lists/long-running-mystery-series at 768 dark: card grid, contrast, progress bars visible, no overflow. Screenshots.

## D7. Free-form
Note anything below big-tech polish: spacing, truncation, awkward wrap, contrast, copy tone. Include the known "canon of Hercule Poirot" only as already-reported.

Output: prioritized P0/P1/P2 list with page, repro, screenshot, suggested direction.
