# R148: singular/plural regression + discovery sweep (production worker 34107574)

Deployed app.js verified to contain the fixes (L458, L660, L781, L783); goal flow = #goal-edit button → window.prompt → localStorage `shelfmark:goal:{year}` → reload. Fixtures: marsupilami = 1-book series (/book/111486-marsupilami), monk-and-robot = 2 books. Test on workers.dev, cache-busted, fresh contexts. No recording unless failure; screenshots.

## A. Plural fixes with exactly 1 ticked book (fresh context, tick 1 Mistborn book via UI)
1. /shelf stat card: PASS = "1" + label **"book read"** (broken = "books read"). Screenshot.
2. /year-in-books: PASS = stat "1" + **"book read in 2026"** (broken = "books read in"); busiest month label "**(1 book)**" not "(1 books)". Screenshot.
3. Download reading card PNG from /shelf: PASS = subline starts "book read · 1 series" (visual zoom of PNG; broken = "books read ·"). Screenshot of PNG.
4. /book page of 1-book series /book/111486-marsupilami: PASS = sibling heading "**All 1 book in Marsupilami**" (broken = "All 1 books"). Screenshot.

## B. Plural unchanged with 2+ books (tick 2nd book, same context)
5. /shelf: "2" + "books read"; /year-in-books: "2 books read in 2026", busiest "(2 books)". PASS = plurals intact.

## C. Discovery sweep
6. Goal flow on /year-in-books (or /shelf goal card): click "Set goal", prompt → enter 24. PASS = card shows "2026 reading goal: N of 24 books" + progressbar width = round(N/24*100)%; /year-in-books 4th stat shows "N%"+"of your 24-book goal". Edit goal → enter 2 (goal met with 2 books): PASS = 🎉 shown, 100%. Enter "" → goal removed ("Set goal" returns). Re-set goal, download PNG: PASS = subline includes "2026 goal N/24" (✓ if met). Screenshots. Also adversarial: enter "abc" and "0"; watch for breakage.
7. /book pages small series: marsupilami book page — does "Readers also enjoyed" / cover strip degrade gracefully with 0 siblings? monk-and-robot book page with 1 sibling. PASS = no empty-shell sections, no broken layout. Screenshots.
8. /pricing content sanity read-through at 1440 (typos, placeholder text, broken claims). Screenshot.
9. /year-in-books WITH data: dark mode 1440 + 375px light. PASS = no overflow (scrollWidth==innerWidth), consistent dark inversion, screenshots; axe light+dark = 0 violations.
10. Anything below polish bar encountered en route → record as P0/P1/P2 with repro + screenshot.
