# Shelfmark R118–120 — curated /lists + year-span chip (worker 2685984c, PR #18, commit ae858a5)

Code evidence: src/index.ts — CURATED_LISTS + app.get("/lists") and app.get("/lists/:slug") (unknown slug → 404 via notFound); homepage Popular header gains "Lists →" link; footer "Reading lists"; sitemap urls include /lists + 4 slugs; llms.txt line; yearsSpan() at line 52 (chip iff first_year set; "first–last" iff they differ) rendered in series chip row at line 596 between book-count and genre chips.

## Recorded browser flow (desktop, main profile for navigation only; incognito for tracker)
1. Home: Popular series header shows "Lists →"; click → lands on /lists with h1 "Reading lists" and 4 cards (Trilogies…, Long-running epics, New series of the 2020s, Classic series). Fail: link missing or ≠4 cards.
2. Click "Classic series" card → /lists/classic-series renders breadcrumb Home / Lists / Classic series, series cards (≤60, each linking /series/{slug}), "More lists:" cross-links. Fail: empty grid or broken layout.
3. Click a series card from the list → series page loads; chip row shows year-span chip (e.g. "2006–2022" style) between "N books" and genre chips. Then visit /series/mistborn: chip exactly "2006–2022". Fail: chip absent or misplaced.
4. Regression (incognito): /series/mistborn tick book 1 → "1 of 8 read (13%)" + progress bar fills; reload → persists; untick → 0. Do not touch main profile.
5. Footer on home: "Reading lists" link present → /lists.

## Shell/Playwright checks
6. Unknown slug: GET /lists/nope → 404 styled page.
7. Cache header: /lists and /lists/trilogies 200 with `public, max-age=300, stale-while-revalidate=3600`.
8. JSON-LD on /lists/trilogies parses: BreadcrumbList (Home/Lists/Trilogies…) + ItemList with itemListElement urls → /series/*.
9. sitemaps/1.xml contains /lists and all 4 list slugs; llms.txt lists /lists.
10. Axe 4.10.2 light+dark on /lists and /lists/trilogies: 0 violations (4 runs) → /tmp/axe_results_r120.json.
11. Overflow: /lists, /lists/trilogies, /series/mistborn at 375px and 320px: scrollWidth == innerWidth (chip row wraps cleanly, screenshots).
12. Negative chip: find a series with no year data on /series listing (no year text in card meta) → its series page chip row has NO year chip in served HTML.

No emails; no real subscribe. Restore nothing (incognito only).
